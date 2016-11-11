(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    var dealID = null;
    var deal = null;
    var dealStatus = 'open';

    formelo.event().onCreate(function(){
        fetchDealInformation();
        fetchFlowsForDeal();
        getFilesForDeal();
        showEditOptionMenu();
        bindEvents();
        showFooter();
        formelo.html().get.header.title().html('Deal Details');
    });

    formelo.event().onIntent(function(params){
        dealID =  params.detail.dealID;
        // Receive parameters from calling page
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    formelo.event().onResult(function(data){
        // Listen for Deal Status change
        handleResult(data.detail);
    });

    var pipelineMap = {
        1 : 'Lead In',
        2 : 'Contact Made',
        3 : 'Demo Scheduled',
        4 : 'Proposal Made',
        5 : 'Negotiations Started'
    };
    var dealStat = {
        wonDeal : function(){
            //$('#deal-won').attr('style', 'color: white;border: 1px solid white;padding: 5%;border-radius: 10%;');
            $('#deal-lost').html('Closed - Won').attr('class', 'btn btn-sm btn-success');
            editDeal({status : 'won'});
        },
        lostDeal : function(){
            //$('#deal-won').attr('style', 'color: black;border: 1px solid black;padding: 5%;border-radius: 10%;');
            $('#deal-lost').html('Closed - Lost').attr('class', 'btn btn-sm btn-danger');
            editDeal({status : 'lost'});
        },
        openDeal : function(){
            //$('#deal-won').attr('style', 'color: black;border: 1px solid black;padding: 5%;border-radius: 10%;');
            $('#deal-lost').html('Open').attr('class', 'btn btn-sm btn-default');
            editDeal({status : 'open'});
        },
        style : function(mode){
            if (mode == 'won') {
                dealStat.wonDeal();
            } else if (mode == 'lost') {
                dealStat.lostDeal();
            } else if (mode == 'open') {
                dealStat.openDeal();
            }
        }
    };
    function changeStatus(type){
        console.log(type);
        dealStat.style(type);
    }
    var generalPreview = function (data){
        var map = {
            'owner_name' : {
                formattedName  : 'Owner'
            },
            'update_time' : {
                formattedName  : 'Last Updated',
                transform : function(data){
                    return moment(data).fromNow();
                }
            },
            'cc_email' : {
                formattedName : 'Email BCC'
            }
        };
        var html = '';
        for(var key in data){
            if ((typeof data[key] !== 'object') && map[key]){
                var val = map[key].hasOwnProperty('transform') ? map[key].transform(data[key]) : data[key];
                html += '<div class="form-group form-group-default">'+
                            '<label>'+map[key].formattedName+'</label>'+
                            '<input style="color: black;" readonly id="deal_value" value="'+val+'" class="form-control">'+
                        '</div>';
            }
        }
        console.log(html);
        $('#deal-general-tab').html(html);
    };
    function handleResult(data){
        console.log(data);
        if (data.type == 'pipeline'){
            $('#deal-status').val(data.text).attr('data-id', data.id);
            editDeal({stage_id : data.id});
            fetchDealInformation();
        } else if (data.type == 'change-status') {
            console.log(JSON.stringify(data));
            changeStatus(data.id);
        } else if (data.type == 'add-note'){

        } else if (data.type == 'add-activity'){

        }
        fetchFlowsForDeal();
        //fetchDealInformation();
        getFilesForDeal();
    }
    function showEditOptionMenu(){
        var data = [
            {
                'image' : '',
                'name' : 'Edit',
                'unique' : 'edit'
            }
        ];
        formelo.ui().actionBars(data, function(data){
            formelo.navigation().openActivity('add-deal', {
                mode : 'edit',
                deal : deal
            });
        });
    }
    function showFooter() {
        var data = [
            {
                'icon' : 'fa fa-plus-circle',
                'text' : 'Add',
                'unique' : 'add'
            }
        ];
        formelo.ui().footer(data, function(data){
            showActivities();
        });
    }
    function showActivities(){
        var id = "asasasas";
        var mod = formelo.ui().modal('Add New', '<div id="'+id+'"></div>');
        var data = [
            {
                'image' : 'http://us.123rf.com/450wm/robuart/robuart1310/robuart131000102/23239737-flat-icons-for-web-and-mobile-applications-calendar-icon-long-shadow-design.jpg',
                'name' : 'Activity',
                'unique' : 'activity'
            },
            {
                'image' : 'https://cdn2.iconfinder.com/data/icons/metro-ui-icon-set/512/Sticky_Notes.png',
                'name' : 'Note',
                'unique' : 'note'
            },
            {
                'image' : 'http://icons.iconarchive.com/icons/graphicloads/100-flat/256/camera-icon.png',
                'name' : 'Photo',
                'unique' : 'photo'
            },
            {
                'image' : 'http://www.myiconfinder.com/uploads/iconsets/acc8b94ae5e7383b0e7898928121321c-microphone.png',
                'name' : 'Audio',
                'unique' : 'audio'
            }
        ];
        formelo.ui().optionsAdapter(data, '#'+id).attach(function(unique){
            if (unique == 'activity'){
                formelo.navigation().openActivity('add-activity', {
                    mode : 'add',
                    deal : deal
                });
            } else if (unique == 'photo') {
                Helpers.takePicture({
                    deal_id : deal.id
                }, function(data){
                   console.log(data);
                }, function(err){
                   console.error(err);
                });
            } else if (unique == 'note') {
                formelo.navigation().openActivity('notes', {
                    deal : deal
                });
            } else if (unique == 'audio') {
                formelo.navigation().openActivity('audio', {
                    deal_id : deal.id
                });
            }
            mod.close();
        });
    }
    function showActivityResult(data){
        var _data = [];
        if (!data)
            return false;
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
        formelo.ui().listAdapter(_data, '#deals-flows-tab').attach(function(unique){
            formelo.navigation().openActivity('add-activity', {
                activityID : unique,
                mode : 'edit'
            })
        });
    }
    function populateGeneralData(data){
        $('#organization-name').html(data.org_name);
        $('#main-title').html(data.title);
        $('#person-name').html(data.person_name);
        $('#deal-amount').html(data.formatted_value);
        $('#deal-status').val(pipelineMap[data.stage_id]).attr('data-id', data.stage_id);
        deal = data;
        dealStatus = data.status;
        dealStat.style(data.status);
    }
    function bindEvents(){
        $('#deal-status').click(function(){
            formelo.navigation().openActivity('pipeline-chooser');
        });
        $('#deal-lost').click(function(){
            formelo.navigation().openActivity('status-chooser');
        });
    }
    function fetchFlowsForDeal(){
        PipedriveManager.deals.getActivitiesForDeal(dealID, function(result){
            showActivityResult(result.data);
        }, function(err){
            console.error(err);
        });
    }
    function fetchDealInformation(){
        PipedriveManager.deals.getDealByID(dealID, function(result){
            populateGeneralData(result.data);
            generalPreview(result.data);
        }, function(err){
            console.error(err);
        })
    }
    function editDeal(data){
        PipedriveManager.deals.editDeal(dealID, data, function(data){
            console.log(data);
        }, function(err){
            console.error(err);
        });
    }
    function populateFiles(data){
        if (!data){
            return false;
        }
        var _data = [];
        data.forEach(function(item){
            var title = item.file_name;
            var description = moment(item.add_time).fromNow();
            var image = 'img/bg/'+title.toUpperCase().charAt(0)+'.gif';
            _data.push({
                name : title,
                description : description,
                unique : item.url,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#deals-files-tab').attach(function(unique){
            console.log('opening '+unique+'?api_token='+PipedriveManager.access_token);
            formelo.navigation().openBrowser(unique+'?api_token='+PipedriveManager.access_token);
        });
    }
    function getFilesForDeal(){
        PipedriveManager.deals.getAllFiles(dealID, function(data){
            populateFiles(data.data);
        }, function(err){
            console.error(err);
        })
    }
}());