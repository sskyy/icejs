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
function bus(opt){
  //TODO add option for auto 'before' and 'after' fire
  this.opt = defaults( opt||{},{
    nsSplit : '.', //namespace split
    varSign : ':', //variable sign
    varSplit : '/',
    mutRex : /^!/,
    tarRex : /^@/
  })

  this._mute = {}
  this._events = {listeners:[],children:{"str":{},"reg":{}}}
  this.start()
}

bus.prototype.getEvents = function(){
  return this._events
}

/**
 * reset runtime data
 */
bus.prototype.start  = function(){
  //runtime mute must be clear every time
  this._data = {"$$result":{},"$$mute":{}}
  this._module = 'global'
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

bus.prototype.getResult = function( eventOrg ){
  return this._data.$$result[eventOrg]
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
      var variables = b[0],
        e = b[1]

      if( e.children.str[n] )
        init.push([variables,e.children.str[n]])

      if( Object.keys(e.children.reg).length){
        forEach( e.children.reg, function(child,regStr){
          var reg = new RegExp( regStr),
            matches = n.match(reg)

          if( matches)
            init.push([variables.concat(matches.slice(1)),e.children.reg[regStr]])
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
        values(b[1].children.str)
          .concat(values(b[1].children.reg))
          .map(function(i){
            return [b[0],i]
          })
      )
    },[])
    stack = stack.concat( childStack )
  }
  return stack
}

bus.prototype.fire  = function( eventOrg, args,opt ){
  var stack = [[[],this._events]],
    eventNs = eventOrg.split( this.opt.nsSplit),
    root=this,
    results = [],
    stack,
    opt = opt ||{}

  root.addMute(opt.mute,{module:root.module(),name:arguments.callee.caller.name},root.data('$$mute'))

  if( eventOrg !== "" ){
    stack = getTargetStack(eventNs,stack)
  }

  if(opt.cas){
    stack = appendChildListeners( stack)
  }

  //fire
  //TODO deal with asynchrous result
  stack.forEach(function(b){
    b[1].listeners.forEach(function(f){
      if( root._mute[f.name] == undefined && root.data('$$mute')[f.name] == undefined)
        results[f.name] = f.function.apply( root, b[0].concat(args===undefined?[]:args))
    })
  })


  root.data('$$result',
      mix(root.data('$$result'),
          zipObject([eventOrg],[results])))
  return results
}

bus.prototype.standardListener = function( org,opt ){
  var res = {"name" : this._module+'.',"function" : noop},
    root = this
  if( typeof org == 'function'){
    res.name += org.name
    res.function = org
  }else{
    if( Object.keys(org).length !==1 ){
      res = mix(org)
      res.name = this._module+"."+res.name
    }else{
      var key = Object.keys(org).pop()
      res.name += key
      res.function  = org[key]
    }
  }
  res = defaults( res, opt)
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

function values( obj ){
  var values = []
  for( var i in obj ){
    obj.hasOwnProperty(i) &&values.push(obj[i])
  }
  return values
}

function mix( target, obj, deep ){
  var arg = Array.prototype.slice.call(arguments)
  target = arguments.length ==3 ? arg.shift() : {}
  obj = arg.shift()
  deep = arg.pop() || false


  var name,copy, child

  for (name in obj) {
    if( !obj.hasOwnProperty(name)) continue

    copy = obj[name]

    if ( deep && copy && typeof copy == 'object') {
      if ( Array.isArray(copy)) {
        child =  []
      } else {
        child = {}
      }

      target[name] = clone(child,copy,deep)
    } else if (copy !== void 0) {
      target[name] = copy
    }
  }
  return target
}



module.exports = bus
