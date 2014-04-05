var _ = require('lodash'),
    Waterline = require('waterline'),
    Q = require('q');

// Instantiate a new instance of the ORM
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

exports.modelDesc = {}
exports.info = {
  onUpModuleLoad : function( m,name ){
    var root = this,
      models = m.info.models == undefined ? [] :
        Array.isArray(m.info.models) ?m.info.models:[m.info.models]

    models.forEach(function( e){
      if(e.alter) exports.modelDesc[e.alter.identity] = _.assign( exports.modelDesc[e.alter.identity], e.alter )
      exports.modelDesc[e.identity] = e
      exports.modelDesc[e.identity].module = name

      if(e.crud !== false){
        e.crud = !Array.isArray(e.crud) ? ['get','put','post','delete'] : e.crud
        e.crud.forEach(function(act){
          var eName = e.identity+'.'+act,
          listener = {
            name : act+ e.identity.replace(/^(\w)/,function(i){return i.toUpperCase()}),
            module :name
          }

          listener.function = (function(){
            var modelName = e.identity
            switch( act ){
              case 'get' :
                return function(id){
                  var d = Q.defer()
                  root.data('$$models')[modelName].findOne({id:id},function(err, model){
                    var res = {}
                    res[model.id] = model.toJSON()
                    root.extendData(modelName, res)
                    d.resolve( model.toJSON())
//                    console.log("find user", model.toJSON(), modelName,root.data(modelName))
                  })
                  return d.promise
                }
                break;
              case 'put' :
                return function(attrs){
                  var d = Q.defer()
                  root.data('$$models')[modelName].create(attrs).done(function(err,model){
                    var res = {}
                    res[model.id] = model.toJSON()
                    root.extendData(modelName, res)
                    d.resolve( model.toJSON())
                  })
                  return d.promise
                }
                break;
              case 'post' :
                return function(id,attrs){
                  return root.data('$$models')[modelName].findOne(attrs)
                }
                break;
              case 'delete' :
                return function(id){
                  return root.data('$$models')[modelName].destroy({id:id})
                }
                break
            }
          })()

          root.on( eName ,listener)
        })
      }
    })

  },
  // when return a promise object, you can use reject with
  // first parameter of true to cause a fatal error,
  // deps will be passed to the function
  onStart : function(){
    var d = Q.defer(),
      bus = this

    //init all models
    _.each(exports.modelDesc, function(m){
      orm.loadCollection(Waterline.Collection.extend(m));
    })

    orm.initialize(config,function(err,models){
      if( err ) return d.reject([true,module.id])

      bus.data('$$models',models.collections)
      bus.data('collections',models.connections)
      d.resolve()
    })
    return d.promise
  }
}
