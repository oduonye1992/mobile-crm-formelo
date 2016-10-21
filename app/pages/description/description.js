(function(){
    'use strict';
    var productID = null;

    var MoltinManager = formelo.require('MoltinManager');
    var UserManager = formelo.require('UserManager');
    var Helpers = formelo.require('Helpers');
    var config = formelo.require('config');

    formelo.event().onCreate(function(){
        // Entry point of this application
        resetProductDescription();
        getProductDescription(productID);
        customise();
    });
    formelo.event().onIntent(function(params){
        // Receive parameters from calling page
        productID = params.detail['productID'];
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });

    function customise(){
        formelo.html().get.header.title().html("Product Description");
    }
    function isProductInCart(productID){
        UserManager.showRegistration(function(userData){
            console.log('Fetching '+productID+ ' in cart '+userData.id);
            MoltinManager.cart.isProductInCart(productID, userData.id, function(data){
                console.log(JSON.stringify(data));
                if (data.in_cart){
                    showAddedToCartButton(userData.id);
                } else {
                    showAddToCartButton();
                }
            }, function(err){
                console.log(err);
            });
        }, function(err){
            console.log(err);
        });
    }
    function showAddedToCartButton(id) {
        var data = [
            {
                'icon' : 'fa fa-check',
                'text' : 'Already in Cart',
                'unique' : id
            }
        ];
        formelo.ui().footer(data, function(unique){
            console.log('Removing '+productID+ ' from cart '+unique);
            MoltinManager.cart.deleteItemFromCart(productID, unique, function(data){
                console.log(data);
                formelo.navigation().result();
            }, function(err){
                console.error(err);
            });
        });
    }
    function showAddToCartButton() {
        var data = [
            {
                'icon' : 'fa fa-shopping-cart',
                'text' : 'Add to Cart',
                'unique' : productID
            }
        ];
        formelo.ui().footer(data, function(data){
                if (config.inProductionMode()){
                    formelo.ui().spinner.show();
                }
                UserManager.showRegistration(function(data){
                    MoltinManager.cart.addToCart(data.id, productID, 1, function(data){
                        if (config.inProductionMode()){
                            formelo.ui().spinner.hide();
                            showMessage('Added to Cart.');
                        }
                        console.log('Added');
                        console.log(data);
                        //formelo.navigation().result();
                    }, function(err){
                        console.error('[Add To Cart]' + JSON.stringify(err));
                    });
                }, function(err){
                    if (config.inProductionMode()){
                        formelo.ui().spinner.hide();
                    }
                    console.error(err);
                });
        });
    }
    function resetProductDescription(){
        $('#description_image').attr('src', 'img/loading.png');
        $('#description_name').html('Please wait');
        $('#description_description').html('Loading Product details');
    }
    function showProductDescription(data) {
        var defaultImg = "https://s-media-cache-ak0.pinimg.com/736x/63/8b/cd/638bcd252d51340cb0d645adbf19eac3.jpg";
        $('#description_name').html(data.title);
        $('#description_description').html(data.description);
        $('#description_image').attr('src', (data && data.images && data.images.length && data.images[0].url) ? data.images[0].url.https : defaultImg);
    }
    function getProductDescription(id){
        var waiting = Helpers.showWaiting('#description-placeholder');
        MoltinManager.products.getProductByID(id, function(data){
            waiting.stop();
            showProductDescription(data);
            showAddToCartButton();
        }, function(err){
            waiting.error('Error', 'Could not fetch details');
            alert(JSON.stringify(err));
        })
    }
}());