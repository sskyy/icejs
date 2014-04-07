/**
 * Created by jiamiu on 14-4-7.
 */
var co = require('co')
var thunkify = require('thunkify');
var request = require('request');
var get = thunkify(request.get)
var bus = require('../core/bus.js')


co(function *(){
    res = yield co(function *(){
      //var = get('http://baidu.com');
      //var res = yield a;
      //console.log(res);
      yield 333
      return "aaa"
    })
    console.log(res)

})()