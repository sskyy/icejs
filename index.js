var app = require('koa')(),
  body = require('koa-body'),
  _ = require('lodash'),
  path = require('path'),
  bootstrap = require('./core/bootstrap')

require('koa-router')(app)
app.use(body())


function ice( opt){
  if( opt ) this.config(opt)
}

ice.prototype.config = function(opt){
  this._config = _.defaults(opt,{
    modulePath : '/modules',
    port : 3000
  })
  return this
}

ice.prototype.run = function(){
  var root = this
  bootstrap(app,root._config,function(){
    app.listen(root._config.port);
    console.log("listen on port: ",root._config.port)
  })
}


module.exports = function( opt ){
  return new ice(opt)
}


