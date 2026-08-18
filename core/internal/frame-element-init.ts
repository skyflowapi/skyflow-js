/*
Copyright (c) 2024 Skyflow, Inc.
*/
// Shared composable-collect controller-frame init, iframe-only (imported solely by
// each package's own subclass, instantiated from src/index-internal). This is the
// class that runs INSIDE the group iframe: it reads every element's value, runs the
// validation + duplicate checks, assembles the insert/update request objects (and a
// variant-neutral CVV map), then hands off to the package's transport.
//
// The two variants (privacyDB / flowDB) differ only at the API seam, injected via
// hooks the subclass binds:
//   - dispatchCollectRequest(): the whole request-construction + insert/update +
//     response-shaping tail (privacyDB v1 records API vs flowDB /v2 detokenize-style
//     transport, plus flowDB's CVV token masking). `protected abstract`.
//   - handleMultiFileMessages() / handleFileUploadRequest(): privacyDB-only file
//     upload message branches. No-op defaults so flowDB inherits nothing.
// The CVV map is built unconditionally: privacyDB passes it through and ignores it
// (a local object, never read), so the extra work is inert there.
import injectStylesheet from 'inject-stylesheet';
import bus from 'framebus';
import get from 'lodash/get';
import {
  ALLOWED_MULTIPLE_FIELDS_STYLES,
  COLLECT_TYPES,
  ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, ELEMENTS, ERROR_TEXT_STYLES, STYLE_TYPE,
} from '@core/constants';
import { checkForElementMatchRule, checkForValueMatch, getContainerType } from '@core/helpers';
import getCssClassesFromJss, { generateCssWithoutClass } from '@core/libs/jss-styles';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import { getFlexGridStyles } from '@core/libs/styles';
import SkyflowError from '@core/errors';
import { getValueAndItsUnit, validateAndSetupGroupOptions } from '@core/libs/element-options';
import IFrameFormElement from '@core/internal/iframe-form';
import FrameElement from '@core/internal';
import {
  ContainerType, Context, CVVMap, Env, ErrorType, LogLevel,
} from '@core/types';

const set = require('set-value');

export default abstract class FrameElementInit {
  iframeFormElement: IFrameFormElement | undefined;

  clientMetaData: any;

  context: Context;

  #domForm: HTMLFormElement;

  frameElement!: FrameElement;

  containerId: string;

  group: any;

  frameList: FrameElement[] = [];

  iframeFormList: IFrameFormElement[] = [];

  constructor() {
    // this.createIframeElement(frameName, label, skyflowID, isRequired);
    this.context = { logLevel: LogLevel.INFO, env: Env.PROD }; // client level
    this.containerId = '';
    this.#domForm = document.createElement('form');
    this.#domForm.action = '#';
    this.#domForm.onsubmit = (event) => {
      event.preventDefault();
    };
    this.updateGroupData();
    this.createContainerDiv(this.group);
    // Handshake with the composable controller frame. The emit itself signals the
    // parent container (which flips isComposableFrameReady); the frame's own client
    // is built per-request from clientConfig in dispatchCollectRequest, so no reply
    // is consumed here.
    bus
      .target(this.clientMetaData?.clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CONTAINER + this.containerId, {});

