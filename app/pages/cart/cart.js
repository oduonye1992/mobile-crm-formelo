(function(){
    'use strict';
    var MoltinManager = formelo.require('MoltinManager');
    var UserManager = formelo.require('UserManager');
    var footer = formelo.require('footer');
    var Helpers = formelo.require('Helpers');

    var customerID = null;
    formelo.event().onCreate(function(){
        // Entry point of this application
        footer.build('cart');
        showItemsInCart();
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

    function showCheckoutButton(unique) {
        var data = [
            {
                'icon' : 'fa fa-shopping-cart',
                'text' : 'Checkout',
                'unique' : 'checkout'
            }
        ];
        formelo.ui().footer(data, function(data){
            alert('item added to cart');
        });
    }
    function customise(){
        formelo.html().get.header.title().html("My Cart");
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
    function showItemsInCart(){
        // Show loading
        // Fetch current user
        var currentUser = UserManager.getCurrentUser();
        if (currentUser) {
            customerID = currentUser.id;
            MoltinManager.cart.getItemsInCart(currentUser.id, function(data){
                alert(JSON.stringify(data));
                /*formelo.ui().listAdapter(data, '#cart-placeholder').attach(function(unique){
                    showDescription(unique);
                });
                showCheckoutButton();*/
            }, function(err){
                alert(JSON.stringify(err));
            });
        } else {
            Helpers.showEmptyState('#cart-placeholder', 'Empty', 'No Items in cart yet');
        }
        // Fetch items in cart
        /*$.when(fetchItems())
            .done(function(data){
                formelo.ui().listAdapter(data, '#cart-placeholder').attach(function(unique){
                    showDescription(unique);
                });
                showCheckoutButton();
            })
            */
    }
    function showDescription(unique) {
        formelo.navigation().openActivity('description', {id : unique});
    }
}());