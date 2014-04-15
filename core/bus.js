var Q = require('when'),
  _ = require('lodash'),
  co = require('co'),
  util = require('./util')
/**
 * Create a bus instance.
 * Notice the structure of 'events' object will be like this:
 * {
 *  "{namespace}" : {
 *      "listeners" : [{
 *        "name" : "{function name or alias}",
 *        "module" : "{module name}"
 *      }],
 *      "children" : {
 *        "str" : {
 *          "{child namespace}" : {
 *            "name" : "{module name}.{function name or alias}",
 *          }
 *        },
 *        "reg" : {
 *          "{regular expression}":{
 *            "name" : "{module name}.{function name or alias}",
 *          }
 *        }
 *      }
 *    }
 * }
 * @constructor
 * @param {object} opt - options
 */
function bus(opt, debug){
  this.opt = defaults( opt||{},{
    nsSplit : '.', //namespace split
    varSign : ':', //variable sign
    varSplit : '/',
    mutRex : /^!/,
    tarRex : /^@/
  })
  this._debug = debug && false

  //variables start with `_` means private data, which can only be visit inside bus
  this._mute = {}
  //`$$result` and `$$mute` is for runtime use
  this._data = {$$result : {},$$mute:{}}
  this._events = {listeners:[],children:{"str":{},"reg":{}}}
  this._module = 'global'

  this._debugListener = {name : 'global',stack:[],module:'global'}
  this._debugListenerRef = this._debugListener

}

bus.prototype.beginDebug = function(){
  this._debug = true
}

bus.prototype.endDebug = function(){
  this._debug = false
}

/**
 * data key start with `$$` will be shared
 * @returns {bus}
 */
bus.prototype.clone = function(){
  var root = this,
    newBus = new bus
  //clone all private data
  _.without(Object.keys(this),'_data').forEach(function( key ){
    if( root.hasOwnProperty(key) ){
      newBus[key] = _.cloneDeep(root[key])
    }
  })

  newBus._data = _.transform( root._data,function(result, v ,k){
    result[k] = /^\$\$/.test(k) ? v : _.cloneDeep(v)
  })

  //setup debug reference right
  newBus._debugListenerRef = newBus._debugListener

  return newBus
}

/**
 * this will return a lite object which have all the references of origin bus's properties.
 */
bus.prototype.cloneLite = function(){
  var busLite = {}
  busLite.__proto__ = bus.prototype
//  _.assign( busLite, this )
  for( var i in this ){
    if( this.hasOwnProperty(i)){
      busLite[i] = this[i]
    }
  }
  return busLite
}

bus.prototype.getEvents = function(){
  return this._events
}

bus.prototype.startDebug = function(){

}

/**
 * basically you can use `clone` to get a new bus on every condition.
 * this method was use to recollect the bus, use less memory
 */
bus.prototype.reset  = function(){
  console.log("calling start")
  var root = this
  //runtime mute and result must be clear every time
  var runtimeKey = ["$$result","$$mute"]

  //data of name started with `$$` will not be clear except for `$$result` and `$$mute`
  for( var i in root._data ){
    if( !/^\$\$/.test( i) ){
      delete root._data[i]
    }
  }

  //deal with system runtime data
  runtimeKey.forEach(function(k){
    root._data[k] = {}
  })


  //set reference back
  root._debugListenerRef = root._debugListener
}


/**
 * Set or get current module name
 */
bus.prototype.module = function( name ){
  return name ? (this._module=name) : this._module
}

//don't use it internally, because it will record in debug stack
bus.prototype.data = function(name,data){
  if( !data ) return this._data[name]

  if( this._debug ){
    if( !this._debugListenerRef.data )
      this._debugListenerRef.data = {}

    this._debugListenerRef.data[name] = data
  }


  this._data[name]=data
  return this
}

bus.prototype.extendData = function( name,data){

  _.assign( this._data[name],  data )
  return this
}

bus.prototype.getResult = function( eventOrg ){
  return eventOrg ? this._data.$$result[eventOrg] : this._data.$$result
}

bus.prototype.debugInfo = function(){
  return this._debugListener
}

/**
 * Attach a event to the bus
 * @param {string} eventOrg - original event name with namespace. "" match root.
 * @param {mix} listener - listener can be both function or array
 */
