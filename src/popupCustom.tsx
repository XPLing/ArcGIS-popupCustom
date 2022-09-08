import { subclass, property, aliasOf } from "@arcgis/core/core/accessorSupport/decorators";
import { tsx, isRTL } from "@arcgis/core/widgets/support/widget";
import Widget from "@arcgis/core/widgets/Widget";
import Error from "@arcgis/core/core/Error";
import MapView from "@arcgis/core/views/MapView";
import Point from "@arcgis/core/geometry/Point";
import { VNode } from "esri/widgets/support/interfaces";
import { FeatureContentMixin } from "@arcgis/core/widgets/Feature/support/FeatureContentMixin";
import WidgetProperties = __esri.WidgetProperties;
import SceneView from "@arcgis/core/views/SceneView";
import Handles from "@arcgis/core/core/Handles";
import { watch } from "@arcgis/core/core/watchUtils";
import { uuid } from "./util";
// @ts-ignore
import {
  Alignment,
  PositionValue,
  PositionResult,
  PopupPosition,
  PopupPositionStyle,
  PopupOutsideViewOptions
} from "esri/widgets/Popup/interfaces";
import { PopupCustomWidgetProperties, ScreenPoint, PopupSetOptions, PopupLocation } from "./interfaces";
// UI style css
import { CSS } from "./resources";
import Graphic from "@arcgis/core/Graphic";

const popupCollection = {};
const popupWidgetName = "popupWidget";
let popupIndex = 0;

@subclass("esri.widgets.PopupCustom")
class PopupCustom extends FeatureContentMixin(Widget) {
  //--------------------------------------------------------------------------
  //
  //  Lifecycle
  //
  //--------------------------------------------------------------------------

  constructor(props?: PopupCustomWidgetProperties) {
    super(props);
    this.uid = props.uid = uuid();
    this._createContainer(props.container);
    this.setOption(props);
    this._updateCollection();
    if (this.graphic) {
      this.graphic.popupId = this.uid;
    }
    this.handles.add(watch(this, "visible", (status) => {
      if (status) {
        this.emit("open", this);
      }
    }));
  }

  postInitialize() {
    this._setHandler();
    this._mountContainer();
    this._renderNow();
  }

  destroy() {
    if (popupCollection[this.uid]) {
      popupCollection[this.uid] = null;
    }
    if (this.graphic.popupId) {
      delete this.graphic.popupId;
    }
    this.handles && this.handles.removeAll();
    this.handles && this.handles.destroy();
    this.handles = null;
  }

  render(): VNode {
    const { currentAlignment } = this;
    const baseClasses = {
      [CSS.alignTopCenter]: currentAlignment === "top-center",
      [CSS.alignBottomCenter]: currentAlignment === "bottom-center",
      [CSS.alignTopLeft]: currentAlignment === "top-left",
      [CSS.alignBottomLeft]: currentAlignment === "bottom-left",
      [CSS.alignTopRight]: currentAlignment === "top-right",
      [CSS.alignBottomRight]: currentAlignment === "bottom-right",
      [CSS.shadow]: true
    };
    return (
      <div class={this.classes(CSS.root, baseClasses, this.customClass)}
           onclick={this._handlePopupClick} bind={this}>
        {this.visible ?
          [
            this.renderMainContainer(),
            this.renderPointer()
          ] :
          null}
      </div>
    );
  }

  //--------------------------------------------------------------------------
  //
  //  Variables
  //
  //--------------------------------------------------------------------------

  handles = new Handles();
  //--------------------------------------------------------------------------
  //
  //  Properties
  //
  //--------------------------------------------------------------------------


  //----------------------------------
  //  uid
  //----------------------------------
  @property()
  uid: string;

  //----------------------------------
  //  uid
  //----------------------------------
  @property()
  options: object;

  //----------------------------------
  //  visible
  //----------------------------------
  @property()
  visible: boolean = false;

  //----------------------------------
  //!!  dockEnabled (Not activated)
  //----------------------------------
  @property()
  dockEnabled: boolean = false;

