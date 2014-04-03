var fs = require('fs'),
  path = require('path'),
  Q = require('q'),
  _ = require('lodash'),
  modulePath = path.join(__dirname,'../modules/'),
  modules,deps,promises

exports.loadAll = function( opt ){
  modules = {}
  deps = {}
  promises = []
  modulePath = (opt&&opt.path) || modulePath

  var bus = this,
    files = fs.readdirSync( modulePath)


  files.forEach(function( fileName ){
    if(/^\./.test(fileName)
      || (opt&&opt.modules&&opt.modules.indexOf(fileName) == -1) ) return

    modules[fileName] = require( modulePath+fileName )
  })

  _.each(modules,function(m,name){
    if( !m.info || !m.info.deps ) return

    m.info.deps.forEach(function( depName){
      if( !modules[depName] )
        throw new Error('depend module miss for %s: %s',name,depName)

      bus.module(depName)
      modules[depName].info.onUpModuleLoad &&
        modules[depName].info.onUpModuleLoad.call(bus,m,name)
    })
  })

  //deal with module init and module dependency
  _.each(modules,function( m, name){
    bus.module(name)
    _.each( m.info.logic,function( listenner, e){
      bus.on(e,listenner)
    })
  })

  //call onStart if any module still have work to do

  var res = Object.keys(modules).every(function(name){
    bus.module( name)
    var m = modules[name]
    if( m.info.onStart ){
      var q = m.info.onStart.apply( bus, m.info.deps ? m.info.deps.map(function(name){
        return  modules[name]
      }):[])

      if( Q.isPromise( q) ){
        promises.push(q)
      }else if( q===false){
        return false
      }
    }
    return true
  })

  if( !res ) return res

  if( promises.length){
    var q=Q.defer()
    Q( promises).allSettled().spread(function(){
      var res = Array.prototype.slice.call( arguments).every( function(d){
        if( d.state == 'rejected' ){
          q.reject()
          return false
        }
        return true
      })
      if( res ) q.resolve()
    }).done()
    return q.promise
  }

  return true
}

exports.getLoadedModules = function(){
  return modules
}
