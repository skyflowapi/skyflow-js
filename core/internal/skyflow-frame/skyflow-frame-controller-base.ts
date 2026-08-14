/*
Copyright (c) 2025 Skyflow, Inc.
*/
// Variant-neutral skyflow-frame controller base, shared by both packages. Owns
// the iframe bus topology + handshake and the parts of tokenize()/revealData()
// that don't touch the vault API. Only the API-call-level differences live in
// the package subclass, injected through the hooks below:
//   - sendCollectRequest()      : build + fire the insert/update vault request
//   - fetchRevealRecords()      : the reveal token-fetch (privacyDB vs flowDB)
//   - formatRevealForClient()   : shape the reveal result for the SDK consumer
//   - getSdkNameAndVersion()    : package-owned telemetry identity (deliberate
//                                 loose-coupling duplication — not moved to core)
//   - wrapCallbackError()       : package error-envelope shape for callbacks
//   - collectsCVV               : flowDB captures CVV values; privacyDB does not
//   - revealResolvesPartialFailure : flowDB resolves a partial reveal failure as
//                                 success; privacyDB always rejects
//   - registerDataAccessListeners() : privacyDB adds the pure-JS channel
//                                 (DETOKENIZE/INSERT/UPDATE/GET/DELETE); flowDB
//                                 is elements-only, so the base default no-op
//                                 leaves it without PUREJS_REQUEST/PUREJS_FRAME_READY
//   - handleExtra{Collect,Reveal}Request() : privacyDB file upload / file render;
//                                 flowDB has neither (no-op).
import bus from 'framebus';
import {
  COLLECT_TYPES,
  DOMAIN,
  ELEMENT_EVENTS_TO_IFRAME,
  PUREJS_TYPES,
  REVEAL_TYPES,
  SDK_IFRAME_EVENT,
} from '@core/constants';
import logs from '@core/utils/logs';
import properties from '@core/properties';
import Client, { SdkInfo } from '@core/client';
import SkyflowError from '@core/errors';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import { formatRecordsForIframe } from '@core/api-utils/reveal';
import { getAtobValue, getValueFromName } from '@core/helpers';
import { printLog, parameterizedString } from '@core/utils/logs-helper';
import {
  Context,
  ElementInfo,
  ErrorType,
  ICollectResponseBase,
  IRevealRecord,
  IRevealResponseBase,
  MessageType,
} from '@core/types';
import {
  collectElementsData,
  ICollectedElementsData,
  ITokenizeDataInputBase,
} from './collect-elements';

const CLASS_NAME = 'SkyflowFrameController';

abstract class CoreSkyflowFrameController<
  TTokenizeInput extends ITokenizeDataInputBase,
  TCollectResponse extends ICollectResponseBase,
  TRevealResponse extends IRevealResponseBase,
