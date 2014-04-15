var bus = require('../core/bus.js'),
  _ = require('lodash'),
  assert = require('assert'),
  when = require('when'),
  co = require('co')

describe("Bus Test.",function(){
  var busIns

  beforeEach(function(){
    busIns = new bus
  })

  describe("Simple attach test.",function(){
    it('A listenner should be attached properly.',function(){
      busIns.on("ns",_.noop)
      assert.notEqual( busIns.getEvents().children.str.ns, undefined )
      assert.equal( busIns.getEvents().children.str.ns.listeners[0].function,_.noop)
    })

    it('Listenner can have a alias or name.',function(){
      function listenner(){}
      busIns.on("fn1",listenner)
      busIns.on("fn2",{"alias":listenner})
      busIns.on("fn3",{name:"fn3","function":listenner})
      assert.equal( busIns.getEvents().children.str.fn1.listeners[0].name, busIns.module()+".listenner")
      assert.equal( busIns.getEvents().children.str.fn2.listeners[0].name, busIns.module()+".alias")
      assert.equal( busIns.getEvents().children.str.fn3.listeners[0].name, busIns.module()+".fn3")
    })


  })
//
//  describe("Simple fire test.",function(){
//    //1. if you want to block the after listener,
//    //just register a generator as listener
//
//    //2. if you just want to run code synchronous, use 'co' and
//    //DON'T return 'yieldable' object
//
//    //3. if you want to control the work flow afterward,
//    //return a signal object
//
//    //4. if you want to run the listeners asynchronous registered
//    //to the same event, but make the fire function wait for your
//    //result, you can return a 'thunkable' object
//    it('Genarator listener may block listeners followed',function(done){
//      return co(function *(){
//        var outside = []
//        busIns.on("fn1",function *generator(){
//          var d = when.defer()
//          setTimeout(function(){
//            outside.push('generator')
//            d.resolve()
//          },500)
//          yield d.promise
//        })
//
//        busIns.on("fn1",function (){
//          outside.push('function')
//        })
//
//        yield busIns.fire('fn1')
//
//        setTimeout(function(){
//          if( outside.toString() == 'generator,function' ) return done()
//          console.log("outside" ,JSON.stringify(outside))
//          return done(new Error('disorder'))
//        },510)
//      })()
//    })
//
//    it('If listener return an promise, then the parent fire function will wait it end',function(done){
//      var outside = []
//      busIns.on('fn1',function first(){
//        outside.push('first')
//        var d = when.defer()
//        setTimeout(function(){
//          outside.push('firstR')
//          d.resolve()
//        },600)
//        return d.promise
//      })
//
//      busIns.on('fn1',function second(){
//        outside.push('second')
//        var d = when.defer()
//        setTimeout(function(){
//          outside.push('secondR')
//          d.resolve()
//        },500)
//        return d.promise
//      })
//      busIns.fire('fn1')()
//
//      setTimeout(function(){
//        if( outside.toString() == 'first,second,secondR,firstR') return done()
//        return done(new Error('disorder'))
//      },700)
//    })
//  })

  describe("Multiple attach test",function(){
    it('Multiple listener with same namespace attach',function(){
      busIns.on("ml",_.noop)
      busIns.on("ml",_.noop)
      assert.equal(busIns.getEvents().children.str.ml.listeners.length,2)
    })
    it('multiple listener fire',function(){
      var fired1=false,fired2=false
      busIns.on('h',function(){fired1=true})
      busIns.on('h',function(){fired2=true})
      busIns.fire('h')()
      assert.equal(fired1,true)
      assert.equal(fired2,true)
    })
    it('listener fire with the right order',function(){
      var fireStack = []
      busIns.on('o',function l1(){fireStack.push('l1')})
      busIns.on('o',function l2(){fireStack.push('l2')},{before:'l1'})
      busIns.on('o',function l3(){fireStack.push('l3')},{first:true})
      busIns.on('o',function l4(){fireStack.push('l4')},{last:true})
      busIns.on('o',function l5(){fireStack.push('l5')})
      busIns.fire('o')()
      assert.equal(fireStack.toString(),'l3,l2,l1,l5,l4')
    })
  })


  describe("Namespace attach test",function(){
    var fired
    function fire(){
      fired++
    }
    beforeEach(function(){
      fired=0
      busIns.on('n1',fire)
      busIns.on('n1.n2',fire)
      busIns.on('n1.n2.n3.n4',fire)
    })
    it('Auto create namespace structure',function(){
      assert.equal( busIns.getEvents().children.str.n1.listeners.length,1)
      assert.equal( busIns.getEvents().children.str.n1.children.str.n2.listeners.length,1)
      assert.equal( busIns.getEvents().children.str.n1.
        children.str.n2.
        children.str.n3.listeners.length,0)
      assert.equal( busIns.getEvents().children.str.n1.
        children.str.n2.
        children.str.n3.
        children.str.n4.listeners.length,1)
    })
    it('Fire only one level namespce',function(){
      busIns.fire('n1.n2')()
      assert.equal( fired,1)
    })
    it('Fire with cascading',function(){
      busIns.fire('n1',undefined,{cas:true})()
      assert.equal(fired,3)
    })
  })

  describe("Namespace with variables test",function(){
    it('Varaibles should be pass to listenner',function(){
      var varStack = []
      busIns.on('/1/:var1/2/:var2/4',function(var1, var2,var3){
        varStack.push(var1)
        varStack.push(var2)
        varStack.push(var3)
      })
      busIns.fire('/1/v1/2/v2/4','v3')()
      assert.equal( varStack.toString(),'v1,v2,v3')
    })
    it('True request with variable test',function(){
      var userId = false,testId = 1
      busIns.on('request.get.user/:userId',function(id){
        userId = id
      })
      busIns.fire('request.get.user/'+testId)()
      assert.equal( userId,testId)
    })
  })


  describe("Test fire with mute option",function(){
    var h1Fired = false,h2Fired = false
    beforeEach(function(){
      h1Fired = false
      h2Fired = false
    })
    it('Muted listenner should not be fired',function(){
      busIns.on('h',function h1(){h1Fired=true})
      busIns.on('h',function h2(){h2Fired=true})
      busIns.fire('h',[],{mute:'h1'})()
      assert.equal( h1Fired,false)
      assert.equal( h2Fired,true)
    })
    it('listenner in the chain can be muted too',function(){
      busIns.on('h1',function h1(){
        h1Fired = true
        busIns.fire('h2')()
      })
      busIns.on('h2',function h2(){
        h2Fired = true
      })
      busIns.fire('h1',[],{mute:'h2'})()
      assert.equal( h1Fired,true)
      assert.equal( h2Fired,false)
    })
    it('We can mute listenner in attach',function(){
      busIns.on('h',function h1(){h1Fired=true},{mute:'h2'})
      busIns.on('h',function h2(){h2Fired=true})
      busIns.fire('h',[])()
      assert.equal( h1Fired,true)
      assert.equal( h2Fired,false)
    })
  })

  describe("Test debugStack",function(){
    //TODO test debugStack is in right order
    it('Listener registered in one event test',function(){
      busIns.beginDebug()
      var fns = [function fn1(){},function fn2(){}],e = 'e'

      fns.forEach(function(fn){
        busIns.on(e,fn)
      })
      busIns.fire(e)()
      var debugStack = busIns.debugInfo().stack
      assert.equal(debugStack.length, 1)
      assert.equal(debugStack[0].name ,e)
      assert.equal(debugStack[0].attached.length,1)
      assert.equal(debugStack[0].attached[0].namespace,e)
      assert.equal(debugStack[0].attached[0].listeners.length,fns.length)
      fns.forEach(function(fn,i){
        assert.equal(debugStack[0].attached[0].listeners[i].name,'global.'+fns[i].name)
      })
    })

    it('Inside fire test',function(){
      busIns.beginDebug()
      var es = ['e1','e2','e3'],outside = []
      busIns.on(es[0],function baseFn(){
        var root = this
        es.slice(1).forEach(function( e){
          root.fire(e)()
        })
      })

      es.slice(1).forEach(function( e){
        busIns.on(e,function(){
          outside.push(e)
        })
      })

      busIns.fire(es[0])()

      var debugStack = busIns.debugInfo().stack
      assert.equal( debugStack.length,1)
      assert.equal( debugStack[0].name,es[0])
      assert.equal( debugStack[0].attached.length ,1)
      assert.equal( debugStack[0].attached[0].listeners.length ,1)
      assert.equal( debugStack[0].attached[0].listeners[0].name ,'global.baseFn')
      assert.equal( debugStack[0].attached[0].listeners[0].stack.length ,es.length-1)
      assert.equal( outside.toString(), es.slice(1).toString())
    })

    //TODO test detail information like data set or return result is marked
    it('Data set or return result should be record',function(){
      busIns.beginDebug()
      var Dataset = [{data:{m:1},result:2},{data:{d:3},result:'nothing'}],
        fns = Dataset.map(function(d){
          return function(){
            var b = this
            for( var name in d.data ){
              b.data(name, d.data[name])
            }
            return d.result
           }
        }),
        e = 'e'


      fns.forEach(function(fn){
        busIns.on(e,fn)
      })

      busIns.fire(e)()
      var debugStack = busIns.debugInfo().stack
      debugStack[0].attached[0].listeners.forEach(function( l,i ){
        assert.equal( JSON.stringify(l.data), JSON.stringify(Dataset[i].data) )
        assert.equal( l.result, Dataset[i].result)
      })

    })

    //TODO test asynchronous fire, debugStack should still in right order
    it('Asynchronous fire should still in right order',function testIt(done){
      busIns.beginDebug()
      co( function *generator(){
        busIns.on('e1',function fn1(){
          var d = when.defer(),root = this
          setTimeout(function timeoutInner(){
            root.fire('e3')()
            d.resolve()
          },500)
          return d.promise
        })

        busIns.on('e2',function fn2(){})
        busIns.on('e3',function fn3(){})

        yield [busIns.fire('e1') , busIns.fire('e2')]
//        yield busIns.fire('e1')
//        yield busIns.fire('e2')

        var debugStack = busIns.debugInfo().stack
//        console.log( JSON.stringify( busIns.debugInfo()))
        assert.equal( debugStack[0].attached[0].listeners[0].stack[0].name, 'e3' )
        assert.equal( debugStack[0].attached[0].listeners[0].stack[0].attached[0].listeners[0].name, 'global.fn3' )
        done()
      })()
    })
  })


})
