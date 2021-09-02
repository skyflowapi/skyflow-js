import "core-js/stable";
import { FrameController } from "./container/internal";
import FrameElements from "./container/internal/FrameElements";
import "core-js/stable";
import RevealFrame from "./container/internal/reveal/RevealFrame";
import {
  COLLECT_FRAME_CONTROLLER,
  FRAME_ELEMENT,
  FRAME_REVEAL,
  PUREJS_FRAME_CONTROLLER,
  REVEAL_FRAME_CONTROLLER,
} from "./container/constants";
import RevealFrameController from "./container/internal/reveal/RevealFrameController";
import PureJsFrameController from "./container/internal/pureJs/PureJsFrameController";

if (typeof window.console === "undefined") {
  (<any>window).console = <any>{
    error: (arg: any) => {},
    log: (arg: any) => {},
  };
  console.log("Error");
}

(function (root: any) {
  try {
    const names = root.name.split(":");
    if (names[0] === COLLECT_FRAME_CONTROLLER && names[1] !== undefined) {
      root.Skyflow = FrameController;
      FrameController.init(names[1]);
    } else if (names[0] === REVEAL_FRAME_CONTROLLER && names[1] !== undefined) {
      root.Skyflow = FrameController;
      RevealFrameController.init(names[1]);
    } else if (names[0] === PUREJS_FRAME_CONTROLLER && names[1] === undefined) {
      PureJsFrameController.init();
    } else if (names[0] === FRAME_ELEMENT) {
      root.Skyflow = FrameElements;
      FrameElements.start();
    } else if (names[0] === FRAME_REVEAL) {
      RevealFrame.init();
    }
  } catch (e) {
    throw new Error("Expecting a valid Iframe");
  }
})(window);