bus.prototype.on = function( eventOrg, listener,opt ){
  var eventRef = this._events,
    eventNs = eventOrg.split(this.opt.nsSplit),
    n,
    root = this,
    cache = []

  if( eventOrg !== "" ){
    while( n = eventNs.shift() ){
      var type= n.indexOf(root.opt.varSign)==-1?"str":"reg"

      type=="reg" && (n=n.replace(/(^|\/):\w+(\/|$)/g,"$1(.*)$2"))

      eventRef.children[type][n]||
        (eventRef.children[type][n] = {listeners:[],children:{"str":{},"reg":{}}})

      eventRef = eventRef.children[type][n]
      cache.push(n)
    }
  }

  //standardize the listen data structure
  listener = this.standardListener( listener,opt)

  //deal with mute opt
  opt && opt.mute && root.addMute(opt.mute,listener)

  //deal with order
  var place = findPlace(listener,eventRef.listeners,cache.join(root.opt.nsSplit))


  eventRef.listeners = eventRef.listeners.slice(0,place).concat(
    listener, eventRef.listeners.slice(place) )

}

//TODO we may have multiple bus here now,
//they shouldn't share cache
var findPlace =(function( ){
  var firstLastCache = {}
  return function(listener, listeners, cacheIndex ){
    var firstLast = firstLastCache[cacheIndex] || findIndex(listeners,function(e){
        return e.last == true
      })
    if( cacheIndex ){
        if( firstLast ==-1 && listener.last ){
          firstLastCache[cacheIndex] = listeners.length
        }else if( firstLast != -1&& !listener.last ){
          firstLastCache[cacheIndex] = firstLast+1
        }
    }

    return listener.first ? 0 :
      listener.before ? findIndex(listeners,function(e){return e.name==listener.before}):
      listener.after ? findIndex(listeners,function(e){return e.name==listener.before})+1:
      listener.last ? listeners.length:
      (firstLast == -1?listeners.length:firstLast)
  }
})()

function getTargetStack( eventNs, stack ){
  var n
  while( n = eventNs.shift()){
    stack = stack.reduce(function( init, b){
      var args = b.arguments,ns = b.namespace? b.namespace.split('.') : []

      if( b.children.str[n] )
        init.push( mix({"arguments":args,"namespace": ns.concat(n).join('.')}, b.children.str[n] ) )

      if( Object.keys(b.children.reg).length){
        forEach( b.children.reg, function(child,regStr){
          var reg = new RegExp( regStr),
            matches = n.match(reg)

          if( matches) {
            init.push(
              mix({
                "arguments": args.concat(matches.slice(1)),
                "namespace": ns.concat(regStr).join('.')
              }, b.children.reg[regStr]))
          }
        })
      }
      return init
    },[])
  }
  return stack
}

function appendChildListeners(stack){
  var childStack = stack

  while(childStack.length){
    childStack = childStack.reduce(function(i,b){
      return i.concat(
        values(b.children.str)
          .concat(values(b.children.reg))
          .map(function(i){
            return mix({arguments: b.arguments},i)
          })
      )
    },[])
    stack = stack.concat( childStack )
  }
  return stack
}

/**
 *  1. if you want to block the after listener,
 * just register a generator as listener
 *
 *  2. if you just want to run code synchronous, use 'co'.
 *
 *  3. if you want to run listeners parallelism, but all ended before fire function end,
 *  you can return a yieldable object.
 *
 *  4. if you want to run fire parallelism, use `yield [bus.fire('e1'),bus.fire('e2')]`
 *
 * @param {string} eventOrg
 * @param {array} args
 * @param {object} opt
 * @returns {mix} promise object or array of results returned by listeners
 */