  //----------------------------------
  //  view
  //----------------------------------
  @property()
  view: MapView;

  //----------------------------------
  //  customClass
  //----------------------------------
  @property()
  customClass: string;

  //----------------------------------
  //  graphic
  //----------------------------------
  @property()
  graphic: any;
  //----------------------------------
  //  location
  //----------------------------------
  @property()
  location: Point;

  //----------------------------------
  //  index
  //----------------------------------
  @property()
  get zIndex() {
    return this.zIndex || this.getMaxZIndex();
  };

  set zIndex(val: number) {
    this._set("zIndex", val);
    this._updateContainerStyle("zIndex", val);
  };

  //----------------------------------
  //  pointOffset
  //----------------------------------
  @property()
  get pointerOffset() {
    return this._pointerOffsetInPx;
  };

  set pointerOffset(val: number) {
    this._set("_pointerOffsetInPx", val + 16);
    this.setContainerPosition();
  };

  //----------------------------------
  //  autoAdjustZIndex
  //----------------------------------
  @property()
  autoAdjustZIndex: boolean = false;
  // ----------------------------------
  //  width
  //----------------------------------
  @property()
  get width() {
    return this.width;
  };

  set width(val: any) {
    this._set("width", val);
    this._updateContainerStyle("width", val);
  };

  //----------------------------------
  //  min-width
  //----------------------------------
  @property()
  get height() {
    return this.height;
  };

  set height(val: any) {
    this._set("height", val);
    this._updateContainerStyle("height", val);
  };

  //----------------------------------
  //  screenLocation
  //----------------------------------
  @property({
    dependsOn: ["location"]
  })
  get screenLocation(): ScreenPoint {
    return this._getScreenLocation(this.location);
  };

  set screenLocation(val: ScreenPoint) {
    this._set("screenLocation", val);
    this.setContainerPosition();
  }

  //----------------------------------
  //  content
  //----------------------------------
  @property()
  content: HTMLElement | string = "";

  //----------------------------------
  //  title
  //----------------------------------
  @property()
  title: HTMLElement | string = "";
  //----------------------------------
  //  closeTip
  //----------------------------------
  @property()
  closeTip: string = "close";

  //----------------------------------
  //  closeButton
  //----------------------------------
  @property()
  closeButton: boolean = true;

  //----------------------------------
  //  hideOther
  //----------------------------------
  @property()
  hideOther: boolean = false;

  //----------------------------------
  //  hideTitle
  //----------------------------------
  @property()
  hideTitle: boolean = true;

  //---------------------------------
  // alignment
  //---------------------------------
  @property()
  alignment: Alignment = "auto";
  //----------------------------------
  //  currentAlignment
  //----------------------------------

  /**
   *
   * @type {"auto" | "top-center" | "top-right" | "top-left" | "bottom-left" | "bottom-center" | "bottom-right"}
   * @default
   * @ignore
   */
  @property({
    readOnly: true,
    dependsOn: ["dockEnabled", "alignment", "visible"]
  })
  get currentAlignment(): Alignment {
    return this._getCurrentAlignment();
  }

  //----------------------------------
  //  yoffset
  //----------------------------------
  @property()
  yoffset = 0;
  //--------------------------------------------------------------------------
  //
  //  Private Properties
  //
  //--------------------------------------------------------------------------
  @property()
  private _pointerOffsetInPx = 16;

  @aliasOf("domNode")
  private _containerNode: HTMLElement = null;

  private _mainContainerNode: HTMLElement = null;

  //--------------------------------------------------------------------------
  //
  //  Static Methods
  //
  //--------------------------------------------------------------------------

  static getPopup = (id: string) => {
    return popupCollection[id] || false;
  };

  //--------------------------------------------------------------------------
  //
  //  Public Methods
  //
  //--------------------------------------------------------------------------

