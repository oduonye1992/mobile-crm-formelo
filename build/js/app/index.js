var app = function() {
    var nextPage = "";
    var previousPage = "";
    var FORMS_VIEW      = 1;
    var INBOX_VIEW      = 2;
    var DRAFT_VIEW      = 3;
    var OUTBOX_VIEW     = 4;
    var SENT_VIEW       = 5;
    var ERROR_VIEW      = 6;
    var LIBRARY_VIEW    = 7;
    var DASHBOARD_VIEW  = 8;
    // app.currentView = FORMS_VIEW;
    // Public
    var EXPLORE_VIEW        = 9;
    var FAVORITES_VIEW      = 10;
    var SEARCH_VIEW         = 11;
    var EXPLOTE_ITEM_VIEW   = 12;

    var idSequence = 1;
    var debugConfig;

    var showText = "Initialising the awesome. . .";
    var textArray = ["Initialising the awesome. . .", "What good shall I do today?. . ", "Buhaha. . Dont be so serious!", "Please fall in love before you die", "You look like Neyo. . ."];

    return {
        // Application Constructor
        initialize: function() {
            var txDeferred = $.Deferred();
            this.bindEvents();
            txDeferred.resolve();
            return txDeferred.promise();
        },
        activeView: undefined,
        activeFormRef: undefined,
        activeFormData: undefined,
        datasets: {},
        scripts: {},
        // Bind Event Listeners
        //
        // Bind any events that are required on startup. Common events are:
        // 'load', 'deviceready', 'offline', and 'online'.
        bindEvents: function() {
            document.addEventListener('backbutton', this.stopBackBtn, false);
            document.addEventListener('offline', function() {
                networkStatus = 1; // force the network to offline
                checkConnection();
            }, false);
            document.addEventListener('online', function() {
                checkConnection(); // reset the network connection
            }, false);
            $(document).ready(function() {
                $.mobile.useFastClick = true;
                $.mobile.touchOverflowEnabled = true;
                app.onDeviceReady();
            });
            // Start our sync service;
            setInterval(app.startSyncService, 300000); // 5 mins
        },
        // Does nothing when the back button is pressed
        stopBackBtn: function() {
            /*if (app.form.isActive()){
                formPageNumber > 0 ? customFunctions.goBack(false) : customFunctions.goBack(true);
            }*/
        },
        startSync: function(){
            window.plugins.toast.show('Background service has started. . .', 'short', 'bottom');
            app.startSyncService();
        },
        startSyncService : function() {
            if (getUserCredentials()){
                syncPlugin.start(getSubmissionEndpoint(), getUserCredentials().username,getUserCredentials().api_key, function(){
                    }, function(error){}
                );
            }
        },
        revalidateUser: function() {
            var tx = $.Deferred();
                $.when(app.constructors.createValidationPage('validate'))
                    .done(function() {
                        tx.resolve();
                    });

            return tx.promise();
        },
        validate: function(results) {
            if (results.buttonIndex == 1) {
                var pin = results.input1;
                if (pin != window.localStorage.otp) {
                    window.plugins.toast.show('Wrong PIN!', 'short', 'bottom');
                    app.revalidateUser();
                }
            } else if (results.buttonIndex == 2) {
                customFunctions.logout();
            }
        },
        onDeviceReady: function() {
            //if (app.isValidConfig(config)) {
                app.initBluetooth();
                app.initDatasets();
                app.initScripts();
                app.initConfig();
            //} else {
            //    showMessage("Something is wrong with your configuration");
            //}
        },
        isValidConfig: function(conf) {
            return true;
        },
        shuffleText: function() {
            var rand = Math.floor((Math.random() * 5) + 1);
            showText = textArray[rand];
        },
        refreshConfig: function() {
            $.when(app.form.protect())
                .done(function() {
                    if (isonline()) {
                        customFunctions.displayNotificationDialog("Please wait", " Refreshing config");
                        $.when(api.helpers.loadConfFromServer())
                            .done(function(data) {
                                if (data !== '') {
                                    config = data;
                                    $.when(app.initialize())
                                        .done(function() {
                                            customFunctions.closeNotificationDialog();
                                            swal("Up to date.", "", "success");
                                        })
                                        .fail(function(){alert('something bad has occured')});
                                }
                            })
                            .fail(function(tx, error) {
                                customFunctions.closeNotificationDialog();
                                window.plugins.toast.show("Error, couldn't connect to server", 'short', 'bottom');
                                ////////console.log(error);
                            });
                    } else {
                        window.plugins.toast.show("Error: Check your internet connection", 'short', 'bottom');
                    }

                })
        },
        checkIfNewConfigExists: function() {
            return true;
        },
        loadConf: function() {
            var txDeferred = $.Deferred();
            // check if there is an update
            // If there is an update
            $.when(DB.helpers.isUpdatableConfigExists())
                .done(function(data) {
                    //alert(data);
                    //if true
                    if (data) {//alert('updatable config exists')
                        //load the config from the server

                        if (!isonline()) { // If there is no network
                            //window.plugins.toast.show("PLease connect to the internet and try again", 'short', 'bottom');
                            txDeferred.reject("Can\'t connect to the internet");
                        } else {
                            $.when(api.helpers.loadConfFromServer()) // also updates the flag
                                .done(function(data) {
                                    // updates the flag, making sute there is no update
                                    DB.helpers.updateDBSetUpdatableConfig('N');
                                    if (data !== '') {
                                        //sets the config variable to the downloaded config
                                        config = data;
                                        privateCtlr.saveRealmConfig(data);
                                        txDeferred.resolve();
                                    } else {
                                        txDeferred.reject("Invalid config");
                                        //window.plugins.toast.show("No data from config", 'short', 'bottom');
                                    }
                                })
                                .fail(function(tx, error) {
                                    txDeferred.reject(error);
                                });
                        }
                    } else { // or else, load the conf from the db or load from the server
                        $.when(DB.helpers.configExists()) //check if the config exists
                            .done(function(data) {
                                if (data === true) {
                                    //if config exists, load the config from the database
                                    $.when(DB.helpers.getConfigFromDatabase())
                                        .done(function(data) {
                                            //strip out the '//' tags
                                            //var newData = data.replace('\\"', ""); //  str.replace(/'/g, "''")
                                            //set the config variable to the config object
                                            config = JSON.parse(data);
                                            txDeferred.resolve();
                                        }) //handle errors
                                        .fail(function(error) {
                                            txDeferred.reject("Error loading the config from the database : " + error);
                                        });
                                } else {
                                    // load the config from the server ( Which will also save it into the database)s
                                    if (!isonline()) { // If there is no network
                                        //window.plugins.toast.show("Please connect to the internet and try again", 'short', 'bottom');
                                        txDeferred.reject("Cannot connect to the internet");
                                    } else {
                                        $.when(api.helpers.loadConfFromServer()) //Load the config from the server

                                            .done(function(data) {
                                                DB.helpers.updateDBSetUpdatableConfig('N'); // update the config flag
                                                if (data !== '') {
                                                    //set the config variable to hold the loads of configuration
                                                    ///alert(JSON.stringify(data));
                                                    config = data;
                                                    privateCtlr.saveRealmConfig(data);
                                                    txDeferred.resolve();
                                                } else {
                                                    txDeferred.reject("No config from the server");
                                                }
                                            })
                                            .fail(function(error) {
                                                txDeferred.reject("Error getting the config from the server; debug: " + error);
                                            });
                                    }

                                }
                            })
                            .fail(function(error) {
                                txDeferred.reject("Error checking if config exists");
                            });
                    }
                })
                .fail(function(error) {
                    txDeferred.reject(error);
                });
            return txDeferred.promise();
        },
        initBluetooth: function() {
            if (!isBluetoothReady) {
                initFPScanner();
            }
        },
        initConfig: function() {
            app.constructors.createFormGroupList(config);
        },
        initScripts: function(_conf) {
            var conf = _conf || config;
            if (conf.scripts) {
                for (var key in conf.scripts) {
                    app.scripts[key] = conf.scripts[key];
                }
            } else {
                console.log(JSON.stringify(conf));
            }
        },
        initDatasets: function(conf) {
            var mainConfig = conf || config;
            if (!mainConfig.datasets) {
                return;
            }
            try{
                for (var key in mainConfig.datasets) {
                    if(mainConfig.datasets.hasOwnProperty(key)){
                        var dataset = mainConfig.datasets[key];
                        app.datasets[key] = {
                            data : dataset['items']
                        };
                    }
                }
            } catch(e){
                alert(JSON.stringify(e));
            }
        },
        createElementID: function(elementType) {
            return 'autogenerated-' + elementType + '-' + idSequence++;
        },
        constructors: {
            createFormGroupList: function(xconf) {
                var conf = config;
                var form_group_list = $('#form_group_list');
                //if (form_group_list.length) {
                //    form_group_list.html('');
                //}
                form_group_list.html('');
                var panelName = "formgrouplist";
                bodyContainer.pagecontainer('change', '#form_group_list', {
                    transition: "none"
                });
                var html = //'<div id="form_group_list" data-role="page" data-id="myPage">' +
                                '<div data-role="header" data-position="fixed" class="blue-gradient" data-tap-toggle="false" data-hide-during-focus="false">'+
                                    '<a class="ui-btn ui-btn-left header-link" onclick="gotoCompanySplashScreen()"><img class="home-link" src="img/formelo-icon.png" style="width: 24px;"></a>'+
                                    '<h1 id="xdata-list-header">Home</h1>'+
                                    '<a href="#'+panelName+'" class="ui-btn ui-btn-right header-link"><i class="fa fa-bars"></i></a>'+
                                '</div>'+
                                app.html_factory.getPanelHTML(panelName, false, {}) +
                                app.html_factory.getFormsListContentHTML(conf) +
                                app.html_factory.getFooterHTML();
                            //</div>';
                nav_options.current_page = "form_group_list";
                form_group_list.html(html).trigger("create");
                //adjustHeightsToViewport();
                var clickable = $(".clickable");
                clickable.on('click', function(event){
                    clickable.prop('disabled',true);
                    var ref = $(this).attr('form-ref');
                    event.stopPropagation();
                    function openForm(){
                        $.when(app.events.onFormClicked(event, ref))
                            .done(function(){}).fail(function(){});
                    }
                    openForm();
                    clickable.prop('disabled',false);
                });
                resetAllNavIndicators();
                $('ul li a.nav_item_forms span').addClass("nav-active");
                app.currentView = FORMS_VIEW;
            },
            createValidationPage: function(mode) {
                var tx = $.Deferred();
                var form_revalidation_page = $('#form_revalidation_page');
                if (form_revalidation_page.length) {
                    form_revalidation_page.remove();
                }
                var panelName = "#ddasassd";
                var retries = 5;
                var title = mode == 'create' ? "Setup your Passcode" : 'Enter your Passcode';
                var logoutHtml = mode == 'validate' ? '<a class="ui-btn ui-btn-right header-link" onclick="customFunctions.logout();">Logout <i class="pg-close_line"></i></a>' : '';


                var html = '<div id="form_revalidation_page"  data-role="page">' +
                    '<div data-role="header" class="blue-gradient" data-position="fixed" class="wow fadeIn" data-tap-toggle="false">' +
                    (mode == 'validate' ? '<a class=" logout-button ui-btn ui-btn-left header-link" onclick="openPrivateChannel()"><i class="pg-arrow_left_line_alt"></i> Back</a>' : '')+
                    '<h1 id="revalidateusertitle" style="text-align: center; text-overflow: clip;">'+title+'</h1>'+
                    logoutHtml +
                    '</div>'+

                    '<div role="main">' +

                        '<div class="row 20-margin-top-vh" style="xheight: 300px; max-width: 300px; margin: auto; text-align: center; xmargin-top: 25%;">'+

                            '<div class="content col-xs-12 col-sm-12 col-md-12" style="padding-bottom: 20px;">'+
                                '<div>' +
                                    '<div class="row" xstyle="margin: auto; padding: 5px; max-width: 200px">'+
                                        '<div class="col-xs-3 col-sm-3 col-md-3 passwordview passview1">'+
                                        '<div style="border-bottom:1px solid #808080; padding-bottom: 15px;">.</div>'+
                                        '</div>'+
                                        '<div class="col-xs-3 col-sm-3 col-md-3 passwordview passview2" style="">'+
                                        '<div style="border-bottom:1px solid #808080; padding-bottom: 15px;">.</div>'+
                                        '</div>'+
                                        '<div class="col-xs-3 col-sm-3 col-md-3 passwordview passview3" style="">'+
                                        '<div style="border-bottom:1px solid #808080; padding-bottom: 15px;">.</div>'+
                                        '</div>'+
                                        '<div class="col-xs-3 col-sm-3 col-md-3 passwordview passview4" style="">'+
                                        '<div style="border-bottom:1px solid #808080; padding-bottom: 15px;">.</div>'+
                                        '</div>'+
                                    '</div>'+
                                '</div>'+
                            '</div><br/>'+

                            '<div class="col-xs-12 col-sm-12 col-md-12">'+
                                '<div class="row 40-vh" style = "xheight:300px">'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="1""><span class="clickableNumber" num-id="1">1</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="2"><span class="clickableNumber" num-id="2">2</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="3"><span class="clickableNumber" num-id="3">3</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="4"><span class="clickableNumber" num-id="4">4</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="5"><span class="clickableNumber" num-id="5">5</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="6"><span class="clickableNumber clickableNumber" num-id="6">6</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="7"><span class="clickableNumber" num-id="7">7</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="8"><span class="clickableNumber" num-id="8">8</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="9"><span class="clickableNumber" num-id="9">9</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder"><div class="numberkey"></div>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder numberCircular" num-id="0"><span class="clickableNumber" num-id="0">0</span>'+

                                    '</div>'+
                                    '<div class="col-xs-4 col-sm-4 col-md-4 numberHolder"><div class="numberkey"></div>'+

                                    '</div>'+

                                '</div>'+
                            '</div>'+
                            '<div class="col-xs-12 col-sm-12 col-md-12">'+
                                '<p id="delete" style=" color: grey; padding: 20px;float: right">Clear</p>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+

                    '</div>';
                //startSyncService
                nav_options.current_page = "form_revalidation_page";
                BODY.appends(html);

                bodyContainer.pagecontainer('change', '#form_revalidation_page', {
                    transition: "none"
                });
                adjustHeightsToViewport();

                //passview2
                var passcodes = {
                    revalidateMode : {
                        count : 0,
                        val : ''
                    },
                    createCode:{
                        pass1:0,
                        pass2:0
                    }
                };
                $('#form_revalidation_page #delete').click(function(){
                    passcodes.revalidateMode.val        = '';
                    passcodes.revalidateMode.count      =  '';
                    passcodes.createCode.pass1          = 0;
                    passcodes.createCode.pass2          = 0;
                    $('.passview1').html('.');
                    $('.passview2').html('.');
                    $('.passview3').html('.');
                    $('.passview4').html('.');
                });

                $('.clickableNumber').click(function(event){
                    var num = $(this).attr('num-id');
                    $(this).addClass("animated pulse grey-bg");
                    var that = $(this);
                    setTimeout(function(){that.removeClass("animated pulse grey-bg");},100);
                    passcodes.revalidateMode.val += num;
                    var length = passcodes.revalidateMode.val.length;
                    $('.passview'+length).html('<i style="color:#C0C0C0;" class="fa fa-circle animated bounceIn"></i>');
                    if(length == 4){
                        if(mode == 'create'){
                            if(passcodes.createCode.pass1 == 0){
                                passcodes.createCode.pass1 = parseInt(passcodes.revalidateMode.val);
                                $('.content').addClass("animated bounce");
                                window.plugins.toast.show("Enter the passcode again", "short", "bottom");
                                $('#revalidateusertitle').html('Confirm your Passcode');
                                passcodes.revalidateMode.val = '';
                                $('.passview1').html('.');
                                $('.passview2').html('.');
                                $('.passview3').html('.');
                                $('.passview4').html('.');
                            } else {
                                // Make comparism
                                if(passcodes.createCode.pass1 == parseInt(passcodes.revalidateMode.val)){
                                    window.localStorage["otp"] = passcodes.createCode.pass1;
                                    tx.resolve();
                                } else {
                                    passcodes.createCode.pass1 = 0;
                                    passcodes.revalidateMode.val = '';
                                    $('.content').addClass("animated shake");
                                    showMessage("Passcodes do not match", "short", "bottom");
                                    $('#revalidateusertitle').html(title);
                                    $('.passview1').html('.');
                                    $('.passview2').html('.');
                                    $('.passview3').html('.');
                                    $('.passview4').html('.');
                                }
                            }
                        } else if(mode == 'validate'){
                            if (parseInt(passcodes.revalidateMode.val) == window.localStorage["otp"]) {
                                setTimeout(tx.resolve, 300);
                            } else {
                                retries--;
                                if (retries === 0){
                                    showMessage('You have been logged out', 'short');
                                    customFunctions.logout(true);
                                    return;
                                }
                                passcodes.revalidateMode.val = '';
                                window.plugins.toast.show("Incorrect Passcode. You have "+retries+" attempt"+(retries == 1 ?"":"s")+" left.", "short", "bottom");
                                $('.content').addClass("animated shake");
                                // Fix it
                                $('.passview1').html('.');
                                $('.passview2').html('.');
                                $('.passview3').html('.');
                                $('.passview4').html('.');
                            }
                        }
                    }
                    $('.clickableNumber').prop('disabled','false');
                });

                $('.rr').on('keyup', function(e) {
                    //e.stopPropagation();
                    if ($(this).val().length > 4) {
                        $(this).val($(this).val().substring(0, 4));
                        window.plugins.toast.show("You only need to input 4 numbers", "short", "bottom");
                    } else {

                    }
                });
                $('#reauthotp').click(function(e) {
                   // e.stopPropagation();
                    if (window.localStorage["otp"] == $('#userOtp').val()) {
                        tx.resolve();
                    } else {
                        window.plugins.toast.show("Wrong PIN", "short", "bottom");
                        $('.content').addClass("bounce");
                    }
                });


                return tx.promise();
            },
            createFormInboxList: function(inboxDataSet, mode) {

                var defaultPanels = [null, {
                    name: "Logout"
                }];
                if ($('#form_inbox_list').length) {
                    $('#form_inbox_list').remove();
                }
                var newView;
                var title = 'Inbox';

                var panelName = "forminbox";
                var html = '<div id="form_inbox_list" data-role="page">' +
                    getPublicHeaderHtml("Inbox", null, null, null)+
                    app.html_factory.getForminboxListContentHTML(inboxDataSet) +
                    (mode == 'public' ? app.html_factory.getPublicFooterHTML() :  app.html_factory.getFooterHTML()) +
                    '</div>';
                newView = INBOX_VIEW;

                BODY.appends(html).trigger('create');
                $('#form_inbox_list .ui-content ul').listview().listview('refresh');
                $('#form_inbox_list .ui-content ul li').each(function(index, li) {
                    $(li).click(function(e) {
                        e.stopPropagation();
                        var num = $(li).attr("form-data-id");
                        customFunctions.updateInboxDetail(num);
                        customFunctions.fetchInboxDetail(num);
                    });
                });

                bodyContainer.pagecontainer('change', '#form_inbox_list', {
                    transition: "slideup"
                });

                resetAllNavIndicators();
                $('ul li a.nav_item_inbox').parent('li').addClass("nav-active");

                app.currentView = newView;
                BODY.trigger('refresh');
                //customFunctions.closeNotificationDialog();

            },
            createDashboardPage: function() {
                var txDeferred  = $.Deferred();
                var title       = '';
                var panelName   = "mydashboardpanels";
                var statusHtml  = '';
                var newView     = "form_dashboard_page";
                try{
                    if ($('#form_dashboard_page').length) {
                        $('#contain').html('');
                        $('#statGrid').html('');
                    } else {
                        var html = ''+
                                    '<div data-role="page" id = "form_dashboard_page">' +
                                        '<div data-role="header" class="blue-gradient" data-position="fixed" data-tap-toggle="false">' +
                                            '<a class="ui-btn ui-btn-left header-link" onclick="gotoCompanySplashScreen()"><img class="home-link" src="img/formelo-icon.png" style="width: 24px;"></a>'+
                                            '<h1>Dashboard</h1>'+
                                            '<a href="#'+panelName+'" class="ui-btn ui-btn-right header-link"><i class="fa fa-bars"></i></a>'+
                                        '</div>'+
                                        '<div role="main">'+
                                            '<div class="row">'+
                                                '<div class="col-xs-12 col-sm-12 col-md-12">'+
                                                    '<div id="contain">'+
                                                    '</div>'+
                                                '</div>'+
                                                '<div class="col-xs-12 col-sm-12 col-md-12">'+
                                                    '<div id ="statGrid">'+
                                                    '</div>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>'+
                                        app.html_factory.getFooterHTML()+
                                        app.html_factory.getPanelHTML(panelName, false, {})+
                                    '</div>';

                        BODY.appends(html).trigger('refresh');
                    }

                    bodyContainer.pagecontainer('change', '#form_dashboard_page', {
                        transition: "none"
                    });
                    resetAllNavIndicators();
                    $('ul li a.nav_item_stats span').addClass("nav-active");
                    app.currentView = newView;
                    txDeferred.resolve();
                } catch(e){
                    alert(JSON.stringify(e));
                    txDeferred.reject(e);
                }
                txDeferred.promise();
            },
            getUserStats: function(options){
                var txDeferred = $.Deferred();
                if (!isonline()){
                    txDeferred.reject('Kindly connect to the internet');
                }
                var fromDate = options.fromDate;
                var toDate = options.toDate;
                var realm_url = options.realm_url;
                var userID = options.userID;
                var username = options.username;
                var api_key = options.api_key;
                var mode = options.mode;
                var endPoint = realm_url+'/api/reporting-plans/data/'+mode+'?report={"reporting-plans":{"id":"d8c0d1a9","data_entity_tag":"submission-statistics"}}&report_date_key=created_date&user.id='+userID+'&created_date[]='+fromDate+'&created_date[]='+toDate;
                console.log('fetching: '+endPoint);
                $.ajax
                ({
                    type: "GET",
                    url: endPoint,
                    async: false,
                    success: function (data){
                        txDeferred.resolve(data)
                    },
                    error: function(err){
                        alert(JSON.stringify(err));
                        txDeferred.reject(err);
                    },
                    headers: {
                        "Authorization": "Basic " + btoa(username + ":" + api_key)
                    },
                    timeout:TIMEOUT
                });
                return txDeferred.promise();
            },
            getDashboardContent: function(stats, logs){
                var sentItem = computeSentItems(stats["SENT"]);
                var statHtml =  '<div class="col-xs-6 col-sm-3 col-md-3">'+
                                    '<div class="dashboard-box-item draft" onclick="app.navigator.showDraftList()">'+
                                        '<p class="counter" >'+stats["DRAFTS"]+'</p>'+
                                        '<p class="type">Drafts</p>'+
                                    '</div>'+
                            '</div>'+
                            '<div class="col-xs-6 col-sm-3 col-md-3">'+
                                '<div class="dashboard-box-item errors" onclick="app.navigator.showOutboxList(\'error\')">'+
                                '<p class="counter">'+stats["ERRORS"]+'</p>'+
                                '<p class="type">Errors</p>'+
                                '</div>'+
                            '</div>'+
                            '<div class="col-xs-6 col-sm-3 col-md-3">'+
                                '<div class="dashboard-box-item unread" onclick="app.navigator.showInboxList(\'private\'); ">'+
                                '<p class="counter">'+stats["INBOX"]+'</p>'+
                                '<p class="type" >New Messages</p>'+
                                '</div>'+
                            '</div>'+
                            '<div class="col-xs-6 col-sm-3 col-md-3">'+
                                '<div class="dashboard-box-item sent" onclick="app.navigator.showOutboxList(\'sent\')">'+
                                '<p class="counter" id="sentCount">'+sentItem+'</p>'+
                                '<p class="type">Sent</p>'+
                                '</div>'+
                            '</div>';
                $('#statGrid').html(statHtml).trigger('refresh');

                var showStats =  function(dates, counts){
                    $('#contain').highcharts({
                        chart: {
                            type: 'line',
                            //renderTo: 'chart',
                            minPadding:0,
                            maxPadding:0,
                            width: width,
                            height: height
                        },
                        exporting: {
                          enabled : false
                        },
                        title: {
                            text: '',
                            style:{
                                display : 'none'
                            }
                        },
                        xAxis: {
                            categories: dates
                        },
                        yAxis: {
                            title: {
                                text: '',
                                style:{
                                    display : 'none'
                                }
                            }
                        },
                        plotOptions: {
                          line : {
                              marker : {
                                  enabled : false
                              }
                          },
                          series : {
                                marker : {
                                    enabled : false
                                }
                          }
                        },
                        series: [{
                            name: 'Sent',
                            data: counts,
                            color: '#1bbc9b'
                        }]
                    }).trigger('create');
                };
                /*var results = [
                    {
                        day     : "2015-07-01T00:00:00",
                        count   : 100
                    }
                ]; */

                // alert(window.localStorage[Manager.keys.STAT_CHART]);
                var stat_data = remoteStats('get', 'chart');
                var dates = [],  counts = [];
                for (var i = 0; i < stat_data.length; i++) {
                     var formattedDate = moment(stat_data[i].date).format("ddd, MMM D");
                     dates.push(formattedDate);
                     counts.push(stat_data[i].accepted_count);
                }

                var height= BODY.height()/2;
                var width= BODY.width();

                if (!stat_data.length){
                    var divhtml = '<div style = "height:'+height+'px; max-height:'+height+'px; text-align:center;">'+
                            '<img src="img/empty-states/no-stats.png" style="width:100%; height:100%;">'+
                            '<div class="error-container text-center" style="margin-top:-'+(height/2)+'px;">' +
                                '<h2 class="semi-bold" style="color: grey">Sample Chart</h2>' +
                                '<p class="fs-12 hint-text" style="text-align: center; padding: 0px  10px; text-shadow: none;">You can track your historical activity here</p>' +
                            '</div>' +
                            '</div>';
                    $('#contain').html(divhtml);
                } else {
                    showStats(dates, counts);
                }
                //setTimeout(getRemoteStats, 5000);
            },
            createFormDataList: function(status) {

                var txDeferred = $.Deferred();

                var title = '';
                var panelName = "mypanels";

                var newView;

                if (status == initFunctions.form_status.UNPROCESSED) {
                    title = "Draft";
                    newView = DRAFT_VIEW;
                } else if (status == initFunctions.form_status.PROCESSING) {
                    title = "Submissions";
                    newView = OUTBOX_VIEW;
                } else if (status == initFunctions.form_status.PROCESSED) {
                    title = "Sent";
                    newView = SENT_VIEW;
                }

                if ($('#form_data_list').length) {
                    $('#form_data_list #data-list-header').html(title);
                    $('#form_data_list #data-list-content').html('');
                } else {
                    var html = '<div id="form_data_list" data-role="page" data-id="myPage">' +
                        '<div data-role="header" data-position="fixed" xstyle="height: 10% !important;" data-tap-toggle="false" data-hide-during-focus="false">'+
                        '<a class="ui-btn ui-btn-left header-link" onclick="gotoCompanySplashScreen()"><img class="home-link" src="img/formelo-icon.png" style="width: 24px;"></a>'+
                        '<h1 id="data-list-header">'+title+'</h1>'+
                        '<a href="#'+panelName+'" class="ui-btn ui-btn-right header-link"><i class="fa fa-bars"></i></a>'+

                        '</div>'+
                        '<div role="main" id = "data-list-content">'+
                         '</div>'+

                        app.html_factory.getFooterHTML() +
                        app.html_factory.getPanelHTML(panelName, false, {type:"transfers"}) +
                        '</div>';
                    BODY.appends(html);//.trigger('create');
                }

                resetAllNavIndicators();
                //alert(title.toLowerCase());
                $('#form_data_list ul li a.nav_item_' + title.toLowerCase()+ ' span').addClass("nav-active"); //.addClass("ui-btn-active");

                bodyContainer.pagecontainer('change', '#form_data_list', {
                    transition: "none"
                });

                app.currentView = newView;
                txDeferred.resolve();

                txDeferred.promise();
            },
            displayConfirm: function(li, status) {
                    navigator.notification.confirm(
                        'Do you want to delete this record?', // message
                        function(buttonIndex) {
                            if (buttonIndex == 1) {
                                app.constructors.removeListItem(li);
                                app.constructors.deleteItemfromDB($(li).attr("form-data-id"));
                            }
                        },
                        'Action', ['Yes', 'Cancel'],
                        '' // defaultText
                    );
            },
            transferRecord: function(id) {
                customFunctions.synchronise(id);
            },
            removeListItem: function(li) {
                $(li).addClass("animated fadeOutRightBig");
                setTimeout(function() {
                    $(li).remove()
                }, 400);
            },
            deleteItemfromDB: function(id) {
                var sql = "SELECT DATA FROM FORM_DATA WHERE ID = " + id;
                $.when(initFunctions.database.execute(sql))
                    .done(function(tx, formDataSet) {
                        if (formDataSet.rows.length) {
                            cleanEntity(formDataSet.rows.item(0)["DATA"]);
                        }
                        sql = "DELETE FROM FORM_DATA WHERE ID = " + id;
                        initFunctions.database.execute(sql);

                    })
                    .fail(function() {

                    })
            },
            createFormEditor: function(formConfig) {
                var txDeferred = $.Deferred();
                $.when(app.constructors.createFormDataEditor(null, formConfig))
                    .done(function() {
                        txDeferred.resolve();
                    })
                    .fail(function() {});
                txDeferred.promise();
            },
            bindSwipeEvents: function(formRef) {
                var formConfig = initFunctions.getFormConfigByRef(formRef);
                var evalScript = "";
                for (var i = 0; i < formConfig.pages.length; i++) {
                    var currentPageID = 'forms_' + formRef + '_' + i;
                    var previousPageID = null;
                    // alert(currentPageID);
                    previousPageID = i > 0 ? ('forms_' + formRef + '_' + (i - 1)) : 'form_group_list';
                    var nextPageID = null;
                    var nextLabel = null;
                    if (i + 1 == formConfig.pages.length) {
                        nextPageID = null;
                    } else {
                        nextPageID = 'forms_' + formRef + '_' + (i + 1);
                    }
                }

                //bodyContainer.pagecontainer('change', '#forms_' + formRef + '_0', { transition: "slide" } );

                app.activeFormRef = formRef;
                //app.activeFormData = formData;
            },
            "validatePage": function(formRef, pageNumber, nextPage, nextPageName) {
                customFunctions.displayNotificationDialog('', 'Loading next page: '+nextPageName);
                customFunctions.goto(nextPage, false);
                customFunctions.closeNotificationDialog();
                try{
                    $.when(initFunctions.getFormConfigByRef(formRef))
                        .done(function(data){
                            var validResult = true;
                            var currentField;
                            var currentFieldElement;

                            var formConfig = data;
                            var entity = {};

                            for (var j = 0, alen = formConfig.pages[pageNumber].fieldsets.length ; j < alen; j++) { // each fieldset
                                for (var k = 0, blen = formConfig.pages[pageNumber].fieldsets[j].fields.length; k < blen; k++) { //each field
                                    var entityContext = entity;
                                    var excuse;
                                    var formField = formConfig.pages[pageNumber].fieldsets[j].fields[k];
                                    var $formControl = Activity.getCurrentStackObject().find('[name = "'+formField.key+'"]');

                                    var attr = $formControl.attr('required');

                                    var isRequired = $formControl.attr('required');
                                    var key = formField.key;
                                    var extra = $formControl.attr("extra");
                                    var fieldValue;
                                    switch (extra) {
                                        case 'image': extra = 'camera';
                                        case 'fingerprint':
                                        case 'signature':
                                            fieldValue = $formControl.attr('src');
                                            fieldValue = fieldValue != ('img/' + extra + '.png') ? fieldValue : '';
                                            break;
                                        default:
                                            fieldValue = $formControl.val();
                                    }

                                    fieldValue = fieldValue ? fieldValue.trim() : '';
                                    var isFieldValid = true;
                                    if (fieldValue && fieldValue.length > 0) {
                                        var validator = $formControl.attr("onvalidate");
                                        if (validator) {
                                            try {
                                                var retVal = eval(validator);
                                                if (retVal !== true) {
                                                    isFieldValid = false;
                                                    excuse = typeof retVal == 'string' ? retVal : 'This value is invalid';
                                                    $('label[for = "'+formField.key+'"]').html(excuse);
                                                    //continue;
                                                } else {
                                                    $('label[for = "'+formField.key+'"]').html('');
                                                }
                                            } catch (e) {
                                                alert(JSON.stringify(e));
                                                //continue;
                                            }
                                        }
                                    }

                                    if (isRequired && fieldValue.length == 0) {
                                        isFieldValid = false;
                                        $formControl.parent().parent().addClass('has-error');
                                        $formControl.parent().addClass('has-error');
                                        excuse = excuse || "The value cannot be empty";
                                        $('label[for = "'+formField.key+'"]').html(excuse);
                                    } else {
                                        $('label[for = "'+formField.key+'"]').html('');
                                        $formControl.parent().parent().removeClass('has-error');
                                        $formControl.parent().removeClass('has-error');
                                    }

                                    if (extra == "select" || extra == "multiselect") {
                                        if (!isFieldValid) {
                                            isFieldValid = false;
                                            excuse = 'Kindly select an option';
                                            $formControl.parent().parent().addClass('has-error');
                                            currentField = formField.name;
                                            $('label[for = "'+formField.key+'"]').html('Kindly select an option');
                                        } else {
                                            $formControl.parent().parent().removeClass('has-error');
                                            $('label[for = "'+formField.key+'"]').html('');
                                        }
                                    } else if (extra == "phone" || extra == "text") {
                                        var param = JSON.parse($formControl.attr("parameters"));
                                        var valueLength = fieldValue.length;
                                        var min = param['min_length'] ? param['min_length'] : 0;
                                        var max = param['max_length'] ? param['max_length'] : 0;

                                        if (!isFieldValid) {
                                            $formControl.parent().addClass('has-error');
                                            //currentField = formField.name;
                                            //excuse = "Value must be between " + min + " and " + max + " characters long";
                                            $('label[for = "'+formField.key+'"]').html(excuse);
                                        } else if (valueLength > 0 && ((min && valueLength < min) || (max && valueLength > max))) {
                                            isFieldValid = false;
                                            $formControl.parent().addClass('has-error');
                                            currentField = formField.name;
                                            excuse = "Number must be between " + min + " and " + max + " digits long";
                                            $('label[for = "'+formField.key+'"]').html("Number must be between " + min + " and " + max + " digits long");
                                        } else if (isFieldValid) {
                                            $formControl.parent().removeClass('has-error');
                                            $('label[for = "'+formField.key+'"]').html('');
                                        }
                                    } else if (extra == "number") {
                                        var param = JSON.parse($formControl.attr("parameters"));
                                        var valueLength = fieldValue.length;
                                        var min = param['min_value'];// ? param['min_value'] : 0;
                                        var max = param['max_value'];// ? param['max_value'] : 0;

                                        if (!isFieldValid) {
                                            $formControl.parent().addClass('has-error');
                                            currentField = formField.name;
                                        } else if (fieldValue && ((min && fieldValue < min) || (max && fieldValue > max))) {
                                            isFieldValid = false;
                                            $formControl.parent().addClass('has-error');
                                            currentField = formField.name;
                                            excuse = "Number must be between " + min + " and " + max;
                                            $('label[for = "'+formField.key+'"]').html("Number must be between " + min + " and " + max);
                                        }
                                        min = param['min_length'] ? param['min_length'] : 0;
                                        max = param['max_length'] ? param['max_length'] : 0;

                                        if (valueLength > 0 && ((min && valueLength < min) || (max && valueLength > max))) {
                                            isFieldValid = false;
                                            $formControl.parent().addClass('has-error');
                                            currentField = formField.name;
                                            excuse = "Number must be between " + min + " and " + max + " digits long";
                                            $('label[for = "'+formField.key+'"]').html("Number must be between " + min + " and " + max + " digits long");
                                        }

                                        if (isFieldValid) {
                                            $formControl.parent().removeClass('has-error');
                                            $('label[for = "'+formField.key+'"]').html('');
                                        }

                                    } else if (extra == "gps") {
                                        if (!isFieldValid) {
                                            entityContext[key] = fieldValue;
                                            isFieldValid = false;
                                            $formControl.parent().addClass('has-error');
                                            excuse = 'This option is required';
                                            $('label[for = "'+formField.key+'"]').html('This option is required');
                                            currentField = formField.name;
                                        } else {
                                            $formControl.parent().removeClass('has-error');
                                            $('label[for = "'+formField.key+'"]').html('');
                                        }
                                    } else if (extra == "fingerprint" || extra == "signature" || extra == "camera") {
                                        if (isRequired){
                                            if (!isFieldValid) {
                                                isFieldValid = false;
                                                //$formControl.parent().addClass('has-error');
                                                $formControl.parent().parent().addClass('has-error');
                                                currentField = formField.name;
                                                $('label[for = "'+formField.key+'"]').html('This field is required');
                                            } else {
                                                //$formControl.parent().removeClass('has-error');
                                                $formControl.parent().parent().removeClass('has-error');
                                                $('label[for = "'+formField.key+'"]').html('');
                                            }
                                        } else {
                                            $formControl.parent().parent().removeClass('has-error');
                                        }

                                    } else if (extra == "email") {
                                        if (!isFieldValid || (fieldValue.length && !isValid.email(fieldValue))) {
                                            isFieldValid = false;
                                            $formControl.parent().addClass('has-error');
                                            currentField = formField.name;
                                            excuse = 'Please enter a valid email address';
                                            $('label[for = "'+formField.key+'"]').html('Please enter a valid email address');
                                        } else {
                                            $formControl.parent().removeClass('has-error');
                                            $('label[for = "'+formField.key+'"]').html('');
                                        }
                                    } else if (!isFieldValid) {
                                        isFieldValid = false;
                                        $formControl.parent().addClass('has-error');
                                        currentField = formField.type;
                                    } else {
                                        $formControl.parent().parent().css({"border": "none"});
                                        $formControl.parent().removeClass('has-error');
                                    }
                                    validResult = validResult && isFieldValid;
                                }
                            }

                            if (!validResult) {
                                showMessage("Please note that errors exist in your data");
                            }
                        })
                } catch(e){
                    //customFunctions.closeNotificationDialog();
                    alert(e.message+' : '+JSON.stringify(e));
                    //customFunctions.goto(nextPage, false);
                }
            },
            createFormDataEditor: function(formData, xformRef, formConf, applet_mode, isFormStillActive, isFormDeletable, isPreview) {
                var txDeferred = $.Deferred();
                var formRef = xformRef || formData.ref;
                try{
                    if (formConf){
                        if (formConf.mode && formConf.mode == "dynamic"){
                            formelo = new Formelo(formRef, applet_mode);
                            formelo.start();
                            txDeferred.resolve();
                        } else if (formConf.mode && formConf.mode == "form") {
                            app.constructors.createFormEditorContentHtml(formConf, formRef,applet_mode, formData, isFormStillActive, isFormDeletable, isPreview);
                            txDeferred.resolve();
                        }
                    } else {
                        $.when(initFunctions.getFormConfigByRef(formRef))
                            .done(function(formConfig){
                                //alert(formConfig.mode);
                                if (formConfig.mode && formConfig.mode == "html"){
                                    var formelo = new Formelo(formRef);
                                    formelo.start();
                                    txDeferred.resolve();
                                } else if (formConfig.mode && formConfig.mode == "form") {
                                    app.constructors.createFormEditorContentHtml(formConfig, formRef,applet_mode, formData, isFormStillActive, isFormDeletable, isPreview);
                                    txDeferred.resolve();
                                }
                            })
                    }
                } catch(e){
                    alert(JSON.stringify(e));
                    window.plugins.toast.show('Oops, we broke something. It has been reported. Try again later');
                    txDeferred.reject(e);
                }
                txDeferred.promise();
            },
            createFormEditorContentHtml: function(formConfig, formRef,_applet_mode, formData, isFormStillActive, isFormDeletable, isPreview){
                Activity.addStack(formRef);
                var formTitle = formConfig.name;
                var isNewData = formData ? "false" : "true";
                var pageTitle = "";
                var applet_mode = _applet_mode || 'private';
                var isSubmittable = (formConfig.hasOwnProperty('parameters') && formConfig.parameters.hasOwnProperty('is_submittable')) ? formConfig.parameters['is_submittable'] : true;
                var slug = Activity.getStackSlug();
                var body = BODY;
                // events.ready
                var bindFormDataEvents = function(){
                    $(document).on('pageinit', function(){
                        var input = Activity.getCurrentStackObject().find('input');
                        $('.rating-control').raty({
                            starType:'img'
                        });
                        input.unbind();
                        input.on('keyup', function(event){
                            event.stopPropagation();
                            var that  = this;
                            validateField(that);
                        });
                        input.on('click', function(event){
                            event.stopPropagation();
                            try{
                                var that  = this;
                                var type  = $(that).attr('extra');
                                if (type == 'date'){
                                    showDatePicker(that);
                                }
                            } catch(e){
                                alert(JSON.stringify(e));
                            }
                        });
                    });
                };
                customFunctions.updateHistory(0);
                nav_options.formRef = formRef;
                //loop to generate the pages
                var formEvent = {};
                var createPage = function(formConfigPages, _count, navigateAfterFirstPage){ //formConfig.pages
                    var txDeferred  = $.Deferred();
                    var count       = _count || 0;
                    var html        = '';
                    for (var i = count, len = formConfigPages.length; i < len; i++) {
                        var currentPageID = slug + formRef + '_' + i;
                        var previousPageID = null;
                        var backCommand;
                        var previousLabel = "";
                        var previousIcon = "";
                        var previousDisplayable;
                        var nextPageID = null;
                        var nextLabel = "";
                        var nextIcon = "";
                        var nextCommand = "";
                        var nextPageName = "";
                        var nextIsDisplayable = "";

                        if (formData) {
                            if (i > 0) {
                                backCommand = 'customFunctions.goBack(false)';
                                previousPageID      = slug + formRef + '_' + (i - 1);
                                previousLabel       = "Back";
                                previousIcon        = "fa fa-chevron-left";
                                previousDisplayable = true;
                            } else {
                                backCommand         = 'customFunctions.goBack(true)';
                                previousPageID      = 'form_data_preview';
                                previousLabel       = "preview";
                                previousIcon        = "fa fa-eye";
                                previousDisplayable = false;
                            }
                        } else {
                            if (i > 0) {
                                backCommand = 'customFunctions.goBack(false)';
                                previousPageID = slug + formRef + '_' + (i - 1);
                                previousLabel = "Back";
                                previousIcon = "fa fa-chevron-left";
                                previousDisplayable = true;
                            } else {
                                backCommand = 'customFunctions.goBack(true)';
                                previousPageID = 'form_group_list';
                                previousLabel = "Forms";
                                previousIcon = "fa fa-newspaper-o";
                                previousDisplayable = false;
                            }
                        }

                        if (i + 1 == formConfigPages.length) {
                            nextLabel = "Save";
                        } else {
                            nextPageID = i + 1;
                            nextPageName = formConfigPages[nextPageID].name.replace("\'", "\\'");
                        }

                        if (nextPageID) {
                            if (formConfigPages[i].hasOwnProperty('events')) {
                                var continueCommand = "app.constructors.validatePage(" + formRef + "," + i + "," + nextPageID + "," + nextPageName + ")";
                                formEvent = formConfigPages[i].events;
                                nextCommand = formEvent['onnext'];
                                nextIsDisplayable = true;
                            } else {
                                nextCommand =  "app.constructors.validatePage('" + formRef + "'," + i + "," + nextPageID + ",'" + nextPageName + "')";//"app.constructors.validatePage('" + formRef + "'," + i + ",'" + nextPageID + "','" + nextPageName + "')";
                                nextLabel = "Next";
                                nextIcon = "fa fa-arrow-right";
                                nextIsDisplayable = true;
                            }
                        } else {
                            //alert(isPreview);
                            nextCommand = isPreview ? "Browser.addFormToRealm('" + formRef + "','"+applet_mode+"')" : "app.form.submit('" + formRef + "')";
                            nextLabel   = isPreview ? '<b class="">Import</b>' : '<b class="">Send</b>';
                            nextIcon    = isPreview ? 'fa pg-download text-success' : 'fa fa-check text-success';
                            nextIsDisplayable = isSubmittable;
                        }
                        var j = i + 1;
                        pageTitle = formConfigPages[i].name;
                        var previousAction = {
                            label: previousLabel,
                            icon: previousIcon,
                            command: backCommand,
                            isdisplayable: previousDisplayable
                        };
                        var nextAction = {
                            label: nextLabel,
                            icon: nextIcon,
                            command: nextCommand,
                            isDisplayable: nextIsDisplayable
                        };

                        html += '<div class = "formpage '+slug+' backStack" id="' + currentPageID + '" data-role="page">' +
                        app.html_factory.getHeaderHTML({
                            title: formTitle,
                            number: currentPageID,
                            applet_mode: applet_mode,
                            applet_id: formConfig.id,
                            isPreview: isPreview,
                            isSubmittable : isSubmittable
                        }) +
                        app.html_factory.getFormEditorContentHTML(formConfigPages[i], nextAction, previousAction, {
                            pageLength: formConfigPages.length,
                            currentNo: i
                        }) +
                        app.html_factory.getFormFooterHTML(formConfigPages[i], nextAction, previousAction, {
                            pageLength: formConfigPages.length,
                            currentNo: i,
                            title: pageTitle
                        }) +
                        '</div>';
                        if (navigateAfterFirstPage){
                            body.appends(html);//.trigger('refresh');
                            console.log(html);
                            bodyContainer.pagecontainer('change', '#'+slug + formRef + '_0', {
                                transition: "none"
                            });
                            bindFormDataEvents();
                            txDeferred.resolve();
                            html = '';
                            break;
                        }
                    }
                    if (!navigateAfterFirstPage){
                        body.appends(html);
                    }
                    txDeferred.resolve();
                    return txDeferred.promise();
                };
                if (formConfig.pages.length){
                    $.when(createPage(formConfig.pages, 0, true))
                        .done(function(){
                            customFunctions.closeNotificationDialog();
                            createPage(formConfig.pages, 1, false);
                            if (formConfig.events && formConfig.events){
                                customFunctions.executeScript(formConfig);
                            }
                        })
                        .fail(function(){
                            throw new Error('Error creating the pages');
                        })
                } else {
                    if (formConfig.events && formConfig.events.ready){
                        customFunctions.executeScript(formConfig);
                    }
                }
                $.mobile.keepNative     = "select,input"; /* jQuery Mobile 1.4 and higher*/
                formPageNumber          = 0;
                app.activeFormRef       = formRef;
                app.activeFormData      = formData;
                if (formData) {
                    app.events.onFormCreated(null, formData, isFormStillActive, isFormDeletable);
                }
            },
            createFormDataPreview: function(formData,status, isActivePreview) {
                var txDeferred = $.Deferred();
                var formRef = formData.ref;

                var isActiveFormPreview = isActivePreview || false;

                $.when(initFunctions.getFormConfigByRef(formData.ref))
                    .done(function(formConfig){
                        if (formConfig && formConfig.pages) {

                        } else {
                            alert('Form config for  '+formRef+' not passed: '+ JSON.stringify(formConfig));
                        }
                        if (isActiveFormPreview) {
                            //var formPrefix = 'forms_' + formRef + '_';
                            //$('[id^='+formPrefix+']').remove();
                            // knock off the current stack
                            Activity.removeStack();
                        }
                        var canEdit = '';
                        if (isActivePreview){
                            canEdit = '<a class="ui-btn ui-btn-right header-link" onclick = "app.form.load(\'' + formData.id + '\', true, null, null, true)">Edit </a>';
                        } else {
                            canEdit = formData.error !== 0  ? '<a class="ui-btn ui-btn-right header-link" onclick = "app.form.load(\'' + formData.id + '\', true)">Edit </a>' : '';
                        }

                        if ($('#form_data_preview').length) {
                            $('#form_data_preview').remove();
                        }
                        var saveFormHtml = '';

                        if (isActiveFormPreview){
                            saveFormHtml = '<a onclick = "app.form.load(\'' + formData.id + '\', true, null, true, true)" id="saveFormButton" class="ui-btn ui-btn-left header-link"> Save</a>';
                        } else {
                            saveFormHtml = '<a href = "#form_data_list" class="ui-btn ui-btn-left header-link"><i class="pg-arrow_left_line_alt"></i> Back</a>';
                        }

                        var isEditable = formData != initFunctions.form_status.PROCESSED;

                        var html = '<section id="form_data_preview" data-role="page" xstyle="height: 10% !important;">';
                        html += '<div data-role="header" class="blue-gradient" data-position ="fixed" data-tap-toggle="false" data-hide-during-focus="false">' +
                        saveFormHtml+
                        '<h1 style="text-align: center;">Summary</h1>' +
                        canEdit +
                        '</div>'+
                        '<div role="main">';

                        for (var i = 0; i < formConfig.pages.length; i++) {
                            html += app.html_factory.getFormPreviewContentHTML(formConfig.pages[i]);
                        }
                        html += '</div>'+
                        '</section>';
                        BODY.appends(html);//.trigger('create');

                        if (formData) {
                            app.events.onFormCreated(null, formData, null, null, true);
                            txDeferred.resolve();
                        }
                        bodyContainer.pagecontainer('change', '#form_data_preview', {
                            transition: "slide"
                        });
                        txDeferred.resolve();
                    }).fail(function(){});
                txDeferred.promise();
            },
            displayFormError: function(validationResult) {
                var errors;
                for (var i = 0; i < validationResult.offenders.length; i++) {
                    errors += i + 1 + ') ' + validationResult.offenders[i].formfield + ' of page:  "' + validationResult.offenders[i].Page.name + '" \n ';
                }
                var errorMsg = "You had errors in the following fields: \n " + errors;
                navigator.notification.alert(
                    errorMsg, // message
                    function() {}, // callback
                    'Oops Error somewhere', // title
                    'Ok' // buttonName
                );
            },
            createFormConfirmationDialog: function(formRef, deferred, submittable) {
                var isSubmit = submittable || false;
                if (!submittable){
                    navigator.notification.confirm(
                        'You will be able to retrieve the data later from the Drafts section', // message
                        function(buttonIndex) {
                            if (buttonIndex == 1) { //alert(formRef);
                                deferred.resolve();
                            } else if (buttonIndex == 2) {

                            }
                        },
                        'Exit?', ['Yes', 'No'],
                        '' // defaultText
                    );
                } else {
                    navigator.notification.confirm(
                        'You will be able to retrieve the data later from the Drafts section', // message
                        function(buttonIndex) {
                            if (buttonIndex == 1) { //alert(formRef);
                                $.when(app.form.save(formRef, false, 4))
                                    .done(function(){
                                        showMessage('Continue editing your data by tapping on the "Drafts" tab below.', 'long');
                                        deferred.resolve()
                                    })
                                    .fail(deferred.reject);
                            } else if (buttonIndex == 2) {
                                deferred.resolve();
                            }
                        },
                        'Save before closing?', ['Save', 'Discard', 'Cancel'],
                        '' // defaultText
                    );
                }
            }
        },
        navigator: {
            "showFormGroupList": function() {
                $.when(app.form.protect())
                    .done(function() {
                        app.form.clear();
                        // Just navigate to the form group page
                        bodyContainer.pagecontainer('change', '#form_group_list', {
                            transition: "none"
                        });
                        resetAllNavIndicators();
                        $('ul li a.nav_item_forms span').addClass("nav-active");

                        app.currentView = FORMS_VIEW;
                        //app.constructors.createFormGroupList();
                    });
            },
            "showInboxList": function(mode) {
                $.when(app.form.protect())
                .done(function() {
                        app.form.clear();

                        $.when(showverticalLists('Inbox',null, mode))
                            .done(function(){
                                resetAllNavIndicators();
                                $('ul li a.nav_item_inbox span').addClass("nav-active");
                                events.subscribe('inbox.selected', function(data){
                                    $.when(customFunctions.displayInboxDetail(mode))
                                        .done(function(){
                                            var inboxItem = publicCtlr.populateInboxDetail(data.id);
                                        })
                                });
                                publicCtlr.populateInbox('data_lists');
                            });
                    });
            },
            "showFormDataList": function(status, name, tab) {
                $.when(app.form.protect())
                    .done(function() {
                        app.form.clear();
                        try{
                            $.when(app.constructors.createFormDataList(status))
                                .done(function(data) {
                                    var sql = '';
                                    if (status === 0){
                                        sql = 'SELECT  ID AS id, STATUS as status,  FORM_REFERENCE AS ref,  TITLE AS title,  DESCRIPTION AS description,  ERROR AS error,  LAST_MODIFIED_TIME AS last_modified_time, SUBMISSION_TIME as submission_time FROM FORM_DATA WHERE STATUS = "0" AND MODE = "'+APPLET_MODE+'" AND OWNER = "'+getUserCredentials().username+'" AND REALM = "'+getEndpoint()+'" ORDER BY LAST_MODIFIED_TIME DESC';
                                    } else {
                                        sql = 'SELECT  ID AS id, STATUS as status,  FORM_REFERENCE AS ref,  TITLE AS title,  DESCRIPTION AS description,  ERROR AS error,  LAST_MODIFIED_TIME AS last_modified_time, SUBMISSION_TIME as submission_time FROM FORM_DATA WHERE STATUS <> "0" AND MODE = "'+APPLET_MODE+'" AND OWNER = "'+getUserCredentials().username+'" AND REALM = "'+getEndpoint()+'" ORDER BY LAST_MODIFIED_TIME DESC';
                                    }
                                    $.when(initFunctions.database.execute(sql))
                                        .done(function(tx, formDataSet){
                                            try{
                                                status == 1 ? app.html_factory.getFormOutboxDataListContentHTML(formDataSet,status, tab) : app.html_factory.getFormDataListContentHTML(formDataSet);
                                                adjustHeightsToViewport();
                                                $('#form_data_list #data-list-content .card-header').each(function(index, li) {
                                                    var stat = $(li).attr('status');
                                                    $(li).on('tap', function(event) {
                                                        if (stat != 2) {
                                                            app.form.load($(li).attr("form-data-id"), false);
                                                        }
                                                    });
                                                    $(li).on('taphold', function(event) {
                                                            navigator.notification.confirm(
                                                                'This action can\'t be undone',
                                                                function(buttonIndex) {
                                                                    if (buttonIndex == 1) {
                                                                        var id = $(li).attr("form-data-id");
                                                                        var sql = 'DELETE FROM FORM_DATA WHERE ID = '+id;
                                                                        $(li).addClass('animated lightSpeedOut');
                                                                        setTimeout($(li).hide(),500);
                                                                        initFunctions.database.execute(sql);
                                                                    } else if (buttonIndex == 2) {}
                                                                },
                                                                'Delete this Record', ['Delete', 'Cancel'],
                                                                ''
                                                            );
                                                    });
                                                });
                                            } catch(e){
                                                alert(JSON.stringify(e));
                                            }
                                        })
                                })
                                .fail(function(tx, error) {});
                        } catch(e){
                            alert(JSON.stringify(e));
                        }
                    }).
                    fail(function(error) {});
            },
            "showDraftList": function() {
                app.navigator.showFormDataList(initFunctions.form_status.UNPROCESSED, "Draft");
            },
            "showOutboxList": function(tab) {
                app.navigator.showFormDataList(initFunctions.form_status.PROCESSING, "Submissions", tab);
            },
            "showSentList": function() {
                app.navigator.showFormDataList(initFunctions.form_status.PROCESSED, "Sent");
            },
            "showDashboardPage": function() {
                try{
                    app.form.clear();
                    $.when(app.constructors.createDashboardPage())
                        .done(function(){
                            $.when(DB.helpers.getStatsFromDB({
                                offset: 0,
                                extend: 25
                            }))
                                .done(function(stats){
                                    var sql = "SELECT count(strftime('%d-%m-%Y', SUBMISSION_TIME)) as count, SUBMISSION_TIME as date FROM FORM_DATA WHERE OWNER = '"+getUserCredentials().username+"' and REALM = '"+getEndpoint()+"' AND STATUS = 2 GROUP BY strftime('%d-%m-%Y', SUBMISSION_TIME)";
                                    $.when(initFunctions.database.execute(sql))
                                        .done(function(tx, logs) {
                                            //customFunctions.closeNotificationDialog();
                                            app.constructors.getDashboardContent(stats, logs);
                                        })
                                        .fail(function(error) {

                                        });
                                })
                                .fail(function(error){

                                })
                        })
                        .fail(function(e){

                        });
                } catch(e){
                    JSON.stringify(e);
                }
            }
        },
        form: {
            "sendToken": function(pin) {
                //validate the pin,
                //send the pin
                /*if (customFunctions.sendTo(pin, 'http://requestb.in/156ieqy1')) {
                 alert('A token has been sent to your cell phone')
                 } else {
                 alert('There was a problem sending a token ');
                 }*/
            },
            "clear": function() {
                app.activeFormRef = undefined;
                app.activeFormData = undefined;
                Activity.reset();
                return;
            },
            "isActive": function() {
                //alert(app.activeFormRef);
                return app.activeFormRef ? true : false;
            },
            "load": function(formID, showEditor, status, isFormStillActive, isFormDeletable) {

                var sql = 'SELECT ID AS id,  FORM_REFERENCE AS ref,  TITLE AS title,  DESCRIPTION AS description, DATA as data,  ERROR AS error,  LAST_MODIFIED_TIME AS last_modified_time FROM FORM_DATA WHERE ID = '+formID;
                var formActive = isFormStillActive || false;

                customFunctions.displayNotificationDialog('', 'Please wait');
                try{
                    $.when(initFunctions.database.execute(sql))
                        .done(function(tx, formDataSet) {
                            if (showEditor) {
                                if (isFormDeletable){
                                    formDataSet.rows.item(0)['tmpId'] = formDataSet.rows.item(0)['id'];
                                    delete formDataSet.rows.item(0)['id'];
                                }
                                $.when(app.constructors.createFormDataEditor(formDataSet.rows.item(0),null, null, null, formActive, isFormDeletable))
                                    .done(function() {
                                        customFunctions.closeNotificationDialog();
                                    })
                            } else {
                                $.when(app.constructors.createFormDataPreview(formDataSet.rows.item(0), status, formActive))
                                    .done(function() {
                                        customFunctions.closeNotificationDialog();
                                    })
                                    .fail(function(tx, error) {

                                    })
                            }
                        })
                        .fail(function(tx, error) {
                            customFunctions.closeNotificationDialog();
                           alert('Error with the sql');
                        });
                } catch(e){
                    customFunctions.closeNotificationDialog();
                    alert(JSON.stringify(e));
                }
            },
            "protect": function(submittable) {
                var confirmationDeferred = $.Deferred();
                if (APPLET_MODE == 'public'){
                    confirmationDeferred.resolve();
                } else {
                    if (app.form.isActive()) {
                        app.constructors.createFormConfirmationDialog(app.activeFormRef, confirmationDeferred, submittable);
                    } else {
                        confirmationDeferred.resolve();
                    }
                }
                return confirmationDeferred.promise();
            },
            "submit": function(formRef) {
                var canSubmit       = true;
                var error           = null;
                var msg             = '';
                var title           = '';
                var actionButton    = '';

                try {
                    $.when(app.form.validate(formRef))
                        .done(function(){
                            error           = 0;
                            msg             = APPLET_MODE == 'public' ? 'Your data will be sent to the server for processing and removed from this device' : 'Your form is ready to be submitted';
                            title           = "Form Complete";
                            actionButton    = "Proceed";
                        })
                        .fail(function(){
                            error           = 1;
                            msg             = "There are errors in your data so it can't be sent for processing yet";
                            title           = "Errors found";
                            actionButton    = "Save Anyway";
                        })
                        .always(function(){
                            if (APPLET_MODE == 'public' && error == 1){
                                showMessage('Errors exist in your forms. Kindly validate and try again');
                                return;
                            }
                            $.when(app.form.confirmSubmit(title, msg, actionButton))
                                .done(function(){
                                    try{
                                        customFunctions.displayNotificationDialog("Please Wait", "Submitting Data");
                                        $.when(app.form.save(formRef, canSubmit, error))
                                            .done(function(data) {
                                                app.form.clear();
                                                customFunctions.closeNotificationDialog();
                                                window.plugins.toast.show(data, 'short', 'bottom');
                                                if (APPLET_MODE == 'public'){
                                                    createTopChartPage();
                                                } else {
                                                    app.navigator.showOutboxList('completed');
                                                }
                                                setTimeout(app.startSyncService, 4000);
                                            })
                                            .fail(function (error) {
                                                window.plugins.toast.show(error, 'short', 'bottom');
                                                app.form.clear();
                                                customFunctions.closeNotificationDialog();
                                                app.navigator.showOutboxList('error');
                                            });
                                    } catch (e){
                                        alert(JSON.stringify(e));
                                        window.plugins.toast.show('Your form couldn not save', 'short', 'bottom');
                                        gotoFormGroupPage();
                                    }

                                });
                        });
                } catch(e){
                    alert(JSON.stringify(e));
                }

            },
            "confirmSubmit": function(title, message, actionButton){
                var txDeferred  = $.Deferred();
                navigator.notification.confirm(
                    message, // message
                    function(buttonIndex) {
                        if (buttonIndex == 1) { // yes
                            txDeferred.resolve();
                        }
                    },
                    title, [actionButton, 'Cancel'],
                    '' // defaultText
                );

                return txDeferred.promise();
            },
            "validate": function(formRef) {
                var txDeferred = $.Deferred();
                //try{
                    $.when(initFunctions.getFormConfigByRef(formRef))
                        .done(function(data){
                            var validResult = true;
                            var currentField;
                            var currentFieldElement;
                            //var excuse;
                            var formConfig = data;
                            var entity = {};

                            for (var pageNumber = 0, len = formConfig.pages.length; pageNumber < len; pageNumber++) { //each page
                                for (var j = 0, alen = formConfig.pages[pageNumber].fieldsets.length ; j < alen; j++) { // each fieldset
                                    for (var k = 0, blen = formConfig.pages[pageNumber].fieldsets[j].fields.length; k < blen; k++) { //each field
                                        var entityContext = entity;
                                        var excuse;
                                        var formField = formConfig.pages[pageNumber].fieldsets[j].fields[k];
                                        //var $formControl = $('[name = "'+formField.key+'"]');
                                        var $formControl = Activity.getCurrentStackObject().find('[name = "'+formField.key+'"]');

                                        var attr = $formControl.attr('required');

                                        var isRequired = $formControl.attr('required');
                                        var key = formField.key;
                                        var extra = $formControl.attr("extra");
                                        var fieldValue;
                                        switch (extra) {
                                            case 'image': extra = 'camera';
                                            case 'fingerprint':
                                            case 'signature':
                                                fieldValue = $formControl.attr('src');
                                                fieldValue = fieldValue != ('img/' + extra + '.png') ? fieldValue : '';
                                                break;
                                            default:
                                                fieldValue = $formControl.val();
                                        }

                                        fieldValue = fieldValue ? fieldValue.trim() : '';
                                        var isFieldValid = true;
                                        if (fieldValue && fieldValue.length > 0) {
                                            var validator = $formControl.attr("onvalidate");
                                            if (validator) {
                                                try {
                                                    var retVal = eval(validator);
                                                    alert('validatoin result is '+retVal);
                                                    if (retVal !== true) {
                                                        isFieldValid = false;
                                                        excuse = typeof retVal == 'string' ? retVal : 'This value is invalid';
                                                        $('label[for = "'+formField.key+'"]').html(excuse);
                                                        //continue;
                                                    } else {
                                                        $('label[for = "'+formField.key+'"]').html('');
                                                    }
                                                } catch (e) {
                                                    alert(JSON.stringify(e));
                                                    //continue;
                                                }
                                            }
                                        }

                                        if (isRequired && fieldValue.length == 0) {
                                            isFieldValid = false;
                                            $formControl.parent().parent().addClass('has-error');
                                            $formControl.parent().addClass('has-error');
                                            excuse = excuse || "The value cannot be empty";
                                            $('label[for = "'+formField.key+'"]').html(excuse);
                                            //alert(isFieldValid);
                                            //continue;
                                        } else {
                                            $('label[for = "'+formField.key+'"]').html('');
                                            $formControl.parent().parent().removeClass('has-error');
                                            $formControl.parent().removeClass('has-error');
                                        }

                                        if (extra == "select" || extra == "multiselect") {
                                            if (!isFieldValid) {
                                                isFieldValid = false;
                                                excuse = 'Kindly select an option';
                                                $formControl.parent().parent().addClass('has-error');
                                                currentField = formField.name;
                                                $('label[for = "'+formField.key+'"]').html('Kindly select an option');
                                            } else {
                                                $formControl.parent().parent().removeClass('has-error');
                                                $('label[for = "'+formField.key+'"]').html('');
                                            }
                                        } else if (extra == "phone" || extra == "text") {
                                            var param = JSON.parse($formControl.attr("parameters"));
                                            var valueLength = fieldValue.length;
                                            var min = param['min_length'] ? param['min_length'] : 0;
                                            var max = param['max_length'] ? param['max_length'] : 0;

                                            if (!isFieldValid) {
                                                $formControl.parent().addClass('has-error');
                                                //currentField = formField.name;
                                                //excuse = "Value must be between " + min + " and " + max + " characters long";
                                                $('label[for = "'+formField.key+'"]').html(excuse);
                                            } else if (valueLength > 0 && ((min && valueLength < min) || (max && valueLength > max))) {
                                                isFieldValid = false;
                                                $formControl.parent().addClass('has-error');
                                                currentField = formField.name;
                                                excuse = "Number must be between " + min + " and " + max + " digits long";
                                                $('label[for = "'+formField.key+'"]').html("Number must be between " + min + " and " + max + " digits long");
                                            } else if (isFieldValid) {
                                                $formControl.parent().removeClass('has-error');
                                                $('label[for = "'+formField.key+'"]').html('');
                                            }
                                        } else if (extra == "number") {
                                            var param = JSON.parse($formControl.attr("parameters"));
                                            var valueLength = fieldValue.length;
                                            var min = param['min_value'];// ? param['min_value'] : 0;
                                            var max = param['max_value'];// ? param['max_value'] : 0;

                                            if (!isFieldValid) {
                                                $formControl.parent().addClass('has-error');
                                                currentField = formField.name;
                                            } else if (fieldValue && ((min && fieldValue < min) || (max && fieldValue > max))) {
                                                isFieldValid = false;
                                                $formControl.parent().addClass('has-error');
                                                currentField = formField.name;
                                                excuse = "Number must be between " + min + " and " + max;
                                                $('label[for = "'+formField.key+'"]').html("Number must be between " + min + " and " + max);
                                            }
                                            min = param['min_length'] ? param['min_length'] : 0;
                                            max = param['max_length'] ? param['max_length'] : 0;

                                            if (valueLength > 0 && ((min && valueLength < min) || (max && valueLength > max))) {
                                                isFieldValid = false;
                                                $formControl.parent().addClass('has-error');
                                                currentField = formField.name;
                                                excuse = "Number must be between " + min + " and " + max + " digits long";
                                                $('label[for = "'+formField.key+'"]').html("Number must be between " + min + " and " + max + " digits long");
                                            }

                                            if (isFieldValid) {
                                                $formControl.parent().removeClass('has-error');
                                                $('label[for = "'+formField.key+'"]').html('');
                                            }

                                        } else if (extra == "gps") {
                                            if (!isFieldValid) {
                                                entityContext[key] = fieldValue;
                                                isFieldValid = false;
                                                $formControl.parent().addClass('has-error');
                                                excuse = 'This option is required';
                                                $('label[for = "'+formField.key+'"]').html('This option is required');
                                                currentField = formField.name;
                                            } else {
                                                $formControl.parent().removeClass('has-error');
                                                $('label[for = "'+formField.key+'"]').html('');
                                            }
                                        } else if (extra == "fingerprint" || extra == "signature" || extra == "camera") {
                                            if (isRequired){
                                                if (!isFieldValid) {
                                                    isFieldValid = false;
                                                    //$formControl.parent().addClass('has-error');
                                                    $formControl.parent().parent().addClass('has-error');
                                                    currentField = formField.name;
                                                    $('label[for = "'+formField.key+'"]').html('This field is required');
                                                } else {
                                                    //$formControl.parent().removeClass('has-error');
                                                    $formControl.parent().parent().removeClass('has-error');
                                                    $('label[for = "'+formField.key+'"]').html('');
                                                }
                                            } else {
                                                $formControl.parent().parent().removeClass('has-error');
                                            }

                                        } else if (extra == "email") {
                                            if (!isFieldValid || (fieldValue.length && !isValid.email(fieldValue))) {
                                                isFieldValid = false;
                                                $formControl.parent().addClass('has-error');
                                                currentField = formField.name;
                                                excuse = 'Please enter a valid email address';
                                                $('label[for = "'+formField.key+'"]').html('Please enter a valid email address');
                                            } else {
                                                $formControl.parent().removeClass('has-error');
                                                $('label[for = "'+formField.key+'"]').html('');
                                            }
                                        } else if (!isFieldValid) {
                                            isFieldValid = false;
                                            $formControl.parent().addClass('has-error');
                                            currentField = formField.type;
                                        } else {
                                            $formControl.parent().parent().css({"border": "none"});
                                            $formControl.parent().removeClass('has-error');
                                        }
                                        validResult = validResult && isFieldValid;
                                    }
                                }
                            }

                            if (formConfig.hasOwnProperty('parameters') && formConfig.parameters.hasOwnProperty('is_gps_required')){
                                if (latestLocation.longitude == 0){
                                    validResult = false;
                                    showMessage('This form also requires your current location. Kindly enable your location settings', 'short', 'bottom');
                                }
                            }
                            var returnObject = {
                                "returnValue": validResult,
                                "offenders": currentField
                            };
                            if (returnObject.returnValue){
                                txDeferred.resolve();
                            } else {
                                txDeferred.reject();
                            }
                            //txDeferred.resolve(returnObject);
                        });
                //} catch (e){
                    //alert(e.messJSON.stringify(e));
                    //txDeferred.reject(e);
                //}

                return txDeferred.promise();
            },
            "getDataToSave": function(formRef, canSubmit, isError) {
                var txDeferred = $.Deferred();

                $.when(initFunctions.getFormConfigByRef(formRef))
                    .done(function(data){
                        var formConfig = data;
                        var error = (isError == 0 || isError == 1) ? isError : 4; // default number for draft
                        //var formConfig = initFunctions.getFormConfigByRef(formRef);
                        var title = (formConfig.hasOwnProperty('parameters') && formConfig.parameters.hasOwnProperty('templates') && formConfig.parameters.templates.hasOwnProperty('submission_label')) ? formConfig.parameters.templates.submission_label : null; //formConfig.templates.submission_label : "";
                        var formName = formConfig.hasOwnProperty('parameters') && formConfig.parameters.label ? formConfig.parameters.label : formConfig.name;
                        var formIcon = formConfig.hasOwnProperty('parameters') && formConfig.parameters.hasOwnProperty('templates') && formConfig.parameters.templates.hasOwnProperty('submission_icon') ? formConfig.parameters.templates.submission_icon : null;
                        var version = formConfig.hasOwnProperty('version') ? formConfig.version : "";
                        var entity = {};
                        //alert('Length of pages '+formConfig.pages.length);

                        for (var i = 0, len = formConfig.pages.length ; i < len; i++) {
                            //alert('Length of pages '+formConfig.pages[i].fieldsets.length);
                            for (var j = 0, alen = formConfig.pages[i].fieldsets.length ; j < alen; j++) {
                                for (var k = 0, blen = formConfig.pages[i].fieldsets[j].fields.length ; k < blen; k++) {

                                    var entityContext = entity;
                                    var formField = formConfig.pages[i].fieldsets[j].fields[k];
                                    var $formControl;


                                    var $formControl = Activity.getCurrentStackObject().find('[name = "'+formField.key+'"]');


                                    var tagName = $formControl.prop('tagName');
                                    var key = formField.key;

                                    if ($formControl.attr("extra") == "select") {
                                        entityContext[key] = {"name" : $formControl.find('option:selected').attr('name'), "id" : $formControl.val()};

                                    } else if ($formControl.attr("extra") == "rating") {
                                        entityContext[key] = $formControl.raty('score');
                                    } else if ($formControl.attr("extra") == "checkbox") {
                                        var map = [];
                                        $('[name="'+formField.key+'"]:checked').each(function() {
                                            map.push($(this).val())
                                        });
                                        entityContext[key] = map;
                                    } else if ($formControl.attr("extra") == "radio") {
                                        var val = '';
                                        $('[name="'+formField.key+'"]:checked').each(function() {
                                            val = $(this).val()
                                        });
                                        entityContext[key] = val;
                                        alert(val);
                                    } else if ($formControl.attr("extra") == "multiselect") {
                                        entityContext[key] = $formControl.val();
                                    } else if ($formControl.attr("extra") == "gps") {
                                        if ($formControl.val() == "") {
                                            entityContext[key] = $formControl.val();
                                        } else {
                                            var coords = $formControl.val().split(",");
                                            entityContext[key] = {"longitude" : coords[0], "latitude" : coords[1], "timestamp":coords[2]}
                                        }
                                    } else if ($formControl.attr("extra") == "textarea") {
                                        entityContext[key] = $formControl.val();
                                        //alert("image is ="+$formControl.val()+ " and name is "+formField.name+ " and key is "+formField.key);
                                    } else if ($formControl.attr("extra") == "fingerprint") {
                                        entityContext[key] = $formControl.attr("src") == "img/fingerprint.png" ? null : $formControl.attr("src");
                                        // Get fingerprint template if any
                                        try{
                                            alert('fetching template key');
                                            var par = $formControl.attr("parameters");
                                            var params = par ? JSON.parse(par) : false;
                                            if (params && params.hasOwnProperty('template_key')){
                                                var templateVal = $('[name="'+ params.template_key + '"]').val();
                                                entityContext[params.template_key] = templateVal;
                                            } else {
                                                //alert('no template key '+params);
                                            }
                                        } catch (e){
                                            alert(JSON.stringify(e));
                                        }
                                    } else if ($formControl.attr("extra") == "signature") {
                                        entityContext[key] = $formControl.attr("src") == "img/signature.png" ? null : $formControl.attr("src");
                                    } else if ($formControl.attr("extra") == "image") {
                                        entityContext[key] = $formControl.attr("src") == "img/camera.png" ? null : $formControl.attr("src");
                                    } else if ($formControl.attr("extra") == "audio") {
                                        var dat = {
                                            file_path : $('#'+formField.key+'_source').attr('path'),
                                            raw_data : $('#'+formField.key+'_source').attr('src')
                                        }
                                        entityContext[key] = dat;//$('#'+formField.key+'_source').attr('src');
                                    } else {
                                        entityContext[key] = tagName == "IMG" ? $formControl.attr("src") : $formControl.val();
                                    }

                                    var regexp = new RegExp("\{" + formField.key + "\}", "ig");

                                    if (title){
                                        title = title.replace(regexp, entityContext[key]);
                                    }

                                    if (formIcon && entityContext[key] != "img/camera.png" && entityContext[key] != "img/fingerprint.png" && entityContext[key] != "img/signature.png") {
                                        formIcon = formIcon.replace(regexp, entityContext[key]);
                                    }
                                    ////alert(JSON.stringify(entityContext));
                                }
                            }
                        }

                        // Check for empty title submission

                        if (title && (title.trim().length == 0 || title.trim().charAt(0) == '{') ) {
                            title = null;
                        }

                        // sets icon to null when there is no matching key
                        if(formIcon && formIcon.trim().charAt(0) == '{') {
                            formIcon = null;
                        }

                        var descObj = {
                            "form_name": formName,
                            "icon": formIcon
                        };
                        var descStr = JSON.stringify(descObj);

                        var deflatedEntity = null;

                        // Update the special file context key before deflating
                        if (app.activeFormData) {
                            entity["__context__"] = app.activeFormData["__context__"];
                        }

                        var transferData = {
                            applet: {
                                id: formConfig.id
                            },
                            meta:{
                                ref : guid(),
                                device: {
                                    "model": device.model,
                                    "uuid": device.uuid,
                                    "platform": device.platform
                                },
                                location: latestLocation
                            },
                            data: entity
                        };
                        //alert(JSON.stringify(entity));


                        //get coordinates
                        $.when(deflateEntity(JSON.stringify(transferData)))
                            .done(function(entityFilename){
                                //deflatedEntity = _deflatedEntity;
                                //syncPlugin.start(getSubmissionEndpoint(), getUserCredentials().username,getUserCredentials().api_key, function(){
                                var formData = {
                                    id: app.activeFormData ? app.activeFormData.id : undefined,
                                    ref: formConfig.id,
                                    version: version,
                                    status: canSubmit ? initFunctions.form_status.PROCESSING : initFunctions.form_status.UNPROCESSED,
                                    data: entityFilename,
                                    title: title,
                                    description: descStr,
                                    isError: error,
                                    mode: APPLET_MODE,
                                    owner: getUserCredentials().username,
                                    realm: getEndpoint(),
                                    endpoint: getSubmissionEndpoint(),
                                    api_key:getUserCredentials().api_key
                                    //location: JSON.stringify(position)
                                };

                                var returnObj = {
                                    compressed: formData,
                                    original: transferData
                                };
                                //alert(JSON.stringify(returnObj.original));

                                txDeferred.resolve(returnObj);
                            })
                            .fail(function(error){
                                //TODO
                                txDeferred.reject(error);
                            });
                    })

                return txDeferred.promise();
            },
            "save": function(formRef, canSubmit, isError) {
                var saveDeferred    = $.Deferred();
                var formData        = null;
                var transferData          = null;
                var error           = (isError == 0 || isError == 1) ? isError : 4; // default number for draft
                try {
                    $.when(app.form.getDataToSave(formRef, canSubmit, isError))
                        .done(function(data){
                            formData                     = data.compressed;
                            transferData                 = data.original;
                            var dbFunction               = formData.id ? initFunctions.database.update : initFunctions.database.insert;
                            var formExistsPreviously     = formData.id ? true : false;

                            $.when(dbFunction(formData))
                                .done(function(tx, formDataSet) {
                                    if(formData.isError == 1) { // Errors exist in the form
                                        saveDeferred.reject("Errors exist in your form, Saving to Outbox");
                                    } else { // The form is good to be sent
                                        saveDeferred.resolve("Success! Your data will be sent in the background!");
                                    }
                                })
                                .fail(function(error) { // if update or delete function fails
                                    saveDeferred.reject(error);
                                });
                        })
                        .fail(function(error){
                            //TODO
                            ////debug(error, "alert");
                        });
                } catch(e){
                    alert(JSON.stringify(e));
                    saveDeferred.reject('Error occured while saving your form');
                }

                return saveDeferred.promise();
            }
        },
        events: {
            onFormClicked: function(event, formRef) {
                var txDeferred = $.Deferred();
                try{
                    $.when(privateCtlr.fetchApplet(formRef))
                        .done(function(data){
                            var formConfig = data;
                            if (formConfig && formConfig.mode && formConfig.mode == "form"){
                                var formValidated = validateConfig(formConfig);
                                if  (formValidated.isValid) {
                                    $.when(app.constructors.createFormDataEditor(null, formRef, formConfig, 'private'))
                                        .done(function() {
                                            txDeferred.resolve();
                                        })
                                        .fail(function() {
                                            swal({
                                                title: "Something went wrong",
                                                text: "There is an error with your form. Kindly modify using the web editor and refresh your Workspace details.",
                                                type: 'error'
                                            });
                                            //showMessage('There is an error with your form. Kindly modify using the web editor and refresh your Workspace details');
                                            txDeferred.reject();
                                        })
                                } else {
                                     swal({
                                          title: "Something went wrong",
                                          text: "The format of this form is wrong, please contact your administrator",
                                          type: 'error'
                                     });
                                    //window.plugins.toast.show("The format of this form is wrong, please contact your administrator", "short", "bottom");
                                    txDeferred.reject();
                                }
                            } else {
                                app.constructors.createFormDataEditor(null, formRef, formConfig, 'form_group_list',null,null);
                            }
                        })
                } catch(e) {
                    //customFunctions.closeNotificationDialog();
                    alert(JSON.stringify(e));
                    txDeferred.reject(e);
                }
                //customFunctions.closeNotificationDialog();
                /*$(".clickable").on('click', function(event){
                    event.stopPropagation();
                    $.when(app.events.onFormClicked(event, $(this).attr('form-ref')))
                        .done(function() {})
                        .fail(function() {});
                });*/
                txDeferred.promise();
            },
            onMainMenuClicked: function(event) {

            },
            beforeFormCreated: function() {

            },
            onFormCreated: function(event, formData, isFormStillActive, isFormDeletable, isPreviewable) {
                //customFunctions.displayNotificationDialog("", "populating");
                var transferData        = null;
                var formRef             = null;
                var formConfig          = null;
                var entity              = null;
                $.when(inflateEntity(formData.data))
                    .done(function(_inflatedTransferData){
                        if (device.platform == 'iOS') {
                            transferData = JSON.parse(_inflatedTransferData);
                        } else {
                            transferData = _inflatedTransferData;
                        }
                        formRef = formData.ref;
                        entity = transferData.data;
                        $.when(populateForm(entity, formRef, null, isPreviewable))
                            .done(function () {
                                if (isFormStillActive){
                                    app.form.submit(formRef);
                                }
                                if (isFormDeletable){
                                    var sql = 'DELETE FROM FORM_DATA WHERE ID = '+formData.tmpId;
                                    $.when(initFunctions.database.execute(sql))
                                        .done(function(){})
                                }
                            });
                    })
                    .fail(function(error){
                        //TODO
                        ////debug(error, "alert");
                    });
            },
            onAutoCompleteFilter: function(event, data) {
                var $ul = $(event.target);
                var value = $(data.input).val();

                $ul.html("");

                if (!value || value.length < 3) {
                    return;
                }

                $ul.html("<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>");
                $ul.listview("refresh");

                $ul.data("autocomplete-input", $(data.input));
                $ul.trigger("change", [value]);
            }
        },
        // HTML STRINGS
        html_factory: {
            getPanelHTML: function(name, type, options) {
                try {
                    var optionsSnippet = '';
                    var snippet = "";
                    var realm = JSON.parse(window.localStorage["realm_full"]).name;
                    var profile =   '<div class="nd2-sidepanel-profile panel-black-bg">'+
                                        '<div class="row" style="margin-top: -11% !important; margin-bottom: -15% !important;">'+
                                            '<div class="col-xs-4 center-xs">'+
                                                '<div class="box">'+
                                                    '<img onclick="editProfile()" class="profile-thumbnail" src="'+(getUserCredentials() != null ? getUserCredentials().avatar : "img/unknown.png")+'" />'+
                                                '</div>'+
                                            '</div>'+
                                            '<div class="col-xs-8">'+
                                                '<div>'+
                                                    '<p class="profile-text" style="font-size: 12px; !important; color:white !important;">'+(getUserCredentials() != null ? getUserCredentials().name : "Unknown user")+'</p>'+
                                                    '<p class="profile-realm" style="font-size: 10px;!important;color: #67809F !important;margin-top: -20px;">'+realm+'</p>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>'+
                                    '</div>';
                    var basic =
                        '<ul data-role="listview" data-inset="false" data-icon="false">'+
                            optionsSnippet+
                            '<li><br/><a onclick = "privateCtlr.updateRealmConfig()" class="panel-black-bg" style="font-size: large;" data-ajax="false"><i class="fa fa-refresh" style="color:#1BBC9B;"></i> &nbsp;&nbsp;&nbsp;Sync</a></li>'+
                            '<li><br/><a onclick = "inviteUser()" data-ajax="false" class="panel-black-bg" style="font-size: large;"><i class="fa fa-users" style="color:#F7CA18;"></i> &nbsp;&nbsp;Invite</a></li>'+
                            (globals.canShowExplore() && isCurrentUserAnAdmin() ? '<li><br/><a onclick = "Browser.openBrowser()" class="panel-black-bg" data-ajax="false" style="font-size: large;"><i class="fa fa-search-plus" style="color:#BF55EC;"></i> &nbsp;&nbsp;Explore</a></li>' : '')+
                            (!isCurrentUserAnAdmin() ? '<li><br/><a onclick = "openSendMessageModal()" data-ajax="false" class="panel-black-bg" style="font-size: large;"><i class="pg-comment" style="color:#E4F1FE;"></i> &nbsp;&nbsp;Feedback</a></li>' : '')+
                            (globals.canShowExplore() && isCurrentUserAnAdmin() ? '<li><br/><a onclick="showUrl(\'http://formelo.com/help\')" class="panel-black-bg" data-ajax="false" style="font-size: large;"><i class="fa fa-question" style="color:#D24D57;"></i> &nbsp;&nbsp;&nbsp;Help</i></a></li>' : '')+
                        '</ul>';

                    var html = '<div class = "main-panel panel-black-bg" data-role="panel" id="' + name + '" data-display="overlay" data-position-fixed="true" data-position="right">' +
                        profile +
                        snippet +
                        basic +
                        '</div>';
                    return html;
                } catch (e){
                    alert(JSON.stringify(e));
                }
            },
            getHeaderHTML: function(options) {
                var defaults = {
                    previous: {
                        icon: "fa fa-chevron-left"
                    },
                    next: {
                        icon: "fa fa-chevron-right"
                    }
                };
                var settings = $.extend(true, {}, defaults, options);
                //applet_mode
                var subHeader = (settings.applet_mode && settings.applet_mode == 'private') ? 'onclick = "gotoFormGroupPage(\''+settings.isSubmittable+'\')"' : 'onclick = "createDashboardPage(\''+settings.applet_mode+'\')"';
                var panelName = "formpanel" + settings.number;
                var html = '';//app.html_factory.getPanelHTML(panelName, true, {});

                html += '<div data-role="header" data-position="fixed" class="blue-gradient" data-tap-toggle="false" data-hide-during-focus="false">'+
                            '<h1 data-wow-delay="0.4s" style="text-align: center !important;">'+settings.title+'</h1>'+
                            '<a '+subHeader+' class="ui-btn ui-btn-right header-link exitForm">Exit <i class="pg-close_line"></i></a>'+
                         '</div>';
                return html;
            },
            getFormsListContentHTML: function (conf) {
                var tmpHtml             = '';
                var tmpImage            = 'img/loading.png';
                var fullHeightClass     = '';
                var title               = '';
                var content             = '';
                if (getUserCredentials().role.toLowerCase() == 'administrator'){
                    title   = 'Your Workspace is empty';
                    content = '<button onclick="Browser.openBrowser()" class="btn btn-primary btn-cons" style="max-width: 250px; margin:auto; padding: 10px;">Browse the Library</button>';
                } else {
                    title   = 'Nothing assigned to you.';
                    content = '<button onclick="openSendMessageModal()" class="btn btn-primary btn-cons" style="max-width: 250px; margin:auto; padding: 10px;">Contact the Admin</button>';
                }

                try{
                    if (config.user_groups.length){
                        fullHeightClass = '';
                         for (var i = 0; i < config.user_groups.length; i++) {
                            var groupName       = config.user_groups[i].name;
                            var subTmpHtml      = '';
                            var groupApplets    = config.user_groups[i].applets;

                            for (var j = 0; j < groupApplets.length; j++){
                                var appletId = groupApplets[j].id;
                                var formConfig = config[Constants.private.user_groups][appletId];
                                var image = 'img/bg/'+formConfig.name.charAt(0).toUpperCase()+'.gif';
                                if (formConfig.hasOwnProperty('icon_url') && formConfig.icon_url.trim().length){
                                    image = formConfig.icon_url;
                                }

                                if (formConfig){
                                    subTmpHtml +=
                                        '<div class="form-clickable clickable card-header clearfix" form-ref="'+formConfig.id+'">'+
                                            '<div class="user-pic pull-left">'+
                                                '<img alt="Profile Image" width="33" height="33" data-src-retina="'+image+'" data-src="'+image+'" src="'+image+'">'+
                                            '</div>'+
                                            '<div style="margin-left: 40px">'+
                                                '<h5 style="font-weight:300;">'+formConfig.name+'</h5>'+
                                                '<h6>'+formConfig.description+'</h6>'+
                                            '</div>'+
                                        '</div>';
                                } else {
                                    alert(appletId);
                                }
                            }

                            tmpHtml += '<div data-pages="portlet" class="panel panel-default" id="portlet-basic">'+
                                            '<div class="panel-heading ">'+
                                                '<div class="panel-title">'+groupName+'</div>'+
                                                '<div class="panel-controls">'+
                                                    '<ul>'+
                                                        '<li><a data-toggle="collapse" class="portlet-collapse" href="#"><i class="pg-arrow_maximize"></i></a>'+
                                                        '</li>'+
                                                    '</ul>'+
                                                '</div>'+
                                            '</div>'+
                                            '<div class="panel-body" style="display: block; padding:0;">'+
                                                '<div class="card share xcol1" data-social="item" xid="applet-list-placeholder">'+
                                                    subTmpHtml+
                                                '</div>'+
                                            '</div>'+
                                       '</div>';
                            }
                    } else {
                        fullHeightClass = 'full-vh';
                         tmpHtml = ''+
                        '<div class="container-xs-height full-vh">'+
                          '<div class="row-xs-height">'+
                            '<div class="col-xs-height col-middle">'+
                              '<div class="error-container text-center">'+
                                '<h1 class="error-number" style="color: grey;"><img class="sm-image-responsive-height" style="width:100px" src="img/empty-states/no-applets.png"></h1>'+
                                '<h2 class="semi-bold" style="color: grey">'+title+'</h2>'+
                                '<p class="fs-12 hint-text" style="text-align: center; padding: 0px  10px; text-shadow: none;">'+content+'</p>'+
                              '</div>'+
                            '</div>'+
                          '</div>'+
                        '</div>';
                    }
                } catch(e){
                    fullHeightClass = 'full-vh';
                    tmpHtml = ''+
                        '<div class="container-xs-height full-vh">'+
                          '<div class="row-xs-height">'+
                            '<div class="col-xs-height col-middle">'+
                              '<div class="error-container text-center">'+
                                '<h1 class="error-number" style="color: grey;"><img class="sm-image-responsive-height" style="width:100px" src="img/empty-states/no-applets.png"></h1>'+
                                '<h2 class="semi-bold" style="color: grey">'+title+'</h2>'+
                                '<p class="fs-12 hint-text" style="text-align: center; padding: 0px  10px; text-shadow: none;">'+content+'</p>'+
                              '</div>'+
                            '</div>'+
                          '</div>'+
                        '</div>';
                }
                var html = ''+
                    '<div id="formGroupListMain" class="'+fullHeightClass+'" role="main"  data-inset="false">'+
                        tmpHtml+
                    '</div>';

                return html;
            },
            getEmptyFormGroupHtml: function(){

            },
            getFormDataListContentHTML: function(formDataSet) {

                var html ='';
                var liHTML = '';
                var initialDate = "2342";
                var numOfDays = 0;
                var open = false;

                if(!formDataSet.rows.length){
                    $('#data-list-content').addClass('full-vh');
                    var tmpHtml = ''+
                        '<div class="container-xs-height full-vh">'+
                        '<div class="row-xs-height">'+
                        '<div class="col-xs-height col-middle">'+
                        '<div class="error-container text-center">'+
                        '<h1 class="error-number" style="color: grey;"><img class="sm-image-responsive-height" style="width:100px" src="img/empty-states/no-drafts.png"></h1>'+
                        //'<h1 class="error-number" style="color: grey;">No</h1>'+
                        '<h2 class="semi-bold" style="color: grey">Nothing left to do</h2>'+
                        '<p class="fs-12 hint-text" style="text-align: center; padding: 0px  10px; text-shadow: none;">You can access any saved or incomplete work here</p>'+
                        '</div>'+
                        '</div>'+
                        '</div>'+
                        '</div>';
                    $('#data-list-content').html(tmpHtml).trigger('create');
                    return;
                } else {
                    $('#data-list-content').removeClass('full-vh');
                }

                for (var i = 0, len = formDataSet.rows.length; i < len; i++) {
                    var formData = formDataSet.rows.item(i);
                    var formTitle = (formData.title && formData.title != "null") ? formData.title : "Untitled";
                    var image = formTitle.charAt(0).toUpperCase();
                    var description = JSON.parse(formData.description);
                    var errorIcon = formData.error != 0 ? "fa fa-exclamation-triangle" : "fa fa-check";

                    if (description.icon && description.icon != "null") {
                        image = description.icon;
                    } else {
                        if (/[^a-zA-Z]/.test(image)){
                            image = "img/bg/unknown.gif";
                        } else {
                            image = "img/bg/" + image + ".gif";
                        }
                    }
                    if (initialDate != moment(formData.last_modified_time).format('MMMM Do YYYY')) {
                        if (open){
                            html +=  '</div>'+
                            '</div>'+
                            '</div>';
                            initialDate = moment(formData.last_modified_time).format('MMMM Do YYYY');
                            open = false;
                        }
                        html += '<div data-pages="portlet" class="panel panel-default" id="portlet-basic">'+
                                        '<div class="panel-heading ">'+
                                            '<div class="panel-title">'+moment(formData.last_modified_time).format('MMMM Do YYYY')+'</div>'+
                                            '<div class="panel-controls">'+
                                                '<ul>'+
                                                '<li><a data-toggle="collapse" class="portlet-collapse" href="#"><i class="pg-arrow_maximize"></i></a>'+
                                                '</li>'+
                                                '</ul>'+
                                            '</div>'+
                                        '</div>'+
                                        '<div class="panel-body" style="display: block; padding:0;">'+
                                            '<div class="card share xcol1" data-social="item" id="applet-list-placeholder">'+
                                                '<div class="clickable card-header clearfix applet-list-item" form-data-id="' + formData.id + '" status="'+formData.status+'">'+
                                                    '<div class="user-pic">'+
                                                        '<img alt="Profile Image" width="33" height="33" data-src-retina="'+image+'" data-src="'+image+'" src="'+image+'">'+
                                                    '</div>'+
                                                    '<h6 style="float: right; font-size: xx-small; display: inline;">'+moment(formData.last_modified_time).format('hh:mma')+'</h6>'+
                                                    '<div style="margin-left: 40px">'+
                                                        '<h5>'+formTitle+'</h5>'+
                                                        '<h6>'+description.form_name+'</h6>'+
                                                    '</div>'+
                                                '</div>';
                         open = true;
                         initialDate = moment(formData.last_modified_time).format('MMMM Do YYYY');
                    } else {
                        html +=
                            '<div class="clickable card-header clearfix applet-list-item" form-data-id="' + formData.id + '" status="'+formData.status+'">'+
                                '<div class="user-pic">'+
                                    '<img alt="Profile Image" width="33" height="33" data-src-retina="'+image+'" data-src="'+image+'" src="'+image+'">'+
                                '</div>'+
                                '<h6 style="float: right; font-size: xx-small; display: inline;">'+moment(formData.last_modified_time).format('hh:mma')+'</h6>'+
                                '<div style="margin-left: 40px">'+
                                    '<h5>'+formTitle+'</h5>'+
                                    '<h6>'+description.form_name+'</h6>'+
                                '</div>'+
                            '</div>';
                    }
                }

                $('#data-list-content').html(html).trigger('create');
            },
            getFormOutboxDataListContentHTML: function(formDataSet, status, xtab) {
                var tab = xtab || false;
                //alert(tab);
                // 3 loops
                // if it is in the first loop,  set the query to 0

                if(!formDataSet.rows.length){
                    $('#data-list-content').addClass('full-vh');
                     var tmpHtml = ''+
                    '<div class="container-xs-height full-vh">'+
                    '<div class="row-xs-height">'+
                    '<div class="col-xs-height col-middle">'+
                    '<div class="error-container text-center">'+
                     '<h1 class="error-number" style="color: grey;"><img class="sm-image-responsive-height" style="width:100px" src="img/empty-states/no-outbox.png"></h1>'+
                         '<h2 class="semi-bold" style="color: grey">Nothing to send</h2>'+
                         '<p class="fs-12 hint-text" style="text-align: center; padding: 0px  10px; text-shadow: none;">Everything that\'s been sent or about to be sent will be listed here</p>'+
                    '</div>'+
                    '</div>'+
                    '</div>'+
                    '</div>';
                    $('#data-list-content').html(tmpHtml).trigger('create');
                    return;
                } else {
                    $('#data-list-content').removeClass('full-vh');
                    adjustHeightsToViewport();
                }
                var html =  '<ul class="nav nav-tabs nav-tabs-simple" role="tablist">'+
                    '<li id="xcompleted" xclass="active"><a href="#completed" data-toggle="tab" role="tab">Completed</a>'+
                    '</li>'+
                    '<li id="xerror"><a href="#error" data-toggle="tab" role="tab">Error</a>'+
                    '</li>'+
                    '<li id="xsent"><a href="#sent" data-toggle="tab" role="tab">Sent</a>'+
                    '</li>'+
                    '</ul>'+
                    '<div class="tab-content">';
                for (var a = 0; a < 3; a++) {
                    var liHTML = '';
                    var initialDate = "2342";
                    var numOfDays = 0;

                    var activeTab = "";
                    var activeNumber = -1;
                    var activeStatus = -1;
                    var all = true;
                    // Completed    = Error == 0 and Status == 1
                    // Sent         = Error == 0 and Status == 2
                    // Errors       = Error == 1 and Status == 1
                    switch (a) {
                        case 0 :
                            activeTab = "completed";
                            activeNumber = 0;
                            activeStatus = 1;
                            all = false;
                            break;
                        case 1 :
                            activeTab = "error";
                            activeNumber = 1;
                            activeStatus = 1;
                            all = false;
                            break;
                        case 2 :
                            activeTab = "sent";
                            activeNumber = 0;
                            activeStatus = 2;
                            all = false;
                    }

                    html += '<div class="tab-pane slide-left" id="'+activeTab+'">'+
                    '<div class="card share xcol1" data-social="item" id="applet-list-placeholder">';

                    for (var i = 0, len = formDataSet.rows.length; i < len; i++) {
                        var formData = formDataSet.rows.item(i);
                        if (formData.error == activeNumber && formData.status == activeStatus) {
                            var formTitle = (formData.title && formData.title != "null") ? formData.title : "Untitled";
                            var image = formTitle.charAt(0).toUpperCase();
                            var description = JSON.parse(formData.description);
                            var errorIcon = formData.error != 0 ? "fa fa-exclamation-triangle" : "fa fa-check";

                            if (description.icon && description.icon != "null") {
                                image = description.icon;
                            } else {
                                if (/[^a-zA-Z]/.test(image)){
                                    image = "img/bg/unknown.gif";
                                } else {
                                    image = "img/bg/" + image + ".gif";
                                }
                            }

                            if (initialDate != moment(formData.last_modified_time).format('MMMM Do YYYY')) {
                                 html += '<h4 style="font-size: small;font-weight: 300;text-align: center;border-bottom: 1px solid #F0F0F0;">'+moment(formData.last_modified_time).format('MMMM Do YYYY')+'</h4>';
                                 initialDate = moment(formData.last_modified_time).format('MMMM Do YYYY');
                            }
                                var timeToShow = formData.status == 2 ? formData.submission_time : formData.last_modified_time;
                                liHTML = '<div class="card-header clearfix" form-data-id="' + formData.id + '" status="'+formData.status+'" >'+
                                '<div class="user-pic">'+
                                '<img alt="Profile Image" width="33" height="33" data-src-retina="'+image+'" data-src="'+image+'" src="'+image+'">'+
                                '</div>'+
                                '<h6 style="float: right; font-size: xx-small; display: inline;">'+moment(timeToShow).format('hh:mma')+'</h6>'+
                                '<div style="margin-left: 40px">'+
                                    '<h5>'+formTitle+'</h5>'+
                                    '<h6>'+description.form_name+'</h6>'+
                                '</div>'+
                                '</div>';
                                html += liHTML;
                        }
                    }
                    html += '</div></div>';
                }
                html += '</div>';

                $('#data-list-content').html(html);
                if(tab){
                    $('#'+tab).addClass('active');
                    $('#x'+tab).addClass('active');
                } else {
                    $('#completed').addClass('active');
                    $('#xcompleted').addClass('active');
                }
                BODY.trigger('refresh');
            },
            getUserActivities: function(LogDataSet) {
                /*
                 SYNC_PASSED
                 */
                var map = {
                    /*"SYNC_PASSED"               : {
                     "text" : "Sync successful",
                     "icon": "fa fa-check-circle"
                     },
                     "SYNC_FAILED"               : {
                     "text" : "Sync completed with errors",
                     "icon": "fa fa-exclamation-circle"
                     },
                     "FORM_WITH_ERRORS"          : {
                     "text" : "Submitted form with errors",
                     "icon": "fa fa-exclamation"
                     },
                     "FORM_NOT_SUBMITTED"        : {
                     "text" : "Form couldn\'t be submitted",
                     "icon": "fa fa-times"
                     },
                     "FORM_UPDATED"              : {
                     "text" : "Updated form",
                     "icon": "fa fa-pencil-square-o"
                     },
                     "FORM_DRAFT"                : {
                     "text" : "Saved form to draft",
                     "icon": "fa fa-file"
                     },
                     "FORM_SUBMITTED"            : {
                     "text" : "Successfully submitted form",
                     "icon": "fa fa-check"
                     },*/
                    "FORM_DELETED"              : {
                        "text" : "You deleted a form",
                        "icon": "fa fa-trash-o"
                    },
                    "LOGIN"                     : {
                        "text" : "You logged in",
                        "icon": "fa fa-sign-in"
                    },
                    "LOGOUT"                    : {
                        "text" : "You logged out",
                        "icon": "fa fa-sign-out"
                    }
                };

                var html = '<ul data-role="listview" data-icon="false" class="ui-listview"> <hr/>';

                for (var i = 0; i < LogDataSet.rows.length; i++) {
                    var type    = LogDataSet.rows.item(i).TYPE;
                    var owner   = LogDataSet.rows.item(i).OWNER;
                    var ref     = LogDataSet.rows.item(i).FORM_REF != "null" ? (LogDataSet.rows.item(i).FORM_REF + ":") : "";
                    var time    = moment(LogDataSet.rows.item(i).TIME).format('h:mm A');

                    if (!map.hasOwnProperty(type)) { continue; }

                    html += ''  +
                    '<li>' +
                    '<a href="#" class="ui-btn waves-effect waves-button"> ' +
                    '<i class="' + map[type].icon + '"></i>&nbsp; ' +
                    map[type].text +
                    '<span class="dashboard-aside">'+time+'</span>' +
                    '</a>' +
                    '</li><hr/>';
                }

                html += '</ul>';

                return html;
            },
            getForminboxListContentHTML: function(formDataSet) {
                var html = '<div role="main" class="ui-content wow fadeIn" data-wow-delay="0.2s" data-inset="false">' +
                    '<br/>'+
                    '<ul class ="datalist" data-role="listview" xdata-inset="false" xdata-shadow="false" id="inboxlist" xdata-divider-theme="b">';

                var liHTML = '';
                var initialDate = "2342"; // bla bla

                for (var i = 0; i < formDataSet.rows.length; i++) {

                    var formData    = formDataSet.rows.item(i);
                    var currentDate = moment(formData.LAST_MODIFIED_TIME).format('MMMM Do YYYY');
                    var time        = moment(formData.LAST_MODIFIED_TIME).format('h:mm A');
                    var tempBody    = JSON.parse(formData.BODY);
                    var subject     = tempBody.subject;
                    var bodySummary = tempBody.body.substr(0, 100) + '...';
                    var image       = subject.trim().charAt(0).toUpperCase();
                    var from        = tempBody.from.trim();
                    var img         = tempBody.img;

                    if (/[^a-zA-Z]/.test(image)){
                        image = "img/bg/unknown.gif";
                    } else {
                        image = "img/bg/" + image + ".gif";
                    }

                    if (initialDate != currentDate) {
                        liHTML += '<li data-role="list-divider">' + currentDate + '<span class="ui-li-count"></span></li><hr/>';
                        initialDate = currentDate;
                    }

                    var snip        = '';
                    var fromSnippet = '';
                    var openedClass = '';
                    var openedClassTime = '';

                    if (formData.OPENED == 'N') {
                        fromSnippet = '<h2 class="text-wrap"><strong>' + from + '</strong></h2>';
                        snip        = '<h3 class="text-wrap"><strong>' + subject + '</strong></h3>';
                        openedClass = "unreadInboxItem";
                        openedClassTime = "listTimeUnread";
                    } else {
                        fromSnippet = '<h2 class="text-wrap">' + from + '</h2>';
                        snip        = '<h3 class="text-wrap">' + subject + '</h3>';
                    }

                    liHTML += '<li class="'+openedClass+'" form-data-id="' + formData.ID + '">' +
                    '<a href="javascript:;" class = "test">'+
                    '<img src="'+img+'" class="ui-thumbnail ui-thumbnail-circular" />'+
                    '<h2>'+fromSnippet+'</h2>'+
                    '<span class="listTime '+openedClassTime+'">'+time+'</span>'+
                    '<h3 class="text-wrap">'+snip+'</h3>'+
                    '<p class="text-wrap">'+bodySummary+'</p>'+
                    '</a> '+
                    '</li><hr class="inboxHr" />';

                }

                liHTML += '<li class="" form-data-id="">' +
                '<a href="javascript:;" class = "test">'+
                '<img src="img/image.svg" class="ui-thumbnail ui-thumbnail-circular" />'+
                '<h2>From</h2>'+
                '<span class="listTime">2:30pm</span>'+
                '<h3 class="text-wrap">Header</h3>'+
                '<p class="text-wrap">Snippet</p>'+
                '</a> '+
                '</li><hr class="inboxHr" />';

                html += liHTML;
                html += "</ul></div>";

                return html;
            },
            getFormPreviewContentHTML: function(formPage) {
                var html = '<div role="main">';

                for (var i = 0, len = formPage.fieldsets.length ; i < len; i++) {
                    html += '<div class="panel panel-transparent">'+
                    '<div class="panel-heading m-t-30">'+
                        '<div class="panel-title">'+formPage.fieldsets[i].name+
                        '</div>'+
                    '</div>'+
                    //html += '<h4 xclass="ui-bar' + (i ? '' : ' ui-bar-first') + '">' + formPage.fieldsets[i].name + '</h4><hr/>' +
                    //'<ul data-role="listview">';
                    '<div class="panel-body">';

                    for (var j = 0; j < formPage.fieldsets[i].fields.length; j++) {
                        var formField = formPage.fieldsets[i].fields[j];
                        //html += '<li' + (j != formPage.fieldsets[i].fields.length - 1 ? '' : ' class="ui-li-static-last"') + '>' +
                        html += app.html_factory.getReadonlyContentHTML(formField);
                        //'</li>';
                    }
                    html += '</div></div></div>';
                }

                return html;
            },
            getFormEditorContentHTML: function(formPage, next, back, options) {

                var totalPages  = options.pageLength;
                var currentPage = options.currentNo + 1;
                var snippet     = "";

                var html = '<div role="main">';

                for (var i = 0, alen = formPage.fieldsets.length; i < alen; i++) {
                    var fieldsetName = formPage.fieldsets[i].name ? formPage.fieldsets[i].name : "";
                    html += '<div class="panel panel-default ">'+
                            '<div class="panel-heading">'+
                                '<div class="panel-title">'+fieldsetName+
                                '</div>'+
                            '</div>'+

                        '<div class="panel-body" style="display: block; padding:2px;">';

                    for (var j = 0, blen = formPage.fieldsets[i].fields.length; j < blen; j++) {
                        var formField = formPage.fieldsets[i].fields[j];
                        if (formField.type == 'hidden') {
                            html += app.html_factory.getHiddenControlHTML(formField);
                        } else {
                            if (formField.type == 'text' || formField.type == 'number' || formField.type == 'phone' || formField.type == 'date' || formField.type == 'email' || formField.type == 'url' || formField.type == 'datetime' || formField.type == 'email' || formField.type == 'month' || formField.type == 'week' || formField.type == 'time') {
                                html += app.html_factory.getTextControlHTML(formField);
                            } else if (formField.type == 'radio') {
                                html += app.html_factory.getRadioControlHTML(formField);
                            } else if (formField.type == 'select' || formField.type == 'switch') {
                                html += app.html_factory.getSelectControlHTML(formField);
                            } else if (formField.type == 'slider') {
                                html += app.html_factory.getSliderControlHTML(formField);
                            } else if (formField.type == 'autocomplete') {
                                html += app.html_factory.getAutoCompleteControlHTML(formField);
                            } else if (formField.type == 'image') {
                                html += app.html_factory.getCameraControlHTML(formField);
                            } else if (formField.type == 'fingerprint') {
                                html += app.html_factory.getFingerprintControlHTML(formField);
                            } else if (formField.type == 'signature') {
                                html += app.html_factory.getSignatureControlHTML(formField);
                            } else if (formField.type == 'button') {
                                html += app.html_factory.getButtonControlHTML(formField);
                            } else if (formField.type == 'barcode') {
                                html += app.html_factory.getBarcodeControlHTML(formField);
                            } else if (formField.type == 'video') {
                                html += app.html_factory.getVideoControlHTML(formField);
                            } else if (formField.type == 'gps') {
                                html += app.html_factory.getGPSHTML(formField);
                            } else if (formField.type == 'xdatetime' || formField.type == 'xweek' || formField.type == 'xtime' || formField.type == 'xmonth') {
                                html += app.html_factory.getDateControlHTML(formField);
                            } else if (formField.type == 'textarea') {
                                html += app.html_factory.getTextareaHTML(formField);
                            } else if (formField.type == 'multiselect') {
                                html += app.html_factory.getMultipleSelectControlHTML(formField);
                            } else if (formField.type == 'checkbox') {
                                html += app.html_factory.getCheckBoxHtml(formField);
                            } else if (formField.type == 'audio') {
                                html += app.html_factory.getAudioControlHTML(formField);
                            } else if (formField.type == 'rating') {
                                html += app.html_factory.getRatingControlHTML(formField);
                            }

                        }
                    }
                    html += '</div></div>';
                }
                html += '</div>';
                return html;
            },
            getReadonlyContentHTML: function(formField) {
                // here we define the styles based on the type

                formField.id = app.createElementID('readonly');
                var label = formField.name;
                var html = '';
                var type = formField.type;

                if(type){
                    if (type == 'fingerprint' || type == 'image' || type == 'signature'){
                        var icon = type == 'fingerprint' ? 'img/fingerprint.png' : 'img/camera.png';
                        icon = type == 'signature' ? 'img/signature.png' : icon;
                        html = '<div class="form-group form-group-default">' +
                        '<label class = "formelo-form-label" for="' + formField.id + '">' + label + '</label>' +
                        '<div><img style="width:128px" id="' + formField.id + '" extra="readonly" mode="picture" name="' + formField.key + '" src="'+icon+'" /></div>' +
                        '</div>';
                    } else if (type == 'video') {

                    } else if (type == 'gps') {

                    } else if (type == 'button') {

                    } else {
                        html = '<div class="form-group form-group-default" >' +
                                    '<label class = "formelo-form-label" for="' + formField.id + '">' + label + '</label>' +
                                    '<input extra = "readonly" mode="'+formField.type+'" class="form-control" type="text" datatype = "readonly" name="' + formField.key + '" id="' + formField.id + '" readonly />' +
                                '</div>';
                    }
                }

                return html;
            },
            getHiddenControlHTML: function(formField) {
                formField.id = app.createElementID('hidden');
                var html = '<input type="hidden" name="' + formField.key + '" id="' + formField.id + '" value="" />';
                return html;
            },
            getButtonControlHTML: function(formField) {
                formField.id = app.createElementID('button');
                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var eventsHTML = '';
                if (formField.events) {
                    for (var key in formField.events) {
                        eventsHTML += ("on" + key + '=" ' + formField.events[key] + ' "');
                    }
                }
                var html = '<div class="form-group form-group-default" style="border-bottom: none !important;">' +
                    '<button data-inline="true" type="button" class="btn btn-primary ui-btn-inline" ' + eventsHTML + ' >' + label + '</button>' +
                    '</div>';

                return html;
            },
            getRatingControlHTML: function(formField) {
                formField.id = app.createElementID('text');
                var isReadonly = formField.hasOwnProperty('parameters') && formField.parameters.is_readonly;
                var isRequired = formField.hasOwnProperty('parameters') && formField.parameters.is_required;
                var defaultValue = formField.hasOwnProperty('parameters') && formField.parameters.default_value;
                var defaultValueText = defaultValue ? 'value="'+defaultValue+'"' : '';
                var extraAttributes;
                var eventsHTML = "";
                var tooltip = "";

                var type = formField.type == 'datetime' ? 'time' : formField.type;
                type = type == 'phone' ? 'number' : type;
                type = type == 'date'  ? 'text' : type;
                var disableClick = formField.type == 'date' ? 'readonly' : '';
                var disableStyle = formField.type == 'date' ? 'style="color:#2c2c2c"' : '';

                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                var labelAsterics = isRequired ? '*' : '';

                if (formField.hasOwnProperty('events')) {
                    for (var key in formField.events) {
                        eventsHTML += ("on" + key + '=" ' + formField.events[key] + ' "');
                    }
                }
                var html = '<div class="form-group form-group-default" style="border-bottom: none !important;">' +
                    '<label for="' + formField.id + '" class = "formelo-form-label">'+label+' '+tooltip+ '</label>'+
                    '<div id="'+formField.id+'" parameters=\''+JSON.stringify(formField.parameters)+'\'  class="rating-control" name="'+formField.key+'" extra="rating"></div>'+
                    '</div>';

                return html;
            },
            getTextControlHTML: function(formField) {
                formField.id = app.createElementID('text');
                var isReadonly = formField.hasOwnProperty('parameters') && formField.parameters.is_readonly;
                var isRequired = formField.hasOwnProperty('parameters') && formField.parameters.is_required;
                var defaultValue = formField.hasOwnProperty('parameters') && formField.parameters.default_value;
                var defaultValueText = defaultValue ? 'value="'+defaultValue+'"' : '';
                var extraAttributes;
                var eventsHTML = "";
                var tooltip = "";

                var type = formField.type == 'datetime' ? 'time' : formField.type;
                type = type == 'phone' ? 'number' : type;
                type = type == 'date'  ? 'text' : type;
                var disableClick = formField.type == 'date' ? 'readonly' : '';
                var disableStyle = formField.type == 'date' ? 'style="color:#2c2c2c"' : '';

                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                var labelAsterics = isRequired ? '*' : '';

                if (formField.hasOwnProperty('events')) {
                    for (var key in formField.events) {
                        eventsHTML += ("on" + key + '=" ' + formField.events[key] + ' "');
                    }
                }

                if (formField.hasOwnProperty('parameters') && formField.parameters.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.parameters.tooltip + '"></i>';
                }

                var html = ' <div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">'+
                    '<label for="' + formField.id + '" class = "formelo-form-label">'+label+' '+tooltip+ '</label>'+
                    '<input '+disableClick+' '+disableStyle+' extra = "'+formField.type+'" parameters=\''+JSON.stringify(formField.parameters)+'\'   type="' + type + '"' + eventsHTML + ' name="' + formField.key + '" id="' + formField.id + '"  class="form-control" '+defaultValueText+' '+(isRequired ? 'required ="" ' : '')+' '+(isReadonly ? 'readonly' : '')+'>'+
                    '</div>';

                html += '<label class="error error-label" for="' + formField.key + '"></label>';

                return html;
            },
            getDateControlHTML: function(formField) {
                formField.id = app.createElementID('date');

                var isReadonly = formField.hasOwnProperty('parameters') && formField.parameters.is_readonly;
                var isRequired = formField.hasOwnProperty('parameters') && formField.parameters.is_required;
                var defaultValue = formField.hasOwnProperty('parameters') && formField.parameters.default_value;
                var defaultValueText = defaultValue ? 'value="'+defaultValue+'"' : '';
                var extraAttributes;
                var eventsHTML = "";

                var tooltip = "";
                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                var labelAsterics = isRequired ? '*' : '';

                var type = "";

                switch (formField.type) {
                    case "datetime":
                        type = "datetime";
                        break;
                    case "time":
                        type = "time";
                        break;
                    case "week":
                        type = "week";
                        break;
                    case "month":
                        type = "month";
                        break;
                    case "default":
                        break;
                }

                for (var key in formField.events) {
                    eventsHTML += ("on" + key + '=" ' + formField.events[key] + ' "');
                }

                if (formField.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.tooltip + '"></i>';
                }

                var html = '<div class="form-group form-group-default" '+(isRequired ? 'required ' : '')+'">' +
                                '<label class="formelo-form-label" >' + label + ' ' + tooltip + '</label>' +
                                    '<input '+defaultValueText+' parameters=\''+JSON.stringify(formField.parameters)+'\'  class="form-control" type="' + type + '" ' + eventsHTML + ' name="' + formField.key + '" id="' + formField.id + '" ' +
                                    ' extra = "'+type+'" '+(isRequired ? 'required ="" ' : '')+' />' +
                            '</div>';
                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;
            },
            getTextareaHTML: function(formField) {
                formField.id = app.createElementID('text');
                var isRequired = formField.hasOwnProperty('parameters') && formField.parameters.is_required;
                var controlGroupID = app.createElementID('textarea');
                var defaultValue = formField.hasOwnProperty('parameters') && formField.parameters.default_value;
                var defaultValueText = defaultValue || '';

                var tooltip = "";
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var labelAsterics = isRequired ? '*' : '';

                if (formField.hasOwnProperty('parameters') && formField.parameters.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.parameters.tooltip + '"></i>';
                }

                var html = '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'" >' +
                                '<label class="formelo-form-label" >' + label + ' ' + tooltip + '</label>' +
                                '<textarea class="form-control" extra="textarea" cols="40" rows="8" name="' + formField.key + '" id="' + formField.id + '" '+(isRequired ? 'required ="" ' : '')+' ">'+defaultValueText+'</textarea>' +
                            '</div>';
                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;
            },
            getRadioControlHTML: function(formField) {
                var dataset = (!formField.hasOwnProperty('parameters') || !formField.parameters.hasOwnProperty('dataset') || !formField.parameters.dataset.id) ? false : app.datasets[formField.parameters.dataset.id];
                var eventsHTML = '';
                var filterHTML = (formField.parameters && formField.parameters.filterable) ? ' filterable="true"' : 'data-native-menu="true"';
                var isRequired = formField.parameters && formField.parameters.is_required;

                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var tooltip = "";
                var labelAsterics = isRequired ? '*' : '';
                var tmpArray = [];
                var defaultValue = formField.hasOwnProperty('parameters') && formField.parameters.default_value;
                var defaultValueText = defaultValue || '';
                formField.id = app.createElementID('radio');
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                if (formField.hasOwnProperty('events')) {
                    for (var key in formField.events) {
                        eventsHTML += ("on" + key + '=" ' + formField.events[key] + ' "');
                    }
                }
                var html = '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">' +
                    '<label class="formelo-form-label" >' + label + ' ' + tooltip + '</label>';

                if (dataset && dataset.data) {
                    for (var key in dataset.data) {
                        tmpArray.push({name:dataset.data[key], key:key});
                    }
                    tmpArray.sort(function(a, b){
                        return a.name.localeCompare(b.name);
                    });
                    for(var j = 0; j < tmpArray.length; j++){
                        var selected = defaultValueText == tmpArray[j].key ? 'checked="checked"' : '';
                        var randomId = str_random(10);
                        html += '<div class="radio radio-success" data-role=”none”>'+
                        '<input name="'+formField.key+'" type="radio" extra="radio" '+selected+' value="' + tmpArray[j].key + '" id="'+randomId+'">'+
                        '<label for="'+randomId+'" style="text-transform:capitalize !important;">'+tmpArray[j].name +'</label>'+
                        '</div>';
                    }
                }
                html += '</div>';
                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;
            },
            getSliderControlHTML: function(formField) {

            },
            getSelectControlHTML: function(formField) {
                var dataset = (!formField.hasOwnProperty('parameters') || !formField.parameters.hasOwnProperty('dataset') || !formField.parameters.dataset.id) ? false : app.datasets[formField.parameters.dataset.id];
                var eventsHTML = '';
                var filterHTML = (formField.parameters && formField.parameters.filterable) ? ' filterable="true"' : 'data-native-menu="true"';
                var isRequired = formField.hasOwnProperty('parameters') && formField.parameters.is_required;
                var defaultValue = formField.hasOwnProperty('parameters') && formField.parameters.default_value;
                var defaultValueText = defaultValue || '';

                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var labelAsterics = isRequired ? '*' : '';
                var tooltip = "";

                formField.id = app.createElementID('select');
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';

                if (formField.events) {
                    for (var key in formField.events) {
                        eventsHTML += ("on" + key + '=" ' + formField.events[key] + ' "');
                    }
                }

                if (formField.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.tooltip + '"></i>';
                }

                var html = '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">' +
                    '<label class="formelo-form-label">' + label + ' ' + tooltip + '</label>' +
                        '<div class="input-group transparent">'+
                    '<select extra = "select" id="' + formField.id + '" name="' + formField.key + '" ' + eventsHTML + ' '+(isRequired ? 'required ="" ' : '')+' class="form-control">' +
                    '<option value="" data-placeholder="true"></option>';

                var tmpArray = [];

                if (dataset && dataset.data) {
                    for (var key in dataset.data) {
                        tmpArray.push({name:dataset.data[key], key:key});
                    }
                    tmpArray.sort(function(a, b){
                        return a.name.localeCompare(b.name);
                    });
                    for(var j = 0; j < tmpArray.length; j++){
                        var selected = defaultValueText == tmpArray[j].key ? "selected" : "";
                        html += '<option '+selected+' name = "'+tmpArray[j].name+'" value="' + tmpArray[j].key + '">' + tmpArray[j].name + '</option>';
                    }
                }
                html += '</select>' +
                    '<span class="input-group-addon" style="border:none"><i class="fa fa-angle-down"></i></span>'+
                    '</div>'+
                '</div>';
                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;
            },
            getCheckBoxHtml : function(formField){
                var dataset = (!formField.hasOwnProperty('parameters') || !formField.parameters.hasOwnProperty('dataset') || !formField.parameters.dataset.id) ? false : app.datasets[formField.parameters.dataset.id];
                var eventsHTML = '';
                var filterHTML = (formField.parameters && formField.parameters.filterable) ? ' filterable="true"' : 'data-native-menu="true"';
                var isRequired = formField.parameters && formField.parameters.is_required;

                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var tooltip = "";
                var labelAsterics = isRequired ? '*' : '';
                var tmpArray = [];
                var defaultValue = formField.hasOwnProperty('parameters') && formField.parameters.default_value;
                var defaultValueText = defaultValue || '';
                formField.id = app.createElementID('checkbox');
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                if (formField.hasOwnProperty('events')) {
                    for (var key in formField.events) {
                        eventsHTML += ("on" + key + '=" ' + formField.events[key] + ' "');
                    }
                }
                var html = '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">' +
                    '<label class="formelo-form-label" >' + label + ' ' + tooltip + '</label>';

                if (dataset && dataset.data) {
                    for (var key in dataset.data) {
                        tmpArray.push({name:dataset.data[key], key:key});
                    }
                    tmpArray.sort(function(a, b){
                        return a.name.localeCompare(b.name);
                    });
                    for(var j = 0; j < tmpArray.length; j++){
                        var selected = defaultValueText == tmpArray[j].key ? 'checked="checked"' : '';
                        var randomId = str_random(10);
                        html += '<div class="checkbox check-success" data-role=”none”>'+
                                    '<input name="'+formField.key+'" type="checkbox" extra="checkbox" '+selected+' value="' + tmpArray[j].key + '" id="'+randomId+'">'+
                                    '<label for="'+randomId+'" style="text-transform:capitalize !important;">'+tmpArray[j].name +'</label>'+
                                '</div>';
                    }
                }
                html += '</div>';
                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;
            },
            getMultipleSelectControlHTML: function(formField) {

                var dataset = (!formField.hasOwnProperty('parameters') || !formField.parameters.hasOwnProperty('dataset') || !formField.parameters.dataset.id) ? false : app.datasets[formField.parameters.dataset.id];
                var eventsHTML = '';
                var filterHTML = (formField.parameters && formField.parameters.filterable) ? ' filterable="true"' : 'data-native-menu="true"';
                var isRequired = formField.parameters && formField.parameters.is_required;

                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var tooltip = "";
                var labelAsterics = isRequired ? '*' : '';
                var tmpArray = [];
                var defaultValue = formField.hasOwnProperty('parameters') && formField.parameters.default_value;
                var defaultValueText = defaultValue || '';

                formField.id = app.createElementID('multiselect');
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                if (formField.hasOwnProperty('events')) {
                    for (var key in formField.events) {
                        eventsHTML += (key + '="' + formField.events[key] + '"');
                    }
                }

                if (formField.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.tooltip + '"></i>';
                }

                var html = '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">' +
                    '<label class="formelo-form-label" >' + label + ' ' + tooltip + '</label>' +
                    '<select class="form-control" extra = "multiselect" id="' + formField.id + '" name="' + formField.key + '" multiple="multiple"  ' + eventsHTML + ' ' + filterHTML + ' ' + (isRequired ? 'required' : '') + ' data-native-menu="true">' +
                    '<optgroup label="Choose some options:">';

                if (dataset && dataset.data) {
                    for (var key in dataset.data) {
                        tmpArray.push({name:dataset.data[key], key:key});
                    }

                    tmpArray.sort(function(a, b){
                        return a.name.localeCompare(b.name);
                    });

                    for(var j = 0; j < tmpArray.length; j++){
                        var selected = defaultValueText == tmpArray[j].key ? "selected" : "";
                        html += '<option '+selected+' name = "'+tmpArray[j].name+'" value="' + tmpArray[j].key + '">' + tmpArray[j].name + '</option>';
                    }
                }
                html += '</optgroup>';
                html += '</select>' +
                '</div>';
                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;
            },
            getAutoCompleteControlHTML: function(formField) {

            },
            getCameraControlHTML: function(formField) {
                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var isRequired = formField.hasOwnProperty('parameters') && formField.parameters.is_required;

                var icon = "";
                var imgExtra = "";
                var buttonExtra = "";
                var imageMeta = '';
                var _eventsHTML = '';
                if (formField.events) {
                    for (var key in formField.events) {
                        _eventsHTML += ("on" + key + '=" ' + formField.events[key] + ' "');
                    }
                }
                var buttonIcon = '<i class="fa '+(formField.type == "fingerprint" ? 'fa-hand-o-up' : 'fa-camera')+'"/>';

                // to delete the fingerprint template
                var tempTemplateKey = '';

                if (formField.type == "fingerprint") {
                    formField.id    = app.createElementID('fingerprint');

                    icon            = "img/fingerprint.png";
                    imgExtra        = 'extra = "fingerprint" parameters=\''+JSON.stringify(formField.parameters)+'\'  ';
                    buttonExtra     = 'extra = "fingerprint"';

                    var metaKey     = formField.hasOwnProperty('parameters') && formField.parameters.template_key ? formField.parameters.template_key : 'undefined';//formField.key+"_template";
                    var metaFinger  = formField.hasOwnProperty('parameters') && formField.parameters.finger ? formField.parameters.finger : '';
                    tempTemplateKey = metaKey;

                    var eventsHTML  = 'onclick = "getFingerPrint({\'item_key\': \'' + formField.key + '\',\'template_key\': \'' + metaKey + '\'})"';

                    imageMeta = metaKey != 'undefined' ? '<input for="'+formField.key+'" type = "hidden" extra = "hidden" finger = "'+metaFinger+'" name = "'+metaKey+'" />' : '';

                } else {
                    formField.id = app.createElementID('image');
                    var eventsHTML = 'onclick = "customFunctions.getPicture({\'item_key\': \'' + formField.key + '\'})"';
                    icon = "img/camera.png";
                    imgExtra = 'extra = "image"';
                    buttonExtra = 'extra = "image" ';
                }

                var tooltip = "";
                if (formField.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.tooltip + '"></i>';
                }

                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                var labelAsterics = isRequired ? '*' : '';
                var imgdiv = '<div>' +
                    '<img '+imgExtra+' class="col-xs-6 col-sm-4 col-md-3" xstyle="width:128px" '+_eventsHTML+' onclick="previewImage(this)" id="' + formField.id + '" name="' + formField.key + '" src="'+icon+'" ' + (isRequired ? 'required=""' : '') + '/>' +
                    imageMeta+
                    '<div><br/>' +
                    '<button data-inline="true" type="button" ' + eventsHTML + ' class="btn btn-primary ui-btn-inline">'+buttonIcon+' Capture</button>' +
                    '<button data-inline="true" type="button" '+buttonExtra+' onclick=customFunctions.deletePicture(this) for="' + formField.id + '" class="btn ui-btn-inline">Delete</button>' +
                    '</div>' +
                    '</div>' ;

                var html = '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">' +
                                '<label class="formelo-form-label" for="' + formField.id + '">' + label + ' ' + tooltip + '</label>' +
                                    ((device.platform == 'iOS' && formField.type == "fingerprint") ? '<label style="color:#D8D8D8; text-transform: capitalize !important;">This feature is coming soon</label>' : imgdiv) +
                            '</div>';
                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;

            },
            getSignatureControlHTML: function(formField) {

                formField.id = app.createElementID('signature');
                var isRequired = formField.hasOwnProperty('parameters') && formField.parameters.is_required;
                var eventsHTML = 'onclick = "customFunctions.getSignature({\'item_key\': \'' + formField.key + '\'})"';
                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var tooltip = "";
                var labelClass = '';// isRequired ? 'ui-label-required' : 'ui-label';
                var labelAsterics = isRequired ? '*' : '';
                var buttonIcon = '<i class="fa fa-pencil"/>';
                var _eventsHTML = '';
                if (formField.events) {
                    for (var key in formField.events) {
                        _eventsHTML += ("on" + key + '=" ' + formField.events[key] + ' "');
                    }
                }



                if (formField.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.tooltip + '"></i>';
                }

                var html = '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">' +
                    '<label class="formelo-form-label" >' + label + ' ' + tooltip + '</label>' +
                                '<div>' +
                                    '<img extra = "signature" class="col-xs-6 col-sm-4 col-md-3" '+_eventsHTML+' xclass="fit-screen signature" onclick="previewImage(this)" id="' + formField.id + '" name="' + formField.key + '" src="img/signature.png" ' + (isRequired ? 'required=""' : '') + '/>' +
                                '</div><br/>' +
                                    '<button data-inline="true" type="button" ' + eventsHTML + ' class="btn btn-primary">'+buttonIcon+' Capture</button>' +
                                    '<button data-inline="true" type="button" extra = "signature" onclick=customFunctions.deletePicture(this) for="' + formField.id + '" class="btn">Delete</button>' +
                            '</div>';
                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;
            },
            getFingerprintControlHTML: function(formField) {
                return app.html_factory.getCameraControlHTML(formField);
            },
            getBarcodeControlHTML: function(formField) {
                formField.id = app.createElementID('barcode');
                var isRequired = formField.parameters && formField.parameters.is_required;
                var eventsHTML = 'onclick = "customFunctions.getBarcode({\'item_key\': \'' + formField.key + '\'})"';
                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var tooltip = "";
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                var labelAsterics = isRequired ? '*' : '';


                if (formField.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.tooltip + '"></i>';
                }

                var html = '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">'+
                                '<label class="formelo-form-label" >' + label + ' ' + tooltip + '</label>' +
                                '<input type = "text" name="' + formField.key + '" readonly id="' + formField.id + '" class="form-control" '+(isRequired ? 'required ="" ' : '')+'/>' +

                                '<button type="button" ' + eventsHTML + ' data-inline="true" class="btn btn-primary"><i class="lIcon fa fa-barcode"></i> Capture</button>' +

                            '</div>';

                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;
            },
            getAudioControlHTML: function(formField){
                formField.id = app.createElementID('audio');
                var isRequired = formField.parameters && formField.parameters.is_required;
                var eventsHTML = 'onclick = "customFunctions.getAudio({\'item_key\': \'' + formField.key + '\'})"';
                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var tooltip = '';
                var androidPlayButton = '<button onclick="customFunctions.playAudio(\''+formField.key+'\')" type="button" data-inline="true" class="btn btn-primary"><i class="fa fa-file-audio-o"></i> Play</button>';
                if (formField.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.tooltip + '"></i>';
                }
                var html = '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">'+
                                '<label class="formelo-form-label" >' + label + ' ' + tooltip + '</label>' +
                                '<audio controls id="'+formField.key+'" extra = "audio" name="'+formField.key+'">'+
                                    '<source id="'+formField.key+'_source" src="" path="">'+
                                    'This app version does not support the audio element.'+
                                '</audio><br/>'+
                                '<button type="button" ' + eventsHTML + ' data-inline="true" class="btn btn-primary"><i class="fa fa-file-audio-o"></i> Record</button>' +
                                (device.platform != 'iOS' ? androidPlayButton : '')+
                            '</div>';
                return html;
            },
            getVideoControlHTML: function(formField) {
                 /*formField.id = app.createElementID('signature');
                var isRequired = formField.parameters && formField.parameters.is_required;
                var eventsHTML = 'onclick = "customFunctions.getVideo({\'item_key\': \'' + formField.key + '\'})"';

                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var labelAsterics = isRequired ? '*' : '';
                var tooltip = "";
                if (formField.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.tooltip + '"></i>';
                }

                var html = '<li data-role="fieldcontain" xstyle="width:100% !important;">';

                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                html += '<div data-role="ui-field-contain">' +
                '<label class="'+labelClass+'" for="' + formField.id + '">' + label + ' ' +labelAsterics+ ' ' + tooltip + '</label> <div class="form-field-spacer"/>' +
                    //'<img onclick="customFunctions.displayPicturePopup(this)" id="' + formField.id + '" name="' + formField.key + '" src="img/images.png" style="width:100% !important;" xwidth="200"  height="300" ' + (isRequired ? 'required' : '') + '/>' +
                '<video id = "' + formField.id + '" name = "' + formField.key + '" style="width:100%; height:100%" xwidth = "240" xheight = "160" controls = ""><source src = ""></video>' +
                '<div class="ui-nodisc-icon ui-alt-icon"><!-- Class added to the wrapper -->' +
                '<button type="submit" ' + eventsHTML + ' data-inline="true"><i class="lIcon fa fa-video-camera"></i>Record</button>' +
                '<button type="submit" onclick=customFunctions.deletePicture(this) for="' + formField.id + '" data-inline="true"><i class="lIcon fa fa-trash-o"></i>Delete</button>' +
                '</div>' +
                '</div>' +
                '</li>';
                //////////console.log(html);
                return html;  */
            },
            getGPSHTML: function(formField) {
                formField.id = app.createElementID('gps');
                var mapID = formField.id + "_map";
                var eventsHTML = 'onclick = "customFunctions.getCoordinates({\'item_key\': \'' + formField.key + '\',\'placeholder\': \'' + mapID + '\'})"';
                var isRequired = formField.parameters && formField.parameters.is_required;
                var tooltip = "";
                var buttonIcon = '<i class="fa fa-map-marker"/>';

                if (formField.tooltip) {
                    tooltip = '<i class="fa fa-question-circle tooltip" title="' + formField.tooltip + '"></i>';
                }

                var label = formField.parameters.label ? formField.parameters.label : formField.name;
                var html = '';
                var labelClass = isRequired ? 'ui-label-required' : 'ui-label';
                var labelAsterics = isRequired ? '*' : '';

                html +=
                '<div class="form-group form-group-default '+(isRequired ? 'required ' : '')+'">'+
                '<div id = ' + mapID + ' style="display:none; background-color: #3d566e; width = 100%; height: 250px;"></div>' + // placeholder for our map
                    '<label class="formelo-form-label" >' + label + ' ' + tooltip + '</label>' +
                    '<input type="text" class="form-control" extra = "gps" name="' + formField.key + '" readonly id="' + formField.id + '" '+(isRequired ? 'required ="" ' : '')+' />'+

                    '<button data-inline="true" ' + eventsHTML + ' type="button" class="btn btn-block btn-primary">'+
                        buttonIcon+' Capture'+
                    '</button>'+
                    //'<button data-inline="true" onclick="makeFullScreen(\''+mapID+'\')" type="button" class="btn btn-block btn-primary">'+
                    //    'View Taxis'+
                    //'</button>'+
                '</div>';
                html += '<label class="error error-label" for="' + formField.key + '"></label>';
                return html;
            },
            getFormFooterHTML: function(formPage, next, back, options) {
                var snippet = "";
                var cur = options.currentNo + 1;
                var pagesnippet = cur + " / " + options.pageLength;
                var nextSnippet = "";
                var pageTitle = options.title;
                if (back.isdisplayable) {
                    snippet = '<a style=" border:none !important;" href="#" onclick= "' + back.command + '"><span class="footer-icon"><i class="fa fa-arrow-left"></i></span><p class="footer_p" style="margin-top: -4px; color: grey !important">'+back.label+'</p></a>';
                } else {
                    snippet = '<a style=" border:none !important;" href="#"><span class="footer-icon">&nbsp;</span><p class="footer_p" style="margin-top: -4px; color: grey !important">&nbsp;</p></a>';
                }
                if (next.isDisplayable) {
                    nextSnippet = '<a onclick = "' + next.command + '"  style=" border:none !important;" href="#"><span class="footer-icon"><i class="' + next.icon + '"></i></span><p class="footer_p" style="margin-top: -4px; color: grey !important">'+next.label+'</p></a>';
                } else {
                    nextSnippet = '<a style=" border:none !important;" href="#"><span class="footer-icon">&nbsp;</span><p class="footer_p" style="margin-top: -4px; color: grey !important">&nbsp;</p></a>';
                }
                var html = '<div class = "app-footer"  style="height: 50px !important;" data-position ="fixed" data-tap-toggle="true" data-role="footer">' +
                    '<div style="height: inherit; margin-top: -4px" data-role="navbar">' +
                    '<ul>' +
                    '<li>' + snippet + '</li>' +
                    '<li><a style="border:none !important;" href="#"><span class="footer-icon" >'+pagesnippet+'</span><p class="footer_p" style="margin-top: -4px; color: grey !important;">'+pageTitle+'</p></a></li>' +
                    '<li>' + nextSnippet + '</li>' +
                    '</ul>' +
                    '</div>' +
                    '</div><!-- /footer -->';

                return html;
            },
            getFooterHTML: function() {
                var html = '<div class="app-footer" xid="app-footer" style="height: 40px !important; max-height: 40px !important;" data-position ="fixed" data-tap-toggle="false" xdata-hide-during-focus="false" data-role="footer">' +
                    '<div style="height: inherit; margin-top: -4px" data-role="navbar">' +
                    '<ul>' +
                    '<li>' +
                    '<a class="nav_item_forms" style="margin-top: -4%; border:none !important;" href="#" onclick="app.navigator.showFormGroupList(); ">' +
                    '<span class="footer-icon"><i class=" fa pg-home"> </i><p class="footer_p" style="margin-top: -4px;">Home</p></span></a></li>' +
                    '<li>' +
                    '<a class="nav_item_inbox" style="margin-top: -4%; border:none !important;" href="#" onclick="app.navigator.showInboxList(\'private\'); ">' +
                    '<span class="footer-icon"><i class="fa fa-envelope-o"> </i><p class="footer_p" style="margin-top: -4px;">Inbox</p></span></a></li>' +
                    '<li>' +
                    '<a class="nav_item_draft" style="margin-top: -4%; border:none !important;" href="#" onclick="app.navigator.showDraftList(); ">' +
                    '<span class="footer-icon"><i class="fa fa-edit"> </i><p class="footer_p" style="margin-top: -4px;">Drafts</p></span></a></li>' +
                    '<li>' +
                    '<a class="nav_item_submissions" style="margin-top: -4%; border:none !important;" href="#" onclick="app.navigator.showOutboxList();">' +
                    '<span class="footer-icon"><i class="fa fa-cloud-upload"> </i><p class="footer_p" style="margin-top: -4px;">Submissions</p></span></a></li>' +
                    '<li>' +
                    '<a class="nav_item_stats" style="margin-top: -4%; border:none !important;" href="#" onclick="app.navigator.showDashboardPage(); ">' +
                    '<span class="footer-icon"><i class="fa fa-bar-chart-o"> </i> <p class="footer_p" style="margin-top: -4px;">Stats</p></span></a></li>' +
                    '</ul>' +
                    '</div>' +
                    '</div>';
                return html;
            },
            getPublicFooterHTML: function() {
                var html = '<div class="app-footer" style="height: 40px !important; max-height: 40px !important;" data-position ="fixed" data-tap-toggle="false" data-hide-during-focus="false" data-role="footer" data-position-fixed="true">' +
                                '<div style="height: inherit; margin-top: -4px" data-role="navbar">' +
                                '<ul>' +
                                '<li>' +
                                '<a class="nav_item_featured" href="#" onclick="createDashboardPage()" style="margin-top: -4%; border:none !important;">' +
                                    '<span class="footer-icon">' +
                                        '<i class="fa fa-map-o"></i>' +
                                        '<p class="footer_p" style="margin-top: -4px;">Explore</p>' +
                                    '</span>'+
                                '</a>' +
                                '</li>' +
                                '<li><a class="nav_item_inbox" href="#" onclick="app.navigator.showInboxList(\'public\')" style="margin-top: -4%;border:none !important;"><span class="footer-icon"><i class="fa fa-envelope-o"></i><p class="footer_p" style="margin-top: -4px;">Inbox</p></span></a></li>' +
                                '<li><a class="nav_item_saved" href="#" onclick="createTopChartPage()" style="margin-top: -4%;border:none !important;"><span class="footer-icon"><i class="fa fa-heart-o"></i><p class="footer_p" style="margin-top: -4px;">Favorites</p></span></a></li>' +
                                '<li><a class="nav_item_search" href="#" onclick="createSearchPage()" style="margin-top: -4%;border:none !important;"><span class="footer-icon"><i class="pg-search"></i><p class="footer_p" style="margin-top: -4px;">Search</p></span></a></li>' +
                                '</div>' +
                            '</div>';
                return html;
            }
        }
    }
}();