bus.prototype.fire  = function(eventOrg,args,opt) {
  var caller = arguments.callee.caller,
    root = this,
    args = args || [],
    opt = opt || {},
    eventNs = eventOrg.split(root.opt.nsSplit),
    stack = [ mix({arguments: []}, root._events)],
    results = [],
    yieldableResults = {},
    currentRef

  return co( function*(){
    //runtime mute, will be clear when start
    root.addMute(opt.mute, {module: root.module(), name: caller.name}, root._data.$$mute)

    if (eventOrg !== "") {
      stack = getTargetStack(eventNs, stack)
    }

    if (opt.cas) {
      stack = appendChildListeners(stack)
    }

    if (root._debug) {//save current context
      currentRef = root._debugListenerRef

      //this may effect the original listener stack
      root._debugListenerRef.stack.push({
        "name": eventOrg,
        "attached": mix([], stack.map(function (i) {
          var n = mix({}, i, true)
          n.listeners = n.listeners.map(function (l) {
            l.stack = []
            return l
          })
          return n
        }), true)})
    }
    //fire
    for (var i in stack) {
      for (var j in stack[i].listeners) {
        var f = stack[i].listeners[j], res
        //set debugListenerRef.stack back
        if (root._debug && root._debugListenerRef !== currentRef) root._debugListenerRef = currentRef

        //if function not in register mute and run time mute
        if (root._mute[f.name] == undefined && root._data.$$mute[f.name] == undefined) {
//          console.log("CALL function %s, module %s, vendor %s", f.name,f.module,f.vendor,stack[i].arguments.concat(args).toString())
//          console.log("arguments", stack[i].arguments, args)
          if( root._debug ){
            //store current listener reference to record data set and return result
            root._debugListenerRef = root._debugListenerRef.stack[root._debugListenerRef.stack.length - 1].attached[i].listeners[j]
          }

          var busLite = root.cloneLite()
          if (util.isGenerator(f.function)) {
            res = yield f.function.apply(busLite, stack[i].arguments.concat(args))
//            res = yield f.function.apply(root, stack[i].arguments.concat(args))
          } else {
            res = f.function.apply(busLite, stack[i].arguments.concat(args))
//            res = f.function.apply(root, stack[i].arguments.concat(args))
          }

          //if the response is a yieldable object
          if( util.isYieldable(res) ){
            yieldableResults[f.name] = res
          }else{
            //TODO you can return a signal
            // some function after may want to use.
            results[f.name] = res
          }

          if(root._debug) {
            root._debugListenerRef.result = res
            root._debugListenerRef = currentRef
          }
        }
      }
    }

    if( Object.keys(yieldableResults).length ){
      _.assign( results, yield yieldableResults )
    }

    if (root._debug){
      root._debugListenerRef = currentRef
    }

//    root._data.$$result = mix(root.data('$$result'), zipObject([eventOrg], [results]))

    return results
  })
}



bus.prototype.standardListener = function( org,opt ){
  var res = {"name" : this._module+'.',"function" : noop,"module":this._module},
    root = this
  if( typeof org == 'function'){
    res.name += org.name || 'anonymous'
    res.function = org
  }else{
    if( Object.keys(org).length !==1 ){
      res = mix(res,org)
      res.name = res.module+"."+(res.name|| 'anonymous')
    }else{
      var key = Object.keys(org).pop()
      res.name += key
      res.function  = org[key]
    }
  }
  res = defaults( res, opt)
  if( res.module !== this._module ){
    res.vendor = this._module
  }

  Array.prototype.forEach.call(['before','after'],function(i){
    if( res[i] && res[i].indexOf('.') == -1 )
      res[i] = root._module + '.' + res[i]
  })

  return res
}

bus.prototype.addMute = function( mute, firer, container){
  var root = this

  container = container || root._mute
  Array.prototype.forEach.call((!mute?[]:mute.length?[mute]:mute),function(m){
    m = m.indexOf(root.opt.nsSplit) == -1 ?
      root._module+'.'+m : m

    container[m] = container[m] || []
    container[m].push( firer )
  })
}


function noop(){}

function findIndex(list ,iterator){
  var index = -1
  list.every( function(e,i){
    if( iterator.apply(this,arguments) === true ){
      index = i
      return false
    }
    return true
  })

  return index
}

function forEach( object, iterator ){
  if( Object.prototype.toString.call(object) == '[object Array]'){
    return object.forEach(iterator)
  }

  for(var i in object){
    iterator.call( object[i], object[i], i)
  }
}

function defaults( target, def ){
  for( var i in def ){
    if( target[i] === undefined ){
      target[i] = def[i]
    }
  }
  return target
}

function zipObject(keys,values){
  var des = {}
  keys.forEach(function(e,i){
    des[e] = values[i]
  })
  return des
}


function mix( target, obj, deep ){
  var arg = Array.prototype.slice.call(arguments)
  target = (arguments.length ==3 || typeof obj == 'object')? arg.shift() : {}
  obj = arg.shift()
  deep = arg.pop() || false


  var name,copy, child

  for (name in obj) {
    if( !obj.hasOwnProperty(name)) continue

    copy = obj[name]

    if( copy === target ) continue

    if ( deep && copy && typeof copy == 'object') {
      if ( Array.isArray(copy)) {
        child =  []
      } else {
        child = {}
      }

      target[name] = mix(child,copy,deep)
    } else if (copy !== void 0) {
      target[name] = copy
    }
  }
  return target
}

function values( obj ){
  var r = []
  for( var i in obj ){
    if( obj.hasOwnProperty(i)){
      r.push( obj[i])
    }
  }
  return r
}


module.exports = bus
