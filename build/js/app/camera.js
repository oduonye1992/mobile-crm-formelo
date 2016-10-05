
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////    HANDLING THE CAMERA /////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// these variables are by set when phonegap loads

var pictureSource;   // picture source
var destinationType; // sets the format of returned value
var passport;
var signature;
var leftthumb;
var rightthumb;

// Wait for PhoneGap to connect with the device
document.addEventListener("deviceready",onDeviceReady,false);


// PhoneGap is ready to be used!

function onDeviceReady() {
    pictureSource   = navigator.camera.PictureSourceType;
    destinationType = navigator.camera.DestinationType;
}

function capturePhoto(options) {
    // Take picture using device camera and retrieve image as base64-encoded string
    navigator.camera.getPicture(function(imageData) {
        Activity.getCurrentStackObject().find('img[name="'+options.item_key+'"]').attr('src', "data:image/jpg;base64," + imageData);
    }, onFail, {
        quality: 50,
        //destinationType: Camera.DestinationType.DATA_URL
        destinationType : navigator.camera.DestinationType.DATA_URL,
        sourceType: navigator.camera.PictureSourceType.CAMERA,
        encodingType: navigator.camera.EncodingType.JPEG,
        allowEdit : true,
        targetWidth: 500,
        //targetHeight: 100,
        correctOrientation: true
    });
}

// Called if something bad happens.
function onFail(message) {
    debug("Failed because: " + message, "alert");
}
















































////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////    HANDLING THE FINGERPRINT /////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// these variabes are by set when phnegap loads

var pictureSourceEdit;   // picture source
var destinationTypeEdit; // sets the format of returned value
var passportEdit;
var signatureEdit;
var leftthumbEdit;
var rightthumbEdit;
var retrycount = 0;
var isBluetoothReady = false;
var isFPScannerSessionReady = false;
var FP_MAC_ADDRESS = "00:15:71:17:9A:E3";


function onFPDataSuccess(imageData,options) {

    alert(FINGER_PRINT_KEY + " " + FINGER_PRINT_TEMPLATE_KEY);

    var image       = imageData.image;
    var template    = imageData.template;

    Activity.getCurrentStackObject().find('img[name="'+FINGER_PRINT_KEY+'"]').attr('src', "data:image/bmp;base64," + image);
    Activity.getCurrentStackObject().find('input[name="'+FINGER_PRINT_TEMPLATE_KEY+'"]').val(template);


}

function initFPScanner() {
    //console.log("bluetooth="+bluetooth);
    if (device.platform != 'iOS') {
        window.bluetooth.enable(function () {
            isBluetoothReady = true;
        }, fpScannerErrorHandler);
    }
}

function startDiscovery() {
    window.plugins.toast.show('startDiscovery', 'short', 'bottom');
    window.bluetooth.startDiscovery(function(data) {
        console.log("startDiscovery: data:");
        console.log(data ? data.name : null);
        console.log(data ? data.address : null);
        console.log(data ? data.uuid : null);
        console.log(data ? data.uuids : null);
        if (data.address) {
            window.bluetooth.stopDiscovery(function () {
                console.log("stopDiscovery: data:");
                console.log(data ? data.name : null);
                console.log(data ? data.address : null);
                console.log(data ? data.uuid : null);
                data.address = "8C:DE:52:D4:8C:C8";
                //data.address = "8C:DE:52:C3:4C:26";
                window.bluetooth.getUuids(function (uuidData) {
                    console.log("getUuids: data:");
                    console.log(uuidData ? uuidData.name : null);
                    console.log(uuidData ? uuidData.address : null);
                    console.log(uuidData ? uuidData.uuids : null);
                    uuidData.uuids = uuidData.uuids ? uuidData.uuids : ['00001101-0000-1000-8000-00805F9B34FB'];

                    window.bluetooth.connect(function (connectData) {
                        isFPScannerSessionReady = true;
                        window.plugins.toast.show('Session ready', 'short', 'bottom');
                        customFunctions.showBiometricsDialog();
                        //}, fpConnectErrorHandler, {address: uuidData.address, uuid: uuidData.uuids && uuidData.uuids.length ? uuidData.uuids[0] : undefined, conn: 'Hax'});
                    }, fpConnectErrorHandler, {address: uuidData.address, uuid: '00001101-0000-1000-8000-00805F9B34FB', conn: 'Secure'});
                }, fpUuidErrorHandler, data.address);
            });
        }
    }, fpScannerErrorHandler, FP_MAC_ADDRESS);
}


function fpUuidErrorHandler(data) {
    var txDeferred = this;
    //window.plugins.toast.show('fpUuidErrorHandler', 'short', 'bottom');
    console.log(JSON.stringify(data));
    txDeferred.reject(data);
}

function fpConnectErrorHandler(data) {
    var txDeferred = this;
    disconnectFromFingerPrintReader();
    //window.plugins.toast.show('fpConnectError', 'short', 'bottom');
    if (data) {console.log(JSON.stringify(data));}
    txDeferred.reject(data);
}

