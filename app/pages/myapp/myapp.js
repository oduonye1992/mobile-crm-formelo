(function(){
    'use strict';

    //formelo.uses('daniel');
    formelo.runDependencies();
    alert(anime);

    formelo.event().onCreate(function(){
        // Entry point of this application
        var path = anime.path('path');
    });

    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });

    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
}());