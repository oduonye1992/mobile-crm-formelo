"use strict";

/*
We need the Schema for the new tables
We wont be doing any schema builder so :)
*/

var Migration =  function(){
    var types = {
        DATABASE : 'db',
        LOCAL    : 'lc'
    };
    var backupPrefix =  'backup_';
    var cachedDBKey =   'DatabaseVersion';
    var configuration = {
         formData : {
             type   : types.DATABASE,
             name   : 'FORM_DATA',
             //Downside is all added fields must be null.
             // For IOS change the number ordering in the native plugin since it uses indexes
             // Or append the new columns
             schema :    " CREATE TABLE IF NOT EXISTS {FORM_DATA} (" +
                         " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " +
                         " RESOURCE_ID           VARCHAR(64)                         NOT NULL, " +
                         " FORM_REFERENCE        VARCHAR(64)                         NOT NULL, " +
                         " FORM_VERSION          VARCHAR(16)                         NOT NULL, " +
                         " TITLE                 VARCHAR(255)                        NOT NULL, " +
                         " STATUS                TINYINT                             NOT NULL, " +
                         " ERROR                 TINYINT                             NOT NULL, " +
                         " DATA                  TEXT                                NOT NULL, " +
                         " DESCRIPTION           VARCHAR(255)                        NOT NULL, " +
                         " CREATION_TIME         DATETIME                            NOT NULL, " +
                         " LOCATION              TEXT                                NULL,     " +
                         " SUBMISSION_TIME       DATETIME                            NULL,     " +
                         " LAST_MODIFIED_TIME    DATETIME                            NOT NULL,   " +
                         " OWNER                 VARCHAR(64)                         NOT NULL,  " +
                         " STATS_KEY             VARCHAR(20)                         NULL,  " +
                         " MODE                  VARCHAR(20)                         NULL,  " +
                         " STATS_VALUE           VARCHAR(64)                         NULL,  " +
                         " REALM                 VARCHAR(64)                         NOT NULL,  " +
                         " ENDPOINT              VARCHAR(64)                         NOT NULL,  " +
                         " API_KEY               VARCHAR(255)                        NOT NULL  " +
                         ");",
             mapping: {
                 // For your own sanity, the referenced columns all have to be available. Ain't checking nothing
                 'RESOURCE_ID'          : 'RESOURCE_ID', // Old Table => New Table
                 'FORM_REFERENCE'       : 'FORM_REFERENCE',
                 'FORM_VERSION'         : 'FORM_VERSION',
                 'TITLE'                : 'TITLE',
                 'STATUS'               : 'STATUS',
                 'ERROR'                : 'ERROR',
                 'DATA'                 : 'DATA',
                 'DESCRIPTION'          : 'DESCRIPTION',
                 'CREATION_TIME'        : 'CREATION_TIME',
                 'LOCATION'             : 'LOCATION',
                 'SUBMISSION_TIME'      : 'SUBMISSION_TIME',
                 'LAST_MODIFIED_TIME'   : 'LAST_MODIFIED_TIME',
                 'OWNER'                : 'OWNER',
                 'STATS_KEY'            : 'STATS_KEY',
                 'MODE'                 : 'MODE',
                 'STATS_VALUE'          : 'STATS_VALUE',
                 'REALM'                : 'REALM',
                 'ENDPOINT'             : 'ENDPOINT',
                 'API_KEY'              : 'API_KEY'
             },
             // Will be called when the new data is migrated
             // You can manipulate your data as you please,
             // split data into multiple columns?
             override : function(){
                //alert('manual tasks');
             }
         },
        inboxData : {
            type   : types.DATABASE,
            name   : 'INBOX',
            //Downside is all added fields must be null.
            // The {TABLE_NAME} in the "schema" string should match the "name" value
            schema :
                    "CREATE TABLE IF NOT EXISTS {INBOX} (" +
                    " ID                    INTEGER PRIMARY KEY AUTOINCREMENT   NOT NULL, " +
                    " SENDER                VARCHAR(64)                         NULL, " +
                    " SUBJECT               VARCHAR(255)                        NULL, " +
                    " BODY                  TEXT                                NULL, " + // 0 - Draft, 1 - Outbox, 2 - Sent
                    " OPENED                VARCHAR(2)                          NULL,     " +
                    " LAST_MODIFIED_TIME    DATETIME                            NULL,  " +
                    " USER                  TEXT                                NULL,  " +
                    " FORMS                 TEXT                                NULL, " +
                    " LINKS                 TEXT                                NULL,  " +
                    " IMAGE                 TEXT                                NULL,  " +
                    " REALM                 VARCHAR(64)                         NULL  " +
                    ")",
            mapping: {
                // For your own sanity, the referenced columns in both tables all have to be available. Ain't checking for nada
                // Old Table => New Table
                'SUBJECT'             : 'SUBJECT',
                'BODY'                : 'BODY'
            },
            // Will be called when the new data is migrated
            // You can manipulate your data as you please,
            // split data into multiple columns?
            override : function(){
                //alert('inbox manual tasks');
            }
        }
    };

    var migrate = function(){
            // Called after the default table has been created
            for(var item in configuration){
                if (!configuration.hasOwnProperty(item)){
                    throw new Error('Item not found');
                }
                //alert('start migration');
                var current = configuration[item];
                if (current.type == types.DATABASE){
                    // create temporary table
                    var backupTableName     = backupPrefix+current.name;
                    // Generate backup insert statement
                    var keys = '', vals = '';
                    for (var key in current.mapping){
                        keys += key+',';
                        vals += current.mapping[key]+',';
                    }
                    // Strip out last comma
                    keys = keys.substring(0,keys.lastIndexOf(","));
                    vals = vals.substring(0,vals.lastIndexOf(","));

                    var backupSchemaSql     = current.schema.replace('{'+current.name+'}',backupTableName);console.log(backupSchemaSql);
                    var insertIntobackup    = 'INSERT INTO '+backupTableName+'('+keys+') SELECT '+vals+' FROM '+current.name; console.log(insertIntobackup);
                    var dropMainTable       = 'DROP TABLE '+current.name+';';console.log(dropMainTable);
                    var mainSchemaSql       = current.schema.replace('{'+current.name+'}',current.name);console.log(mainSchemaSql);
                    var insertIntoMain      = 'INSERT INTO '+current.name+' select * from '+backupTableName+';';console.log(insertIntoMain);
                    var dropBackupTable     = 'DROP TABLE '+backupTableName+';';console.log(dropBackupTable);

                    initFunctions.database.execute(backupSchemaSql);
                    initFunctions.database.execute(insertIntobackup);
                    initFunctions.database.execute(dropMainTable);
                    initFunctions.database.execute(mainSchemaSql);
                    initFunctions.database.execute(insertIntoMain);
                    //alert('end migration');
                    $.when(initFunctions.database.execute(dropBackupTable))
                        .done(current.override);

                } else if (current.type == types.LOCAL) {
                    //alert('local stuff');
                    var record = Manager.get(current.name);
                    //alert(JSON.stringify(record));
                    if (record && current.actions){
                        //alert(typeof record);
                        if (typeof record === 'object' && (!$.isEmptyObject(record) || record.length)){
                            //alert('ww');
                            //alert(current.actions);
                            var returnObj = current.actions(record);
                            if (typeof returnObj === 'object'){
                                Manager.set(current.name, returnObj);
                            }
                        } else {
                            //alert('qqqq');
                        }
                        /*if (current.actions && record){

                        } else {
                            alert('no actions');
                        }*/
                    } else {
                        //alert('Key not found');
                    }
                }
            }
    };
    //Constructor - sorta
   // alert(window.localStorage[cachedDBKey])

   try{

       if (window.localStorage[cachedDBKey] != DATABASE_VERSION){
           try {
               $(document).ready(function() {
                   //alert('migrating');
                   setTimeout(migrate, 5000);//migrate();
                   //alert('migrated!');
                   window.localStorage[cachedDBKey] = DATABASE_VERSION;
               });
           } catch (e){
               alert(JSON.stringify(e));
           }
       } else {
           window.localStorage[cachedDBKey] = DATABASE_VERSION;
       }
   } catch (e){
       alert(JSON.stringify(e));
   }
    return {
        migrate : function(){
            try{
                migrate();
            } catch (e){
                alert(JSON.stringify(e));
            }
        }
    }
}();


