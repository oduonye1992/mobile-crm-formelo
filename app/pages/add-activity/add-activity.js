(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');
    var deal = null;
    var person = null;
    var organization = null;
    var mode = null;
    var activityID = null;
    var activity = null;

    formelo.event().onCreate(function(){
        // Entry point of this application
        reset();
        bindEvents();
        showOptions();
        if (mode == 'edit'){
            formelo.html().get.header.title().html('Edit Activity');
            getActivityByID();
        } else {
            formelo.html().get.header.title().html('Add Activity');
            populateValues();
        }
    });
    formelo.event().onIntent(function(params){
        var data = params.detail;
        deal = params.detail.deal;
        person = params.detail.person;
        organization = params.detail.organization;
        mode = params.detail.mode;
        activityID = params.detail.activityID;
        // Receive parameters from calling page
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    formelo.event().onResult(function(data){
        handleResult(data.detail);
    });

    function populate(data){
        $('#activity_type').val(data.type).attr('data-id', data.type);
        $('#activity_subject').val(data.subject);
        $('#activity_date').val(data.due_date);
        $('#activity_owner').val(data.owner_name);
        $('#activity_person').val(data.person_name).attr('data-id', data.person_id);
        $('#activity_organization').val(data.org_name).attr('data-id', data.org_id);
        $('#activity_deal').val(data.deal_title).attr('data-id', data.deal_id);
    }
    function getActivityByID(){
        PipedriveManager.activity.getActivityByID(activityID, function(data){
            populate(data.data);
        }, function(err){
            console.error(err);
        });
    }
    function handleResult(data){
        if (data.type == 'person'){
            $('#activity_person').val(data.text).attr('data-id', data.id);
        } else if (data.type == 'organization') {
            $('#activity_organization').val(data.text).attr('data-id', data.id);
        } else if (data.type == 'users') {
            $('#activity_owner').val(data.text).attr('data-id', data.id);
        } else if (data.type == 'activity_type') {
            $('#activity_type').val(data.text).attr('data-id', data.id);
        } else if (data.type == 'deals') {
            $('#activity_deal').val(data.text).attr('data-id', data.id);
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
        $('#activity_person').click(function(){
            formelo.navigation().openActivity('person-chooser');
        });
        $('#activity_type').click(function(){
            formelo.navigation().openActivity('activity-type-chooser');
        });
        $('#activity_deal').click(function(){
            formelo.navigation().openActivity('deal-chooser');
        });
        $('#activity_organization').click(function(){
            formelo.navigation().openActivity('organization-chooser');
        });
        $('#activity_owner').click(function(){
            formelo.navigation().openActivity('users-chooser');
        });
    }
    function populateValues(){
        if (deal){
            $('#activity_deal').val(deal.title).attr('data-id', deal.id);
        }
        if (person){
            $('#activity_person').val(person.name).attr('data-id', person.id);
        }
        if (organization){
            $('#activity_organization').val(organization.name).attr('data-id', organization.id);
        }
    }
    function getValues(){
        var person          = $('#activity_person').attr('data-id');
        var type            = $('#activity_type').attr('data-id');
        var deal            = $('#activity_deal').attr('data-id');
        var organization    = $('#activity_organization').attr('data-id');
        var owner           = $('#activity_owner').attr('data-id');
        var date            = $('#activity_date').val();
        var subject         = $('#activity_subject').val();
        if (!(type && subject))
        {
            throw new Error('Kindly check your form and try again');
        }
        return  {
            person_id : person,
            type : type,
            user_id : owner,
            org_id : organization,
            due_date : date,
            deal_id : deal,
            subject : subject
        };
    }
    function reset(){
        $('#activity_person').val('').attr('data-id', '');
        $('#activity_type').val('').attr('data-id', '');
        $('#activity_deal').val('').attr('data-id', '');
        $('#activity_organization').val('').attr('data-id', '');
        $('#activity_owner').val('').attr('data-id', '');
        $('#activity_date').val('');
        $('#activity_subject').val('');
    }
    function submit(){
        Helpers.startLoading();
        PipedriveManager.activity.addActivity(getValues(), function(data){
            Helpers.stopLoading();
            formelo.navigation().result({type : 'add-activity'});
        }, function(err){
            Helpers.stopLoading();
            console.error(err);
        });
    }

}());