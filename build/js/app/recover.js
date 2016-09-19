function Recovery(appletID){
    if (!appletID) throw new Error('AppletID has to be set');
    this.mAppletID= appletID;
    this.register = function(){};
    this.listen = function(){};
    this.save = function(){};
    this.update = function(){};
}
Recovery.prototype.recover  = function (){};
Recovery.prototype.isRecoveryExist = function(){};
Recovery.prototype.watch = function(){};

// Pages have layout and javascript and css and ids
// Open page by ID
// Open page and pass ID
// By listening for an event


function Applet(appletID){
    if (!appletID) throw new Error('Kindly specify an applet ID');
    this.appletID =   appletID;
}
Applet.prototype.open = function(id){};
Applet.prototype.launch = function(id){};