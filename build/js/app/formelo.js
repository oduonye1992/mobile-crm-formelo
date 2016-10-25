/**
 * Welcome to Formelo ladies
 * @class
 * @constructor
 * @author Gov Ayo Fayose
 * @copyright Edo witches convention manual
 * @param {string} appletID - Your generated applet ID. Kindy get it at https://<name>.formelo.com/applets/<id>/edit/meta
 * @todo handle close callback not triggering after returning back to page
 *
 * **/
function Formelo(appletID, backlink, config){
    if (!appletID) throw new Error('Please specify an applet ID');
    this.mAppletID = appletID.replace(/ /g,'');
    //alert(this.mAppletID);
    this.backlink = backlink;
    this.mAppletConfig = config || null;
    this.currentIndex = 0;
    this.placeholder = null;
    this.thrownEvents = {};
    this.eventPipeline = {};
    this.rootPage = null;
    this.backStack = [];
    this.dependencies = {};
    this.mModules = {}; // Hold global modules
    this.getAppletConfig = function(appletID, callback){
        var that = this;
        if (that.mAppletConfig !== null){
            console.log('Getting conf from params passed');
            console.log(JSON.stringify(that.mAppletConfig));
            that.rootPage = that.mAppletConfig.root.trim();
            callback(that.mAppletConfig);
        } else {
            console.log('Getting conf from cache');
            $.when(initFunctions.getFormConfigByRef(appletID))
                .done(function(formConfig){
                    console.log('Gotten conf from cache');
                    that.mAppletConfig = formConfig;
                    alert(that.mAppletConfig.root);
                    that.rootPage = that.mAppletConfig.root;
                    callback(formConfig);
                })
                .fail(function(){alert('Error fetching applet config');});
        }
    };
}

Formelo.prototype.constants = {
    events : {
        ON_CREATE   : 'onCreate',
        ON_START    : 'onStart',
        ON_CLOSE    : 'onClose',
        ON_RESULT    : 'onResult'
    },
    cache : {
        SYSTEM : 'system',
        USER : 'user'
    },
    activity : {
        params : 'params'
    }
};

Formelo.prototype.close = function(){
    // TODO Burn everything
    //createDashboardPage('data_lists');
    showMessage('Goodbye...');
    bodyContainer.pagecontainer('change', '#'+this.backlink, {
        transition: "none"
    });
};

Formelo.prototype.getMode = function(){
    return APPLET_MODE;
};

Formelo.prototype.html = function() {
    var that = this;
    return {
        get : {
            header : {
                title : function(){
                    var id = that.mAppletID+'-'+that.currentIndex;
                    return $('#'+id).find('#applet-header-title')
                },
                menu : function(){
                    var id = that.mAppletID+'-'+that.currentIndex;
                    return $('#'+id).find('#applet-header-nav-btn-right');
                }
            }
        },
        theme : {
            header : {
                main : function(style){
                    var id = that.mAppletID+'-'+that.currentIndex;
                    $('#'+id).find('#applet-header-main').attr('style', style);
                },
                nav : function(style){
                    var id = that.mAppletID+'-'+that.currentIndex;
                    $('#'+id).find('.applet-header-nav-btn').attr('style', style);
                },
                title : function(style){
                    var id = that.mAppletID+'-'+that.currentIndex;
                    $('#'+id).find('#applet-header-title').attr('style', style);
                }
            }
        },
        header : function(options){
            var option = {
                title : 'My title',
                isMainActivity : true
            };
            var defaults = $.extend({}, option, options);
            var showBackUrl = '';
            var exitUrl     = '';
            var linkText    = '';
            if (defaults.isMainActivity) {
                //exitUrl = 'onclick = "createDashboardPage(\'data_lists\')"';
                exitUrl = 'onclick = "formelo.close(\''+that.mAppletID+'\')"';
                linkText = 'Exit';
            } else {
                //showBackUrl = 'data-rel="back"';
                showBackUrl = 'onclick="return formelo.navigation().back();"';
                linkText = 'Back';
            }
            var backHtml = '<a '+showBackUrl+' '+exitUrl+' class="ui-btn ui-btn-left header-link applet-header-nav-btn"><i class="pg-arrow_left_line_alt"></i> ' +linkText+ '</a>';
            var holderHtml = '<a id="applet-header-nav-btn-right" class="ui-btn ui-btn-right header-link applet-header-nav-btn"></a>';
            var html =  '<div id="applet-header-main" data-role="header" data-position="fixed" data-tap-toggle="false" class="blue-gradient">'+
                '<h1 class="wow fadeIn" style="text-align:center" id="applet-header-title">'+defaults.title+'</h1>'+
                backHtml +
                holderHtml+
                '</div>';
            return html;
        },
        body : function(options){
            var option = {
                layout : 'My title'
            };
            var defaults = $.extend({}, option, options);
            var html = '<div xid="applet-main" role="main">'+defaults.layout+'</div>';
            return html;
        },
        footer : function(options){}
    }
};

