var bus = require('../core/bus.js'),
  loader = require('../core/loader.js'),
  fs = require('fs'),
  _ = require('lodash'),
  path = require('path'),
  assert = require('assert')

describe("Bus Test",function(){
  var busIns,
    modulePath = path.join(__dirname,'./test-modules/')

  beforeEach(function(){
    busIns = new bus
  })

  describe('Simple test',function(){
    it('Should load all modules if not specified',function(){

      loader.loadAll.call( busIns,{path:modulePath})
      var files = fs.readdirSync(modulePath)
      files = files.reduce(function(a,b){
        return a.concat( /^\./.test(b) ? []:b)
      },[])
      assert.equal( files.length, Object.keys(loader.getLoadedModules()).length)
    })
    it('Should be right if specified modules',function(){
      loader.loadAll.call(busIns,{path:modulePath,modules:['test-module1','test-module2']})
      assert.equal( Object.keys(loader.getLoadedModules()).length,2)
    })
    it('Should throw err when deps missed',function(){
      var err = false
      try{
        loader.loadAll.call(busIns,{path:modulePath,modules:['test-module1','test-module3']})
      }catch(e){
        err = true
      }
      assert.equal( err, true)
    })
    it('Module should be notified when up module onload',function(){
      loader.loadAll.call(busIns,{path:modulePath})
      var modules = loader.getLoadedModules()
      assert.equal( modules['test-module2'].isUpModuleLoaded(),true)
    })
  })
})
