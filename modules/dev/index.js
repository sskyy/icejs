var Q = require('q')

exports.info= {
  logic : {
    'respond.get.dev/events' : function(){
      this.data('ctx').body = this.getEvents()
    },
    'respond.get.dev/simulate' : function(){

    }

  }
}