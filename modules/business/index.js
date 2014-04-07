var _ = require('lodash'),
  Q = require('q')


exports.info = {
  deps : ['respond'],
  respond : {
    "request.get./": function () {
      return function () {
        this.data('$$ctx').body = 'ICE FRAMEWORK'
      }
    },
    "request.get.user/:id": function handleUserGetPage() {
      return function (id) {
        console.log(JSON.stringify(this.data('$$ctx')))
//        this.data('$$ctx').body = this.data('user')[id]
//        console.log( this.data('user') && this.data('user')[id])
      }
    },
    "request.get.user/1": function justTest() {
      console.log("request should fire in dev stack")
      return function toTestRespondFunction(){
        console.log("respond should fire in dev stack")
      }
    },
    "request.put.user": function () {
      return function () {
        var bus = this
        this.data('$$models').user.find().then(function (users) {
          bus.data('$$ctx').body = users
        })
      }
    },
    "request.get.users": function () {
      return function () {
        var bus = this
        this.data('$$models').user.find().then(function (users) {
//          console.log("should return something",users)
          console.log("real ctx should be replaced",JSON.stringifybus.data('$$ctx'))
          bus.data('$$ctx').body = users
        })
      }
    },
    "request.get.debug/public/js/:fileName.:ext": function (fileName, ext) {
      var bus = this, d = Q.defer()

      console.log("======request file %s.%s", fileName, ext)

//    fs.readFile( __dirname+'/public/js/'+fileName+'.'+ext,{encoding:'utf8'},function(err, content){
//      if( err ){
//        console.log( 'err finding file')
//        return d.reject()
//      }
//
//      console.log("file found", content)
//      bus.data('ctx').body = content
//      d.resolve( content)
//    })

      return d.promise
    }
  }
}