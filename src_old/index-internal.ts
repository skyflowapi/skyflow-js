import { FRAME_CONTROLLER, FRAME_REVEAL, FRAME_ELEMENT } from "./elements/constants";
import { FrameController } from "./elements/internal";
import "core-js/stable";
import FrameElements from "./elements/internal/FrameElements";
import FrameReveal from "./elements/internal/FrameReveal";

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
    } else if (names[0] === FRAME_REVEAL) {
      FrameReveal.init();
    } else if (names[0] === FRAME_ELEMENT) {
      root.Skyflow = FrameElements;
      FrameElements.start();
    }
  } catch (e) {
    throw new Error("Expecting a valid Iframe");
  }
})(window);
