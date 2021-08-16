import "core-js/stable";
import { FRAME_CONTROLLER, FRAME_ELEMENT } from "./container/constants";
import { FrameController } from "./container/internal";
import FrameElements from "./container/internal/FrameElements";

if (typeof window.console === "undefined") {
  (<any>window).console = <any>{
    error: (arg: any) => {},
    log: (arg: any) => {},
  };
}

(function (root: any) {
  try {
    const names = root.name.split(":");
    if (names[0] === FRAME_CONTROLLER && names[1] === undefined) {
      root.Skyflow = FrameController;
      FrameController.init(location.hash);
    } else if (names[0] === FRAME_ELEMENT) {
      root.Skyflow = FrameElements;
      FrameElements.start();
    }
    //  else if (names[0] === FRAME_REVEAL) {
    //   FrameReveal.init();
    // }
  } catch (e) {
    throw new Error("Expecting a valid Iframe");
  }
})(window);
