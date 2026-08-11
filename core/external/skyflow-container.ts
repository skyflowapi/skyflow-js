/*
Copyright (c) 2022 Skyflow, Inc.
*/
// Shared controller-frame bootstrap base. Stands up the SKYFLOW_FRAME_CONTROLLER
// iframe, hands it the client/context when it reports ready, and exposes
// `isControllerFrameReady`. Boundary-clean (@core imports only). It carries NO
// pure-JS methods — privacyDB's SkyflowContainer subclass adds
// insert/update/delete/get/getById/detokenize; flowDB (elements-only) re-exports
// this base as-is.
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
import { printLog, parameterizedString } from '@core/utils/logs-helper';
import { Context, MessageType } from '@core/types';

const CLASS_NAME = 'SkyflowContainer';
class SkyflowContainer {
  protected containerId: string;

  protected client: Client;

  isControllerFrameReady: boolean = false;

  protected context: Context;

  constructor(client: Client, context: Context) {
    this.client = client;
    this.containerId = this.client.toJSON()?.metaData?.uuid || '';
    this.context = context;
    const clientDomain = window.location.origin || '';
    const iframe = iframer({
      name: `${SKYFLOW_FRAME_CONTROLLER}:${this.containerId}:${btoa(clientDomain)}:${!!this.client.toJSON()?.config?.options?.trackingKey}`,
      referrer: clientDomain,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    document.body.append(iframe);
    bus
      .target(properties.IFRAME_SECURE_ORIGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.containerId, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.CAPTURE_PUREJS_FRAME, CLASS_NAME),
          MessageType.LOG,
          this.context.logLevel);
        callback({
          client: this.client,
          context,
        });
        this.isControllerFrameReady = true;
      });
    printLog(parameterizedString(logs.infoLogs.PUREJS_CONTROLLER_INITIALIZED, CLASS_NAME),
      MessageType.LOG,
      this.context.logLevel);
  }
}
export default SkyflowContainer;
