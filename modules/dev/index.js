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
      bus.beginDebug()


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
        bus.endDebug()
        var debugInfo = this.debugInfo()
        isCyclic(debugInfo)
        this.data('$$ctx',realCtx)
        this.data('$$ctx').body = debugInfo
      }
    }
  },
  file : {
    '^\\/dev\\/' : __dirname+'/public'
  }
}

function isCyclic (obj) {
  var seenObjects = [];

  function detect (obj) {
    if (typeof obj === 'object') {
      if (seenObjects.indexOf(obj) !== -1) {
        console.log("\nSEEN!!!!!\n",obj)
        return true;
      }
      seenObjects.push(obj);
      for (var key in obj) {
        if (obj.hasOwnProperty(key) && detect(obj[key])) {
          console.log("+++++++++++++++++++++\n",obj, '\n++++++++++++++++\n=======cycle at ' + key, '=============\n');
          return true;
        }
      }
    }
    return false;
  }

  return detect(obj);
}