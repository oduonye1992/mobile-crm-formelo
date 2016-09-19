            (function(){
                'use strict';
                var dant = formelo.require('dante');
                formelo.event().onCreate(function(){
                    // Entry point of this application
                    dant.alert();
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