Formelo.prototype.buildPages = function(){
    var obj = {};
    if (this.mAppletConfig && this.mAppletConfig.pages &&
        this.mAppletConfig.pages.length){
        this.mAppletConfig.pages.forEach(function(item){
            obj[item.key] = item;
        });
    }
    this.mAppletConfig.pages = obj;
};

Formelo.prototype.start = function(){
    /** Create Placeholder to hold out event throwing and catching */
    var id = str_random(10);
    $('.applet-holder').remove();
    $('.applet-pages').remove();
    this.thrownEvents = {};
    var placeholderHtml = '<div class="applet-holder" id="'+id+'"></div>';
    $('body').append(placeholderHtml);
    this.placeholder = document.getElementById(id);
    /** Get the form config, */
    var that = this;
    this.getAppletConfig(this.mAppletID, function(){
            // Pages were objects before but was reverted to array. Don't wanna change much to i'll turn it to objects
            that.buildPages();
            if (that.mAppletConfig && that.mAppletConfig.pages){
                console.log(that.mAppletConfig);
                that.currentIndex = that.rootPage;
                that.runProvider();
                console.log('Loaded providers');
                that.runDependencies();
                console.log('Loaded dependencies');
                console.log('Root page is '+that.rootPage);
                if (!that.rootPage || that.rootPage == ""){
                    throw new Error('No root page');
                }
                that.runCode(that.rootPage);
                console.log('Loaded code');
                that.createPage(that.rootPage);
                console.log('Created page');
                that.runCss(that.rootPage);
                console.log('Loaded CSS');
            } else {
                alert('Invalid config '+JSON.stringify(that.mAppletConfig));
            }
    });
};

/**
 * @description - Run the code attached to a page if any.
 * @param index
 * @param params
 */
Formelo.prototype.runCode = function(index,params){
    if (this.mAppletConfig.pages[index].events && this.mAppletConfig.pages[index].events.ready){
        var code = this.mAppletConfig.pages[index].events.ready;
        if (code){
            eval(code);
            // TODO Emit custom events
            if (params){
                var paramsEvent = new CustomEvent(this.constants.activity.params+'-'+index, {detail : params});
                this.placeholder.dispatchEvent(paramsEvent);
            }
        }
    }
};

Formelo.prototype.runDependencies = function(){
    if (!this.mAppletConfig.imports || !this.mAppletConfig.imports.js){
        console.error('Imports is not defined');
        return false;
    }
    var jsDependencies =  this.mAppletConfig.imports.js;
    var cssDependencies =  this.mAppletConfig.imports.css;
    var script = '', style = '';
    if (jsDependencies) {
        console.log(jsDependencies);
        for (var key in jsDependencies) {
            if (jsDependencies[key]){
                script += '<script class="applet-dependencies" type="text/javascript">'+jsDependencies[key].data+'</script>';
            }
        }
        BODY.append(script);
    }
    if (cssDependencies) {
        for (var key in cssDependencies) {
            if (cssDependencies[key]){
                style += '<style class="applet-dependencies">' + cssDependencies[key].data + '</style>';
            }
        }
        BODY.append(style);
    }
};

Formelo.prototype.runProvider = function(){
    if(!this.mAppletConfig.exports || !this.mAppletConfig.exports.js){
        return 'No Provide array';
    }
    var exports = this.mAppletConfig.exports.js;
    console.log(exports);
    for (var key in exports) {
        if (exports[key]) {
            if (!this.mModules[key]){
                eval(exports[key].data);
            }
        }
    }
};

Formelo.prototype.runCss = function(index){
    var css = this.mAppletConfig.pages[index].css;
    if (css){
        var id = this.mAppletID+'-'+index+'-style';
        function addStyleString(str){
            $('#'+id).remove();
            var node = document.createElement('style');
            node.setAttribute("id", id);
            node.setAttribute("class", "applet-loaded-stylesheets");
            node.innerHTML = str;
            document.body.appendChild(node);
        }
        addStyleString(css);
    }
};

