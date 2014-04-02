var koa = require('koa'),
  app = koa();

require('koa-router')(app)
require('./core/bootstrap')(app,function(){
  app.listen(3000);
})
