(function(){
    'use strict';
    var productID = null;
    var MoltinManager = formelo.require('MoltinManager');
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
    function showAddToCartButton(unique) {
        var data = [
            {
                'icon' : 'fa fa-shopping-cart',
                'text' : 'Add to Cart',
                'unique' : unique
            }
        ];
        formelo.ui().footer(data, function(data){
            alert('item added to cart');
        });
    }
    function resetProductDescription(){
        $('#description_image').attr('src', 'img/loading.png');
        $('#description_name').html('Please wait');
        $('#description_description').html('Loading Product details');
    }
    function showProductDescription(data) {
        $('#description_image').attr('src', data.images[0].url.https);
        $('#description_name').html(data.title);
        $('#description_description').html(data.description);
    }
    function getProductDescription(id){
        MoltinManager.products.getProductByID(id, function(data){
            showProductDescription(data);
            showAddToCartButton();
        }, function(err){
            alert(JSON.stringify(err));
        })
    }
}());