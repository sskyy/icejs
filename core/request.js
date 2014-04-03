var Q = require('q'),_=require('lodash'),
  thunkify = require('thunkify'),
  co = require('co')


exports.route = function(app){
  var bus = this,res
  app.use(function *(next){
    //TODO deal with runtime data clear
//    bus.start()
    var url =this.url.replace(/(^\/)?(\w+\/?\w+)+(\/$)?/, "$2"),
      method = this.method.toLowerCase(),
      requestName = 'request.' + method + '.' +url,
      respondName = 'respond.' + method + '.' +url

    bus.data('ctx', this)

//    try {
      console.log("REQUEST: \"%s\"   FIRE:  \"%s\"",url,requestName)
      res = bus.fire( requestName)

      if( !Q.isPromise( res ) ){
        bus.fire( respondName, res)

      }else{
        var results = yield getResults()

        function getResults(){
          return function(done){
            res.then(function( r){
              done(null, r)
            })
          }
        }
        bus.fire( respondName, results)
      }




//    }catch(e) {
//      console.log("error",arguments)
//      bus.fire('error', requestName)
//    }

    yield next
  })



}
