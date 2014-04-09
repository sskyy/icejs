var _ = require('lodash')


exports.info = {
  deps : ['orm'],
  onStart : function( orm ){
    var bus = this
    _.each( orm.modelDesc, function( m, name){
      if(m.crud && Array.isArray(m.crud)){
        m.crud.forEach(function(act){
          var eName = 'request.' +act + '.'+name
          if( act !=='put' ) eName += '/:id'

          bus.on( eName, {
            name : act + name.replace(/^(\w)/,function(i){return i.toUpperCase()}),
            module : m.module,
            "function" : function(){
              var args=[]
              if( act !== 'put'){
                args = [].slice.call(arguments)
                if( act === 'post'){
                  args.push( bus.data('$$ctx').request.body )
                }
              }else{
                args.push( bus.data('$$ctx').request.body )
              }
              return bus.fire(name+'.'+act, args)
            }
          })

        })

      }
    })
  }
}