function fpScannerErrorHandler(error) {
    var txDeferred = this;
    disconnectFromFingerPrintReader();
    customFunctions.closeNotificationDialog();
    txDeferred.reject(error);
}



var pairedDeviceMacAddress  = null;

///   FINGER PRINT PLUGIN
// options holds the image place holder


function getFingerPrint(options) {
    //customFunctions.displayNotificationDialog("Hi", "Searching for fingerprint device", true);
    //alert("checking if bletooth is enabled");
    if (bluetoothIsEnabled()) {
        //alert("bluetooth is nenabled")
        //alert("checking is a device has been paired");
        if (aPairedDeviceExists()) {
            //alert("paired device selected");
            //alert("attempting to connect to device");
            customFunctions.displayNotificationDialog("", "Connecting to fingerprint scanner", true);
            $.when(connectToFingerPrintReader(pairedDeviceMacAddress)) // expecting the image data
                .done(function(data){
                    //alert("connected");
                    //alert("showing the device on the screen")
                    showImageOnPlaceholder(options.item_key, data);
                    customFunctions.closeNotificationDialog();
                    // Display notification to capture the template
                    //alert('Make call to get template');
                    alert(options.template_key);
                    if (options.template_key !== 'undefined'){
                        $.when(getFingerPrintTemplate(pairedDeviceMacAddress))
                            .done(function(templateData){
                                //alert(templateData);
                                Activity.getCurrentStackObject().find('input[name="'+options.template_key+'"]').val(templateData);
                                //alert($('input[name="'+options.template_key+'"]').val());
                                console.log(Activity.getCurrentStackObject().find('input[name="'+options.template_key+'"]').val());
                            })
                            .fail(function(error){
                                alert(JSON.stringify(error));
                            });
                    }
                    //alert("done");
                })
                .fail(function(error){
                    window.plugins.toast.show("Cannot connect to the selected device", "short", "bottom");
                    //alert("couldnt connect to reader: "+error);
                    pairedDeviceMacAddress = null;
                    customFunctions.closeNotificationDialog();
                })
        } else {
            $.when(fpDeviceIsSelected())
                .done(function(deviceMacAddress){
                    //alert("deevice selected: " + deviceMacAddress);
                    pairedDeviceMacAddress = deviceMacAddress;
                    getFingerPrint(options);
                })
                .fail(function(error){
                    customFunctions.closeNotificationDialog();
                    window.plugins.toast.show("No device selected", "short", "bottom");
                });
        }
    } else {
        //alert("enabling bluetooth");
        window.plugins.toast.show("Enabling bluetooth. . .", "short", "bottom");
        enableBluetooth();
        //alert("restarting function");
        getFingerPrint(options);
    }
}

function bluetoothIsEnabled() {
    return isBluetoothReady;
}

function fpDeviceIsSelected() {
    var txDeferred = $.Deferred();
    window.bluetooth.showDevices(function(data) {
        console.log("startDiscovery: data:");
        console.log(data ? data.name : null);
        console.log(data ? data.address : null);
        console.log(data ? data.uuid : null);
        console.log(data ? data.uuids : null);
        if (data.address) {
            txDeferred.resolve(data.address);
            /*window.bluetooth.stopDiscovery(function () {
             console.log("stopDiscovery: data:");
             console.log(data ? data.name : null);
             console.log(data ? data.address : null);
             console.log(data ? data.uuid : null);

             //data.address = "8C:DE:52:D4:8C:C8";
             //data.address = "8C:DE:52:C3:4C:26";
             }) */
        } else {
            txDeferred.reject("Device address not found");
        }
    });
    return txDeferred.promise();
    // show the details activity
    // return the mac addr of the device clicked
}

function aPairedDeviceExists() {
    return pairedDeviceMacAddress && pairedDeviceMacAddress.length;
}

function enableBluetooth() {
    initFPScanner();
}
function disconnectFromFingerPrintReader(){
    window.bluetooth.disconnect();
}

function connectToFingerPrintReader(deviceMacAddress){
    var txDeferred = $.Deferred();

    // window.bluetooth.getUuids(function (uuidData) {
    //     uuidData.uuids = uuidData.uuids ? uuidData.uuids : ['00001101-0000-1000-8000-00805F9B34FB'];
    window.bluetooth.connect(function (connectData) {
        isFPScannerSessionReady = true;
        //window.plugins.toast.show('Session ready', 'short', 'bottom');
        $.when(showFingerprintDialog())
            .done(function(data){
                //disconnectFromFingerPrintReader();
                txDeferred.resolve(data);
            })
            .fail(function(error){
                //disconnectFromFingerPrintReader();
                txDeferred.reject(error);
            })
    }, fpConnectErrorHandler.bind(txDeferred), {address: deviceMacAddress, uuid: '00001101-0000-1000-8000-00805F9B34FB', conn: 'Secure'});
    //}, fpUuidErrorHandler.bind(txDeferred), deviceMacAddress);

    return txDeferred.promise();
}

