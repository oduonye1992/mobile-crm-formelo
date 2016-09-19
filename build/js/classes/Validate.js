var isValid = {
    email: function(email) {
        var str     = email;
        var isValidEmail = false;
        var filter  =/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
        if (str && str.trim().length && filter.test(str))
            isValidEmail = true;
        else{
            isValidEmail = false;
        }
        return isValidEmail;
    },
    url: function(url) {

    },
    number: function(number) {
        var isValidNumber = false;
        if(isNaN(number)){
            isValidNumber = false;
        } else {
            isValidNumber = true;
        }
        return isValidNumber;
    },
    date: function() {

    }
}