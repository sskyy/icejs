var fs = require('fs'),
  path = require('path'),
  modulePath = path.join(__dirname,'../modules/'),
  modules = {},
  _ = require('lodash')

exports.loadAll = function(){
  var bus = this
  var files = fs.readdirSync(modulePath)
  files.forEach(function( fileName ){
    if(/^\./.test(fileName) ) return

    modules[fileName] = require( modulePath + fileName )
    console.log('loading module:',fileName)
  })

  //TODO deal with module init and module dependency
  _.each(modules,function( m, name){
    bus.module(name)
    _.each( m.desc.logic,function( listenner, e){
      bus.on(e,listenner)
    })
  })
  console.log("register done:\n",JSON.stringify(bus.events.
      children.str.request.
      children.str.get.
      children
  ))
}
