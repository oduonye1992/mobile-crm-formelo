for (var i = 0; i < formDataSet.rows.length; i++) {
                    var formData = formDataSet.rows.item(i);
                    var formTitle = (!formData.title || 0 === formData.title.replace(/\s/g, "").length) ? "Untitled" : formData.title;
                    var image = formTitle.charAt(0);
                    image = image.toUpperCase();
                    var description = JSON.parse(formData.description);
                    var errorIcon = formData.error != 0 ? "fa fa-exclamation-triangle" : "fa fa-check";
                    var formConfig = initFunctions.getFormConfigByRef(formData.ref);
                    //alert(formData.error);

                    if (!description.icon) {
                        image = "img/bg/" + image + ".gif";
                    } else {
                        image = "img/bg/unknown.gif"; //http://lorempixel.com/150/150/people/2/
                    }

                    if (initialDate != moment(formData.last_modified_time).format('MMMM Do YYYY')) {
                        html += '<li data-role="list-divider">' + moment(formData.last_modified_time).format('MMMM Do YYYY') + '<span class="ui-li-count"></span></li>';
                        initialDate = moment(formData.last_modified_time).format('MMMM Do YYYY');
                    }
                    if (formConfig) {
                        var liHTML = '<li xheight=12px; style="font-size:70%;" form-data-id="' + formData.id + '">' +
                            '<a href="javascript:;" class = "test">' +
                            '<img src="'+image+'" class="ui-thumbnail ui-thumbnail-circular" />'+
                            '<div style="margin-top: -3%;">' +
                            '<p xclass="ul-li-aside" style="float:right;font-size:30%;"><strong>' + moment(formData.last_modified_time).format('h:mm A') + '</strong></p>' +
                            '<div style = "float: left">' +
                            '<h2>' + formTitle + ' <i class = "'+errorIcon+'"></i></h2>' + //formData.title //
                            '<p style="font-size:30%; margin-top: -3%;margin-bottom: -3%"><strong>' + description.form_name + '</strong></p>' +
                            '</div>' +

                            '</div>' +
                            '</a>' +
                            '</li>';
                        html += liHTML;
                    }
                }