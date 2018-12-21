var plays = [];
var colors = [];
var visibleLayerIds = [];
var c_place = '';
var visiblePlays = [];
var c_chars = [];
var mapIDs = {'England':'ccqxorep', 'Mediterranean':'5k4mo5s5', 'London': 'b3drdggn'};
var overlay = '';
var o_state = 0;

function createMap(color_dict, map) {
    function filterbyplay(c_arr, p_arr) {
        var acc = [];
        for(i = 0; i < c_arr.length; i++){
            var item = c_arr[i];
            var c = item[0];
            var p = item[1];
            if (p_arr.includes(p)) {
                acc.push(item);
            };
        }
        return acc;
    };
    for (var key in color_dict) {
        plays = plays.concat(key);
        colors = colors.concat(color_dict[key]);
    };
    function makeLayer(play) {
        return (play + '_labels');    
    };

    function makeHLayer(layer) {
        return (layer + '-heat');
    };
    var layers = plays.map(makeLayer);
    var h_layers = layers.map(makeHLayer);
    for (var i = 0; i < plays.length; i++) {
        visibleLayerIds = visibleLayerIds.concat(plays[i] + '_labels');
    };
    var LayerIds = visibleLayerIds;
    map.addSource('labels', {
        "type": "geojson",
        "data": "./data/labels3.geojson"
    });
    //this layer stays hidden, holds aggregate data
    map.addLayer({
        "id": "labels",
        "type": "circle",
        "source": "labels",
        'paint': {
            'circle-opacity': 0
        }
    });
    //loop to add sources and layers for all plays
    layers.forEach(function(item, index, array){
        fpath = './data/Labels/' + item + '.geojson';
        layer_name = item;
        color = colors[index];
        map.addSource(layer_name, {
            'type': 'geojson',
            'data': fpath
        });
        map.addLayer({
            'id': layer_name,
            'type': 'circle',
            'source': layer_name
        });

        //adding heat map layers
//        map.addLayer({
//            'id': layer_name + '-heat',
//            'type': 'heatmap',
//            'source': layer_name,
//            'maxzoom': 9,
//            'paint': {
//                // Increase the heatmap color weight weight by zoom level
//                // heatmap-intensity is a multiplier on top of heatmap-weight
//                "heatmap-intensity": [
//                    "interpolate",
//                    ["linear"],
//                    ["zoom"],
//                    0, 1,
//                    9, 3
//                ],
//                // Adjust the heatmap radius by zoom level
//                "heatmap-radius": [
//                    "interpolate",
//                    ["linear"],
//                    ["zoom"],
//                    0, 2,
//                    9, 20
//                ],
//                // Transition from heatmap to circle layer by zoom level
//                "heatmap-opacity": [
//                    "interpolate",
//                    ["linear"],
//                    ["zoom"],
//                    7, 1,
//                    9, 0
//                ]
//            },
//            "layout": {
//                "visibility": 'none'
//            } 
//        });
        map.setPaintProperty(layer_name, 'circle-color', color);
        //changes the mouse when it encounters a label
        map.on('mouseenter', layer_name, function () {
            map.getCanvas().style.cursor = 'pointer';
        });
        
        //preview names of places on mouseover
        var popup = {};
        map.on('mouseover', layer_name, function(e){
            var layer = e.features[0].layer.id
            var features = e.features;
            var coordinates = e.features[0].geometry.coordinates.slice();
            var place_n = e.features[0].properties["place name"];
            c_place = place_n;
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
    //function to create FDT URL given play and asln
    function mkURL(play, asl) {
        var base = 'https://www.folgerdigitaltexts.org/?chapter=5&play=';
        var p_dict = {
            'Henry VIII': 'H8',
            'Henry IV, Part I': '1H4',
            'Henry IV, Part II': '2H4',
            'Henry V': 'H4',
            'Henry VI, Part 1': '1H6',
            'Henry VI, Part 2': '2H6',
            'Henry VI, Part 3': '3H6',
            'King John': 'Jn',
            'Richard II': 'R2',
            'Richard III': 'R3',
            'Titus Andronicus': 'Tit',
            'Julius Caesar': 'JC',
            'Antony and Cleopatra': 'Ant',
            'Coriolanus': 'Cor',
            'Pericles': 'Per',
            'Timon of Athens': 'Tim',
            'Troilus and Cressida': 'Tro'
        };
        var p_abv = p_dict[play];
        var l_base = '&loc=line-';
        var l = l_base + asl
        return base + p_abv + l
    };
    // When a click event occurs on a feature in the labels layer generate a list of mentions
    map.on('click', 'labels', function (e) {
        console.log('clicked!');
        var coordinates = e.features[0].geometry.coordinates.slice();
        var place = c_place;
        var play_acc = []
        var l = e.features.length;
        var descriptions = '<h3>' + place + '</h3><ul>';
        for (i = 0; i < l; i++){
            var play = e.features[i].properties.play;
            var id = play + '_labels';
            //this ensures that only visible layers can be clicked
            if (visibleLayerIds.includes(id)) {
                if (play_acc.includes(play) == false) {
                    play_acc.push(play);
                }
                var character = e.features[i].properties.character;
                var asl_num = e.features[i].properties["a.s.l."];
                var url = mkURL(play, asl_num);
                var n_d = '<li class=\'ref\'>' + play + ', ' + 
                    //adding function to highlight one character's lines at a time 'ca' = custom attribute
                    '<a ca2=\"' + character + '\"' + 'class=\"char_select\"' + '>' + character + '</a>' 
                    + ', ' + '<a href=\'' + url + '\' target=\'_blank\'>' + asl_num + '</a></li>';
                var descriptions = descriptions + n_d;
            }
        };
        descriptions = descriptions + '</ul>'
        //i_chars 'initial characters' these should be from only the plays that mention this place
        i_chars = filterbyplay(c_chars, play_acc);
        //r_chars 'relevant characters' these are the characters whose names include the place name
        r_chars = []
        for (i = 0; i < i_chars.length; i++) {
            char = i_chars[i][0];
            charray = char.split(" ");
            for (x = 0; x < charray.length; x++) {
                if (charray[x] == c_place) {
                    r_chars.push(i_chars[i]);
                }
            }
            
        }
        if (r_chars.length != 0) {
            var base = 'These mentions might refer to '
            for (v = 0; v < r_chars.length; v++){
                if (v > 0) {
                    base = base + " or " + r_chars[v][0] + " from " + r_chars[v][1]
                }
                else {
                    base = base + r_chars[v][0] + " from " + r_chars[v][1]
                }
            }
            descriptions = '<div id=chars>' + base + '</div>' + descriptions 
        }
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
    
    //helper function to add multiple attributes in one line
    function setAttributes(el, attrs) {
          for(var key in attrs) {
            el.setAttribute(key, attrs[key]);
          }
    };

    //helper function to remove specific item from an array
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
        visiblePlays = visibleLayerIds.map(function(item) {
            return item.replace('_labels', '');
        });
        c_chars = filterbyplay(p_chars, visiblePlays);
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
            link.className = 'active';
            link.textContent = ps[i];


            link.onclick = function() {
                //clickedLayer ~ Coriolanus_labels (refers to layer)
                //clickedLayerID ~ color_2 (refers to link on the menu)
                var clickedLayer = this.getAttribute('layer_id');
                var clickedLayerID = this.getAttribute('id');
                if (this.className === 'active') {
                    this.className = 'inactive';
                }
                else {
                    this.className = "active"
                }
                visibleLayerToggle(clickedLayer);
            };
            //heatmap on double click
//            link.ondblclick = function(e) {
//                //clickedLayer ~ Coriolanus_labels (refers to layer)
//                //clickedLayerID ~ color_2 (refers to link on the menu)
//                var clickedLayer = this.getAttribute('layer_id') + '-heat';
//                var clickedLayerID = this.getAttribute('id');
//                let el = document.getElementById(clickedLayerID);
//                var viz = map.getLayoutProperty(clickedLayer, 'visibility')
//                if (viz === 'visible') {
//                    map.setLayoutProperty(clickedLayer, 'visibility', 'none')
//                }
//                else {
//                    map.setLayoutProperty(clickedLayer, 'visibility', 'visible')
//                }
//            };
            var menu = document.getElementById('menu');
            menu.appendChild(link);
            menu.style.display = 'inline-block';
        }
        $('#menu').append('<a id=\'overlays\'>Toggle Historical Maps</a>');
        var map_options = document.createElement('ul');
        map_options.setAttribute('id', 'map_options');
        map_options.setAttribute('style', 'display: none; list-style: none;');
        
        //opacity slider
        var o_slide = document.createElement('input');
        o_slide.setAttribute('type', 'range');
        o_slide.setAttribute('min', '0');
        o_slide.setAttribute('max', '5');
        o_slide.setAttribute('step', '1');
        o_slide.setAttribute('value', '5');
        o_slide.setAttribute('width', '80%');
        o_slide.setAttribute('id', 'o_slide');
        o_slide.className = 'slider';
        o_slide.onchange = function (e) {
            var v = (parseInt(e.target.value))/5;
            if (overlay != ''){
                map.setPaintProperty(overlay, 'raster-opacity', v);
            }
        };
        //loop to add map overlay options
        for (map_name in mapIDs) {
            var base_url = 'mapbox://cgwebb18.';
            var id = mapIDs[map_name];
            map.addSource(map_name, {
                "type": 'raster',
                "url": base_url + id,
                "tileSize": 256
            });
            map.addLayer({
                'id':  map_name,
                'type': 'raster',
                'source': map_name,
                'layout': {
                    'visibility': 'none'
                }
            }, layers[0]);
            var option = document.createElement('li');
            option.setAttribute('class', 'o_option');
            option.textContent = map_name;
            option.setAttribute('id', map_name);
            var l_overlay = ''
            //should toggle this map layer
            option.onclick = function(e) {
                //store the last overlay so we can check if we need to append this for the first time or just change the display
                if (overlay === '') {
                    map.setLayoutProperty(e.target.id, 'visibility', 'visible');
                    document.getElementById(e.target.id).className = 'i_option';
                    if (l_overlay === '') {
                        document.getElementById('menu').appendChild(o_slide);
                    }
                    else {
                        document.getElementById('o_slide').style.display = 'inline-block';
                    }
                }
                else if (overlay === e.target.id) {
                    map.setLayoutProperty(overlay, 'visibility', 'none');
                    document.getElementById(e.target.id).className = 'o_option';
                    document.getElementById('o_slide').style.display = 'none';
                }
                else {
                    map.setLayoutProperty(overlay, 'visibility', 'none');
                    document.getElementById(overlay).className = 'o_option';
                    map.setLayoutProperty(e.target.id, 'visibility', 'visible');
                    document.getElementById(e.target.id).className = 'i_option';
                    document.getElementById('o_slide').style.display = 'inline-block';
                }
                l_overlay = overlay;
                if (overlay === e.target.id) {
                    overlay = '';
                }
                else {
                    overlay = e.target.id;
                }
                
                
            };
            
            map_options.appendChild(option);
        };
        
        document.getElementById('menu').appendChild(map_options);
        $(document).on('click', '#overlays', function() {
            var v = document.getElementById('map_options').style.display;
            if (v === 'none'){
                document.getElementById('map_options').style.display = 'block';
            }
            else {
                document.getElementById('map_options').style.display = 'none';
            }
        });
        
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
//    console.log(map.getStyle().layers);

};

