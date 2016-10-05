var syncPlugin =  {
    start: function (arg1, arg2, arg3, successCallback, errorCallback) {
        cordova.exec(
            successCallback, // success callback
            errorCallback,  // error callback
            "SyncPlugin",     // Class to call
            "reconcileData",  // Action to call //reconcileLocation
            [arg1, arg2, arg3]    // arguments
        );
    },
    inflateEntity: function (arg1, successCallback, errorCallback) {
        cordova.exec(
            successCallback, // success callback
            errorCallback,  // error callback
            "SyncPlugin",     // Class to call
            "inflateEntity",  // Action to call //reconcileLocation
            [arg1]
        );
    },
    deflateEntity: function (arg1, successCallback, errorCallback) {
        cordova.exec(
            successCallback, // success callback
            errorCallback,  // error callback
            "SyncPlugin",     // Class to call
            "deflateEntity",  // Action to call //reconcileLocation
            [arg1]
        );
    },
    cleanEntity: function (arg1, successCallback, errorCallback) {
        cordova.exec(
            successCallback, // success callback
            errorCallback,  // error callback
            "SyncPlugin",     // Class to call
            "cleanEntity",  // Action to call //reconcileLocation
            [arg1]
        );
    },
    notify: function (title,text) {
        //if (device.platform == 'iOS'){
            cordova.plugins.notification.local.schedule({
                id: 1,
                title:title,
                text: text.substr(0, 40)+'...',
                //sound: isAndroid ? 'file://sound.mp3' : 'file://beep.caf',
                data: { secret:"Sdsjdknsndjksndkjsdnsk" }
            });
        /*} else {
            cordova.exec(
                null, // success callback
                null,  // error callback
                "SyncPlugin",     // Class to call
                "showNotification",  // Action to call //reconcileLocation
                [title,text]
            );
        }*/
    }
};