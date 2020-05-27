// import

import { FRAME_CONTROLLER } from "./elements/constants";
import { FrameController, FrameElement } from "./elements/internal";

if (typeof window.console === "undefined") {
  (<any>window).console = <any>{
    error: (arg: any) => {},
    log: (arg: any) => {},
  };
}

(function (root: any) {
  if (root.name.split(":")[0] === FRAME_CONTROLLER) {
    FrameController.init(location.hash);
  } else {
    root.Skyflow = FrameElement;
  }
})(this);
