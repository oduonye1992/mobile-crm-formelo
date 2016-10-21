(function(){
    'use strict';
    var config = formelo.require('config');
    var UserManager = formelo.require('UserManager');
    var Helpers = formelo.require('Helpers');

    formelo.event().onCreate(function(){
        // Entry point of this application
        checkIfAppletExist();
        //testSplash();
    });
    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });

    function checkIfAppletExist(){
        var appletID = null;
        if (config.inProductionMode()){
            appletID = formelo.mAppletID;
        } else {
            appletID = 'dac0d9a0';
        }
        var waiting = Helpers.showWaiting('#splash-placeholder');
        config.isAppletExist(appletID, function(data){
            console.log(data);
            waiting.stop();
            if (data.applet === null){
                if (!config.inProductionMode()){
                    return formelo.navigation().openActivity('registration', {userID : 'ddasasasasas'});
                }
                if (!config.inPrivateMode()){
                    return waiting.error('Coming Soon', 'This Store will open very soon. Watch this space')
                }
                UserManager.showRegistration(function(data){
                    formelo.navigation().openActivity('registration', {userID : data.id});
                }, function(){
                    formelo.close();
                });
            } else {
                console.log(JSON.stringify(data));
                config.keys.clientID = data.settings.client_id;
                config.keys.clientSecret = data.settings.client_secret;
                config.store.name = data.settings.store_name;
                if (!config.inProductionMode()){
                    config.isAdmin = 'ddasasasasas' == data.applet.admin_id;
                    formelo.navigation().openActivity('home');
                } else {
                    config.isAdmin = false; //= userData.id == data.applet.admin_id;
                    formelo.navigation().openActivity('home');
                    /*UserManager.showRegistration(function(userData){
                        config.isAdmin = userData.id == data.applet.admin_id;
                        formelo.navigation().openActivity('home');
                    }, function(err){
                        console.error(err);
                        formelo.close();
                    });*/
                }
            }
        }, function(err){
            waiting.error(':(', 'Please Try again later');
            console.error(err);
        });
    }

    function testSplash(){
        var mod = openModal('Choose an Option', '<div id = "options"></div>');
        var data = [{
            name: 'Settings',
            description: '',
            time: '',
            image: 'http://img4.cliparto.com/pic/s/196419/4510978-flat-icon-pictogram-eps-10.jpg',
            unique: 'uniq'
        },  {
            name: 'More',
            description: '',
            time: '',
            image: 'http://img4.cliparto.com/pic/s/196419/4510978-flat-icon-pictogram-eps-10.jpg',
            unique: 'aa'
        }]
        optionsAdapter(data, '#options').attach(function(unique){
            alert(unique);
            mod.close();
        })
    }
}());