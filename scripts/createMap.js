var plays = [];
var colors = [];
var visibleLayerIds = [];
function createMap(color_dict, map) {
    console.log(color_dict);
    for (var key in color_dict) {
        plays = plays.concat(key);
        colors = colors.concat(color_dict[key]);
    };
    for (var i = 0; i < plays.length; i++) {
        visibleLayerIds = visibleLayerIds.concat(plays[i].split(' ')[0] + '_labels');
    };
    var LayerIds = visibleLayerIds;
    map.addSource('labels', {
        "type": "geojson",
        "data": "./data/labels2.geojson"
    });
    //this layer stays hidden, holds aggregate data
    map.addLayer({
        "id": "labels",
        "type": "circle",
        "source": "labels",
        "paint": {
            "circle-opacity": 0
        }
    }); 
    //loop to add sources and layers for all plays
    plays.forEach(function(item, index, array){
        fpath = './data/Labels/' + item + '_labels.geojson';
        layer_name = item.split(' ')[0] + '_labels';
        color = colors[index];
        map.addSource(layer_name, {
            type: 'geojson',
            data: fpath
        });
        map.addLayer({
            'id': layer_name,
            'type': 'circle',
            'source': layer_name
        });
        map.setPaintProperty(layer_name, 'circle-color', color);
        //changes the mouse when it encounters a label
        map.on('mouseenter', layer_name, function () {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        //preview name of place on mouseover
        var popup = {};
        map.on('mouseover', layer_name, function(e){
            var coordinates = e.features[0].geometry.coordinates.slice();
            var place_n = e.features[0].properties["place name"];
            popup = new mapboxgl.Popup({closeButton: false})
                .setLngLat(coordinates)
                .setHTML('<h4>' + place_n + '</h4>')
                .addTo(map);
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', layer_name, function () {
            popup.remove();
            map.getCanvas().style.cursor = '';
        });
    });
    // When a click event occurs on a feature in the labels layer generate a list of mentions
    map.on('click', 'labels', function (e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var place = e.features[0].properties["place name"];
        var l = e.features.length;
        var descriptions = '<h3>' + place + '</h3><ul><li>Play, Character, Act.Scene.Line:</li>';
        for (i = 0; i < l; i++){
            var play = e.features[i].properties.play;
            var id = play.split(' ')[0] + '_labels';
            //this insures that only visible layers can be clicked
            if (visibleLayerIds.includes(id)) {
                var character = e.features[i].properties.character;
                var asl_num = e.features[i].properties["act.scene."];
                var n_d = '<li>' + play + ', ' + 
                    //adding function to highlight one character's lines at a time 'ca' = custom attribute
                    '<a ca2=\"' + character + '\"' + 'class=\"char_select\"' + '>' + character + '</a>' 
                    + ', ' + asl_num + '</li>';
                var descriptions = descriptions + n_d;
            }
        };
        descriptions = descriptions + '</ul>'

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(descriptions)
            .addTo(map);
    });
    //TODO make it so that this only works on active layers

    //helper function to remove specific 
    function removeA(arr) {
        var what, a = arguments, L = a.length, ax;
        while (L > 1 && arr.length) {
            what = a[--L];
            while ((ax= arr.indexOf(what)) !== -1) {
                arr.splice(ax, 1);
            }
        }
        return arr;
    };

    //function to handle all Layer Toggling
    function visibleLayerToggle(id) {
        if (visibleLayerIds.includes(id)==true) {
            map.setLayoutProperty(id, 'visibility', 'none');
            removeA(visibleLayerIds, id);
        }
        else {
            visibleLayerIds = visibleLayerIds.concat(id);
            map.setLayoutProperty(id, 'visibility', 'visible');
        };
    };
    //TODO: fix up this function so that it creates a color coded menu (will require a lot of CSS work)
    //this function creates the menu, so the LayerIds can change and it shouldn't affect this
    function createMenu(LIds, ps, cs){
        var color_ref = {
            '#800000':'color_1',
            '#1e87ea':'color_2',
            '#f44e30':'color_3',
            '#911eb4':'color_4',
            '#e6194B':'color_5',
            '#ffff21':'color_6',
            '#49a517':'color_7',
            '#000075':'color_8'
        }
        for (var i = 0; i < LIds.length; i++) {
            var id = color_ref[cs[i]];

            var link = document.createElement('a');
            link.setAttribute('id', id);
            link.setAttribute('layer_id', LIds[i]);
            link.className = '';
            link.textContent = ps[i];


            link.onclick = function(e) {
                var clickedLayer = this.getAttribute('layer_id');
                var clickedLayerID = this.getAttribute('id');
                let el = document.getElementById(clickedLayerID);
                if (el.className == '') {
                    el.className = 'inactive'
                }
                else{
                    el.className = ''
                };
                visibleLayerToggle(clickedLayer);
            };
            var menu = document.getElementById('menu');
            menu.appendChild(link);
        }
         //char_select function
        $(document).on('click', '.char_select', function () {
            if ($('#reset').length == true){
                console.log('Right now you can only select one character at a time.')
            }
            else {
                var character = $(this).attr('ca2');

                for (var i = 0; i < visibleLayerIds.length; i++) {
                    var layer = visibleLayerIds[i];
                    map.setFilter(layer, ['==', ['get', 'character'], character]);
                };

                //adds reset button to menu
                reset = $('<a id=\'reset\'></a>').text('Deselect ' + character).click(function() {
                    console.log('anything');
                    for (var i = 0; i < visibleLayerIds.length; i++) {
                        var layer = visibleLayerIds[i];
                        map.setFilter(layer);
                    };
                    $("#reset").remove();
                });


                $("#menu").append(reset);
            };
        });
    };
    createMenu(LayerIds, plays, colors);

};