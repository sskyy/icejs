var _ = require('lodash')


exports.info = {
  deps : ['orm'],
  onStart : function( orm ){
    var bus = this
    _.each( orm.modelDesc, function( m, name){
      if(m.crud && Array.isArray(m.crud)){
        m.crud.forEach(function(act){
          var listenerName = act + name.replace(/^(\w)/,function(i){return i.toUpperCase()}),
            method = ( act == 'search' || act=='list') ? 'get' : act,
            requestName = 'request.' + method + '.'+name + ((act=='get'||act=='post'||act=='delete')?'/:id':''),
            respondName = requestName.replace(/^request/,'respond')

          bus.on( requestName, {
            name : listenerName,
            module : m.module,
            "function" : function(){
              //trick here:
              //the bus on the root of onStart is not the runtime bus
              var runtimeBus = this,
                args= Array.prototype.slice.call(arguments)
              if(act==='put'){
                console.log("read from body", JSON.stringify(runtimeBus.data('$$ctx').request.body))
                args.push( runtimeBus.data('$$ctx').request.body )
              }else if( act == 'list'||act=='search' ||act === 'post' ){
                args.push( runtimeBus.data('$$ctx').request.query )
              }
              runtimeBus.fire(name+'.'+act, args)()
            }
          })

          //respond
          bus.on( respondName,{
            name : listenerName,
            module : m.module,
            "function" : function( id) {
              var runtimeBus = this
              console.info("orm respond of", respondName ,id)
              if( act=='search'||act=='list'){
                runtimeBus.data('$$ctx').body = runtimeBus.data(name) || []
              }else if( act=='get'||act=='post'){
                runtimeBus.data('$$ctx').body = runtimeBus.data(name)? runtimeBus.data(name)[id] : undefined
              }else if(act=='put'){
                runtimeBus.data('$$ctx').body = runtimeBus.data(name)['new']
              }else if( act=='delete'){
                runtimeBus.data('$$ctx').body = runtimeBus.data(name)['deleted']
              }
            }
          })
        })
      }
    })
  }
}