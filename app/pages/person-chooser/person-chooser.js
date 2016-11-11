(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    formelo.event().onCreate(function(){
        // Entry point of this application
        fetchContacts();
        showOptions();
    });
    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });

    function showOptions(){
        var options = [{
            name : 'Filter',
            image : 'http://www.freeiconspng.com/uploads/filter-icon-27.png',
            unique : 'filter'
        }, {
            name : 'Add',
            image : 'http://freeflaticons.com/wp-content/uploads/2014/09/add-copy-1410527302g8kn4.png',
            unique : 'add'
        }];
        formelo.ui().actionBars(options, function(unique){
            //
        });
    }
    function showResult(data){
        var _data = [];
        data.forEach(function(item){
            var title = item.name;
            var image = 'img/bg/'+title.toUpperCase().charAt(0)+'.gif';
            _data.push({
                'name' : title,
                unique : item.id + '|' + title,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#contact-chooser').attach(function(unique){
            // Open Deals
            var split = unique.split('|');
            formelo.navigation().result({
                type : 'person',
                text : split[1],
                id : split[0]
            });
        });
    }
    function fetchContacts(){
        var waiting = Helpers.showWaiting('#contact-chooser');
        PipedriveManager.contact.getAllContacts(function(result){
            waiting.stop();
            if (result.data && result.data.length){
                showResult(result.data);
            } else {
                Helpers.showEmptyState('#contact-chooser', 'Empty', 'Empty State');
            }
        }, function(){
            waiting.error();
        }, {});
    }
}());