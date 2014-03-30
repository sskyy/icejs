
function identifyUser(){
  !this.cookies.get('token') && this.cookies.set('token',new Date())
}

function logUser(){
  console.log("user:"+this.cookies.get('token'))
}

function userPut(){

}

function userGet( userId ){
  console.log("get user:",userId)
}

function userDelete(){

}

function userPost(){

}

exports.desc = {
  "logic" : {
    'request.put.user' : userPut,
    'request.get.user/:userId' : userGet,
    'request.delete.user/:userId'  : userDelete,
    'request.post.user/:userId' : userPost,
  }
}
