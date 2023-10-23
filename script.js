var markers = []

function openForms() {
    document.getElementById("myForm").style.display = "block";
}

function closeForm() {
    document.getElementById("myForm").style.display = "none";
}

function submitForm() {
    var long = document.getElementById("long").value
    var lat = document.getElementById("lat").value

    console.log(long, lat)

    const marker2 = new maplibregl.Marker({ draggable: true, className: `marker-${markers.length}`})
        .setLngLat([long, lat])
        .on('dragend', (a) => {
            console.log("a", a)
        })
        .on('click', (a) => {
            console.log("a", a.target.getLngLat())
        })
        .addTo(map)
        // .setPopup(popup2)

    markers.push(marker2)
}

// Don't forget to replace <YOUR_ACCESS_TOKEN> by your real access token!
const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=PRZRDk869lSZIQ2Szsuo`,
    zoom: 13,
    center: [-46.565015,  -21.7900],
    hash: true,
}).addControl(new maplibregl.NavigationControl(), "top-right");
// This plugin is used for right to left languages

let scale = new maplibregl.ScaleControl({
    maxWidth: 100,
    unit: 'imperial'
});
map.addControl(scale);

scale.setUnit('kilometers');

maplibregl.setRTLTextPlugin("https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js");

// map.on('click', this.add_marker.bind(this));

function add_marker(event) {
    var coordinates = event.lngLat;
    var marker3 = new maplibregl.Marker().setLngLat(coordinates).addTo(map);
    console.log('Lng:', coordinates.lng, 'Lat:', coordinates.lat);
}

map.on("load", () => {
    // Add the tree cluster image
    map.loadImage(
        "./assets/pin.png",
        (error, image) => {
            if (error) throw error;
            map.addImage("tree-cluster", image);
        },
    );
    // Add the simple tree image
    map.loadImage("./assets/smarker.png", (error, image) => {
        if (error) throw error;
        map.addImage("tree", image);
    });

    // Add a new source from our GeoJSON data and set the "cluster" option to true.
    // MapLibre will add the "point_count" property to your source data
    map.addSource("trees", {
        type: "geojson",
        data: "./assets/dados_pocos.geojson",
        cluster: true,
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
        id: "route",
        type: "line",
        source: {
            type: "geojson",
            data: "./assets/limite.geojson",
        },
        layout: {
            "line-join": "round",
            "line-cap": "round",
        },
        paint: {
            "line-color": "steelblue",
            "line-width": 4,
        },
    });

    // Display the tree type as a separate symbol layer.
    // This layer is optional, to disable you can remove it completely
    map.addLayer({
        id: "tree-label",
        type: "symbol",
        source: "trees",
        filter: ["!", ["has", "point_count"]],
        layout: {
            "text-field": ["get", "arrondissement"],
            "text-padding": 0,
            "text-allow-overlap": false,
            "text-size": 11,
            "text-font": ["Roboto Regular", "Noto Regular"],
            "text-offset": [0, 1.75],
            "text-anchor": "top",
        },
        paint: {
            "text-color": "#5C5C5C",
            "text-halo-color": "#FFFFFF",
            "text-halo-width": 1,
        },
    });

    // Add a tree symbol as a symbol layer with icon.
    map.addLayer({
        id: "tree",
        type: "symbol",
        source: "trees",
        layout: {
            // If the feature has the property "point_count" it means it's a cluster then we use the image "tree-cluster"
            // Otherwise we use the simple "tree" image.
            "icon-image": ["case", ["has", "point_count"], "tree-cluster", "tree"],
            // Display the cluster point count if >= 2
            "text-field": [
                "step",
                ["get", "point_count"],
                "",
                // If the point_count is < 99 then display as "99+"
                2,
                ["step", ["get", "point_count"], ["get", "point_count"], 99, `${99}+`],
            ],
            "icon-padding": 0,
            "text-padding": 0,
            "text-overlap": "always",
            "icon-overlap": "always",
            "text-size": 18,
            "text-font": ["Roboto Bold", "Noto Bold"],
            "text-anchor": "center",
        },
        paint: {
            "text-color": "white",
            // "text-halo-color": "#FFFFFF",
            // "text-halo-width": 1,
            // Translate the text to fit in the center of the top right area
            // Depending on your image, you might tune this value
            "text-translate": [13, -14],
            "text-translate-anchor": "viewport",
        },
    });

    // On click on a cluster, zoom to the expansion zoom level
    map.on("click", "tree", (e) => {
        console.log(e)
        const feature = e.features[0];
        var clusterId = feature.properties.cluster_id;
        console.log(e.features)
        if (clusterId) {
            map.getSource("trees").getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;
                map.easeTo({
                    center: feature.geometry.coordinates,
                    zoom: zoom + 0.5,
                });
            });
        }
        else {
            new maplibregl.Popup({
                closeOnClick: false,
            })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .setHTML("<b>Hello world!</b><br/> I am a popup.")
            .addTo(map);
        }
    });

    map.on("mouseenter", "tree", () => {
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "tree", () => {
        map.getCanvas().style.cursor = "";
    });

    // Basic popup definition

    const coordinates = document.getElementById('coordinates');

    // Popup definition before binding it to a marker
    const markerPopup = new maplibregl.Popup({
        closeOnClick: true,
    }).setHTML("<b> A popup that is shown when you click on a marker</b>");

    // Connect the popup to a new marker

    const marker = new maplibregl.Marker({ draggable: true }).setLngLat([2.24923265275, 48.8716811488]).setPopup(markerPopup).addTo(map)

    marker.on('dragend', onDragEnd);




    // Generate a polygon using turf.circle.
    // See https://turfjs.org/docs/#circle
    function onDragEnd() {
        const lngLat = marker.getLngLat();
        coordinates.style.display = 'block';
        coordinates.innerHTML =
            `Longitude: ${lngLat.lng}<br />Latitude: ${lngLat.lat}`;


        setRadius([lngLat.lng, lngLat.lat])
    }

    function setRadius(center) {
        map.removeLayer("location-radius")
        map.removeLayer("location-radius-outline")
        const radius = 10; // kilometer
        var options = {
            steps: 64,
            units: "kilometers",
        };
        var circle = turf.circle(center, radius, options);

        // Add a fill layer with some transparency.
        map.addLayer({
            id: "location-radius",
            type: "fill",
            source: {
                type: "geojson",
                data: circle,
            },
            paint: {
                "fill-color": "#8CCFFF",
                "fill-opacity": 0.5,
            },
        });

        // Add a line layer to draw the circle outline
        map.addLayer({
            id: "location-radius-outline",
            type: "line",
            source: {
                type: "geojson",
                data: circle,
            },
            paint: {
                "line-color": "#0094ff",
                "line-width": 3,
            },
        });
    }
});
