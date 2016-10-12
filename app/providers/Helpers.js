(function() {

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
        $(placeholder).html(loadingHtml);
        return {
            stop : function(){
                $(placeholder).html(previousHtml);
            }
        }
    };
    formelo.exports('Helpers', Helpers);
})();