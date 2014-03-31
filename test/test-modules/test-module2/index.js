
var isUpModuleLoaded = false

exports.isUpModuleLoaded = function(){
  return isUpModuleLoaded
}

exports.info = {
  logic : {},
  onUpModuleLoad : function(m){
    isUpModuleLoaded = true
  }
}
