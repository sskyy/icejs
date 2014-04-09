var Q = require('when'),co = require('co'),util = require('../../core/util')

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
    "request.get.dev/data" : function *getDevData(){
      var bus = this,
        realCtx=bus.data('$$ctx')

      bus.data('$$ctx',{body:'',query:{}})
      //restart the bus to empty extra data
//      bus.start()

//      var url = realCtx.request.query.url.replace(/(^\/)?(\w+\/?\w+)+(\/$)?/, "$2"),
//        method = realCtx.request.query.method.toLowerCase(),
      var url = 'user/1',method = 'get',
        requestName = 'request.' + method + '.' +url,
        respondName = 'respond.' + method + '.' +url,
        requestRslt,respondRslt

      yield bus.fire( requestName)
      yield bus.fire( respondName)

      return function *(){
        bus.data('$$ctx',realCtx)
        bus.data('$$ctx').body = bus.debugStack
      }
    }
  },
  file : {
    '^\\/dev\\/' : __dirname+'/public'
  }
}