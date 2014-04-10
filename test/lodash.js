/**
 * Created by jiamiu on 14-4-10.
 */

var _=require('lodash')

var a = {a:1,b:{c:3,d:4}};b = {a:2,b:{c:5},e:6}

console.log( paste(a,b))

function paste(a,b){
  var keys = Object.keys(a).concat( Object.keys(b)),
    output = {}

  keys.forEach(function(key){
    if( b[key] === undefined ){
      output[key]= a[key]
    }else{
      if( a[key] === undefined || typeof a[key] !== 'object' || typeof b[key] !== 'object'){
        output[key] = b[key]
      }else{
        output[key] = paste( a[key],b[key])
      }
    }
  })


  return output
}