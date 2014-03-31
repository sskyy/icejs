var _ = require('lodash')

/**
 * Create a bus instance.
 * Notice the 'events' object will be like this:
 * {
 *  "{namespace}" : {
 *      "functions" : [{
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
  this.opt = _.defaults( opt||{},{
    nsSplit : '.', //namespace spliter
    varSign : ':', //variable sign
    varSplit : '/',
    mutRex : /^!/,
    tarRex : /^@/
  })

  this._data = {}
  this.events = {functions:[],children:{"str":{},"reg":{}}}
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


/**
 * Attach a event to the bus
 * @param {string} eventOrg - original event name with namespace. "" match root.
 * @param {mix} listener - listener can be both function or array
 */
bus.prototype.on = function( eventOrg, listener,opt ){
  var eventRef = this.events,
    eventNs = eventOrg.split(this.opt.nsSplit),
    n,
    root = this

  if( eventOrg !== "" ){
    while( n = eventNs.shift() ){
      var type= n.indexOf(root.opt.varSign)==-1?"str":"reg"
      type=="reg" && (n=n.replace(/(^|\/):\w+(\/|$)/g,"$1(.*)$2"))
      eventRef.children[type][n]||
      (eventRef.children[type][n] = {functions:[],children:{"str":{},"reg":{}}})
      eventRef = eventRef.children[type][n]
    }
  }

  //standardize the listern data structure
  listener = this.standardListener( listener,opt)

  //deal with mute opt
  opt && opt.mute && root.addMute(opt.mute)

  var place = listener.first ? 0 :
    listener.before ? _.findIndex(eventRef.functions,function(e){return e.name==listener.before}):
    listener.after ? _.findIndex(eventRef.functions,function(e){return e.name==listener.before})+1:
    eventRef.functions.length

  eventRef.functions = eventRef.functions.slice(0,place).concat(
    listener, eventRef.functions.slice(place) )

}

bus.prototype.fire  = function( eventOrg, args,opt ){
  var root=this,
    stack = [[[],this.events]],
    variables = [],
    eventNs = eventOrg.split( this.opt.nsSplit),
    n,
    opt = opt ||{}

  root.addMute(opt.mute)

  if( eventOrg !== "" ){
    while( n = eventNs.shift()){
      stack = stack.reduce(function( init, b){
        var variables = b[0],
          e = b[1]

        if( e.children.str[n] )
          init.push([variables,e.children.str[n]])

        if( Object.keys(e.children.reg).length){
          _.each( e.children.reg, function(child,regStr){
            var reg = new RegExp( regStr),
              matches = n.match(reg)

            if( matches)
              init.push([variables.concat(matches.slice(1)),e.children.reg[regStr]])
          })
        }
        return init
      },[])
    }
  }

  if(opt.cas){
    var childStack = stack

    while(childStack.length){
      childStack = childStack.reduce(function(i,b){
        return i.concat(
          _.values(b[1].children.str)
            .concat(_.values(b[1].children.reg))
            .map(function(i){
              return [b[0],i]
            })
        )
      },[])
      stack = stack.concat( childStack )
    }
  }
  stack.forEach(function(b){
    b[1].functions.forEach(function(f){
      if( root.data('mute') && root.data('mute').indexOf(f.name) == -1)
        f.function.apply( root, b[0].concat(args===undefined?[]:args))
    })
  })
}

bus.prototype.standardListener = function( org,opt ){
  var res = {"name" : this._module+'.',"function" : noop},
    root = this
  if( typeof org == 'function'){
    res.name += org.name
    res.function = org
  }else{
    if( Object.keys(org).length !==1 ){
      res = _.clone(org)
      res.name = this._module+"."+res.name
    }else{
      var key = Object.keys(org).pop()
      res.name += key
      res.function  = org[key]
    }
  }
  res = _.defaults( res, opt)
  _.each(['before','after'],function(i){
    if( res[i] && res[i].indexOf('.') == -1 )
      res[i] = root._module + '.' + res[i]
  })

  return res
}

bus.prototype.addMute = function( mute){
  var root = this
  root.data('mute') || (root.data('mute',[]))
  mute = (!mute?[]:mute.length?[mute]:mute).map(function(m){
    return m.indexOf(root.opt.nsSplit) == -1 ?
      root._module+'.'+m : m
  })
  root.data('mute',root.data('mute').concat(mute))
}

bus.prototype.print =function(){
  //console.log( '\nprint events: \n',JSON.stringify(this.events),'\n')
}
function noop(){}

module.exports = bus
