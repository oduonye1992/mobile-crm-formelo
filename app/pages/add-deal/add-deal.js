(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    var person = null;
    var organization = null;
    var deal = null;
    var mode = null;

    formelo.event().onCreate(function(){
        // Entry point of this application
        reset();
        bindEvents();
        showOptions();
        if (mode == 'edit'){
            formelo.html().get.header.title().html('Edit Deal');
            populate();
        } else {
            formelo.html().get.header.title().html('Add Deal');
            populateValues();
        }
    });
    formelo.event().onIntent(function(params){
        var data = params.detail;
        person = params.detail.person;
        deal = params.detail.deal;
        mode = params.detail.mode;
        organization = params.detail.organization;
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    formelo.event().onResult(function(data){
        handleResult(data.detail);
    });

    function handleResult(data){
        if (data.type == 'person'){
            $('#deal_person').val(data.text).attr('data-id', data.id);
        } else if (data.type == 'organization') {
            $('#deal_organization').val(data.text).attr('data-id', data.id);
        } else if (data.type == 'currency') {
            $('#deal_currency').val(data.text).attr('data-id', data.id);
        } else if (data.type == 'users') {
            $('#deal_owner').val(data.text).attr('data-id', data.id);
        } else if (data.type == 'pipeline') {
            $('#deal_pipeline').val(data.text).attr('data-id', data.id);
        }
    }
    function populateValues(){
        if (person){
            $('#deal_person').val(person.name).attr('data-id', person.id);
        }
        if (organization){
            $('#deal_organization').val(organization.name).attr('data-id', organization.id);
        }
    }
    function populate(){
        $('#deal_person').val(deal.person_name).attr('data-id', deal.person_id.value);
        $('#deal_organization').val(deal.org_name).attr('data-id', deal.org_id.value);
        $('#deal_title').val(deal.title);
        $('#deal_value').val(deal.value);
        $('#deal_currency').val('').attr('data-id', deal.currency);
        $('#deal_pipeline').val('').attr('data-id', deal.stage_id);
        $('#deal_owner').val(deal.owner_name).attr('data-id', deal);
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
        $('#deal_person').click(function(){
           formelo.navigation().openActivity('person-chooser');
        });
        $('#deal_organization').click(function(){
            formelo.navigation().openActivity('organization-chooser');
        });
        $('#deal_currency').click(function(){
            formelo.navigation().openActivity('currency-chooser');
        });
        $('#deal_owner').click(function(){
            formelo.navigation().openActivity('users-chooser');
        });
        $('#deal_pipeline').click(function(){
            formelo.navigation().openActivity('pipeline-chooser');
        });
    }
    function getValues(){
        var person          = $('#deal_person').attr('data-id');
        var organization    = $('#deal_organization').attr('data-id');
        var currency        = $('#deal_currency').attr('data-id');
        var owner           = $('#deal_owner').attr('data-id');
        var pipeline        = $('#deal_pipeline').attr('data-id');
        var title           = $('#deal_title').val();
        var value           = $('#deal_value').val();
        if (!(title && value))
        {
            throw new Error('Kindly check your form and try again');
        }
        return  {
            title : title,
            value : value,
            currency : currency,
            user_id : owner,
            person_id : person,
            org_id : organization,
            stage_id : pipeline
        };
    }
    function reset(){
        $('#deal_person').val('').attr('data-id', '');
        $('#deal_organization').val('').attr('data-id', '');
        $('#deal_currency').val('').attr('data-id', '');
        $('#deal_owner').val('').attr('data-id', '');
        $('#deal_pipeline').val('').attr('data-id', '');
        $('#deal_title').val('');
        $('#deal_value').val('');
    }
    function submit(){
        Helpers.startLoading();
        PipedriveManager.deals.addDeals(getValues(), function(data){
            Helpers.stopLoading();
            formelo.navigation().result(data);
        }, function(err){
            Helpers.stopLoading();
            console.error(err);
        });
    }
    function edit(){
        PipedriveManager.deals.editDeal(deal.id, getValues(), function(data){
            formelo.navigation().result({
                type : 'add-deal'
            });
        }, function(err){
            console.error(err);
        });
    }
}());