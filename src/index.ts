import 'core-js/stable';
import Skyflow from './Skyflow';

if (typeof window.console === 'undefined') {
  (<any>window).console = <any>{
    error: () => {},
    log: () => {},
  };
}

(function intit(root: any) {
  root.Skyflow = root.Skyflow || Skyflow;
}(window));
