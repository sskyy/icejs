var Q = require('when'),_=require('lodash'),
  co = require('co'),
  util = require('./util')


exports.route = function(app){
  var originalBus = this

  app.use(function *(next){
    //every request need a new bus
    var bus = originalBus.clone(),
      url =this.url.replace(/\?.*$/,'').replace(/(^\/)?(\w+\/?\w+)+(\/$)?/, "$2"),
      method = this.method.toLowerCase(),
      requestName = 'request.' + method + '.' +url,
      respondName = 'respond.' + method + '.' +url

    bus.data('$$ctx', this)
    console.log("REQUEST: \"%s\"   FIRE:  \"%s\"",url,requestName)

    yield bus.fire( requestName )

    yield bus.fire( respondName )


    yield next
  })
}