var Activity = function(){
    var backStack   = [];
    var applets     = [];
    var _slug        = 'my_really_cool_slug_';
    var activeStack = '';
    var createActivitySlug = function(stack){
        var len = backStack.length+1;
        var slug = _slug+len+'_';
        backStack.push(slug);
        applets.push(stack);
        //alert('New slug is '+slug);
    };
    return {
        addStack        : function(stack){
            createActivitySlug(stack);
        },
        removeStack     : function(stack){
            // Removes the top item
            $('.'+Activity.getStackSlug()).remove();
            backStack.splice(-1, 1);
            applets.splice(-1, 1);
            //alert('backstack length is now '+backStack.length);
        },
        getStackSlug    : function(stack){
            //alert('Returning '+backStack[backStack.length-1]);
            return backStack[backStack.length-1];
        },
        getFormRef   : function(){
            //alert('Returning '+applets[applets.length-1]);
            return applets[applets.length-1];
        },
        getParentStackSlug    : function(stack){
            //alert('Returning parent:  '+backStack[backStack.length-2]);
            return backStack[backStack.length-2];
        },
        getParentFormRef: function(){
            //alert('Returning formref:  '+applets[applets.length-2]);
            return applets[applets.length-2];
        },
        getCurrentStackObject : function(_limitToOne){
            var limitToOne = _limitToOne ? ':first' : '';
            return $('.'+Activity.getStackSlug()+''+limitToOne);
        },
        isThereAnyActiveFormLeft: function(){
            //alert('Checking if backstack is left. Number of stack is '+backStack.length);
            if (backStack.length > 1){
                return true;
            } else {
                return false;
            }
        },
        reset:function(){
            backStack   = [];
            applets     = [];
            $('.backStack').remove();
        }
    }
}();
