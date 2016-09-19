'use strict';
/**
 * Created by danieloduonye on 3/2/16.
 */

var Administrator = function(){

    var validateRealmEndpoint    = 'https://system.formelo.com/actions/realms/validate?realm=';
    var submitRealmEndpoint      = 'https://system.formelo.com/actions/realms/register';
    var validateEmail            = 'https://system.formelo.com/actions/users/validate?username=';
    var getRealmEndpoint         = 'https://system.formelo.com/actions/realms/about?realm=';
    var validateExistingUser     = 'https://system.formelo.com/actions/users/info/';//?username=&password=&';
    var validateExistingUser     = 'https://system.formelo.com/actions/users/info/';
    var passwordReminderEndpoint = 'https://system.formelo.com/actions/users/password/forgot';
    var generateUserPassCheckEndpoint =  function(username, password){
        return validateExistingUser+'?username='+username+'&password='+encodeURIComponent(password);
    };
    var loadingSuggestionsHtml = '<div class="progress progress-small"><div class="progress-bar-indeterminate"></div></div>';

    var isNewUser               = true;
    var submissionConfig = {
        username                : undefined,
        password                : undefined,
        password_new            : undefined,
        password_new_confirm    : undefined,
        realm_code              : undefined,
        role                    : 'ADMINISTRATOR'
    };
    // Create the html for the registration pages
    var openRegistrationPage = function(){
        var page_name = 'admin_registration_page';
        var html = ''+
            '<div data-role="page" id="'+page_name+'" class="lightblue-gradient">'+
                '<div data-role="header" style="border-style: none !important;" data-position="fixed" data-tap-toggle="false" class="lightblue-gradient">'+
                    '<a data-rel="back" class="ui-btn ui-btn-left header-link" style="color: white !important; font-weight: 500 !important;"><i class="pg-close_line"></i> </a>'+
                    '<h1 style="text-align: center !important; color: white !important;">Step 1 of 3</h1>'+
                    '<a id="admin_email_next_button" class="ui-btn ui-btn-right header-link" style="color: white !important; font-weight: 500 !important; text-overflow: clip;">Next </a>'+
                '</div>'+
                '<div role="main" class="lightblue-gradient">'+
                    '<div class="container-xs-height full-vh">'+
                        '<div class="row-xs-height">'+
                            '<div class="col-xs-height col-middle">'+
                                '<div class="error-container text-center">'+
                                    '<h1 class="error-number sm-text-center" xstyle="color: white;">' +
                                        '<input id = "admin_email_field" style="border-bottom: 1px dashed #257489 !important;" type="email" class="form-control special-input" placeholder="Type your email address here"/>'+
                                        '<input id = "admin_password_field" style="border-bottom: 1px dashed #257489 !important;" type="password" class="form-control special-input" placeholder="Password"/>'+
                                        '<div id = "loading_element"></div>'+
                                    '</h1>'+
                                    '<p id="step1error" class="fs-12" style="color: black; text-align: left; padding: 0px  10px; text-shadow: none; display: none;"> </p>'+
                                    '<p id="forgotpassword" class="fs-12" style="color: white; text-align: left; padding: 0px  10px; text-shadow: none; display: none;">Forgot Password?</p>'+
                                    '<p id="step1helpertext" class="fs-12" style="color: white; text-align: left; padding: 0px  10px; text-shadow: none;">Don\'t worry about setting a password right now. We\'ll mail one to you</p>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>';
        BODY.appends(html);
        $('#admin_password_field').hide();

        bodyContainer.pagecontainer('change', '#'+page_name, {
            transition: "pop"
        });

        $('#forgotpassword').unbind();
        $('#forgotpassword').click(function(){
            try{
                var username = $('#admin_email_field').val().trim();
                if (username.length && isValid.email(username)){
                    navigator.notification.confirm(
                        'Send me instructions on how to change my password',
                        function(buttonIndex) {
                            if (buttonIndex == 1) {
                                recoverPassword(username);
                            } else if (buttonIndex == 2){
                                navigator.notification.prompt(
                                    'Please enter your email address',  // message
                                    function(results){
                                        if (results.buttonIndex == 1){
                                            // Validate email
                                            if (isValid.email(results.input1)){
                                                recoverPassword(results.input1);
                                            } else {
                                                showMessage('Kindly enter a valid email');
                                            }
                                        }
                                    },                  // callback to invoke
                                    'Forgot Password',            // title
                                    ['Ok','Exit']              // buttonLabels
                                );
                            }
                        },
                        username, ['Send', 'Edit email', 'Cancel'],
                        username
                    );
                } else {
                    navigator.notification.prompt(
                        'Please enter your email address',  // message
                        function(results){
                            if (results.buttonIndex == 1){
                                // Validate email
                                if (isValid.email(results.input1)){
                                    recoverPassword(results.input1);
                                } else {
                                    showMessage('Kindly enter a valid email');
                                }
                            }
                        },                  // callback to invoke
                        'Forgot Password',            // title
                        ['Ok','Exit']              // buttonLabels
                    );
                }
            } catch(e){
                alert(JSON.stringify(e));
                showMessage(JSON.stringify(e));
            }

        });

        $('#admin_email_next_button').unbind();
        $('#admin_email_next_button').on('click', function(){
            try {
                if (!isonline()){
                    $('#admin_email_field').addClass('animated shake');
                    $('#step1error').css('display', 'block');
                    $('#step1error').html('Kindly connect to the internet');
                    setTimeout(function(){ $('#admin_email_field').removeClass("fadeInDown animated");},50);
                    return false;
                }
                if (!isNewUser){
                    var user = $('#admin_email_field').val().trim();
                    var pass = $('#admin_password_field').val();
                    if (!user.length || !isValid.email(user)){
                        return showMessage('Please enter a valid email address');
                    }
                    var endpoint = generateUserPassCheckEndpoint(user, pass);
                    $('#loading_element').html(loadingSuggestionsHtml).trigger('create');
                    $.when(fetchData(endpoint))
                        .done(function(data) {
                            $('#loading_element').html('');
                            alert(JSON.stringify(data));
                            submissionConfig.username = user;
                            submissionConfig.password     = pass;
                            submissionConfig.password_new = pass;
                            submissionConfig.password_new_confirm = pass;
                            openRealmPage();
                        })
                        .fail(function(err){
                            var msg = '';
                            if (err.status == 404 || err.status == 403){
                                msg = 'Incorrect username and password';
                            } else {
                                msg = 'An error occured';
                            }
                            //alert('err: '+JSON.stringify(data));
                            $('#admin_email_field').addClass('animated shake');
                            $('#admin_password_field').addClass('animated shake');
                            setTimeout(function(){ $('#admin_email_field').removeClass("fadeInDown animated");$('#admin_password_field').removeClass("fadeInDown animated");},50)
                            $('#loading_element').html('').trigger('create');
                            $('#step1error').html(msg);
                            $('#step1error').css('display', 'block');
                        });
                    return;
                }

                var mail = $('#admin_email_field').val();
                if (isValid.email(mail)){
                    $('#loading_element').html(loadingSuggestionsHtml).trigger('create');
                    $.when(fetchData(validateEmail+mail))
                        .done(function(data){
                            if (data.hasOwnProperty('outcome') && data['outcome'] == false){
                                $('#loading_element').html('').trigger('create');
                                navigator.notification.confirm(
                                    'Is this your correct email address?',
                                    function(buttonIndex) {
                                        if (buttonIndex == 2) {
                                            submissionConfig.username = mail.toLowerCase();
                                            openRealmPage();
                                        }
                                    },
                                    mail, ['Edit', 'Yes'],
                                    mail
                                );
                            } else {
                                $('#loading_element').html('').trigger('create');
                                $('#admin_password_field').show();
                                $('#admin_password_field').slideDown(900);
                                $('#forgotpassword').css('display', 'block');
                                isNewUser = false;
                                $('#step1helpertext').html('You seem to be registered already. Enter your password to continue');
                            }
                        })
                        .fail(function(err){
                            $('#admin_email_field').addClass('animated shake');
                            setTimeout(function(){ $('#admin_email_field').removeClass("fadeInDown animated");},50);
                            $('#loading_element').html('').trigger('create');
                            $('#step1error').css('display', 'block');
                            $('#step1error').html('An error occured :(');
                        })
                } else {
                    $('#admin_email_field').addClass('animated shake');
                    setTimeout(function(){ $('#admin_email_field').removeClass("fadeInDown animated");},50)
                    return false;
                }
            } catch (e){
                 alert(JSON.stringify(e));
            }
        })
    };

    var openRealmPage = function(){
        var page_name = 'admin_realm_page';
        var html = ''+
            '<div data-role="page" id="'+page_name+'" class="red-gradient">'+
                '<div data-role="header" style="border-style: none !important;" data-hide-during-focus="false" data-position="fixed" data-tap-toggle="false" class="red-gradient">'+
                    '<a data-rel="back" class="ui-btn ui-btn-left header-link" style="color: white !important; font-weight: 500 !important;"><i class="pg-arrow_left_line_alt"></i> </a>'+
                        '<h1 style="text-align: center !important; color: white !important;">Step 2 of 3</h1>'+
                    '<a id="admin_realm_next_button" class="ui-btn ui-btn-right header-link" style="color: white !important; font-weight: 500 !important; text-overflow: clip;">Next </a>'+
                '</div>'+
                '<div role="main" class="full-vh red-gradient">'+
                    '<div class="container-xs-height full-vh">'+
                        '<div class="row-xs-height">'+
                            '<div class="col-xs-height col-middle">'+
                                '<div class="error-container text-center">'+
                                    '<h1 class="error-number sm-text-center">' +
                                        '<input id = "admin_realm_field" type="text" style="border-bottom: 1px dashed #ec644b !important;" class="form-control special-input" placeholder="What\'s your Workspace\'s title?"/>'+
                                        '<div id = "loading_element2"></div>'+
                                    '</h1>'+
                                    '<p id="extra2" class="fs-12" style="color: white; text-align: left; padding: 0px  10px; text-shadow: none;"> </p>'+
                                    '<p class="fs-12" style="color: white; text-align: left; padding: 0px  10px; text-shadow: none;"> This can be the name of your organization such as "Acme Corp", a department such as "Acme Sales Team", or even something personal such as "Kim\'s Book Club"</p>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>';
        BODY.appends(html);
        bodyContainer.pagecontainer('change', '#'+page_name, {
            transition: "pop"
        });
        $('#admin_realm_next_button').unbind();
        $('#admin_realm_next_button').on('click', function(){
            var realmname = $('#admin_realm_field').val();
            if (!realmname.trim().length){
                $('#admin_realm_field').addClass('animated shake');//.trigger('create');
                return false;
            }
            if (!isonline()){
                $('#admin_realm_field').addClass('animated shake');
                $('#extra2').html('Kindly connect to the internet');
                return false;
            }
            var loadingSuggestionsHtml = '<div class="progress progress-small"><div class="progress-bar-indeterminate"></div></div>';
            $('#loading_element2').html(loadingSuggestionsHtml).trigger('create');
            //if (isValidString(realmname.trim())){
                $.when(fetchData(validateRealmEndpoint+realmname.trim().replace(/[^a-zA-Z0-9_]/g, "").substring(0, 16)))
                    .done(function(data){
                        $('#loading_element2').html('').trigger('create');
                        if (data.hasOwnProperty('outcome') && data['outcome'] == false){
                            submissionConfig.realm_code = realmname.trim().replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().substring(0, 16);
                            openSlugPage();
                        } else {
                            openSlugPage(realmname.trim().replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().substring(0, 16));
                        }
                    })
                    .fail(function(){
                        $('#extra2').html('An error occured. Try again');
                    });
            //} else {
            //    $('#loading_element2').html('').trigger('create');
            //    openSlugPage('team');
            //}
        })
    };
    var ff = function(e) {
        /*if (e.which !== 0 && e.charCode !== 0) { // only characters
            var c = String.fromCharCode(e.keyCode|e.charCode);
            var $span = $(this).siblings('span.char-length-helper').first();
            $span.text($(this).val() + c); // the hidden span takes
            // the value of the input
            var $inputSize = $span.width() + 10;
            $(this).css("width", $inputSize) ; // apply width of the span to the input
        }*/
    };

    var openSlugPage = function(realmCode){
        var page_name = 'admin_slug_page';
        var html = ''+
            '<div data-role="page" id="'+page_name+'" class="purple-gradient">'+
                '<div data-role="header" style="border-style: none !important;" data-hide-during-focus="false" data-position="fixed" data-tap-toggle="false" class="purple-gradient">'+
                    '<a data-rel="back" class="ui-btn ui-btn-left header-link" style="color: white !important; font-weight: 500 !important;"><i class="pg-arrow_left_line_alt"></i> </a>'+
                    '<h1 style="text-align: center !important; color: white !important;">Step 3 of 3</h1>'+
                    '<a id="admin_slug_link" status="" class="ui-btn ui-btn-right header-link" style="color: white !important; font-weight: 500 !important; text-overflow: clip;">Register </a>'+
                '</div>'+
                '<div role="main" class="full-vh purple-gradient">'+
                    '<div class="container-xs-height full-vh">'+
                        '<div class="row-xs-height">'+
                            '<div class="col-xs-height col-middle">'+
                                '<div class="error-container text-center">'+
                                    '<h1 class="error-number sm-text-center">' +
                                        '<div class="input-group" style="margin-left: 10px">' +
                                            '<span class="input-group-addon" style="color: #e67e22;width: auto;border: none;background-color: transparent;font-size: 18px;padding: 0px;">#</span>' +
                                            '<input id="admin_slug_field" type="text" style="border:none; border-bottom: 1px dashed #e67e22 !important; display: inline-block; padding: 0px;" class="form-control special-input" placeholder="team" maxlength="16">'+
                                            '<span class="char-length-helper" style="display: none; font-size: x-large; padding: 0px;"></span>' +
                                        '</div>'+
                                        '<div id = "loading_element3"></div>'+
                                    '</h1>'+
                                    '<p class="fs-12" style="color: white; text-align: left; padding: 0px  10px; text-shadow: none;"><span id="slug-hint-text" class="label label-success"></span></p>'+
                                    '<p class="fs-12" style="color: white; text-align: left; padding: 0px  10px; text-shadow: none;">This is a special code that identifies your workspace such as "teamalpha". Only alphabets, numbers and underscores are allowed.</p>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>';
        BODY.appends(html);
        bodyContainer.pagecontainer('change', '#'+page_name, {
            transition: "pop"
        });
        $('#admin_slug_field').keypress(ff);
        //$('#admin_slug_field').val(submissionConfig.realm_code ? submissionConfig.realm_code.trim() : realmCode.trim());
        if (submissionConfig.realm_code != null){
            $('#slug-hint-text').html('#'+submissionConfig.realm_code.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()+' is available.').removeClass('label-success label-danger').addClass('label-success');
            $('#admin_slug_field').val(submissionConfig.realm_code.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase());
            $('#admin_slug_link').attr('status', 'OK');
        } else {
            $('#admin_slug_field').val(realmCode.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase());
            $('#admin_slug_field').addClass('animated shake');
            var msg = 'We tried "#'+realmCode.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()+'", but it wasn\'t available';
            $('#slug-hint-text').html(msg).removeClass('label-success label-danger').addClass('label-danger');
            $('#admin_slug_link').attr('status', '');
        }

        $('#admin_slug_field').on('change', function(){
            try {
                var slug = $(this).val().replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
                if (!slug.trim().length || !isValidString(slug.trim())){
                    $('#admin_slug_field').addClass('animated shake');
                    $('#admin_slug_link').attr('status', '');
                    $(this).val('');
                    setTimeout(function(){$('#admin_slug_field').removeClass("fadeInDown animated");},50);
                    return false;
                }
                if (!isonline()){
                    $('#admin_slug_field').addClass('animated shake');
                    $('#slug-hint-text').html('Kindly connect to the internet and try again');
                    setTimeout(function(){ $('#admin_slug_field').removeClass("fadeInDown animated");},50);
                    return false;
                }
                var loadingSuggestionsHtml = '<div class="progress progress-small"><div class="progress-bar-indeterminate"></div></div>';
                $('#loading_element3').html(loadingSuggestionsHtml).trigger('create');
                $('#admin_slug_link').attr('status', '');
                $.when(fetchData(validateRealmEndpoint+slug))
                    .done(function(data){
                        var msg = '';
                        if (data.hasOwnProperty('outcome') && data['outcome'] == false){
                            submissionConfig.realm_code = slug.trim().toLowerCase();
                            msg = 'Available';
                            $('#loading_element3').html('').trigger('create');
                            $('#slug-hint-text').html(msg).removeClass('label-success label-danger').addClass('label-success');
                            $('#admin_slug_link').attr('status', 'OK');
                        } else {
                            msg = 'Not available';
                            $('#slug-hint-text').html(msg).removeClass('label-success label-danger').addClass('label-danger');
                            $('#loading_element3').html('').trigger('create');
                            $('#admin_slug_field').addClass('animated shake');
                            $('#admin_slug_link').attr('status', '');
                            setTimeout(function(){$('#admin_slug_field').removeClass("fadeInDown animated");},50)
                        }
                    })
                    .fail(function(){
                        $('#slug-hint-text').html('An error occured. Try again').removeClass('label-success label-danger').addClass('label-danger');
                        $('#admin_slug_link').attr('status', '');
                        $('#loading_element3').html('');
                    })
            } catch (e){
                alert(JSON.stringify(e));
            }
        });
        $('#admin_slug_link').unbind();
        $('#admin_slug_link').on('click', function(e){
            if ($(this).attr('status') != 'OK'){
                return false;
            }
            if (!isonline()){
                $('#slug-hint-text').html('Kindly connect to the internet and try again.').removeClass('label-success label-danger').addClass('label-danger');
                $('#admin_slug_field').addClass('animated shake');
                setTimeout(function(){$('#admin_slug_field').removeClass("fadeInDown animated");},50);
                return false;
            }
            try{
                var loadingSuggestionsHtml = '<div class="progress progress-small"><div class="progress-bar-indeterminate"></div></div>';
                $('#loading_element3').html(loadingSuggestionsHtml).trigger('create');
                $('#admin_slug_page').fadeTo(500, 0.5);
                $.when(register())
                    .done(function(){
                        $('#admin_slug_page').fadeTo(500, 1);
                        $('#loading_element3').html('');
                        openSuccessPage();
                    })
                    .fail(function(){
                        $('#admin_slug_page').fadeTo(500, 1);
                        $('#slug-hint-text').html('An error occured. Try again').removeClass('label-success label-danger').addClass('label-danger');
                    })
            } catch (e){
                alert(JSON.stringify(e));
            }
        })
    };
    var openSuccessPage = function() {
        var page_name = 'admin_confirm_page';
        var successText = 'Your workspace is now live at <br> https://'+submissionConfig.realm_code+'.formelo.com';
        var html = '' +
            '<div data-role="page" id="' + page_name + '" class="green-gradient">' +
            '<div data-role="header" style="border-style: none !important;" data-hide-during-focus="false" data-position="fixed" data-tap-toggle="false" class="green-gradient">' +
            '</div>' +
            '<div role="main" class="full-vh green-gradient">' +
            '<div class="container-xs-height full-vh">' +
            '<div class="row-xs-height">' +
            '<div class="col-xs-height col-middle">' +
            '<div class="error-container text-center">' +
            '<h1 class="error-number" style="color: grey;"><img class="sm-image-responsive-height" style="width:150px" src="img/empty-states/success_icon.png"></h1><br/>'+
            '<h2 class="semi-bold" style="color: #012f47;">All done!</h2>'+
            '<p class="fs-12 hint-text" style="text-align: center; padding: 0px 10px; text-shadow: none; color: #012f47;">'+
            successText +
            '</p>'+
            '<p class="fs-12 hint-text" style="text-align: center; padding: 0px 10px; text-shadow: none;">'+
            '<button id="success-btn" class="btn btn-cons" style="max-width: 250px; margin:auto; padding: 10px; background-color: #012f47; color:white; border-color: #012f47;">Get Started</button>'+
            '</p>'+
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        BODY.appends(html);
        bodyContainer.pagecontainer('change', '#' + page_name, {
            transition: "pop"
        });
        $('#success-btn').click(function(){
            $.when(setOneTimePassword())
                .done(function() {
                    window.plugins.toast.show("All set. You are good to go.", 'short', 'bottom');
                    handleLogin(null, true);
                });
        });
    };

    var recoverPassword = function(email){
        $.when(fetchData(passwordReminderEndpoint, {username : email}, 'POST'))
            .done(function(){
                showMessage('Email has been sent', 'short',' bottom');
            }).fail(function(e){
                showMessage('An error has occured. Please try again', 'short',' bottom');
            });
    };

    var register =  function(){
        try {
            var txDeferred = $.Deferred();
            var password                            = submissionConfig.password_new ? submissionConfig.password_new : str_random(9);
            submissionConfig.password_new           = password;
            submissionConfig.password_new_confirm   = password;
            submissionConfig.password               = password;
            //alert(JSON.stringify(submissionConfig));
            customFunctions.displayNotificationDialog('Please wait','The rocket is primed. Get ready for lift-off. . .');
            alert(JSON.stringify(submissionConfig));
            $.when(fetchData(submitRealmEndpoint, submissionConfig, 'POST'))
                .done(function(data){
                    customFunctions.closeNotificationDialog();
                    alert(JSON.stringify(data));
                    var realmObject = data;
                    customFunctions.displayNotificationDialog('','On your marks! . .');
                    $.when(fetchData(getRealmEndpoint+realmObject.code, submissionConfig, 'POST'))
                        .done(function(realm){
                            customFunctions.closeNotificationDialog();
                            alert(JSON.stringify(realm));
                            var realmObj = realm;
                            // Login in the user
                            var endPoint = realmObj.base_url+"/actions/users/info?username="+submissionConfig.username+"&password="+encodeURIComponent(submissionConfig.password_new);
                            alert(endPoint);
                            customFunctions.displayNotificationDialog('Please Wait', 'Get Set! . . ');
                            $.when(fetchData(endPoint))
                                .done(function(data){
                                    customFunctions.closeNotificationDialog();
                                    alert(JSON.stringify(data));
                                    var userObj = data;
                                    // Save to Realm
                                    privateCtlr.saveRealm(realmObj);
                                    window.localStorage["realm"] = realm;
                                    window.localStorage["realm_full"] = JSON.stringify(realmObj);
                                    // Save user to users
                                    Users.saveUser(userObj);
                                    window.localStorage["credentials"] = JSON.stringify(userObj);
                                    txDeferred.resolve();
                                })
                                .fail(function(e){
                                    customFunctions.closeNotificationDialog();
                                    alert('Error for user registration '+JSON.stringify(e))
                                });
                        })
                        .fail(function(e){
                            customFunctions.closeNotificationDialog();
                            alert('Error for realm registration '+JSON.stringify(e));
                        });
                })
                .fail(function(e){
                    customFunctions.closeNotificationDialog();
                    alert('Error for initial registration '+JSON.stringify(e));
                    txDeferred.reject(e);
                });
            return txDeferred.promise();
        } catch (e){
            alert(JSON.stringify(e));
        }
    };

    var reset =  function(){
        submissionConfig.username       = undefined;
        submissionConfig.password_new   = undefined;
        submissionConfig.password_new_confirm            = undefined;
        submissionConfig.realm_code    = undefined;
        submissionConfig.password     = undefined;
        submissionConfig.role          = 'ADMINISTRATOR';
        $('#admin_slug_page').remove();
        $('#admin_realm_page').remove();
        $('#admin_registration_page').remove();
        $('#admin_confirm_page').remove();
        isNewUser = true;
        app.form.clear();
    };

    return {
        startRegistration: function(){
            try{
                reset();
                openRegistrationPage();
            } catch (e){
                alert(JSON.stringify(e));
            }
        }
    }
};
var administrator = new Administrator();
