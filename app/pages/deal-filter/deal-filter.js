(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');
    var type = null;
    formelo.event().onCreate(function(){
        // Entry point of this application
        fetchFilterFilter();
        formelo.html().get.header.title().html('Filters');
    });

    formelo.event().onIntent(function(params){
        type = params.detail.type;
        // Receive parameters from calling page
    });

    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    function showFilters(data){
        var _data = [];
        if (!data){
            return false;
        }
        data.forEach(function(item){
            var title = item.name;
            var image = 'img/bg/'+title.toUpperCase().charAt(0)+'.gif';
            _data.push({
                'name' : title,
                unique : item.id,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#deal-filter').attach(function(unique){
            formelo.navigation().result({
                type : 'filter',
                filter_id : unique
            })
        });
    }
    function fetchFilterFilter(){
        var waiting = Helpers.showWaiting('#deal-filter');
        PipedriveManager.getFilters(type, function(result){
            showFilters(result.data);
        }, function(err){
            console.error(err);
            waiting.error();
        });
    }
}());