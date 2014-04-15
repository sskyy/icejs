/**
 * Created by jiamiu on 14-4-15.
 */
var assert = require('assert'),
  co = require('co'),
  when = require('when')

describe('Caller test',function(){
  it('Caller of generator',function(done){
    co( function *a(){

        //simulate fire function
        function b(){

          console.log( arguments.callee.caller )
          return co(function *b(){
            when.promise(function(resolve){
              setTimeout( function c(){
                resolve()
                done()
              },200)
            })
          })
        }
        yield b()
    })()


  })
})