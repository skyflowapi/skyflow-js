import { FrameElement } from ".";
import bus from "framebus";
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ALLOWED_MULTIPLE_FIELDS_STYLES,
} from "../constants";
import injectStylesheet from "inject-stylesheet";
import { getValueAndItsUnit } from "../../libs/element-options";
import { getFlexGridStyles } from "../../libs/styles";

export default class FrameElements {
  // private frameElements?: Record<string, FrameElement> = [];
  private static group?: any;
  private static frameElements?: any;
  private getOrCreateIFrameFormElement: Function;
  domForm?: HTMLFormElement;
  private elements: FrameElement[] = [];
  private name?: string;
  constructor(getOrCreateIFrameFormElement) {
    this.getOrCreateIFrameFormElement = getOrCreateIFrameFormElement;
    if (FrameElements.group) {
      this.setup(); // start the process
    }
  }

  // called on iframe loaded im html file
  static start = () => {
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.FRAME_READY,
      { name: window.name },
      (group: any) => {
        FrameElements.group = group;
        if (FrameElements.frameElements) {
          FrameElements.frameElements.setup(); // start the process
        }
      }
    );
  };

  // called by IFrameForm
  static init = (getOrCreateIFrameFormElement: Function) => {
    FrameElements.frameElements = new FrameElements(
      getOrCreateIFrameFormElement
    );
  };

  setup = () => {
    // this.name = FrameElements.group.name;
    const group = FrameElements.group;
    const rows = group.rows;
    const elements: any[] = [];

    this.domForm = document.createElement("form");
    this.domForm.action = "#";
    this.domForm.onsubmit = (event) => {
      event.preventDefault();
    };

    group.spacing = getValueAndItsUnit(group.spacing).join("");

    const rootDiv = document.createElement("div");
    rootDiv.className = "container";
    const containerStylesByClassName = getFlexGridStyles({
      "align-items": group.alignItems || "stretch",
      "justify-content": group.justifyContent || "flex-start",
      spacing: group.spacing,
    });

    injectStylesheet.injectWithAllowlist(
      {
        ["." + rootDiv.className]: containerStylesByClassName,
      },
      ALLOWED_MULTIPLE_FIELDS_STYLES
    );

    // rows
    let count = 0;
    rows.forEach((row, rowIndex) => {
      row.spacing = getValueAndItsUnit(row.spacing).join("");
      const rowDiv = document.createElement("div");
      rowDiv.className = "row-" + rowIndex;
      const rowStylesByClassName = getFlexGridStyles({
        "align-items": row.alignItems || "stretch",
        "justify-content": row.justifyContent || "flex-start",
        spacing: row.spacing,
        padding: group.spacing,
      });
      injectStylesheet.injectWithAllowlist(
        {
          ["." + rowDiv.className]: rowStylesByClassName,
        },
        ALLOWED_MULTIPLE_FIELDS_STYLES
      );

      const elementsInRow: any[] = [];

      // elements
      row.elements.forEach((element) => {
        const elementDiv = document.createElement("div");
        elementDiv.className = "element-" + count++;
        const elementStylesByClassName = {
          padding: row.spacing,
        };
        injectStylesheet.injectWithAllowlist(
          {
            ["." + elementDiv.className]: elementStylesByClassName,
          },
          ALLOWED_MULTIPLE_FIELDS_STYLES
        );
        // create a iframeelement
        const iFrameFormElement = this.getOrCreateIFrameFormElement(
          element.elementName
        );
        // create element by passing iframeformelement and options and mount by default returns
        elementsInRow.push(
          new FrameElement(iFrameFormElement, element, elementDiv)
        );

        rowDiv.append(elementDiv);
      });
      elements.push(elementsInRow);
      rootDiv.append(rowDiv);
    });

    this.elements = elements;
    this.domForm.append(rootDiv);
    document.body.append(this.domForm);
  };
}
