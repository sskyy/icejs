var Q = require('when'),
  _ = require('lodash'),
  co = require('co'),
  thunkify = require('thunkify')
/**
 * Create a bus instance.
 * Notice the 'events' object will be like this:
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

function isGenerator(obj) {
  return obj && obj.constructor && 'GeneratorFunction' == obj.constructor.name;
}

function bus(opt){
  this.opt = defaults( opt||{},{
    nsSplit : '.', //namespace split
    varSign : ':', //variable sign
    varSplit : '/',
    mutRex : /^!/,
    tarRex : /^@/
  })

  this._mute = {}
  this._data = {}
  this._events = {listeners:[],children:{"str":{},"reg":{}}}
  this.start()
}

bus.prototype.clone = function(){
  var root = this,
    newBus = new bus
  //clone all private data
  forEach(['_mute','_data','_events'],function(e){
    newBus[e] = _.cloneDeep(root[e],function(e){
      return  typeof e == 'function' ? e : undefined
    })
  })
  //clone all system runtime data
  forEach(root._data,function(e,i){
    if( /^\$\$/.test(i)){
      newBus._data[i] = _.clone(e)
    }
  })
  return newBus
}

bus.prototype.getEvents = function(){
  return this._events
}

/**
 * reset runtime data
 */
bus.prototype.start  = function(){
  console.log("==============ATTENTION, BUS START!=================")
  var root = this
  //runtime mute must be clear every time
  var runtimeKey = ["$$result","$$mute"]

  for( var i in root._data ){
    if( !/^\$\$/.test( i) ){
      delete root._data[i]
    }
  }

  //deal with special keys
  runtimeKey.forEach(function(k){
    root._data[k] = {}
  })

  root._module = 'global'
  root.debug = true
  root.debugStack = []
  root.promiseStackRef = null
  root.debugRef = root.debugStack
}


/**
 * Set or get current module name
 */
bus.prototype.module = function( name ){
  return name ? (this._module=name) : this._module
}

bus.prototype.data = function(name,data){
  return data ? (this._data[name]=data) : this._data[name]
}

bus.prototype.extendData = function( name,data){
  this._data[name] = mix(this._data[name] || {}, data )

}

bus.prototype.getResult = function( eventOrg ){
  return eventOrg ? this._data.$$result[eventOrg] : this._data.$$result
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
 *
 * @param {string} eventOrg
 * @param {array} args
 * @param {object} opt
 * @returns {mix} promise object or array of results returned by listeners
 */
bus.prototype.fire  = co(function *( eventOrg, args,opt ){
  console.log("it should not be exec")
  var stack = [ mix({arguments:[]},this._events)],
    eventNs = eventOrg.split( this.opt.nsSplit),
    root=this,
    results = [],
    stack,
    opt = opt ||{},
    currentRef

  //runtime mute, will be clear when start
  root.addMute(opt.mute,{module:root.module(),name:arguments.callee.caller.name},root.data('$$mute'))

  if( eventOrg !== "" ){
    stack = getTargetStack(eventNs,stack)
  }

  if(opt.cas){
    stack = appendChildListeners( stack)
  }

  currentRef = root.debugRef
  if( root.debug ){
    //if fire in a promise callback, set the ref to right one
    root.debugRef.push({
      "name":eventOrg,
      "attached":mix([],stack.map(function(i){
        var n = mix({},i,true)
        n.listeners = n.listeners.map(function(l){
          l.stack = []
          return l
        })
        return n
      }),true)})
  }

  //fire
  stack.forEach(function(b,i){
    b.listeners.forEach(co(function *(f,j){
      //set debugRef back
      if( root.debug&&root.debugRef !== currentRef ) root.debugRef = currentRef

      if( root._mute[f.name] == undefined && root.data('$$mute')[f.name] == undefined){
        if( root.debug ){
          //set debugRef into the listener, as to record any fire event in the listener
          root.debugRef = root.debugRef[root.debugRef.length-1].attached[i].listeners[j].stack
        }

        var res = co(f.function).apply(root,b.arguments.concat(args===undefined?[]:args))
//        console.dir(res)
        if( Q.isPromiseLike( res)) res = thunkify(res)
//
        if( isGenerator(res) ){
          results[f.name] = yield res
        }else{
          console.log(res)
          results[f.name] = res
        }
      }
    }))
  })

  if( root.debug )  root.debugRef = currentRef

  root.data('$$result',
      mix(root.data('$$result'),
          zipObject([eventOrg],[results])))
  return results
})

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
