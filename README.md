icejs
============

##1.什么是icejs##

**icejs** 是 ICE Framework的nodejs实现。主要特点是：  

> 框架中的"**模块组织方式**"、"**模块间通信方式**"等关键机制都是为了更好地支持以后的扩展而设计的。  
> 这些机制能够保证你在快速构建上层业务逻辑的同时，所写的代码逻辑能够尽量贴合业务逻辑。


icejs还提供了一个开发者模块，来将代码逻辑以图形化方式展现。

##2.开始使用icejs##
```
require('icejs')({
  'modulePath' : __dirname+'/modules',
  'port' : 3000
}).run()
```
modulePath指的是自己业务逻辑模块所在的目录。

##3.模块基本结构##

icejs 模块在文件结构上和标准nodejs模块完全保持一致。唯一的要求是在模块 `exports` 中加入一个 `info` 字段来描述模块。如：

```
exports.info = {
	//指定依赖的模块
	deps : ['orm'], 
	
	//被其他模块依赖时，可以通过这个方法扩展其他模块。
	onUpModuleLoad : function( moduleRef, moduleName ){
	  /***/
	},
	
	//所有模块加载完之后，系统启动前会调用这个方法
	//并将所有依赖模块的引用作为参数传入
	onStart : function(){
	}
	
	//注册到系统中事件下的操作
	logic : {}
}
```

我们可以通过 `onUpModuleLoad` 方法来为上层的模块提供扩展，以框架内置的 file 模块为例，这个模块的功能是：如果其他模块依赖它，并且在 `info` 中有 `file` 字段，则为其提供静态文件输出服务。`file` 的代码：

```
exports.info= {
  "onUpModuleLoad" : function(m, name){
    if( !m.info.file ) return

    this.data('$$app').use(function *(next){
      yield next;
      //if request has been responded
      if( this.response.status ) return

      for( var r in m.info.file ){
        if( new RegExp(r).test(this.path) ) {
          yield send(this, this.path.replace( new RegExp(r),'/'), { root: m.info.file[r]});
        }
      }
    })
  }
}
```

使用 `file` 的代码如下：

```
exports.info = {
	deps : ['file'],
    file : {
      '^\\/dev\\/' : __dirname+'/public'
    }
}
```
其中file的键是正则，当浏览器发来的请求路径和这个键匹配时，就将后面值所在的路径当做静态文件目录。代码中得意思是：当发来的请求路径是以 `/dev/` 开始时，就请求当做对当前目录下`public` 子目录中得文件请求。


##4.模块如何通信##

模块通信机制是 icejs 的核心。简单来说，通信是通过事件驱动来实现的。在 **2.模块的结构** 中提到的 `logic` 字段就是用来注册所要监听的事件的。在看实例之前，需要先指导：系统从接到请求开始，会触发一个事件，事件名为 (`request`) + (请求的方法，如 `get`) + (请求的路径，如`user/1`)，合起来：request.get.user/1。当注册在此事件下的所有方法都执行之后，会执行相应地respond事件，事件名和request的构成一样，只是把request换为respond。以下我们来看代码。举个例子，user模块要对user/1这个请求进行响应：

```
exports.info = {
	logic : {
		"request.get.user/1" : function(){/**do something**/}
	}
}
```

注册在事件下的函数我们称为 `监听函数` 或者 `listener`。 在任何监听函数中也可以主动触发其他事件：

```
function *listener{
	yield this.fire('user.beforeGet',1)
}

```

或者

```
function listener{
	this.fire('user.beforeGet',1)()
}
```

事件的注册和触发功能非常强大，支持 **指定触发顺序** 、 **阻塞后续监听函数** 、**并行触发** 等等高级特性。请参考 api 文档。  


##5.如何返回数据##


有两种方式处理函数中返回的数据，第一种是通过框架提供的data函数来将数据保存起来，要使用时再通过data函数取出来。如：

```
//put
function listener{
	var user = {id:1,name:'admin'}
	this.data('user',user)
}

//get
function anotherListener{
	var user = this.data('user')
}
```

第二种方式是通过函数返回值：

```
//return user, registered in 'user.get'
function *userGetListener(id){
	var user = yield orm.user.findOne(id)
	return user
}

//get user
function *getUser(id){
	var values = yield this.fire('user.get',id),
		user = values['global.userGetListener']
}
```

`fire` 函数的返回值是一个对象，键为监听函数的名字，值是函数的返回值。推荐使用第一种方式减少耦合。