Formelo.prototype.createPage = function(index, _options){
    var id = this.mAppletID+'-'+index;
    var options = _options || {};
    options['isMainActivity'] = this.currentIndex === this.rootPage;
    options['title'] = this.mAppletConfig.pages[index].name;
    var layout = this.mAppletConfig.pages[index].layout;
    var html = //'<div class="applet-pages applet-'+this.mAppletID+'" data-role="page" id = "'+id+'">'+
        this.html().header(options) +
        this.html().body({layout : layout});
    //'</div>';
    if (!$('#'+id).length){
        BODY.appends('<div class="applet-pages applet-'+this.mAppletID+'" data-role="page" id = "'+id+'"><div>');
    }
    bodyContainer.pagecontainer('change', '#'+id, {
        transition: "none"
    });
    $('#'+id).html(html).trigger('create');
    var onCreateEvent = new Event(this.constants.events.ON_CREATE+'-'+this.currentIndex);
    this.backStack.push(this.currentIndex);
    this.placeholder.dispatchEvent(onCreateEvent);
};

Formelo.prototype.show = function(_title, _body){
    var title               = _title || 'Untitled';
    var body                = _body  || '';
    var previewMain         = $('#preview-main');
    var previewTitle        = $('#preview-title');
    previewMain.html(body);
    previewTitle.html(title);
    var onStartEvent = new Event(this.constants.events.ON_START);
    document.dispatchEvent(onStartEvent);
    bodyContainer.pagecontainer('change', '#preview', {
        transition: "none"
    });
    var onCreateEvent = new Event(this.constants.events.ON_CREATE);
    document.dispatchEvent(onCreateEvent);
    $('#preview-close').click(function(){
        previewMain.html('');
        $('.applet-dependencies').remove();
        $.mobile.back();
        var onCloseEvent = new Event(this.constants.ON_CLOSE);
        document.dispatchEvent(onCloseEvent);
    });
};

Formelo.prototype.on = function(key, callback){
    document.addEventListener(key, callback);
    return true;
};

Formelo.prototype.off = function(key){
    document.removeEventListener(key);
    alert('removed '+key);
};

/**
 * @description - Bridge into native controls
 * @type {{getAudio: Function, getImage: Function, getLocation: Function, getSignature: Function, getFingerprint: Function}}
 */
Formelo.prototype.hooks = {
    /**
     * @exmaple formelo.hooks.getAudio();
     * @param successCallBack
     * @param errorCallBack
     */
    getAudio : function(successCallBack, errorCallBack){
    },
    getImage : function(successCallBack, errorCallBack){
        var selectImage = function(type, successCB, errorCB){
            navigator.camera.getPicture(function(imageData) {
                var data = 'data:image/jpg;base64,' + imageData;
                successCB(data);
            }, errorCB, {
                quality: 50,
                destinationType : navigator.camera.DestinationType.DATA_URL,
                sourceType: type,
                encodingType: navigator.camera.EncodingType.JPEG,
                allowEdit : true,
                targetWidth: 500,
                correctOrientation: true
            })
        };
        navigator.notification.confirm(
            'Select an Image source', // message
            function(buttonIndex) {
                if (buttonIndex == 1) {
                    selectImage(navigator.camera.PictureSourceType.CAMERA, successCallBack, errorCallBack);
                } else if (buttonIndex == 2){
                    selectImage(navigator.camera.PictureSourceType.PHOTOLIBRARY, successCallBack, errorCallBack);
                } else {

                }
            },
            'Photo', ['Take Photo', 'Choose Photo', 'Cancel'],
            'Photo'
        );

    },
    getLocation : function(successCallBack, errorCallBack){
        var option = {
            maximumAge: 0,
            timeout: 6000,
            enableHighAccuracy: true
        };
        navigator.geolocation.getCurrentPosition(successCallBack, errorCallBack, option);
    },
    getSignature : function(successCallBack, errorCallBack){

    },
    getFingerprint : function(successCallBack, errorCallBack){

    }
};

Formelo.prototype.profile = function(){
    var profile = new Profile();
    var that = this;
    return {
        getProfile : function(successCallback, errorCallback){
            profile.getUserDetails(that.mAppletConfig.name, successCallback,errorCallback);
        },
        deductPoint : function(number){

        },
        addPoint : function(number){

        }
    };
};

/**
 * @constructor
 * @type {{EmptyLayout: Function, spinner: Function, ListAdapter: Function, GridAdapter: Function, Notification: {Toast: Function, Modal: Function}}}
 */
