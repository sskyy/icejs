var _ = require('lodash'),
  Q = require('q'),
  send = require('koa-send'),
  fs = require('fs'),
  co = require('co')

var route = {
  "request.get./" : function(){
    return function(){
      this.data('$$ctx').body = 'ICE FRAMEWORK'
    }
  },
  "request.get.user/:id":function handleUserGetPage(){
    return function( id){
//      console.log( "get user ",this.data('user')[id])
      this.data('$$ctx').body = this.data('user')[id]
    }
  },
  "request.get.user/1" : function justTest(){

  },
  "request.put.user":function(){
    return function(){
      var bus = this
      this.data('$$models').user.find().then(function(users){
        bus.data('$$ctx').body = users
      })
    }
  },
  "request.get.users" : function(){
    return function() {
      var bus = this
      this.data('$$models').user.find().then(function (users) {
        bus.data('$$ctx').body = users
      })
    }
  },
  "request.get.debug/public/js/:fileName.:ext" : function(fileName, ext){
    var bus = this,d = Q.defer()

    console.log( "======request file %s.%s",fileName,ext)

//    fs.readFile( __dirname+'/public/js/'+fileName+'.'+ext,{encoding:'utf8'},function(err, content){
//      if( err ){
//        console.log( 'err finding file')
//        return d.reject()
//      }
//
//      console.log("file found", content)
//      bus.data('ctx').body = content
//      d.resolve( content)
//    })

    return d.promise
  }
}

exports.info = {
  logic : (function(){
    var logic = {}

    _.each(route,function(requestFn,requestName ) {
      var respondName = requestName.replace(/^request/, "respond"),
        respondFn

      logic[requestName] = {
        first : true,
        name : requestFn.name,
        "function" : function(){
          var bus = this,
            requestRlst = requestFn.apply(bus, arguments)

          if( Array.isArray(requestRlst )){
            respondFn = requestRlst[1]
            return requestRlst[0]
          }else if( typeof requestRlst == 'function'){
            respondFn = requestRlst
          }else{
            return requestRlst
          }
        }
      }

      logic[respondName] = function(){
        if(typeof respondFn == 'function' ) return respondFn.apply( this, arguments)
      }
    })

    return logic
  })(),
  "onStart" : function(){
//    this.data('$$app').use(function *(){
//
//      yield send(this, this.path, { root: __dirname + '/public' });
//    })
  }
}