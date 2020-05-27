import Skyflow from "./Skyflow";

if (typeof window.console === "undefined") {
  (<any>window).console = <any>{
    error: (arg: any) => {},
    log: (arg: any) => {},
  };
}

(function (root: any) {
  root.Skyflow = root.Skyflow || Skyflow;
})(this);
