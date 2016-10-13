(function(){
    'use strict';
    var categoryID = null;
    var footer = formelo.require('footer');
    var MoltinManager = formelo.require('MoltinManager');
    var Helpers = formelo.require('Helpers');

    formelo.event().onCreate(function(){
        // Entry point of this application
        footer.build('home');
        customise();
        showAddButton();
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
    var showWaiting = function(placeholder){
        var previousHtml = $(placeholder).html();
        var loadingHtml =   '<div class="container-xs-height full-vh">' +
            '<div class="row-xs-height">'+
            '<div class="col-xs-height col-middle">'+
            '<div class="error-container text-center">'+
            '<h1 class="error-number" style="color: grey;">' +
            '<div class="progress-circle-indeterminate"></div>' +
            '</h1>'+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>';
        $(placeholder).html(loadingHtml);
        return {
            stop : function(){
                $(placeholder).html(previousHtml);
            }
        }
    };
    var customise = function(){
        formelo.html().get.header.title().html("Eye Glasses");
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
                    'description' : item.description,
                    'image' : (item.images[0] && item.images[0].url && item.images[0].url.https) ? item.images[0].url.https : 'img/loading.png',
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