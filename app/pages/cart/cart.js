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
        Helpers.showWaiting('#cart-placeholder');
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
    function showItemsInCart(){
        UserManager.showRegistration(function(data){
            MoltinManager.cart.getItemsInCart(data.id, function(data){
                console.log(JSON.stringify(data));
                var _data = [];
                var isEmpty = true;
                for(var key in data){
                    if (data[key]) {
                        var item = data[key];
                        isEmpty = false;
                        _data.push({
                            'name' : item.title,
                            'description' : item.description,
                            'image' : (item.images[0] && item.images[0].url && item.images[0].url.https) ? item.images[0].url.https : 'img/loading.png',
                            'unique' : item.id
                        });
                    }
                }
                if (isEmpty){
                    return Helpers.showEmptyState('#cart-placeholder', 'Empty', 'xNo Items in cart yet');
                } else {
                    formelo.ui().gridAdapter(_data, '#cart-placeholder').attach(function(unique){
                        showDescription(unique);
                    });
                    showCheckoutButton();
                }
            }, function(err){
                console.error(err);
                Helpers.showEmptyState('#cart-placeholder', 'Empty', 'yNo Items in cart yet');
            });
        }, function(err){
            console.error(err);
            Helpers.showEmptyState('#cart-placeholder', 'Empty', 'zNo Items in cart yet');
        });
    }
    function showDescription(unique) {
        formelo.navigation().openActivity('description', {id : unique});
    }
}());