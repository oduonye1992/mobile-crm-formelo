(function(){
    'use strict';
    var footer = formelo.require('footer');
    formelo.event().onCreate(function(){
        // Entry point of this application
        showDealsItems();
        footer.build('deals');
        customise();
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
        formelo.html().get.header.title().html("Today's Deals");
    }
    function fetchItems(id) {
        var txDeferred = $.Deferred();
        var data = [
            {
                name : 'Cindy Materials',
                description : 'Al the funky eye glasses you need',
                time : '$10.99',
                image : 'http://previews.123rf.com/images/nito500/nito5001106/nito500110600004/9712978-black-glasses-on-a-white-background-Stock-Photo-eyeglasses-glasses-hipster.jpg',
                unique: 'sdsds'
            },
            {
                name : 'Cindy Materials',
                description : 'Al the funky eye glasses you need',
                time : '$61.99',
                image : 'http://previews.123rf.com/images/nito500/nito5001106/nito500110600004/9712978-black-glasses-on-a-white-background-Stock-Photo-eyeglasses-glasses-hipster.jpg',
                unique: 'dsd'
            },
            {
                name : 'Cindy Materials',
                description : 'Al the funky eye glasses you need',
                time : '$6.23',
                image : 'http://previews.123rf.com/images/nito500/nito5001106/nito500110600004/9712978-black-glasses-on-a-white-background-Stock-Photo-eyeglasses-glasses-hipster.jpg',
                unique: 'ssd'
            },
            {
                name : 'Cindy Materials',
                description : 'Al the funky eye glasses you need',
                time : '$1.99',
                image : 'http://previews.123rf.com/images/nito500/nito5001106/nito500110600004/9712978-black-glasses-on-a-white-background-Stock-Photo-eyeglasses-glasses-hipster.jpg',
                unique: 'dsds'
            },{
                name : 'Cindy Materials',
                description : 'Al the funky eye glasses you need',
                time : '$7.42',
                image : 'http://previews.123rf.com/images/nito500/nito5001106/nito500110600004/9712978-black-glasses-on-a-white-background-Stock-Photo-eyeglasses-glasses-hipster.jpg',
                unique: 'cinde'
            }
        ];
        txDeferred.resolve(data);
        return txDeferred.promise();
    }
    function showDealsItems(id){
        // Show loading
        $.when(fetchItems())
            .done(function(data){
                formelo.ui().gridAdapter(data, '#deals-placeholder').attach(function(unique){
                    showDescription(unique);
                })
            })
    }
    function showDescription(unique) {
        formelo.navigation().openActivity('description', {id : unique});
    }
}());