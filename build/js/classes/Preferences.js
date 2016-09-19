//Not so global
var options = {
    "getConfig": function() {
        var data = customFunctions.sendTo(null, "http://192.168.1.104:9301/FormeloWebPortal/View?userid=1");
        alert(data);
    },
    "login": function() {
        window.localStorage.setItem("loggedin", true);
    },
    "Logout": function() {
        $.mobile.changePage("#login-page", {
            transition: "pop"
        });
    },
    "logout": function() {
        //save all user state
        window.localStorage.setItem("loggedin", false);
        alert("logging");
        $.mobile.changePage("#login-page", {
            transition: "pop"
        });
    },
    "send": function(folder) {

    },

    "saveOptions": function() {
        var submitOptionMethod = $('#option_submit_data_method').val();
        var serverMessageTime = $('#option_fetch_server_msg').val();
        var stepValidationOption = $('#option_step_validation').val();

        if (typeof(Storage) !== "undefined") {
            window.localStorage.setItem("submitOptionMethod", submitOptionMethod);
            window.localStorage.setItem("serverMessageTime", serverMessageTime);
            window.localStorage.setItem("stepValidationOption", stepValidationOption);
            window.plugins.toast.show('Settings has been changed', 'short', 'bottom');
            $(":mobile-pagecontainer").pagecontainer('change', '#form_group_list', {
                transition: "pop"
            });
        } else {
            alert("no ocl storage");
            // Sorry! No Web Storage support..
        }
    },
    "getOptions": function() {
        var submitOptionMethod = window.localStorage.getItem("submitOptionMethod");
        var serverMessageTime = window.localStorage.getItem("serverMessageTime");
        var stepValidationOption = window.localStorage.getItem("stepValidationOption");

        $('#option_submit_data_method').val(submitOptionMethod);
        $('#option_fetch_server_msg').attr("value", serverMessageTime);
        $('#option_step_validation').val(stepValidationOption);

        $.mobile.changePage("#options-page", {
            transition: "pop"
        });
        //gets the options//
        //prepare an object
        //returns the option

    },
    "confirm": function(title, message, deferred) {
        navigator.notification.confirm(
            message, // message
            function(Index) {
                if (Index == 1) {
                    deferred.resolve;
                } else {
                    deferred.reject;
                }
            }, // callback to invoke with index of button pressed
            title, // title
            ['OK', 'Cancel'] // buttonLabels
        );
    },
    "confirmResult": function(buttonIndex, deferred) {
        if (buttonIndex == 1) {
            deferred.resolve;
        }
    },
    "processResult": function(type) {

    },
    "populateOptionsForm": function(options) {
        //populate the form duh?
    },
    "submitOutboxRecords": function(index) {
        customFunctions.synchronise();
    },
    "folderOption": function(status) {
        //alert("ss");
        //alert(status);
        if (status == 0) {
            options.emptyDraftsFolder();
        } else if (status == 1) {
            options.emptyOutboxFolder();
        } else if (status == 2) {
            options.emptySentFolder();
        }
    },
    "emptySentFolder": function() {

        if (options.confirm("Empty Data", "This will delete every record in your Sent Folder")) {
            var sql = "DELETE FROM FORM_DATA WHERE STATUS = 2";
            initFunctions.database.execute(sql);
            window.plugins.toast.show('Sent Folder Cleared', 'short', 'bottom');
            app.navigator.showSentList();
        }
    },
    "emptyOutboxFolder": function() {
        if (options.confirm("Empty Data", "This will delete every record in your Sent Folder")) {
            var sql = "DELETE FROM FORM_DATA WHERE STATUS = 1";
            initFunctions.database.execute(sql);
            window.plugins.toast.show('Outbox Folder Cleared', 'short', 'bottom');
            app.navigator.showOutboxList();
        }
    },
    "emptyDraftsFolder": function() {
        if (options.confirm("Empty Data", "This will delete every record in your Drafts Folder")) {
            var sql = "DELETE FROM FORM_DATA WHERE STATUS = 0";
            initFunctions.database.execute(sql);
            window.plugins.toast.show('Drafts Folder Cleared', 'short', 'bottom');
            app.navigator.showDraftList();
        }
    },
    "logout": function() {

    }
}

var log = {
    e : function (message) {
        console.log("FORMELO "+ LOG_ERROR+ " : "+ message);
    },
    d : function (message) {
        console.log("FORMELO "+ LOG_DEBUG+ " : "+ message);
    },
    v : function (message) {
        console.log("FORMELO "+ LOG_VERBOSE+ " : "+ message);
    }
}