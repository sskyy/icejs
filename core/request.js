
exports.route = function(app){
  var bus = this
  app.use(function *(next){

    bus.data('ctx',this)

    bus.fire(['request',
      this.method.toLowerCase(),
      this.url.replace(/(^\/)?(\w+\/?\w+)+(\/$)?/,"$2")
    ].join('.'))

    this.body = "hello"
  })
}
