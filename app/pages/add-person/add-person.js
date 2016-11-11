(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    var person = null;
    var mode = null;

    formelo.event().onCreate(function(){
        // Entry point of this application
        reset();
        bindEvents();
        showOptions();
        if (mode == 'edit'){
            formelo.html().get.header.title().html('Edit Contact');
            populateData();
        } else {
            formelo.html().get.header.title().html('Add Contact');
        }
    });
    formelo.event().onIntent(function(params){
        var data = params.detail;
        person = params.detail.person;
        mode = params.detail.mode;
        // Receive parameters from calling page
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    formelo.event().onResult(function(data){
        handleResult(data.detail);
    });

    function populateData(){
        $('#contact_person').val(person.name);
        $('#contact_organization').val(person.org_name ? person.org_name : '').attr('data-id', (person.org_id && person.org_id.value) ? person.org_id.value : '');
        $('#contact_phone').val(person.phone[0] ? person.phone[0].value : '');
        $('#contact_email').val(person.email[0].value ? person.phone[0].value : '');
        $('#contact_owner').val(person.owner_name).attr('data-id', person.owner_id.id);
    }
    function handleResult(data){
        if (data.type == 'organization') {
            $('#contact_organization').val(data.text).attr('data-id', data.id);
        } else if (data.type == 'users') {
            $('#contact_owner').val(data.text).attr('data-id', data.id);
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
                if (mode == 'edit'){
                    edit();
                } else {
                    submit();
                }
            }
        });
    }
    function bindEvents(){
        $('#contact_organization').click(function(){
            formelo.navigation().openActivity('organization-chooser');
        });
        $('#contact_owner').click(function(){
            formelo.navigation().openActivity('users-chooser');
        });
    }
    function getValues(){
        var person          = $('#contact_person').val();
        var organization    = $('#contact_organization').attr('data-id');
        var owner           = $('#contact_owner').attr('data-id');
        var phone           = $('#contact_phone').val();
        var email           = $('#contact_email').val();
        if (!(person && owner))
        {
            throw new Error('Kindly check your form and try again');
        }
        return  {
            name : person,
            email : email,
            owner_id : owner,
            phone : phone,
            org_id : organization
        };
    }
    function reset(){
        $('#contact_person').val('');
        $('#contact_organization').val('').attr('data-id', '');
        $('#contact_owner').val('').attr('data-id', '');
        $('#contact_phone').val();
        $('#contact_email').val();
    }
    function submit(){
        Helpers.startLoading();
        PipedriveManager.contact.addContact(getValues(), function(data){
            Helpers.stopLoading();
            formelo.navigation().result({
                type : 'add-person'
            });
        }, function(err){
            Helpers.stopLoading();
            console.error(err);
        });
    }

    function edit(){
        Helpers.startLoading();
        PipedriveManager.contact.editContact(person.id, getValues(), function(data){
            Helpers.stopLoading();
            formelo.navigation().result({
                type : 'add-person'
            });
        }, function(err){
            Helpers.stopLoading();
            console.error(err);
        });
    }
}());