(function() {
    var footer = {};
    var config = formelo.require('config');
    footer.items = {
        'deal' : {
            'icon' : 'fa fa-money',
            'text' : 'Deals',
            'link' : null,
            'active' :  false,
            'unique' : 'deal'
        },
        'activity' : {
            'icon' : 'fa fa-calendar',
            'text' : 'Activities',
            'link' : null,
            'active' :  false,
            'unique' : 'activity'
        },
        'contact' : {
            'icon' : 'fa fa-users',
            'text' : 'Contacts',
            'link' : null,
            'active' :  false,
            'unique' : 'contact'
        },
        'organization' : {
            'icon' : 'fa fa-building-o',
            'text' : 'Organizations',
            'link' : null,
            'active' :  false,
            'unique' : 'organization'
        }
    };
    footer.build = function(activeItem){
        // Parse data
        var items = this.items;
        delete items['settings'];
        if (!config.isAdmin){
            delete items['settings'];
        }
        var data = [];
        for(var key in items) {
            if (items.hasOwnProperty(key)){
                items[key]['active'] = key === activeItem;
                data.push(items[key]);
            }
        }
        formelo.ui().footer(data, function(unique){
             if (unique === 'deal'){
                 formelo.navigation().openActivity('Deals');
             } else if (unique === 'activity') {
                 formelo.navigation().openActivity('activity');
             } else if (unique == 'contact') {
                 formelo.navigation().openActivity('contact');
             } else if (unique == 'organization') {
                 formelo.navigation().openActivity('organization');
             }
        });
    };
    /*
    *  Load properties to this class
    *  footer.findAll = function(){
    *      // Do stuff
    *  }
    */
    formelo.exports('footer', footer);
})();