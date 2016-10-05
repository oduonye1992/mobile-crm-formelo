'use strict';

var Browser = function(){
    var userId  = null;
    var realmId =  null;

    // Endpoints
    var publicAppletUrl = 'https://library.formelo.com/actions/applets/config';
    var searchAppletUrl = 'https://library.formelo.com/actions/applets/config?q=';
    var searchTermsUrl  = 'https://library.formelo.com/actions/applets/terms?q=';
    var singleAppletUrl = 'https://library.formelo.com/actions/applets/config?id=';
    var importtUrl = ''; //JSON.parse(window.localStorage["realm_full"]).base_url+'/actions/applets/import';
    //realm.formelo.com //actions/applet/import POST key:value //applet_id //realm_id, // username //token

    var cred = null;
    /// applet_id

    // Placeholders
    var form_config = null;
    var individualApplets = [];
    var loadingHtml =   '<div class="container-xs-height full-vh">' +
        '<div class="row-xs-height">'+
        '<div class="col-xs-height col-middle">'+
        '<div class="error-container text-center">'+
        '<h1 class="error-number" style="color: grey;">' +
        '<div class="progress-circle-indeterminate"></div>' +
        '</h1>'+
        '</div>'+
        '</div>'+
        '</div>'+
        '</div>';

    var showErrorMsg = function(msg){
        var loadingHtml =   '<div class="container-xs-height full-vh">' +
            '<div class="row-xs-height">'+
            '<div class="col-xs-height col-middle">'+
            '<div class="error-container text-center">'+
            '<h1 class="error-number" style="color: grey;">:(' +
            '</h1>'+
            '<p>'+msg+'</p>'+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>';
        return loadingHtml;
    };

    var getRelatedItemsById  =  function(appletId){
        // Check if the applet is the category section, else
        // Loop through each category, check if the the id exist their applets. n
        // If it matches, get the first 3 applets apart from the main ones.  m
        // Fetch their details from the Applet conf.    k
        // Worst case (n * m) + 3 * k
        // @return [{name, desc, image, id}]
        try {
            var group_mode = form_config[Constants.public.applet_group];
            var categoryId = null;
            console.log(group_mode);
            var result = $.grep(group_mode, function(e){
                return e.id == appletId;
            });
            if (!result.length){
                for (var i = 0; i < group_mode.length; i++){
                    var cat = group_mode[i];
                    for (var j = 0; j < cat.applets.length; j++){
                        if (appletId == cat.applets[j].id){
                            categoryId = cat.id;
                            break;
                        }
                    }
                }
                if (categoryId){
                    return getAppletListJson('',categoryId,Constants.public.applet_group, form_config);
                }
            }
            return false;
        } catch (e){
            console.log(JSON.stringify(e));
            return false;
        }
    };

    var verticalController =  function(source_mode, title, backlink, options){
        try {
            $('#applet-list-placeholder').html();
            $.when(showverticalLists(title, backlink, 'browser'))
                .done(function(){
                    if(source_mode == 'favorites') {
                    } else if(source_mode == 'applet_list') {
                        Browser.populateAppletList(options.category_id, 'data_lists', options.category_type);
                    }
                });
        } catch (e){
            alert(JSON.stringify(e));
            throw new Error(e);
        }
    };

    var populateDetailsPage =  function(config, element, id, backlink){
        var configObj = config.applets[id];
        console.log(configObj);
        if (!configObj){
            $.mobile.back();
            showMessage('An error occured');
            return false;
        }
        var ele = $('#'+element);
        var relatedItems = getRelatedItemsById(id);
        var addAppletButton = $('#addAppletButton');
        var relatedHtml  = '';
        if (relatedItems && relatedItems.length){
            var len = relatedItems.length < 3 ? relatedItems.length : 3;
            for (var a = 0; a < len; a++){
                var icon_url       = relatedItems[a]['name'].charAt(0).toUpperCase();
                if (relatedItems[a].icon_url && relatedItems[a].icon_url.trim().length) {
                    icon_url = relatedItems[a].icon_url;
                } else {
                    if (/[^a-zA-Z]/.test(icon_url)){
                        icon_url = "img/bg/unknown.gif";
                    } else {
                        icon_url = "img/bg/" + icon_url + ".gif";
                    }
                }
                relatedHtml +=
                    '<div class="card-header clearfix related-item" related-item-id = "'+relatedItems[a]['id']+'">'+
                        '<div class="user-pic pull-left">'+
                            '<img alt="Profile Image" width="33" height="33" data-src-retina="'+icon_url+'" data-src="'+icon_url+'" src="'+icon_url+'">'+
                        '</div>'+
                        '<div style="margin-left: 40px">'+
                            '<h5 style="font-weight: 300;">'+relatedItems[a]['name']+'</h5>'+
                            '<h6>'+relatedItems[a]['description']+'</h6>'+
                        '</div>'+
                    '</div>';
            }
        }
        $('#browser_details_header_text').html(configObj.name);
        ele.find('[id="browser_details_header_text"]').html(configObj.name);//.trigger('create');
        ele.find('[id="details_header_text"]').html(configObj.name);
        ele.find('[id="refreshIndividualConfig"]').attr('detail_id', id);
        addAppletButton.attr('detail_id', id);

        var html = '<div class="row" style="margin: 0px;" class="animated slideInUp">'+
                    '<div class="col-xs-12 40-vh" style="background-color: #333; xheight: 40vh !important;text-align: center;">' +
                        '<div style="height: 40vh; background-image: url(\''+configObj.icon_url+'\');background-size: cover;display: block;/* filter: blur(5px); */-webkit-filter: blur(15px);border: 1px solid #000;"></div>'+
                        '<div class="35-margin-top-o-vh"><img class="details-applet-image" src="' + configObj.icon_url + '" width="300" style="position: relative;xmargin-top: -40vh;border: 0px solid #fff"></div>' +
                    '</div>'+
                    '<div class="col-xs-12 10-min-vh" style="xmin-height: 6vh;padding: 5px 10px;">' +
                            '<div class="row" style="border-bottom: 1px solid #e8e8e8">'+
                                '<div class="col-xs-8">'+
                                    '<p class="">'+configObj.name+'</p><p class="small hint-text"></p>'+
                                '</div>'+
                                '<div class="col-xs-4" style="border-left: 1px solid #e8e8e8;">'+
                                    '<p></p>' +
                                '</div>'+
                            '</div>'+
                    '</div>'+
                    '<div class="col-xs-12 15-min-vh" style="xmin-height: 20vh; padding: 5px 10px;">' +
                            '<p>About</p><hr style="display: none">'+
                            '<p class="small hint-text">'+configObj.description+'</p>'+
                    '</div>'+
                    '<div class="col-xs-12 40-min-vh" style="xmin-height: 20vh;padding: 0px;">' +
                        '<p class="text-black" style="padding:0px 10px;">Related</p><hr style="display:none;">'+
                        '<div class="card share applet-list-placeholder" data-social="item" style="margin-bottom: 0px !important;">'+
                            relatedHtml +
                        '</div>'+
                    '</div>';

        $('#description-content-section').html(html);
        adjustHeightsToViewport();
        addAppletButton.unbind();
        addAppletButton.click(function(e){
            e.stopPropagation();
            try{
                var id = $(this).attr('detail_id');
                //alert('clicked applet is '+id);
                formController(id, backlink, 'preview');
            } catch(e){
                alert(JSON.stringify(e));
                showMessage('An error has occured. Please try again later');
            }
        });
        $('.related-item').click(function(){
            var id = $(this).attr('related-item-id');
            detailsController(id, '','data_lists');
        });
        return true;
    };

    var getAppletById =  function(appletId, forceFetchFromServer) {
        var txDeferred = $.Deferred();
        var result = $.grep(individualApplets, function(e){
            return e.id == appletId;
        });
        if (!result.length || forceFetchFromServer){
            $.when(fetchData(singleAppletUrl+appletId))
                .done(function(data){
                    alert(JSON.stringify(data));
                    var result = $.grep(individualApplets, function(e){
                        return e.id == appletId;
                    });
                    if(!result.length){
                        individualApplets.push({id: appletId, config: data});
                    } else {
                        $.each(individualApplets, function() {
                            if (this.id == appletId) {
                                this.config = data;
                            }
                        });
                    }
                    txDeferred.resolve(data);
                })
                .fail(function(e){
                    alert(JSON.stringify(e));
                    txDeferred.reject(e);
                });
        } else {
            alert('fetching applet from local '+appletId);
            txDeferred.resolve(result[0].config);
        }
        return txDeferred.promise();
    };

    var formController =  function(id, backlink, isPreview){
        customFunctions.displayNotificationDialog('', 'Setting up your form');
        $.when(Browser.getAppletConfig(id))
            .done(function(data){
                customFunctions.closeNotificationDialog();
                try{
                    var configObj = data.applets[id]; // id
                    app.initBluetooth();
                    app.initDatasets(data);
                    app.initScripts(data);
                    var formValidated = validateConfig(configObj);
                    if  (formValidated.isValid) {
                        //alert('Sending isPreview '+isPreview);
                        app.constructors.createFormDataEditor(null, id, configObj, backlink,null,null,true);
                    } else {
                        throw new Error('This applet hasn\'t been configured properly');
                    }
                } catch(e){
                    showMessage('','An error has ocured');
                    $.mobile.back();
                }
            })
            .fail(function(){
                customFunctions.closeNotificationDialog();
                showMessage('Connection lost. Please try again');
                $.mobile.back();
            });
    };

    var detailsController =  function(id, title, backlink){
        try{
            if(!globals.files.enableLibraryDetailView){
                formController(id, backlink);
                return false;
            }
            $.when(createDetailsPage(title, backlink))
                .done(function(){
                    $('#description-content-section').html(loadingHtml);
                    adjustHeightsToViewport();
                    Browser.displayAppletDetails(id, 'detail_page', null, backlink);
                });
        } catch(e){
            alert(JSON.stringify(e));
            showMessage('This applet is unavailable at the moment');
            createDashboardPage();
        }
    };

    var fetchLocalConfig = function(){
        var txDeferred = $.Deferred();
        $.when(fetchData(publicAppletUrl, getDeviceInfo()))
            .done(function(data){
                form_config = data;
                txDeferred.resolve(data);
            })
            .fail(function(e){
                txDeferred.reject(e);
            });
        return txDeferred.promise();
    };
    var getAppletListJson = function (element, category, category_type, configObj) {
        var applets = getAppletsIDsInConfig(category_type, category);
        var returnJson = [];
        for (var i = 0; i < applets.length; i++) {
            var currentApplet = configObj.applets[applets[i].id];
            if (currentApplet) {
                var tmpJson = {
                    icon_url: currentApplet.icon_url,
                    description: currentApplet.description,
                    name: currentApplet.name,
                    id: currentApplet.id,
                    scope: currentApplet.scope
                };
                returnJson.push(tmpJson);
            }
        }
        return returnJson;
    };
    var getAppletsIDsInConfig = function(category_type, id){
        var group_mode = '';
        switch (category_type){
            case Constants.public.applet_features:
                group_mode = form_config[Constants.public.applet_features];
                break;
            case Constants.public.applet_group:
                group_mode = form_config[Constants.public.applet_group];
                break;
            default:
                return null;
        }
        var result = $.grep(group_mode, function(e){
            return e.id == id;
        });
        if (result.length == 0){
            return null;
        } else if(result.length == 1) {
            var cat = result[0];
            return cat[Constants.public.applets];
        } else {
            return null;
        }
    };

    var showSliderList  = function(){
        var txDeferred = $.Deferred();
        var newView     = "explore_main_page";
        var panelName   = 'dnsdnsasas';

        if ($('#'+newView).length) {

        } else {
            var html = ''+
                '<div data-role="page" id = "'+newView+'" class = "dashboard" data-id="myPage">' +
                '<div xclass="bare-header" data-role="header" class="blue-gradient" data-position="fixed" data-tap-toggle="false">' +
                '<a class="ui-btn ui-btn-left header-link" onclick="Browser.closeBrowser()"><i class="pg-arrow_left_line_alt"></i> Back</a>'+
                '<h1 style="text-align: center !important;">Explore</h1>'+
                '</div>'+
                '<div role="main" class="ui-content dashboard">'+
                '<div class="row" id="explore_main_row">'+
                '</div>'+
                '</div>'+
                '</div>';
            BODY.append(html);//.trigger('create');
        }
        bodyContainer.pagecontainer('change', '#'+newView, {
            transition: "fade"
        });

        txDeferred.resolve();
        return txDeferred.promise();
    };

    var listCategories   =   function(element, configObj){
        if (!configObj || !configObj.hasOwnProperty('applet_groups')){
            $('#explore_main_page').find('[id="explore_main_row"]').html(showErrorMsg('No applets available at this time')).trigger('refresh');
            return false;
        }

        var categories = configObj.applet_groups;
        var subHtml = '';

        for(var i = 0; i < categories.length; i++) {
            var item = categories[i];
            subHtml += '<div class="col-xs-6 col-sm-3 col-md-3 detail_cool_category clickable-panel" category-code="'+item.id+'" category-name="'+item.name+'" style="padding: 12px; margin-bottom: 6px;">'+
            '<div class = "row" style="height: inherit;" category-id="'+item.id+'">'+
            '<div class="col-xs-12 col-sm-12 col-md-12" style = "padding: 0px;">'+
            '<img xx ="'+i+'" class="myImg loadingImg" src="img/loading.png" style="max-width: 100%;" />'+
            '<img xx ="'+i+'" class="myImg mainImg" src="'+item.icon_url+'" style="max-width: 100%;" />'+
            '</div>'+
            '<div class="col-xs-12 col-sm-12 col-md-12" style = " height:64px; max-height:64px; background-color:#404040;">'+
            '<span style="font-size: x-small; color: #ffffff; font-weight:400">'+item.name+'</span>'+
            '<p style="font-size: xx-small; color: #D9D9D9; margin-top: 2px; word-wrap: break-word; line-height: 14px;">'+item.description+'</p>'+
            '</div>'+
            '</div>'+
            '</div>';
        }
        $('#'+element).find('[id="explore_main_row"]').html(subHtml).trigger('refresh');
        adjustHeightsToViewport();

        $('.myImg').hide();
        $('.loadingImg').show();
        $('.mainImg').on('load', function(){
            var x = $(this).attr('xx');
            $('[xx="'+x+'"]').hide();
            $(this).show();
        });

        $('.detail_cool_category').click(function(e){
            try {
                e.stopPropagation();
                var data = {
                    id : $(this).attr('category-code'),
                    name : $(this).attr('category-name')
                };
                var appletCount = Browser.getAppletCountInGroup(Constants.public.applet_group, data.id);
                if (appletCount){
                    if(appletCount > 1){
                        var options = {
                            'category_id'   : data.id,
                            'category_type' : Constants.public.applet_group
                        };
                        verticalController('applet_list', data.name, 'explore_main_page', options);
                        //resetAllNavIndicators();
                        //$('ul li a.nav_item_featured span').addClass("nav-active");
                    } else if(appletCount == 1){
                        var appletsIdInCat = Browser.fetchAppletsIDsInConfig(Constants.public.applet_group, data.id);
                        ontroller(appletsIdInCat[0].id, appletsIdInCat[0].name, 'explore_main_page');
                    }
                }
            } catch (e){
                alert(JSON.stringify(e));
                showMessage('An error occured, Please try again', 'short');
            }
        });
        customFunctions.closeNotificationDialog();
        return true;
    };
    var populateAppletList = function (element, configObj) {
        var tmpHtml = '';
        if (!configObj){
           throw new Error('Config is not defined');
        }

        if (configObj.length){
            for(var i = 0; i < configObj.length; i++) {
                var currentApplet = configObj[i];
                if(currentApplet) {
                    var name        = currentApplet.name ? currentApplet.name.substring(0, 100) : "Unnamed";
                    var description = currentApplet.description ? currentApplet.description : "";
                    var id          = currentApplet.id;
                    //var icon_url    = currentApplet.icon_url ? currentApplet.icon_url : '';
                    var scope       = currentApplet.scope ? currentApplet.scope : '';

                    var icon_url       = name.charAt(0).toUpperCase();
                    if (currentApplet.icon_url && currentApplet.icon_url.trim().length) {
                        icon_url = currentApplet.icon_url;
                    } else {
                        if (/[^a-zA-Z]/.test(icon_url)){
                            icon_url = "img/bg/unknown.gif";
                        } else {
                            icon_url = "img/bg/" + icon_url + ".gif";
                        }
                    }

                    tmpHtml +=  '<div class="card-header clearfix applet-list-items" applet-id="'+currentApplet.id+'" channel_type="'+currentApplet.scope+'">'+
                                    '<div class="user-pic">'+
                                        '<img alt="Profile Image" width="33" height="33" data-src-retina="'+icon_url+'" data-src="'+icon_url+'" src="'+icon_url+'">'+
                                    '</div>'+
                                    '<div style="margin-left: 40px">'+
                                        '<h5 style="font-weight: 300;">'+name+'</h5>'+
                                        '<h6>'+description+'</h6>'+
                                    '</div>'+
                                '</div>';
                }
            }
        } else {
            $('#'+element).find('[id="applet-list-placeholder"]').addClass('full-vh');
            tmpHtml = ''+
            '<div class="container-xs-height full-vh">'+
            '<div class="row-xs-height">'+
            '<div class="col-xs-height col-middle">'+
            '<div class="error-container text-center">'+
            '<h1 class="error-number" style="color: grey;">:(</h1>'+
            '<h2 class="semi-bold" style="color: grey">Nothing Here</h2>'+
            '<p>The applets you <i class="fa fa-heart" style="color: red"></i> will be shown here!</p>'+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>';
        }
        adjustHeightsToViewport();

        $('.applet-list-placeholder').html(tmpHtml).trigger('create');
        BODY.trigger('create');

        $('.applet-list-items').on('click', function(){
            var data = {
                id : $(this).attr('applet-id')
            };
            detailsController(data.id, '','data_lists');
        });
    };

    var createDetailsPage   =  function(title, backlink){
        var txDeferred = $.Deferred();
        var newView     = "create_detail_page";
        var panelName   = 'csvssvvvsdd';

        var aa = backlink ? 'right' : 'left';
        var bb = backlink ? '<a href="#'+backlink+'" class="ui-btn ui-btn-left wow fadeIn" data-wow-delay="0.8s"><i class="fa fa-chevron-left"></i></a>' : '';
        var formTitle = title || 'Formelo';

        if ($('#create_detail_page').length) {
            var element = 'detail_page';
            $('#addAppletButton').attr('detail_id', '');
            $('#'+newView+' #browser_details_header_text').html('');
            $('#'+newView+' #addAppletButton').unbind();
        } else {
            var html = ''+
                '<div data-role="page" id = "'+newView+'" data-id="myPage">' +
                '<div id="description-header" class="bare-header" data-role="header" class="blue-gradient" data-position="fixed" data-tap-toggle="false">' +
                    '<a class="ui-btn ui-btn-left header-link" data-rel="back"><i class="pg-arrow_left_line_alt"></i> Back</a>'+
                    '<h1 id="browser_details_header_text" style="text-align: center !important;">'+formTitle+'</h1>'+
                '</div>'+
                '<div role="main" id="description-content-section" style="xheight: 85vh;padding: 0px;background-color: white">'+
                '</div>'+

                '<div class="app-footer" style="height: 50px !important;" data-position="fixed" data-tap-toggle="false" data-role="footer">' +
                    '<div style="height: inherit" data-role="navbar">' +
                        '<ul>' +
                            '<li>' +
                                '<a style="margin-top: -2px; border:none !important;" href="#"><span class="footer-icon">&nbsp;</span><p class="footer_p" style="margin-top: -4px; color: grey !important">&nbsp;</p></a>'+
                            '</li>' +
                            '<li>' +
                                '<a style="margin-top: -2px; border:none !important;" href="#"><span class="footer-icon">&nbsp;</span><p class="footer_p" style="margin-top: -4px; color: grey !important">&nbsp;</p></a>'+
                            '</li>' +
                            '<li>' +
                                '<a style="color:grey; border: none;" detail_id="" id ="addAppletButton"><i class="fa fa-arrow-right"></i><p class="footer_p" style="margin-top: -4px; color: grey !important">Preview</p></a>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>';
            BODY.append(html);
        }
        //$('#description-footer').hide();
        //BODY.trigger('create');
        bodyContainer.pagecontainer("change", "#"+newView, {transition: "fade"});
        adjustHeightsToViewport();
        txDeferred.resolve();
        return txDeferred.promise();
    };
    var createSearchPage    = function(){};
    var createListPage      = function(){};

    return {
        openBrowser : function(){
            try {
                cred = {
                        realm_id : undefined,//JSON.parse(window.localStorage["realm_full"]).id,
                        username : getUserCredentials().username,
                        token    : getUserCredentials().api_key,
                        applet_id: undefined
                };
                importtUrl = JSON.parse(window.localStorage["realm_full"]).base_url+'/actions/applets/import';
                cred.realm_id = JSON.parse(window.localStorage["realm_full"]).id;

                $.when(showSliderList())
                    .done(function(){
                        $('#explore_main_page').find('[id="explore_main_row"]').html(loadingHtml).trigger('refresh');
                        adjustHeightsToViewport();
                        $.when(fetchLocalConfig())
                            .done(function(data){
                                listCategories('explore_main_page', data);
                            })
                            .fail(function(e){
                                $('#explore_main_page').find('[id="explore_main_row"]').html(showErrorMsg('An error occured')).trigger('refresh');
                            });
                    })
            } catch(e){
                alert(JSON.stringify(e));
            }
        },
        getAppletCountInGroup: function(group_type, id){
            var counts = getAppletsIDsInConfig(group_type, id);
            return counts ? counts.length : null;
        },
        populateAppletList: function(category_id, element, category_type) {
            var _appletListJson = getAppletListJson(element,category_id,category_type, form_config);
            return populateAppletList(element, _appletListJson);
        },
        fetchAppletsIDsInConfig :function(category_type, id){
            return getAppletsIDsInConfig(category_type, id);
        },
        displayAppletDetails: function(appletId, element, forceFetchFromServer, backlink){
                $.when(getAppletById(appletId, forceFetchFromServer))
                    .done(function(data){
                        try{
                            if(!populateDetailsPage(data, element, appletId, backlink)){
                                history.back();
                            }
                        } catch (e){
                            showMessage('An error has occured');
                            alert(JSON.stringify(e));
                        }
                    })
                    .fail(function(e){
                        showMessage('Count not fetch this information. Please try again later');
                        alert(JSON.stringify(e));
                        history.back();
                    })
        },
        getAppletConfig: function(applet_id){
            alert(applet_id);
            var txDeferred = $.Deferred();
            $.when(getAppletById(applet_id))
                .done(function(data){
                    txDeferred.resolve(data);
                })
                .fail(function(){
                    txDeferred.reject();
                });
            return txDeferred.promise();
        },
        addFormToRealm: function(formRef, backlink){
            try {
                // Get the current user
                navigator.notification.confirm(
                    'This applet will be imported to your Workspace and will be shared with your team',
                    function(buttonIndex) {
                        if (buttonIndex == 2) {
                            //realm.formelo.com //actions/applet/import POST key:value //applet_id //realm_id, // username //token
                            cred.applet_id = formRef;
                            $.when(fetchData(importtUrl, cred, 'POST'))
                                .done(function(data){
                                    alert(JSON.stringify(data));
                                    showMessage('New form Added!');
                                })
                                .fail(function(err){
                                    alert(JSON.stringify(err));
                                });
                            bodyContainer.pagecontainer("change", "#"+backlink, {
                                transition: 'slideup',
                                reverse : true
                            });
                        } else if (buttonIndex == 1) {}
                    },
                    'Import Applet', ['Cancel', 'Yes'],
                    ''
                );
            } catch(e){
                alert(JSON.stringify(e));
            }
        },
        closeBrowser : function(){
            app.form.clear();
            bodyContainer.pagecontainer("change", "#form_group_list", {
                transition: 'slideup',
                reverse : true
            });
            resetAllNavIndicators();
            $('ul li a.nav_item_forms span').addClass("nav-active");
            app.currentView = 'form_group_list';
        }
    }
}();