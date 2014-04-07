var q = require('when')

var q1 = q.defer(),q2 = q.defer()

console.log(q.isPromiseLike([q1,q2]))