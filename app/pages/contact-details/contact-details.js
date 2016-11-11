(function(){
    'use strict';
    var PipedriveManager  = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');
    var footer = formelo.require('footer');

    var contactID = null;
    var person = null;

    formelo.event().onCreate(function(){
        // Entry point of this application
        fetchContactInformation();
        fetchFlowsForUser();
        fetchDealsForUser();
        showEditOptionMenu();
        getFilesForContact();
        formelo.html().get.header.title().html('Contact Details');
    });
    formelo.event().onIntent(function(params){
        contactID =  params.detail.contactID;
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

    function handleResult(data){
        console.log(data);
        if (data.type == 'add-note'){
            //fetchFlowsForUser();
        } else if (data.type == 'add-activity'){
            //fetchFlowsForUser();
        }
        fetchFlowsForUser();
        getFilesForContact();
        fetchDealsForUser();
        fetchContactInformation();
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
        $('#general-tab').html(html);
    };
    function showEditOptionMenu(){
        var data = [
            {
                'image' : '',
                'name' : 'Edit',
                'unique' : 'edit'
            }
        ];
        formelo.ui().actionBars(data, function(data){
            formelo.navigation().openActivity('add-person', {
                person : person,
                mode : 'edit'
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
        if (person.email && person.email.length){
            data.push({
                'icon' : 'fa fa-phone',
                'text' : 'Call',
                'unique' : 'mail'
            });
        }
        if (person.phone && person.phone.length){
            data.push({
                'icon' : 'fa fa-edit',
                'text' : 'Send Message',
                'unique' : 'mail'
            });
        }
        formelo.ui().footer(data, function(unique){
            if (unique == 'add'){
                showActivities();
            } else if (unique == 'call'){
                location.href = 'tel:'+person.phone[0].value;
            } else if (unique == 'mail'){
                location.href = 'sms:'+person.email[0].value;
            }
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
                'image' : 'http://rcdcapital.com/wp-content/uploads/2016/02/Hard-Money-Icon-3.png',
                'name' : 'Deal',
                'unique' : 'deal'
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
                    person : person
                });
            } else if (unique == 'deal'){
                formelo.navigation().openActivity('add-deal', {
                    mode : 'add',
                    person : person
                });
            } else if (unique == 'photo') {
                Helpers.takePicture({
                    person : person
                })
            } else if (unique == 'note') {
                formelo.navigation().openActivity('notes', {
                    person : person
                });
            } else if (unique == 'audio') {
                formelo.navigation().openActivity('audio', {
                    person : person
                });
            }
            mod.close();
        });
    }
    function showDealResult(data){
        var _data = [];
        if (!data){
            return false;
        }
        data.forEach(function(item){
            var title = item.title;
            var amount = item.formatted_value;
            var org = item.org_name;
            var person = item.person_name;
            var status = item.status;
            var image = 'img/bg/'+title.toUpperCase().charAt(0)+'.gif';
            _data.push({
                'name' : title,
                'description' : amount + ' - ' + org + ' - ' + person,
                unique : item.id,
                time : status,
                image : image
            });
        });
        formelo.ui().listAdapter(_data, '#deals-tab').attach(function(unique){
            // Open Deals
        });
    }
    function showActivityResult(data){
        var _data = [];
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
        formelo.ui().listAdapter(_data, '#activity-tab').attach(function(unique){
            formelo.navigation().openActivity('add-activity', {
                activityID : unique,
                mode : 'edit'
            })
        });
    }
    function populateGeneralData(data){
        person = data;
        $('#contact-main-title').html(data.name);
        $('#contact-main-subtitle').html(data.org_name ? data.org_name : '');
    }
    function fetchFlowsForUser(){
        PipedriveManager.contact.getActivityForContact(contactID, function(result){
            showActivityResult(result.data);
        }, function(err){
            console.error(err);
        })
    }
    function fetchDealsForUser(){
        PipedriveManager.contact.getDealsForContact(contactID, function(result){
            showDealResult(result.data);
        }, function(err){
            console.error(err);
        })
    }
    function fetchContactInformation(){
        PipedriveManager.contact.getContactByID(contactID, function(result){
            // Show Contact Details
            populateGeneralData(result.data);
            generalPreview(result.data);
            showFooter();
        }, function(err){

        })
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
        formelo.ui().listAdapter(_data, '#contact-files-tab').attach(function(unique){
            console.log('opening '+unique+'?api_token='+PipedriveManager.access_token);
            formelo.navigation().openBrowser(unique+'?api_token='+PipedriveManager.access_token);
        });
    }
    function getFilesForContact(){
        PipedriveManager.contact.getAllFiles(contactID, function(data){
            populateFiles(data.data);
        }, function(err){
            console.error(err);
        })
    }
}());