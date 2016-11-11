(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    formelo.event().onCreate(function(){
        // Entry point of this application
        fetchStatuses();
        formelo.html().get.header.title().html('Deal Status');
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
            var image = 'img/bg/'+title.toUpperCase().charAt(0)+'.gif';
            _data.push({
                'name' : title,
                'description' : '',
                unique : item.unique + '|' + title,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#status-chooser').attach(function(unique){
            var split = unique.split('|');
            formelo.navigation().result({
                type : 'change-status',
                text : split[1],
                id : split[0]
            });
        });
    }
    function fetchStatuses(){
        var data = [{
            name : 'Open',
            unique : 'open'
        }, {
            name : 'Closed - Won',
            unique : 'won'
        },{
            name : 'Closed - Lost',
            unique : 'lost'
        }];
        showResult(data);
    }
}());