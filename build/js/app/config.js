var globals  =  function(){
    var configDefaults = {
        "default": {
            hidePublicRealm : false,
            hideCreateRealm : false,
            hidePrivateRealm : false,
            publicRealmEndpoint : 'hub',
            showExplorePage : true,
            hideDemoPage : false,
            defaultRealm : null,
            enableLogout: true,
            showAuthentication: false,
            enablePublicDefaultUser: false,
            showTransluscentBackgroundOnHomepageText: false,
            enablePublicDetailView: true,
            enableLibraryDetailView: false,
            id: 'default',
            text: {
                private_realm_button: 'Open a Workspace',
                public_realm_button: 'Discover Applets'
            },
            images: {
                favicon: 'img/default/icon.png',
                logo_small: 'img/default/logo_darkbg.png',
                private_realm_icon: 'img/default/splash/btn-workspace.jpg',
                public_realm_icon: 'img/default/splash/btn-utility.jpg',
                backgrounds: {
                    morning: 'img/default/splash/splash_morning.jpg',
                    afternoon: 'img/default/splash/splash_afternoon.jpg',
                    night: 'img/default/splash/splash_evening.jpg',
                    default: 'img/default/splash/splash_intro.jpg'
                }
            }
        },
        "smartinspector": {
            hidePublicRealm         : true,
            hidePrivateRealm        : false,
            publicRealmEndpoint     : 'hub',
            hideCreateRealm         : true,
            showExplorePage         : false,
            hideDemoPage            : true,
            defaultRealm            : 'smartinspector',
            enableLogout            : false,
            showAuthentication      : true,
            enablePublicDefaultUser : false,
            showTransluscentBackgroundOnHomepageText: true,
            enablePublicDetailView  : true,
            enableLibraryDetailView: false,
            id: 'smartinspector',
            text: {
                private_realm_button: 'Get Started',
                public_realm_button: 'Discover Applets'
            },
            images: {
                favicon: 'img/smartinspector/icon.png',
                logo_small: 'img/smartinspector/logo_darkbg.png',
                private_realm_icon: 'img/smartinspector/splash/btn-workspace.jpg',
                public_realm_icon: 'img/ntel/smartinspector/btn-workspace.jpg',
                backgrounds: {
                    morning: 'img/smartinspector/splash/splash_morning.jpg',
                    afternoon: 'img/smartinspector/splash/splash_afternoon.jpg',
                    night: 'img/smartinspector/splash/splash_evening.jpg',
                    default: 'img/smartinspector/splash/splash_intro.jpg'
                }
            }
        },
        "ntel": {
            hidePublicRealm : false,
            hidePrivateRealm : true,
            publicRealmEndpoint : 'ntel',
            hideCreateRealm : true,
            showExplorePage : false,
            hideDemoPage : true,
            defaultRealm : 'ntel',
            enableLogout: false,
            showAuthentication: false,
            enablePublicDefaultUser: true,
            showTransluscentBackgroundOnHomepageText: false,
            enablePublicDetailView  : false,
            enableLibraryDetailView: false,
            id: 'ntel',
            text: {
                private_realm_button: 'Get Started',
                public_realm_button: 'Get Started'
            },
            images: {
                favicon: 'img/ntel/icon.png',
                logo_small: 'img/ntel/logo_darkbg.png',
                private_realm_icon: 'img/ntel/splash/btn-workspace.jpg',
                public_realm_icon: 'img/ntel/splash/btn-utility.jpg',
                backgrounds: {
                    morning: 'img/ntel/splash/splash_morning.jpg',
                    afternoon: 'img/ntel/splash/splash_afternoon.jpg',
                    night: 'img/ntel/splash/splash_evening.jpg',
                    default: 'img/ntel/splash/splash_intro.jpg'
                }
            }
        }
    };

    var configMode = 'default';
    var defaults = $.extend(true, {}, configDefaults.default, configDefaults[configMode]);

    var hidePublicRealm     =  defaults.hidePublicRealm;
    var hidePrivateRealm    =  defaults.hidePrivateRealm;
    var hideCreateRealm     =  defaults.hideCreateRealm;
    var showExplorePage     =  defaults.showExplorePage;
    var hideDemoPage        =  defaults.hideDemoPage;
    var defaultRealm        =  defaults.defaultRealm;
    var privateDomainText   =  defaults.text.private_realm_button;
    var publicDomainText    =  defaults.text.public_realm_button;
    var enableLogout        =  defaults.enableLogout;
    var showTransluscentBackgroundOnHomepageText = defaults.showTransluscentBackgroundOnHomepageText;

    return {
        files : defaults,
        hideDemopage: hideDemoPage,
        canShowExplore: function(){
            return getUserCredentials().role == "ADMINISTRATOR" && showExplorePage;
        },
        hideOrShowStuffs: function(){
            if (hidePrivateRealm) {
                $('#privateAppletPlaceHolder').hide();
                $('#publicAppletText').html(privateDomainText);
            }
            if (hidePublicRealm) {
                $('#publicAppletPlaceHolder').hide();
                $('#privateAppletText').html(privateDomainText);
            }
            if (!showTransluscentBackgroundOnHomepageText){
                $('.translucent-background').removeClass('translucent-background');
            }
            if (!enableLogout){
                $('.logout-button').hide();
            }

            $('#btn-workspace').attr('src', defaults.images.private_realm_icon);
            $('#btn-utility').attr('src', defaults.images.public_realm_icon);

            if (!hideDemoPage){
                addDemoRealm();
            }

            if (defaultRealm){
                $('#realm').val(defaultRealm);
                $('#realm').attr('readonly', 'readonly');
            }
            if (hideCreateRealm){
                $('#createrealm').hide();
            }
        },
        customise: function(){
            globals.hideOrShowStuffs();
            var clientWidth = $( window ).width();
            var clientHeight = $( window ).height();
            var inLandscape = clientHeight < clientWidth;
            {
                $('.clickable-panel').each(function() {
                    if (inLandscape) {
                        $(this).removeClass('col-xs-6').addClass('col-xs-4');
                    } else {
                        $(this).removeClass('col-xs-4').addClass('col-xs-6');
                    }
                });
                var numPanels = hidePublicRealm || hidePrivateRealm ? 1 : 2;
                var pWidthXS = numPanels == 1 ? 6 : 5; var padPWidthXS = Math.floor((12 - (pWidthXS * numPanels)) / 2);
                var pWidthMD = numPanels == 1 ? 4 : 3; var padPWidthMD = Math.floor((12 - (pWidthMD * numPanels)) / 2);
                var lWidthXS = 2; var padLWidthXS = Math.floor((12 - (lWidthXS * numPanels)) / 2);
                var lWidthMD = 2; var padLWidthMD = Math.floor((12 - (lWidthMD * numPanels)) / 2);
                $('.clickable-start-panel').each(function() {
                    if (inLandscape) {
                        $(this).removeClass('col-xs-' + pWidthXS).addClass('col-xs-' + lWidthXS);
                        $(this).removeClass('col-sm-' + pWidthMD).addClass('col-sm-' + lWidthMD);
                        $(this).removeClass('col-md-' + pWidthMD).addClass('col-md-' + lWidthMD);
                    } else {
                        $(this).removeClass('col-xs-' + lWidthXS).addClass('col-xs-' + pWidthXS);
                        $(this).removeClass('col-sm-' + lWidthMD).addClass('col-sm-' + pWidthMD);
                        $(this).removeClass('col-md-' + lWidthMD).addClass('col-md-' + pWidthMD);
                    }
                    $(this).find('span').css('font-size', inLandscape ? 'xx-small' : 'x-small');
                });
                $('.clickable-start-panel-padding').each(function() {
                    if (inLandscape) {
                        $(this).removeClass('col-xs-' + padPWidthXS).addClass('col-xs-' + padLWidthXS);
                        $(this).removeClass('col-sm-' + padPWidthMD).addClass('col-sm-' + padLWidthMD);
                        $(this).removeClass('col-md-' + padPWidthMD).addClass('col-md-' + padLWidthMD);
                    } else {
                        $(this).removeClass('col-xs-' + padLWidthXS).addClass('col-xs-' + padPWidthXS);
                        $(this).removeClass('col-sm-' + padLWidthMD).addClass('col-sm-' + padPWidthMD);
                        $(this).removeClass('col-md-' + padLWidthMD).addClass('col-md-' + padPWidthMD);
                    }
                });

                // For the preview image
                if (inLandscape){
                    $('#global-preview-image').removeClass('col-xs-12 col-sm-12 col-md-12').addClass('col-xs-6 col-sm-6 col-md-6');
                } else {
                    $('#global-preview-image').removeClass('col-xs-6 col-sm-6 col-md-6').addClass('col-xs-12 col-sm-12 col-md-12');
                }
            }
        }
    }
}();