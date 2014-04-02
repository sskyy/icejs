var _ = require('lodash'),
    Waterline = require('waterline'),
    Q = require('q');

// Instantiate a new instance of the ORM
console.log( JSON.stringify(Waterline))
var orm = new Waterline;


// Require any waterline compatible adapters here
var diskAdapter = require('sails-disk')


// Build A Config Object
var config = {

  // Setup Adapters
  // Creates named adapters that have have been required
  adapters: {
    'default': diskAdapter,
    disk: diskAdapter
  },

  // Build Connections Config
  // Setup connections using the named adapter configs
  connections: {
    localDisk: {
      adapter: 'disk'
    }
  },

  defaults: {
    migrate: 'alter'
  }

};

var modelDesc = []
exports.info = {
  onUpModuleLoad : function( m ){
    m.info.models.length ? modelDesc.concat(m.info.models)
      : modelDesc.push( m.info.models )
  },
  // when reture a promise object, you can use reject with
  // first parameter of true to cause a fatal error,
  // deps will be passed to the function
  onStart : function(){
    var d = Q.defer(),
      bus = this

    //init all models
    modelDesc.forEach( function(m){
      orm.loadCollection(Waterline.Collection.extend(m));
    })


    orm.initialize(config,function(err,models){
      if( err ) return d.reject([true,module.id])

      bus.data('models',models.collections)
      bus.data('collections',models.connections)
      d.resolve()
    })
    return d.promise
  }
}