  public open = (location?: PopupLocation | Graphic, option?: PopupSetOptions) => {
    option = option || {};
    location = location || this.graphic;
    if (location instanceof Graphic) {
      location = location.geometry;
    }
    option.location = location.type === "point" ? location : location.extent.center;
    const opts = Object.assign({}, option, {
      visible: true
    });
    this.setOption(opts);
    this._updateScreenLocation();
    if (this.hideOther) {
      this._hideOtherPopup();
    }
  };
  setOption = (option: object) => {
    this.set(option);
  };
  setZIndex = (val: number) => {
    this.zIndex = val;
    if (val > this.getMaxZIndex()) {
      this.updateMaxZIndex(val);
    }
  };

  getMaxZIndex = () => {
    return popupIndex;
  };
  updateMaxZIndex = (val: number) => {
    popupIndex = val;
  };

  close = () => {
    this.visible = false;
    this.emit("closed", this);
  };
  clear = () => {
    this._forEachObj(popupCollection, (uid: any, popup: any) => {
      popup.destroy();
    });
  };

  //--------------------------------------------------------------------------
  //
  //  Protected Methods
  //
  //--------------------------------------------------------------------------

  protected renderPopupFooter = () => {
    return (
      <div class={this.classes(CSS.footer)} key={buildKey("footer", this.uid)} />
    );
  };
  protected renderPointer = () => {
    return (
      <div class={this.classes(CSS.pointer)} key={buildKey("pointer", this.uid)} role="presentation">
        <div class={this.classes(CSS.pointerDirection, CSS.shadow)} />
      </div>
    );
  };

  protected renderMainContainer(): VNode {
    return (
      <div class={this.classes(CSS.mainContainer)} afterCreate={this.setContainerPosition}
           afterUpdate={this.setContainerPosition}
           key={buildKey("mainContainer", this.uid)} bind={this}>
        {
          [
            this.closeButton ? this.renderPopupCloseBtn() : null,
            this.hideTitle ? null : this.renderPopupHeader(),
            this.renderPopupContent(),
            this.renderPopupFooter()
          ]
        }
      </div>
    );
  }

  protected renderPopupHeader = () => {
    return (
      <div class={this.classes(CSS.header)}
           key={buildKey("header", this.uid)}>
        <div class={CSS.title}>{this.renderDom(this.title)}</div>
      </div>
    );
  };
  protected renderPopupCloseBtn = () => {
    return (
      <div class={this.classes(CSS.button, CSS.closeButton)} title={this.closeTip} onclick={this._handleClose}
           bind={this}>
        <span class={this.classes(CSS.icon, CSS.closeIcon)} />
      </div>
    );
  };
  protected renderPopupContent = () => {
    return (
      <div
        class={this.classes(CSS.container)}
        key={buildKey("container", this.uid)}
        afterCreate={this._mainContainerNodeUpdated}
        afterUpdate={this._mainContainerNodeUpdated}
      >
        {this.renderContent()}
      </div>
    );
  };

  protected renderContent(): VNode {
    const content = this.content;
    return this.renderDom(content);
  }

  protected renderDom(content: any): VNode {
    if (!content) {
      return null;
    }
    if (typeof content === "string") {
      return <div key={content} innerHTML={content} bind={this} afterCreate={this._contentNodeCreate} />;
    }
    const VNode = this.renderNodeContent(content);
    this._contentNodeCreate(content);
    return VNode;
  }

  protected setContainerPosition() {
    if (this.visible) {
      this._positionContainer();
    }
  }

  //--------------------------------------------------------------------------
  //
  //  Private Methods
  //
  //--------------------------------------------------------------------------
  private _updateContainerStyle(type: string, val: any) {
    this._containerNode.style[type] = val;
  }

  private _getDomStyle(dom: HTMLElement) {
    return window.getComputedStyle ? window.getComputedStyle(dom, null) : dom.style;
  }

  private _updateScreenLocation(location: Point = this.location) {
    if (!location) return false;
    this.screenLocation = this._getScreenLocation(location);
  }


