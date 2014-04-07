var Q = require('when'),_=require('lodash'),
  co = require('co'),thunkify = require('thunkify')


exports.route = function(app){
  var originalBus = this

  app.use(function *(next){
    var ctx = this
    yield co(function *(){
      //every request need a new bus
      var bus = originalBus.clone(),
      url =ctx.url.replace(/\?.*$/,'').replace(/(^\/)?(\w+\/?\w+)+(\/$)?/, "$2"),
        method = ctx.method.toLowerCase(),
        requestName = 'request.' + method + '.' +url,
        respondName = 'respond.' + method + '.' +url

      bus.data('$$ctx', ctx)
      console.log("REQUEST: \"%s\"   FIRE:  \"%s\"",url,requestName)

      yield bus.fire( requestName)

      yield bus.fire( respondName)
    })()

    yield next
  })
}
