var send = require('koa-send')

exports.info= {
  "onUpModuleLoad" : function(m, name){
    if( !m.info.file ) return

    this.data('$$app').use(function *(next){
      yield next;
      if( this.response.status ) return

      for( var r in m.info.file ){
        if( new RegExp(r).test(this.path) ) {
          yield send(this, this.path.replace( new RegExp(r),'/'), { root: m.info.file[r]});
        }
      }
    })
  }
}