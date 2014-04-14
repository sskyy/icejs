var Q = require('when')



function isGenerator(obj) {
  return obj && obj.constructor && 'GeneratorFunction' == obj.constructor.name;
}

function isYieldable(obj){

  if( !obj ) return false
  if( isGenerator(obj)) return true

  if( typeof obj == 'function' ) return true

  if( Array.isArray(obj) && obj.every(isYieldable()) )  return true

  if( Q.isPromiseLike(obj) ) return true

  if( typeof obj == 'object' && Object.keys(obj).every(function(k){return isYieldable(obj[k])})) return true

  return false
}

function enYieldabe(obj){
  var output = {}
  for( var i in obj ){
    if( !obj.hasOwnProperty(i)) continue
    if( isYieldable(obj[i])){
      output[i] = obj[i]
    }
  }
  return output
}

exports.isGenerator = isGenerator
exports.isYieldable= isYieldable