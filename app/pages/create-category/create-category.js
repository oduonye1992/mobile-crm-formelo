(function(){
    'use strict';
    var MoltinManager = formelo.require('MoltinManager');
    var categoryID = null;
    var mode = 'create';
    formelo.event().onCreate(function(){
        // Entry point of this application
        customise();
        showSaveButton();
    });

    formelo.event().onIntent(function(params){
        var data = params.detail;
        categoryID = params.detail['categoryID'];
        // Receive parameters from calling page
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
        formelo.html().get.header.title().html(mode == 'create' ? 'Add Category' : 'Update Category');
    }
    function getValues(){
        var title = $('#category_title').val();
        var description = $('#category_description').val();
        if (!(title && description)) {
            throw new Error('Kindly check your form and try again');
        }
        var slug = title.trim().toLowerCase();
        var status = 1;
        return  {
            title : title,
            description : title,
            slug : slug,
            status : status
        };
    }
    function submit(){
        try {
            var data = getValues();
            console.log(data);
            MoltinManager.categories.create(data, function(data){
                //alert(JSON.stringify(data));
                formelo.navigation().result();
            }, function(err){
                alert(JSON.stringify(err));
            });
        } catch (e) {
            alert(e.message);
        }
    }
}());