(function() {

    var config = {};
    /*
    *  Load properties to this class
    *  config.findAll = function(){
    *      // Do stuff
    *  }
    */
    config.keys = {
        clientID : '14nNKisLLvQ65xGrdWTLXnbDw2k09NpVNxARscrMEC',
        clientSecret : 'bGLJchUtx3gSXVcqUDaiV7KIyFFSIlBv3gjtUcYhl9'
    };
    config.inProductionMode = function(){
        return true;
    };
    config.isFirstTime = function(){
        return false;
    };
    config.appletID = "moltin";
    formelo.exports('config', config);
})();