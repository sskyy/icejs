var _ = require('lodash'),
  util = require('../../core/util'),
  co = require('co')


exports.info = {
  "onUpModuleLoad" : function( m, name ){
    if( !m.info.respond ) return

    var logic = {}

    _.each(m.info.respond,function(requestFn,requestName ) {
      var respondName = requestName.replace(/^request/, "respond"),
        respondFn

      logic[requestName] = {
        first: true,
        name: requestFn.name,
        module: name,
        vendor: 'respond'
      }

      if( util.isGenerator(requestFn) ){
        logic[requestName].function = function* requestDelegate(){

          var bus = this,
            requestRlst = yield requestFn.apply(bus,arguments)

          if (Array.isArray(requestRlst)) {
            //magic here,later define respond function for event
            respondFn = requestRlst[1]
            return requestRlst[0]
          } else if (typeof requestRlst == 'function') {
            respondFn = requestRlst
          } else {
            return requestRlst
          }
          return
        }
      }else{
        logic[requestName].function = function requestDelegate() {
          var bus = this,
            requestRlst = requestFn.apply(bus, arguments)
          if (Array.isArray(requestRlst)) {
            //magic here,later define respond function for event
            respondFn = requestRlst[1]
            return requestRlst[0]
          } else if (typeof requestRlst == 'function') {
            respondFn = requestRlst
          } else {
            return requestRlst
          }
        }
      }


      logic[respondName] = {
        name : requestFn.name+"'s respond",
        "function" : function *respondDelegate(){
          if (typeof respondFn == 'function'){
            if( util.isGenerator(respondFn)){
              yield respondFn.apply(this,arguments)

            }else{
              return respondFn.apply(this, arguments)
            }
          }
        },
        module : name,
        vendor : 'respond'
      }

    })

   return m.info.logic = _.assign(m.info.logic||{},logic)
  }
}