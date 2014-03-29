/*
 This is a sample module. Basicaly it has nothing diffrent
 with a stardard node package.
 If you want require any third party package, you can just
 put it in a sub folder named "node_modules", just like requiring
 node package, or you can describe the dependencies in "package.json".

 Attension, if you want to load another module(not third party package)
 before this module initialized, you need to use the "desc" of exports
 just like below.
*/

exports.desc = {
  //deps : ['log'],
  logic : {
    "init" : nothing2log //value need to be fucntion ref
  }
}

function nothing2log(){
  console.log("nothing to log")
}
