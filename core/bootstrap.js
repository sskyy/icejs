var bus = require('./bus'),
  loader = require('./loader'),
  request = require('./request'),
  when = require('when'),
  co = require('co')

module.exports = co(function *(app,opt,cb){
  //init bus
  var busIns = new bus

  //for modules responsible for app
  busIns.data("$$app",app)

  //deal with request
  request.route.call(busIns, app)

  //load modules and register listenners
  var loadRslt = yield loader.load.call(busIns,opt)


  if( !loadRslt )
    throw new Error('start failed caused by module onStart hook.')


  cb && cb()
})
