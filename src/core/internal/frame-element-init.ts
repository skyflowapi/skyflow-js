import injectStylesheet from 'inject-stylesheet';
import bus from 'framebus';
import get from 'lodash/get';
import { getValueAndItsUnit, validateAndSetupGroupOptions } from '../../libs/element-options';
import { getFlexGridStyles } from '../../libs/styles';
import { ContainerType } from '../../skyflow';
import {
  Context, Env, LogLevel,
  MessageType,
} from '../../utils/common';
import {
  fileValidation, generateUploadFileName, getContainerType, vaildateFileName,
} from '../../utils/helpers';
import {
  ALLOWED_MULTIPLE_FIELDS_STYLES,
  COLLECT_TYPES,
  ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, ELEMENTS, ERROR_TEXT_STYLES, STYLE_TYPE,
} from '../constants';
import IFrameFormElement from './iframe-form';
import getCssClassesFromJss, { generateCssWithoutClass } from '../../libs/jss-styles';
import FrameElement from '.';
import {
  checkForElementMatchRule, checkForValueMatch, constructElementsInsertReq,
  constructInsertRecordRequest, insertDataInCollect,
  updateRecordsBySkyflowIDComposable,
} from '../../core-utils/collect';
import SkyflowError from '../../libs/skyflow-error';
import SKYFLOW_ERROR_CODE from '../../utils/constants';
import Client from '../../client';
import { printLog } from '../../utils/logs-helper';

const set = require('set-value');

export default class FrameElementInit {
  iframeFormElement: IFrameFormElement | undefined;

  clientMetaData: any;

  context: Context;

  #domForm: HTMLFormElement;

  frameElement!: FrameElement;

  private static frameEle?: any;

  containerId: string;

  group: any;

  frameList: FrameElement[] = [];

  iframeFormList: IFrameFormElement[] = [];

  #client!: Client;

  #context!: Context;

