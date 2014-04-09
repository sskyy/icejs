/**
 * Created by jiamiu on 14-4-7.
 */
var co = require('co')
var thunkify = require('thunkify');
var request = require('request');
var get = thunkify(request.get)
var bus = require('../core/bus.js')


co(function *haha(){
    var a=  function *(){return 1}
    yield a.apply(this)

})()

