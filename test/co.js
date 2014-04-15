/**
 * Created by jiamiu on 14-4-7.
 */
var co = require('co')
var thunkify = require('thunkify');
var request = require('request');
var get = thunkify(request.get)
var bus = require('../core/bus.js')


var a = co(function *haha(){
    return 111
})()

console.log( a )


