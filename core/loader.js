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

  var bus = this,
    modulePath = (opt&&opt.path) || modulePath,
    files = fs.readdirSync( modulePath)

  files.forEach(function( fileName ){
    if(/^\./.test(fileName)
      || (opt.modules&&opt.modules.indexOf(fileName) == -1) ) return

    modules[fileName] = require( modulePath+fileName )
  })

  _.each(modules,function(m,name){
    if( !m.info || !m.info.deps ) return

    m.info.deps.forEach(function( depName){
      if( !modules[depName] )
        throw new Error('depend module miss:'+depName)

      modules[depName].info.onUpModuleLoad &&
        modules[depName].info.onUpModuleLoad.call(bus,m)
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
  _.each(modules,function(m,name){
    if( m.info.onStart ){
      console.log('call onStart for',name)
      var q = m.info.onStart.apply( bus, m.info.deps ? m.info.deps.map(function(name){
        return  modules[name]
      }):[])
      if( Q.isPromise( q) )
        promises.push(q)
    }
  })

  if( promises.length){
    Q.allSettled( promises).spread(function(){

      Array.prototype.slice.call( arguments).forEach( function(d){
        if( d.state == 'rejected' && d.reason[0] == true )
          throw new Error('fatal error on start,module:'+d.reason[1])
      })
    }).done()
  }

}

exports.getLoadedModules = function(){
  return modules
}
