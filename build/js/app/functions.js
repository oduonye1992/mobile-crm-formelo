var customFunctions = {
    "logout": function(force) {
        var doLogout = function(){
            if (getUserCredentials()){
                Users.logoutUser(getUserCredentials().id, getUserCredentials().realm);
            }
            localStorage.removeItem("credentials");
            localStorage.removeItem("dummy");
            window.plugins.toast.show("See you soon! :)", 'short', 'bottom');
            //openPrivateChannel();
            gotoCompanySplashScreen();
        };
        if (force == true){
            doLogout();
        } else {
            $.when(app.form.protect())
                .done(function() {
                    $.when(customFunctions.confirmLogin())
                        .done(function(){
                            // first clear the database then clear the local storage
                            doLogout();
                        })
                });
        }
    },
    "confirmLogin": function() {
        var txDeferred  = $.Deferred();
        navigator.notification.confirm(
            'Do you want to logout?', // message
            function(buttonIndex) {
                if (buttonIndex == 1) { // yes
                    txDeferred.resolve();
                }
            },
            'Logout?', ['Yes', 'No'],
            '' // defaultText
        );

        return txDeferred.promise();
    },
    "clearDatabase": function(){
        var txDeferred = $.Deferred();

        var sql = "DELETE FORM_DATA WHERE OWNER = '"+getUserCredentials().username+"'";
        $.when(DB.execute(sql))
            .done(function(){
                sql = "DELETE INBOX WHERE OWNER = '"+getUserCredentials().username+"'";
                $.when(DB.execute(sql))
                    .done(function(){
                        sql = "DELETE FORM_CONFIG WHERE OWNER = '"+getUserCredentials().username+"'";
                        $.when(DB.execute(sql))
                            .done(function(){
                                txDeferred.resolve();
                            })
                            .fail(function(error){
                                txDeferred.reject(error);
                            });
                    })
                    .fail(function(error){
                        txDeferred.reject(error);
                    });
            })
            .fail(function(error){
                txDeferred.reject(error);
            });

        return txDeferred.promise();
    },
    "executeScript": function(code) {
        //fetch the contents of the scripss

        var evalScript = app.scripts[code];
        eval(evalScript);
        //alert('sd');
        //customFunctions.goto(3,false);
    },
    "goto": function(pageNumber, isKnown) {
        var formRef = nav_options.formRef;
        //var nextPage = 'forms_' + formRef + '_' + (pageNumber);
        var nextPage = Activity.getStackSlug() + formRef + '_' + (pageNumber);

        formPageNumber = pageNumber;

        customFunctions.updateHistory(nextPage);

        $.mobile.changePage("#" + nextPage, {
            transition: "none"
        });
    },
    gotoNext: function() {
        customFunctions.goto(nav_options.current_page + 1);
    },
    gotoPrevious: function() {

    },
    "goBack": function(isReset) {
        if (isReset) {
            $.when(app.form.protect())
                .done(function() {
                    app.form.clear();
                    formPageNumber = -1; // reset the form state monitor
                    history.back();
                });
        } else {
            history.back();
            formPageNumber--; // decrement the form state monitor;
        }
    },
    "updateHistory": function(page) {
        nav_options.previous_page = nav_options.current_page;
        nav_options.current_page = page;
    },
    "showLoad": function(item, icon) {
        alert(item);
    },
    "getCoordinates": function(options) {
        customFunctions.displayNotificationDialog("Please Wait", "Getting your location. . .");
        if (window.navigator.geolocation) {
            var option = {
                maximumAge: 0,
                timeout: 10000,
                enableHighAccuracy: true
            };
            window.navigator.geolocation.getCurrentPosition(function(position) {
                Activity.getCurrentStackObject().find('input[name="' + options.item_key + '"]').val(position.coords.longitude + "," + position.coords.latitude + "," + moment());
                customFunctions.closeNotificationDialog();
                if (isonline()) {
                    customFunctions.drawMap(options.placeholder, new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
                } else {
                    showMessage("Please connect to a network to view on map");
                }
                customFunctions.closeNotificationDialog();
            }, function(err){
                customFunctions.closeNotificationDialog();
                showMessage('Kindly turn on GPS in your location settings');
            }, option);
        } else {
            customFunctions.closeNotificationDialog();
            showMessage("Geolocation is not supported on this phone", 'short', 'bottom');
        }
    },
    "drawMap": function(placeholder, latlng) {
        var myOptions = {
            zoom: 15,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        Activity.getCurrentStackObject().find('#' + placeholder).css('display', 'block');
        var map = new google.maps.Map(document.getElementById(placeholder), myOptions);

        // Add an overlay to the map of current lat/lng
        var marker = new google.maps.Marker({
            position: latlng,
            animation: google.maps.Animation.DROP,
            map: map,
            title: "Your Location!"
        });
    },
    "errors": function(error) {
        customFunctions.closeNotificationDialog();
        if (error.code == 3) {
            showMessage("To get your location, Turn on location settings and try again", 'short', 'bottom');
            location_global = null;
        }
    },
    "position": function(position) {
        alert(JSON.stringify(position));
        customFunctions.closeNotificationDialog();
    },
    "getGPS": function(callback) {
        if (!navigator.geolocation) return;
        var option = {
            maximumAge: 0,
            timeout: 6000,
            enableHighAccuracy: true
        };
        navigator.geolocation.getCurrentPosition(function(position) {
            var currLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            //callback(position);
        }, function(error) {
            callback(error);
        }, option);
    },
    "displayNotificationDialog": function(title, message, _cancellable) {
        window.plugins.spinnerDialog.show("",message, true);
        dialogIsRunning =  true;
    },
    "closeNotificationDialog": function() {
        if (dialogIsRunning == false){
            return false;
        }
        window.plugins.spinnerDialog.hide();
        dialogIsRunning =  false;
    },
    "validateEmail": function(email) {
        var validOrNot = true;
        var atpos = email.indexOf("@");
        var dotpos = email.lastIndexOf(".");
        if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= email.length) {
            validOrNot = false;
        } else {
            validOrNot = true;
        }
        return validOrNot;
    },
    "validateUrl": function(url) {
        var validOrNot = true;
        var myRegExp = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
        if (!myRegExp.test(url)) {
            validOrNot = false;
        } else {
            validOrNot = "true";
        }
        return validOrNot;
    },
    "validateNumber": function(number) {
        var validOrNot = true;
        if (!number.match(/^\d+/)) {
            validOrNot = false;
        }
        return validOrNot;
    },
    "displayInboxDetail": function(mode) {
        var txDeferred = $.Deferred();
        if ($('#form_inbox_preview').length){
            $('#inbox-body-tab').html('');
            $('#inbox-forms-tab').html('');
            $('#inbox-url-tab').html('');
            $('#inbox-header').html('');
        } else {

            var html = '<div id="form_inbox_preview"  data-role="page" data-fullscreen="true">' +

                '<div data-role="header" xstyle="height: 10% !important;" data-position="fixed" data-tap-toggle="false">' +
                '<h1 style="text-align: center;">Inbox</h1>' +
                '<a data-rel="back" class="ui-btn ui-btn-left header-link"><i class="pg-arrow_left_line_alt"></i> Inbox</a>' +
                //tabs +
                '</div>' +

                '<div role="main">' +
                    '<div id = "inbox-meta" class="3-margin-bottom-o-vh"></div>'+
                    '<ul class="nav nav-tabs nav-tabs-simple" role="tablist">'+
                        '<li id="activeItem" class="active"><a id="nav-inbox-body-tab" href="#inbox-body-tab" data-toggle="tab" role="tab">Message</a>'+
                        '</li>'+
                        '<li><a id="nav-inbox-url-tab" href="#inbox-url-tab" xclass="hidden-content" data-toggle="tab" role="tab">Links</a>'+
                        '</li>'+
                        '<li><a id="nav-inbox-forms-tab" href="#inbox-forms-tab" xclass="hidden-content" data-toggle="tab" role="tab">Actions</a>'+
                        '</li>'+
                    '</ul>'+
                    '<div class="tab-content">'+
                        '<div class="tab-pane active slide-left" id = "inbox-body-tab">'+
                        '</div>'+
                        '<div class="tab-pane slide-left" id = "inbox-url-tab">'+
                        '</div>'+
                        '<div class="tab-pane slide-left" id = "inbox-forms-tab">'+
                        '</div>'+
                    '</div>'+
                '</div>' +
                (mode == 'private' ?  app.html_factory.getFooterHTML() : app.html_factory.getPublicFooterHTML()) +
                '</div>';
            $('body').appends(html);
            adjustHeightsToViewport();
        }

        $(":mobile-pagecontainer").pagecontainer('change', '#form_inbox_preview', {
            transition: "none"
        });

        resetAllNavIndicators();
        $('ul li a.nav_item_inbox span').addClass("nav-active");
        txDeferred.resolve();
        return txDeferred.promise();
    },
    "InboxHandler": function() {
        //debug("inbox handler, fetching data from server", "alert");
        var inboxData = customFunctions.fetchServerMessage();
        //debug("data= " + JSON.stringify(inboxData.results[0].views), "alert");
        $.each(inboxData.results[0].views, function(idx, obj) {
            customFunctions.saveToDB(obj);
        });
    },
    "saveToDB": function(subject, message, dates) {

        var sql = 'INSERT INTO INBOX (SUBJECT, BODY, OPENED, LAST_MODIFIED_TIME) VALUES ("' + subject + '", "' + message + '", "N", date("now"))';

        return initFunctions.database.execute(sql);

    },
    "fetchServerMessage": function() {
        targetURL = defaultUrl;
        var inbox = "";
        $.ajax({
            type: "POST",
            url: targetURL,
            async: false,
            success: function(data) {
                alert("success, returning data: " + JSON.stringify(data.results[0].views));
                inbox = data;
            },
            error: function(xhr) {
                alert(JSON.stringify(xhr));
            }
        });
        return inbox;
    },
    "displayPicturePopup": function(options) {

        var image = $(options).attr('src');
        if (image == "img/signature.png" || image == "img/fingerprint.png" || image == "img/camera.png") {
            //window.plugins.toast.show("Press the Capture button to continue", 'short', 'bottom');
        } else {

        }
    },
    "getPicture": function(options) {
        capturePhoto(options);
        customFunctions.displayPicturePopup(options);
    },
    playAudio: function(key){
        var source = key+"_source";
        alert('bout to play audio');
        var path = $('#'+source).attr('path');
        alert('Playing: '+path);
        var media = new Mediaac(path, function(){
            alert('loaded aac player');
        }, function(){
            alert('failed to load aac player');
        });
        media.play();
        showMessage('Playing. . .', 'short', 'bottom');
    },
    getAudio: function(options){
        var captureSuccess = function(mediaFiles) {
            try{
                var i, path, len;
                for (i = 0, len = mediaFiles.length; i < len; i += 1) {
                    path = mediaFiles[i].fullPath;
                    var audioFile = mediaFiles[i];
                    alert(JSON.stringify(audioFile));
                    var file = new window.File(audioFile.name, audioFile.localURL,
                        audioFile.type, audioFile.lastModifiedDate, audioFile.size);
                    getData(file, function(encoded){
                        var audioPlaceholder = options.item_key;
                        var audioSource = options.item_key+'_source';
                        var audio = document.getElementById(audioPlaceholder);
                        var source = document.getElementById(audioSource);
                        source.src = encoded;
                        Activity.getCurrentStackObject().find('#'+audioSource).attr('path', audioFile.localURL);
                        audio.load();
                        var media = new Mediaac(audioFile.localURL, function(){
                            alert('loaded aac player');
                        }, function(){
                            alert('failed to load aac player');
                        });
                        media.play();
                        media.stop();
                        media.release();
                        showMessage('Playing. . .', 'short', 'bottom');
                    });
                }
            } catch(e){
                alert(JSON.stringify(e));
            }
        };
        var getData = function(audioFile, callback){
            try {
                var reader = new FileReader();
                reader.readAsDataURL(audioFile);
                reader.onload = function(event) {
                    alert('loaded audio');
                    alert(event.target.result.substr(0, 100));
                    callback(event.target.result);
                };
                reader.onerror = function(e){
                    alert('error');
                    console.log(JSON.stringify(e));
                };
            } catch (e){
                alert(JSON.stringify(e));
            }
        };
        var captureError = function(error) {
            alert('Error code: ' + error.code, null, 'Capture Error');
        };
        navigator.device.capture.captureAudio(captureSuccess, captureError, {limit:1});
    },
    "getVideo": function(options) {
        customFunctions.loadVideo(3, true, true, options.item_key);
    },
    "loadVideo": function(duration, highquality, frontcamera, video) {
        window.plugins.videocaptureplus.captureVideo(
            function(mediaFiles) {
                customFunctions.captureSuccess(mediaFiles, video);
            },
            function(error) {
                alert('Returncode: ' + JSON.stringify(error.code));
            }, {
                limit: 1,
                duration: duration,
                highquality: highquality,
                frontcamera: frontcamera
            }
        );
    },
    "captureSuccess": function(mediaFiles, video) {
        var i, len;
        for (i = 0, len = mediaFiles.length; i < len; i++) {
            var mediaFile = mediaFiles[i];
            alert(JSON.stringify(mediaFile));
            $('video[name="' + video).attr("src", mediaFile.fullPath);
        }
    },
    "getSignature": function(options) {
        customFunctions.diplaySignaturePad(options);
    },
    "diplaySignaturePad": function(options) {
        if ($('#signature_pad_popup').length) {
            $('#signature_pad_popup').remove();
        }
        var html = '<div data-role="popup" id="signature_pad_popup" xdata-theme="b" xdata-overlay-theme="b" data-dismissible="true" style="width:100% !important;">' +
            '<div data-role="header" xdata-theme="b">' +
                //'<h1>Scribble Signature</h1>' +
            '</div>' +
            '<div role="content" xclass="ui-content">' +
            '<div class="sigPad">' +
            '<div class="sigPad">' +
            '<canvas class="pad" height="230" xwidth="270" style="border-style: solid; border-width: medium; width:100% !important;"></canvas>' +
            '<hr>' +
            '<button style = "margin-left: 3px !important" type="submit" id="getsignature" class="ui-btn ui-btn-inline" data-rel="back">Done</button>' +
            '<button class="ui-btn ui-btn-inline" type="aa">Clear</button>' +
            '</div>' +
            '</div>' +
            '</div>';

        $($.mobile.activePage).appends(html);
        $('.sigPad').signaturePad({
            drawOnly: true,
            defaultAction: 'drawIt',
            validateFields: false,
            lineWidth: 0,
            output: null,
            sigNav: null,
            name: null,
            typed: null,
            clear: 'button[type=aa]',
            typeIt: null,
            drawIt: null,
            typeItDesc: null,
            drawItDesc: null
        });
        $('#getsignature').click(function() {
            var signatureImage = $('.sigPad').signaturePad().getSignatureImage();
            //alert(signatureImage);
            $('#signature_pad_popup').remove();
            customFunctions.displaySignature(options, signatureImage);
        });
        //$('.sigPad').signaturePad({drawOnly:true});
        $('#signature_pad_popup').popup().popup('open');


    },
    "displaySignature": function(options, imageData) {
        var target = Activity.getCurrentStackObject().find('img[name="' + options.item_key + '"]').attr('src', imageData).addClass('large');
    },
    "deletePicture": function(targetID) {
        var elementID = Activity.getCurrentStackObject().find(targetID).attr('for');
        var type = Activity.getCurrentStackObject().find(targetID).attr('extra');
        var image = "";
        if (type == "image") {
            image = "img/camera.png";
        } else if (type == "fingerprint") {
            image = "img/fingerprint.png";
        } else {
            image = "img/signature.png";
        }
        Activity.getCurrentStackObject().find('img[id="' + elementID + '"]').attr('src', image).removeClass('large');
    },
    "getFingerPrint": function(options) {
        FINGER_PRINT_KEY = options.item_key;

        if (!isBluetoothReady) {
            initFPScanner();
            return;
        } else {
            if (!isFPScannerSessionReady) {
                navigator.notification.confirm(
                    'Please switch on the finger print reader and click OK', // message
                    customFunctions.initilizeDialog, // callback to invoke with index of button pressed
                    'Initialize Bluetooth', // title
                    ['OK', 'Cancel'] // buttonLabels
                );
            } else {
                startDiscovery();
            }
        }

    },
    "getBarcode": function(options) {
        window.plugins.BarcodeScanner.scan(
            function(result) {
                Activity.getCurrentStackObject().find('input[name="' + options.item_key + '"]').val(result.text);
            },
            function(error) {
                //debug("Scanning failed: " + error), "alert" ;
            }
        );
    },
    "removeBarcode": function(options) {
        Activity.getCurrentStackObject().find('input[name="' + options.item_key + '"]').val("");
    },
    "initilizeDialog": function(buttonIndex) {
        if (buttonIndex == 1) {
            startDiscovery();
        }
    },
    "displaySessionReconnectPopup": function() {
        customFunctions.closeNotificationDialog();
        //$.mobile.loading("hide");
        retrycount = 0;
        //window.plugins.toast.show('retrycount set to '+retrycount, 'short', 'bottom');
        navigator.notification.confirm(
            'Please restart your finger print device and tap the retry button after you hear the device beep', // message
            customFunctions.initilizeDialog, // callback to invoke with index of button pressed
            'Error connecting to device', // title
            ['Retry', 'Cancel'] // buttonLabels
        );


    },
    "reInitilizeDialog": function(buttonIndex) {
        if (buttonIndex == 1) {
            $.mobile.loading("show", {
                text: "Reconnecting",
                textVisible: true,
                theme: "b",
                html: ""
            });
            navigator.bluetooth.enable(function() {
                isBluetoothReady = true;
            }, fpScannerErrorHandler);
            startDiscovery();
        }
    },
    "showBiometricsDialog": function(options) {
        //$.mobile.loading("hide");
        customFunctions.closeNotificationDialog();
        retrycount = 0;
        //window.plugins.toast.show('retry count now set to '+retrycount, 'long', 'bottom');
        navigator.notification.confirm(
            'press the Capture button then place your finger on the device until you hear the device beep', // message
            customFunctions.captureDialog, // callback to invoke with index of button pressed
            'Capture FingerPrint', // title
            ['Capture', 'Cancel'] // buttonLabels
        );
        //trigger the second event

    },
    "captureDialog": function(buttonIndex) {
        if (buttonIndex == 1) {
            customFunctions.displayNotificationDialog("Please Wait", "Scanning fingerprint");
            navigator.bluetooth.getFingerprint(function(data) {
                customFunctions.closeNotificationDialog();
                onFPDataSuccess(data, true);
            }, fpScannerErrorHandler, FP_MAC_ADDRESS);
        }
    },
    "protect": function() {
        var confirmationDeferred = $.Deferred();
        if (app.form.isActive()) {
            app.constructors.createFormConfirmationDialog(app.activeFormRef, confirmationDeferred);
        } else {
            confirmationDeferred.resolve();
        }
        return confirmationDeferred.promise();
    }
};

var initFunctions = {
    "getFormConfigByRef": function(formRef) {
        var tx = $.Deferred();
        if(APPLET_MODE == 'private'){
            $.when(privateCtlr.fetchApplet(formRef))
                .done(function(data){
                    tx.resolve(data);
                })
        } else {
            $.when(publicCtlr.getAppletConfig(formRef))
                .done(function(data){
                    tx.resolve(data.applets[formRef]);
                })
                .fail(function(){alert('error')})
        }
        return tx.promise();
    },
    "form_status": {
        "UNPROCESSED": 0,
        "PROCESSING": 1,
        "PROCESSED": 2
    },
    "network": {
        "load": function(resourcePath) {
            var urlPath = resourcePath;
            var loadDeferred = $.Deferred();
            $.ajax({
                url: urlPath,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                cache: false
            }).always(function(obj, status, misc) {
                if (status == "success") {
                    obj = {
                        "id": dummyResourceIDCounter++
                    };
                    loadDeferred.resolve(obj, status, misc);
                } else {
                    xhr = obj;
                    switch (xhr.status) {
                        case 401:
                            initFunctions.logout();
                            break;
                        default:
                            ////console.log("Network Load Error");
                            break;
                    }
                    loadDeferred.reject(obj, status, misc);
                }
            });
            return loadDeferred.promise();
        },
        "save": function(entity, resourcePath) {
            //alert(resourcePath);
            // alert('saving: defaultPath='+defaultPath+", resourcePath="+(resourcePath || '') + ', isModal='+(isModal || ''));////console.log('entity:'); ////console.log(entity);
            // resourcePath = "http://requestb.in/11g9o9c1";
            // alert('in the save function');
            var isNew = !entity.resource_id || entity.resource_id.length == 0;
            var urlPath = resourcePath;
            var saveDeferred = $.Deferred();
            if (getUserCredentials() == null) {
                saveDeferred.reject("User credentials not set");
            }

            $.ajax({
                data: JSON.stringify(entity),
                url: urlPath,
                cache: false,
                dataType: "json",
                headers: {
                    "Authorization": "Basic " + btoa(getUserCredentials().username + ":" + getUserCredentials().api_key)
                },
                contentType: "application/json; charset=utf-8",
                type: isNew ? "POST" : "PUT",
                processData: false,
                timeout: 10000,
                success: function(data) {
                    saveDeferred.resolve(data);
                },
                error: function(xhr, textStatus, errorThrown) {
                    //saveDeferred.reject(JSON.stringify(xhr)+" "+textStatus); //saveDeferred.reject()
                    if(xhr.status == 201) {
                        saveDeferred.resolve();
                    } else if (xhr.statusText == "timeout") {
                        saveDeferred.reject("Taking longer than expected. .  Kindly retry");
                    } else if(xhr.status == 403) {
                        saveDeferred.reject("Incorrect username or password");
                    } else if(xhr.status == 404) {
                        saveDeferred.reject("Cant reach the server, please try again later");
                    } else if(xhr.status == 500) {
                        saveDeferred.reject("The server encountered an error, please try again later");
                    } else {
                        saveDeferred.reject(JSON.stringify(xhr));
                    }
                }
            });

            return saveDeferred.promise();
        }
    },
    "database": {
        "log": function (args) {

            var now = moment().format();
            var sqlA =
                "INSERT INTO FORM_LOG (" +
                " TYPE, " +
                " OWNER, " +
                " FORM_REF, " +
                " TIME " +
                ") VALUES (" +
                " '" + args.type + "', " +
                " '" + args.owner + "', " +
                " '" + args.form_ref + "', " +
                " '" + now + "' " +
                ')';

            return initFunctions.database.execute(sqlA);
        },
        "error": function (error) {
            alert("EsRRORS:" + JSON.stringify(error));
            //////console.log(JSON.stringify(error));
            return false;
        },
        "success": function (msg) {
            //alert("SUCCESS:" + msg);
            ////console.log(msg);
        },
        "execute": function (sql, success) {
            var txDeferred = $.Deferred(); ///data/data/com.phonegap.helloworld/app_webview/databases/
            var DBO = window.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);
            DBO.transaction(function (tx) {
                tx.executeSql(sql, txDeferred.reject,txDeferred.resolve);
            }, txDeferred.reject, txDeferred.resolve);

            return txDeferred.promise();
        },
        "create": function () {
            //var sqlA = "DROP TABLE FORM_DATA";
            //initFunctions.database.execute(sqlA);

            var sql =
                "CREATE TABLE IF NOT EXISTS FORM_DATA (" +
                " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " +
                " RESOURCE_ID           VARCHAR(64)                         NOT NULL, " +
                " FORM_REFERENCE        VARCHAR(64)                         NOT NULL, " +
                " FORM_VERSION          VARCHAR(16)                         NOT NULL, " +
                " TITLE                 VARCHAR(255)                        NOT NULL, " +
                " STATUS                TINYINT                             NOT NULL, " + // 0 - Draft, 1 - Outbox, 2 - Sent
                " ERROR                 TINYINT                             NOT NULL, " + // States if the form has errors
                " DATA                  TEXT                                NOT NULL, " +
                " DESCRIPTION           VARCHAR(255)                        NOT NULL, " +
                " CREATION_TIME         DATETIME                            NOT NULL, " +
                " LOCATION              TEXT                                NULL,     " +
                " SUBMISSION_TIME       DATETIME                            NULL,     " +
                " LAST_MODIFIED_TIME    DATETIME                            NOT NULL,   " +
                " OWNER                 VARCHAR(64)                         NOT NULL,  " +
                " STATS_KEY             VARCHAR(20)                         NULL,  " +
                " MODE                  VARCHAR(20)                         NULL,  " +
                " STATS_VALUE           VARCHAR(64)                         NULL,  " +
                " REALM                 VARCHAR(64)                         NOT NULL,  " +
                " ENDPOINT              VARCHAR(64)                         NOT NULL,  " +
                " API_KEY               VARCHAR(255)                         NOT NULL  " +
                ")";

            initFunctions.database.execute(sql);

            sql =
                "CREATE TABLE IF NOT EXISTS INBOX (" +
                " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " +
                " SENDER                  VARCHAR(64)                         NOT NULL, " +
                " SUBJECT               VARCHAR(255)                        NULL, " +
                " BODY                  TEXT                                NULL, " + // 0 - Draft, 1 - Outbox, 2 - Sent
                " OPENED                VARCHAR(2)                          NULL,     " +
                " LAST_MODIFIED_TIME    DATETIME                            NULL,  " +
                " USER                  TEXT                                NULL,  " +
                " FORMS                 TEXT                                NULL, " +
                " LINKS                 TEXT                                NULL,  " +
                " IMAGE                 TEXT                                NULL,  " +
                " REALM                 VARCHAR(64)                         NULL  " +
                ")";

            initFunctions.database.execute(sql);


            sql =
                "CREATE TABLE IF NOT EXISTS FORM_CONFIG (" +
                " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " + //1                             2                               3
                " TIMESTAMP             VARCHAR(64)                             NULL, " + //"2233"                            "2234"                          "550011"
                " UPDATABLE             VARCHAR(1)                              NULL, " + //"2233"                            "2234"                          "550011"
                " CONFIG                VARCHAR(64)                         NOT NULL,  " + //"SIPML Client Records"            "SIPML Client Records"          "Diamond Bank HR"
                " OWNER                 TEXT                                NOT NULL,  " +
                " REALM                 VARCHAR(64)                         NOT NULL  " +
                ")";
            initFunctions.database.execute(sql);


            sql =
                "CREATE TABLE IF NOT EXISTS FORM_DATA_EVENTS (" +
                " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " + //1                               2                               3
                " RESOURCE_ID           VARCHAR(64)                         NOT NULL, " + //"2233"                          "2234"                          "550011"
                " SOURCE                VARCHAR(64)                         NOT NULL, " + //"SIPML Client Records"          "SIPML Client Records"          "Diamond Bank HR"
                " TITLE                 VARCHAR(255)                        NOT NULL, " + //"PIN Created",                  "Invalid Data Submitted",       "Time Off Request Rejected"
                " BODY                  TEXT                                NOT NULL, " + //"The new pin is PEN12344343",   "Contributor already exists"    "You have exceeded your limit"
                " EVENT_TIME            DATETIME                            NOT NULL,  " +
                " OWNER                 TEXT                                NOT NULL  " +
                ")";
            //return initFunctions.database.execute(sql);


            sql =
                "CREATE TABLE IF NOT EXISTS FORM_LOG (" +
                " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " + //1                               2                               3
                " TYPE                  VARCHAR(64)                         NOT NULL, " + //"2233"                          "2234"                          "550011"
                " OWNER                 VARCHAR(64)                         NOT NULL, " + //"SIPML Client Records"          "SIPML Client Records"          "Diamond Bank HR"
                " FORM_REF              VARCHAR(255)                        NULL, " + //"PIN Created",                  "Invalid Data Submitted",       "Time Off Request Rejected"
                " TIME                  DATETIME                            NOT NULL " + //"The new pin is PEN12344343",   "Contributor already exists"    "You have exceeded your limit"
                ")";
            initFunctions.database.execute(sql);

            //return initFunctions.database.execute(sql);

            sql =
                "CREATE TABLE IF NOT EXISTS MAIN_CONFIG (" +
                " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " + //1                               2                               3
                " CONFIG                TEXT                                NOT NULL, " + //"2233"                          "2234"                          "550011"
                " TIME                  DATETIME                            NOT NULL " + //"The new pin is PEN12344343",   "Contributor already exists"    "You have exceeded your limit"
                ")";
            initFunctions.database.execute(sql);

            sql =
                "CREATE TABLE IF NOT EXISTS FAVORITES (" +
                " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " + //1                               2                               3
                " TYPE                  VARCHAR(64)                         NOT NULL, " + //"2233"                          "2234"                          "550011"
                " CONFIG                TEXT                                NOT NULL, " + //"2233"                          "2234"                          "550011"
                " META                  VARCHAR(64)                         NOT NULL, " + //"2233"                          "2234"                          "550011"
                " ENTITY_ID             TEXT                                NOT NULL, " + //"2233"                          "2234"                          "550011"
                " TIME                  DATETIME                            NOT NULL " + //"The new pin is PEN12344343",   "Contributor already exists"    "You have exceeded your limit"
                ")";
            initFunctions.database.execute(sql);

            sql =
                "CREATE TABLE IF NOT EXISTS META_DATA (" +
                " ID                    INTEGER PRIMARY KEY AUTOINCREMENT    NOT NULL, " +
                " KEY                    TEXT                                NOT NULL, " +
                " VALUE                  TEXT                                NULL " +
                ")";
            initFunctions.database.execute(sql);
        },
        "insert": function (args) {
            var formConfig = initFunctions.getFormConfigByRef(initFunctions.escapeQuotes(args.ref));
            if (!formConfig) {
                return;
            }
            var now = moment().format();
            var sqlA =
                "INSERT INTO FORM_DATA (" +
                " RESOURCE_ID, " +
                " FORM_REFERENCE, " +
                " FORM_VERSION, " +
                " TITLE, " +
                " STATUS, " +
                " ERROR, " +
                " OWNER, " +
                " REALM, " +
                " DATA, " +
                " MODE, " +
                " DESCRIPTION, " +
                " CREATION_TIME, " +
                " SUBMISSION_TIME, " +
                " ENDPOINT, " +
                " API_KEY, " +
                " LAST_MODIFIED_TIME" +
                ") VALUES (" +
                " '" + initFunctions.escapeQuotes(args.resource_id) + "', " +
                " '" + initFunctions.escapeQuotes(args.ref) + "', " +
                " '" + initFunctions.escapeQuotes(args.version) + "', " +
                " '" + initFunctions.escapeQuotes(args.title) + "', " +
                " " + args.status + ", " +
                " " + args.isError + ", " +
                " '" + args.owner + "', " +
                " '" + args.realm + "', " +
                " '" + initFunctions.escapeQuotes(typeof args.data == 'object' ? JSON.stringify(args.data) : args.data) + "', " +
                " '" + args.mode + "', " +
                " '" + initFunctions.escapeQuotes(args.description) + "', " +
                " '" + now + "', " +
                " NULL, " +
                " '" + args.endpoint + "', " +
                " '" + args.api_key + "', " +
                " '" + now + "' " +
                ')';

            return initFunctions.database.execute(sqlA);

        },
        "update": function (args) {

            var formConfig = initFunctions.getFormConfigByRef(initFunctions.escapeQuotes(args.ref));
            if (!formConfig) {
                return;
            }
            var now = moment().format();
            var sql =
                "UPDATE FORM_DATA SET " +
                " FORM_VERSION          = '" + initFunctions.escapeQuotes(args.version) + "', " +
                " TITLE                 = '" + initFunctions.escapeQuotes(args.title) + "', " +
                " STATUS                = " + args.status + ", " +
                " ERROR                 = " + args.isError + ", " +
                " OWNER                 = '" + args.owner + "', " +
                " REALM                 = '" + args.realm + "', " +
                " ENDPOINT                 = '" + args.endpoint + "', " +
                " API_KEY                 = '" + args.api_key + "', " +
                " MODE                 = '" + args.mode + "', " +
                " DATA                  = '" + initFunctions.escapeQuotes(typeof args.data == 'object' ? JSON.stringify(args.data) : args.data) + "', " +
                " DESCRIPTION           = '" + initFunctions.escapeQuotes(args.description) + "', " +
                " LAST_MODIFIED_TIME    = '" + now + "' " +
                " WHERE " +
                " ID = " + args.id + " AND " +
                " STATUS < 2";

            return initFunctions.database.execute(sql);

        },  // .overflow-hidden p { display:none}


        "changeStatus": function(args) {
            var txDeferred = $.Deferred();
            var now = moment().format();
            var sql =
                "UPDATE FORM_DATA SET " +
                " STATUS = " + args.status + " ";

            sql += ", SUBMISSION_TIME = '" + now + "' ";
            sql += ", LAST_MODIFIED_TIME = '" + now + "' ";

            sql += " WHERE " +
            " ID = " + args.id + " AND " +
            " STATUS < 2";

            txDeferred.resolve(initFunctions.database.execute(sql));
            return txDeferred.promise();
        },
        "select": function(args) {
            //alert('inside the select function');
            //var txDeferred = $.Deferred();
            var columnMap = {
                "id": "ID",
                "ref": "FORM_REFERENCE",
                "version": "VERSION",
                "title": "TITLE",
                "status": "STATUS",
                "data": "DATA",
                "owner": "OWNER",
                "error": "ERROR",
                "realm": "REALM",
                "description": "DESCRIPTION",
                "creation_time": "CREATION_TIME",
                "submission_time": "SUBMISSION_TIME",
                "last_modified_time": "LAST_MODIFIED_TIME",
            };

            if (!args.columns) {
                return [];
            }

            var columnsClause = [];
            for (var i = 0; i < args.columns.length; i++) {
                var columnCode = columnMap[args.columns[i]];
                if (columnCode) {
                    columnsClause.push(" " + columnCode + " AS " + args.columns[i]);
                }
            }
            var sql = "SELECT " + columnsClause.join(", ") + " FROM FORM_DATA";

            if (args.where) {
                var whereClause = [];
                for (var key in args.where) {
                    var columnCode = columnMap[key];
                    if (columnCode) {
                        var value = args.where[key];
                        if (typeof value == "object" && value.min && value.max) {
                            whereClause.push(" " + columnCode + " BETWEEN '" + value.min + "' AND '" + value.max + "'");
                        } else {
                            whereClause.push(" " + columnCode + " = '" + value + "'");
                        }
                    }
                }
                sql += " WHERE " + whereClause.join(" AND ");
            }
            if (args.order_by && columnMap[args.order_by.column]) {
                sql += " ORDER BY " + columnMap[args.order_by.column] + " " + (args.order_by.ascending ? "ASC" : "DESC");
            }
            if (args.limit && args.limit.offset && args.limit.extent) {
                sql += " LIMIT " + args.limit.offset + ", " + args.limit.extent;
            }
            //alert(sql);
            //////console.log(sql);

            return sql;

           /* $.when(initFunctions.database.execute(sql))
                .done(function(tx, res){
                    alert(sql);
                    alert(JSON.stringify(tx));
                    //alert('res gotten');
                    txDeferred.resolve(tx, res);
                })
                .fail(function(){
                    alert('An error occured');
                   txDeferred.reject();
                });

            return txDeferred.promise(); */

        },
        "delete": function(dataID) {
            var sql =
                "DELETE FROM FORM_DATA " +
                " WHERE " +
                " ID = " + dataID;

            return initFunctions.database.execute(sql);

        }
    },
    "escapeQuotes": function(str) {
        return str ? str.replace(/'/g, "''") : '';
    },
    "captureFilterEvents": function(selectID) {

    }
};

$(document).ready(function() {
    //handleLogin();
    //hideStaticPages();
    //initFunctions.database.create();
    //createLogin();
    //setInterval(synchronizeData, 10000);
});

function checkConnection() {
    var networkState = navigator.network.connection.type;
    var states = {};
    states[Connection.UNKNOWN] = 1; //'Unknown connection';
    states[Connection.ETHERNET] = 2; //'Ethernet connection';
    states[Connection.WIFI] = 3; //'WiFi connection';
    states[Connection.CELL_2G] = 4; //'Cell 2G connection';
    states[Connection.CELL_3G] = 5; //'Cell 3G connection';
    states[Connection.CELL_4G] = 6; //'Cell 4G connection';
    states[Connection.NONE] = 7; //'No network connection';
    networkStatus = states[networkState];
}

function monitorEvents() {
    document.addEventListener('offline', function() {
        networkStatus = 7; // force the network to offline
    }, false);

    document.addEventListener('online', function() {
        checkConnection(); // reset the network connection
        if (APPLET_MODE != ''){
            //SocketController.connect();
        }
    }, false);
}

function isonline() {
    if (networkStatus == 7){// || networkStatus == 7) {
        return false;
    } else {
        return true;
    }
}