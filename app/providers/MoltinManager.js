(function() {
    var config = formelo.require('config');
    var MoltinManager = {
        authenticated : false
    };
    /*
    *  Load properties to this class
    *  MoltinManager.findAll = function(){
    *      // Do stuff
    *  }
    */
    MoltinManager.authenticate = function(callback, errorCB){
        MoltinManager.moltin = new Moltin({publicId: config.keys.clientID});
        MoltinManager.moltin.Authenticate(callback, errorCB, config.keys.clientSecret);
    };
    MoltinManager.moltin = null;
    MoltinManager.access_token  = null;
    MoltinManager.network = function(endpoint, _data, _method){
        var data    = _data      || {};
        var method  = _method    || 'GET';
        var txDeferred = $.Deferred();
        var headers = {};
        headers['Authorization'] = 'Bearer ' + MoltinManager.access_token;
        $.ajax({
                url : endpoint,
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
    MoltinManager.validate = function(data, validationArray) {
        // Using the set of rules, validate that
        validationArray.forEach(function(item){
             if (data[item] === undefined){
                 throw new Error(item + ' key not found.');
             }
        });
    };
    MoltinManager.categories = {
        create : function(data, successCB, errorCB) {
            var url = 'https://api.molt.in/v1/categories';
            MoltinManager.validate(data, ['slug', 'status', 'title', 'description']);
            MoltinManager.network(url, data, 'POST')
                .done(function(data){
                    successCB(data);
                })
                .fail(function(err){
                    errorCB(err);
                });
        },
        getAll : function(successCB, errorCB) {
            MoltinManager.moltin.Category.List(null, function(category) {
                console.log(category);
                successCB(category);
            }, function(error) {
                console.log(error);
                errorCB(error);
            });
            /*var url = 'https://api.molt.in/v1/categories';
            MoltinManager.network(url, null, 'GET')
                .done(function(data){
                    console.log(data);
                    successCB(data.result);
                })
                .fail(function(err){
                    errorCB(err);
                });
                */
        }
    };
    MoltinManager.products = {
        create : function(data, successCB, errorCB){
            var url = 'https://api.molt.in/v1/products';
            MoltinManager.validate(data, [
                'sku', 'title', 'slug', 'price', 'category', 'stock_level', 'stock_status',
                'description', 'requires_shipping', 'catalog_only', 'tax_band', 'status'
            ]);
             MoltinManager.network(url, data, 'POST')
             .done(function(data){
                 console.log(data);
                 successCB(data.result);
             })
             .fail(function(err){
                errorCB(err);
             });
        },
        getProductsByCategory : function(id, successCB, errorCB){
            MoltinManager.moltin.Product.Search({category: id, status: 1}, function(products) {
                console.log(products);
                successCB(products);
            }, function(error) {
                console.log(error);
                errorCB(error);
            });
        },
        getProductByID : function(id, successCB, errorCB){
            MoltinManager.moltin.Product.Get(id, function(product) {
                console.log(product);
                successCB(product);
            }, function(error) {
                // Something went wrong...
                errorCB(error);
            });
        },
        updateProduct : function(){

        },
        deleteProduct : function(){

        }
    };
    MoltinManager.customers = {
        create : function(data, successCB, errorCB){
            MoltinManager.validate(data, ['first_name', 'last_name', 'email']);
            var url = 'https://api.molt.in/v1/customers';
            MoltinManager.network(url, data, 'POST')
                .done(function(data){
                    console.log(data);
                    successCB(data.result);
                })
                .fail(function(err){
                    errorCB(err);
                });
        },
        getProductsByCategory : function(id, successCB, errorCB){
            MoltinManager.moltin.Product.Search({category: id, status: 1}, function(products) {
                console.log(products);
                successCB(products);
            }, function(error) {
                console.log(error);
                errorCB(error);
            });
        },
        getProductByID : function(id, successCB, errorCB){
            MoltinManager.moltin.Product.Get(id, function(product) {
                console.log(product);
                successCB(product);
            }, function(error) {
                // Something went wrong...
                errorCB(error);
            });
        },
        updateProduct : function(){

        },
        deleteProduct : function(){

        }
    };
    MoltinManager.cart = {
        addToCart : function(customerID, productID, quantity, successCB, errorCB){
            var url = 'https://api.molt.in/v1/carts/'+customerID;
            var data = {
                'quantity' : quantity,
                'id' : productID
            };
            MoltinManager.validate(data, ['id', 'quantity']);
            MoltinManager.network(url, data, 'POST')
                .done(function(data){
                    console.log(data);
                    successCB(data);
                })
                .fail(function(err){
                    errorCB(err);
                });
        },
        getItemsInCart : function(customerID, successCB, errorCB){
            var url = 'https://api.molt.in/v1/carts/'+customerID;
            MoltinManager.network(url)
                .done(function(data){
                    console.log(data);
                    successCB(data.result.contents);
                })
                .fail(function(err){
                    console.log(data);
                    errorCB(err);
                });
        }
    };
    formelo.exports('MoltinManager', MoltinManager);
})();