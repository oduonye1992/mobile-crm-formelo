(function() {

    var PipedriveManager = {};
    /*
    *  Load properties to this class
    *  PipedriveManager.findAll = function(){
    *      // Do stuff
    *  }
    */
    PipedriveManager.network = function(endpoint, _data, _method){
        var data    = _data      || {};
        var method  = _method    || 'GET';
        var txDeferred = $.Deferred();
        var headers = {};
        $.ajax({
            url : endpoint+'?api_token='+PipedriveManager.access_token,
            type : method,
            data : data,
            cache: false,
            headers: headers,
            success : function(data){
                txDeferred.resolve(data);
            },
            error: function(xhr){
                console.log(xhr);
                txDeferred.reject(xhr);
            },
            timeout: TIMEOUT
        });
        return txDeferred.promise();
    };
    PipedriveManager.access_token = "2edecaf9bd14c6f5cec2ab3f21e820075120e72a";
    PipedriveManager.validate = function(data, validationArray) {
        // Using the set of rules, validate that
        validationArray.forEach(function(item){
            if (data[item] === undefined){
                throw new Error(item + ' key not found.');
            }
        });
    };
    PipedriveManager.getFilters = function(type, successCB, errorCB){
        var url = "https://api.pipedrive.com/v1/filters";
        $.when(PipedriveManager.network(url, {
            type : type
        }, 'GET'))
            .done(function(data){
                console.log(data);
                successCB(data);
            })
            .fail(function(err){
                console.error(err);
                errorCB(err);
            });
    },
    PipedriveManager.deals = {
        getAllDeals : function(successCB, errorCB, options){
            var defaultFilters = {
                filter_id : null,
                start : null,
                limit : null,
                sort : null,
                owned_by_you : null
            };
            var url = "https://api.pipedrive.com/v1/deals";
            var opt = $.extend({}, defaultFilters, options);
            $.when(PipedriveManager.network(url, opt))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getActivitiesForDeal : function(dealID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/deals/"+dealID+"/activities";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getDealByID : function(dealID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/deals/"+dealID;
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        addDeals : function(data, successCB, errorCB){
            PipedriveManager.validate(data, ['title', 'value', 'currency', 'user_id', 'person_id', 'org_id', 'stage_id']);
            var url = "https://api.pipedrive.com/v1/deals";
            $.when(PipedriveManager.network(url, data, 'POST'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        searchDeals : function(data, successCB, errorCB){
            PipedriveManager.validate(data, ['term']);
            var url = "https://api.pipedrive.com/v1/deals/find";
            $.when(PipedriveManager.network(url, data, 'GET'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        editDeal : function(dealID, data, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/deals/"+dealID;
            $.when(PipedriveManager.network(url, data, 'PUT'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        pipelines : function(successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/stages";
            $.when(PipedriveManager.network(url, {}, 'GET'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getAllFiles : function(dealID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/deals/"+dealID+"/files";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        }
    };
    PipedriveManager.activity = {
        addActivity : function(data, successCB, errorCB){
            PipedriveManager.validate(data, ['subject', 'type']);
            var url = "https://api.pipedrive.com/v1/activities";
            $.when(PipedriveManager.network(url, data, 'POST'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        editActivity : function(activityID, data, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/activities/"+activityID;
            $.when(PipedriveManager.network(url, data, 'PUt'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getActivityByID : function(activityID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/activities/"+activityID;
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getActivityTypes : function(successCB, errorCB, options){
            var url = "https://api.pipedrive.com/v1/activityTypes";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getAllActivities : function(successCB, errorCB, options){
            var defaultFilters = {
                user_id : null,
                type : null,
                start : null,
                limit : null,
                start_date : null,
                end_date : null,
                done : null
            };
            var url = "https://api.pipedrive.com/v1/activities";
            var opt = $.extend({}, defaultFilters, options);
            $.when(PipedriveManager.network(url, opt))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        }
    };
    PipedriveManager.contact = {
        getAllFiles : function(personID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/persons/"+personID+"/files";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        addContact : function(data, successCB, errorCB){
            PipedriveManager.validate(data, ['name']);
            var url = "https://api.pipedrive.com/v1/persons";
            $.when(PipedriveManager.network(url, data, 'POST'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        editContact : function(personID, data, successCB, errorCB){
            PipedriveManager.validate(data, ['name']);
            var url = "https://api.pipedrive.com/v1/persons/"+personID;
            $.when(PipedriveManager.network(url, data, 'PUT'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getAllContacts : function(successCB, errorCB, options){
            var defaultFilters = {
                user_id : null,
                start : null,
                limit : null,
                sort : null
            };
            var url = "https://api.pipedrive.com/v1/persons";
            var opt = $.extend({}, defaultFilters, options);
            $.when(PipedriveManager.network(url, opt))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getContactByID : function(contactID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/persons/"+contactID;
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getDealsForContact : function(contactID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/persons/"+contactID+"/deals";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getActivityForContact : function(contactID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/persons/"+contactID+"/activities";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        searchContacts : function(data, successCB, errorCB){
            PipedriveManager.validate(data, ['term']);
            var url = "https://api.pipedrive.com/v1/persons/find";
            $.when(PipedriveManager.network(url, data, 'GET'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        }
    };
    PipedriveManager.actions = {
        addNotes : function(data, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/notes";
            $.when(PipedriveManager.network(url, data, 'POST'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getAllContacts : function(successCB, errorCB, options){
            var defaultFilters = {
                user_id : null,
                start : null,
                limit : null,
                sort : null
            };
            var url = "https://api.pipedrive.com/v1/persons";
            var opt = $.extend({}, defaultFilters, options);
            $.when(PipedriveManager.network(url, opt))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getContactByID : function(contactID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/persons/"+contactID;
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getDealsForContact : function(contactID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/persons/"+contactID+"/deals";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getActivityForContact : function(contactID, successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/persons/"+contactID+"/activities";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        }
    };
    PipedriveManager.organization = {
        addOrganization : function(data, successCB, errorCB){
            PipedriveManager.validate(data, ['name']);
            var url = "https://api.pipedrive.com/v1/organizations";
            $.when(PipedriveManager.network(url, data, 'POST'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        getAllOrganizations : function(successCB, errorCB, options){
            var defaultFilters = {
                filter_id : null,
                start : null,
                limit : null,
                sort : null
            };
            var url = "https://api.pipedrive.com/v1/organizations";
            var opt = $.extend({}, defaultFilters, options);
            $.when(PipedriveManager.network(url, opt))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        },
        searchOrganization : function(data, successCB, errorCB){
            PipedriveManager.validate(data, ['term']);
            var url = "https://api.pipedrive.com/v1/organizations/find";
            $.when(PipedriveManager.network(url, data, 'GET'))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        }
    };
    PipedriveManager.files = {
        add : function(form, successCB, errorCB){
            var endpoint = "https://api.pipedrive.com/v1/files";
            $.ajax({
                url : endpoint+'?api_token='+PipedriveManager.access_token,
                type : 'POST',
                data : form,
                cache: false,
                processData: false,
                contentType: false,
                success : successCB,
                error: errorCB,
                timeout: 300000
            });
        },
        getAllFiles : function(successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/files";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        }
    };
    PipedriveManager.currency = {
        getAllCurrencies : function(successCB, errorCB, options){
            var defaultFilters = {
                filter_id : null,
                start : null,
                limit : null,
                sort : null
            };
            var url = "https://api.pipedrive.com/v1/currencies";
            var opt = $.extend({}, defaultFilters, options);
            $.when(PipedriveManager.network(url, opt))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        }
    };
    PipedriveManager.admin = {
        getUsers : function (successCB, errorCB){
            var url = "https://api.pipedrive.com/v1/users";
            $.when(PipedriveManager.network(url))
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    console.error(err);
                    errorCB(err);
                });
        }
    };
    formelo.exports('PipedriveManager', PipedriveManager);
})();