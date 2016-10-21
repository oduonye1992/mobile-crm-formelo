(function(){
    'use strict';
    var categoryID = null;
    var footer = formelo.require('footer');
    var MoltinManager = formelo.require('MoltinManager');
    var Helpers = formelo.require('Helpers');
    var config = formelo.require('config');

    formelo.event().onCreate(function(){
        // Entry point of this application
        footer.build('home');
        customise();
        if (config.isAdmin){
            showAddButton();
        }
        Helpers.showWaiting('#details-placeholder');
        showItemsInCategory(categoryID);
    });
    formelo.event().onResult(function(){
        Helpers.showWaiting('#details-placeholder');
        showItemsInCategory(categoryID);
    });
    formelo.event().onIntent(function(params){
        // Receive parameters from calling page
        categoryID = params.detail['categoryID'];
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });

    var showAddButton = function(){
        var data = [{
             'name' : 'Add',
             'unique' : 'add'
        }];
        formelo.ui().actionBars(data, function(unique){
            // Open create product page
            formelo.navigation().openActivity('product-create', {categoryID : categoryID, mode : 'create'});
        });
    };
    var showEmptyState = function(placeholder, title, message){
        var previousHtml = $(placeholder).html();
        var title  = title || 'Empty';
        var message  = message || 'Nothing Here';
        var loadingHtml =   '<div class="container-xs-height full-vh">' +
            '<div class="row-xs-height">'+
            '<div class="col-xs-height col-middle">'+
            '<div class="error-container text-center">'+
            '<h1 class="error-number" style="color: grey;">'+title+'</h1>'+
            '<h3 style="color: grey;">'+message+'</h3>'+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>';
        $(placeholder).html(loadingHtml);
    };
    var customise = function(){
        formelo.html().get.header.title().html("Product List");
    };
    var showItemsInCategory = function(id){
        MoltinManager.products.getProductsByCategory(id, function(data){
            var _data = [];
            if (!data.length){
                return showEmptyState('#details-placeholder');
            }
            data.forEach(function(item){
                _data.push({
                    'name' : item.title,
                    'description' : item.price.value,
                    'image' : (item.images[0] && item.images[0].url && item.images[0].url.https) ? item.images[0].url.https : 'https://s-media-cache-ak0.pinimg.com/236x/fc/7e/ce/fc7ece8e8ee1f5db97577a4622f33975.jpg',
                    'unique' : item.id
                });
            });
            formelo.ui().gridAdapter(_data, '#details-placeholder').attach(function(unique){
                showDescription(unique);
            })
        }, function(error){
            console.log(error);
        });
    };
    var showDescription = function(unique) {
        formelo.navigation().openActivity('description', {productID : unique});
    };
}());