Formelo.prototype.ui = function(){
    var that = this;
    return {
        /**
         *
         */
        actionBars : function(items, callback){
            var showSingleAction = function(that){
                var id = formelo.mAppletID+'-'+formelo.currentIndex;
                $('#'+id).find('#applet-header-nav-btn-right').html(items[0].name).click(function(){
                    callback(items[0].unique);
                });
            };
            var showMultipleActions = function(that, items, callback){
                var id = that.mAppletID+'-'+that.currentIndex;
                $('#'+id).find('#applet-header-nav-btn-right').html('More').click(function(){
                    var actionPlaceholder = id+'-actionbar';
                    var placeholder = '<div id="'+id+'-actionbar"></div>';
                    var mod = that.ui().modal('Options', placeholder);
                    that.ui().optionsAdapter(items, '#'+actionPlaceholder).attach(function(unique){
                        mod.close();
                        callback('unique');
                    });
                });
            };
            if (items && items.length){
                if (items.length == 1){
                    showSingleAction(that, items, callback);
                } else {
                    showMultipleActions(that, items, callback);
                }
            } else {
                alert('Action bars needs records to survive');
            }
        },
        emptyLayout : function(id){

        },
        /**
         * @example formelo.ui().footer(data, function(unique){})
         * @param data
         * @param callback
         * @returns {boolean}
         */
        footer : function(data, callback){
            if (!data || !data.length){
                throw new Error('Footer array is empty');
            }
            var defaults = {
                'icon' : 'fa fa-heart',
                'text' : 'placeholder',
                'link' : null,
                'active' :  false,
                'unique' : null
            };
            var id = that.mAppletID+'-'+that.currentIndex;
            var html = '<div style="height: 40px !important; max-height: 40px !important;" data-position ="fixed" data-tap-toggle="false" data-hide-during-focus="false" data-role="footer" data-position-fixed="true">'+
                '<div style="height: inherit; margin-top: -4px" data-role="navbar">'+
                '<ul>';
            data.forEach(function(item){
                var newDefault = $.extend({}, defaults, item);
                html += '<li>'+
                    '<a class="applet-footer-items" unique-id="'+item.unique+'" style="margin-top: -4%; /*border:none !important; /*background-color: #34495E !important;*/">'+
                    '<span class="footer-icon '+(newDefault.active ? 'footer-active' : 'footer-not-active')+' " xstyle="color:'+(newDefault.active ? '#EB5055' : 'white')+'"><i class="'+newDefault.icon+'"></i></span>'+
                    '<p class="footer_p '+(newDefault.active ? 'footer-active' : 'footer-not-active')+'" style="margin-top: -4px; /*color:'+(newDefault.active ? '#EB5055' : 'white')+' !important; */">'+newDefault.text+'</p>'+
                    '</a>'+
                    '</li>';
            });
            html += '</ul></div></div>';
            var placeholder = '#'+id;
            $(placeholder).appends(html);
            BODY.trigger('create');
            $(placeholder+' .applet-footer-items').click(function(){
                var unique = $(this).attr('unique-id');
                if (unique && callback){
                    callback(unique);
                }
            });
        },
        bareList : function(data, placeHolder, callback) {
            var defaults = {
                'icon' : '',
                'text' : '',
                'colour' :  '#2980b9',
                'unique' : null
            };
            if (!data || !data.length){
                return false;
            }
            var html = '';
            var i = 1;
            data.forEach(function(item){
                var newDefault = $.extend({}, defaults, item);
                html += '<div unique="'+item.unique+'" class="row holder-clickable-item" style="height: 20vh;background-color: '+newDefault.colour+';">'+
                    '<div class="col-xs-2" style="">'+
                    '<p style="margin-top: 40%; color: white;font-weight: 400; text-align: center;">'+i+'</p>'+
                    '</div>'+
                    '<div class="col-xs-10">'+
                    '<p style="font-size: x-large ;font-weight: 400;color: white;text-align: center;line-height: 20vh;margin-left: -20%;">'+newDefault.text+'</p>'+
                    '</div>'+
                    '</div>';
                i++;
            });
            $(placeHolder).html(html);
            $('.holder-clickable-item').click(function(){
                callback($(this).attr('unique'));
            });
        },
        spinner: function() {
            return {
                start : function(){

                },
                stop : function(){

                }
            };
        },
        /**
         * Creates a list for you, setting the click listeners and other cool stuffs
         * @param {array} items - An array of items to
         * @param {string} placeholder - Ususlly the ID od class of an empty div
         * @access {public}
         * @example new formelo().ui().listAdapter(arrays, '#placeholder').attach(function(callback){});
         * @todo Add custom mapping and interactions
         * **/
        listAdapter : function(items, placeholder){
            if (!items) throw new Error('Item not specified'); // I am going home now
            var html = '<div class="card share full-height no-margin-card" data-social="item">';
            var identifier = str_random(20);
            items.forEach(function(item){
                /**
                 * @type {{name: string, description: string, time: string, image: string, unique: string}}
                 * @example {{name: string, description: string, time: string, image: string, unique: string}}
                 */
                var defaults = {
                    name : '',
                    description : '',
                    time : '',
                    image : '',
                    unique: ''
                };
                var defaultItem = $.extend({}, defaults, item);
                html += '<div class="card-header clearfix '+identifier+'" unique = "'+defaultItem.unique+'">' +
                    '<div class="user-pic pull-left">' +
                    '<img alt="Profile Image" width="33" height="33" data-src-retina="' + defaultItem.image + '" data-src="' + defaultItem.image + '" src="' + defaultItem.image + '">' +
                    '</div>' +
                    '<h6 style="float: right; font-size: xx-small; display: inline;">' + defaultItem.time + '</h6>' +
                    '<div style="margin-left: 40px">' +
                    '<h5 style="font-weight: 300;">' + defaultItem.name + '</h5>' +
                    '<h6>' + defaultItem.description + '</h6>' +
                    '</div>' +
                    '</div>';
            });
            html += '</div>';
            return {
                /**
                 *
                 * @param callback
                 * @callback callback - Called when a list item has been clicked.
                 */
                attach : function(callback){
                    $(placeholder).html(html);
                    $(placeholder).find('.'+identifier).click(function(){
                        var unique = $(this).attr('unique');
                        if (unique){
                            if (callback){
                                callback(unique);
                            }
                        }
                    });
                }
            };
        },
        gridAdapter : function(items, placeholder){
            if (!items) throw new Error('Item not specified');
            var html = '';
            var identifier = str_random(20);
            var i = 0;
            items.forEach(function(item){
                var defaults = {
                    name : '',
                    description : '',
                    time : '',
                    image : '',
                    unique: ''
                };
                var defaultItem = $.extend({}, defaults, item);
                html += '<div class="col-xs-6 col-sm-3 col-md-3 applet-list-item '+identifier+' clickable-panel" unique="'+defaultItem.unique+'" style="padding: 12px; margin-bottom: 6px;">' +
                    '<div class = "row" style="height: inherit;">' +
                    '<div class="col-xs-12 col-sm-12 col-md-12" style = "padding: 0px;">' +
                    '<img aaa ="' + i + '" class="qmyImg qloadingImg" src="img/loading.png" style="max-width: 100%;" />' +
                    '<img xxx ="' + i + '" class="qmyImg qmainImg" src="' + defaultItem.image + '" style="max-width: 100%;" />' +
                    '</div>' +
                    '<div class="col-xs-12 col-sm-12 col-md-12" style = " height:64px; max-height:64px; background-color:white;">' +
                    '<span style="font-size: x-small; color: #2c3e50; font-weight:400">' + defaultItem.name + '</span>' +
                    '<p style="font-size: xx-small; color: grey; margin-top: 2px; word-wrap: break-word; line-height: 14px;">' + defaultItem.description + '</p>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
                i++;
            });
            return {
                attach : function(callback){
                    $(placeholder).html(html);
                    $(placeholder).find('.qmyImg').hide();
                    $(placeholder).find('.qloadingImg').show();
                    $(placeholder).find('.qmainImg').on('load', function () {
                        var x = $(this).attr('xxx');
                        $(placeholder).find('[aaa="'+x+'"]').hide();
                        $(this).show();
                    });
                    $(placeholder).find('.'+identifier).click(function(){
                        var unique = $(this).attr('unique');
                        if (unique){
                            if (callback){
                                callback(unique);
                            }
                        }
                    });
                }
            };
        },
        optionsAdapter : function (items, placeholder) {
            if (!items) throw new Error('Item not specified.'); // I am going home now
            var html = '<div class="row">';
            var identifier = str_random(20);
            items.forEach(function (item) {
                var defaults = {
                    name: '',
                    description: '',
                    time: '',
                    image: '',
                    unique: ''
                };
                var defaultItem = $.extend({}, defaults, item);
                html +=    '<div class="col-xs-4 ' + identifier + '" unique = "' + defaultItem.unique + '" style="text-align: center;">'+
                    '<img class = "donkeyCache" donkey-id="'+defaultItem.image+'" data-src-retina="' + defaultItem.image + '" data-src="' + defaultItem.image + '" src="' + defaultItem.image + '" style="width: 100%;border-radius: 50%; width: 50px;">'+
                    '<p style="text-align: center; font-weight: 400; color: #2c3e50; font-size: small;">' + defaultItem.name + '</p>'+
                    '</div>';
            });
            html += '</div>';
            return {
                attach: function (callback) {
                    $(placeholder).html(html);
                    //DonkeyCache.grab();
                    $(placeholder).find('.' + identifier).click(function () {
                        var unique = $(this).attr('unique');
                        if (unique) {
                            if (callback) {
                                callback(unique);
                            }
                        }
                    });
                }
            };
        },
        notification : {
            /**
             * @example formelo.ui().notification.Toast(message)
             * @param message
             * @constructor
             */
            toast : function(message){
                showMessage(message);
            }
        },
        /**
         *  @example formelo.ui().sidemenu(data, function(itemClicked){})
         *  @example var data = [{ unique : 'aa',
                                        text : 'Name',
                                        icon : 'fa fa-edit'}]
         * @param _data
         * @param callback
         * @param options
         */
        sidemenu : function(_data, callback, options){
            var data = _data || [];
            var subList = '';
            var defaults = {
                unique : 'aa',
                text : 'Name',
                icon : 'fa fa-edit'
            };
            var placeholder = that.mAppletID+'-'+that.currentIndex;
            data.forEach(function(item){
                var newDefaults = $.extend({}, defaults, item);
                subList += '<li unique-id="'+newDefaults.unique+'" class="'+placeholder+'-panel-item"><br/><a data-ajax="false" class="panel-black-bg" style="font-size: large;"><i class="'+newDefaults.icon+'" style="color:#F7CA18;"></i> &nbsp;&nbsp;'+newDefaults.text+'</a></li>';
            });
            var id = that.mAppletID+'-'+that.currentIndex+'-panel';
            var html = '<div class = "main-panel panel-black-bg" data-role="panel" id="'+id+'" data-display="overlay" data-position-fixed="true" data-position="right">';
            html += '<ul data-role="listview" data-inset="false" data-icon="false">';
            html += subList;
            html += '</ul>';
            html += '</div>';
            $('#'+placeholder).appends(html).trigger('refresh');
            $('.'+placeholder+'-panel-item').click(function(){
                var unique = $(this).attr('unique-id');
                if (unique){
                    callback(unique);
                }
            });
            $('#'+id).panel();
            var defOptions = {
                showHamburgerMenu :  true
            };
            var def = $.extend({}, defOptions, options);
            if (def.showHamburgerMenu){
                var nav = that.html().get.header.menu();
                nav.html('<i class="fa fa-bars"></i>').attr('href', '#'+id);
            }
            return $('#'+id);
        },
        modal : function(title, body, type){
            return openModal(title, body, type);
        },
        spinner : {
            show : function(title, message){
                customFunctions.displayNotificationDialog(title, message);
            },
            hide : function(){
                customFunctions.closeNotificationDialog();
            }
        },
        /**
         * @example showNativeOptions('Title', 'Are you sure you want this', ['yes', 'no', 'cancel'], function(index){
         *              showMessage("Hello"+index);
         *          });
         * @param _title
         * @param _message
         * @param _items
         * @param _callback
         */
        showNativeOptions : function (_title, _message, _items, _callback){
            var title   = _title || '';
            var message = _message || '';
            var items = _items || [];
            var callback = _callback || function(){};
            navigator.notification.confirm(
                message,
                callback,
                title, items,
                ''
            );
        }
    }
};

