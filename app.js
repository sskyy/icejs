var koa = require('koa'),
  app = koa();

require('koa-router')(app)
require('./core/bootstrap')(app)

app.listen(3000);
