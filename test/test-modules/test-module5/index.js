var Q = require('q')

exports.info = {
  logic : {},
  onStart : function(m){
    var d = Q.defer()
    d.reject()
    return d.promise
  }
}
