/*
api
api.functions.loadConfFromServer;
api.gcm
api.gcm.initiialize
api.gcm.androidNotification
api.gcm.GCMReceiver
*/

var pushNotification;

var api = {
        // Application Constructor
        initialize: function() {
            var txDeferred = $.Deferred();
            this.bindEvents();
            txDeferred.resolve();
            return txDeferred.promise();
        },
        "transfer": function(entity, resourcePath) {
            //resourcePath = "http://requestb.in/11g9o9c1";
            var isNew = !entity.resource_id || entity.resource_id.length == 0;
            var urlPath = resourcePath;
            var saveDeferred = $.Deferred();
            $.ajax({
                data: JSON.stringify(entity),
                url: urlPath,
                cache: false,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                type: isNew ? "POST" : "PUT",
                processData: false
            }).always(function(obj, status, misc) {
                {
                    status = null;
                    obj = {
                        status: 201,
                        responseText: defaultUrl
                    }
                }
                if (status == "success") {
                    console.log('Yay!');
                    saveDeferred.resolve(obj, status, misc);
                } else {
                    var xhr = obj;
                    switch (xhr.status) {
                        case 201:
                            var newUrl = xhr.responseText;
                            $.when(initFunctions.network.load(newUrl, true))
                                .always(function(obj, status, misc) {
                                    if (status == 'success') {
                                        saveDeferred.resolve(obj, status, misc);
                                    } else {
                                        saveDeferred.reject(obj, status, misc);
                                    }
                                });
                            break;
                        case 401:
                            initFunctions.logout();
                            saveDeferred.reject(obj, status, misc);
                            break;
                        default:
                            console.log("Network Load Error");
                            saveDeferred.reject(obj, status, misc);
                            break;
                    }
                }
            });
            return saveDeferred.promise();
        },
        helpers : {
            loadConfFromServer: function() {
                var txDeferred = $.Deferred();

                $.when(api.helpers.getConfig())
                    .done(function(data) {
                        if (data != '') {
                            DB.helpers.storeConfigInDB(JSON.stringify(data));// app.storeConfigInDB(JSON.stringify(data));
                            txDeferred.resolve(data);
                        } else {
                            txDeferred.reject("Empty config");
                        }
                    })
                    .fail(function(error) {

                        console.log(error);
                        //window.plugins.toast.show("Check internet connection and try again", 'short', 'bottom');
                        txDeferred.reject(error);
                    });
                return txDeferred.promise();
            },
            getConfig: function() {
                var txDeferred = $.Deferred();
                //var teamHubUrl  = 'https://demo.formelo.com/actions/applets/config?username=rd@pmglobaltechnology.com';
                var teamHubUrl = getUserConfigEndpoint();
                customFunctions.displayNotificationDialog('Please Wait', 'Fetching your information');

                $.ajax({
                    url: teamHubUrl,
                    cache: false,
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    type: "GET",
                    processData: false,
                    timeout: 70000,
                    success: function(data) {
                        //debugConfig = data;
                        customFunctions.closeNotificationDialog();
                        txDeferred.resolve(data);
                    },
                    error: function(xhr, textStatus, errorThrown) {
                        customFunctions.closeNotificationDialog();
                        txDeferred.reject(JSON.stringify(xhr));
                    }
                });
                return txDeferred.promise();
            }
        },
        notification: {
            initialize: function() {

                var pushNotification;
                pushNotification = window.plugins.pushNotification;
                //alert(device.platform);
                if (device.platform == 'android' || device.platform == 'Android' ||
                    device.platform == 'amazon-fireos' ) {
                    pushNotification.register(api.notification.successHandler, api.notification.errorHandler, {"senderID":"661780372179","ecb":"onNotification"});		// required!
                } else {
                    pushNotification.register(api.notification.tokenHandler, api.notification.errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"api.notification.onNotificationAPN"});	// required!
                }
               // alert('initialising');
            },
            // handle APNS notifications for iOS
            onNotificationAPN: function(e) {
                alert(JSON.stringify(e));
                if (e.alert) {
                    //$("#app-status-ul").append('<li>push-notification: ' + e.alert + '</li>');
                    // showing an alert also requires the org.apache.cordova.dialogs plugin
                    navigator.notification.alert(e.alert);
                }

                if (e.sound) {
                    // playing a sound also requires the org.apache.cordova.media plugin
                    var snd = new Media(e.sound);
                    snd.play();
                }

                if (e.badge) {
                    pushNotification.setApplicationIconBadgeNumber(api.notification.successHandler, e.badge);
                }
             },
             successHandler: function(result) {
                alert('<li>success:'+ result +'</li>');
             },
             errorHandler: function(error) {
                alert('<li>error:'+ error +'</li>');
             },
             tokenHandler: function (result) {
                alert('<li>token: '+ result +'</li>');
                // Your iOS push server needs to know the token before it can push to this device
                // here is where you might want to send it the token for later use.
             }
        }
}