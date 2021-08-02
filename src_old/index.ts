import Skyflow from "./Skyflow";
import "core-js/stable";

if (typeof window.console === "undefined") {
  (<any>window).console = <any>{
    error: (arg: any) => {},
    log: (arg: any) => {},
  };
}

(function (root: any) {
  root.Skyflow = root.Skyflow || Skyflow;
})(window);
