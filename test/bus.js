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

  })
})
