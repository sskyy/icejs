var fs = require('fs'),
  path = require('path'),
  Q = require('when'),
  _ = require('lodash'),
  modules,deps,promises,
  co = require('co')

/**
 * option support:
 *  modulePath : path to module
 *  modules : specify certain modules to be load
 *  sysModules : specify certain system modules to be load
 *  sysModulePath : specify system module path
 * @type {Function|*|exports}
 */
exports.load = co(function *( opt ){
  modules = {}
  deps = {}
  promises = []

  var bus = this,
  moduleFiles = opt.modulePath ? fs.readdirSync( opt.modulePath ) : [],
  sysModulePath = opt.sysModulePath || __dirname+'/../modules',
  sysModuleFiles = fs.readdirSync( sysModulePath)

  moduleFiles.forEach(function( fileName ){
    if(/^\./.test(fileName)
      || (opt&&opt.modules&&opt.modules.indexOf(fileName) == -1) ) return

    modules[fileName] = require( path.join(opt.modulePath,fileName ))
    modules[fileName].from = 'system'
  })

  sysModuleFiles.forEach(function( fileName ){
    if(/^\./.test(fileName)
      || (opt&&opt.modules&&opt.modules.indexOf(fileName) == -1) ) return

    modules[fileName] = require( path.join(sysModulePath ,fileName ))
    modules[fileName].from = 'user'
  })

  _.each(modules,function(m,name){
    if( !m.info || !m.info.deps ) return

    m.info.deps.forEach(function( depName){
      if( !modules[depName] )
        throw new Error('depend module miss for '+name+','+depName)

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

      if( Q.isPromiseLike( q) ){
        promises.push(q)
      }else if( q===false){
        return false
      }
    }
    return true
  })

  if( !res ) return res

  if( promises.length){
    var promiseRlst = yield promises

    return promiseRlst.every(function(p){
      if( p === false) return false
      return true
    })
  }

  return true
})

exports.getLoadedModules = function(){
  return modules
}
