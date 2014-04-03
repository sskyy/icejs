var koa = require('koa'),
  app = koa(),
  body = require('koa-body')

require('koa-router')(app)
app.use(body())
require('./core/bootstrap')(app,function(){
  app.listen(3000);
})
