var Q = require('q'),
  send = require('koa-send')

exports.info= {
  logic : {
    'respond.get.dev/events' : function(){
//      this.data('ctx').body = this.getEvents()
    },
    'respond.get.dev/simulate' : function(){

    },
    "request.get.dev/data" : function(){
      var bus = this,
        res = bus.fire('request.get.user/1'),
        d = Q.defer()

      res.then(function(){
        bus.data('$$ctx').body = bus.debugStack
        d.resolve()
      })
      return d.promise
    }
  },
  "onStart" : function(){
    this.data('$$app').use(function *(next){
      yield next;
      if( this.response.status ) return

      if( /^\/dev\//.test(this.path) ) {
        yield send(this, this.path.replace(/^\/dev/,''), { root: __dirname + '/public' });
      }
    })
  }
}