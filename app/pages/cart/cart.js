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
        //overrideBackButton();
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

    function showCartSummary(cartSummary){
        var totalAmount = cartSummary.totals.post_discount.formatted.without_tax;
        var html = '<div class="row" style="height: 20vh;background-color: cornflowerblue;">'+
                        '<div class="col-xs-6" style="color:white;text-align:center;height: 100%;">'+
                            '<p style="font-size: x-large;line-height: 20vh;">Total</p>'+
                        '</div>'+
                        '<div class="col-xs-6" style="color:white;text-align:center;line-height:100%;height: inherit;">'+
                            '<p style="font-size: x-large;line-height: 20vh;" id="total_amount">'+totalAmount+'</p>'+
                        '</div>'+
                    '</div>';
        $('#cart-summary').html(html);
    }
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
                    formelo.ui().spinner.show();
                }
                MoltinManager.customers.getAddressForCustomer(customerID, function(data){
                    console.log(data);
                    if (config.inProductionMode()){
                        showMessage('Loading Addresses');
                        formelo.ui().spinner.hide();
                    }
                    if (!data.length){
                        showMessage('No shipping address found.');
                        formelo.navigation().openActivity('billing', {customerData : customerData, customerID : customerID});
                    } else {
                        formelo.navigation().openActivity('billing', {customerData : customerData, customerID : customerID});
                    }
                }, function(err){
                    if (config.inProductionMode()){
                        formelo.ui().spinner.hide();
                    }
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
        $('#cart-summary').html("");
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
    function populateCheckout(cartData){
        var data = cartData.contents;
        var _data = [];
        var isEmpty = true;
        for(var key in data){
            if (data[key]) {
                var item = data[key];
                isEmpty = false;
                _data.push({
                    'name' : item.title,
                    'description' : item.price.value,
                    'image' : (item.images[0] && item.images[0].url && item.images[0].url.https) ? item.images[0].url.https : 'https://s-media-cache-ak0.pinimg.com/236x/fc/7e/ce/fc7ece8e8ee1f5db97577a4622f33975.jpg',
                    'unique' : item.id
                });
            }
        }
        if (isEmpty){
            return Helpers.showEmptyState('#cart-placeholder', 'Empty', 'No Items in cart yet');
        } else {
            formelo.ui().gridAdapter(_data, '#cart-placeholder').attach(function(unique){
                if (config.inProductionMode()){
                    formelo.ui().showNativeOptions('Options', 'What would you want to do?', ['View Item', 'Remove from Cart'], function(index){
                        if (index == 1){
                            showDescription(unique);
                        } else {
                            removeFromCart(unique);
                        }
                    })
                } else {
                    if (window.confirm('Remove from cart')){
                        showDescription(unique);
                    } else {
                        removeFromCart(unique);
                    }
                }
            });
            showCartSummary(cartData);
            showCheckoutButton();
        }
    }
    function showDescription(unique) {
        formelo.navigation().openActivity('description', {productID : unique});
    }
    function removeFromCart(unique){
        console.log('Removing '+unique+' from '+customerID);
        if (config.inProductionMode()){
            formelo.ui().spinner.show();
        }
        MoltinManager.cart.removeFromCart(customerID, unique, function(data){
            if (config.inProductionMode()){
                formelo.ui().spinner.hide();
                showMessage("Removed");
            }
            showItemsInCart();
        }, function(err){
            if (config.inProductionMode()){
                formelo.ui().spinner.hide();
                showMessage("An Error occured");
            }
            console.error(err);
        });
    }
}());