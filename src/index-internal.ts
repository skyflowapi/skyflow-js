import { FRAME_CONTROLLER } from "./elements/constants";
import { FrameController, FrameElement } from "./elements/internal";
import "core-js/stable";

if (typeof window.console === "undefined") {
  (<any>window).console = <any>{
    error: (arg: any) => {},
    log: (arg: any) => {},
  };
}

(function (root: any) {
  try {
    if (root.name.split(":")[0] === FRAME_CONTROLLER) {
      root.Skyflow = FrameController;
      FrameController.init(location.hash);
    } else {
      root.Skyflow = FrameElement;
      FrameElement.start();
    }
  } catch (e) {
    throw new Error("Expecting a valid Iframe");
  }
})(window);
