(function(){
    'use strict';
    var config = formelo.require('config');
    var footer = formelo.require('footer');

    formelo.event().onCreate(function(){
        // Entry point of this application
        footer.build('settings');
        showSetupCategories();
        customise();
    });

    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });

    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
        overrideBackButton();
    });

    function customise(){
        formelo.html().get.header.title().html("Store Setup");
        footer.build('settings');
    }
    function showSetupCategories(id){
        var data = [
            {
                name : 'Social Media Accounts',
                description : 'Link your social media accounts to automatically fetch and post product',
                image : 'https://www.seeklogo.net/wp-content/uploads/2016/05/instagram-icon-logo-vector-download.jpg',
                unique: 'smc'
            },
            {
                name : 'Basic Store Settings',
                description : 'Setup basic store items',
                image : 'http://image.flaticon.com/icons/png/512/60/60473.png',
                unique: 'bss'
            },
            {
                name : 'Orders',
                description : 'Stats of pending store orders',
                image : 'http://image.flaticon.com/icons/png/512/20/20826.png',
                unique: 'ss'
            }
        ];
        formelo.ui().gridAdapter(data, '#setup-categories-placeholder').attach(function(unique){
            if (unique == 'smc'){
                formelo.navigation().openActivity('social-media-settings')
            } else if (unique == 'bss') {
                formelo.navigation().openActivity('basic-store-settings')
            } else if (unique == 'ss'){
                formelo.navigation().openActivity('orders');
            }
        })
    }
    function overrideBackButton(){
        formelo.navigation().stopPropagation();
        formelo.close();
    }
}());