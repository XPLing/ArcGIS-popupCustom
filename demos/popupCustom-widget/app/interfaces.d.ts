import WidgetProperties = __esri.WidgetProperties;
import MapView from "esri/views/MapView";
import Point from "esri/geometry/Point";
import Graphic from "esri/Graphic";

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface PopupOpenOptions {
  title?: string | HTMLElement;
  content?: string | HTMLElement;
  graphic?: Graphic;
  location?: Point;
  hideOther?: boolean;
}

export interface PopupCustomProperties {
  view: MapView;
  title?: string | HTMLElement;
  graphic?: Graphic;
  content?: string | HTMLElement;
  location?: Point;
  autoAdjustZIndex?:boolean; // auto adjust popup's zIndex when click
  hideOther?: boolean;// hide other popup when active popup showing
}

export interface PopupCustomWidgetProperties extends WidgetProperties, PopupCustomProperties {
}
