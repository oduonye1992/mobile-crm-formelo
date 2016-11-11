(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    formelo.event().onCreate(function(){
        // Entry point of this application
        reset();
        bindEvents();
        showOptions();
        formelo.html().get.header.title().html('Add Organization');
    });
    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    formelo.event().onResult(function(data){
        handleResult(data.detail);
    });

    function handleResult(data){
        if (data.type == 'users') {
            $('#organization_owner').val(data.text).attr('data-id', data.id);
        }
    }
    function showOptions(){
        var options = [{
            name : 'Done',
            image : 'http://freeflaticons.com/wp-content/uploads/2014/09/add-copy-1410527302g8kn4.png',
            unique : 'done'
        }];
        formelo.ui().actionBars(options, function(unique){
            if (unique == 'done'){
                submit();
            }
        });
    }
    function bindEvents(){
        $('#organization_owner').click(function(){
            formelo.navigation().openActivity('users-chooser');
        });
    }
    function getValues(){
        var name     = $('#organization_name').val();
        var address  = $('#organization_address').val();
        var owner    = $('#organization_owner').attr('data-id');
        if (!(name && owner))
        {
            throw new Error('Kindly check your form and try again');
        }
        return  {
            name : name,
            address : address,
            owner_id : owner
        };
    }
    function reset(){
        $('#organization_name').val('');
        $('#organization_address').val('');
        $('#organization_owner').val('').attr('data-id', '');
    }
    function submit(){
        PipedriveManager.organization.addOrganization(getValues(), function(data){
            formelo.navigation().result(data);
        }, function(err){
            console.error(err);
        });
    }
}());