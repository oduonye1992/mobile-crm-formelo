(function() {

    var UserManager = {};
    /*
    *  Load properties to this class
    *  UserManager.findAll = function(){
    *      // Do stuff
    *  }
    */
    UserManager.isLoggedIn = function(){
        return false;
    };
    UserManager.users = {
        current : null,
        data : {}
    };
    UserManager.init = function(){};
    UserManager.getUser = function(successCB, errorCB){
        // Generate fictitious data
        var data = {
            id : "fksndlkmds",
            email : "dante@gmail.com"
        }
    };
    UserManager.isAdmin = function(){

    };
    UserManager.getUserProfile = function(id, callback){
        callback(UserManager.users.data[id]);
    };
    UserManager.getAllUsers = function(callback){
        callback(UserManager.users.data);
    };
    UserManager.addUser = function(id, obj, _successCB, _errorCB){
        var errorCB = _errorCB || function(){};
        var successCB = _successCB || function(){};
        if (!(id && obj)) {
            return errorCB('No ID or user object');
        }
        UserManager.users.data[id] = obj;
        successCB();
    };
    UserManager.getCurrentUser = function(callback){
        return UserManager.users.data[UserManager.users.current];
    };
    UserManager.setCurrentUser = function(id){
        UserManager.users.current = id;
    };
    UserManager.isUserExist = function(id){
        if (!id) {
            // Check if any user exist at all
            return UserManager.users.data.length ? true : false;
        }
        return UserManager.users.data[id] ? true : false;
    };
    UserManager.showRegistration = function(callback){
        // How the options and returns the email, firstnemt, and password
        // TODO implement native version
        var first_name = window.prompt('What is your firstname');
        var last_name = window.prompt('What is your lastname');
        var email = window.prompt('What is your email address');
        callback({
            first_name : first_name,
            last_name : last_name,
            email : email
        });
    };
    formelo.exports('UserManager', UserManager);
})();