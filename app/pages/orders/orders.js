(function(){
    'use strict';
    var MoltinManager = formelo.require('MoltinManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');
    formelo.event().onCreate(function(){
        // Entry point of this application
        footer.build('settings');
        fetchOrders();
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
    function customise(){
        formelo.html().get.header.title().html("My Orders");
    }
    function fetchOrders (){
        var loader = Helpers.showWaiting('#orders-placeholder');
        MoltinManager.orders.listAllOrders(function(data){
                console.log(data);
                loader.stop();
                var _data = [];
                if (!data.length){
                    return loader.error('Empty', 'No Orders Available yet');
                }
                data.forEach(function(item){
                    var image = "img/bg/"+item.customer.value.charAt(0).toUpperCase()+".gif";
                    _data.push({
                        name : item.customer.value,
                        description : item.currency_code + ' ' + item.total,
                        time : item.created_at,
                        unique : item.id,
                        image : image
                    });
                });
                formelo.ui().listAdapter(_data, '#orders-placeholder').attach(function(unique){
                    console.log('Mark as authorized');
                })
            },
        function(err){
            console.log(err);
            loader.error(':(', 'An Error has occured');
        })
    }
}());

