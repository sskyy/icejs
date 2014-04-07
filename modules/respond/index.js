var _ = require('lodash'),
  Q = require('q')


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
        "function": function () {
          var bus = this,
            requestRlst = requestFn.apply(bus, arguments)


          if (Array.isArray(requestRlst)) {
            respondFn = requestRlst[1]
            return requestRlst[0]
          } else if (typeof requestRlst == 'function') {
            respondFn = requestRlst
          } else {
            return requestRlst
          }
        },
        module: name,
        vendor: 'respond'
      }

      logic[respondName] = {
        name : requestFn.name+"'s respond",
        "function" : function(){
          if (typeof respondFn == 'function') return respondFn.apply(this, arguments)
        },
        module : name,
        vendor : 'respond'
      }

    })

   return m.info.logic = _.assign(m.info.logic||{},logic)
  }
}