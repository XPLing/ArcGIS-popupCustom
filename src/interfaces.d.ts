import WidgetProperties = __esri.WidgetProperties;
import MapView from "esri/views/MapView";
import Point from "esri/geometry/Point";
import Graphic from "esri/Graphic";
import Geometry from "@arcgis/core/geometry/Geometry";

export interface ScreenPoint {
  x: number;
  y: number;
}

export type  PopupLocation = Point | Graphic | Geometry

interface BaseOptions {
  title?: string | HTMLElement;
  content?: string | HTMLElement;
  location?: PopupLocation;
  visible?: boolean;
  hideOther?: boolean;// hide other popup when active popup showing
}

export interface PopupSetOptions extends BaseOptions {
  reopen?: boolean
}

export interface PopupCustomProperties extends BaseOptions {
  view: MapView;
  graphic?: Graphic;
  autoAdjustZIndex?: boolean; // auto adjust popup's zIndex when click
  [k: string]: any
}

export interface PopupCustomWidgetProperties extends WidgetProperties, PopupCustomProperties {
}
