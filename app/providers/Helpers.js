(function() {
    var PipedriveManager = formelo.require('PipedriveManager');
    var Helpers = {};
    /*
    *  Load properties to this class
    *  Helpers.findAll = function(){
    *      // Do stuff
    *  }
    */
    Helpers.showWaiting = function(placeholder){
        var previousHtml = $(placeholder).html();
        var loadingHtml =   '<div class="container-xs-height full-vh">' +
            '<div class="row-xs-height">'+
            '<div class="col-xs-height col-middle">'+
            '<div class="error-container text-center">'+
            '<h1 class="error-number" style="color: grey;">' +
            '<div class="progress-circle-indeterminate"></div>' +
            '</h1>'+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>';
        var errorHtml = function(title, message) {
            var title   = title || '';
            var message = message || '';
            return  '<div class="container-xs-height full-vh">' +
                '<div class="row-xs-height">'+
                '<div class="col-xs-height col-middle">'+
                '<div class="error-container text-center">'+
                '<h1 class="error-number" style="color: grey;">' +
                title +
                '</h1>'+
                '<h2 style="color: grey;">' +
                message +
                '</h2>'+
                '</div>'+
                '</div>'+
                '</div>'+
                '</div>';
        }
        $(placeholder).html(loadingHtml);
        return {
            stop : function(){
                $(placeholder).html(previousHtml);
            },
            error : function(title, message){
                $(placeholder).html(errorHtml(title, message));
            }
        }
    };
    Helpers.isProduction = function(){
        return true;
    };
    Helpers.showEmptyState = function(placeholder, title, message){
        var previousHtml = $(placeholder).html();
        var title  = title || 'Empty';
        var message  = message || 'Nothing Here';
        var loadingHtml =   '<div class="container-xs-height full-vh">' +
            '<div class="row-xs-height">'+
            '<div class="col-xs-height col-middle">'+
            '<div class="error-container text-center">'+
            '<h1 class="error-number" style="color: grey;">'+title+'</h1>'+
            '<h3 style="color: grey;">'+message+'</h3>'+
            '</div>'+
            '</div>'+
            '</div>'+
            '</div>';
        $(placeholder).html(loadingHtml);
    };
    Helpers.str_random = function(){
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for( var i=0; i < 5; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };
    Helpers.startLoading = function(){
        if (Helpers.isProduction()){
            formelo.ui().spinner.show();
        }
    };
    Helpers.stopLoading = function(){
        if (Helpers.isProduction()){
            formelo.ui().spinner.hide();
        }
    };
    Helpers.takePicture = function(data, successCB, errorCB){
        formelo.hooks.getImage(function(result){
            var blob = formelo.helpers.base64ToFile(result);
            var form_data = new FormData();
            form_data.append('file', blob);
            form_data.append('deal_id', data.deal_id);
            form_data.append('person_id', data.person_id);
            form_data.append('activity_id', data.activity_id);
            console.log('Please wait...');
            Helpers.startLoading();
            PipedriveManager.files.add(form_data, function(res){
                Helpers.stopLoading();
                console.log(res);
                successCB(res);
            }, function(err){
                Helpers.stopLoading();
                console.error(err);
            });
        }, errorCB);
    };
    formelo.exports('Helpers', Helpers);
})();