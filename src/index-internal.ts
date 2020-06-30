import { FRAME_CONTROLLER } from "./elements/constants";
import { FrameController } from "./elements/internal";
import "core-js/stable";
import FrameElements from "./elements/internal/FrameElements";

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
      root.Skyflow = FrameElements;
      FrameElements.start();
    }
  } catch (e) {
    throw new Error("Expecting a valid Iframe");
  }
})(window);
