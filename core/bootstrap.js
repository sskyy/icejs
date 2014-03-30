var bus = require('./bus'),
  loader = require('./loader'),
  request = require('./request')

module.exports = function(app){
  //init bus
  var busIns = new bus

  //load modules and register listenners
  loader.loadAll.call(busIns)

  //deal with request
  request.route.call(busIns, app)


}
