exports.desc = {
  "logic" : {
    "request" :function(){
      !this.cookies.get('token') && this.cookies.set('token',new Date())
    },
    "response": function(){
      console.log("user:"+this.cookies.get('token'))
    }
  }
}
