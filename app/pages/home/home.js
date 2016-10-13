(function(){
    'use strict';
    var footer = formelo.require('footer');
    var config = formelo.require('config');
    var Helpers = formelo.require('Helpers');
    var MoltinManager = formelo.require('MoltinManager');
    var UserManager = formelo.require('UserManager');

    formelo.event().onCreate(function(){
            // Entry point of this application
        Helpers.showWaiting('#homeContainer');
        UserManager.init(function(){
            footer.build('home');
            customise();
            MoltinManager.authenticate(function(aa){
                MoltinManager.access_token = aa.access_token;
                showCategories();
                showAddButton();
            });
        });
    });
    formelo.event().onResult(function(){
        var waiting = showWaiting('#homeContainer');
        showCategories();
    });
    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
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
            formelo.navigation().openActivity('create-category', { mode : 'create'});
        });
    };
    function customise(){
        formelo.html().get.header.title().html("Adamu's Apparels");
    }
    function showCategories () {
        MoltinManager.categories.getAll(function(data){
            // Parse data
            var colours = [
                '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
                '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
                '#f1c40f', '#e67e22', '#e74c3c', '#ecf0f1', '#95a5a6',
                '#f39c12', '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'
            ];
            var _data = [];
            data.forEach(function(item){
                _data.push({
                    'text' : item.title,
                    'colour' : colours[Math.floor(Math.random()*colours.length)],
                    'unique' : item.id
                });
            });
            formelo.ui().bareList(_data, '#homeContainer', function(unique){
                formelo.navigation().openActivity('details', {categoryID : unique});
            });
        }, function(err){
            alert(JSON.stringify(err));
        });
    }
}());