/**
 * @returns {{get: Function, set: Function}}
 * @constructor
 * @description Applets can save system items or user specific items
 */
Formelo.prototype.cache = function(){
    if (typeof(localStorage) === "undefined") {
        throw new Error('Storage not allowed on this device');
    }
    var appletId = this.mAppletID;
    var getKey = function(key){
        return this.mAppletID+'-'+key;
    };
    return {
        get : function(key){
            if (!key) throw new Error('Key not specified');
            try {
                return localStorage[getKey(key)];
            } catch(e){
                return false;
            }
        },
        set : function(key, item){
            if (!key) throw new Error('Key not specified');
            try {
                localStorage[getKey(key)] = item;
                return true;
            } catch(e){
                return false;
            }
        },
        remove : function(key){
            if (!key) throw new Error('Key not specified');
            try {
                localStorage.removeItem(getKey(key));
                return true;
            } catch(e){
                return false;
            }
        }
    };
};

Formelo.prototype.event = function(){
    var that = this;
    return {
        on: function(key, callback){
            if(key){
                var item = key+'-'+that.mAppletID;
                if (!that.thrownEvents[item]){
                    that.placeholder.addEventListener(item, callback);
                    that.thrownEvents[item] = callback;
                }
            }
        },
        dispatch: function(key){
            if(key){
                var item = key+'-'+that.mAppletID;
                var onEvent = new Event(item);
                that.placeholder.dispatchEvent(onEvent);
            }
        },
        onCreate : function(callback){
            var item = that.constants.events.ON_CREATE+'-'+that.currentIndex;
            if (!that.thrownEvents[item]){
                that.placeholder.addEventListener(item, callback);
                that.thrownEvents[item] = callback;
            }
        },
        onResult : function(callback){
            var item = that.constants.events.ON_RESULT+'-'+that.currentIndex;
            if (!that.thrownEvents[item]){
                that.placeholder.addEventListener(item, callback);
                that.thrownEvents[item] = callback;
            }
        },
        onIntent: function(callback){
            var item = that.constants.activity.params+'-'+that.currentIndex;
            if (!that.thrownEvents[item]){
                that.placeholder.addEventListener(item, callback);
                that.thrownEvents[item] = callback;
            }
        },
        onClose : function(callback){
            var item = that.constants.events.ON_CLOSE+'-'+that.currentIndex;
            if (!that.thrownEvents[item]){
                that.placeholder.addEventListener(item, callback);
                that.thrownEvents[item] = callback;
            }
        },
        networkStatus : function(){

        },
        locationChange : function(){

        }
    };
};

