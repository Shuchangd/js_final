// Set up the base maps
mapboxgl.accessToken = 'pk.eyJ1IjoiY3N0YyIsImEiOiJjaXdpdG50bzUwMDAxMm9vMnJjOXgzZm1xIn0.PIfIWUFfEuOISs-XYR3XJw';
var map = new mapboxgl.Map({
    container: 'map',
    center: [118.1681, 24.5543],
    zoom: 10.73,
    style: "mapbox://styles/mapbox/light-v9",
    hash: true,

});
map.on('load', function () {
    map.addSource('prop', {
        "type": "geojson",
        "data": prop,
    });

    map.addSource('prop_cluster', {
        "type": "geojson",
        "data": prop,
        "cluster": true,
        "clusterMaxZoom": 14, // Max zoom to cluster points on
        "clusterRadius": 50 // Radius of each cluster when clustering points (defaults to 50)
    });  
    
    //add heatmap layer
    map.addLayer({
        "id": "prop_heat",
        "type": "heatmap",
        "source": "prop",
        "maxzoom": 19,
        "layout": {
            "visibility": "none"
        },
        "paint": {
            "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                11, intens0,
                18, intens0
            ],

            "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0.1, "rgba(0,0,0,0)",
                0.35, "#00f",
                0.7, '#0f0',
                0.95, "#ff0",
                1, '#DC143C',

            ],
            "heatmap-radius": {
                default: 2,
                stops: [
                    [10, 30],
                    [16, 110]
                ]
            },
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': {
                default: 0.6,
                stops: [
                    [10, 0.6],
                    [16, 0.6]
                ]
            },
        }
    });
    //cluster
    map.addLayer({
        id: "prop_cluster2",
        type: "circle",
        source: "prop_cluster",
        filter: ["has", "point_count"],
        paint: {
            "circle-color":
                [
                    "step",
                    ["get", "point_count"],
                    "#51bbd6",
                    100,
                    "#f1f075",
                    750,
                    "#f28cb1"
                ]
            ,
            "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                100,
                30,
                750,
                40
            ]
        }
    });
    //add count number
    map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "prop_cluster",
        filter: ["has", "point_count"],
        layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12
        }
    });
});

var draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
                polygon: true,
                trash: true
                }
    });


var propTypesSql = ['housing', 'bus', 'park', 
                    'hospital', 'recreation', 'landmark', 
                    'walkway', 'pollution', 'other', 'supermarket', 'bike'];

//change slide
var slides = [
      { mytitle: "Resident Suggestions Explorer", description:"What are the most concerned topics related to urban issues in city of Xiaman, China? I gathered data from Pinstreet, an application that geo-record user suggestions regarding to city issues. The map on the right shows the spacial distribution of all suggestions collected from the local residents. Try and customize the filter and see the result of topics of your interest.", buttontext: "Let's do it!"},
      { mytitle: "Filter by Street Districts", description: "In the Pie Chart section, first click the button below to choose a street district to see where the suggenstions are located and the share of the concerned topics. Hover your cursor on the pie chart for more information.", buttontext: " ", filtername: "Select Street District"},
      { mytitle: "Filter by Street Districts", description: "In the Keyword Cloud section, first click the button below to choose a street district to see the word frequency cloud and explore the common concerns. Hover your cursor on the wordcloud for more information", buttontext: " ", filtername: "Select Street District" },
      { mytitle: "Explore the Spatial Distribution of Topics", description: "There might be some spatial pattern of each topic, for example, suburbs may face more complaints about public transportation than the center city. Select a topic as listed below to check where it locates.", buttontext: " ", filtername: "Select Topics"},
      { mytitle: "Customize Filter Boundary", description: "In this section, you are able to see the topic distribution within the area defined by yourself. Click the draw button on the right of the map to customize your area of interest now. Note: you need to DELETE your previous boundary before drawing a new one.", buttontext: " ", filtername: "Select Topics" }
    ]

