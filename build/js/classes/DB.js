var DB = {
    initialise : function () {

        var sql =
            "CREATE TABLE IF NOT EXISTS FORM_DATA (" +
            " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " +
            " RESOURCE_ID           VARCHAR(64)                         NOT NULL, " +
            " FORM_REFERENCE        VARCHAR(64)                         NOT NULL, " +
            " FORM_VERSION          VARCHAR(16)                         NOT NULL, " +
            " TITLE                 VARCHAR(255)                        NOT NULL, " +
            " STATUS                TINYINT                             NOT NULL, " + // 0 - Draft, 1 - Outbox, 2 - Sent
            " DATA                  TEXT                                NOT NULL, " +
            " DESCRIPTION           VARCHAR(255)                        NOT NULL, " +
            " CREATION_TIME         DATETIME                            NOT NULL, " +
            " LOCATION              TEXT                                NULL,     " +
            " SUBMISSION_TIME       DATETIME                            NULL,     " +
            " LAST_MODIFIED_TIME    DATETIME                            NOT NULL  " +
            ")";

        initFunctions.database.execute(sql);

        sql =
            "CREATE TABLE IF NOT EXISTS INBOX (" +
            " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " +
            " FORM_REFERENCE        VARCHAR(64)                         NULL, " +
            " FORM_VERSION          VARCHAR(16)                         NULL, " +
            " SUBJECT               VARCHAR(255)                        NOT NULL, " +
            " BODY                  TEXT                                NOT NULL, " + // 0 - Draft, 1 - Outbox, 2 - Sent
            " OPENED                VARCHAR(2)                          NULL,     " +
            " LAST_MODIFIED_TIME    DATETIME                            NULL  " +
            ")";

        initFunctions.database.execute(sql);


        sql =
            "CREATE TABLE IF NOT EXISTS FORM_CONFIG (" +
            " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " + //1                             2                               3
            " TIMESTAMP             VARCHAR(64)                             NULL, " + //"2233"                            "2234"                          "550011"
            " UPDATABLE             VARCHAR(1)                              NULL, " + //"2233"                            "2234"                          "550011"
            " CONFIG                VARCHAR(64)                         NOT NULL  " + //"SIPML Client Records"            "SIPML Client Records"          "Diamond Bank HR"
            ")";
        initFunctions.database.execute(sql);


        sql =
            "CREATE TABLE IF NOT EXISTS FORM_DATA_EVENTS (" +
            " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " + //1                               2                               3
            " RESOURCE_ID           VARCHAR(64)                         NOT NULL, " + //"2233"                          "2234"                          "550011"
            " SOURCE                VARCHAR(64)                         NOT NULL, " + //"SIPML Client Records"          "SIPML Client Records"          "Diamond Bank HR"
            " TITLE                 VARCHAR(255)                        NOT NULL, " + //"PIN Created",                  "Invalid Data Submitted",       "Time Off Request Rejected"
            " BODY                  TEXT                                NOT NULL, " + //"The new pin is PEN12344343",   "Contributor already exists"    "You have exceeded your limit"
            " EVENT_TIME            DATETIME                            NOT NULL  " +
            ")";
        return initFunctions.database.execute(sql);
    },

    "error": function(error) {
        debug("ERROR:" + JSON.stringify(error), "alert");
        console.log(JSON.stringify(error));
    },
    "success": function(msg) {
        console.log(msg);
    },
    "execute": function(sql) {
        //alert(sql);
        var txDeferred = $.Deferred(); ///data/data/com.phonegap.helloworld/app_webview/databases/
        var dbo = window.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);
        dbo.transaction(function(tx) {
            if (typeof sql == "array") {
                for (var i = 0; i < sql.length; i++) {
                    var isLast = i == (sql.length - 1);
                    tx.executeSql(sql[i], isLast ? txDeferred.reject : undefined, isLast ? txDeferred.resolve : undefined);
                }
            } else {
                tx.executeSql(sql, txDeferred.reject, txDeferred.resolve);
            }
        }, DB.error, DB.success(sql));
        //}, DB.error, DB.success(sql));

        return txDeferred.promise();
    },
    helpers : {
        getSavedDataByStatusAndUser : function(status,user, options) {
            var txDeferred = $.Deferred();
            //txDeferred.resolve();
            var sqlArgs = {
                columns: ["id", "ref", "title", "description", "error", "last_modified_time"],
                where: {
                    status: status,
                    owner:user
                },
                order_by: {
                    column: "last_modified_time",
                    ascending: false
                },
                limit: {
                    offset: options.offset,
                    extent: options.extent
                }
            };
            //alert('querying '+ JSON.stringify(sqlArgs));
            $.when(initFunctions.database.select(sqlArgs))
                .done(function(tx, formDataSet) {
                    alert(JSON.stringify(formDataSet));
                    txDeferred.resolve(formDataSet);
                })
                .fail(function(tx, error) {
                    txDeferred.reject();
                });

            return txDeferred.promise();
        },
        getLogsFromDB: function() {
            var txDeferred = $.Deferred();
            var sql = "SELECT * FROM INBOX";//WHERE OWNER = '"+getUserCredentials().username+"'";
            $.when(DB.execute(sql))
                .done(function(tx, dataSet) {
                    alert("asasa + "+JSON.stringify(dataSet));
                    txDeferred.resolve(dataSet);
                })
                .fail(function(error) {
                    txDeferred.reject(error + " | " + sql);
                });
            return txDeferred.promise();
        },
        getStatsFromDB: function(){
            var txDeferred = $.Deferred();
            // crete the return onject
            var returnObj = {};
            // extract the stats
            // each stat returns a obj, extract eh count
            // add the count to the return obj
            // same for all 4

            // ERRORS
            var sql = "SELECT COUNT(*) AS COUNT FROM FORM_DATA WHERE ERROR = 1 AND STATUS = 1 AND REALM = '"+getEndpoint()+"' AND OWNER = '"+getUserCredentials().username+"' ";
            $.when(DB.execute(sql))
                .done(function(tx, dataSet) { //alert(dataSet.rows.item(0).COUNT);
                    returnObj["ERRORS"] = dataSet.rows.item(0).COUNT;
                    // SUCCESSFULLY SENT RECORDS
                    sql = "SELECT COUNT(*) AS COUNT FROM FORM_DATA WHERE STATUS = 2 AND REALM = '"+getEndpoint()+"' AND OWNER = '"+getUserCredentials().username+"' ";
                    $.when(DB.execute(sql))
                        .done(function(tx, dataSet) { //alert(dataSet.rows.item(0).COUNT);
                            returnObj["SENT"] = dataSet.rows.item(0).COUNT;
                            // DRAFTS
                            sql = "SELECT COUNT(*) AS COUNT FROM FORM_DATA WHERE STATUS = 0 AND REALM = '"+getEndpoint()+"' AND OWNER = '"+getUserCredentials().username+"' ";
                            $.when(DB.execute(sql))
                                .done(function(tx, dataSet) { //alert(dataSet.rows.item(0).COUNT);
                                    returnObj["DRAFTS"] = dataSet.rows.item(0).COUNT;
                                    // UNREAD MESSAGES
                                    sql = 'SELECT COUNT(*) AS COUNT FROM INBOX WHERE OPENED = "N" AND USER = "'+getUserCredentials().id+'" AND REALM = "'+getUserCredentials().realm+'" ORDER BY LAST_MODIFIED_TIME DESC';
                                    $.when(DB.execute(sql))
                                        .done(function(tx, dataSet) { //alert(dataSet.rows.item(0).COUNT);
                                            returnObj["INBOX"] = dataSet.rows.item(0).COUNT;
                                                txDeferred.resolve(returnObj);
                                        })
                                        .fail(function(error) {
                                            //txDeferred.reject(error + " | " + sql);
                                            alert(error + " | " + sql);
                                        });
                                })
                                .fail(function(error) {
                                    //txDeferred.reject(error + " | " + sql);
                                    alert(error + " | " + sql);
                                });

                        })
                        .fail(function(error) {
                            //txDeferred.reject(error + " | " + sql);
                            alert(error + " | " + sql);
                        });
                })
                .fail(function(error) {alert('ss');
                    //txDeferred.reject(error + " | " + sql);
                    alert(error + " | " + sql);
                });

            //alert(JSON.stringify(returnObj));


            return txDeferred.promise();
        },
        getConfigFromDatabase: function() {
            var txDeferred = $.Deferred();
            var sql = "SELECT * FROM FORM_CONFIG WHERE OWNER = '"+getUserCredentials().username+"'"; // "SELECT * FROM FORM_CONFIG";
            $.when(DB.execute(sql))
                .done(function(tx, dataSet) {
                    txDeferred.resolve(dataSet.rows.item(0).CONFIG);
                })
                .fail(function(tx, error) {
                    alert("Promise error8: tx=" + tx + ", data=" + error);
                    console.log(error);
                    txDeferred.reject();
                });
            return txDeferred.promise();
        },
        storeConfigInDB: function(conf) {
            $.when(DB.helpers.configExists())
                .done(function(data) {
                    if (data == true) {
                        //alert('updating db');
                        DB.helpers.storeConfig("UPDATE", conf);
                    } else {
                        //alert('inserting into db');
                        DB.helpers.storeConfig("INSERT", conf);
                    }
                })
                .fail(function(tx, error) {
                    alert("Promise error6: tx=" + tx + ", data=" + error);
                    console.log(error);
                });
        },
        storeConfig: function(action, conf) {
            var sql = "";
            if (action == "INSERT") {
                var sql = "INSERT INTO FORM_CONFIG(TIMESTAMP, CONFIG, OWNER) VALUES (time('now'), '" + initFunctions.escapeQuotes(conf) + "', '"+getUserCredentials().username+"')";
            } else if (action == "UPDATE") {
                var sql = "UPDATE FORM_CONFIG SET CONFIG = '" + initFunctions.escapeQuotes(conf) + "', TIMESTAMP = time('now') WHERE OWNER = '"+getUserCredentials().username+"'";
            }
            initFunctions.database.execute(sql);
            return true;
        },
        configExists: function() {
            //var status = false;
            //app.navigator.showDraftList();
            var txDeferred = $.Deferred();
            var sql = "SELECT * FROM FORM_CONFIG WHERE OWNER = '"+getUserCredentials().username+"'"; // "SELECT * FROM     FORM_CONFIG";
            $.when(initFunctions.database.execute(sql))
                .done(function(tx, inboxDataSet) {
                    if (inboxDataSet.rows.length != 0) {
                        txDeferred.resolve(true);
                    } else {
                        txDeferred.resolve(false);
                    }
                })
                .fail(function(tx, error) {
                    return txDeferred.reject();
                });
            return txDeferred.promise();
        },
        isUpdatableConfigExists: function() {
            var txDeferred = $.Deferred();
            var sql = "SELECT * FROM FORM_CONFIG WHERE UPDATABLE = 'Y' AND OWNER = '"+getUserCredentials().username+"'";
            $.when(initFunctions.database.execute(sql))
                .done(function(tx, inboxDataSet) {
                    if (inboxDataSet.rows.length != 0) {
                        txDeferred.resolve(true);
                    } else {
                        txDeferred.resolve(false);
                    }
                })
                .fail(function(tx, error) {
                    alert("Promise error13: tx=" + tx + ", data=" + error);
                    console.log(error);
                });
            return txDeferred.promise();
        },
        updateDBSetUpdatableConfig: function(status) {
            var sql = "UPDATE FORM_CONFIG SET UPDATABLE = '"+status+"' WHERE OWNER = '"+getUserCredentials().username+"'";
            initFunctions.database.execute(sql);
        },
        saveToInbox: function (obj) {
            try {
                var sql = 'INSERT INTO INBOX(' +
                            'SENDER,'+
                            'SUBJECT,'+
                            'BODY,'+
                            'OPENED,'+
                            'USER,'+
                            'FORMS,'+
                            'LINKS,'+
                            'IMAGE,'+
                            'REALM,'+
                            'LAST_MODIFIED_TIME'+
                        ') VALUES (' +
                            '\''+initFunctions.escapeQuotes(obj.from.name)+'\','+
                            '\''+initFunctions.escapeQuotes(obj.subject)+'\','+
                            '\''+initFunctions.escapeQuotes(obj.body)+'\','+
                            '\'N\','+
                            '\''+getUserCredentials().id+'\','+
                            '\''+JSON.stringify(obj.applets)+'\','+
                            '\''+JSON.stringify(obj.links)+'\','+
                            '\''+obj.from.icon_url+'\','+
                            '\''+getUserCredentials().realm+'\','+
                            '\''+moment().format()+'\''+
                        ')';
                $.when(initFunctions.database.execute(sql))
                    .done(function(){
                        syncPlugin.notify(obj.subject,obj.body);
                        showMessage('New message :)');
                    })
                    .fail(function(e){
                        alert(JSON.stringify(e));
                    })
            } catch (e){
                alert(JSON.stringify(e));
                throw new Error(e);
            }
        }
    }
}