(function(){
    'use strict';
    var config = formelo.require('config');
    var MoltinManager = formelo.require('MoltinManager');
    var customerData = null;
    var customerID = null;
    formelo.event().onCreate(function(){
        // Entry point of this application
        customise();
        showCheckoutButton();
    });

    formelo.event().onIntent(function(params){
        customerData = params.detail.customerData;
        customerID = params.detail.customerID;
        // Receive parameters from calling page
    });

    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    function customise(){
        formelo.html().get.header.title().html("Billing Address");
    }
    function showSaveButton(){
        var data = [{
            'name' : 'Save',
            'unique' : 'save'
        }];
        formelo.ui().actionBars(data, function(unique){
            if (unique == 'save'){
                submit();
            }
        });
    }
    function getValues(){
        var firstname = $('#billing_firstname').val();
        var lastname = $('#billing_lastname').val();
        var address = $('#billing_address').val();
        var city = $('#billing_city').val();
        var state = $('#billing_state').val();
        var country = $('#billing_country').val();
        var zip = $('#billing_zip').val();
        if (!(address && city && zip &&
            state && country
            && firstname && lastname
            ))
        {
            throw new Error('Kindly check your form and try again');
        }
        return  {
            save_as : 'Home',
            first_name : firstname,
            last_name : lastname,
            address_1:  address,
            city:       city,
            county:     state,
            country:    country,
            postcode:   zip
        };
    }
    function submit(){
        try {
            var data = getValues();
            return checkout(customerID, data);
            // Create address
            console.log('Creating address for '+customerData.id);
            MoltinManager.customers.createAddress(customerData.id, data, function(data){
                // Add to cart
                console.log(data);
                checkout(customerData.id, data.result.id);
            }, function(err){
                console.log('Error is '+JSON.stringify(err));
                console.log(err);
            });
        } catch (e){
            if (config.inProductionMode()){
                showMessage(e.message);
            }
        }
    }
    function showCheckoutButton(){
        var data = [
            {
                'icon' : 'fa fa-shopping-cart',
                'text' : 'Proceed to Checkout',
                'unique' : 'checkout'
            }
        ];
        formelo.ui().footer(data, function(data){
            checkout(customerID, getValues());
        });
    }
    function checkout(customerID, billingAddressID){
            console.log('Checking out that ass...' +JSON.stringify(billingAddressID)+ ' For user '+customerID);
            MoltinManager.cart.checkout(customerID, billingAddressID, function (data) {
                console.log('Ass checked out ' + data);
                formelo.navigation().result();
            }, function(err){
                console.log('An error occured '+err);
            })
    }
}());