'use strict';

self.addEventListener('message', function(e) {
    var data = e.data;

    switch (data.cmd) {
        case 'init':
            self.postMessage("Initialising Web Workers...");
            startWS(data);
            break;
        default:
            self.postMessage('Unknown command: ' + data.msg);
    };
}, false);


function startWS(data) {
    var connectionAddr = data.target; //"ws://localhost:8003";
    var socket = new WebSocket(connectionAddr);
    self.postMessage('connecting to '+connectionAddr);
    socket.onopen = function(){
        self.postMessage("open");
        self.postMessage("sending "+JSON.stringify(data.credentials));
        socket.send(data.credentials);
    };
    socket.onmessage = function(event) {
        self.postMessage('message gotten');
        self.postMessage(JSON.stringify(event));
    };
    socket.onclose = function(event) {
        startWS(data);
    };
    socket.onerror = function(e){
        self.postMessage(JSON.stringify(e));
    }
}

// Workers tom process the html
