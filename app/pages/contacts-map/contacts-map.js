(function(){
    'use strict';
    formelo.event().onCreate(function(){
        // Entry point of this application
        showMap([]);
    });

    formelo.event().onIntent(function(params){
        var data = params.detail;
        // Receive parameters from calling page
    });

    formelo.event().onClose(function(){
        // Override close button
        // formelo.navigation.stopPropagation()
    });
    var showMap = function(dataArr){
        var myLatLng = {lat: 6.5569563, lng: 3.357436};

        var map = new google.maps.Map(document.getElementById('mymap'), {
            zoom: 12,
            center: myLatLng
        });

        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            title: 'Hello World!'
        });
        marker.setMap(map);
        dataArr.forEach(function(item){
            if (item['749c9691125047f8865302960302d325ccf7efd2'] && item['66f7539b280bebcc93b39757b5581d88a30c8646']){
                var latLng = {lat: item['66f7539b280bebcc93b39757b5581d88a30c8646'], lng: item['749c9691125047f8865302960302d325ccf7efd2']};
                var marker = new google.maps.Marker({
                    position: latLng,
                    map: map,
                    title: 'Hello World!'
                });
                marker.setMap(map);
                var contentString = '<div data-id="'+item.id+'" id="mapcontent">'+
                    '<div id="siteNotice">'+
                    '</div>'+
                    '<h5>'+item.name+'</h5>'+
                    '<h6>'+item.org_name+'</h6><hr>'+
                    '<p style="color:grey;">'+item['0d408096edbdf5a2490214ab299b006c564f173c']+'</p><hr>'+
                    '<button class="btn btn-xs btn-complete mapitem" data-id="'+item.id+'">View Contact Detail</p>'+
                    '</div>'+
                    '</div>';
                var infowindow = new google.maps.InfoWindow({
                    content: contentString
                });
                marker.addListener('click', function() {
                    infowindow.open(map, marker);
                });

                google.maps.event.addListener(infowindow,'domready',function(){
                    $('#mapcontent').click(function() {

                        var id = $(this).attr('data-id');

                        formelo.navigation().openActivity(8, {id:id});
                    });
                });

            }
        });
    };
}());