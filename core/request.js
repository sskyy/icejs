var Q = require('when'),_=require('lodash'),
  co = require('co')


function thunkify(promise){
  var p = promise
  return function(done){
    p.then(function( r){
      done(null, r)
    },function( err ){
      console.log("err:",err)
      done( err)
    })
  }
}

exports.route = function(app){
  var originalBus = this

  app.use(function *(next){
    //every request need a new bus
    var bus = originalBus.clone()
//    var bus = originalBus
    var url =this.url.replace(/\?.*$/,'').replace(/(^\/)?(\w+\/?\w+)+(\/$)?/, "$2"),
      method = this.method.toLowerCase(),
      requestName = 'request.' + method + '.' +url,
      respondName = 'respond.' + method + '.' +url,
      requestRslt,respondRslt

    bus.data('$$ctx', this)


    console.log("REQUEST: \"%s\"   FIRE:  \"%s\"",url,requestName)

    console.log("GLOBAL : begin to fire request",requestName)
    requestRslt = bus.fire( requestName)
    if( Q.isPromiseLike( requestRslt ) ) {
      console.log("GLOBAL : waiting for the global request result")
      yield thunkify(requestRslt)
    }

    console.log("GLOBAL : begin to fire response",respondName)
    respondRslt =  bus.fire( respondName)
    if(Q.isPromiseLike( respondRslt)){
      console.log("GLOBAL : waiting for the global respond result")
      yield  thunkify(respondRslt)
    }

    yield next
  })



}
