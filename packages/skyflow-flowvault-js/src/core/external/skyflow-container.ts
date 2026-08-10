/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault controller-frame bootstrap. Unlike skyflow-js's SkyflowContainer,
// this is elements-only: it stands up the shared SKYFLOW_FRAME_CONTROLLER iframe
// and hands it the client/context when it reports ready, then exposes
// `isControllerFrameReady` for the collect/reveal containers. It intentionally
// carries NO pure-JS methods (insert/detokenize/get/delete/update) — flowvault
// does not expose a pure-JS surface (see package-split §9 decisions).
import bus from 'framebus';
import iframer, {
  getIframeSrc,
  setAttributes,
  setStyles,
} from '@core/iframe-libs/iframer';
import properties from '@core/properties';
import {
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
  SKYFLOW_FRAME_CONTROLLER,
} from '@core/constants';
import logs from '@core/utils/logs';
import Client from '@core/client';
import { printLog, parameterizedString } from '../../utils/logs-helper';
import { Context, MessageType } from '../../utils/common';

const CLASS_NAME = 'SkyflowContainer';
class SkyflowContainer {
  #containerId: string;

  #client: Client;

  isControllerFrameReady: boolean = false;

  #context: Context;

  constructor(client: Client, context: Context) {
    this.#client = client;
    this.#containerId = this.#client.toJSON()?.metaData?.uuid || '';
    this.#context = context;
    const clientDomain = window.location.origin || '';
    const iframe = iframer({
      name: `${SKYFLOW_FRAME_CONTROLLER}:${this.#containerId}:${btoa(clientDomain)}:${!!this.#client.toJSON()?.config?.options?.trackingKey}`,
      referrer: clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    document.body.append(iframe);
    bus
      .target(properties.IFRAME_SECURE_ORIGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.CAPTURE_PUREJS_FRAME, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        callback({
          client: this.#client,
          context,
        });
        this.isControllerFrameReady = true;
      });
    printLog(parameterizedString(logs.infoLogs.PUREJS_CONTROLLER_INITIALIZED, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);
  }
}
export default SkyflowContainer;