> {
  protected clientId: string;

  protected clientDomain: string;

  protected client!: Client;

  protected context!: Context;

  // flowDB overrides to `true` (captures CVV into cvvMap for token re-mapping).
  protected collectsCVV: boolean = false;

  // flowDB overrides to `true` (a partial reveal failure resolves as success);
  // privacyDB always rejects the reveal error branch.
  protected revealResolvesPartialFailure: boolean = false;

  constructor(clientId: string) {
    this.clientId = clientId || '';
    const encodedClientDomain = getValueFromName(window.name, 2);
    const clientDomain = getAtobValue(encodedClientDomain);
    this.clientDomain = document.referrer.split('/').slice(0, 3).join('/') || clientDomain;
    // Wire the common channels in the original order. registerDataAccessListeners
    // adds the privacyDB-only pure-JS request LISTENER (flowDB: no-op). The
    // PUREJS_FRAME_READY EMIT that follows is the common readiness handshake — the
    // client marks isControllerFrameReady off it — so it runs for BOTH packages.
    this.registerPushEventListener();
    this.registerDataAccessListeners();
    this.emitPureJsFrameReady();
    this.registerCollectListener();
    this.emitControllerReady();
    this.registerRevealListener();
  }

  // ---- package-owned hooks (API-call level + telemetry identity) ----
  protected abstract getSdkNameAndVersion(metaData?: string): SdkInfo;

  protected abstract sendCollectRequest(
    built: ICollectedElementsData,
    options: TTokenizeInput,
  ): Promise<TCollectResponse>;

  protected abstract fetchRevealRecords(
    revealRecords: IRevealRecord[],
    options?: Record<string, any>,
  ): Promise<any>;

  protected abstract formatRevealForClient(result: any): TRevealResponse;

  protected abstract wrapCallbackError(error: any): any;

  // ---- optional extension points (privacyDB overrides; flowDB inherits no-op) ----
  // eslint-disable-next-line class-methods-use-this
  protected registerDataAccessListeners(): void {
    // Extension point; privacyDB registers the pure-JS channel. flowDB: no-op.
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  protected handleExtraCollectRequest(data: any, callback: (response: any) => void): void {
    // Extension point; privacyDB handles file upload. flowDB: no-op.
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  protected handleExtraRevealRequest(data: any, callback: (response: any) => void): void {
    // Extension point; privacyDB handles file render. flowDB: no-op.
  }

  // ---- common wiring (implemented once in core) ----
  protected registerPushEventListener(): void {
    bus
      .on(
        ELEMENT_EVENTS_TO_IFRAME.PUSH_EVENT + this.clientId,
        (data: any) => {
          if (window?.CoralogixRum
            && !window.CoralogixRum.isInited
            && this.client?.config?.options?.trackingKey
            && this.client?.config?.options?.trackingKey.length >= 35) {
            const sdkVersion = this.client?.toJSON()?.metaData?.sdkVersion;
            const sdkMetaData = this.getSdkNameAndVersion(sdkVersion);
            window.CoralogixRum.init({
              application: sdkMetaData.sdkName,
              public_key: this.client.config?.options?.trackingKey,
              coralogixDomain: DOMAIN,
              version: sdkMetaData.sdkVersion,
              beforeSend: (event: any) => {
                if (event?.log_context?.message && event.log_context.message === SDK_IFRAME_EVENT) {
                  return event;
                }
                return null;
              },
            });
          }
          if (data && data.event && window?.CoralogixRum) {
            try {
              window.CoralogixRum.info(SDK_IFRAME_EVENT, data.event);
              printLog(parameterizedString(logs.infoLogs.METRIC_CAPTURE_EVENT),
                MessageType.LOG, this.context?.logLevel);
            } catch (err: any) {
              printLog(parameterizedString(logs.infoLogs.UNKNOWN_METRIC_CAPTURE_EVENT,
                err.toString()),
              MessageType.LOG, this.context?.logLevel);
            }
          }
        },
      );
  }

  protected registerCollectListener(): void {
    bus
      .target(this.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.COLLECT_CALL_REQUESTS + this.clientId, (data, callback) => {
        if (this.client && data?.errorMessages) {
          const errorMessages: Partial<Record<ErrorType, string>> = data?.errorMessages;
          this.client.setErrorMessages(errorMessages as Record<ErrorType, string>);
        }
        printLog(
          parameterizedString(
            logs.infoLogs.CAPTURE_PURE_JS_REQUEST,
            CLASS_NAME,
            data.type,
          ),
          MessageType.LOG,
          this.context.logLevel,
        );
        if (data.type === COLLECT_TYPES.COLLECT) {
          printLog(
            parameterizedString(logs.infoLogs.CAPTURE_EVENT,
              CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.TOKENIZATION_REQUEST),
            MessageType.LOG,
            this.context.logLevel,
          );
          const tokenizeDataInput = {
            ...data,
            type: data.type,
            elementIds: data.elementIds as Array<ElementInfo>,
            containerId: data.containerId as string,
          } as TTokenizeInput;
          this.tokenize(tokenizeDataInput)
            .then((response) => {
              callback(response);
            })
            .catch((error: any) => {
              callback(this.wrapCallbackError(error));
            });
        } else {
          this.handleExtraCollectRequest(data, callback);
        }
      });
  }

  // Common readiness handshake: the client's SkyflowContainer responds to this
  // emit and sets isControllerFrameReady, which gates collect()/reveal(). Both
  // packages need it — flowDB registers no pure-JS request listener, but still
  // announces frame readiness here.
  protected emitPureJsFrameReady(): void {
    bus
      .target(this.clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.clientId, {}, (data: any) => {
        this.context = data.context;
        data.client.config = {
          ...data.client.config,
        };
        this.client = Client.fromJSON(data.client) as any;
        Object.keys(PUREJS_TYPES).forEach((key) => {
          printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
            CLASS_NAME, PUREJS_TYPES[key]), MessageType.LOG, this.context.logLevel);
        });
      });
  }

  protected emitControllerReady(): void {
    bus
      .target(this.clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.SKYFLOW_FRAME_CONTROLLER_READY + this.clientId,
        {}, (data: any) => {
          this.context = data.context;
          data.client.config = {
            ...data.client.config,
          };
          this.client = Client.fromJSON(data.client) as any;
          Object.keys(COLLECT_TYPES).forEach((key) => {
            printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
              CLASS_NAME, COLLECT_TYPES[key]), MessageType.LOG, this.context.logLevel);
          });
          Object.keys(REVEAL_TYPES).forEach((key) => {
            printLog(parameterizedString(logs.infoLogs.LISTEN_PURE_JS_REQUEST,
              CLASS_NAME, REVEAL_TYPES[key]), MessageType.LOG, this.context.logLevel);
          });
        });
  }

  protected registerRevealListener(): void {
    bus
      .target(this.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.clientId, (data, callback) => {
        printLog(
          parameterizedString(
            logs.infoLogs.CAPTURE_PURE_JS_REQUEST,
            CLASS_NAME,
            data.type,
          ),
          MessageType.LOG,
          this.context.logLevel,
        );
        if (this.client && data?.errorMessages) {
          const errorMessages: Partial<Record<ErrorType, string>> = data?.errorMessages;
          this.client.setErrorMessages(errorMessages as Record<ErrorType, string>);
        }

        if (data.type === REVEAL_TYPES.REVEAL) {
          printLog(parameterizedString(logs.infoLogs.CAPTURE_EVENT,
            CLASS_NAME, ELEMENT_EVENTS_TO_IFRAME.REVEAL_REQUEST),
          MessageType.LOG, this.context.logLevel);
          this.revealData(
            data.records as IRevealRecord[],
            data.containerId as string,
            data.options as Record<string, any>,
          ).then(
            (resolvedResult) => {
              callback(resolvedResult);
            },
            (rejectedResult: any) => {
              callback(this.wrapCallbackError(rejectedResult));
            },
          );
        } else {
          this.handleExtraRevealRequest(data, callback);
        }
      });
  }

  // ---- tokenize/revealData templates (shared skeleton; API bits are hooks) ----
  tokenize = (options: TTokenizeInput): Promise<TCollectResponse> => {
    if (!this.client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
    let built: ICollectedElementsData;
    try {
      built = collectElementsData({
        elementIds: options.elementIds,
        containerId: options.containerId,
        logLevel: this.context.logLevel,
        clientDomain: this.clientDomain,
        collectCVV: this.collectsCVV,
      });
    } catch (err) {
      return Promise.reject(err);
    }
    return this.sendCollectRequest(built, options);
  };

  revealData(
    revealRecords: IRevealRecord[],
    containerId: string,
    options?: Record<string, any>,
  ): Promise<TRevealResponse> {
    const id = containerId;
    return new Promise((resolve, reject) => {
      this.fetchRevealRecords(revealRecords, options).then(
        (resolvedResult) => {
          const formattedResult = formatRecordsForIframe(resolvedResult);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY
                + id,
              formattedResult,
            );
          resolve(this.formatRevealForClient(resolvedResult));
        },
        (rejectedResult: any) => {
          const formattedResult = formatRecordsForIframe(rejectedResult);
          bus
            .target(properties.IFRAME_SECURE_SITE)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY
                + id,
              formattedResult,
            );
          // A full API failure carries a top-level { error }; forward it as-is.
          // A partial failure ({ records, errors }) is client-facing success for
          // flowDB (revealResolvesPartialFailure), but always a reject for privacyDB.
          if (rejectedResult?.error !== undefined || !this.revealResolvesPartialFailure) {
            reject(this.formatRevealForClient(rejectedResult));
          } else {
            resolve(this.formatRevealForClient(rejectedResult));
          }
        },
      );
    });
  }
}

export default CoreSkyflowFrameController;