/**
 * @description - Keep a service running at the background
 * @returns {{start: Function, stop: Function}}
 * @constructor
 */
Formelo.prototype.services = function(){
    return {
        start : function(){

        },
        stop : function(){

        }
    };
};

/**
 * @description Store larger files here... Uses the File Manager
 * @returns {{get: Function, set: Function}}
 */
Formelo.prototype.storage = function(){
    var appletId = this.mAppletID;
    var getKey = function(key){
        return this.mAppletID+'-'+key;
    };
    return {
        get : function(key, _successCB, _errorCB){
            if (!key) throw new Error('Key not specified');
            var successCB = _successCB || function(){};
            var errorCB = _errorCB || function(){};
            try {
                DBAdapter.get(getKey(key), successCB, errorCB);
            } catch(e){
                return false;
            }
        },
        set : function(key, item, _successCB, _errorCB){
            if (!key) throw new Error('Key not specified');
            var successCB = _successCB || function(){};
            var errorCB = _errorCB || function(){};
            try {
                DBAdapter.set(getKey(key), item, successCB, errorCB);
                return true;
            } catch(e){
                return false;
            }
        }
    };
};

Formelo.prototype.navigation = function(){
    var that = this;
    return {
        /**
         * @param index -
         * @param values - List of values to be passed when the view is shown
         * @example openActivity(3, {adas:daa});
         */
        openActivity : function(index, paramsObj){
            that.currentIndex = index;
            that.runCode(index, paramsObj);
            that.runCss(index);
            that.createPage(index, {IsMainActivity: index === 0});
        },
        result : function(param){
            // Go back and call the in
            this.back();
            var paramsEvent = new CustomEvent(that.constants.events.ON_RESULT+'-'+that.currentIndex, {detail : param});
            that.placeholder.dispatchEvent(paramsEvent);
        },
        stopPropagation: function(){
            that.eventPipeline[that.currentIndex] = true;
        },
        back : function(){
            var onCreateEvent = new Event(that.constants.events.ON_CLOSE+'-'+that.currentIndex);
            that.eventPipeline[that.currentIndex] = false;
            that.placeholder.dispatchEvent(onCreateEvent);
            if (!that.eventPipeline[that.currentIndex]){
                $.mobile.back();
                that.backStack.pop();
                that.currentIndex = that.backStack[that.backStack.length - 1];
            }
        },
        openBrowser : function(link){
            cordova.InAppBrowser.open(link, '_blank', 'location=yes');
        }
    };
};