  private _getScreenLocation(point: Point) {
    const { view } = this;
    return view && point && "function" == typeof view.toScreen ? view.toScreen(point) : null;
  }

  private _calculateFullWidth(width: number): number {
    const { currentAlignment, _pointerOffsetInPx: pointerOffset } = this;

    if (
      currentAlignment === "top-left" ||
      currentAlignment === "bottom-left" ||
      currentAlignment === "top-right" ||
      currentAlignment === "bottom-right"
    ) {
      return width + pointerOffset;
    }

    return width;
  }

  private _calculateAlignmentPosition(
    x: number,
    y: number,
    view: MapView | SceneView,
    width: number
  ): PopupPosition {
    const { currentAlignment, _pointerOffsetInPx: pointerOffset, yoffset } = this;
    const halfWidth = width / 2;
    const viewHeightOffset = view.height - y;
    const viewWidthOffset = view.width - x;
    const { padding } = this.view;

    if (currentAlignment === "bottom-center") {
      return {
        top: y + pointerOffset - padding.top - yoffset,
        left: x - halfWidth - padding.left
      };
    }

    if (currentAlignment === "top-left") {
      return {
        bottom: viewHeightOffset + pointerOffset - padding.bottom + yoffset,
        right: viewWidthOffset + pointerOffset - padding.right
      };
    }

    if (currentAlignment === "bottom-left") {
      return {
        top: y + pointerOffset - padding.top - yoffset,
        right: viewWidthOffset + pointerOffset - padding.right
      };
    }

    if (currentAlignment === "top-right") {
      return {
        bottom: viewHeightOffset + pointerOffset - padding.bottom + yoffset,
        left: x + pointerOffset - padding.left
      };
    }

    if (currentAlignment === "bottom-right") {
      return {
        top: y + pointerOffset - padding.top - yoffset,
        left: x + pointerOffset - padding.left
      };
    }

    if (currentAlignment === "top-center") {
      return {
        bottom: viewHeightOffset + pointerOffset - padding.bottom + yoffset,
        left: x - halfWidth - padding.left
      };
    }

    return undefined;
  }

  private _positionContainer(containerNode: HTMLElement = this._containerNode): void {
    if (containerNode) {
      this._containerNode = containerNode;
    }

    if (!containerNode) {
      return;
    }

    const { screenLocation } = this;
    const { width } = containerNode.getBoundingClientRect();
    const positionStyle = this._calculatePositionStyle(screenLocation, width);

    if (!positionStyle) {
      return;
    }
    const style = this._getContainerStyle(positionStyle);
    containerNode.setAttribute("style", style);
  }

  private _getContainerStyle(positionStyle: any) {
    let style = `z-index: ${this.zIndex};`;
    if (positionStyle) {
      style += this._convertStyleToInset(positionStyle) || "";

    }
    if (this.height) {
      style += `height:${this.height};`;
    }
    if (this.width) {
      style += `width:${this.width};`;
    }
    return style;
  }

  private _convertStyleToInset(positionStyle: any) {
    return `inset: ${positionStyle.top} ${positionStyle.right} ${positionStyle.bottom} ${positionStyle.left};`;
  }

  private _calculatePositionStyle(
    screenLocation: ScreenPoint,
    domWidth: number
  ): PopupPositionStyle {
    const { dockEnabled, view } = this;

    if (!view) {
      return undefined;
    }
    if (dockEnabled) {
      return {
        left: "",
        top: "",
        right: "",
        bottom: ""
      };
    }

    if (!screenLocation || !domWidth) {
      return undefined;
    }

    const width = this._calculateFullWidth(domWidth);
    const position = this._calculateAlignmentPosition(
      screenLocation.x,
      screenLocation.y,
      view,
      width
    );

    if (!position) {
      return undefined;
    }

    return {
      top: position.top !== undefined ? `${position.top}px` : "auto",
      left: position.left !== undefined ? `${position.left}px` : "auto",
      bottom: position.bottom !== undefined ? `${position.bottom}px` : "auto",
      right: position.right !== undefined ? `${position.right}px` : "auto"
    };
  }

