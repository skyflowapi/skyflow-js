/*
Copyright (c) 2022 Skyflow, Inc.
*/
import 'core-js/stable';
import Skyflow from './skyflow';

(function intit(root: any) {
  root.Skyflow = root.Skyflow || Skyflow;
}(window));