/**
 * @returns {{run: Function}}
 * @constructor - Multi threading possible using Parallel.js
 */
Formelo.prototype.thread = function(){
    return {
        /**
         * @description - Runs the code in the background
         * @return
         * @param code
         * @param callback
         */
        run : function(code, callback){

        }
    };
};

Formelo.prototype.helpers = {
    exists : function(test, type) {
        if (typeof type !== 'undefined') {
            if ((typeof test !== 'undefined' && test !== '') && typeof test === type) return true;
        } else {
            if (typeof test !== 'undefined' && test !== '') return true;
        }
        return false;
    },
    base64ToFile: function(b64Data, sliceSize){
        var matches = b64Data.match(/^data\:(.+);base64,(.+)$/);
        b64Data = matches[2];
        var contentType = matches[1];// contentType || '';
        sliceSize = sliceSize || 512;
        var byteCharacters = atob(b64Data);
        var byteArrays = [];
        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }
};

Formelo.prototype.network = {
    ajax : function(type, url, callback, data){
        if (!this.exists(type) || !this.exists(url) || !this.exists(callback)) {
            console.log('[Formelo] type, url and callback parameters are necessary.');
            return false;
        }
        if (!FacebookInAppBrowser.exists(callback, 'function')) {
            console.log('[Formelo] callback must be a function.');
            return false;
        }

        var request = new XMLHttpRequest();
        request.open(type, url, true);
        if (data) {
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            request.setRequestHeader("Content-length", data.length);
            request.setRequestHeader("Connection", "close");
        }
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status == 200 || request.status === 0) {
                    var data = request.responseText;
                    if (data) {
                        callback(data);
                    } else {
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            }
        };
        if (data) {
            request.send(data);
        } else {
            request.send();
        }
    }
};

/**
 * @description expose global code and variables that can be shared across multiple pages
 * @added 2016-07-25
 * @type {{require: Function, global: Function}}
 */
