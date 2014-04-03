var _ = require('lodash')

var route = {
  "request.get./" : function(){
    return function(){
      this.data('ctx').body = 'hello'
    }
  },
  "request.get.user/:id":function(){
    return function( id){
      console.log( "get user ",this.data('user')[id])

      this.data('ctx').body = this.data('user')[id]
    }
  },
  "request.put.user":function(){
    return function(){
      var bus = this
      this.data('models').user.find().then(function(users){
        bus.data('ctx').body = users
      })
    }
  },
  "request.get.users" : function(){
    return function() {
      var bus = this
      this.data('models').user.find().then(function (users) {
        bus.data('ctx').body = users
      })
    }
  }
}

exports.info = {
  logic : (function(){
    var logic = {}

    _.each(route,function(requestFn,requestName ){
      var respondName = requestName.replace(/^request/,"respond"),
        respondFn

      logic[requestName] = function(){
        var bus = this
        respondFn = requestFn.apply(bus, arguments)
      }

      logic[respondName] = function(){
        typeof(requestFn) == 'function' && respondFn.apply( this, arguments)
      }
    })

    return logic
  })()
}