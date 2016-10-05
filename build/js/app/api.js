"use strict";
//document.addEventListener('deviceready', function () {
    var publicCtlr = function () {
        ///////////////////////////   M E M B E R   V A R I A B L E S ////////////////////////
        // Hold the average config
        var form_config = null;
        var favorites_config;

        var tempApplets = {};
        var LOG_TAG = 'public controller';
        var publicEndpoint = globals.files.publicRealmEndpoint;
        var publicAppletUrl = 'https://' + publicEndpoint + '.formelo.com/actions/' + apiVersion + '/applets/config';
        var searchAppletUrl = 'https://' + publicEndpoint + '.formelo.com/actions/' + apiVersion + '/applets/config?q=';
        var searchTermsUrl = 'https://' + publicEndpoint + '.formelo.com/actions/' + apiVersion + '/applets/terms?q=';
        var singleAppletUrl = 'https://' + publicEndpoint + '.formelo.com/actions/' + apiVersion + '/applets/config?id=';
        var ratingUrl = 'https://' + publicEndpoint + '.formelo.com/actions/' + apiVersion + '/applets/review';
        //var teamUrl         = 'https://demo.formelo.com/actions/v1/applets/config?username=rd@pmglobaltechnology.com';

        // Singleton
        var active = false;
        var url = '';

        /////////////////////////// P R I V A T E   M E T H O D S  ////////////////////////
        var loadingHtml = '<div class="container-xs-height full-vh">' +
            '<div class="row-xs-height">' +
            '<div class="col-xs-height col-middle">' +
            '<div class="error-container text-center">' +
            '<h1 class="error-number" style="color: grey;">' +
            '<div class="progress-circle-indeterminate"></div>' +
            '</h1>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        var errorHtml = '<div class="container-xs-height full-vh">' +
            '<div class="row-xs-height">' +
            '<div class="col-xs-height col-middle">' +
            '<div class="error-container text-center">' +
            '<h1 class="error-number" style="color: grey;">' +
            ':(' +
            '</h1>' +
            '<h2 class="semi-bold" style="color: grey">Well, this is embarrasing.</h2>' +
            '<p class="fs-12 hint-text" style="text-align: center; padding: 0px  10px; text-shadow: none;">An Error has occured. Please try again</p>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        var noNetworkHtml = '<div class="container-xs-height full-vh">' +
            '<div class="row-xs-height">' +
            '<div class="col-xs-height col-middle">' +
            '<div class="error-container text-center">' +
            '<h1 class="error-number" style="color: grey;">' +
            ':(' +
            '</h1>' +
            '<h2 class="semi-bold" style="color: grey">Something went wrong</h2>' +
            '<p class="fs-12 hint-text" style="text-align: center; padding: 0px  10px; text-shadow: none;">Make sure you are connected to the internet and try again.</p>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        var fetchData = function (url, _data, _method, _headers) {
            var data = _data || {};
            var method = _method || 'GET';
            var txDeferred = $.Deferred();
            var headers = _headers || {};
            var header = headers['accept-encoding'] = 'gzip';
            if (isonline()) {
                $.ajax({
                    url: url,
                    type: method,
                    data: data,
                    cache: false,
                    headers: header,
                    success: function (data) {
                        txDeferred.resolve(data);
                    },
                    error: function (xhr) {
                        handleErrorCodes(xhr, txDeferred);
                    },
                    timeout: TIMEOUT
                });
            } else {
                txDeferred.reject('No internet connection');
            }
            return txDeferred.promise();
        };

        var fetchLocalConfig = function () {
            var txDeferred = $.Deferred();
            //alert('fetching ' + publicAppletUrl + ',  Device info is ' + JSON.stringify(getDeviceInfo()));
            $.when(fetchData(publicAppletUrl, getDeviceInfo()))
                .done(function (data) {
                    form_config = data;
                    txDeferred.resolve(data);
                })
                .fail(function (e) {
                    handleErrorCodes(e, txDeferred, false, publicAppletUrl);
                });
            return txDeferred.promise();
        };

        var saveRemoteConfig = function () {
            return true;
        };

        var validateConfig = function () {
            return true;
        };

        var loadRecentSearchesFromDB = function () {
            return true;
        };

        var populateSearchList = function (element, data) {
            return true;
        };

        var fetchFavorites = function () {
            var tmpFavoriteArray = JSON.parse(window.localStorage.favorites);
            var returnJson = [];
            // For each one, get the id, name and description and sae to an array
            if (tmpFavoriteArray && tmpFavoriteArray.length) {
                for (var i = 0; i < tmpFavoriteArray.length; i++) {
                    var current = tmpFavoriteArray[i];
                    var tmpJson = {
                        icon_url: current.icon_url,
                        description: current.description,
                        name: current.name,
                        id: current.id,
                        scope: current.scope
                    };
                    returnJson.push(tmpJson);
                }
                return returnJson;
            } else {
                return [];
            }
        };

        var isValidConf = function (conf) {
            var valid = true;
            if (conf && !$.isEmptyObject(conf)) {
                if (!conf.hasOwnProperty('applet_groups')) {
                    valid = false;
                }
            } else {
                valid = false;
            }
            return valid;
        };

        var getConfigJson = function (forceFetch) {
            var txDeferred = $.Deferred();
            //var formconf = Manager.get(Manager.keys.FORM_CONFIG);

            Manager.DB.get(Manager.keys.FORM_CONFIG, function(formconf){
                if (isValidConf(formconf)) {
                    form_config = formconf;
                    txDeferred.resolve(form_config);
                } else {
                    $.when(fetchLocalConfig())
                        .done(function (data) {
                            //alert('GetConfigJSON: Config gotten. .  Saving. . . ', LOG_TAG);
                            form_config = data;
                            //Manager.set(Manager.keys.FORM_CONFIG, form_config);
                            Manager.DB.set(Manager.keys.FORM_CONFIG, form_config, function(){
                                //alert('Config saved....');
                                txDeferred.resolve(form_config);
                            }, function(err){
                                alert(JSON.stringify(err));
                            });
                        })
                        .fail(function (e) {
                            Log.d('GetConfigJSON: Failed to get config ' + JSON.stringify(e), LOG_TAG);
                            txDeferred.reject(e);
                        });
                }
            });
            return txDeferred.promise();
        };

        var populatepage = function (element, configObj) {
            if (!isValidConf(configObj)) {
                $('#' + element).find('[id="main_row"]').html(errorHtml);
                return false;
            }
            //console.log(configObj);
            var categories = configObj.applet_groups;
            var subHtml = '';

            if (categories) {
                for (var i = 0; i < categories.length; i++) {
                    var item = categories[i];
                    subHtml += '<div class="col-xs-6 col-sm-3 col-md-3 cool_category clickable-panel" category-code="' + item.id + '" category-name="' + item.name + '" style="padding: 12px; margin-bottom: 6px;">' +
                    '<div class = "row" style="height: inherit;" category-id="' + item.id + '">' +
                    '<div class="col-xs-12 col-sm-12 col-md-12" style = "padding: 0px;">' +
                    '<img class="donkeyCache" donkey-id = "' + item.icon_url + '" xx ="' + i + '" class="myImg mainImg" src="' + item.icon_url + '" style="max-width: 100%;" />' +
                    '</div>' +
                    '<div class="col-xs-12 col-sm-12 col-md-12" style = " height:64px; max-height:64px; background-color:#404040;">' +
                    '<span style="font-size: x-small; color: #ffffff; font-weight:400">' + item.name + '</span>' +
                    '<p style="font-size: xx-small; color: #D9D9D9; margin-top: 2px; word-wrap: break-word; line-height: 14px;">' + item.description + '</p>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
                }
                $('#' + element).find('[id="main_row"]').html(subHtml).trigger('refresh');
                adjustHeightsToViewport();
                $('.cool_category').click(function (e) {
                    e.stopPropagation();
                    events.publish('category.selected', {
                        id: $(this).attr('category-code'),
                        name: $(this).attr('category-name')
                    });
                    return false;
                });
                DonkeyCache.grab();
            }
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

        var populateAppletList = function (element, configObj) {
            var tmpHtml = '';
            if (!configObj) {
                throw new Error('Config is not defined');
            }
            if (configObj.length) {
                for (var i = 0; i < configObj.length; i++) {
                    var currentApplet = configObj[i];
                    if (currentApplet) {
                        var name = currentApplet.name ? currentApplet.name.substring(0, 100) : "Unnamed";
                        var description = currentApplet.description ? currentApplet.description : "";
                        var id = currentApplet.id;
                        var scope = currentApplet.scope ? currentApplet.scope : '';

                        var icon_url = name.charAt(0).toUpperCase();
                        if (currentApplet.icon_url && currentApplet.icon_url.trim().length) {
                            icon_url = currentApplet.icon_url;
                        } else {
                            if (/[^a-zA-Z]/.test(icon_url)) {
                                icon_url = "img/bg/unknown.gif";
                            } else {
                                icon_url = "img/bg/" + icon_url + ".gif";
                            }
                        }
                        /*tmpHtml += '<div class="card-header clearfix applet-list-item" applet-id="' + currentApplet.id + '" channel_type="' + currentApplet.scope + '">' +
                        '<div class="user-pic pull-left">' +
                        '<img alt="Profile Image" width="33" height="33" data-src-retina="' + icon_url + '" data-src="' + icon_url + '" src="' + icon_url + '">' +
                        '</div>' +
                        '<div style="margin-left: 40px">' +
                        '<h5 style="font-weight: 300;">' + name + '</h5>' +
                        '<h6>' + description + '</h6>' +
                        '</div>' +
                        '</div>';*/
                        tmpHtml += '<div class="col-xs-6 col-sm-3 col-md-3 applet-list-item cool_category clickable-panel" applet-id="' + currentApplet.id + '" channel_type="' + currentApplet.scope + '" style="padding: 12px; margin-bottom: 6px;">' +
                        '<div class = "row" style="height: inherit;">' +
                        '<div class="col-xs-12 col-sm-12 col-md-12" style = "padding: 0px;">' +
                        '<img aaa ="' + i + '" class="xmyImg xloadingImg" src="img/loading.png" style="max-width: 100%;" />' +
                        '<img xxx ="' + i + '" class="xmyImg xmainImg" src="' + icon_url + '" style="max-width: 100%;" />' +
                        '</div>' +
                        '<div class="col-xs-12 col-sm-12 col-md-12" style = " height:64px; max-height:64px; background-color:#404040;">' +
                        '<span style="font-size: x-small; color: #ffffff; font-weight:400">' + name + '</span>' +
                        '<p style="font-size: xx-small; color: #D9D9D9; margin-top: 2px; word-wrap: break-word; line-height: 14px;">' + description + '</p>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    }
                }
            } else {
                $('#' + element).find('[id="applet-list-placeholder"]').addClass('full-vh');
                tmpHtml = '' +
                '<div class="container-xs-height full-vh">' +
                '<div class="row-xs-height">' +
                '<div class="col-xs-height col-middle">' +
                '<div class="error-container text-center">' +
                '<h1 class="error-number" style="color: grey;">:(</h1>' +
                '<h2 class="semi-bold" style="color: grey">Nothing Here</h2>' +
                '<p>The applets you <i class="fa fa-heart" style="color: red"></i> will be shown here!</p>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
            }

            $('#'+element).find('[id="applet-list-placeholder"]').html(tmpHtml);//.trigger('create');
            adjustHeightsToViewport();
            $('.xmyImg').hide();
            $('.xloadingImg').show();
            $('.xmainImg').on('load', function () {
                var x = $(this).attr('xxx');
                $('[aaa="'+x+'"]').hide();
                $(this).show();
            });

            $('.applet-list-item').on('click', function () {
                events.publish('applet.selected', {
                    id: $(this).attr('applet-id')
                });
            });
        };

        var escapehtml = function (html) {
            return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        var populateInboxPage = function (element, configObj) {
            var tmpHtml = '';
            var initialDate = "2342"; // bla bla
            var numOfDays = 0;
            var open = false;

            if (configObj.length) {
                $('#' + element).find('[id="applet-list-placeholder"]').removeClass('full-vh');
                for (var i = 0; i < configObj.length; i++) {
                    var currentApplet = configObj[i];
                    var image = currentApplet.subject.charAt(0).toUpperCase();
                    var itemRead = currentApplet.opened == 'N' ? '' : 'style="font-weight:100;"';

                    if (!currentApplet.image || currentApplet.image != 'undefined') {
                        image = currentApplet.image;
                    } else {
                        if (/[^a-zA-Z]/.test(image)) {
                            image = "img/bg/unknown.gif";
                        } else {
                            image = "img/bg/" + image + ".gif";
                        }
                    }
                    if (initialDate != moment(currentApplet.time).format('MMMM Do YYYY')) {
                        if (open) {
                            tmpHtml += '</div>' +
                            '</div>' +
                            '</div>';
                            initialDate = moment(currentApplet.time).format('MMMM Do YYYY');
                            open = false;
                        }
                        tmpHtml += '<div data-pages="portlet" class="panel panel-default" id="portlet-basic">' +
                        '<div class="panel-heading ">' +
                        '<div class="panel-title">' + moment(currentApplet.time).format('MMMM Do YYYY') + '</div>' +
                        '<div class="panel-controls">' +
                        '<ul>' +
                        '<li><a data-toggle="collapse" class="portlet-collapse" href="#"></a>' +
                        '</li>' +
                        '</ul>' +
                        '</div>' +
                        '</div>' +
                        '<div class="panel-body" style="display: block; padding:0;">' +
                        '<div class="card share xcol1" data-social="item" id="applet-list-placeholder">' +
                        '<div class="clickable card-header clearfix inbox-list-item" applet-id="' + currentApplet.id + '">' +
                        '<div class="user-pic">' +
                        '<img alt="Profile Image" width="33" height="33" data-src-retina="' + image + '" data-src="' + image + '" src="' + image + '">' +
                        '</div>' +
                        '<h6 style="float: right; font-size: xx-small; display: inline;">' + moment(currentApplet.time).format('hh:mma') + '</h6>' +
                        '<div style="margin-left: 40px">' +
                        '<h5 ' + itemRead + '>' + currentApplet.subject.substring(0, 40) + '</h5>' +
                        '<h6 style="color:black;opacity:1;">' + currentApplet.from+'</h6>' +
                        '<h6>' + strip(currentApplet.body.substring(0, 100)) + '</h6>' +
                        '</div>' +
                        '</div>';
                        open = true;
                        initialDate = moment(currentApplet.time).format('MMMM Do YYYY');
                    } else {
                        tmpHtml +=
                            '<div class="clickable card-header clearfix inbox-list-item" applet-id="' + currentApplet.id + '">' +
                            '<div class="user-pic">' +
                            '<img alt="Profile Image" width="33" height="33" data-src-retina="' + image + '" data-src="' + image + '" src="' + image + '">' +
                            '</div>' +
                            '<h6 style="float: right; font-size: xx-small; display: inline;">' + moment(currentApplet.time).format('hh:mma') + '</h6>' +
                            '<div style="margin-left: 40px">' +
                            '<h5 ' + itemRead + '>' + currentApplet.subject.substring(0, 40) + '</h5>' +
                            '<h6 style="color:black;opacity:1;">' + currentApplet.from+'</h6>' +
                            '<h6>' + strip(currentApplet.body.substring(0, 200)) + '</h6>' +
                            '</div>' +
                            '</div>';
                    }
                }
            } else {
                $('#' + element).find('[id="applet-list-placeholder"]').addClass('full-vh');
                tmpHtml = '' +
                '<div class="container-xs-height full-vh">' +
                '<div class="row-xs-height">' +
                '<div class="col-xs-height col-middle">' +
                '<div class="error-container text-center">' +
                    //'<h1 class="error-number" style="color: grey;">No</h1>'+
                '<h1 class="error-number" style="color: grey;"><img class="sm-image-responsive-height" style="width:100px" src="img/empty-states/no-messages.png"></h1>' +
                '<h2 class="semi-bold" style="color: grey">No messages</h2>' +
                '<p class="fs-12 hint-text" style="text-align: center; padding: 0px  10px; text-shadow: none;">Any useful notifications or messages will be listed here</p>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
            }

            $('#' + element).find('[id="applet-list-placeholder"]').html(tmpHtml).trigger('create');
            //BODY;//.trigger('refresh');
            adjustHeightsToViewport();
            $('.inbox-list-item').on('tap', function () {
                events.publish('inbox.selected', {
                    id: $(this).attr('applet-id')
                });
            });

            $('.inbox-list-item').on('taphold', function (e) {
                e.stopPropagation();
                var element = $(this);
                var id = $(this).attr('applet-id');
                var sql = 'DELETE FROM INBOX WHERE ID = ' + id;
                navigator.notification.confirm(
                    'This action can\'t be undone',
                    function (buttonIndex) {
                        if (buttonIndex == 1) {
                            alert(sql);
                            element.hide();
                            initFunctions.database.execute(sql);
                        } else if (buttonIndex == 2) {
                        }
                    },
                    'Delete this Message', ['Delete', 'Cancel'],
                    ''
                );
            });

        };

        var getAppletsIDsInConfig = function (category_type, id) {
            var group_mode = '';
            switch (category_type) {
                case Constants.public.applet_features:
                    group_mode = form_config[Constants.public.applet_features];
                    break;
                case Constants.public.applet_group:
                    group_mode = form_config[Constants.public.applet_group];
                    break;
                default:
                    return null;
            }

            var result = $.grep(group_mode, function (e) {
                return e.id == id;
            });

            if (result.length === 0) {
                return null;
            } else if (result.length == 1) {
                var cat = result[0];
                return cat[Constants.public.applets];
            } else {
                return null;
            }
        };

        var getRelatedItemsById = function (appletId) {
            try {
                var group_mode = form_config[Constants.public.applet_group];
                var categoryId = null;
                console.log(group_mode);
                var result = $.grep(group_mode, function (e) {
                    return e.id == appletId;
                });
                if (!result.length) {
                    for (var i = 0; i < group_mode.length; i++) {
                        var cat = group_mode[i];
                        for (var j = 0; j < cat.applets.length; j++) {
                            if (appletId == cat.applets[j].id) {
                                categoryId = cat.id;
                                break;
                            }
                        }
                    }
                    if (categoryId) {
                        return getAppletListJson('', categoryId, Constants.public.applet_group, form_config);
                    }
                }
                return false;
            } catch (e) {
                console.log(JSON.stringify(e));
                return false;
            }
        };

        var getAppletById = function (appletId, forceFetchFromServer) {
            var txDeferred = $.Deferred();
           // var individualApplets = Manager.get(Manager.keys.DOWNLOADED_APPLETS);
            Manager.DB.get(Manager.keys.DOWNLOADED_APPLETS, function(_individualApplets){
                var individualApplets = _individualApplets === null ? [] : _individualApplets;
                var result = $.grep(individualApplets, function (e) {
                    return e.id == appletId;
                });
                if (!result.length || forceFetchFromServer) {
                    //alert('Fetching applet from server ' + appletId);
                    if (forceFetchFromServer){
                        customFunctions.displayNotificationDialog();
                    }
                    //alert('fetching '+singleAppletUrl + appletId);
                    $.when(fetchData(singleAppletUrl + appletId))
                        .done(function (data) {
                            if (forceFetchFromServer){
                                customFunctions.closeNotificationDialog();
                            }
                            var result = $.grep(individualApplets, function (e) {
                                return e.id == appletId;
                            });
                            if (!result.length) {
                                individualApplets.push({id: appletId, config: data});
                            } else {
                                $.each(individualApplets, function () {
                                    if (this.id == appletId) {
                                        this.config = data;
                                    }
                                });
                            }
                            Manager.DB.set(Manager.keys.DOWNLOADED_APPLETS, individualApplets, function(){
                                //showMessage('Refresh completed...');
                                txDeferred.resolve(data);
                            }, function(e){
                                showMessage('Data failed to sync.');
                                alert(JSON.stringify(e));
                            });
                        })
                        .fail(function (e) {
                            if (forceFetchFromServer){
                                customFunctions.closeNotificationDialog();
                                showMessage('An error occured');
                            }
                            txDeferred.reject(e);
                        });
                } else {
                    if (forceFetchFromServer){
                        customFunctions.closeNotificationDialog();
                    }
                    //alert('fetching applet from local ' + appletId);
                    txDeferred.resolve(result[0].config);
                }
            });

            return txDeferred.promise();
        };

        var populateDetailsPage = function (config, element, id, backlink) {
            var configObj = config.applets[id];
            if (!configObj) {
                return swal({
                    title: "Something is wrong",
                    text: "The configuration of this Applet is not valid. The Applet's Developer has ben notified.",
                    type: 'error',
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Go Back",
                    closeOnConfirm: true
                }, function(){
                    history.back();
                });
            }
            var authorName = (configObj.source && configObj.source.realm) ? configObj.source.realm.name : configObj.realm.name;
            var relatedItems = getRelatedItemsById(id);
            var relatedHtml = '';
            if (relatedItems && relatedItems.length) {
                var len = relatedItems.length < 3 ? relatedItems.length : 3;
                for (var a = 0; a < len; a++) {
                    relatedHtml +=
                        '<div class="card-header clearfix public-related-item" related-item-id = "' + relatedItems[a].id + '">' +
                        '<div class="user-pic pull-left">' +
                        '<img alt="Profile Image" width="33" height="33" data-src-retina="' + relatedItems[a].icon_url + '" data-src="' + relatedItems[a].icon_url + '" src="' + relatedItems[a].icon_url + '">' +
                        '</div>' +
                        '<div style="margin-left: 40px">' +
                        '<h5 style="font-weight: 300;">' + relatedItems[a].name + '</h5>' +
                        '<h6>' + relatedItems[a].description + '</h6>' +
                        '</div>' +
                        '</div>';
                }
            }

            var image = new Image();
            image.onload = function(){
                var colorThief = new ColorThief();
                var domColor = colorThief.getColor(image);
                $('#details-applet-image-div').css('background-color', rgbToHex(domColor[0],domColor[1],domColor[2]));
            };
            image.src = configObj.icon_url;

            var html = '<div class="row" style="margin: 0px;">' +
                            '<div id="details-applet-image-div" class="col-xs-12 30-vh 30-max-vh" style="overflow: hidden; text-align: center; background-color:#2C3E50;">'+
                                '<span class="helper" style="display: inline-block;height: 100%;vertical-align: middle;"></span>'+
                                '<img class="details-applet-image" src="' + configObj.icon_url + '" style="width: 40%;vertical-align: middle;">'+
                            '</div>'+
                            '<div class="col-xs-12 10-min-vh" style="xmin-height: 6vh;padding: 5px 10px;">' +
                                '<div class="row" style="border-bottom: 1px solid #e8e8e8">' +
                                    '<div class="col-xs-8">' +
                                        '<p style="color:gray; font-size: small;">' + configObj.name + '</p>' +
                                        '<p class="small hint-text">' + (authorName || '') + '</p>' +
                                    '</div>' +
                                    '<div class="col-xs-4" style="border-left: 1px solid #e8e8e8;">' +
                                        '<p><i class="fa fa-star-o" style="color:grey;"></i><i class="fa fa-star-o" style="color:grey;"></i><i class="fa fa-star-o" style="color:grey;"></i>' +
                                        '<i class="fa fa-star-o" style="color:grey;"></i><i class="fa fa-star-o" style="color:grey;"></i></p>' +
                                        '<p appletID="" id="applet-rating-bar" class="small hint-text" style="color: #4183D7"><i class="fa fa-pencil" style="color:grey;"></i> Add a review</p>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="col-xs-12 15-min-vh" style="xmin-height: 20vh; padding: 5px 10px;">' +
                                '<p style="text-transform: uppercase; font-size: x-small; color: grey;">About</p><hr style="display: none">' +
                                '<p class="small hint-text">' + configObj.description + '</p>' +
                            '</div>' +
                            '<div class="col-xs-12 40-min-vh" style="xmin-height: 20vh;padding: 0px;">' +
                                '<p style="padding:0px 10px; text-transform: uppercase; font-size: x-small; color: grey;" style="padding:0px 10px;">Related</p><hr style="display:none;">' +
                                '<div class="card share applet-list-placeholder" data-social="item" style="margin-bottom: 0px !important; border: none;">'+
                                relatedHtml +
                            '</div>' +
                        '</div><br/><br/><br/>';


            $('#' + element).find('[id="description-content-section"]').html(html);

            $('#' + element).find('[id="details_title"]').html(configObj.name);//.trigger('create');
            $('#' + element).find('[id="details_author"]').html(authorName);//.trigger('create');
            $('#' + element).find('[id="details_category"]').html(configObj.scope);//.trigger('create');
            $('#' + element).find('[id="details_description"]').html(configObj.description);//.trigger('create');//
            $('#' + element).find('[id="tab2hellowWorld"]').html(configObj.description);//.trigger('create');
            $('#' + element).find('[id="social-post"]').attr('src', configObj.icon_url);////assets/img/social-post-image.png
            $('#' + element).find('[id="main_open_detail"]').attr('detail_id', id);
            $('#' + element).find('[id="details_placeholder"]').attr('detail_id', id);
            $('#' + element).find('[id="applet-rating-bar"]').attr('appletID', id);
            $('#' + element).find('[id="details_heater_text"]').html(configObj.name);
            $('#' + element).find('[id="main_detail_favorites"]').attr('name', configObj.name).attr('description', configObj.description).attr('icon_url', configObj.icon_url).attr('scope', configObj.scope).attr('detail_id', id);

            $('#' + element).find('[id="refreshIndividualConfig"]').attr('detail_id', id);
            adjustHeightsToViewport();

            $('#main_open_detail').unbind();
            $('#main_open_detail').click(function (e) {
                e.stopPropagation();
                try {
                    alert(backlink);
                    formController($(this).attr('detail_id'), backlink, 'public');
                } catch (err) {
                    alert(JSON.stringify(err));
                    showMessage('An error occured');
                }
            });

            $('#applet-rating-bar').unbind();
            $('#applet-rating-bar').click(function () {
                var id = $('#applet-rating-bar').attr('appletID');
                publicCtlr.rateApplet(id, configObj.name);
            });
            $('#main_detail_favorites').unbind();
            $('#main_detail_favorites').click(function (e) {
                e.stopPropagation();
                events.publish('applet.saved', {
                    id: $(this).attr('detail_id'),
                    name: $(this).attr('name'),
                    description: $(this).attr('description'),
                    icon_url: $(this).attr('icon_url'),
                    scope: 'public'
                });
            });

            $('#refreshIndividualConfig').unbind();
            $('#refreshIndividualConfig').click(function (e) {
                e.stopPropagation();
                getAppletById($(this).attr('detail_id'), true);
            });
            $('.public-related-item').click(function () {
                var id = $(this).attr('related-item-id');
                detailsController(id, '', 'data_lists');
            });
        };

        var populateInboxDetail = function (inboxObj) {
            var body = '';
            var links = '<div class="card share xcol1" data-social="item">';
            var forms = '<div class="card share xcol1" data-social="item">';

            if (inboxObj.forms.length){
                $('#nav-inbox-forms-tab').show();
                for (var i = 0; i < inboxObj.forms.length; i++) {
                    forms += '<div class="card-header clearfix form-forms" parameters=\'' + JSON.stringify(inboxObj.forms[i].parameters) + '\' num="' + inboxObj.forms[i].id + '">' +
                    '<h5>' + inboxObj.forms[i].name + '</h5>' +
                    '<h6></h6>' +
                    '</div>';
                }
            } else {
                $('#nav-inbox-forms-tab').hide();
            }
            forms += '</div>';

            if (inboxObj.forms.length) {
                $('#nav-inbox-url-tab').show();
                for (var j = 0; j < inboxObj.links.length; j++) {
                    links += '<div class="card-header clearfix form-links" link-id="' + inboxObj.links[j].url + '">' +
                    '<h5>' + inboxObj.links[j].name + '</h5>' +
                    '<h6></h6>' +
                    '</div>';
                }
            } else {
                $('#nav-inbox-url-tab').hide();
            }
            links += '</div>';

            var image = inboxObj.subject.charAt(0).toUpperCase();
            if (!inboxObj.image || inboxObj.image !== 'undefined') {
                image = inboxObj.image;
            } else {
                if (/[^a-zA-Z]/.test(image)) {
                    image = "img/bg/unknown.gif";
                } else {
                    image = "img/bg/" + image + ".gif";
                }
            }

            var meta = '<div class="card share" data-social="item">' +
                '<div class="card-header clearfix">' +
                '<div class="user-pic">' +
                '<img alt="Profile Image" width="33" height="33" data-src-retina="' + image + '" data-src="' + image + '" src="' + image + '">' +
                '</div>' +
                '<h6 style="float: right; font-size: xx-small; display: inline;">' + moment(inboxObj.time).format('hh:mma') + '</h6>' +
                '<h5>' + inboxObj.subject + '</h5>' +
                '<h6>' + inboxObj.from    + '</h6>'+
                '</div>' +
                '</div>';

            $('#inbox-body-tab').html(inboxObj.body);
            $('#inbox-forms-tab').html(forms);
            $('#inbox-url-tab').html(links);
            $('#inbox-meta').html(meta).trigger('refresh');
            $('#inbox-header').html(inboxObj.subject);
            adjustHeightsToViewport();

            $('.form-links').click(function (e) {
                e.stopPropagation();
                try {
                    var link = $(this).attr('link-id');
                    if (link) {
                        var ref = cordova.InAppBrowser.open(link, '_blank', 'location=yes');
                    }
                } catch (err) {
                    alert(JSON.stringify(err));
                }
            });

            $('#inbox-body-tab a').click(function (e) {
                var href = $(this).attr('href');
                if (href) {
                    showUrl(href);
                }
                return false;
            });

            $('.form-forms').click(function (e) {
                e.stopPropagation();
                try {
                    var formRef = $(this).attr('num');
                    var _data = JSON.parse($(this).attr('parameters'));
                    openAndPopulateForm(formRef, _data);
                } catch (e) {
                    showMessage('This form is not available');
                    alert(JSON.stringify(e));
                }
            });

            BODY.trigger('refresh');

        };

        var updateInboxItem = function (id) {
            var sql = 'UPDATE INBOX SET OPENED = "Y" WHERE ID = ' + id;
            alert(sql);
            initFunctions.database.execute(sql);
        };

        var getInboxLists = function (id) {
            var txDeferred = $.Deferred();
            var returnArray = [];
            try {
                //alert(APPLET_MODE);
                if (!getUserCredentials() || !getUserCredentials().id) {
                    return [];
                }
                var sql = '';
                if (id) {
                    sql = 'SELECT * FROM INBOX WHERE ID = ' + id;
                } else {
                    sql = 'SELECT * FROM INBOX WHERE USER = "' + getUserCredentials().id + '" AND REALM = "' + getUserCredentials().realm + '" ORDER BY LAST_MODIFIED_TIME DESC';
                }
                $.when(initFunctions.database.execute(sql))
                    .done(function (tx, formDataSet) {
                        if (!formDataSet.rows.length) {
                            txDeferred.resolve(returnArray);
                        }
                        for (var i = 0, len = formDataSet.rows.length; i < len; i++) {
                            var inboxItem = formDataSet.rows.item(i);
                            var tmpObj = {
                                id: inboxItem.ID,
                                time: inboxItem.LAST_MODIFIED_TIME,
                                from: inboxItem.SENDER,
                                subject: inboxItem.SUBJECT,
                                body: inboxItem.BODY,
                                image: inboxItem.IMAGE,
                                links: JSON.parse(inboxItem.LINKS),
                                forms: JSON.parse(inboxItem.FORMS),
                                opened: inboxItem.OPENED,
                            };
                            returnArray.push(tmpObj);
                        }
                        txDeferred.resolve(id ? returnArray[0] : returnArray);
                    })
                    .fail(function (e) {
                        alert(JSON.stringify(e));
                    });
            } catch (e) {
                alert(JSON.stringify(e));
                txDeferred.reject(returnArray);
            }
            return txDeferred.promise();
        };

        /////////////////////////////  C O N S T R U C T O R    //////////////////////////////

        var constructor = function () {
            /*$.when(getConfigJson())
                .done(function (data) {
                    form_config = data;
                })
                .fail(function () {
                });
                */
        };

        //$(document).ready(function() {
        document.addEventListener("deviceready", function () {
            try {
                constructor();
            } catch (e) {
                alert(JSON.stringify(e));
            }
        });
        //});


        /////////////////////////////  P U B L I C  M E T H O D S  ///////////////////////////
        return {
            rateApplet: function (appletId, appletName) {
                var formhtml = '<div class="form-group form-group-default" style="border-bottom: none !important;">' +
                    '<label for="rating" class = "formelo-form-label">Rating</label>' +
                    '<div id="rating" class="force-rating"></div>' +
                    '</div><br/>' +
                    '<div class="form-group form-group-default">' +
                    '<label class="formelo-form-label">Your Review</label>' +
                    '<textarea id="ratingMessage" class="form-control" id="name" placeholder="Type your message here" style="margin-top: 0px; margin-bottom: 0px; height: 185px;" aria-invalid="false"></textarea>' +
                    '</div>' +
                    '<button id ="sendRating" data-inline="true" type="button" class="btn btn-primary ui-btn-inline">Send Review</button>';
                var callback = function () {
                    $('#rating').raty({
                        starType: 'img'
                    });
                    $('#sendRating').click(function () {
                        var rate = $('#rating').raty('score');
                        var comment = $('#ratingMessage').val();
                        var data = {
                            rating: rate,
                            review: comment,
                            id: appletId
                        };
                        $.when(fetchData(ratingUrl, data, 'POST'))
                            .done(function () {
                                swal({
                                    title: "Thanks for the honest review.",
                                    text: "",
                                    type: 'success',
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Back",
                                    closeOnConfirm: true
                                }, function(){
                                    history.back();
                                });
                            })
                            .fail(function () {
                                showMessage('Kindly check your internet settings and try again');
                            });
                    });
                };
                showModal('Submit Review', formhtml, callback);
            },

            refreshConfig: function () {
                try {
                    var loadingBarHtml      = '<div class="progress progress-small progress-bar-complete"><div class="progress-bar-indeterminate"></div></div>';
                    var refreshPlaceholder = $('.refresh-placeholder');
                    refreshPlaceholder.html(loadingBarHtml);
                    $('#refresh-public-holder').attr('src', 'img/loading.gif');
                    $.when(fetchLocalConfig())
                        .done(function (data) {
                            form_config = data;
                            //Manager.set(Manager.keys.FORM_CONFIG, form_config);
                            Manager.DB.set(Manager.keys.FORM_CONFIG, form_config);
                            populatepage('main_page', form_config);
                            showMessage('Up to date');
                            // Delete all the individual applets
                            if (!globals.files.enablePublicDetailView){
                                Manager.set(Manager.keys.DOWNLOADED_APPLETS, []);
                            }
                            refreshPlaceholder.html('');
                            $('#refresh-public-holder').attr('src', 'img/refresh.png');
                        })
                        .fail(function (e) {
                            refreshPlaceholder.html('');
                            $('#refresh-public-holder').attr('src', 'img/refresh.png');
                            showMessage('Please connect to the internet and try again');
                        });
                } catch (e) {
                    alert(JSON.stringify(e));
                    $('.refresh-placeholder').html('');
                    showMessage('Something went wrong. Please try again');
                }
            },

            showMain: function (element) {
                try {
                        if (isValidConf(form_config)) {
                            populatepage(element, form_config);
                        } else {
                            $('#' + element).find('[id="main_row"]').html(loadingHtml);
                            $.when(getConfigJson())
                                .done(function (data) {
                                    populatepage(element, data);
                                })
                                .fail(function () {
                                    $('#' + element).find('[id="main_row"]').html(noNetworkHtml);
                                });
                        }
                    return true;
                } catch (e) {
                    alert(e.message+" - "+JSON.stringify(e));
                    $('#' + element).find('[id="main_row"]').html(noNetworkHtml);
                    showMessage('An error occured');
                }
            },

            showFavorites: function (element) {
                var favoritesJson = fetchFavorites();
                populateAppletList(element, favoritesJson);
                return true;
            },

            loadSearches: function (element_key, listPlaceholder) {
                var recentSearches = loadRecentSearchesFromDB();
                setTimeout(subscribeToSearchOnchange, 3000);
                return populateSearchList(listPlaceholder, recentSearches);
            },

            getAppletConfig: function (applet_id) {

                var txDeferred = $.Deferred();
                $.when(getAppletById(applet_id))
                    .done(function (data) {
                        txDeferred.resolve(data);
                    })
                    .fail(function () {
                        txDeferred.reject();
                    });
                return txDeferred.promise();
            },

            getAppletCountInGroup: function (group_type, id) {
                var counts = getAppletsIDsInConfig(group_type, id);
                return counts ? counts.length : null;
            },

            populateAppletList: function (category_id, element, category_type) {
                var _appletListJson = getAppletListJson(element, category_id, category_type, form_config);
                return populateAppletList(element, _appletListJson);
            },

            displayAppletDetails: function (appletId, element, forceFetchFromServer, backlink) {
                try {
                    $('#description-content-section').html(loadingHtml);
                    $.when(getAppletById(appletId, forceFetchFromServer))
                        .done(function (data) {
                            return populateDetailsPage(data, element, appletId, backlink);
                        })
                        .fail(function (e) {
                            throw new Error(e);
                        });
                } catch (e) {
                    throw new Error(e);
                }
            },

            saveApplet: function (data) {
                var currentLSState = JSON.parse(window.localStorage.favorites);
                var result = $.grep(currentLSState, function (e) {
                    return e.id == data.id;
                });

                if (!result.length) {
                    currentLSState.push(data);
                    Manager.set(Manager.keys.FAVORITES, currentLSState);
                    swal("You liked this Applet", "View this and other Applets you like on the \"Favorites\" tab. ", "success")
                    //window.localStorage['favorites'] = JSON.stringify(currentLSState);
                } else {
                }
                window.plugins.toast.show("Form has been saved", "short", "bottom");
            },

            fetchAppletsIDsInConfig: function (category_type, id) {
                return getAppletsIDsInConfig(category_type, id);
            },

            populateInbox: function (element) {
                $.when(getInboxLists())
                    .done(function (data) {
                        try {
                            populateInboxPage(element, data);
                        } catch (e) {
                            alert(JSON.stringify(e));
                        }
                    })
                    .fail(function () {
                        alert('failed to get inbox list');
                    });
            },

            populateInboxDetail: function (id) {
                $.when(getInboxLists(id))
                    .done(function (inboxItemObj) {
                        try {
                            updateInboxItem(id);
                            populateInboxDetail(inboxItemObj);
                        } catch (e) {
                            alert(JSON.stringify(e));
                        }
                    });
            }
        };
    }();
//});

// P U B  // S U B
var events = (function(){
    var topics = {};
    var hOP = topics.hasOwnProperty;
    return {
        subscribe: function(topic, listener) {
            // Glitch, ensure only one instance of each topic is called
            if (topics[topic]){
                return true;
            }
            // Create the topic's object if not yet created
            if(!hOP.call(topics, topic)) topics[topic] = [];
            // Add the listener to queue
            var index = topics[topic].push(listener) -1;
            // Provide handle back for removal of topic
            return {
                remove: function() {
                    delete topics[topic][index];
                }
            };
        },
        publish: function(topic, info) {
            // If the topic doesn't exist, or there's no listeners in queue, just leave
            if(!hOP.call(topics, topic)) return;
            // Cycle through topics queue, fire!
            topics[topic].forEach(function(item) {
                item(info !== 'undefined' ? info : {});
            });
        }
    };

})();


var Constants = {
    'public' : {
        applet_group : 'applet_groups',
        applet_features: 'applet_features',
        applets: 'applets'
    },
    'private': {
        user_groups : 'applets'
    }
};


var privateCtlr = function(){
    var teamHubs    = {};
    var recentHubs  = {};
    //var teamHubUrl  = 'https://demo.formelo.com/actions/applets/config?username=rd@pmglobaltechnology.com&scope=private';

    var constructor = function(){
        // Fetch his recent hubs
        // Populate his recent hubs
    };

    var fetchData =  function(url){
        var txDeferred = $.Deferred();
        $.ajax({
            url : url,
            success : function(data){
                txDeferred.resolve(data);
            },
            error: function(){
                txDeferred.reject();
            },
            timeout: TIMEOUT
        });
        return txDeferred.promise();
    };

    var fetchRemoteRealmConfig =  function(){
        var txDeferred = $.Deferred();
        var teamHubUrl = getUserConfigEndpoint();
        if (!isonline()){
            txDeferred.reject('This action requires internet connection. You don\'t seem to have one');
        }
        customFunctions.displayNotificationDialog('Please Wait', 'Setting up your Workspace');

        $.ajax({
            url: teamHubUrl,
            cache: false,
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "GET",
            processData: false,
            headers:{
                "accept-encoding":"gzip"
            },
            success: function(data) {
                customFunctions.closeNotificationDialog();
                try{
                    privateCtlr.saveRealmConfig(data);
                    // Also load the users stats
                    $.when(getRemoteStats())
                        .done(function(){
                            txDeferred.resolve(data);
                        }).fail(function(e){
                            // You won't use your raggae to spoil my blues
                            txDeferred.resolve(data);
                        });
                } catch(e){
                    alert(JSON.stringify(e));
                    txDeferred.reject('Something went wrong, please try again');
                }
            },
            error: function(xhr, textStatus, errorThrown) {
                customFunctions.closeNotificationDialog();
                alert(JSON.stringify(xhr));
                txDeferred.reject(JSON.stringify('Hub temporarily unavailable'));
            },
            timeout: TIMEOUT
        });

        return txDeferred.promise();
    };

    constructor();

    return {
        fetchTeamHubConfig : function(realm){
            var txDeferred = $.Deferred();
            if(teamHubs[0]){
                txDeferred.resolve(teamHubs[0]);
            }
            $.when(fetchData(teamHubUrl))
                .done(function(data){
                    teamHubs[0] = data;
                    txDeferred.resolve(teamHubs[0]);
                })
                .fail(function(){

                });
            return txDeferred.promise();
        },
        fetchApplet: function(applet_id){
            var txDeferred = $.Deferred();
            $.when(privateCtlr.fetchRealmConfig())
                .done(function(data){
                    txDeferred.resolve(data[Constants.private.user_groups][applet_id]);
                }).fail();
            return txDeferred.promise();
        },
        saveRealm: function(realmObj){
            // Check if id already exist in the local storage // A string
            var currentLSState = Manager.get(Manager.keys.REALMS); //JSON.parse(window.localStorage['realms']);
            var result = $.grep(currentLSState, function(e){
                return e.id == realmObj.id;
            });
            if(result.length === 0){
                currentLSState.push(realmObj);
            } else {
                $.each(currentLSState, function() {
                    if (this.id == realmObj.id) {
                        this.description    = realmObj.description;
                        this.theme          = realmObj.theme;
                        this.code           = realmObj.code;
                        this.base_url       = realmObj.base_url;
                    }
                });
            }
            Manager.set(Manager.keys.REALMS, currentLSState);
        },
        saveRealmConfig: function(configObj){
            var currentRealm =  JSON.parse(window.localStorage.realm_full);
            //var realmConfigs = Manager.get(Manager.keys.REALM_CONFIGS);
            Manager.DB.get(Manager.keys.REALM_CONFIGS, function(_realmConfigs){
                var realmConfigs = _realmConfigs === null ? [] : _realmConfigs;
                var tmpObj = {
                    id          : currentRealm.id,
                    config      : configObj,
                    isDirty     : false,
                    userId      : getUserCredentials().id,
                    realm       : getUserCredentials().realm,
                    isUpdatable : false
                };

                var result = $.grep(realmConfigs, function(e){
                    return (e.id == tmpObj.id && e.userId == getUserCredentials().id && e.realm == getUserCredentials().realm);
                });

                if(!result.length){
                    realmConfigs.push(tmpObj);
                } else {
                    $.each(realmConfigs, function() {
                        if (this.id == currentRealm.id && this.realm == getUserCredentials().realm && this.userId == getUserCredentials().id) {
                            alert('updated');
                            this.config         = configObj;
                            this.realm          = getUserCredentials().realm;
                            this.isDirty        = false;
                            this.isUpdatable    = false;
                        }
                    });
                }
                Manager.DB.set(Manager.keys.REALM_CONFIGS, realmConfigs);
            });


        },
        flagRealm: function(realm_id, isDirty, isUpdatable) {
            Manager.DB.get(Manager.keys.REALM_CONFIGS, function(_realmConfigs) {
                var realmConfigs = _realmConfigs === null ? [] : _realmConfigs;
                var currentRealm =  JSON.parse(window.localStorage.realm_full);
                var result = $.grep(realmConfigs, function(e){
                    return e.id == realm_id && e.userId == getUserCredentials().id;// && e.realm == getUserCredentials().realm;
                });
                if(result.length){
                    $.each(realmConfigs, function() {
                        if (this.id == realm_id && this.realm == getUserCredentials().realm && this.userId == getUserCredentials().id) {
                            this.isDirty        = isDirty       ? isDirty       : this.isDirty;
                            this.isUpdatable    = isUpdatable   ? isUpdatable   : this.isUpdatable;
                            if (realm_id == currentRealm.id && (this.isDirty || this.isUpdatable)){
                                alert(this.isUpdatable ? 'An update is required. Kindly access your realm' : 'You have been removed from your Workspace. Kindy contact your administrator');
                                gotoCompanySplashScreen();
                            }
                        }
                    });
                } else {
                    alert('realm doesn\'t exists '+ realm_id);
                }
                Manager.DB.set(Manager.keys.REALM_CONFIGS, realmConfigs);
            });
        },
        fetchRealmConfig: function(realm_id, _forceFetchfromServer){
            var forceFetchfromServer = _forceFetchfromServer || false;
            var txDeferred = $.Deferred();
            var currentRealm = realm_id || JSON.parse(window.localStorage.realm_full).id;
            //var realmConfigs = Manager.get(Manager.keys.REALM_CONFIGS);
            Manager.DB.get(Manager.keys.REALM_CONFIGS, function(_realmConfigs){
                var realmConfigs = _realmConfigs === null ? [] : _realmConfigs;
                if (!realmConfigs) txDeferred.reject('Invalid config returned');
                var result = $.grep(realmConfigs, function(e){
                    return e.id == currentRealm && e.userId == getUserCredentials().id && e.realm == getUserCredentials().realm;
                });
                if(forceFetchfromServer || result.length === 0){
                    $.when(fetchRemoteRealmConfig())
                        .done(function(data){
                            txDeferred.resolve(data);
                        })
                        .fail(function(error){
                            txDeferred.reject(error);
                        });
                } else {
                    if (result[0].isDirty){
                        txDeferred.reject('Sorry you are not authorised to access this hub. Kindly contact your admin');
                    } else if(result[0].isUpdatable){
                        $.when(fetchRemoteRealmConfig())
                            .done(function(data){
                                txDeferred.resolve(data);
                            })
                            .fail(function(error){
                                txDeferred.reject(error);
                            });
                    } else {
                        txDeferred.resolve(result[0].config);
                    }
                }
            });
            return txDeferred.promise();
        },

        updateRealmConfig: function(){
            // Get the current realm id,
            app.startSync();
            var currentRealm =  JSON.parse(window.localStorage.realm_full);
            $.when(fetchRemoteRealmConfig())
                .done(function(data){
                    sweetAlert("Up to date", "", "success");
                    handleLogin(currentRealm.id);
                })
                .fail(function(error){
                    sweetAlert("Oops...", "Something went wrong!", "error");
                    //showMessage(error, 'short', 'bottom');
                });
        },
        setAsDefaultRealm: function(realm_id){
            var realms =  JSON.parse(window.localStorage.realms);
            var result = $.grep(realms, function(e){
                return e.id == realm_id;
            });
            if(result.length){
                window.localStorage.realm_full = JSON.stringify(result[0]);
            }
        },
        deleteRealm: function(realm_id){
            try{
                var realms = Manager.get(Manager.keys.REALMS);
                //var realmConfigs = Manager.get(Manager.keys.REALM_CONFIGS);
                var newRealms = $.grep(realms, function(e){
                    return e.id != realm_id;
                });
                Manager.DB.get(Manager.keys.REALM_CONFIGS, function(_realmConfigs){
                    var realmConfigs = _realmConfigs === null ? [] : _realmConfigs;
                    var newRealmConfig = $.grep(realmConfigs, function(e){
                        return e.realm != realm_id;//  && e.userId != getUserCredentials().id;
                    });
                    Manager.set(Manager.keys.REALMS, newRealms);
                    Manager.DB.set(Manager.keys.REALM_CONFIGS, newRealmConfig);
                    showMessage('Deleted :(');
                    //openPrivateChannel();
                    if (getUserCredentials()){
                        alert('displaying user realms');
                        alert(JSON.stringify(getUserCredentials()));
                        Users.getLoggedInUserRealms('realm-page', getUserCredentials().id, getUserCredentials().realm);
                    } else {
                        alert('displaying saved realms');
                        privateCtlr.displaySavedRealms('realm-page');
                    }
                });

            } catch(e){
                showMessage(JSON.stringify(e));
            }
        },
        customiseLoginPage: function(){
            var realm = JSON.parse(window.localStorage.realm_full);
            if (realm.theme.icon_url) {
                $('#login_image').attr('src', realm.theme.icon_url);
            }
            $('#password').val('');
        },
        displaySavedRealms: function(element, customRealmHtml){
            var realms = Manager.get(Manager.keys.REALMS);
            var realmHtml = '';
            if (customRealmHtml){
                realmHtml = customRealmHtml;
            } else {
                for (var i = 0; i < realms.length; i++) {
                    var realm = realms[i];
                    if (realm.id == 'd9f3a9a9' && globals.hideDemopage){
                        continue;
                    }
                    var largeUrl = (realm.theme && realm.theme.icon_url) ? realm.theme.icon_url : 'img/loading.png';
                    realmHtml +=    '<div class="col-xs-6 col-sm-3 col-md-3 clickable-realm clickable-panel" id="'+realm.id+'" style="padding: 12px; margin-bottom: 6px;">'+
                                        '<div class = "row" style="height: inherit;">'+
                                            '<div class="col-xs-12 col-sm-12 col-md-12" style = "padding: 0px;">'+
                                                '<img xx ="'+realm.id+'" class="myImgSaved loadingImgSaved" src="img/loading.png" style="max-width: 100%;" />'+
                                                '<img xx ="'+realm.id+'" class="myImgSaved mainImgSaved" src="'+largeUrl+'" style="max-width: 100%;" />'+
                                            '</div>'+
                                            '<div class="col-xs-12 col-sm-12 col-md-12" style = " height:64px; max-height:64px; background-color:#404040;">'+
                                                '<span style="font-size: x-small; color: #ffffff; font-weight:400">'+realm.name+'</span>'+
                                                '<p style="font-size: xx-small; color: #D9D9D9; margin-top: 2px; word-wrap: break-word; line-height: 14px;">'+realm.description+'</p>'+
                                            '</div>'+
                                        '</div>'+
                                    '</div>';
                }
            }
            $('#team_selection_placeholder').html(realmHtml);//.trigger('refresh');
            adjustHeightsToViewport();
            $('.clickable-realm').on("tap", function(e){
                e.stopPropagation();
                var id = $(this).attr('id');
                var result = $.grep(realms, function(e){
                    return e.id == id;
                });
                events.publish('realm.opened',{
                    realm:result[0]
                });
            });
            $('.clickable-realm').on("taphold", function(e){
                e.stopPropagation();
                var id = $(this).attr('id');
                navigator.notification.confirm(
                    'All the locally stored data related to this Workspace will be deleted',
                    function(buttonIndex) {
                        if (buttonIndex == 1) {
                            privateCtlr.deleteRealm(id);
                        } else if (buttonIndex == 2) {}
                    },
                    'Delete your Workspace', ['Yes', 'Cancel'],
                    ''
                );
            });
            $('.myImgSaved').hide();
            $('.loadingImgSaved').show();
            $('.mainImgSaved').on('load', function(){
                var x = $(this).attr('xx');
                $('[xx="'+x+'"]').hide();
                $(this).show();
            });
        }
    };
}();


var SocketController = function(){
    var socket      =  null;
    var target      =  null;
    var connected   =  false;
    var subscribers =  [];
    var keys        =  {
        START           : 'start',
        SEARCH          : 'search',
        SEARCH_RESULT   : 'search_results',
        MESSAGE         : 'push_message',
        RESET           : 'reset',
        UPDATE_AVAILABLE: 'update_available'
    };
    var log = function(message){
        console.log(JSON.stringify(message));
    };
    var dispatch = function(event){
        //alert(JSON.stringify(event));
        if (event.type){
            switch (event.type){
                case keys.SEARCH_RESULT:
                    break;
                case keys.MESSAGE:
                    if (typeof event.data == 'object' && !$.isEmptyObject(event.data)){
                        DB.helpers.saveToInbox(event.data);
                    }
                    break;
                case keys.RESET:
                    if (typeof event.data == 'object' && event.data.realms){
                        resetData(event.data);
                    }
                    break;
                case keys.UPDATE_AVAILABLE:
                    if (typeof event.data == 'object' && event.data.realms){
                        privateCtlr.flagRealm(event.data.realm.id, null, event.data.realm.updatable);
                    }
                    break;
                default :
                    for (var i = 0; i < subscribers.length; i++){
                        var subscriber = subscribers[i];
                        if (event.type == subscriber.event){
                            subscriber.callback(event);
                        }
                    }
            }
        } else {
            throw new Error('No message identifier');
        }
    };
    var createRegistrationJSON = function(){
        if (!getUserCredentials()){
            return {}
        }
        return {
            "type": keys.START,
            "data": {
                "user": {
                    "id": getUserCredentials().id
                },
                "realm": {
                    "id": getUserCredentials().realm
                },
                "token": getUserCredentials().api_key,
                "device": {
                    "platform": device.platform,
                    "uuid": device.uuid
                }
            }
        };
    };
    var connect = function(){
        //alert('Connecting to '+target);
        socket = io.connect(target);

    };
    var setTarget = function(_target){
        target = _target;
    };
    var listen = function(){
        socket.on('connect',function(){
            connected = true;
            //alert('connected. Registering...');
            log('Info: WebSocket connection opened.');
            SocketController.publish(createRegistrationJSON(), 'register');
        });
        socket.on('message',function(_event){
            //var event = JSON.parse(_event);
            //alert(typeof _event);
            if(typeof _event == 'object'){
                dispatch(_event);
            } else if (typeof _event == 'string') {
                dispatch(JSON.parse(_event));
            } else {
                alert('Message isnt an object or string');
            }
        });
        socket.on('disconnect',function(event){
            //alert('You have been disconnected');
            connected  =  false;
        });
    };
    return {
        disconnect: function(){
            if (connected) {
                socket.disconnect();
                connected   = false;
            }
        },
        connect: function(){
            if (getUserCredentials() && getUserCredentials().id){
                try {
                    if (isonline()){
                        SocketController.disconnect();
                        setTarget(SOCKET_URL);
                        connect();
                        listen();
                    }
                } catch(e){
                    alert(JSON.stringify(e));
                }
            }
        },
        publish: function(message, _key){
            var key = _key || 'default';
            if (socket && socket.connected) {
                socket.emit(key, message);
            } else {
                console.log('Socket connection not established, please connect.');
            }
        },
        subscribe: function(event, callback){
            var tmp = {
                'event'     : event,
                'callback'  : callback
            };
            subscribers.push(tmp);
        }
    };
}();

var Manager = function(){
    var keys = {
        USERS:              'users',
        CREDENTIALS:        'credentials',
        REALM_CONFIGS:      'realmConfigs',
        REALMS:             'realms',
        FAVORITES:          'favorites',
        DOWNLOADED_APPLETS: 'downloadedApplets',
        FORM_CONFIG:        'form_config',
        INBOX_LISTS:        'inboxLists',
        STAT_INITIAL:       'statInitial',
        STAT_CURRENT:       'statCurrent',
        STAT_REMOTE:        'statRemote',
        STAT_CHART:         'statChart'
    };

    var init = {
        USERS:              {'value' : 'users',         'init':'[]'},
        CREDENTIALS:        {'value' : 'credentials',   'init':'{}'},
        REALM_CONFIGS:      {'value' : 'realmConfigs',  'init':'[]'},
        REALMS:             {'value' : 'realms',        'init':'[]'},
        FAVORITES:          {'value' : 'favorites',     'init':'[]'},
        DOWNLOADED_APPLETS: {'value' : 'downloadedApplets', 'init':'[]'},
        FORM_CONFIG:        {'value' : 'form_config',   'init':'[]'},
        INBOX_LISTS:        {'value' : 'inboxLists',    'init':'[]'},
        STAT_INITIAL:       {'value' : 'statInitial',    'init':'[]'},
        STAT_CURRENT:       {'value' : 'statCurrent',    'init':'[]'},
        STAT_REMOTE:        {'value' : 'statRemote',    'init':'[]'},
        STAT_CHART:         {'value' : 'statChart',    'init':'[]'}
    };

    try {
        // Initialize stuff
        for (var key in init){
            if (init.hasOwnProperty(key) /*&& key != 'CREDENTIALS'*/){
                if(!window.localStorage[init[key].value]){
                    window.localStorage[init[key].value] = init[key].init;
                }
            }
        }
    } catch (e){
        alert(JSON.stringify(e));
    }

    return {
        get : function(key, callback){
           return window.localStorage[key] ? JSON.parse(window.localStorage[key]): undefined;
        },
        set: function(key, dataObj, callback){
            localStorage.removeItem(key);
            window.localStorage[key] = JSON.stringify(dataObj);
        },
        DB: {
            get : function(key, callback){
                if (!key) throw new Error('Kindly specify a key');
                DBAdapter.get(key, function(data){
                    if (isFunction(callback)){
                        callback(data === null ? data : JSON.parse(data));
                    }
                }, function(){});
            },
            set: function(key, dataObj, callback, errorCallback){
                if (!key || !dataObj) throw new Error('Kindly specify a key or value');
                DBAdapter.set(key, JSON.stringify(dataObj), function(){
                    if (isFunction(callback)){
                        callback();
                    }
                }, errorCallback);
            }
        },
        keys: {
            USERS               : init.USERS.value,
            CREDENTIALS         : init.CREDENTIALS.value,
            REALM_CONFIGS       : init.REALM_CONFIGS.value,
            REALMS              : init.REALMS.value,
            FAVORITES           : init.FAVORITES.value,
            DOWNLOADED_APPLETS  : init.DOWNLOADED_APPLETS.value,
            FORM_CONFIG         : init.FORM_CONFIG.value,
            INBOX_LISTS         : init.INBOX_LISTS.value,
            STAT_INITIAL        : init.STAT_INITIAL.value,
            STAT_CURRENT        : init.STAT_CURRENT.value,
            STAT_REMOTE         : init.STAT_REMOTE.value,
            STAT_CHART          : init.STAT_CHART.value
        }
    };
}();

var Users =  function(){
    var currentUser = null;
    return {
        getAllLoggedInUsers: function(){
           return Manager.get('users');
        },
        updateApiKey: function(){
            var sql =   'UPDATE FORM_DATA ' +
                        'SET API_KEY = "'+getUserCredentials().api_key+'" ' +
                        'WHERE ENDPOINT = "'+getEndpoint()+'" ' +
                        'AND OWNER ="'+getUserCredentials().username+'" ' +
                        'AND STATUS = 1 '+
                        'AND ERROR  = 0';
            //alert(sql);
            $.when(initFunctions.database.execute(sql))
                .done(function(){});
        },
        saveUser: function(userCredentials){
            //alert(JSON.stringify(userCredentials));
            var currentRealmId = JSON.parse(window.localStorage.realm_full).id;
            //alert('Saving into '+currentRealmId);
            try {
                var users = Manager.get(Manager.keys.USERS);
                var userObject = {
                    name        : userCredentials.data.name,
                    api_key     : userCredentials.data.token.access_token,
                    username    : userCredentials.data.username,
                    avatar      : userCredentials.data.avatar_url ? userCredentials.data.avatar_url : 'img/unknown.jpg',
                    id          : userCredentials.data.id,
                    realm       : currentRealmId,//userCredentials.data.realm.id,
                    fullObj     : userCredentials
                };
                var result = $.grep(users, function(e){
                    return e.id == userObject.id;// && e.realm == userObject.realm;
                });
                if (result.length){
                    $.each(users, function() {
                        if (this.id == userObject.id && this.realm == userObject.realm) {
                            this.name       = userObject.name;
                            this.api_key    = userObject.api_key;
                            this.avatar     = userObject.avatar;
                            this.fullObj    = userObject.fullObj;
                        }
                    });
                } else {
                    users.push(userObject);
                }
                Manager.set(Manager.keys.USERS, users);
            } catch (e) {
                alert(JSON.stringify(e));
            }
        },
        setAsCurrentUser: function(userId, realmId){
            var users = Manager.get(Manager.keys.USERS);

            //alert(users[0].id + users[0].realm);
            var result = $.grep(users, function(e){
                return e.id == userId;// && e.realm == realmId;
            });
            if (result.length){
                Manager.set(Manager.keys.CREDENTIALS, result[0].fullObj);
                showMessage('Welcome Back '+result[0].name+'!');
                return true;
            } else {
                showMessage('This user does not exist. Please login');
                return false;
            }
        },
        getLoggedInUserRealms: function(element, userId, realmId){
            var realms          = Manager.get(Manager.keys.REALMS);
            Manager.DB.get(Manager.keys.REALM_CONFIGS, function(realmConfigs){
                var realmHtml       = '<span></span>';
                if(userId == DEMO_CREDENTIALS.userId){
                    var realmResult = $.grep(realms, function(e){
                        return e.code.trim().toLowerCase() == DEMO_CREDENTIALS.code;
                    });
                    if (realmResult.length){
                        var realm = realmResult[0];
                        alert(JSON.stringify(realm));
                        realmHtml +=    '<div class="animated fadeInUp col-xs-6 col-sm-3 col-md-3 clickable-realm clickable-panel" id="'+realm.id+'" style="padding: 12px; margin-bottom: 6px;">'+
                        '<div class = "row" style="height: inherit;">'+
                        '<div class="col-xs-12 col-sm-12 col-md-12" style = "padding: 0px;">'+
                        '<img xx ="'+realm.id+'" class="myImgSaved loadingImgSaved" src="img/loading.png" style="max-width: 100%;" />'+
                        '<img xx ="'+realm.id+'" class="myImgSaved mainImgSaved" src="'+realm.largeUrl+'" style="max-width: 100%;" />'+
                        '</div>'+
                        '<div class="col-xs-12 col-sm-12 col-md-12" style = " height:64px; max-height:64px; background-color:#404040;">'+
                        '<span style="font-size: x-small; color: #ffffff; font-weight:400">'+realm.name+'</span>'+
                        '<p style="font-size: xx-small; color: #D9D9D9; margin-top: 2px; word-wrap: break-word; line-height: 14px;">'+realm.description+'</p>'+
                        '</div>'+
                        '</div>'+
                        '</div>';
                    }
                    showMessage('You are using a Guest account. To switch accounts, click on "Switch" above', 'long');
                    privateCtlr.displaySavedRealms(element, realmHtml);
                    adjustHeightsToViewport();
                    return true;
                }

                var realmConfResult = $.grep(realmConfigs, function(e){
                    return e.userId == userId;// && e.realm == realmId;
                });
                var existingRealms = [];
                var userRealms = [];
                for (var j = 0; j < realms.length; j++){
                    var realm = realms[j];
                    for (var k = 0; k < realmConfResult.length; k++){
                        if ((realm.id == 'd9f3a9a9' || realm.id == realmConfResult[k].id) && $.inArray(realm.id, existingRealms) == -1){
                            if (realm.id == 'd9f3a9a9' && globals.hideDemopage){
                                continue;
                            }
                            existingRealms.push(realm.id);
                            var largeUrl = (realm.theme && realm.theme.icon_url) ? realm.theme.icon_url : 'img/loading.png';
                            realmHtml +=    '<div class="animated fadeInUp col-xs-6 col-sm-3 col-md-3 clickable-realm clickable-panel" id="'+realm.id+'" style="padding: 12px; margin-bottom: 6px;">'+
                            '<div class = "row" style="height: inherit;">'+
                            '<div class="col-xs-12 col-sm-12 col-md-12" style = "padding: 0px;">'+
                            '<img xx ="'+realm.id+'" class="myImgSaved loadingImgSaved" src="img/loading.png" style="max-width: 100%;" />'+
                            '<img xx ="'+realm.id+'" class="myImgSaved mainImgSaved" src="'+largeUrl+'" style="max-width: 100%;" />'+
                            '</div>'+
                            '<div class="col-xs-12 col-sm-12 col-md-12" style = " height:64px; max-height:64px; background-color:#404040;">'+
                            '<span style="font-size: x-small; color: #ffffff; font-weight:400">'+realm.name+'</span>'+
                            '<p style="font-size: xx-small; color: #D9D9D9; margin-top: 2px; word-wrap: break-word; line-height: 14px;">'+realm.description+'</p>'+
                            '</div>'+
                            '</div>'+
                            '</div>';
                        }
                    }
                }
                privateCtlr.displaySavedRealms(element, realmHtml);
                //adjustHeightsToViewport();
            }, function(e){
                alert('An error has occured. '+JSON.stringify(e));
                showMessage('An error has occured');
            });
        },
        logoutUser: function(userId, realmId){
            try{
                var users           = Manager.get(Manager.keys.USERS);
                var realmConfigs    = Manager.get(Manager.keys.REALM_CONFIGS);
                var userResult = $.grep(users, function(e){
                    return e.id != userId && e.realm != realmId;
                });
                var realmResult = $.grep(realmConfigs, function(e){
                    return e.userId != userId && e.realm != realmId;
                });
                Manager.set(Manager.keys.USERS, userResult);
                Manager.set(Manager.keys.REALM_CONFIGS, realmResult);
            } catch(e){
                alert(JSON.stringify(e));
            }
        },
        showLoggedInUsers: function(){
            var randID = str_random(10);
            try {
                var users    = Users.getAllLoggedInUsers();
                var lists   = '';
                var activeIcon = '<i class="fa fa-star" style="float: right;color: gold;"></i>';
                if (!users.length){
                    return swal("", "No users available yet", "info");
                    //showMessage('No users available yet');
                }
                for (var i = 0; i < users.length; i++){
                    var user = users[i];
                    if (user.id == DEMO_CREDENTIALS.userId){
                        continue;
                    }
                    var image = 'img/bg/'+user.name.trim().charAt(0).toUpperCase()+'.gif';
                    lists +=
                        '<div class="clickable card-header clearfix listItem" data-id="'+user.id+'" realm = "'+user.realm+'">'+
                            '<div class="user-pic pull-left">'+
                                '<img alt="Profile Image" width="33" height="33" data-src-retina="'+image+'" data-src="'+image+'" src="'+image+'">'+
                            '</div>'+
                            '<div style="margin-left: 40px">'+
                                '<h5 style="font-weight: 300; text-transform: capitalize !important;">'+user.name+' '+(getUserCredentials() && getUserCredentials().id == user.id ? activeIcon : " ")+'</h5>'+
                                '<h6 style="text-transform: capitalize !important;">Logged in: '+moment(user.fullObj.outcome.last_login.date).format('MMMM Do YYYY hh:mma')+'</h6>'+
                            '</div>'+
                        '</div>';
                }
                var fullList = '<div class="card share full-height no-margin-card" data-social="item">'+
                                    lists+
                                '</div>';
                var myModal = openModal('List Of Users', fullList);
                $('.listItem').each(function(index) {
                    $(this).click(function(e){
                    e.stopPropagation();
                    var id      = $(this).attr('data-id');
                    var realm   = $(this).attr('realm');
                    Users.setAsCurrentUser(id, realm);
                    Users.getLoggedInUserRealms('realm-page', getUserCredentials().id, getUserCredentials().realm);
                    myModal.close();
                    //$('#'+randID).modal('toggle');
                    });
                });
                /*var html = '<div class="modal fade slide-right in" id="'+randID+'" tabindex="-1" role="dialog" aria-hidden="false" style="display: block; overflow:scroll;>'+
                                '<div class="modal-dialog modal-sm">'+
                                    '<div class="modal-content-wrapper">'+
                                        '<div class="modal-content">'+
                                        '<br/>'+
                                            '<div class="container-xs-height full-height">'+
                                                '<div class="row-xs-height">'+
                                                    '<div class="modal-body col-xs-height col-middle xtext-center" style="padding: 6px;">'+
                                                        '<h5 class="" style="text-align: center"><span class="semi-bold">Select a User</span><span data-dismiss="modal" style="float:right;'+
                                                        'margin-right: 10px;"><i class="pg-close_line"></i></span></h5>'+
                                                        '<div class="card share full-height no-margin-card" data-social="item">'+
                                                            lists+
                                                        '</div>'+
                                                    '</div>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>'+
                                    '</div>'+
                                '<!-- /.modal-content -->'+
                                '</div>'+
                                '<!-- /.modal-dialog -->'+
                            '</div>';
                BODY.appends(html);
                $('#'+randID).modal();
                adjustHeightsToViewport();*/
            } catch(e){
                alert(JSON.stringify(e));
                showMessage('An error has occured.');
            }
        }
    };
}();

var showRefreshOption = function(element, placeholder, callback){
    var loadingBarHtml      = '<div class="progress progress-small"><div class="progress-bar" style="width:65%"></div></div>';
    var xloadingBarHtml      = '<div class="progress progress-small"><div class="progress-bar-indeterminate"></div></div>';
    var loadingSpinnerHtml  = '<div class="progress-circle-indeterminate"></div>';
    var refreshClass        = $(placeholder);
    var refreshElement      = $(element);
    var moveLength          = 0;
    //refreshElement.prepend('<div id=""></div>');

    refreshElement.pullToRefresh();
    refreshElement.on("move.pulltorefresh", function (evt, y){
        refreshClass.html('<div class="progress progress-small"><div class="progress-bar progress-bar-danger" style="width:'+((y*100)/20)+'%"></div></div>');
        moveLength = y;
        if(y < 20){
            //showMessage('Just a lil more.....');
        }
    });
    refreshElement.on("end.pulltorefresh", function (evt, y){
        refreshClass.html('');
        if(moveLength > 20){
            callback();
        }
        moveLength = 0;
    }); //refresh.pulltorefresh
    /*refreshElement.on("refresh.pulltorefresh", function (element, y){
        refreshClass.html('');
        if (y > 20){
            callback();
        } else {
            //showMessage('Give it one more try now, would you');
        }
    });*/


};