var features;
function filterbound(){ 
    var data = draw.getAll();
    features = data;
    var bounds = new mapboxgl.LngLatBounds();
    var coord = data.features[0].geometry.coordinates[0];
    _.map(coord,function(arr){
        bounds.extend(arr);
    })
    var poly = turf.polygon(features.features[0].geometry.coordinates);
    var filterdata = _.filter(prop.features, function(feature){
        if(turf.inside(feature.geometry, poly)){
            return feature;
        }
    })
    var propTypesSql = ['housing', 'bus', 'park', 
                    'hospital', 'recreation', 'landmark', 
                    'walkway', 'pollution', 'other', 'supermarket', 'bike'];

    var piedata = _.map(propTypesSql, function(topic){
                    var individual = _.filter(filterdata, function(arr){
                                if (arr.properties.icontitle == topic) {
                                    return arr;
                                }
                            })
                        return {value: individual.length, name:topic}
                    });
    piechart(piedata, 'piechart');
    map.fitBounds(bounds);
}


var drawstate = 0;
var loadSlide = function(slide,i) {
    currentSlide = i;
    if(i==0){
        var frame = document.getElementById('myframe');
        frame.style.visibility = 'hidden'
        if(drawstate==1){
            map.removeControl(draw);
            drawstate = 0;
        }
        $('.mybutton').hide();
        $('#mytitle').text(slide.mytitle)
        $('#description').text(slide.description)
        $('#button-text').text(slide.buttontext)
        map.getSource('prop_cluster').setData(prop)
        map.setCenter([118.1681, 24.5543])
        map.setLayoutProperty('prop_heat', 'visibility', 'none');
        map.setLayoutProperty('prop_cluster2', 'visibility', 'visible');
        map.setLayoutProperty('cluster-count', 'visibility', 'visible');
    }else{
        var frame = document.getElementById('myframe');
        frame.style.visibility = 'visible'
        $('#mytitle').text(slide.mytitle);
        $('#description').text(slide.description);
        $('#button-text').text(slide.buttontext);
        $('#myfilter').text(slide.filtername);
      if(i==1){
        if(drawstate==1){
            map.removeControl(draw);
            drawstate = 0;
        }
        $('.mybutton').show();
        $('#myfilter').show();
        $('.dropbtn').show();
        $('#streetfilter').show();
        $('#left').text('Pie Chart');
        $('#right').text('Word Cloud');
        if(chartnumber == 1){
            $('#piechart').show();
            $('#keyword').hide();
        }else if(chartnumber == 0){
            $('#piechart').hide();
            $('#keyword').show();            
        }
        $('#mytopic').hide();
      }else if(i==3){
        if(drawstate==1){
            map.removeControl(draw);
            drawstate = 0;
        }
        $('#streetfilter').hide();
        $('.mybutton').show();
        $('#mytopic').show();
        $('#left').text('Point Map');
        $('#right').text('Heatmap');
      }else if(i == 4){
        if(drawstate==0){
            map.addControl(draw);
            drawstate = 1;
        }
        map.on('draw.create', filterbound);
        $('#myfilter').hide();
        $('#mytopic').hide();
        $('.dropbtn').hide();
        $('#streetfilter').show();
        $('.mybutton').hide();
        $('#keyword').hide();
        $('#piechart').show();
        map.setLayoutProperty('prop_heat', 'visibility', 'none');
        map.setLayoutProperty('prop_cluster2', 'visibility', 'visible');
        map.setLayoutProperty('cluster-count', 'visibility', 'visible');
      }
    }
    }


var chartnumber = 1;
var currentSlide = 0;
// Change button color after click
function switchmodule(btn) {
        var left = document.getElementById('left');
        var right = document.getElementById('right');
        if (btn == 'left') {
            left.style.backgroundColor = "#4c7ca8";
            right.style.backgroundColor = "#132f49"; 
            if(currentSlide == 1){;
                $('#description').text(slides[1].description);
                $('#keyword').hide();
                $('#piechart').show();
                chartnumber = 1; 
                piechart(graphicdata1, 'piechart');
            }
            else if(currentSlide == 3){
                map.setLayoutProperty('prop_heat', 'visibility', 'none');
                map.setLayoutProperty('prop_cluster2', 'visibility', 'visible');
                map.setLayoutProperty('cluster-count', 'visibility', 'visible');
            }
        }
        else {
            left.style.backgroundColor = "#132f49";
            right.style.backgroundColor = "#4c7ca8";
            if(currentSlide == 1){
                $('#description').text(slides[2].description);
                $('#piechart').hide();
                $('#keyword').show();
                chartnumber = 0; 
                wordcloud(graphicdata2, 'keyword');
            }
            else if(currentSlide == 3){
                 map.setLayoutProperty('prop_heat', 'visibility', 'visible');
                map.setLayoutProperty('prop_cluster2', 'visibility', 'none');
                map.setLayoutProperty('cluster-count', 'visibility', 'none');
            }
        }
}


