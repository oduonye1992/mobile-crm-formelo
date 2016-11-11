(function(){
    'use strict';
    var dealID = null;
    var personID = null;
    var orgID = null;

    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    formelo.event().onCreate(function(){
        // Entry point of this application
        showEditOptionMenu();
        $('#note-date').html(moment().format('Do MMMM YYYY h:mm a'));
        formelo.html().get.header.title().html('Notes');
    });
    formelo.event().onIntent(function(params){
        dealID = params.detail.dealID;
        personID = params.detail.personID;
        orgID = params.detail.orgID;
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });

    function showEditOptionMenu(){
        var data = [
            {
                'image' : '',
                'name' : 'Done',
                'unique' : 'done'
            }
        ];
        formelo.ui().actionBars(data, function(data){
            submit();
        });
    }
    function getValues(){
        var content = $('#note-content').val();
        if (!(content))
        {
            throw new Error('Kindly check your form and try again');
        }
        return {
            content : content,
            deal_id : dealID,
            person_id : personID,
            org_id : orgID
        }
    }
    function submit(){
        Helpers.startLoading();
        PipedriveManager.actions.addNotes(getValues(), function(data){
            Helpers.stopLoading();
            formelo.navigation().result({
                type : 'add-note'
            });
        }, function(err){
            Helpers.stopLoading();
            console.error(err);
        });
    }
}());