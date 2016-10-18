(function(){
    'use strict';
    var MoltinManager = formelo.require('MoltinManager');
    var UserManager = formelo.require('UserManager');
    var footer = formelo.require('footer');
    var Helpers = formelo.require('Helpers');
    var config = formelo.require('config');

    var customerID = null;
    var customerData = null;
    var billingData = null;

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
    formelo.event().onResult(function(data){
        if (data && data.mode == 'billing'){
            billingData = data.data;
            checkout();
        } else {
            Helpers.showWaiting('#cart-placeholder');
            showItemsInCart();
        }
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
            if (billingData == null) {
                // Fetch billing Addresses
                if (config.inProductionMode()){
                    showMessage('Loading Addresses');
                }
                MoltinManager.customers.getAddressForCustomer(customerID, function(data){
                    console.log(data);
                    if (!data.length){
                        showMessage('No shipping address found.');
                        formelo.navigation().openActivity('billing', {customerData : customerData, customerID : customerID});
                    } else {
                        formelo.navigation().openActivity('billing', {customerData : customerData, customerID : customerID});
                    }
                }, function(err){
                    console.error(err);
                });
            } else {
                checkout();
            }
        });
    }
    function checkout(){
        if (billingData === null) {
            billingData['first_name'] = customerData['name'];
            billingData['lastname_name'] = customerData['name'];
            console.log('Checking out that ass...');
            MoltinManager.cart.checkout(customerID, billingData, function (data) {
                console.log('Ass checked out ' + data);
                showItemsInCart();
            }, function(err){
                console.log('An error occured '+err);
            })
        }
    }
    function customise(){
        formelo.html().get.header.title().html("My Cart");
    }
    function showItemsInCart(){
        UserManager.showRegistration(function(data){
            customerID = data.id;
            customerData = data;
            MoltinManager.cart.getItemsInCart(data.id, function(data){
                console.log(JSON.stringify(data));
                populateCheckout(data);
            }, function(err){
                console.error(JSON.stringify(err));
                Helpers.showEmptyState('#cart-placeholder', 'Error', 'An error occured. Please try again.');
            });
        }, function(err){
            console.error(err);
            Helpers.showEmptyState('#cart-placeholder', 'Error', 'User not found.');
        });
    }
    function populateCheckout(data){
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
            return Helpers.showEmptyState('#cart-placeholder', 'Empty', 'No Items in cart yet');
        } else {
            formelo.ui().gridAdapter(_data, '#cart-placeholder').attach(function(unique){
                showDescription(unique);
            });
            showCheckoutButton();
        }
    }
    function showDescription(unique) {
        formelo.navigation().openActivity('description', {productID : unique});
    }
}());