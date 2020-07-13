import bus from "framebus";
import injectStylesheet from "inject-stylesheet";
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ALLOWED_MULTIPLE_FIELDS_STYLES,
  ELEMENT_EVENTS_TO_CLIENT,
  ALLOWED_STYLES,
} from "../../constants";
import $ from "jquery";
import "jquery-mask-plugin/dist/jquery.mask.min";
import Client from "../../../client";
import Notebook from "../../../notebook";

export default class FrameRevel {
  static frameRevel: FrameRevel;
  #options;
  #client: Client;
  #notebook: Notebook;
  #container: HTMLSpanElement;
  #metadata;
  #name: string;
  #mask?: any;

  static init() {
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY, { name: window.name }, (data: any) => {
      FrameRevel.frameRevel = new FrameRevel(
        data.options,
        data.clientObject,
        data.metadata
      );
    });
  }

  constructor(options, clientObjects, metadata) {
    this.#name = window.name;
    this.#options = options;
    this.#client = Client.fromJSON(clientObjects);
    this.#metadata = metadata;
    this.#notebook = new Notebook(
      // this.#client.config.notebookId,
      "",
      this.#client,
      metadata,
      this.#options.headers
    );

    this.#container = document.createElement("span");
    this.#container.className = "Skyflow-revel";
    this.#setMask(options.mask);
    injectStylesheet.injectWithAllowlist(
      {
        ["." + this.#container.className]: {
          display: "flex",
          "align-items": "center",
          height: "100%",
        },
      },
      ALLOWED_MULTIPLE_FIELDS_STYLES
    );
    if (options.styles && Object.keys(options.styles).length > 0) {
      injectStylesheet.injectWithAllowlist(
        {
          ["." + this.#container.className]: {
            ...options.styles,
          },
        },
        ALLOWED_STYLES
      );
    }
    document.body.append(this.#container);

    this.start();
  }

  start = () => {
    // todo: once vault API is ready call the request directly using #client
    try {
      this.#notebook.getRecord(this.#options.token).then((data: any) => {
        const value = data.fields[0].value;
        this.#container.title = value;
        $(document).ready(() => {
          this.#container.textContent = value;
          (<any>$).jMaskGlobals.translation = {};
          (<any>$).jMaskGlobals.clearIfNotMatch = true;

          $(this.#container).unmask();
          if (this.#mask) {
            const mask = this.#mask;
            const translation = {};
            Object.keys(mask[2]).forEach((key) => {
              translation[key] = { pattern: mask[2][key] };
            });

            $(this.#container).mask(mask[0], {
              translation,
            });

            $(this.#container).trigger("input");
          }
        });
        bus
          .target(this.#metadata.clientDomain)
          .emit(ELEMENT_EVENTS_TO_IFRAME.CLIENT_REQUEST, {
            name: this.#name,
            event: ELEMENT_EVENTS_TO_CLIENT.SUCCESS,
            // data: {
            //   statusCode: data.
            // },
          });
      });
    } catch (e) {
      // .catch((err) => {
      bus
        .target(this.#metadata.clientDomain)
        .emit(ELEMENT_EVENTS_TO_IFRAME.CLIENT_REQUEST, {
          name: this.#name,
          event: ELEMENT_EVENTS_TO_CLIENT.ERROR,
          data: e,
        });
      // });
    }
  };

  #setMask = (mask: string[]) => {
    if (!mask) {
      return;
    }
    const newMask: any[] = [];
    newMask[0] = mask[0];
    newMask[1] = null; //todo: replacer options
    newMask[2] = mask[1];
    if (newMask[2]) {
      Object.keys(newMask[2]).forEach((key) => {
        newMask[2][key] = new RegExp(newMask[2][key]);
      });
    } else {
      newMask[2]["9"] = /[0-9]/;
      newMask[2]["a"] = /[a-zA-Z]/;
      newMask[2]["*"] = /[a-zA-Z0-9]/;
    }
    this.#mask = newMask;
  };
}
