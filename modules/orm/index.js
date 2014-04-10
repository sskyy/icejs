var _ = require('lodash'),
    Waterline = require('waterline'),
    Q = require('when');

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

function paste(a,b, notAdd){
  notAdd = notAdd || false

  var keys = Object.keys(a).concat( Object.keys(b)),
    output = {}

  keys.forEach(function(key){
    if( b[key] === undefined ){
      output[key]= a[key]
    }else{
      if( a[key] === undefined && notAdd )  return


      if( a[key] === undefined || typeof a[key] !== 'object' || typeof b[key] !== 'object'){
        output[key] = b[key]
      }else{
        output[key] = paste( a[key],b[key], notAdd)
      }
    }
  })


  return output
}

exports.modelDesc = {}
exports.info = {
  onUpModuleLoad : function( m,name ){
    var root = this,
      models = m.info.models == undefined ? [] :
        Array.isArray(m.info.models) ?m.info.models:[m.info.models]

    models.forEach(function( e){
      exports.modelDesc[e.identity] = e
      exports.modelDesc[e.identity].module = name

      if(e.crud !== false){
        e.crud = !Array.isArray(e.crud) ? ['get','put','post','delete','search'] : e.crud
        //'search' is another type of list, so they can't both exist
        if( ~_.indexOf( e.crud,'search') && ~_.indexOf(e.crud,'list')){
          e.crud = _.without( e.crud, 'list')
        }

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
                  var d = Q.defer(),bus = this
                  bus.data('$$models')[modelName].findOne({id:id},function(err, model){
//                    console.log("ORM promise done")
                    if( err ) return d.reject(err)

                    if( !model ) return d.resolve(1)

                    var res = {}
                    res[model.id] = model.toJSON()
                    bus.extendData(modelName, res)
//                    console.log( "ORM setting model data",bus._data[modelName])
                    d.resolve( model.toJSON())
                  })
                  return d.promise
                }
                break;
              case 'put' :
                return function(attrs){
                  var d = Q.defer(),bus = this
                  bus.data('$$models')[modelName].create(attrs).done(function(err,model){
                    if(err) console.error('PUT model: %s Failed',modelName,attrs)
                    if(err) return d.reject(err)

                    var res = {}
                    res[model.id] = res['new'] = model.toJSON()
                    bus.extendData(modelName, res)
                    console.log('PUT model: %s success', modelName, model.toJSON())
                    d.resolve( model.toJSON())
                  })
                  return d.promise
                }
                break;
              case 'post' :
                return function(id,attrs){
                  var bus = this,d = Q.defer()
                  console.log("ORM update attrs",JSON.stringify(attrs))
                  bus.data('$$models')[modelName].findOne(id).done(function(err,m){
                    if( err ) return d.reject(err)

                    for( var i in attrs ){
                      console.log("ATTR ",i,m[i],attrs[i],m.hasOwnProperty(i))
                      if( m.hasOwnProperty(i) ){
                        m[i] = attrs[i]
                      }
                    }
                    m.save(function(err){
                      if( err) return d.reject(err)
                      var res = {}
                      res[id] = m.toJSON()
                      bus.extendData(modelName, res)
                      console.log("ORM model saved",JSON.stringify(res))
                      return d.resolve(m.toJSON())
                    })
                  })
                  return d.promise
                }
                break;
              case 'delete' :
                return function(id){
                  var bus = this, d= Q.defer()
                  bus.data('$$models')[modelName].findOne(id).done(function(err, model) {
                    if( err) return d.reject(err)
                    model.destroy(function(err) {
                      if( err ) return d.reject(err)
                      var res = {}
                      res[id] = undefined
                      res['deleted'] = model.toJSON()
                      bus.extendData(modelName, res)
                      return d.resolve(model)
                    });
                  });
                  return d.promise
                }
                break
              case 'search' :
                return function( input ){
                  input = input ||{}
                  var d = Q.defer(),bus = this,
                    opts = _.defaults(_.pick(input,['limit','sort']),{
                      limit : 15
                    }),
                    attrs = _.pick( input, _.without(Object.keys(input),'limit','sort'))

                  var qFind = bus.data('$$models')[modelName].find(attrs)
                  for( var i in opts){
                    if( parseInt(opts[i]) == opts[i] ) opts[i] = parseInt(opts[i])
                    if( typeof qFind[i] == 'function' ){
                      qFind = qFind[i](opts[i])
                    }
                  }

                  qFind.done(function(err, models){
//                    console.log("ORM promise done")
                    if( err ) return d.reject(err)

                    if( !models ) return d.resolve([])

                    bus.extendData(modelName, models)
//                    console.log( "ORM setting model data",bus._data[modelName])
                    d.resolve( models)
                  })
                  return d.promise
                }
                break;
              case 'list' :
                return function( input ){
                  var d = Q.defer(),bus = this,
                    opts = _.defaults(_.pick(input,['limit','sort','skip']),{
                      limit : 15,
                      skip : 0
                    })

                  var qFind = bus.data('$$models')[modelName].find()
                  for( var i in opts){
                    if( typeof qFind[i] == 'function' ){
                      qFind = qFind[i](opts[i])
                    }
                  }

                  qFind.done(function(err, models){
//                    console.log("ORM promise done")
                    if( err ) return d.reject(err)

                    if( !models ) return d.resolve([])

                    bus.extendData(modelName, models)
                    //                    console.log( "ORM setting model data",bus._data[modelName])
                    d.resolve( models)
                  })
                  return d.promise
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

    //if there are some alter
    _.each(exports.modelDesc,function(e){
      if(e.alter) exports.modelDesc[e.alter.identity] = paste( exports.modelDesc[e.alter.identity], e.alter )
    })

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
