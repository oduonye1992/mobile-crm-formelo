(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');
    formelo.event().onCreate(function(){
        // Entry point of this application
        fetchCurrencies();
    });

    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });

    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    function showResult(data){
        var _data = [];
        data.forEach(function(item){
            var title = item.name;
            var description = item.code;
            var image = 'img/bg/'+title.toUpperCase().charAt(0)+'.gif';
            _data.push({
                'name' : title,
                'description' : description,
                unique : item.id + '|' + title,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#currency-chooser').attach(function(unique){
            var split = unique.split('|');
            formelo.navigation().result({
                type : 'currency',
                text : split[1],
                id : split[0]
            });
        });
    }
    function fetchCurrencies(){
        var waiting = Helpers.showWaiting('#currency-chooser');
        PipedriveManager.currency.getAllCurrencies(function(result){
            waiting.stop();
            if (result.data && result.data.length){
                showResult(result.data);
            } else {
                Helpers.showEmptyState('#currency-chooser', 'Empty', 'Empty State');
            }
        }, function(){
            waiting.error();
        }, {});
    }
}());