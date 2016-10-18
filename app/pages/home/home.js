(function(){
    'use strict';
    var footer = formelo.require('footer');
    var config = formelo.require('config');
    var Helpers = formelo.require('Helpers');
    var MoltinManager = formelo.require('MoltinManager');
    var UserManager = formelo.require('UserManager');


    formelo.event().onCreate(function(){
            // Entry point of this application
        //UserManager.init(function(){
            footer.build('home');
            customise();
            MoltinManager.authenticate(function(aa){
                MoltinManager.access_token = aa.access_token;
                showCategories();
                showAddButton();
            });
        //});
    });
    formelo.event().onResult(function(){
        //var waiting = showWaiting('#homeContainer');
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
    function bareList(data, placeHolder, callback) {
            var defaults = {
                'icon' : '',
                'text' : '',
                'colour' :  '#2980b9',
                'unique' : null
            };
            if (!data || !data.length){
                return false;
            }
            var html = '';
            var i = 1;
            data.forEach(function(item){
                var newDefault = $.extend({}, defaults, item);
                html += '<div unique="'+item.unique+'" class="row holder-clickable-item" style="height: 20vh;background-color: '+newDefault.colour+';">'+
                    '<div class="col-xs-2" style="">'+
                    '<p style="margin-top: 40%; color: white;font-weight: 400; text-align: center;">'+i+'</p>'+
                    '</div>'+
                    '<div class="col-xs-10">'+
                    '<p style="font-size: xx-large ;font-weight: 400;color: white;text-align: center;line-height: 20vh;margin-left: -20%;">'+newDefault.text+'</p>'+
                    '</div>'+
                    '</div>';
                i++;
            });
            $(placeHolder).html(html);
            $('.holder-clickable-item').click(function(){
                callback($(this).attr('unique'));
            });
    }
    function showCategories () {
        var waiting = Helpers.showWaiting('#homeContainer');
        MoltinManager.categories.getAll(function(data){
            // Parse data

            if (!data.length){
                return waiting.error('Empty', 'No Categories available');
            }
            waiting.stop();
            var colours = [
                '#f1c40f', '#e74c3c', '#3498db', '#1abc9c'
            ];
            var _data = [];
            var q = 0;
            data.forEach(function(item){
                _data.push({
                    'text' : item.title,
                    'colour' : colours[q],
                    'unique' : item.id
                });
                q = q == 3 ? 0 : q + 1;
            });
            bareList(_data, '#homeContainer', function(unique){
                formelo.navigation().openActivity('details', {categoryID : unique});
            });
        }, function(err){
            alert(JSON.stringify(err));
        });
    }
}());