  private _getCurrentAlignment(): PositionResult {
    const { alignment, dockEnabled } = this;

    if (dockEnabled || !this.visible) {
      return null;
    }

    return this._calculatePositionResult(
      this._calculateAutoAlignment(this._callCurrentAlignment(alignment))
    );
  }

  private _isScreenLocationWithinView(
    screenLocation: ScreenPoint,
    view: MapView | SceneView
  ): boolean {
    return (
      screenLocation.x > -1 &&
      screenLocation.y > -1 &&
      screenLocation.x <= view.width &&
      screenLocation.y <= view.height
    );
  }

  private _isOutsideView(options: PopupOutsideViewOptions): boolean {
    const { popupHeight, popupWidth, screenLocation, side, view } = options;

    if (isNaN(popupWidth) || isNaN(popupHeight) || !view || !screenLocation) {
      return false;
    }

    const padding = view.padding;

    if (side === "right" && screenLocation.x + popupWidth / 2 > view.width - padding.right) {
      return true;
    }

    if (side === "left" && screenLocation.x - popupWidth / 2 < padding.left) {
      return true;
    }

    if (side === "top" && screenLocation.y - popupHeight < padding.top) {
      return true;
    }

    if (side === "bottom" && screenLocation.y + popupHeight > view.height - padding.bottom) {
      return true;
    }

    return false;
  }

  private _calculateAutoAlignment(alignment: PositionValue): Exclude<PositionValue, "auto"> {
    if (alignment !== "auto") {
      return alignment;
    }

    const {
      _pointerOffsetInPx: pointerOffset,
      _containerNode: containerNode,
      _mainContainerNode: mainContainerNode,
      screenLocation,
      view
    } = this;

    if (!screenLocation || !view || !containerNode) {
      return "top-center";
    }

    if (!this._isScreenLocationWithinView(screenLocation, view)) {
      return this._get("currentAlignment") || "top-center";
    }

    function cssPropertyToInteger(value: string): number {
      return parseInt(value.replace(/[^-\d\.]/g, ""), 10);
    }

    const mainComputedStyle = mainContainerNode
      ? window.getComputedStyle(mainContainerNode, null)
      : null;

    const contentMaxHeight = mainComputedStyle
      ? cssPropertyToInteger(mainComputedStyle.getPropertyValue("max-height"))
      : 0;

    const contentHeight = mainComputedStyle
      ? cssPropertyToInteger(mainComputedStyle.getPropertyValue("height"))
      : 0;

    const { height, width } = containerNode.getBoundingClientRect();
    const popupWidth = width + pointerOffset;
    const popupHeight = Math.max(height, contentMaxHeight, contentHeight) + pointerOffset;

    const isOutsideViewRight = this._isOutsideView({
      popupHeight,
      popupWidth,
      screenLocation,
      side: "right",
      view
    });

    const isOutsideViewLeft = this._isOutsideView({
      popupHeight,
      popupWidth,
      screenLocation,
      side: "left",
      view
    });

    const isOutsideViewTop = this._isOutsideView({
      popupHeight,
      popupWidth,
      screenLocation,
      side: "top",
      view
    });

    const isOutsideViewBottom = this._isOutsideView({
      popupHeight,
      popupWidth,
      screenLocation,
      side: "bottom",
      view
    });

    return isOutsideViewLeft
      ? isOutsideViewTop
        ? "bottom-right"
        : "top-right"
      : isOutsideViewRight
        ? isOutsideViewTop
          ? "bottom-left"
          : "top-left"
        : isOutsideViewTop
          ? isOutsideViewBottom
            ? "top-center"
            : "bottom-center"
          : "top-center";
  }

  private _callCurrentAlignment(alignment: Alignment): PositionValue {
    return typeof alignment === "function" ? alignment.call(this) : alignment;
  }

  private _calculatePositionResult(position: PositionValue): PositionResult {
    const values = ["left", "right"];

    if (isRTL()) {
      values.reverse();
    }

    return position
      .replace(/leading/gi, values[0])
      .replace(/trailing/gi, values[1]) as PositionResult;
  }