// wordcloud 
function wordcloud(data, id) {
    var myChart = echarts.init(document.getElementById(id));

    myChart.setOption({
            backgroundColor: 'transparent',
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            series: [{
                type: 'wordCloud',
                shape: 'circle',
                sizeRange: [(8 + data.length / 450), (120 - data.length / 200)],
                rotationRange: [0, 0],
                rotationStep: 0,
                gridSize: (8 - data.length / 160),
                drawOutOfBound: false,

                textStyle: {
                    normal: {
                        fontFamily: 'sans-serif',
                        fontWeight: 'normal',
                        // Color can be a callback function or a color string
                        color: function () {
                            // Random color
                            return 'rgba(' + [
                                Math.round(Math.random() * 10),
                                Math.round(Math.random() * 50 + 90),
                                Math.round(Math.random() * 55 + 135),
                                1,
                            ].join(',') + ')';
                        }
                    },
                    emphasis: {
                        shadowBlur: 10,
                        shadowColor: '#444'
                    }
                },
                data: data
            }]
        })
    };



function piechart(data, id){
    myChart1 = echarts.init(document.getElementById(id));
    myChart1.setOption({
    tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
        orient: 'vertical',
        left: 0,
        top: 15,
        itemWidth: 5,
        itemGap: 5,
        itemHeight: 5,
        textStyle:{
            fontSize:8,
        },
        data: data.name,
    },
    series: [
        {
            name: 'Topic:',
            type: 'pie',
            radius: ['45%', '65%'],
            avoidLabelOverlap: true,
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '20',
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: false
            },
            data: data,
        }
    ]
});
}


// Function for filter topics
function myfilter() {
    var selected1 = _.filter(prop.features, function(arr){
      if(propTypesSql.includes(arr.properties.icontitle)){
        return arr;
      }
     })

    var select = {
         "type": "FeatureCollection",
         "features": selected1,
    }

    return select;
}

Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};
Array.prototype.add = function (val) {
    var index = this.indexOf(val);
    if (index === -1) {
        this.push(val);
    }
};

function filter(e, propType) {
    e.src = e.src.split('/')[e.src.split('/').length - 1].indexOf('-2.png') < 0 ? './images/icon/' + propType + '-2.png' : './images/icon/' + propType + '-3.png';
    if (e.src.split('/')[e.src.split('/').length - 1].indexOf('-2.png') !== -1) {
        propTypesSql.remove(propType);
    } else {
        propTypesSql.add(propType);
    }

    var selected4 = myfilter();

    var bounds = new mapboxgl.LngLatBounds();
    selected4.features.forEach(function(feature) {
        bounds.extend(feature.geometry.coordinates);
    });

    map.fitBounds(bounds);
    map.getSource('prop_cluster').setData(selected4)

    if(currentSlide==3){
        map.setFilter('prop_heat', ["in","icontitle"].concat(propTypesSql));
        changeHeatPaint(selected4);
    }

    return propTypesSql;
}

var graphicdata1;
var graphicdata2;


