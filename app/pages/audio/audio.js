(function(){
    'use strict';
    var recording  	= null;
    var personID   	= null;
    var dealID 		= null;
    var activityID 	= null;
    var orgID		= null;

    var PipedriveManager = formelo.require('PipedriveManager');
    var Helpers = formelo.require('Helpers');

    formelo.event().onCreate(function(){
        // Entry point of this application
        $('#audiobtn').click(function(){
            startRecording();
        });
        formelo.html().get.header.title().html('Audio Player');
    });
    formelo.event().onIntent(function(data){
        personID = data.detail.person_id;
        dealID = data.detail.deal_id;
        activityID = data.detail.activity_id;
        orgID = data.detail.org_id;
        // Receive parameters from calling page
    });
    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });

    function startRecording(){
        $('#results').html('');
        formelo.html().get.header.menu().html('').hide().unbind();
        navigator.device.capture.captureAudio(successCB, errorCB);
    }
    var getData = function(audioFile, callback){
        try {
            var reader = new FileReader();
            reader.readAsDataURL(audioFile);
            reader.onload = function(event) {
                callback(event.target.result);
            };
            reader.onerror = function(e){
                console.error(JSON.stringify(e));
            };
        } catch (e){
            console.error(e);
        }
    };
    function postData(){
        if (recording  === null){
            return console.error('No recordings found.');
        }
        var form_data = new FormData();
        //var matches = recording.match(/^data\:(.+);base64,(.+)$/);
        var blob = formelo.helpers.base64ToFile(recording);
        form_data.append('file', blob);
        form_data.append('deal_id', dealID);
        form_data.append('person_id', personID);
        form_data.append('activity_id', activityID);
        console.log('Please wait...');
        Helpers.startLoading();
        PipedriveManager.files.add(form_data, function(data){
            Helpers.stopLoading();
            console.log(data);
            formelo.navigation().result({
                type : 'add-audio'
            });
        }, function(err){
            Helpers.stopLoading();
            console.error(err);
        });
    }
    function successCB(mediaFiles) {
        try{
            var i, path, len;
            for (i = 0, len = mediaFiles.length; i < len; i += 1) {
                path = mediaFiles[i].fullPath;
                var audioFile = mediaFiles[i];
                console.log(JSON.stringify(audioFile));
                var file = new window.File(audioFile.name, audioFile.localURL,
                    audioFile.type, audioFile.lastModifiedDate, audioFile.size);
                getData(file, function(encoded){
                    recording = encoded;
                    var audioPlaceholder = "pipeaudio";
                    var audioSource = "pipeaudiosrc";
                    var audio = document.getElementById(audioPlaceholder);
                    var source = document.getElementById(audioSource);
                    source.src = encoded;
                    audio.load();
                    $('#results').html('<p style="color:grey;">Tap on the play icon to play.'); formelo.html().get.header.menu().html('Done').show().click(function(){
                        postData();
                    });
                });
            }
        } catch(e) {
            console.error(e);
        }
    }
    function errorCB(err){
        console.error(err);
    }
}());