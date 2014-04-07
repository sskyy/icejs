var Q = require('when'),_=require('lodash'),
  co = require('co'),
  util = require('./util')


exports.route = function(app){
  var originalBus = this

  app.use(function *(next){
    var ctx = this,
      res = co(function *(){
      //every request need a new bus
      var bus = originalBus.clone(),
      url =ctx.url.replace(/\?.*$/,'').replace(/(^\/)?(\w+\/?\w+)+(\/$)?/, "$2"),
        method = ctx.method.toLowerCase(),
        requestName = 'request.' + method + '.' +url,
        respondName = 'respond.' + method + '.' +url,
        requestRes,respondRes

      bus.data('$$ctx', ctx)
      console.log("REQUEST: \"%s\"   FIRE:  \"%s\"",url,requestName)

      requestRes = bus.fire( requestName)
      if( util.isYieldable(requestRes)){
        yield requestRes
      }

      respondRes = bus.fire( respondName)
      if( util.isYieldable(respondRes)){
        yield  respondRes
      }
    })()

    if( util. isYieldable( res) ) yield res
    yield next
  })
}
