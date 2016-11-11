(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    formelo.event().onCreate(function(){
        // Entry point of this application
        footer.build('activity');
        fetchActivities();
        showOptions();
        formelo.html().get.header.title().html('Activities');
    });
    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    formelo.event().onResult(function(){
        fetchActivities();
    });

    function showOptions(){
        var options = [{
            name : 'Add',
            image : 'http://freeflaticons.com/wp-content/uploads/2014/09/add-copy-1410527302g8kn4.png',
            unique : 'add'
        }];
        formelo.ui().actionBars(options, function(unique){
            if (unique == 'add'){
                formelo.navigation().openActivity('add-activity');
            }
        });
    }
    function showResult(data){
        var _data = [];
        if (!data){
            return false;
        }
        data.forEach(function(item){
            var title = item.subject;
            var description = moment(item.due_date).format('MMM d') + ' ' + item.due_time + ' . ' + item.person_name + ' . ' + item.org_name;
            var image = 'img/bg/'+title.toUpperCase().charAt(0)+'.gif';
            _data.push({
                name : title,
                description : description,
                unique : item.id,
                time : status,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#activity-placeholder').attach(function(unique){
            formelo.ui().showNativeOptions('Actions', '', ['Mark as Done', 'Edit Activity'], function(index){
                if (index == 1){
                    markAsDone(unique);
                } else {
                    formelo.navigation().openActivity('add-activity', {
                        mode : 'edit',
                        activityID : unique
                    });
                }
            });
        });
    }
    function markAsDone(activityID){
        PipedriveManager.activity.editActivity(activityID, {done : 1}, function(data){
            fetchActivities();
        }, function(err){
            console.error(err);
        });
    }
    function fetchActivities(){
        var waiting = Helpers.showWaiting('#activity-placeholder');
        PipedriveManager.activity.getAllActivities(function(result){
            waiting.stop();
            if (result.data && result.data.length){
                showResult(result.data);
            } else {
                Helpers.showEmptyState('#activity-placeholder', 'Empty', 'Empty State');
            }
        }, function(){
            waiting.error();
        }, {});
    }
}());