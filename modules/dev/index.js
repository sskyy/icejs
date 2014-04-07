var Q = require('when'),co = require('co')

function thunkify(promise){
  var p = promise
  return function(done){
    p.then(function( r){
      done(null, r)
    },function( err ){
      done( err)
    })
  }
}

exports.info= {
  deps : ['respond','file'],
  respond : {
    "request.get.dev/events" : function(){
      return function(){
        this.data('$$ctx').body = this.getEvents()
      }
    },
    "request.get.dev/data" : function(){
      var bus = this,d = Q.defer(),
        realCtx=bus.data('$$ctx')

      bus.data('$$ctx',{body:'',query:{}})
      //restart the bus to empty extra data
//      bus.start()

      var url = realCtx.request.query.url.replace(/(^\/)?(\w+\/?\w+)+(\/$)?/, "$2"),
        method = realCtx.request.query.method.toLowerCase(),
//      var url = 'user/1',method='get',
        requestName = 'request.' + method + '.' +url,
        respondName = 'respond.' + method + '.' +url,
        requestRslt,respondRslt

      //if you fire another events in asynchrous function
      //you must notify the bus to make debug stack being
      //right. A little bit ugly!
      requestRslt = bus.fire(requestName)
      Q(requestRslt).finally(function(){
        d.notify()
      }).then(function(){
        respondRslt = bus.fire( respondName)

        Q(respondRslt).catch(function(){
          console.log('err!!!!')
        }).finally(function(){
          d.resolve()
        })
      })

//      console.log("return global request")

      return [ d.promise,function(){
        bus.data('$$ctx',realCtx)
        bus.data('$$ctx').body = bus.debugStack
      }]
    }
  },
  file : {
    '^\\/dev\\/' : __dirname+'/public'
  }
}