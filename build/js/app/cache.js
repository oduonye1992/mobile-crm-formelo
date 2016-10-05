'use strict';
/**
 * @example <img class="donkeyCache" donkey-id = "image.jpg"/>
 * @example DonkeyCache.grab();
 */
var DonkeyCache = function(){
    var files = {};
    var table_prefix = "donkey_cache_img_";
    if (typeof(localStorage) === "undefined") throw new Error('[DonkeyCache] Primary storage option (Local Storage) not found on this system');
    var add = function(image, item){
        //TODO Find better way to save. Current way take up too much storage
        return true;
        DBAdapter.set(table_prefix+image, item, function(){
            console.log('Added:  '+image);
        }, function(){
            console.log('Not added '+image);
        })
    };
    var isImageExist = function(image, callback, errorCallback){
        //return localStorage[image];
        DBAdapter.get(table_prefix+image, callback, errorCallback);
    };
    var toDataUrl = function (url, callback,errorCallback, outputFormat){
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function(){
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            var dataURL;
            canvas.height = this.height;
            canvas.width = this.width;
            ctx.drawImage(this, 0, 0);
            dataURL = canvas.toDataURL(outputFormat);
            if (this.height < 1024 && this.width < 1024){
                add(url, dataURL);
            } else {
                showMessage('Not added');
            }
            callback(dataURL);
            canvas = null;
        };
        img.src = url;
    };
    var toDataUrlFile = function (url, callback){
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function() {
            var reader  = new FileReader();
            reader.onloadend = function () {
                callback(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.send();
    };
    var getImage =  function(image, callback, errorCallback){
        isImageExist(image, function(data){
            if (data !== null){
                callback(data);
            } else {
                getImageFromServer(image, callback, errorCallback);
            }
        });
    };
    var getImageFromServer = function(img, callback, errorCallback){
        toDataUrl(img, function(data){
            callback(data);
        }, errorCallback, 'image/jpg');
    };
    var defaultImage = function(){
        return 'img/loading.png';
    };
    return {
        grab: function(){
            $('.donkeyCache').each(function(index){
                var img = $(this).attr('donkey-id');
                var visited = $(this).attr('donkey-visited');
                var that = $(this);
                if (img && (visited != 'true')){
                    that.attr('src', defaultImage);
                    getImage(img, function(image){
                        that.attr('src', image);
                        that.attr('donkey-visited', 'true');
                    }, function(err){showMessage(JSON.stringify(err))});
                }
            });
        },
        getPrefix : function(){
            return table_prefix;
        }
    };
}();