function getFingerPrintTemplate(deviceMacAddress){
    var txDeferred = $.Deferred();
    //window.bluetooth.connect(function (connectData) {
    //    isFPScannerSessionReady = true;
    //window.plugins.toast.show('Session ready', 'short', 'bottom');
    $.when(showFingerprintTemplateDialog())
        .done(function(data){
            disconnectFromFingerPrintReader();
            txDeferred.resolve(data);
        })
        .fail(function(error){
            disconnectFromFingerPrintReader();
            txDeferred.reject(error);
        });
    //}, fpConnectErrorHandler.bind(txDeferred), {address: deviceMacAddress, uuid: '00001101-0000-1000-8000-00805F9B34FB', conn: 'Secure'});
    return txDeferred.promise();
}

function showFingerprintDialog (options) {
    var txDeferred = $.Deferred();
    customFunctions.closeNotificationDialog();
    retrycount = 0;
    navigator.notification.confirm(
        'Click on "Capture", then place your finger on the device until you hear the device beep', // message
        captureDialog.bind(txDeferred), // callback to invoke with index of button pressed
        'Step 1 of 2: Capture Fingerprint', // title
        ['Capture', 'Cancel'] // buttonLabels
    );
    return txDeferred.promise();
} //showFingerprintTemplateDialog

function showFingerprintTemplateDialog (options) {
    var txDeferred = $.Deferred();
    customFunctions.closeNotificationDialog();
    retrycount = 0;
    navigator.notification.confirm(
        'Thank you. Click on "Reconfirm", then place the same finger on the device until you hear the device beep', // message
        captureTemplateDialog.bind(txDeferred), // callback to invoke with index of button pressed
        'Step 2 of 2: Reconfirm Fingerprint', // title
        ['Reconfirm', 'Cancel'] // buttonLabels
    );
    return txDeferred.promise();
} //showFingerprintTemplateDialog

function captureDialog (buttonIndex) {
    if (buttonIndex == 1) {
        var txDeferred = this;
        customFunctions.displayNotificationDialog("Please Wait", "Listening for a fingerprint.", true);
        window.plugins.toast.show("Please place your finger on the Fingerprint scanner", "short", "bottom");
        window.bluetooth.getFingerprint(function(data) {
            console.log("getFingerprint:" + (data ? data.length : data));
            customFunctions.closeNotificationDialog();
            txDeferred.resolve(data);
        }, fpScannerErrorHandler.bind(txDeferred));//, FP_MAC_ADDRESS);
    }
}//captureTemplateDialog

function captureTemplateDialog (buttonIndex) {
    if (buttonIndex == 1) {
        var txDeferred = this;
        customFunctions.displayNotificationDialog("Please Wait", "Listening for a fingerprint.", true);
        window.plugins.toast.show("Please place your finger on the Fingerprint scanner", "short", "bottom");
        window.bluetooth.getTemplate(function(data) {
            console.log("getFingerprint:" + (data ? data.length : data));
            customFunctions.closeNotificationDialog();
            txDeferred.resolve(data);
        }, fpScannerErrorHandler.bind(txDeferred));//, FP_MAC_ADDRESS);
    }
}//captureTemplateDialog

function showImageOnPlaceholder(placeholder,imageData) {

    //alert(placeholder);
    var target = $('img[name="'+placeholder+'"]').attr('src', "data:image/bmp;base64," + imageData);

}


function matchFingerprints(baseKeys, refKeys, threshold, forceFinger, successCallback, errorCallback) {
    customFunctions.displayNotificationDialog("Please Wait", "Checking fingerprints", true);
    if(Array.isArray(baseKeys) && Array.isArray(refKeys)) {
        var baseTemplates   = [];
        var refTemplates    = [];
        var thresh          = threshold || null;

        var item;
        for(var i = 0; i < baseKeys.length; i++) {
            if (baseKeys[i] && (item = getTemplate(baseKeys[i]))) {
                item.finger = forceFinger || item.finger;
                baseTemplates.push(item);
            }
        }

        for(var i = 0; i < refKeys.length; i++) {
            if (refKeys[i] && (item = getTemplate(refKeys[i]))) {
                item.finger = forceFinger || item.finger;
                refTemplates.push(item);
            }
        }
        //alert(JSON.stringify(baseTemplates));
        //alert(JSON.stringify(refTemplates));
        if (baseTemplates.length > 0 && refTemplates.length > 0) {
            window.bluetooth.matchFingerprints(baseTemplates, refTemplates, thresh, function (matchScore) {
                    customFunctions.closeNotificationDialog();
                    if (successCallback) {
                        successCallback(matchScore);
                    }
                },
                function (error) {
                    customFunctions.closeNotificationDialog();
                    if (errorCallback) {
                        errorCallback(error);
                    }
                });
        } else {
            customFunctions.closeNotificationDialog();
            if (errorCallback) {
                errorCallback("The fingerprints cannot be empty");
            }
        }
    } else {
        customFunctions.closeNotificationDialog();
        alert('Invalid parameters');
        return null;
    }

}
