
function identifyUser(){
  !this.cookies.get('token') && this.cookies.set('token',new Date())
}

function logUser(){
  console.log("user:"+this.cookies.get('token'))
}

function userPut(){

}

function userGet( userId ){
  var bus = this,User = bus.data('$$models').user
console.log("userGet",userId)
  if( userId ){
    User.findOne({id:userId},function(err,user){
      console.log('get user:',JSON.stringify(user))
    })
  }else{
    User.find().done(function(err,users){
      console.log('get Users:',JSON.stringify(users))
    })
  }

}

function userDelete(){

}

function userPost(){

}

function robotPut(lastName){

  var bus = this,User=bus.data('$$models').user
  User.create({
    first_name : parseInt(Math.random()*1000),
    last_name : 'robot'
  },function(err,user){
//    console.log("create done:",err, user)
  })
}

/**
 * 5 system key :
 *    1. logic : describe your logic
 *    2. deps  : list your depend modules
 *    3. onLoad : function will be called when load
 *    4. onUpModuleLoad : function will be called before up module load
 *    5. onStart : function will be called after all module ready.
 */
exports.info = {
  "logic" : {
//    "request.put.user" : userPut,
//    "request.get.user" : userGet,
//    "request.get.user/:userId" : userGet,
//    "request.delete.user/:userId"  : userDelete,
//    "request.post.user/:userId" : userPost,
//    "request.post.robot" : robotPut
  },
  "deps" : ['orm'],
  //will be read by module orm
  "models" : require('./models')
}
