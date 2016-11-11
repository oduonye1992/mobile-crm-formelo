(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');
    formelo.event().onCreate(function(){
        // Entry point of this application
        footer.build('deal');
        fetchDeals();
        showOptions();
        bindSearchEvents();
        formelo.html().get.header.title().html('My Deals');
    });

    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });

    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    formelo.event().onResult(function(data){
        if (data.detail.type == 'filter') {
            fetchDeals({filter_id : data.detail.filter_id});
        } else {
            fetchDeals();
        }
    });
    function bindSearchEvents(){
        var searchDeals = function (options){
            var waiting = Helpers.showWaiting('#deal-placeholder');
            PipedriveManager.deals.searchDeals(options, function(result){
                waiting.stop();
                if (result.data && result.data.length){
                    showResult(result.data);
                } else {
                    Helpers.showEmptyState('#deal-placeholder', 'Empty', 'Empty State');
                }
            }, function(){
                waiting.error();
            }, options);
        };
        $('#deal-search').on('keyup', function(){
            var term = $(this).val();
            if (term.length >= 3){
                searchDeals({term : term});
            } else if (term.length == 0){
                fetchDeals();
            } else {
                console.log(term.length);
            }
        });
    }
    function showOptions(){
        var options = [{
            name : 'Filter',
            image : 'https://cdn4.iconfinder.com/data/icons/universal-pack-for-app-design-solid-part-2/48/51-UI_app_icons_100_smart_stroke_circle_solid.ai-512.png',
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
             } else if (unique == 'filter'){
                 formelo.navigation().openActivity('deal-filter', {type : 'deals'});
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
                unique : item.id,
                time : status,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#deal-placeholder').attach(function(unique){
            formelo.navigation().openActivity('deal-details', {dealID : unique});
        });
    }
    function fetchDeals(options){
        var waiting = Helpers.showWaiting('#deal-placeholder');
        PipedriveManager.deals.getAllDeals(function(result){
            waiting.stop();
            if (result.data && result.data.length){
                showResult(result.data);
            } else {
                Helpers.showEmptyState('#deal-placeholder', 'Empty', 'Empty State');
            }
        }, function(){
            waiting.error();
        }, options);
    }
}());