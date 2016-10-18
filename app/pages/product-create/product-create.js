(function(){
    'use strict';
    var MoltinManager = formelo.require('MoltinManager');
    var Helpers = formelo.require('Helpers');
    var mode = 'create';
    var categoryID = null;
    var productID = null;

    formelo.event().onCreate(function(){
        // Entry point of this application
        customise();
        showSaveButton();
    });

    formelo.event().onIntent(function(params){
        // Receive parameters from calling page
        categoryID = params.detail['categoryID'];
        productID = params.detail['productID'];
        mode = params.detail['mode'];
    });

    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });

    function showSaveButton(){
        var data = [{
            'name' : mode == 'create' ? "Save" : "Update",
            'unique' : mode
        }];
        formelo.ui().actionBars(data, function(unique){
             if (unique == 'create'){
                 submit();
             } else {
                 // TODO Update Product
             }
        });
    };
    function customise(){
        formelo.html().get.header.title().html(mode == 'create' ? 'Add' : 'Update'+ " Product");
    }
    function getValues(){
        var title = $('#product_title').val();
        var description = $('#product_description').val();
        var price = $('#product_price').val();
        var sku = $('#product_sku').val();
        var stock_level = $('#product_stock_level').val();
        if (!(title && description &&
            price && sku && stock_level))
        {
            throw new Error('Kindly check your form and try again');
        }
        var stock_status = 1;
        var slug = title.trim().toLowerCase()+'_'+Helpers.str_random();
        var status = 1;
        var category = categoryID;
        var requires_shipping = 1;
        var tax_band = "1359674746093961681";
        var catalog_only = 0;
        return  {
            title : title,
            description : description,
            price : price,
            sku : sku,
            stock_level : stock_level,
            stock_status : stock_status,
            slug : slug,
            status : status,
            category : category,
            requires_shipping : requires_shipping,
            tax_band : tax_band,
            catalog_only : catalog_only
        };
    }
    function submit(){
        try {
            var data = getValues();
            console.log(data);
            MoltinManager.products.create(data, function(data){
                alert(JSON.stringify(data));
                formelo.navigation().result();
            }, function(err){
                alert(JSON.stringify(err));
            });
        } catch (e) {
            alert(e.message);
        }
    }
}());