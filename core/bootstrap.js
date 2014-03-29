var fs = require('fs'),
  path = require('path'),
  modulePath = path.join(__dirname,'../modules/'),
  modules = {},
  bus = require('./bus'),
  _ = require('lodash')

module.exports = function(app){
  //init bus

  //load modules
  var files = fs.readdirSync(modulePath)
  files.forEach(function( fileName ){
    if(/^\./.test(fileName) ) return

    modules[fileName] = require( modulePath + fileName )
    console.log('loading module:',fileName)
  })
  
  //TODO deal with module init and module dependency
  _.each(modules,function( m){
    if( typeof m.desc.logic.init == 'function' )
      m.desc.logic.init(bus)
  })

  //deal with request
  app.use(function *(next){
    var root = this
    _.each(modules,function( m){
      if( typeof m.desc.logic.request == 'function' ){
        console.log("callling module",JSON.stringify(m)," request")
        m.desc.logic.request.call(root)
      }


    })

    yield next

    _.each(modules,function( m){
      if( typeof m.desc.logic.response == 'function' )
        m.desc.logic.response.call(root)
    })

    this.body = "hello"
  })

}
