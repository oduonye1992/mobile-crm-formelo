(function(){
    'use strict';
    var Helpers = formelo.require('Helpers');
    var UserManager = formelo.require('UserManager');
    var config = formelo.require('config');

    var userID = null;

    formelo.event().onCreate(function(){
        // Entry point of this application
        customise();
        showSaveButton();
    });
    formelo.event().onIntent(function(params){
        userID = params.detail.userID;
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });

    function showSaveButton(){
        var data = [{
            'icon' : 'fa fa-money',
            'text' : 'Complete Registration',
            'link' : null,
            'active' :  false,
            'unique' : 'complete'
        }];
        formelo.ui().footer(data, function(unique){
             submit();
        });
    }
    function customise(){
        formelo.html().get.header.title().html('Setup Your Store');
    }
    function getValues(){
        var appletID = null;
        if (config.inProductionMode()){
            appletID = formelo.mAppletID;
        } else {
            appletID = 'dac0d9a0';
        }
        var client_id = $('#register_client_id').val();
        var client_secret = $('#register_client_secret').val();
        var store_name = $('#register_title').val();
        if (!(client_id && client_secret &&store_name)){
            throw new Error('Kindly check your form and try again');
        }
        return  {
            client_id : client_id,
            applet_id : appletID,
            admin_id : userID,
            client_secret : client_secret,
            store_name : store_name
        };
    }
    function submit(){
        try {
            var data = getValues();
            console.log('Posting '+JSON.stringify(data));
            config.registerApplet(data, function(data){
                console.log(data);
                // Set config values
                config.keys.clientID = data.settings.client_id;
                config.keys.clientSecret = data.settings.client_secret;
                // Navigate to home page
                formelo.navigation().openActivity('home');
            }, function(err){
                console.error(err);
            })
        } catch (e) {
            alert(e.message);
        }
    }
}());