    window.addEventListener('message', this.handleCollectCall);
  }

  // ---- Injected divergence (bound per package in the subclass) ----

  // The variant request tail: build the transport request from the assembled
  // insert/update objects, dispatch it, and shape the response. privacyDB and
  // flowDB implement this against their own api-utils/collect.
  protected abstract dispatchCollectRequest(
    insertRequestObject: any,
    updateRequestObject: any,
    cvvMap: CVVMap,
    options: any,
    clientConfig: any,
    errorMessages?: Record<ErrorType, string>,
  ): Promise<any>;

  // Per-element MULTIPLE_UPLOAD_FILES message wiring (privacyDB file upload only).
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  protected handleMultiFileMessages(_event: MessageEvent): void {}

  // The non-COLLECT (FILE_UPLOAD) branch of a COMPOSABLE_CALL_REQUESTS message
  // (privacyDB file upload only).
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  protected handleFileUploadRequest(_event: MessageEvent): void {}

  private handleCollectCall = (event: MessageEvent) => {
    if (event?.origin === this.clientMetaData?.clientDomain) {
      this.handleMultiFileMessages(event);

      if (event?.data && event?.data?.name === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS
         + this.containerId) {
        if (event?.data?.data && event?.data?.data?.type === COLLECT_TYPES.COLLECT) {
          this.tokenize(event?.data?.data, event?.data?.clientConfig, event?.data?.errorMessages)
            .then((response: any) => {
              window?.parent.postMessage({
                type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + this.containerId,
                data: response,
              }, this.clientMetaData?.clientDomain);
            })
            .catch((error) => {
              window?.parent.postMessage({
                type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + this.containerId,
                data: error,
              }, this.clientMetaData?.clientDomain);
            });
        } else {
          this.handleFileUploadRequest(event);
        }
      }
    }
  };

  protected tokenize = (options, clientConfig: any, errorMessages?: Record<ErrorType, string>) => {
    let errorMessage = '';
    const insertRequestObject: any = {};
    const updateRequestObject: any = {};
    const cvvMap: CVVMap = { insert: {}, update: {} };

    for (let i = 0; i < this.iframeFormList.length; i += 1) {
      const inputElement = this.iframeFormList[i];
      if (inputElement) {
        if (
          inputElement.fieldType
                        !== ELEMENTS.FILE_INPUT.name && inputElement.fieldType
                        !== ELEMENTS.MULTI_FILE_INPUT.name
        ) {
          const {
            // eslint-disable-next-line max-len
            state, doesClientHasError, clientErrorText, errorText, onFocusChange, validations,
            setValue,
          } = inputElement;
          if (state.isRequired || !state.isValid) {
            onFocusChange(false);
          }
          if (validations
                          && checkForElementMatchRule(validations)
                          && checkForValueMatch(validations, inputElement)) {
            setValue(state.value);
            onFocusChange(false);
          }
          if (!state.isValid || !state.isComplete) {
            if (doesClientHasError) {
              errorMessage += `${state.name}:${clientErrorText}`;
            } else { errorMessage += `${state.name}:${errorText} `; }
          }
        }
      }
    }

    // return for error
    if (errorMessage.length > 0) {
      // eslint-disable-next-line max-len
      return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.COMPLETE_AND_VALID_INPUTS, [`${errorMessage}`], true));
    }
    // eslint-disable-next-line consistent-return
    for (let i = 0; i < this.iframeFormList.length; i += 1) {
      const inputElement = this.iframeFormList[i];
      if (inputElement) {
        const {
          state, tableName, validations, skyflowID,
        } = inputElement;
        if (tableName) {
          if (
            inputElement.fieldType
        !== ELEMENTS.FILE_INPUT.name && inputElement.fieldType
        !== ELEMENTS.MULTI_FILE_INPUT.name
          ) {
            const isCVV = inputElement.fieldType
            === ELEMENTS.CVV.name
            && inputElement.returnMockValue === true;

            if (
              inputElement.fieldType
          === ELEMENTS.checkbox.name
            ) {
              if (insertRequestObject[state.name]) {
                insertRequestObject[state.name] = `${insertRequestObject[state.name]},${state.value
                }`;
              } else {
                insertRequestObject[state.name] = state.value;
              }
            } else if (insertRequestObject[tableName] && !(skyflowID === '') && skyflowID === undefined) {
              if (get(insertRequestObject[tableName], state.name)
            && !(validations && checkForElementMatchRule(validations))) {
                return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.DUPLICATE_ELEMENT,
                  [state.name, tableName], true));
              }
              set(
                insertRequestObject[tableName],
                state.name,
                inputElement.getUnformattedValue(),
              );
              if (isCVV) {
                cvvMap.insert[tableName] = {
                  ...(cvvMap.insert[tableName] || {}),
                  [state.name]: inputElement.getUnformattedValue(),
                };
              }
            } else if (skyflowID || skyflowID === '') {
              if (skyflowID === '' || skyflowID === null) {
                return Promise.reject(new SkyflowError(
                  SKYFLOW_ERROR_CODE.EMPTY_SKYFLOW_ID_IN_ADDITIONAL_FIELDS,
                ));
              }
              if (updateRequestObject[skyflowID]) {
                set(
                  updateRequestObject[skyflowID],
                  state.name,
                  inputElement.getUnformattedValue(),
                );
              } else {
                updateRequestObject[skyflowID] = {};
                set(
                  updateRequestObject[skyflowID],
                  state.name,
                  inputElement.getUnformattedValue(),
                );
                set(
                  updateRequestObject[skyflowID],
                  'table',
                  tableName,
                );
              }
              if (isCVV) {
                cvvMap.update[skyflowID] = {
                  ...(cvvMap.update[skyflowID] || {}),
                  [state.name]: inputElement.getUnformattedValue(),
                };
              }
            } else {
              insertRequestObject[tableName] = {};
              set(
                insertRequestObject[tableName],
                state.name,
                inputElement.getUnformattedValue(),
              );
              if (isCVV) {
                cvvMap.insert[tableName] = {
                  ...(cvvMap.insert[tableName] || {}),
                  [state.name]: inputElement.getUnformattedValue(),
                };
              }
            }
          }
        }
      }
    }

    // Hand the assembled request objects to the variant transport tail.
    return this.dispatchCollectRequest(
      insertRequestObject, updateRequestObject, cvvMap, options, clientConfig, errorMessages,
    );
  };

  updateGroupData = () => {
    const frameName = window.name;
    const url = window.location?.href;
    const configIndex = url.indexOf('?');
    const encodedString = configIndex !== -1 ? decodeURIComponent(url.substring(configIndex + 1)) : '';
    const parsedRecord = encodedString ? JSON.parse(atob(encodedString)) : {};
    this.clientMetaData = parsedRecord.metaData;
    this.context = {
      logLevel: this.clientMetaData?.clientJSON?.config?.options?.logLevel || LogLevel.ERROR,
      env: this.clientMetaData?.clientJSON?.config?.options?.env || Env.PROD,
    };
    this.group = parsedRecord.record;
    this.containerId = parsedRecord.containerId;
    bus
      .target(this.clientMetaData?.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE + frameName, (data) => {
        if (data.name === frameName) {
          if (data.options !== undefined) {
            this.createContainerDiv(data.options);
          }
        }
      });
  };

  createIframeElement = (frameName, label, skyflowID, isRequired) => {
    this.iframeFormElement = new IFrameFormElement(frameName, label, {
      ...this.clientMetaData,
      isRequired,
    }, this.context, skyflowID);
    this.iframeFormList.push(this.iframeFormElement);
    return this.iframeFormElement;
  };

  createContainerDiv = (newGroup) => {
    this.group = validateAndSetupGroupOptions(
      this.group,
      newGroup,
      false,
    );
    this.group = newGroup;
    const {
      rows, styles, errorTextStyles,
    } = this.group;
    const isComposableContainer = getContainerType(window.name) === ContainerType.COMPOSABLE;
    this.group.spacing = getValueAndItsUnit(this.group.spacing).join('');
    const rootDiv = document.createElement('div');
    rootDiv.className = 'container';
    const containerStylesByClassName = getFlexGridStyles({
      'align-items': this.group.alignItems || 'stretch',
      'justify-content': this.group.justifyContent || 'flex-start',
      spacing: this.group.spacing,
    });

    injectStylesheet.injectWithAllowlist(
      {
        [`.${rootDiv.className}`]: containerStylesByClassName,
      },
      ALLOWED_MULTIPLE_FIELDS_STYLES,
    );
    let count = 0;
    rows.forEach((row, rowIndex) => {
      row.spacing = getValueAndItsUnit(row.spacing).join('');
      const rowDiv = document.createElement('div');
      rowDiv.id = `row-${rowIndex}`;

      const intialRowStyles = {
        'align-items': row.alignItems || 'stretch',
        'justify-content': row.justifyContent || 'flex-start',
        spacing: row.spacing,
        padding: this.group.spacing,
      };
      const rowStylesByClassName = getFlexGridStyles(intialRowStyles);
      let errorTextElement;
      if (isComposableContainer) {
        rowDiv.className = `${rowDiv.id} SkyflowElement-${rowDiv.id}-base`;
        const rowStyles = {
          [STYLE_TYPE.BASE]: {
            // ...rowStylesByClassName,
            // alignItems: rowStylesByClassName['align-items'],
            // justifyContent: rowStylesByClassName['justify-content'],
            ...(styles && styles[STYLE_TYPE.BASE]),
          },
        };

        getCssClassesFromJss(rowStyles, `${rowDiv.id}`);

        errorTextElement = document.createElement('span');
        errorTextElement.id = `${rowDiv.id}-error`;
        errorTextElement.className = 'SkyflowElement-row-error-base';

        const errorStyles = {
          [STYLE_TYPE.BASE]: {
            ...ERROR_TEXT_STYLES,
            ...(errorTextStyles && errorTextStyles[STYLE_TYPE.BASE]),
          },
        };
        getCssClassesFromJss(errorStyles, 'row-error');
        if (errorTextStyles && errorTextStyles[STYLE_TYPE.GLOBAL]) {
          generateCssWithoutClass(errorTextStyles[STYLE_TYPE.GLOBAL]);
        }
      } else {
        rowDiv.className = `row-${rowIndex}`;
        injectStylesheet.injectWithAllowlist(
          {
            [`.${rowDiv.className}`]: rowStylesByClassName,
          },
          ALLOWED_MULTIPLE_FIELDS_STYLES,
        );
      }

      const errorTextMap = {};
      row.elements.forEach((element) => {
        const elementDiv = document.createElement('div');
        elementDiv.className = `element-${count}`;
        elementDiv.id = `${rowDiv.id}:element-${count}`;
        count += 1;
        const elementStylesByClassName = {
          padding: row.spacing,
        };
        injectStylesheet.injectWithAllowlist(
          {
            [`.${elementDiv.className}`]: elementStylesByClassName,
          },
          ALLOWED_MULTIPLE_FIELDS_STYLES,
        );
        // create a iframeelement
        // create element by passing iframeformelement and options and mount by default returns
        const iFrameFormElement = this.createIframeElement(
          element.elementName,
          element.label,
          element.skyflowID,
          element.required,
        );
        this.frameElement = new FrameElement(
          iFrameFormElement,
          element,
          elementDiv,
          this.clientMetaData.clientDomain,
        );
        this.frameList.push(this.frameElement);

        if (isComposableContainer && errorTextElement) {
          iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.BLUR, (state) => {
            errorTextMap[element.elementName] = state.error;
            this.#updateCombinedErrorText(errorTextElement.id, errorTextMap);
            window.parent.postMessage(
              {
                type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + window.name,
                data: { height: rootDiv.scrollHeight, name: window.name },
              },
              this.clientMetaData.clientDomain,
            );
          });
        }

        rowDiv.append(elementDiv);
      });
      rootDiv.append(rowDiv);
      if (isComposableContainer) { rootDiv.append(errorTextElement); }
    });

    if (this.#domForm) {
      // for cleaning
      this.#domForm.innerHTML = '';
      document.body.innerHTML = '';
      this.#domForm.append(rootDiv);
      document.body.append(this.#domForm);
    }
    bus.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + window.name, (data, callback) => {
      callback({ height: rootDiv.scrollHeight, name: window.name });
    });
    window.parent.postMessage(
      {
        type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + window.name,
        data: { height: rootDiv.scrollHeight, name: window.name },
      },
      this.clientMetaData.clientDomain,
    );
    window.addEventListener('message', (event) => {
      if (event?.data?.name === ELEMENT_EVENTS_TO_CLIENT.HEIGHT + window.name) {
        window.parent.postMessage(
          {
            type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + window.name,
            data: { height: rootDiv.scrollHeight, name: window.name },
          },
          this.clientMetaData.clientDomain,
        );
      }
    });
  };

  #updateCombinedErrorText = (elementId, errorMessages) => {
    const currentErrorElememt = document.getElementById(elementId);
    let errorText = '';
    Object.values(errorMessages).forEach((message) => {
      errorText += (message) && `${message}. `;
    });
    if (currentErrorElememt) { currentErrorElememt.innerText = errorText; }
  };
}