  private _mainContainerNodeUpdated(element: HTMLElement): void {
    this._mainContainerNode = element;
  }

  private _contentNodeCreate(element: HTMLElement): void {
    this.emit("contentCreate", this);
  }

  private _updateCollection() {
    popupIndex++;
    popupCollection[this.uid] = this;
  }

  private _createContainer(container: string | HTMLElement) {
    container = this.container || container || popupWidgetName;
    const containerId = `${container}--${this.uid}`;
    let popupContainer;
    if (this.container instanceof HTMLElement) {
      popupContainer = container;
    } else if (typeof this.container === "string") {
      popupContainer = document.getElementById(`${this.container}`);
      if (!popupContainer) {
        popupContainer = document.createElement("div");
        popupContainer.id = containerId;
      }
    } else {
      popupContainer = document.createElement("div");
      popupContainer.id = containerId;
    }
    this._set("container", popupContainer);
  }

  private _mountContainer() {
    const mapContainer = document.querySelector(".esri-ui-inner-container.esri-ui-manual-container");
    let popupWidgetWrapper = document.getElementById(CSS.widgetWrapperID);
    if (!popupWidgetWrapper) {
      popupWidgetWrapper = document.createElement("div");
      popupWidgetWrapper.setAttribute("id", CSS.widgetWrapperID);
      popupWidgetWrapper.setAttribute("class", CSS.widgetWrapperClass);
      mapContainer.appendChild(popupWidgetWrapper);
    }
    const widgetID = `${CSS.widgetID}--${this.uid}`;
    let popupWidget = document.getElementById(widgetID);
    if (!popupWidget) {
      popupWidget = document.createElement("div");
      popupWidget.setAttribute("id", widgetID);
      popupWidget.setAttribute("class", CSS.widgetClass);
    }
    if (mapContainer && this.container) {
      popupWidget.appendChild(this.container as HTMLElement);
      popupWidgetWrapper.appendChild(popupWidget);
    }
  }

  private _renderNow() {
    this.renderNow();
    this._updateScreenLocation();
  }

  private _setHandler() {
    this.own([
      watch(this, "view.center, view.interacting, view.scale", () => {
        this._renderNow();
      })
    ]);
    if (this.graphic && this.graphic.layer) {
      const graphicLayer = this.graphic.layer;
      this.handles.add(graphicLayer.graphics.on("before-remove", (e: any) => {
        const target = e.item;
        if (target) {
          const popupId = target.popupId;
          if (popupId === this.uid && PopupCustom.getPopup(popupId)) {
            this.destroy();
          }
        }
      }));
      if (this.graphic.type === "polyline") {
        this.handles.add(watch(this, "graphic.geometry", () => {
          console.log("graphic.latitude,graphic.longitude");
        }));
      }
    }
  }

  private _hideOtherPopup() {
    this._forEachObj(popupCollection, (uid: any, popup: any) => {
      if (uid !== this.uid) {
        popup.close();
      }
    });
  }

  private _handlePopupClick(e: any) {
    if (this.autoAdjustZIndex) {
      if (this.zIndex < this.getMaxZIndex()) {
        this.setZIndex(this.getMaxZIndex() + 1);
      }
    }
    this.emit("popup-click", this);
  }

  private _handleClose(e: any) {
    e.stopPropagation();
    this.close();
  }

  //----------------------------
  // util
  //----------------------------
  private _forEachObj(obj = {}, fn: any) {
    Object.keys(obj).forEach(key => {
      fn(key, obj[key]);
    });
  }

}

const WIDGET_KEY_PARTIAL = "esri-popup-custom";

function buildKey(element: string, id?: string, index?: number): string {
  let str = WIDGET_KEY_PARTIAL;
  if (id) str += `-${id}`;
  if (index) return str += `__${element}-${index}`;
  return str += `__${element}`;
}

export default PopupCustom;