function street(streetname) {
    var selected1 = _.filter(prop.features, function(arr){
      if(arr.properties.county == streetname){
        return arr;
      }
     })
    var propTypesSql = ['housing', 'bus', 'park', 
                    'hospital', 'recreation', 'landmark', 
                    'walkway', 'pollution', 'other', 'supermarket', 'bike'];

    var piedata = _.map(propTypesSql, function(topic){
                    var individual = _.filter(selected1, function(arr){
                                if (arr.properties.icontitle == topic) {
                                    return arr;
                                }
                            })
                        return {value: individual.length, name:topic}
                    });
    graphicdata1 = piedata;
    

    var wcdatalist = []
    _.map(selected1, function(arr){
                wcdatalist = wcdatalist.concat(arr.properties.formatted_text);
            })

    var uniqueItems = Array.from(new Set(wcdatalist))
    var wcdata = _.map(uniqueItems, function(word){
            var allword = _.filter(wcdatalist, function(allword){
                if(allword == word){
                        return allword;
                    } 
                })
                return {value: allword.length, name: word}
            })
    graphicdata2 = wcdata;

    if (chartnumber == 1){
        piechart(piedata, 'piechart');
    }
    else{
        wordcloud(wcdata, 'keyword');
    }
   
    var select = {
         "type": "FeatureCollection",
         "features": selected1,
    }

    var bounds = new mapboxgl.LngLatBounds();
    selected1.forEach(function(feature) {
        bounds.extend(feature.geometry.coordinates);
    });

    map.fitBounds(bounds);
    map.getSource('prop_cluster').setData(select);

}

// Customize heatmap intensity based on the number of points
var range = geojsonExtent(prop);
var sw = new mapboxgl.LngLat(range[0], range[1]);
var ne = new mapboxgl.LngLat(range[2], range[3]);
var polygon = turf.polygon([[[range[0], range[1]], [range[2], range[1]], [range[2], range[3]], [range[0], range[3]], [range[0], range[1]]]]);
var area = turf.area(polygon);
var intens0 = 0.03 + 0.02 * Math.log(area / Math.pow(prop.features.length, 2.75));

function get_intensity(x) {
    if (x.features.length != 0) {
        var num = x.features.length;
        var dens = area / Math.pow(num, 2.7);
        var intens = 0.06 + 0.02 * Math.log(dens);
    }
    else {
        intens = 0.18;
    }
    console.log(intens)
    return intens
}


function doAll(propType) {
    if (propType === "no") {
        propTypesSql = ['no'];
        map.setFilter('prop_heat', ["in","icontitle","no"]);
        map.getSource('prop_cluster').setData({
                "type": "FeatureCollection",
                "features": []
            })
        
        var elements = document.getElementsByClassName('attributeListBoday')[0].children;
        for (var i = 0, length = elements.length; i < length; i++) {
            var src = elements[i].children[0].children[0].src;
            if (src && src.split('/')[src.split('/').length - 1].indexOf('-2.png') < 0) {
                    elements[i].children[0].children[0].src = elements[i].children[0].children[0].src.replace('-3.png', '-2.png')
                }
            }
        }
    else {
        var propTypesSql = ["in","icontitle",'housing', 'bus', 'park', 
                    'hospital', 'recreation', 'landmark', 
                    'walkway', 'pollution', 'other', 'supermarket', 'bike'];

        map.setFilter('prop_heat', propTypesSql);
        map.getSource('prop_cluster').setData(prop)
        

        var elements = document.getElementsByClassName('attributeListBoday')[0].children;
        for (var i = 0, length = elements.length; i < length; i++) {
            var src = elements[i].children[0].children[0].src;
            if (src && src.split('/')[src.split('/').length - 1].indexOf('-3.png') < 0) {
                elements[i].children[0].children[0].src = elements[i].children[0].children[0].src.replace('-2.png', '-3.png')
            }
        }
    }

    if(currentSlide==4&propType=="all"){
        changeHeatPaint(prop)
    }
}


function changeHeatPaint(data) {
    var intensity = get_intensity(data);
    map.setPaintProperty('prop_heat', 'heatmap-intensity', [
        "interpolate",
        ["linear"],
        ["zoom"],
        11, intensity,
        18, intensity
    ]);
    map.setPaintProperty('prop_heat', 'heatmap-color', [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0.1, "rgba(0,0,0,0)",
        0.35, "#00f",
        0.7, '#0f0',
        0.98, "#ff0",
        1, '#DC143C',
    ]);
    map.setPaintProperty('prop_heat', 'heatmap-radius', {
        default: 3,
        stops: [
            [10, 25],
            [16, 90]
        ]
    });
    map.setPaintProperty('prop_heat', 'heatmap-opacity', {
        default: 0.6,
        stops: [
            [10, 0.6],
            [16, 0.6]
        ]
    });

}





/* When the user clicks on the button, 
toggle between hiding and showing the dropdown content */
function dropdownshow() {
  document.getElementById("myDropdown").classList.toggle("show");
}


// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}



