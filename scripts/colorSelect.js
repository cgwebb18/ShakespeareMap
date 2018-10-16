var plays = ['Titus Andronicus', 'Coriolanus', 'Troilus and Cressida', 'Pericles', 'Timon of Athens', 'Antony and Cleopatra', 'Julius Caesar']
var color_dict = {};
var current_play = '';
var current_color = '';

$(document).ready(function() {
    plays.forEach(function(item, index, array){
        var fpath = './data/Labels/' + item + '_labels.geojson';
        var title = document.createTextNode(item);
        var li = document.createElement('li');
        li.setAttribute('class', 'play');
        li.setAttribute('id', ('play_' + index));
        li.appendChild(title);
        $('#play_list').append(li);
    });
    //click functions of .play and .color should be related so that the color list shows the associated plays dynamically
    $('.play').click(function(e) {
        //neither current_play nor current_color
        if (current_color == '' && current_play == '') {
            current_play = e.target.textContent;
        }
        //current_color but no current_play
        else if (current_color != '' && current_play == '') {
            t = document.getElementById(current_color);
            current_play = e.target.textContent;
            //check if the play has already been assigned to be a color
            if (current_play in color_dict) {
                c_id = color_dict[current_play];
                document.getElementById(c_id).textContent = "Play " + c_id.substr(6);
            }
            t.textContent = current_play;
            color_dict[current_play] = current_color;
        }
        //current_play but no current_color
        else if (current_color == '' && current_play != '') {
            current_play = e.target.textContent;
        }
        //both current play and current color
        else {
            current_color = '';
            current_play = e.target.textContent;
        };
    });
    $('.color').click(function(e) {
        if (e.target.textContent.substr(0, 4) != 'Play') {
                e.target.textContent = 'Play ' + e.target.id.substr(6);
        };
        //neither current_play nor current_color
        if (current_color == '' && current_play == '') {
            current_color = e.target.id;
        }
        //current_color but no current_play
        else if (current_color != '' && current_play == '') {
            current_color = e.target.id;
        }
        //current_play but no current_color
        else if (current_color == '' && current_play != '') {
            if (current_play in color_dict){
                c_id = color_dict[current_play];
                document.getElementById(c_id).textContent = "Play " + c_id.substr(6);
            }
            e.target.textContent = current_play;
            current_color = e.target.id;
            color_dict[current_play] = current_color;
        }
        //both current play and current color
        else {
            current_play = '';
            current_color = e.target.id;
        };
    });
    $('#submit').click(function(){
        for (var key in color_dict) {
            console.log(document.getElementById(color_dict[key]))
            color_dict[key] = document.getElementById(color_dict[key]).getAttribute('hex');
        }
        console.log(color_dict);
    });
});
        
        
        