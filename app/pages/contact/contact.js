(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    formelo.event().onCreate(function(){
        // Entry point of this application
        footer.build('contact');
        fetchContacts();
        showOptions();
        bindSearchEvents();
        formelo.html().get.header.title().html('Contacts');
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
                fetchContacts({filter_id : data.detail.filter_id});
            } else {
                fetchContacts();
            }
        });

    function bindSearchEvents(){
        var searchDeals = function (options){
            var waiting = Helpers.showWaiting('#contact-placeholder');
            PipedriveManager.contact.searchContacts(options, function(result){
                waiting.stop();
                if (result.data && result.data.length){
                    showResult(result.data);
                } else {
                    Helpers.showEmptyState('#contact-placeholder', 'Empty', 'Empty State');
                }
            }, function(){
                waiting.error();
            }, options);
        };
        $('#contact-search').on('keyup', function(){
            var term = $(this).val();
            if (term.length >= 3){
                searchDeals({term : term});
            } else if (term.length == 0){
                fetchContacts();
            } else {
                console.log(term.length);
            }
        });
    }
    function showOptions(){
        var options = [
            {
                name : 'View on Map',
                image : 'https://s-media-cache-ak0.pinimg.com/564x/32/89/9f/32899f97b2b56d38f8cd348c516b3a35.jpg',
                unique : 'map'
            },{
            name : 'Filter',
            image : 'https://cdn4.iconfinder.com/data/icons/universal-pack-for-app-design-solid-part-2/48/51-UI_app_icons_100_smart_stroke_circle_solid.ai-512.png',
            unique : 'filter'
        }, {
            name : 'Add',
            image : 'http://freeflaticons.com/wp-content/uploads/2014/09/add-copy-1410527302g8kn4.png',
            unique : 'add'
        }];
        formelo.ui().actionBars(options, function(unique){
            if (unique == 'add') {
                formelo.navigation().openActivity('add-person');
            } else if(unique == 'map'){
                formelo.navigation().openActivity('contacts-map');
            } else if (unique == 'filter'){
                formelo.navigation().openActivity('deal-filter', {type : 'people'});
            }
        });
    }
    function showResult(data){
        var _data = [];
        data.forEach(function(item){
            var title = item.name;
            var image = 'img/bg/'+title.toUpperCase().charAt(0)+'.gif';
            _data.push({
                'name' : title,
                unique : item.id,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#contact-placeholder').attach(function(unique){
            // Open Deals
            console.log('Clicked on '+unique);
            formelo.navigation().openActivity('contact-details', {contactID : unique});
        });
    }
    function fetchContacts(options){
        var waiting = Helpers.showWaiting('#contact-placeholder');
        PipedriveManager.contact.getAllContacts(function(result){
            waiting.stop();
            if (result.data && result.data.length){
                showResult(result.data);
            } else {
                Helpers.showEmptyState('#contact-placeholder', 'Empty', 'Empty State');
            }
        }, function(){
            waiting.error();
        }, options);
    }
}());