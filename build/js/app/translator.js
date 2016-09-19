'use strict';

var languages = {
    english : 'en',
    spanish : 'sp'
};

var countries = [
    { "name": "United States", "code": "US" },
    { "name": "United Kingdom", "code": "GB" },
    { "name": "India", "code": "IN" },
    { "name": "Nigeria", "code": "NG" },
    { "name": "South Africa", "code": "ZA" },
    { "name": "Spain", "code": "ES" }
];

var DEFAULT_COUNTRY_PUBLIC      = 'us';
var CURRENT_LANGUAGE_PUBLIC     = languages.english;
var CURRENT_COUNTRY_PRIVATE     = 'us';
var CURRENT_LANGUAGE_PRIVATE    = languages.english;

function getCountryImage(){
    var currentCountry = getCurrentCountry();
    return 'img/flags/'+currentCountry+'.png';
}
function getCurrentCountry(){
    return window.localStorage['current_country'] || DEFAULT_COUNTRY_PUBLIC;
}
function setDefaultCountry(code){
    window.localStorage['current_country'] = code;
}

var Translator =  function(){
    var defaultLanguage = 'en';
    var setDefaultLanguage = function(language){
        defaultLanguage  = language || defaultLanguage;
    };
    var config = {
        'en' : {
            'welcome_message' : 'Welcome to formelo',
            'welcome' : {
                'intro' : 'introduction'
            }
        },
        'sp' : {
            'welcome_message' : 'Gracias el torres'
        }
    };
    return {
        get : function(key){
            if (!key){return '';}
            var keysArray = key.split('.');
            var temp = config[defaultLanguage];
            for (var i = 0; i < keysArray.length; i++){
                if(temp[keysArray[i]]){
                    temp = temp[keysArray[i]];
                } else {
                    return key;
                }
            }
            return typeof temp == 'object' ? key : temp;
        }
    }
}();

function showCountries(){
    try {
        var key;
        var lists = '';
        var activeIcon = '<i class="fa fa-refresh" style="float: right;color: lightgray; font-size: 1.5em;"></i>';
        var currentCountryCode = getCurrentCountry();
        var activeCountry = '';
        for(var i = 0; i < countries.length; i++){
            var country = countries[i];
            var image = 'img/flags/'+country.code.toLowerCase()+'.png';
            if (country.code.toLowerCase() == currentCountryCode.toLowerCase()){
                activeCountry =
                    '<div class="clickable card-header clearfix countryItem" data-id="'+country.code.toLowerCase()+'">'+
                    '<div class="user-pic pull-left">'+
                    '<img alt="Profile Image" width="33" height="33" data-src-retina="'+image+'" data-src="'+image+'" src="'+image+'">'+
                    '</div>'+
                    '<div style="margin-left: 40px">'+
                    '<h5 style="font-weight: 300; text-transform: capitalize !important;">'+country.name+' ' +(country.code.toLowerCase() == currentCountryCode.toLowerCase() ? activeIcon : '')+'</h5>'+
                    '</div>'+
                    '</div>';
            } else {
                lists +=
                    '<div class="clickable card-header clearfix countryItem" data-id="'+country.code.toLowerCase()+'">'+
                    '<div class="user-pic pull-left">'+
                    '<img alt="Profile Image" width="33" height="33" data-src-retina="'+image+'" data-src="'+image+'" src="'+image+'">'+
                    '</div>'+
                    '<div style="margin-left: 40px">'+
                    '<h5 style="font-weight: 300; text-transform: capitalize !important;">'+country.name+' ' +(country.code.toLowerCase() == currentCountryCode.toLowerCase() ? activeIcon : '')+'</h5>'+
                    '</div>'+
                    '</div>';
            }
        }
        lists = activeCountry +' '+ lists;
        $('#modalSlideLeft').remove();
        var html = '<div class="modal fade slide-right in" id="modalSlideLeft" tabindex="-1" role="dialog" aria-hidden="false" style="display: block; overflow:scroll;>'+
                                '<div class="modal-dialog modal-sm">'+
                                    '<div class="modal-content-wrapper">'+
                                        '<div class="modal-content">'+
                                        '<br/>'+
                                            '<div class="container-xs-height full-height">'+
                                                '<div class="row-xs-height">'+
                                                    '<div class="modal-body col-xs-height col-middle xtext-center" style="padding: 6px;">'+
                                                        '<h5 class="" style="text-align: center"><span class="semi-bold">Select a Country</span><span data-dismiss="modal" style="float:right;'+
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
                $('body').append(html);
                $('#modalSlideLeft').modal();
                adjustHeightsToViewport();
    } catch(e){
        alert(e.message + ' ' + JSON.stringify(e));
    }
    $('.countryItem').each(function(index) {
        $(this).click(function(e){
            e.stopPropagation();
            var id = $(this).attr('data-id');
            setDefaultCountry(id);
            publicCtlr.refreshConfig();
            $('#modalSlideLeft').modal('toggle');
        });
    });
}

function trans(key){
    return Translator.get(key);
}
//alert(trans('welcome_message'));
//alert(trans('welcome.intro'));
