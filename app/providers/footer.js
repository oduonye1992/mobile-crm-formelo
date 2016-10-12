(function() {
    var footer = {};
    footer.items = {
        'home' : {
            'icon' : 'fa fa-file-picture-o',
            'text' : 'Store',
            'link' : null,
            'active' :  false,
            'unique' : 'shop'
        },
        'cart' : {
            'icon' : 'fa fa-shopping-cart',
            'text' : 'My cart',
            'link' : null,
            'active' :  false,
            'unique' : 'cart'
        },
        'deals' : {
            'icon' : 'fa fa-money',
            'text' : 'Deals',
            'link' : null,
            'active' :  false,
            'unique' : 'deals'
        },
        'more' : {
            'icon' : 'fa fa-ellipsis-h',
            'text' : 'More',
            'link' : null,
            'active' :  false,
            'unique' : 'more'
        }
    };
    footer.build = function(activeItem){
        // Parse data
        var data = [];
        for(var key in this.items) {
            if (this.items.hasOwnProperty(key)){
                this.items[key]['active'] = key === activeItem;
                data.push(this.items[key]);
            }
        }
        formelo.ui().footer(data, function(unique){
             if (unique === 'cart'){
                 formelo.navigation().openActivity('cart');
             } else if (unique === 'shop') {
                 formelo.navigation().openActivity('home');
             } else if (unique == 'deals') {
                 formelo.navigation().openActivity('deals');
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