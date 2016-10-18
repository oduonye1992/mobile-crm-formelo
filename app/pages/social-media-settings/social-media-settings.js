(function(){
    'use strict';
    var footer = formelo.require('footer');
    formelo.event().onCreate(function(){
        // Entry point of this application
        customise();
        footer.build('settings');
    });

    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });

    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    function customise(){
        formelo.html().get.header.title().html("Social Media Settings");
    }
}());