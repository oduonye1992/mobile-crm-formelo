"use strict";
var Log =  function(){
    var fatalUrl = 'https://system.formelo.com/actions/log'; // 'http://requestb.in/okf4nyok';
    var default_tag = 'Formelo';
    var postLog =  function(msg, level){
        var data =  {
            "type": "log",
            "level": level,
            "data": msg
        };
        alert(JSON.stringify(msg));
        reportFatal(JSON.stringify(data));
    };
    var reportFatal =  function(data){
        return true;
        var http = new XMLHttpRequest();
        var url = fatalUrl;//"get_data.php";
        var params = data;//"lorem=ipsum&name=binny";
        http.open("POST", url, true);
        //Send the proper header information along with the request
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.setRequestHeader("Content-length", params.length);
        http.setRequestHeader("Connection", "close");

        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                //alert(http.responseText);
            }
            alert("A critical operation failed. Formelo is undergoing maintenance, or some other annoyance. Please check back in a little bit");
        };
        http.send(params);
    };
    window.onerror = function(msg, url, line, col, error) {
        // Note that col & error are new to the HTML 5 spec and may not be
        // supported in every browser.  It worked for me in Chrome.
        var extra = !col ? '' : '\ncolumn: ' + col;
        extra += !error ? '' : '\nerror: ' + error;

        // You can view the information in an alert to see things working like this:
        var message ="Error: " + msg + "\nurl: " + url + "\nline: " + line + extra;
        alert(message);
        //reportFatal(message);

        // TODO: Report this error via ajax so you can keep track
        // of what pages have JS issues

        var suppressErrorAlert = true;
        return suppressErrorAlert;
    };
    return {
        v : function(e, tag){  // verbose
            tag = tag || default_tag;
        },
        e :  function(e, tag){ // error
            tag = tag || default_tag;
            postLog(e, 'Error');
        },
        i : function(e, tag){   // info
            tag = tag || default_tag;
            console.log(tag.toUpperCase()+": "+e);
        },
        d : function(e, tag){  // debug
            tag = tag || default_tag;
            console.log(tag.toUpperCase()+": "+e);
        },
        f :  function(e, tag){ // fatal
            tag = tag || default_tag;
            postLog(e, 'Fatal');
        }
    }
}();

var Tracker = function(){
    var interval =  1000;
    var running;
    var postLocation = function(loc){
        //alert('posting '+JSON.stringify(loc));
        //Socket.publish(JSON.stringify(loc));
    };
    var track = function(){
        running = setInterval(function(){
            $.when(getCurrentLocation())
                .done(function(location){
                    var data = {
                        "type": "track",
                        "longitude": location.longitude,
                        "latitude": location.latitude,
                        "date": location.date
                    };
                    postLocation(data);
                })
                .fail(function(e){
                    alert('Error -- '+JSON.stringify(e));
                })
        }, interval);
    };

    return {
        startTracking : function(_interval){
            try {
                interval = _interval;
                clearInterval(running);
                track();
            } catch (e){
                alert('Err : ' + JSON.stringify(e));
            }
        }
    }
}();