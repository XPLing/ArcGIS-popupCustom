import Map from "esri/Map";
import MapView from "esri/views/MapView";
import FeatureLayer from "esri/layers/FeatureLayer";
import Graphic from "esri/Graphic";
import GraphicsLayer from "esri/layers/GraphicsLayer";
import Polygon from "esri/geometry/Polygon";
import PopupCustom from "./popupCustom";
import esriConfig from "esri/config";
import Point from "esri/geometry/Point";
import Geometry from "esri/geometry/Geometry";
import Color from "esri/Color";

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

const rings: number[][][] = [
  [
    [-118.818984489994, 34.0137559967283], //Longitude, latitude
    [-118.806796597377, 34.0215816298725], //Longitude, latitude
    [-118.791432890735, 34.0163883241613], //Longitude, latitude
    [-118.79596686535, 34.008564864635],   //Longitude, latitude
    [-118.808558110679, 34.0035027131376]  //Longitude, latitude
  ]
];
const polygon = new Polygon({
  rings
});
const attributes = {
  Name: "Graphic",
  Description: "I am a polygon"
};
const simpleFillSymbol = {
  type: "simple-fill",
  color: [227, 139, 79, 0.8],  // Orange, opacity 80%
  outline: {
    color: [255, 255, 255],
    width: 1
  }
};
const polygonGraphic = new Graphic({
  geometry: polygon,
  symbol: simpleFillSymbol,
  attributes: attributes
  // popupTemplate: popupTemplate
});

graphicsLayer.add(polygonGraphic);
const point = new Point({ //Create a point
  longitude: -118.80657463861,
  latitude: 34.0005930608889
});
const simpleMarkerSymbol = {
  type: "simple-marker",
  color: [226, 119, 40],  // Orange
  outline: {
    color: [255, 255, 255], // White
    width: 1
  }
};
const pointGraphic = new Graphic({
  geometry: point,
  symbol: simpleMarkerSymbol
});
graphicsLayer.add(pointGraphic);

const names = [
  { firstName: "John", lastName: "Smith" },
  { firstName: "Jackie", lastName: "Miller" },
  { firstName: "Anna", lastName: "Price" }
];
let nameIndex = 0;

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
      let content = "", location: Point;
      if (graphic.geometry.type === "point") {
        content = "I am a custom point popup!";
        location = geometry;
      } else {
        content = "I am a custom polygon popup!";
        location = geometry.centroid;
      }
      let popup = PopupCustom.getPopup(graphic.popupId);
      if (!graphic.popupId && !popup) {
        popup = createPopup(view, "popupWidget", content, graphic);
      }
      popup.open({
        location: location
      });
    }
  });
  view.when().then(() => {
    document.getElementById("delete").addEventListener("click", () => {
      // const key = Object.keys(popupCollection)[0];
      // popupCollection[key].destroy();
      graphicsLayer.remove(polygonGraphic);
    });
    document.getElementById("reorder").addEventListener("click", () => {
      pointGraphic.geometry = new Point({
        latitude: 34.0005930608889,
        longitude: -118.80657463961
      });
      pointGraphic.symbol.color = new Color("green");
    });
  });
});

function createPopup(view: MapView, container: string = "popupWidget", content?: string | HTMLElement, graphic?: Graphic) {
  const popup = new PopupCustom({
    view,
    content,
    container,
    graphic,
    autoAdjustZIndex: true,
    hideOther: false
  });
  popup.on("closed", (popup) => {
    console.log("closed popup", popup);
  });
  return popup;
}

(window as any).popupCustom = PopupCustom;
