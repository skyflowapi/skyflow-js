import "core-js/stable";
import Skyflow, { ContainerType, RedactionType } from "./Skyflow";
import { SkyflowElementType } from "./container/constants";

if (typeof window.console === "undefined") {
  (<any>window).console = <any>{
    error: (arg: any) => {},
    log: (arg: any) => {},
  };
}

(function (root: any) {
  root.Skyflow = root.Skyflow || Skyflow;
  root.ContainerType = root.ContainerType || ContainerType;
  root.RedactionType = root.RedactionType || RedactionType;
  root.SkyflowElementType = root.SkyflowElementType || SkyflowElementType;
})(window);
