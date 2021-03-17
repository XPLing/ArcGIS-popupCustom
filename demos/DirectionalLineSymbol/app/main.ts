import Map from "esri/Map";
import MapView from "esri/views/MapView";
import Graphic from "esri/Graphic";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import esriConfig from "esri/config";
import Polyline from "esri/geometry/Polyline";

esriConfig.apiKey = "AAPK032ce48cb2ba42f48f3b57a97618b6d6cqtOLTX-vYbtZsDUL2aMW9WZ3vCC-t1grT3a92KnGWpVHG1GqDopfaDClszp9Fe6";
// latest 14 months of unemployment statistics
const graphicsLayer = new GraphicsLayer();
const map = new Map({
  basemap: "osm-standard",
  layers: [graphicsLayer]
});
const view = new MapView({
  container: "viewDiv",
  map: map,
  center: [-118.80500, 34.02700],
  zoom: 13
});

const polyline = new Polyline({
  paths: [
    [
      [-118.821527826096, 34.0139576938577], //Longitude, latitude
      [-118.814893761649, 34.0080602407843], //Longitude, latitude
      [-118.808878330345, 34.0016642996246]  //Longitude, latitude
    ]
  ]
})
const simpleLineSymbol = {
  type: 'simple-line',
  color: [226, 119, 40], // Orange
  width: 2
}

const polylineGraphic = new Graphic({
  geometry: polyline,
  symbol: simpleLineSymbol
})
graphicsLayer.add(polylineGraphic);


view.on("click", (e) => {
  const opts = {
    include: graphicsLayer
  };
  view.hitTest(e, opts).then((res: any) => {
    if (res.results.length) {
      var graphic = res.results.filter(function(result: any) {
        // check if the graphic belongs to the layer of interest
        return result.graphic.layer === graphicsLayer;
      })[0].graphic;
      const geometry = graphic.geometry;
    }
  });
});

// (window as any).popupCustom = PopupCustom;
