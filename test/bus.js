var bus = require('../core/bus.js'),
  _ = require('lodash'),
  assert = require('assert')

describe("Bus Test",function(){
  var busIns

  beforeEach(function(){
    busIns = new bus
  })

  describe("Simple attach and fire test",function(){
    it('A listenner should be attached properly',function(){
      busIns.on("ns",_.noop)
      assert.notEqual( busIns.events.children.str.ns, undefined )
      assert.equal( busIns.events.children.str.ns.functions[0].function,_.noop)
    })
    it('A listerner should be fire properly',function(){
      var fired = false
      busIns.on("ns",function(){fired = true})
      busIns.fire('ns')
      assert.equal(fired,true)
    })
    it('A listernner can recive argument from fire',function(){
      var flag,arg="ha"
      busIns.on("f",function(a){flag=a})
      busIns.fire('f',arg)
      assert.equal(flag,arg)
    })
    it('Listenner can have a alias or name',function(){
      function listenner(){}
      busIns.on("fn1",listenner)
      busIns.on("fn2",{"alias":listenner})
      busIns.on("fn3",{name:"fn3","function":listenner})
      assert.equal( busIns.events.children.str.fn1.functions[0].name, busIns.module()+".listenner")
      assert.equal( busIns.events.children.str.fn2.functions[0].name, busIns.module()+".alias")
      assert.equal( busIns.events.children.str.fn3.functions[0].name, busIns.module()+".fn3")
    })
    it('Bus instance should be passed as "this" to listenner',function(){
      var outside
      busIns.on('f',function(){
        outside = this
      })
      busIns.fire('f')
      assert.equal( busIns,outside)
    })
  })

  describe("Multiple attach test",function(){
    it('Multiple listenner with same namespace attach',function(){
      busIns.on("ml",_.noop)
      busIns.on("ml",_.noop)
      assert.equal(busIns.events.children.str.ml.functions.length,2)
    })
    it('Multyiple listenner fire',function(){
      var fired1=false,fired2=false
      busIns.on('h',function(){fired1=true})
      busIns.on('h',function(){fired2=true})
      busIns.fire('h')
      assert.equal(fired1,true)
      assert.equal(fired2,true)
    })
    it('listernner fire with the right order',function(){
      var fireStack = []
      busIns.on('o',function l1(){fireStack.push('l1')})
      busIns.on('o',function l2(){fireStack.push('l2')},{before:'l1'})
      busIns.on('o',function l3(){fireStack.push('l3')},{first:true})
      busIns.fire('o')
      assert.equal(fireStack.toString(),'l3,l2,l1')
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
      assert.equal( busIns.events.children.str.n1.functions.length,1)
      assert.equal( busIns.events.children.str.n1.children.str.n2.functions.length,1)
      assert.equal( busIns.events.children.str.n1.
        children.str.n2.
        children.str.n3.functions.length,0)
      assert.equal( busIns.events.children.str.n1.
        children.str.n2.
        children.str.n3.
        children.str.n4.functions.length,1)
    })
    it('Fire only one level namespce',function(){
      busIns.fire('n1.n2')
      assert.equal( fired,1)
    })
    it('Fire with cascading',function(){
      busIns.fire('n1',undefined,{cas:true})
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
      busIns.fire('/1/v1/2/v2/4','v3')
      assert.equal( varStack.toString(),'v1,v2,v3')
    })
    it('True request with variable test',function(){
      var userId = false,testId = 1
      busIns.on('request.get.user/:userId',function(id){
        userId = id
      })
      busIns.fire('request.get.user/'+testId)
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
      busIns.fire('h',[],{mute:'h1'})
      assert.equal( h1Fired,false)
      assert.equal( h2Fired,true)
    })
    it('listenner in the chain can be muted too',function(){
      busIns.on('h1',function h1(){
        h1Fired = true
        busIns.fire('h2')
      })
      busIns.on('h2',function h2(){
        h2Fired = true
      })
      busIns.fire('h1',[],{mute:'h2'})
      assert.equal( h1Fired,true)
      assert.equal( h2Fired,false)
    })
    it('We can mute listenner in attach',function(){
      busIns.on('h',function h1(){h1Fired=true},{mute:'h2'})
      busIns.on('h',function h2(){h2Fired=true})
      busIns.fire('h',[])
      assert.equal( h1Fired,true)
      assert.equal( h2Fired,false)
    })
  })
})
