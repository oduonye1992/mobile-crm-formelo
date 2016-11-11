(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');
    formelo.event().onCreate(function(){
        // Entry point of this application
        fetchDeals();
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
            console.log('Clicked  '+unique);
            if (unique == 'add'){
                formelo.navigation().openActivity('add-deal', {
                    mode : 'add'
                });
            }
        });
    }
    function showResult(data){
        var _data = [];
        data.forEach(function(item){
            var title = item.title;
            var amount = item.formatted_value;
            var org = item.org_name;
            var person = item.person_name;
            var status = item.status;
            var image = 'img/bg/'+title.toUpperCase().charAt(0)+'.gif';
            _data.push({
                'name' : title,
                'description' : amount + ' - ' + org + ' - ' + person,
                unique : item.id + '|' + title,
                time : status,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#deal-chooser').attach(function(unique){
            var split = unique.split('|');
            formelo.navigation().result({
                type : 'deals',
                text : split[1],
                id : split[0]
            });
        });
    }
    function fetchDeals(){
        var waiting = Helpers.showWaiting('#deal-chooser');
        PipedriveManager.deals.getAllDeals(function(result){
            waiting.stop();
            if (result.data && result.data.length){
                showResult(result.data);
            } else {
                Helpers.showEmptyState('#deal-chooser', 'Empty', 'Empty State');
            }
        }, function(){
            waiting.error();
        }, {});
    }
}());