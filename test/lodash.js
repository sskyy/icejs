/**
 * Created by jiamiu on 14-4-10.
 */

var _=require('lodash')


function A(){}
A.prototype.fn = function(){

}

var a = new A
a.pro = {}

var b = _.cloneDeep(a)

//console.log(b.fn,a.fn)

var c = {}
c.__proto__ = A.prototype
_.assign( c,  a )

c.own = {}

console.log( c.fn === a.fn,a.pro === c.pro, c.own ===a.own)