  constructor() {
    // this.createIframeElement(frameName, label, skyflowID, isRequired);
    this.context = { logLevel: LogLevel.INFO, env: Env.DEV }; // client level
    this.containerId = '';
    this.#domForm = document.createElement('form');
    this.#domForm.action = '#';
    this.#domForm.onsubmit = (event) => {
      event.preventDefault();
    };
    this.updateGroupData();
    this.createContainerDiv(this.group);
    bus
      // .target(this.clientMetaData.clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CONTAINER + this.containerId, {}, (data: any) => {
        this.#context = data.context;
        data.client.config = {
          ...data.client.config,
        };
        this.#client = Client.fromJSON(data.client) as any;
      });

    window.addEventListener('message', this.handleCollectCall);
  }

  private handleCollectCall = (event: MessageEvent) => {
    this.iframeFormList.forEach((inputElement) => {
      if (inputElement) {
        if (inputElement.fieldType
          === ELEMENTS.MULTI_FILE_INPUT.name) {
          if (event?.data && event?.data?.name === `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES}:${inputElement.iFrameName}`) {
            this.#client = Client.fromJSON(event?.data?.clientConfig);
            this.multipleUploadFiles(inputElement, event?.data?.clientConfig, event?.data?.options)
              ?.then((response: any) => {
                window?.parent.postMessage({
                  type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${inputElement.iFrameName}`,
                  data: response,
                }, this.clientMetaData.clientDomain);
              }).catch((error) => {
                window?.parent.postMessage({
                  type: `${ELEMENT_EVENTS_TO_IFRAME.MULTIPLE_UPLOAD_FILES_RESPONSE}:${inputElement.iFrameName}`,
                  data: error,
                }, this.clientMetaData.clientDomain);
              });
          }
        }
      }
    });

    // if (event.origin === this.clientMetaData.clientDomain) {
    if (event.data && event.data.name === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_REQUESTS
         + this.containerId) {
      if (event.data.data && event.data.data.type === COLLECT_TYPES.COLLECT) {
        this.tokenize(event.data.data, event.data.clientConfig)
          .then((response: any) => {
            window?.parent.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + this.containerId,
              data: response,
            }, this.clientMetaData.clientDomain);
          })
          .catch((error) => {
            window?.parent.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + this.containerId,
              data: error,
            }, this.clientMetaData.clientDomain);
          });
      } else if (event.data.data && event.data.data.type === COLLECT_TYPES.FILE_UPLOAD) {
        this.parallelUploadFiles(event.data.data, event.data.clientConfig)
          .then((response: any) => {
            window?.parent.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + this.containerId,
              data: response,
            }, this.clientMetaData.clientDomain);
          })
          .catch((error) => {
            window?.parent.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + this.containerId,
              data: error,
            }, this.clientMetaData.clientDomain);
          });
      }
    }
    if (event.data.name === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CONTAINER + this.containerId) {
      const data = event.data;
      this.#context = data.context;
      data.client.config = {
        ...data.client.config,
      };
      this.#client = Client.fromJSON(data.client) as any;
    }
    // }
  };

  private parallelUploadFiles = (options, config) => new Promise((rootResolve, rootReject) => {
    const promises: Promise<unknown>[] = [];
    this.iframeFormList.forEach((inputElement) => {
      let res: Promise<unknown>;
      if (inputElement) {
        if (
          inputElement.fieldType
          === ELEMENTS.FILE_INPUT.name
        ) {
          res = this.uploadFiles(inputElement, config);
          promises.push(res);
        }
      }
    });
    Promise.allSettled(
      promises,
    ).then((resultSet) => {
      const fileUploadResponse: any[] = [];
      const errorResponse: any[] = [];
      resultSet.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value !== undefined && result.value !== null) {
            if (Object.prototype.hasOwnProperty.call(result.value, 'error')) {
              errorResponse.push(result.value);
            } else {
              const response = typeof result.value === 'string'
                ? JSON.parse(result.value)
                : result.value;
              fileUploadResponse.push(response);
            }
          }
        } else if (result.status === 'rejected') {
          errorResponse.push(result.reason);
        }
      });
      if (errorResponse.length === 0) {
        rootResolve({ fileUploadResponse });
      } else if (fileUploadResponse.length === 0) rootReject({ errorResponse });
      else rootReject({ fileUploadResponse, errorResponse });
    });
  });

  uploadFiles = (fileElement, clientConfig) => {
    this.#client = new Client(clientConfig, {});
    if (!this.#client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
    const fileUploadObject: any = {};

    const {
      state, tableName, skyflowID, onFocusChange, preserveFileName,
    } = fileElement;

    if (state.isRequired) {
      onFocusChange(false);
    }
    try {
      fileValidation(state.value, state.isRequired, fileElement);
    } catch (err) {
      return Promise.reject(err);
    }

    const validatedFileState = fileValidation(state.value, state.isRequired, fileElement);

    if (!validatedFileState) {
      return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_TYPE, [], true));
    }
    fileUploadObject[state.name] = state.value;

    const formData = new FormData();

    const column = Object.keys(fileUploadObject)[0];

    const value: Blob = Object.values(fileUploadObject)[0] as Blob;

    if (preserveFileName) {
      const isValidFileName = vaildateFileName(state.value.name);
      if (!isValidFileName) {
        return Promise.reject(
          new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_NAME, [], true),
        );
      }
      formData.append(column, value);
    } else {
      const generatedFileName = generateUploadFileName(state.value.name);
      formData.append(column, new File([value], generatedFileName, { type: state.value.type }));
    }

    const client = this.#client;
    const sendRequest = () => new Promise((rootResolve, rootReject) => {
      client
        .request({
          body: formData,
          requestMethod: 'POST',
          url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${tableName}/${skyflowID}/files`,
          headers: {
            authorization: `Bearer ${clientConfig.authToken}`,
            'content-type': 'multipart/form-data',
          },
        })
        .then((response: any) => {
          rootResolve(response);
        })
        .catch((error) => {
          rootReject(error);
        });
    });

    return new Promise((resolve, reject) => {
      sendRequest()
        .then((res) => resolve(res))
        .catch((err) => {
          reject(err);
        });
    });
  };

  private tokenize = (options, clientConfig: any) => {
    let errorMessage = '';
    const insertRequestObject: any = {};
    const updateRequestObject: any = {};

    this.iframeFormList.forEach((inputElement) => {
      if (inputElement) {
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
    });

    // return for error
    if (errorMessage.length > 0) {
      // eslint-disable-next-line max-len
      return Promise.reject(new SkyflowError(SKYFLOW_ERROR_CODE.COMPLETE_AND_VALID_INPUTS, [`${errorMessage}`], true));
    }
    // eslint-disable-next-line consistent-return
    this.iframeFormList.forEach((inputElement) => {
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
            } else {
              insertRequestObject[tableName] = {};
              set(
                insertRequestObject[tableName],
                state.name,
                inputElement.getUnformattedValue(),
              );
            }
          }
        }
      }
    });
    let finalInsertRequest;
    let finalInsertRecords;
    let finalUpdateRecords;
    try {
      [finalInsertRecords, finalUpdateRecords] = constructElementsInsertReq(
        insertRequestObject, updateRequestObject, options.options,
      );
      finalInsertRequest = constructInsertRecordRequest(finalInsertRecords, options.options);
    } catch (error:any) {
      return Promise.reject({
        error: error?.message,
      });
    }
    this.#client = new Client(clientConfig, {});
    const client = this.#client;
    const sendRequest = () => new Promise((rootResolve, rootReject) => {
      const insertPromiseSet: Promise<any>[] = [];

      // const clientId = client.toJSON()?.metaData?.uuid || '';
      // getAccessToken(clientId).then((authToken) => {
      if (finalInsertRequest.length !== 0) {
        insertPromiseSet.push(
          insertDataInCollect(finalInsertRequest,
            client, options, finalInsertRecords, clientConfig.authToken as string),
        );
      }
      if (finalUpdateRecords.updateRecords.length !== 0) {
        insertPromiseSet.push(
          updateRecordsBySkyflowIDComposable(
            finalUpdateRecords, client, options, clientConfig.authToken as string,
          ),
        );
      }
      if (insertPromiseSet.length !== 0) {
        Promise.allSettled(insertPromiseSet).then((resultSet: any) => {
          const recordsResponse: any[] = [];
          const errorsResponse: any[] = [];

          resultSet.forEach((result:
          { status: string; value: any; reason?: any; }) => {
            if (result.status === 'fulfilled') {
              if (result.value.records !== undefined && Array.isArray(result.value.records)) {
                result.value.records.forEach((record) => {
                  recordsResponse.push(record);
                });
              }
              if (result.value.errors !== undefined && Array.isArray(result.value.errors)) {
                result.value.errors.forEach((error) => {
                  errorsResponse.push(error);
                });
              }
            } else {
              if (result.reason?.records !== undefined && Array.isArray(result.reason?.records)) {
                result.reason.records.forEach((record) => {
                  recordsResponse.push(record);
                });
              }
              if (result.reason?.errors !== undefined && Array.isArray(result.reason?.errors)) {
                result.reason.errors.forEach((error) => {
                  errorsResponse.push(error);
                });
              }
            }
          });
          if (errorsResponse.length === 0) {
            rootResolve({ records: recordsResponse });
          } else if (recordsResponse.length === 0) rootReject({ errors: errorsResponse });
          else rootReject({ records: recordsResponse, errors: errorsResponse });
        });
      }
      // }).catch((err) => {
      //   rootReject({
      //     error: err,
      //   });
      // });
    });

    return new Promise((resolve, reject) => {
      sendRequest()
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  };

  // eslint-disable-next-line consistent-return
  private multipleUploadFiles =
  (fileElement: IFrameFormElement,
    clientConfig, metaData) => new Promise((rootResolve, rootReject) => {
    this.#client = new Client(clientConfig, {});
    if (!this.#client) throw new SkyflowError(SKYFLOW_ERROR_CODE.CLIENT_CONNECTION, [], true);
    const {
      state, tableName, onFocusChange, preserveFileName,
    } = fileElement;
    if (state.isRequired) {
      onFocusChange(false);
    }

    if (fileElement.state.value === undefined || fileElement.state.value === null || fileElement.state.value === '') {
      rootReject({ error: 'No files selected' });
      return;
    }
    const files = state.value instanceof FileList
      ? Array.from(state.value)
      : [state.value];

    this.validateFiles(files, state, fileElement);
    const insertRequest = this.createInsertRequest(files.length, metaData);
    this.insertDataCallInMultiFiles(
      insertRequest, this.#client, tableName as string, clientConfig.authToken as string,
    ).then((response: any) => {
      const skyflowIDs = this.extractSkyflowIDs(response);
      if (skyflowIDs.length === 0) {
        rootReject({ error: 'No skyflow IDs returned from insert data' });
        return;
      }
      const promises: Promise<unknown>[] = [];

      files.forEach((file, index) => {
        const fileUploadObject: any = {};
        fileUploadObject[state.name] = file;
        const formData = new FormData();
        const column = Object.keys(fileUploadObject)[0];
        const value: Blob = Object.values(fileUploadObject)[0] as Blob;
        if (preserveFileName) {
          formData.append(column, value);
        } else {
          const generatedFileName = generateUploadFileName(file.name);
          formData.append(column, new File([value], generatedFileName, { type: file.type }));
        }
        const client = this.#client;
        const promise1 = new Promise((resolve, reject) => {
          client
            .request({
              body: formData,
              requestMethod: 'POST',
              url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${tableName}/${skyflowIDs[index]}/files`,
              headers: {
                authorization: `Bearer ${clientConfig.authToken}`,
                'content-type': 'multipart/form-data',
              },
            })
            .then((response1) => {
              resolve(response1);
            })
            .catch((error) => {
              reject(error);
            });
        });
        promises.push(promise1);
      });
      Promise.allSettled(
        promises,
      ).then((resultSet) => {
        const fileUploadResponse: any[] = [];
        const errorResponse: any[] = [];
        resultSet.forEach((result) => {
          if (result.status === 'fulfilled') {
            if (result.value !== undefined && result.value !== null) {
              if (Object.prototype.hasOwnProperty.call(result.value, 'error')) {
                errorResponse.push(result.value);
              } else {
                const response1 = typeof result.value === 'string'
                  ? JSON.parse(result.value)
                  : result.value;
                fileUploadResponse.push(response1);
              }
            }
          } else if (result.status === 'rejected') {
            errorResponse.push({ error: result.reason });
          }
        });
        if (errorResponse.length === 0) {
          rootResolve({ fileUploadResponse });
        } else if (fileUploadResponse.length === 0) rootReject({ errorResponse });
        else rootReject({ fileUploadResponse, errorResponse });
      });
    }).catch((error) => {
      printLog(`${error}`, MessageType.LOG, this.#context.logLevel);
      rootReject({
        error: error?.error || error,
      });
    });
  });

  private validateFiles = (files: File[], state: any, fileElement: IFrameFormElement) => {
    files.forEach((file) => {
      // Check file validation
      const validatedFileState = fileValidation(file, state.isRequired, fileElement);
      if (!validatedFileState) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_TYPE, [], true);
      }

      // Check filename validation
      const isValidFileName = vaildateFileName(file.name);
      if (!isValidFileName) {
        throw new SkyflowError(SKYFLOW_ERROR_CODE.INVALID_FILE_NAME, [], true);
      }
    });
    return true;
  };

  private createInsertRequest = (numberOfRequests: number, options = {}) => {
  // Create basic request structure
    const request = {
      records: [] as Array<{ fields: Record<string, any> }>,
      tokenization: false,
    };

    // Add empty field objects based on number of requests
    for (let i = 0; i < numberOfRequests; i += 1) {
      request.records.push({
        fields: options === undefined ? {} : options,
      });
    }

    return request;
  };

  private extractSkyflowIDs = (response: { records: Array<{ skyflow_id: string }> }): string[] => {
    if (!response?.records || !Array.isArray(response.records)) {
      return [];
    }

    return response.records
      .map((record) => record.skyflow_id)
      .filter((id) => id !== undefined && id !== null);
  };

  private insertDataCallInMultiFiles = (
    insertRequest,
    client: Client,
    tableName: string,
    authToken: string,
  ) => new Promise((rootResolve, rootReject) => {
    client
      .request({
        body: {
          ...insertRequest,
        },
        requestMethod: 'POST',
        url: `${client.config.vaultURL}/v1/vaults/${client.config.vaultID}/${tableName}`,
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': 'application/json',
        },
      })
      .then((response: any) => {
        // Extract skyflow IDs from response
        const skyflowIDs = this.extractSkyflowIDs(response);
        rootResolve({
          ...response,
          skyflowIDs, // Add extracted IDs to response
        });
      })
      .catch((error) => {
        rootReject(error);
      });
  });

  updateGroupData = () => {
    const frameName = window.name;
    const url = window.location?.href;
    const configIndex = url.indexOf('?');
    const encodedString = configIndex !== -1 ? decodeURIComponent(url.substring(configIndex + 1)) : '';
    const parsedRecord = encodedString ? JSON.parse(atob(encodedString)) : {};
    this.clientMetaData = parsedRecord.metaData;
    this.group = parsedRecord.record;
    this.containerId = parsedRecord.containerId;
    bus
      .target(this.clientMetaData.clientDomain)
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

  static startFrameElement = () => {
    FrameElementInit.frameEle = new FrameElementInit();
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
      if (event.data.name === ELEMENT_EVENTS_TO_CLIENT.HEIGHT + window.name) {
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