Formelo.prototype.exports = function(key, value){
    if (key && value){
        this.mModules[key] = value;
    } else {
        throw new Error('Please pass in a key and value.');
    }
};
Formelo.prototype.require = function(key){
    if (key && this.mModules[key]){
        return this.mModules[key];
    } else {
        var exports = this.mAppletConfig.exports.js;
        console.log(exports);
        if (exports[key]){
            eval(exports[key].data);
            console.log(key + ' has been "evaled"');
            console.log(JSON.stringify(this.mModules));//
            console.log("Done loading");
            return this.mModules[key];
        } else {
            throw new Error('Item could not be found.. '+key);
        }
    }
};

Formelo.prototype.uses = function(name){
    var load = this.dependencies[name];
    load();
};

/**
 * Handle each applets dependencies and loads them on demand
 * @returns {{}}
 * @deprecated
 */
Formelo.prototype.dependencies =  function(){
    var loadJs = function(link){
        var tx = $.Deferred();
        var firstScript = document.getElementsByTagName('script')[0],
            js = document.createElement('script');
        js.src = link;
        js.onload = function () {
            tx.resolve();
        };
        firstScript.parentNode.insertBefore(js, firstScript);
        return tx.promise();
    };
    return {
        loadScript : function(link){
            var tx = $.Deferred();
            if (link){
                $.when(loadJs(link))
                    .done(function(){
                        tx.resolve();
                    })
            } else {
                tx.reject('No link specified.');
            }
            return tx.promise();
        }
    }
};































/**
 *
 * @see https://github.com/caiovaccaro/phonegap.facebook.inappbrowser
 * @constructor
 */
function Profile(){
    this.mGetDetails = function(){};
    this.mIsLoggedIn = function(){};
    var profile_key = "current_profile";
    this.mCredentials = {
        'facebook' : {
            'appID' : '1563873380572900',
            'redirectUrl' : 'https://formelo.com/',
            'permissions' : ''
        },
        'twitter' : {}
    };
    this.login = function(mode, successCallback, errorCallback){
        if (mode == 'facebook'){
            showMessage('Please wait... Contacting Facebook', 'long');
            FacebookInAppBrowser.settings.appId = this.mCredentials.facebook.appID;
            FacebookInAppBrowser.settings.redirectUrl = this.mCredentials.facebook.redirectUrl;
            FacebookInAppBrowser.settings.permissions = this.mCredentials.facebook.permissions;
            FacebookInAppBrowser.settings.timeoutDuration = 20000;
            FacebookInAppBrowser.login({
                send: function(){},
                success: function(access_token) {/*alert('done, access token: ' + access_token);*/},
                denied: function() {errorCallback('user denied');},
                timeout: function(){errorCallback('a timeout has occurred, probably a bad internet connection');},
                userInfo: function(userInfo) {
                    if(userInfo) {
                        successCallback(userInfo);
                    } else {
                        errorCallback('No user Info');
                        //alert('no user info');
                    }
                }
            });
        }
    };
}
Profile.prototype.getUserDetails = function(appletID, successCallback, errorCallback){
    if (APPLET_MODE == "private") {
        return successCallback(getUserCredentials());
    }
    if (!appletID || !successCallback || !errorCallback) throw new Error ('Bad arguments passed');
    if (!isFunction(successCallback) || !isFunction(errorCallback)) throw new Error ('Success or error arguments passed not a function');
    var that = this;
    function remoteLogin (successCB, errorCB) {
        navigator.notification.confirm(
            appletID+' wants to get your details', // message
            function(buttonIndex) {
                if (buttonIndex == 1) {
                    that.login('facebook', function(data){
                        Manager.set(that.profile_key, data);
                        successCB(data);
                    }, errorCB);
                } else if (buttonIndex == 2){
                    showMessage('Twitter is currently unavailable');
                } else {
                    errorCB('Declined');
                }
            },
            'Sign In', ['Facebook', 'Twitter', 'Cancel'],
            'Sign In'
        );
    }
    var detectLoggedInUser = function (){
        var aa = Manager.get(that.profile_key);
        alert('aa = '+JSON.stringify(aa));
        if (aa){
            navigator.notification.confirm(
                'Continue as this user',
                function(buttonIndex) {
                    if (buttonIndex == 1) {
                        successCallback(aa);
                    } else if (buttonIndex == 2){
                        // clear the [Facebook Plugin] uid code
                        localStorage.removeItem('uid');
                        remoteLogin(successCallback, errorCallback);
                    } else {
                        errorCallback('Declined');
                    }
                },
                aa.name, ['Yes', 'Switch User', 'Cancel'],
                aa.name
            );
        } else {
            remoteLogin(successCallback, errorCallback);
        }
    }();
};

