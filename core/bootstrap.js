var bus = require('./bus'),
  loader = require('./loader'),
  request = require('./request'),
  Q = require('q')

module.exports = function(app,cb){
  //init bus
  var busIns = new bus

  //for modules responsible for app
  busIns.data("$$app",app)

  //deal with request
  request.route.call(busIns, app)

  //load modules and register listenners
  var loadRslt = loader.loadAll.call(busIns)
  if( Q.isPromise( loadRslt ) ) {
    return loadRslt.then(function(){
      request.route.call(busIns, app)
      cb && cb()
    },function(){
      throw new Error('start failed caused by module onStart hook.')
    })

  }else if( !loadRslt){
    throw new Error('start failed caused by module onStart hook.')
  }


  cb && cb()
}
