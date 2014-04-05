var Q = require('q'),_=require('lodash'),
  co = require('co')


function thunkify(promise){
  var p = promise
  return function(done){
    p.then(function( r){
      done(null, r)
    })
  }
}

exports.route = function(app){
  var bus = this

  app.use(function *(next){
    //TODO deal with runtime data clear
    bus.start()
    var url =this.url.replace(/(^\/)?(\w+\/?\w+)+(\/$)?/, "$2"),
      method = this.method.toLowerCase(),
      requestName = 'request.' + method + '.' +url,
      respondName = 'respond.' + method + '.' +url,
      requestRslt,respondRslt,beforeRslt

    bus.data('$$ctx', this)


      console.log("REQUEST: \"%s\"   FIRE:  \"%s\"",url,requestName)

      requestRslt = bus.fire( requestName)
      if( Q.isPromise( requestRslt ) ) {
        console.log("wait for the request result")
        yield thunkify(requestRslt)
      }

      respondRslt =  bus.fire( respondName)
      if(Q.isPromise( respondRslt)){
        console.log("wait for the response result")
        yield  thunkify(respondRslt)
      }

//    }catch(e) {
//      console.log("error",arguments)
//      bus.fire('error', requestName)
//    }

    yield next
  })



}
