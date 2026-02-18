/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import JSZip from 'jszip';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  STYLE_TYPE,
  REVEAL_ELEMENT_ERROR_TEXT,
  REVEAL_ELEMENT_LABEL_DEFAULT_STYLES,
  REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
  REVEAL_ELEMENT_DIV_STYLE,
  REVEAL_ELEMENT_OPTIONS_TYPES,
  COPY_UTILS,
  REVEAL_COPY_ICON_STYLES,
  DEFAULT_FILE_RENDER_ERROR,
  ELEMENT_EVENTS_TO_CLIENT,
  REVEAL_TYPES,
  LEFT_NAV_STYLES,
  RIGHT_PANEL_STYLES,
  LEFT_NAV_LIST_ITEM_STYLES,
  ZIP_CONTAINER_STYLES,
  RENDER_ELEMENT_IMAGE_STYLES,
  SIGNED_TOKEN_PREFIX,
  RENDER_LOADING_MESSAGE,
  EMBED_DEFAULT_STYLES,
  ZIP_RENDER_WARNING_STYLES,
  ZIP_FILE_CONSTANTS,
  ZIP_UL_STYLES,
} from '../../constants';
import getCssClassesFromJss, { generateCssWithoutClass } from '../../../libs/jss-styles';
import {
  printLog, parameterizedString,
} from '../../../utils/logs-helper';
import logs from '../../../utils/logs';
import {
  Context, EventName, IRenderResponseType, IRevealRecord, MessageType, RedactionType,
} from '../../../utils/common';
import {
  constructMaskTranslation,
  formatRevealElementOptions,
  getAtobValue,
  getContainerType,
  getMaskedOutput, getValueFromName, handleCopyIconClick, styleToString,
} from '../../../utils/helpers';
import { formatForRenderClient, getFileURLFromVaultBySkyflowIDComposable } from '../../../core-utils/reveal';
import Client from '../../../client';
import properties from '../../../properties';
import { isDangerousFileType } from '../../../utils/validators';
import SKYFLOW_ERROR_CODE from '../../../utils/constants';

const { getType } = require('mime');

const CLASS_NAME = 'RevealFrame';
class RevealFrame {
  static revealFrame: RevealFrame;

  #elementContainer: HTMLDivElement;

  #dataElememt: HTMLSpanElement;

  #labelElement: HTMLSpanElement;

  #errorElement: HTMLSpanElement;

  #name: string;

  #record: any;

  #containerId: string;

  #clientDomain: string;

  #inputStyles!: object;

  #labelStyles!: object;

  #errorTextStyles!: object;

  #revealedValue!: string;

  #context: Context;

  private domCopy?: HTMLImageElement;

  private isRevealCalled?: boolean;

  #skyflowContainerId: string = '';

  #client!: Client;

  #leftNav: HTMLDivElement;

  #rightPanel: HTMLDivElement;

  #filesList: { name: string; fileSize: number, type: string }[] = [];

  #rootDiv?: HTMLDivElement;

  #composableContainer: Boolean = false;

  #downloadHandler?: (event: MessageEvent) => void;

  #blobUrls: string[] = [];

  static init() {
    const url = window.location?.href;
    const configIndex = url.indexOf('?');
    const encodedString = configIndex !== -1 ? decodeURIComponent(url.substring(configIndex + 1)) : '';
    const parsedRecord = encodedString ? JSON.parse(atob(encodedString)) : {};
    const skyflowContainerId = parsedRecord.clientJSON.metaData.uuid;
    RevealFrame.revealFrame = new RevealFrame(parsedRecord.record,
      parsedRecord.context, skyflowContainerId);
  }

  constructor(record, context: Context, id: string, rootDiv?: HTMLDivElement) {
    this.#skyflowContainerId = id;
    this.#name = rootDiv ? record?.name : window.name;
    this.#rootDiv = rootDiv;
    this.#composableContainer = getContainerType(this.#name) === 'COMPOSABLE_REVEAL';
    this.#containerId = getValueFromName(this.#name, 2);
    const encodedClientDomain = getValueFromName(this.#name, 4);
    const clientDomain = getAtobValue(encodedClientDomain);
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/') || clientDomain;
    this.#record = record;
    this.#context = context;
    this.isRevealCalled = false;

    this.#elementContainer = document.createElement('div');
    this.#elementContainer.className = 'SkyflowElement-div-container';
    getCssClassesFromJss(REVEAL_ELEMENT_DIV_STYLE, 'div');

    this.#labelElement = document.createElement('span');
    this.#labelElement.className = `SkyflowElement-${this.#name}-label-${STYLE_TYPE.BASE}`;

    this.#dataElememt = document.createElement('span');
    this.#dataElememt.className = `SkyflowElement-${this.#name}-content-${STYLE_TYPE.BASE}`;
    this.#dataElememt.id = this.#name;

    this.#errorElement = document.createElement('span');
    this.#errorElement.className = `SkyflowElement-${this.#name}-error-${STYLE_TYPE.BASE}`;
    this.#leftNav = document.createElement('div');
    this.#rightPanel = document.createElement('div');
    this.#leftNav.id = 'left-nav';
    this.#rightPanel.id = 'right-panel';

    if (this.#record.enableCopy) {
      this.domCopy = document.createElement('img');
      this.domCopy.src = COPY_UTILS.copyIcon;
      this.domCopy.title = COPY_UTILS.toCopy;
      this.domCopy.setAttribute('style', this.#record?.inputStyles?.copyIcon ? styleToString(this.#record.inputStyles.copyIcon) : REVEAL_COPY_ICON_STYLES);
      this.#elementContainer.append(this.domCopy);

      this.domCopy.onclick = () => {
        if (this.isRevealCalled) {
          handleCopyIconClick(this.#revealedValue, this.domCopy);
        } else {
          handleCopyIconClick(this.#record.token, this.domCopy);
        }
      };
    }
    if (Object.prototype.hasOwnProperty.call(this.#record, 'label') && !Object.prototype.hasOwnProperty.call(this.#record, 'skyflowID')) {
      this.#labelElement.innerText = this.#record.label;
      this.#elementContainer.append(this.#labelElement);

      if (Object.prototype.hasOwnProperty.call(this.#record, 'labelStyles')) {
        this.#labelStyles = {};
        this.#labelStyles[STYLE_TYPE.BASE] = {
          ...REVEAL_ELEMENT_LABEL_DEFAULT_STYLES[STYLE_TYPE.BASE],
          ...this.#record.labelStyles[STYLE_TYPE.BASE],
        };
        // getCssClassesFromJss(this.#labelStyles, 'label');
        getCssClassesFromJss(this.#labelStyles, `${this.#name}-label`);

        if (this.#record.labelStyles[STYLE_TYPE.GLOBAL]) {
          generateCssWithoutClass(this.#record.labelStyles[STYLE_TYPE.GLOBAL]);
        }
      } else {
        getCssClassesFromJss(REVEAL_ELEMENT_LABEL_DEFAULT_STYLES, `${this.#name}-label`);
      }
    }
    this.updateDataView();
    if (Object.prototype.hasOwnProperty.call(this.#record, 'inputStyles')) {
      this.#inputStyles = {};
      this.#inputStyles[STYLE_TYPE.BASE] = {
        ...this.#record.inputStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#inputStyles, `${this.#name}-content`);
      if (this.#record.inputStyles[STYLE_TYPE.GLOBAL]) {
        generateCssWithoutClass(this.#record.inputStyles[STYLE_TYPE.GLOBAL]);
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(this.#record, 'errorTextStyles')
      && Object.prototype.hasOwnProperty.call(this.#record.errorTextStyles, STYLE_TYPE.BASE)
    ) {
      this.#errorTextStyles = {};
      this.#errorTextStyles[STYLE_TYPE.BASE] = {
        ...REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES[STYLE_TYPE.BASE],
        ...this.#record.errorTextStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#errorTextStyles, `${this.#name}-error`);
      if (this.#record.errorTextStyles[STYLE_TYPE.GLOBAL]) {
        generateCssWithoutClass(this.#record.errorTextStyles[STYLE_TYPE.GLOBAL]);
      }
    } else {
      getCssClassesFromJss(
        REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES,
        `${this.#name}-error`,
      );
    }

    this.#elementContainer.appendChild(this.#dataElememt);

    if (rootDiv) rootDiv.append(this.#elementContainer);
    else document.body.append(this.#elementContainer);
    // document.body.append(this.#elementContainer);

    bus.emit(ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#name, { name: this.#name });
    if (rootDiv) {
      this.getConfig();
      window.parent.postMessage({
        type: ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.#name,
        data: {
          name: this.#name,
        },
      }, this.#clientDomain);

      window.parent.postMessage({
        type: ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#name,
        data: { height: this.#elementContainer.scrollHeight, name: this.#name },
      }, this.#clientDomain);
    }
    bus.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#name, (_, callback) => {
      callback({ height: this.#elementContainer.scrollHeight, name: this.#name });
    });
    const sub2 = (responseUrl) => {
      if (responseUrl.iframeName === this.#name) {
        if (Object.prototype.hasOwnProperty.call(responseUrl, 'error') && responseUrl.error === DEFAULT_FILE_RENDER_ERROR) {
          this.setRevealError(DEFAULT_FILE_RENDER_ERROR);
          if (Object.prototype.hasOwnProperty.call(this.#record, 'altText')) {
            this.#dataElememt.innerText = this.#record.altText;
          }
          bus
            .emit(
              ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#name,
              {
                height: this.#elementContainer.scrollHeight,
              }, () => {
              },
            );
        } else {
          const ext = this.getExtension(responseUrl.url);
          this.addFileRender(responseUrl.url, ext);
        }
      }
    };
    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY + this.#name,
        sub2,
      );

    const sub = (data) => {
      const tokenToMatch = this.decodeSignedToken(this.#record.token);

      if (Object.prototype.hasOwnProperty.call(data, tokenToMatch)) {
        let responseData = data[tokenToMatch];

        if (Array.isArray(responseData)) {
          const recordRedaction = this.#record.redaction || RedactionType.PLAIN_TEXT;
          const matchingRecord = responseData.find(
            (item) => item.redaction === recordRedaction,
          );
          responseData = matchingRecord || responseData[0];
        }

        const responseValue = typeof responseData === 'string' ? responseData : responseData?.value;
        this.#revealedValue = responseValue;
        this.isRevealCalled = true;
        this.#dataElememt.innerText = responseValue;
        if (this.#record.mask) {
          const { formattedOutput } = getMaskedOutput(this.#dataElememt.innerText,
            this.#record.mask[0],
            constructMaskTranslation(this.#record.mask));
          this.#dataElememt.innerText = formattedOutput;
        }
        printLog(parameterizedString(logs.infoLogs.ELEMENT_REVEALED,
          CLASS_NAME, tokenToMatch), MessageType.LOG, this.#context?.logLevel);

        // bus
        //   .target(window.location.origin)
        //   .off(
        //     ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId,
        //     sub,
        //   );
      } else {
        // eslint-disable-next-line no-lonely-if
        if (!Object.prototype.hasOwnProperty.call(this.#record, 'skyflowID')) {
          this.setRevealError(REVEAL_ELEMENT_ERROR_TEXT);
        }
      }
      // this.updateDataView();
    };

    bus
      .target(window.location.origin)
      .on(
        ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.#containerId,
        sub,
      );

    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_SET_ERROR + this.#name, (data) => {
        if (this.#name === data.name) {
          if (data.isTriggerError) { this.setRevealError(data.clientErrorText as string); } else { this.setRevealError(''); }
        }
      });
    window.parent.postMessage(
      {
        type: ELEMENT_EVENTS_TO_IFRAME.RENDER_MOUNTED + this.#name,
        data: {
          name: window.name,
        },
      }, this.#clientDomain,
    );
    this.updateRevealElementOptions();
    window.addEventListener('message', (event) => {
      if (event?.data?.name === ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.#name) {
        if (event?.data?.data?.iframeName === this.#name
          && event?.data?.data?.type === REVEAL_TYPES.RENDER_FILE) {
          this.renderFile(this.#record, event?.data?.clientConfig,
            event?.data?.errorMessages)?.then((resolvedResult) => {
            const result = formatForRenderClient(
              resolvedResult as IRenderResponseType,
              this.#record?.column,
            );
            window?.parent?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + this.#name,
              data: {
                type: REVEAL_TYPES.RENDER_FILE,
                result,
              },
            }, this.#clientDomain);

            window?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name,
            }, properties?.IFRAME_SECURE_ORIGIN);
          })?.catch((error) => {
            window?.parent?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + this.#name,
              data: {
                type: REVEAL_TYPES.RENDER_FILE,
                result: {
                  errors: error,
                },
              },
            }, this.#clientDomain);

            window?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name,
            }, properties?.IFRAME_SECURE_ORIGIN);
          });
        }
      }

      if (event?.data?.type === ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#name) {
        if (event?.data?.data?.height) {
          window?.parent?.postMessage({
            type: ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#name,
            data: {
              height: this.#elementContainer?.scrollHeight ?? 0,
              name: this.#name,
            },
          }, this.#clientDomain);
        }
      }
    });
  }

  responseUpdate = (data) => {
    if (data?.frameId === this.#record?.name && data?.error) {
      if (!Object.prototype.hasOwnProperty.call(this.#record, 'skyflowID')) {
        this.setRevealError(REVEAL_ELEMENT_ERROR_TEXT);
      }
    } else if (data?.frameId === this.#record?.name && data?.[0]?.token) {
      const tokenToMatch = this.decodeSignedToken(this.#record?.token);

      if (tokenToMatch === data?.[0]?.token) {
        const responseValue = data?.[0]?.value as string ?? '';
        this.#revealedValue = responseValue;
        this.isRevealCalled = true;
        this.#dataElememt.innerText = responseValue;

        if (this.#record?.mask) {
          const { formattedOutput } = getMaskedOutput(
            this.#dataElememt?.innerText ?? '',
            this.#record?.mask?.[0],
            constructMaskTranslation(this.#record?.mask),
          );
          this.#dataElememt.innerText = formattedOutput ?? '';
        }

        printLog(
          parameterizedString(
            logs?.infoLogs?.ELEMENT_REVEALED,
            CLASS_NAME,
            tokenToMatch,
          ),
          MessageType.LOG,
          this.#context?.logLevel,
        );
      }
    }

    window?.parent?.postMessage(
      {
        type: ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#name,
        data: {
          height: this.#elementContainer?.scrollHeight ?? 0,
          name: this.#name,
        },
      },
      this.#clientDomain,
    );
  };

  getConfig = () => {
    const url = window.location?.href;
    const configIndex = url.indexOf('?');
    const encodedString = configIndex !== -1 ? decodeURIComponent(url.substring(configIndex + 1)) : '';
    const parsedRecord = encodedString ? JSON.parse(atob(encodedString)) : {};
    this.#clientDomain = parsedRecord.clientDomain || '';
    this.#containerId = parsedRecord.containerId;
  };

  getData = () => this.#record;

  public decodeSignedToken(token: string): string {
    let tokenToMatch = token;

    if (tokenToMatch && tokenToMatch.startsWith(SIGNED_TOKEN_PREFIX)) {
      try {
        const bearerToken = tokenToMatch.substring(SIGNED_TOKEN_PREFIX.length);

        const parts = bearerToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));

          if (payload.tok) {
            tokenToMatch = payload.tok;
          }
        }
      } catch (err) {
        printLog(
          parameterizedString(logs.errorLogs.SIGNED_TOKEN_DECODE_FAILED),
          MessageType.ERROR,
          this.#context?.logLevel,
        );
      }
    }

    return tokenToMatch;
  }

  private sub2 = (responseUrl: { iframeName?: string; error?: string; url?: string }) => {
    if (responseUrl.iframeName === this.#name) {
      if (Object.prototype.hasOwnProperty.call(responseUrl, 'error') && responseUrl.error === DEFAULT_FILE_RENDER_ERROR) {
        this.setRevealError(DEFAULT_FILE_RENDER_ERROR);
        if (Object.prototype.hasOwnProperty.call(this.#record, 'altText')) {
          this.#dataElememt.innerText = this.#record.altText;
        }
        bus
          .emit(
            ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#name,
            {
              height: this.#elementContainer.scrollHeight,
            }, () => {
            },
          );
      } else {
        const ext = this.getExtension(responseUrl.url as string);
        this.addFileRender(responseUrl.url as string, ext);
      }
    }
  };

  private renderFile(data: IRevealRecord, clientConfig, customErrorMessages):
  Promise<IRenderResponseType> | undefined {
    this.#client = new Client(clientConfig, {
      uuid: '',
      clientDomain: '',
    });
    this.#client.setErrorMessages(customErrorMessages ?? {});
    return new Promise((resolve, reject) => {
      try {
        getFileURLFromVaultBySkyflowIDComposable(data, this.#client, clientConfig.authToken)
          .then((resolvedResult) => {
            let url = '';
            if (resolvedResult.fields && data.column) {
              url = resolvedResult.fields[data.column];
            }
            const fileType = this.getExtension(url);
            if (fileType.includes('zip') && this.#record?.zipRender && this.#record?.zipRender === true) {
              this.#dataElememt.innerText = RENDER_LOADING_MESSAGE;
              this.unZipFiles(url).then((blobs) => {
                printLog(parameterizedString(logs.infoLogs.FILES_UNZIPPED_SUCCESSFULLY,
                  CLASS_NAME, this.#record?.skyflowID), MessageType.LOG, this.#context?.logLevel);
                if (blobs?.length > 0) {
                  this.renderUnZipFile(blobs);
                } else {
                  this.#dataElememt.innerText = ZIP_FILE_CONSTANTS.NO_FILE_MESSAGE;
                }
                resolve({
                  ...resolvedResult,
                  unZippedFilesMetadata: this.#filesList,
                });
              }).catch((zipError) => {
                printLog(parameterizedString(
                  logs.errorLogs.FAILED_TO_UNZIP_FILES, CLASS_NAME,
                  zipError,
                ), MessageType.LOG, this.#context?.logLevel);
                this.sub2({
                  error: DEFAULT_FILE_RENDER_ERROR,
                  iframeName: this.#name,
                });
                reject(
                  {
                    error: {
                      ...SKYFLOW_ERROR_CODE.FAILED_TO_UNZIP_FILES,
                    },
                  },
                );
              });
            } else {
              this.sub2({
                url,
                iframeName: this.#name,
              });
              resolve(resolvedResult);
            }
          },
          (rejectedResult) => {
            this.sub2({
              error: DEFAULT_FILE_RENDER_ERROR,
              iframeName: this.#name,
            });
            reject(rejectedResult);
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  private renderUnZipFile(blobs: { name: string; url: string, type: string, fileSize: number }[]) {
    const tag = 'div';
    this.#leftNav.innerHTML = '';
    this.#leftNav.className = `${ZIP_FILE_CONSTANTS.SKYFLOW_ELEMENT}${tag}-left-nav-${STYLE_TYPE.BASE}`;
    this.#rightPanel.className = `${ZIP_FILE_CONSTANTS.SKYFLOW_ELEMENT}${tag}-right-panel-${STYLE_TYPE.BASE}`;

    let currentFile = blobs[0];
    const origRenderZipFile = this.renderZipFile.bind(this);
    this.renderZipFile = (file) => {
      currentFile = file;
      origRenderZipFile(file);
    };

    // Setup download handler once
    this.setupFileDownloadHandler(() => currentFile);
    this.renderFileList(blobs);
    // create nav container and right panel container
    const divContainer = document.createElement('div');
    divContainer.className = `${ZIP_FILE_CONSTANTS.SKYFLOW_ELEMENT}panel-container-${STYLE_TYPE.BASE}`;
    let containerStyles = {};
    containerStyles = {
      [STYLE_TYPE?.BASE]: {
        ...ZIP_CONTAINER_STYLES[STYLE_TYPE.BASE],
      },
    };
    if (this.#record?.inputStyles && this.#record?.inputStyles[STYLE_TYPE.BASE]) {
      containerStyles = {
        [STYLE_TYPE?.BASE]: {
          ...containerStyles[STYLE_TYPE.BASE],
          ...this.#record?.inputStyles[STYLE_TYPE.BASE],
        },
      };
    }
    // Clear and append to element container
    if (this.#elementContainer?.childNodes[0] !== undefined) {
      this.#elementContainer.innerHTML = '';
      divContainer?.appendChild(this.#leftNav);
      divContainer?.appendChild(this.#rightPanel);
    } else {
      divContainer?.appendChild(this.#leftNav);
      divContainer?.appendChild(this.#rightPanel);
    }
    this.#elementContainer?.appendChild(divContainer);
    let zipNavStyles = {};
    let zipPanelStyles = {};
    if (this.#record?.inputStyles
                   && this.#record?.inputStyles[STYLE_TYPE.BASE]?.height) {
      zipNavStyles = {
        [STYLE_TYPE?.BASE]: {
          height: this.#record?.inputStyles[STYLE_TYPE.BASE]?.height,
        },
      };
      zipPanelStyles = {
        [STYLE_TYPE?.BASE]: {
          height: this.#record?.inputStyles[STYLE_TYPE.BASE]?.height,
        },
      };
    }
    getCssClassesFromJss(containerStyles, 'panel-container');

    if (this.#record?.zipNavStyles
           && this.#record?.zipNavStyles[STYLE_TYPE.BASE]) {
      zipNavStyles = {
        [STYLE_TYPE?.BASE]: {
          ...LEFT_NAV_STYLES[STYLE_TYPE.BASE],
          ...zipNavStyles[STYLE_TYPE.BASE],
          ...this.#record?.zipNavStyles[STYLE_TYPE.BASE],
        },
      };
    }
    getCssClassesFromJss(zipNavStyles, `${tag}-left-nav`);

    if (this.#record?.zipPanelStyles
            && this.#record?.zipPanelStyles[STYLE_TYPE.BASE]) {
      zipPanelStyles = {
        [STYLE_TYPE?.BASE]: {
          ...RIGHT_PANEL_STYLES[STYLE_TYPE.BASE],
          ...zipPanelStyles[STYLE_TYPE.BASE],
          ...this.#record?.zipPanelStyles[STYLE_TYPE.BASE],
        },
      };
    }
    getCssClassesFromJss(zipPanelStyles, `${tag}-right-panel`);
  }

  private renderFileList(files: { name: string; url: string, type: string, fileSize: number }[]) {
    // Create a <ul> for the file list
    const ul = document.createElement('ul');
    ul.className = `${ZIP_FILE_CONSTANTS.ZIP_FILE_LIST_CLASS}${STYLE_TYPE.BASE}`;
    getCssClassesFromJss(ZIP_UL_STYLES, 'file-list');
    files.forEach((file, index) => {
      if (index === 0) {
        this.renderZipFile(file);
      }
      const li = document.createElement('li');
      li.className = `${ZIP_FILE_CONSTANTS.NAV_ITEM_CLASSNAME}${index}-${STYLE_TYPE.BASE}`;
      li.textContent = file.name;
      li.title = file.name;
      let zipNavListItemStyles = {};
      zipNavListItemStyles = {
        [STYLE_TYPE?.BASE]: {
          ...LEFT_NAV_LIST_ITEM_STYLES[STYLE_TYPE.BASE],
        },
      };
      if (this.#record.zipNavListItemStyles
           && this.#record.zipNavListItemStyles[STYLE_TYPE.BASE]) {
        zipNavListItemStyles = {
          [STYLE_TYPE?.BASE]: {
            ...LEFT_NAV_LIST_ITEM_STYLES[STYLE_TYPE.BASE],
            ...this.#record.zipNavListItemStyles[STYLE_TYPE.BASE],
          },
        };
      }
      getCssClassesFromJss(zipNavListItemStyles, `file-item${index}`);

      li.addEventListener('click', () => {
        // Remove focus style from all items
        ul.querySelectorAll('li').forEach((el, idx) => {
          el.classList.remove(ZIP_FILE_CONSTANTS.NAV_ITEM_ACTIVE);
          el.classList.remove(`${ZIP_FILE_CONSTANTS.NAV_ITEM_CLASSNAME}${idx}-${STYLE_TYPE.FOCUS}`);
          el.classList.add(`${ZIP_FILE_CONSTANTS.NAV_ITEM_CLASSNAME}${idx}-${STYLE_TYPE.BASE}`);
        });
        // Add active class to clicked item
        li.classList.add(ZIP_FILE_CONSTANTS.NAV_ITEM_ACTIVE);
        li.classList.add(`${ZIP_FILE_CONSTANTS.NAV_ITEM_CLASSNAME}${index}-${STYLE_TYPE.FOCUS}`);
        li.classList.remove(`${ZIP_FILE_CONSTANTS.NAV_ITEM_CLASSNAME}${index}-${STYLE_TYPE.BASE}`);
        // Apply focus style if defined
        let focusStyles = {};
        focusStyles = {
          [STYLE_TYPE.FOCUS]: {
            ...LEFT_NAV_LIST_ITEM_STYLES[STYLE_TYPE.FOCUS],
          },
        };
        if (this.#record.zipNavListItemStyles
           && this.#record.zipNavListItemStyles[STYLE_TYPE.FOCUS]) {
          focusStyles = {
            [STYLE_TYPE.FOCUS]: {
              ...LEFT_NAV_LIST_ITEM_STYLES[STYLE_TYPE.FOCUS],
              ...this.#record.zipNavListItemStyles[STYLE_TYPE.FOCUS],
            },
          };
        }
        getCssClassesFromJss(focusStyles, `file-item${index}`);
        window?.parent?.postMessage({
          type: `${EventName.CHANGE}:${this.#name}`,
          data: {
            name: file.name,
            type: file.type,
            fileSize: file.fileSize,
          },
        }, this.#clientDomain);
        this.renderZipFile(file);
      });
      ul.appendChild(li);
    });
    // Clear and append the ul to the left nav
    this.#leftNav.innerHTML = '';
    this.#leftNav.appendChild(ul);
  }

  private renderZipFile(file: { name: string; url: string; type: string, fileSize: number }) {
    this.#rightPanel.innerHTML = '';

    if (!file?.url) {
      printLog(
        'Invalid file: missing URL',
        MessageType.ERROR,
        this.#context?.logLevel,
      );
      return;
    }

    if (isDangerousFileType(file)) {
      const warning = document.createElement('pre');
      warning.className = `${ZIP_FILE_CONSTANTS.SKYFLOW_ELEMENT}warning-${STYLE_TYPE.BASE}`;
      warning.textContent = ZIP_FILE_CONSTANTS.DANGEROUS_FILE_WARNING;
      getCssClassesFromJss(ZIP_RENDER_WARNING_STYLES, 'warning');
      this.#rightPanel?.appendChild(warning);
      return;
    }
    try {
      if (file?.type?.includes('pdf')) {
        const embed = document.createElement('embed');
        embed.className = `${ZIP_FILE_CONSTANTS.SKYFLOW_ELEMENT}embed-${STYLE_TYPE.BASE}`;
        embed.src = file.url;
        embed.setAttribute('type', file?.type ?? 'application/pdf');
        getCssClassesFromJss(EMBED_DEFAULT_STYLES, 'embed');
        this.#rightPanel?.appendChild(embed);
      } else if (file?.type?.includes('image')) {
        const img = document.createElement('img');
        img.src = file.url;
        img.alt = file.name;
        this.#rightPanel?.appendChild(img);
      } else if (file?.type?.includes('video')) {
        const video = document.createElement('video');
        video.src = file.url;
        video.controls = true;
        this.#rightPanel?.appendChild(video);
      } else if (file?.type?.includes('audio')) {
        const audio = document.createElement('audio');
        audio.src = file.url;
        audio.controls = true;
        this.#rightPanel?.appendChild(audio);
      } else {
        const embed = document.createElement('embed');
        embed.src = file.url;
        embed.setAttribute('type', file?.type ?? 'application/octet-stream');
        getCssClassesFromJss(EMBED_DEFAULT_STYLES, 'embed');
        this.#rightPanel?.appendChild(embed);
      }
    } catch (error) {
      printLog(
        `Error rendering file ${file.name}: ${error}`,
        MessageType.ERROR,
        this.#context?.logLevel,
      );
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private async unZipFiles(url: string) {
    this.destroy(); // Clean up previous resources if any
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch ZIP file');
    const arrayBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const fileNames = Object.keys(zip.files);

    // Filter out directories and system files
    const validFiles = fileNames.filter(
      (filename) => !zip.files[filename].dir && !this.isSystemFile(filename),
    );

    // Process all files in parallel
    const blobs = await Promise.all(
      validFiles.map(async (filename) => {
        const file = zip.files[filename];
        const blob = await file.async('blob');
        const fileBlob = new Blob([blob], { type: getType(filename) });
        const fileBlobUrl = URL.createObjectURL(fileBlob);
        this.#blobUrls.push(fileBlobUrl); // Track for cleanup
        this.#filesList.push({
          name: filename,
          fileSize: blob.size,
          type: getType(filename),
        });
        return {
          url: fileBlobUrl, name: filename, type: getType(filename), fileSize: blob.size,
        };
      }),
    );

    return blobs; // or return fileUrls, both are the same
  }

  isSystemFile = (path) => path.startsWith('__MACOSX/') || path.endsWith('.DS_Store')
  || path.endsWith('Thumbs.db');

  private setupFileDownloadHandler(getCurrentFile: () => any) {
    // Remove any existing listener to prevent duplicates
    const eventName = ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_DOWNLOAD_CURRENT_FILE + this.#name;

    const handleDownload = (event) => {
      if (event?.data?.name === eventName) {
        const currentFile = getCurrentFile();
        if (!currentFile) {
          printLog(logs.errorLogs.FAILED_DOWNLOAD_FILE, MessageType.LOG, this.#context?.logLevel);
          return;
        }
        printLog(parameterizedString(
          logs.infoLogs.FILE_DOWNLOADED,
          CLASS_NAME,
          currentFile.name,
        ), MessageType.LOG, this.#context?.logLevel);

        const a = document.createElement('a');
        a.href = currentFile.url;
        a.download = currentFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
    // Store reference to remove later if needed
    if (!this['#downloadHandler']) {
      this['#downloadHandler'] = handleDownload;
      window.addEventListener('message', handleDownload);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private getExtension(url: string) {
    try {
      const params = new URL(url).searchParams;
      const name = params.get('response-content-disposition');
      if (name) {
        const ext = getType(name);
        return ext;
      }
      return '';
    } catch {
      return '';
    }
  }

  private addFileRender(responseUrl: string, ext: string) {
    let tag = '';
    if (typeof ext === 'string' && ext.includes('image')) {
      tag = 'img';
    } else {
      tag = 'embed';
    }
    const fileElement = document.createElement(tag);
    fileElement.addEventListener('load', () => {
      bus
        .emit(
          ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#name,
          {
            height: this.#elementContainer.scrollHeight,
          }, () => {
          },
        );
    });
    fileElement.className = `SkyflowElement-${tag}-${STYLE_TYPE.BASE}`;
    if (tag === 'embed' && typeof ext === 'string') {
      fileElement.setAttribute('type', ext);
    }
    fileElement.setAttribute('src', responseUrl);
    if (Object.prototype.hasOwnProperty.call(this.#record, 'inputStyles')) {
      this.#inputStyles = {};
      if (tag === 'img') {
        this.#inputStyles[STYLE_TYPE.BASE] = {
          ...this.#record.inputStyles[STYLE_TYPE.BASE],
        };
        if (this.#record?.inputStyles
          && this.#record?.inputStyles[STYLE_TYPE.BASE]
           && this.#record?.inputStyles[STYLE_TYPE.BASE]?.overflow && this.#composableContainer) {
          this.#elementContainer.className = `SkyflowElement-div-container-${STYLE_TYPE.BASE}`;
          const divStyles = {
            [STYLE_TYPE.BASE]: {
              ...this.#record.inputStyles[STYLE_TYPE.BASE],
            },
          };
          this.#elementContainer.style.overflow = this.#record
            .inputStyles[STYLE_TYPE.BASE].overflow as string;
          this.#inputStyles[STYLE_TYPE.BASE] = {
            ...this.#inputStyles[STYLE_TYPE.BASE],
          };
          getCssClassesFromJss(divStyles, 'div-container');
        } else {
          this.#inputStyles[STYLE_TYPE.BASE] = {
            ...RENDER_ELEMENT_IMAGE_STYLES[STYLE_TYPE.BASE],
            ...this.#inputStyles[STYLE_TYPE.BASE],
          };
          getCssClassesFromJss(this.#inputStyles, tag);
        }
      } else {
        this.#inputStyles[STYLE_TYPE.BASE] = {
          ...RENDER_ELEMENT_IMAGE_STYLES[STYLE_TYPE.BASE],
          ...this.#record.inputStyles[STYLE_TYPE.BASE],
        };
        getCssClassesFromJss(this.#inputStyles, tag);
      }
    }

    if (this.#elementContainer.childNodes[0] !== undefined) {
      this.#elementContainer.innerHTML = '';
      this.#elementContainer.appendChild(fileElement);
    } else {
      this.#elementContainer.appendChild(fileElement);
    }
    if (fileElement instanceof HTMLImageElement
      && this.#record?.inputStyles
      && this.#record?.inputStyles[STYLE_TYPE.BASE]
      && this.#record?.inputStyles[STYLE_TYPE.BASE]?.overflow && this.#composableContainer) {
      fileElement.onload = () => {
        if (fileElement?.naturalWidth && fileElement?.naturalHeight) {
          fileElement.style.width = `${fileElement.naturalWidth}px`;
          fileElement.style.height = `${fileElement.naturalHeight}px`;
        }

        if (this.#record?.inputStyles[STYLE_TYPE.BASE]?.width) {
          this.#elementContainer.style.width = this.#record.inputStyles[STYLE_TYPE.BASE].width;
        }
        if (this.#record?.inputStyles[STYLE_TYPE.BASE]?.height) {
          this.#elementContainer.style.height = this.#record.inputStyles[STYLE_TYPE.BASE].height;
        }
        this.#elementContainer.style.overflow = this.#record
          .inputStyles[STYLE_TYPE.BASE].overflow as string;

        window?.postMessage({
          type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name,
        }, properties?.IFRAME_SECURE_ORIGIN);
      };
    }
  }

  private setRevealError(errorText: string) {
    this.#errorElement.innerText = errorText;
    this.#elementContainer.appendChild(this.#errorElement);
  }

  private updateRevealElementOptions() {
    window.addEventListener('message', (event) => {
      if (event?.data?.name === ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS
         + this.#name) {
        const data = event?.data;
        if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS) {
          const updatedValue = data.updatedValue as object;
          this.#record = {
            ...this.#record,
            ...updatedValue,
            ...formatRevealElementOptions(updatedValue),
          };
          this.updateElementProps();
          if (this.isRevealCalled) {
            if (this.#record?.mask) {
              const { formattedOutput } = getMaskedOutput(
                this.#revealedValue ?? '',
                this.#record?.mask?.[0],
                constructMaskTranslation(this.#record?.mask),
              );
              this.#dataElememt.innerText = formattedOutput ?? '';
            }
          }
        } else if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT) {
          if (data.updatedValue) {
            this.#record = {
              ...this.#record,
              altText: data.updatedValue,
            };
          } else {
            delete this.#record.altText;
          }

          this.updateDataView();
        } else if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN) {
          this.#record = {
            ...this.#record,
            token: data.updatedValue,
          };
          this.updateDataView();
        }
      }
    });
    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + this.#name, (data) => {
        if (data.name === this.#name) {
          if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.ALT_TEXT) {
            if (data.updatedValue) {
              this.#record = {
                ...this.#record,
                altText: data.updatedValue,
              };
            } else {
              delete this.#record.altText;
            }

            this.updateDataView();
          } else if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.TOKEN) {
            this.#record = {
              ...this.#record,
              token: data.updatedValue,
            };
            this.updateDataView();
          } else if (data.updateType === REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS) {
            const updatedValue = data.updatedValue as object;
            this.#record = {
              ...this.#record,
              ...updatedValue,
            };
            this.updateElementProps();
          }
        }
      });
  }

  private updateElementProps() {
    this.updateDataView();
    if (Object.prototype.hasOwnProperty.call(this.#record, 'label')) {
      this.#labelElement.innerText = this.#record.label;
    }
    if (Object.prototype.hasOwnProperty.call(this.#record, 'inputStyles')) {
      this.#inputStyles[STYLE_TYPE.BASE] = {
        ...this.#inputStyles,
        ...this.#record.inputStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#inputStyles, `${this.#name}-content`);
      if (this.#record.inputStyles[STYLE_TYPE.GLOBAL]) {
        const newInputGlobalStyles = {
          ...this.#inputStyles[STYLE_TYPE.GLOBAL],
          ...this.#record.inputStyles[STYLE_TYPE.GLOBAL],
        };
        generateCssWithoutClass(newInputGlobalStyles);
      }
    }
    if (Object.prototype.hasOwnProperty.call(this.#record, 'labelStyles')) {
      this.#labelStyles[STYLE_TYPE.BASE] = {
        ...this.#labelStyles,
        ...REVEAL_ELEMENT_LABEL_DEFAULT_STYLES[STYLE_TYPE.BASE],
        ...this.#record.labelStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#labelStyles, `${this.#name}-label`);

      if (this.#record.labelStyles[STYLE_TYPE.GLOBAL]) {
        const newLabelGlobalStyles = {
          ...this.#labelStyles[STYLE_TYPE.GLOBAL],
          ...this.#record.labelStyles[STYLE_TYPE.GLOBAL],
        };
        generateCssWithoutClass(newLabelGlobalStyles);
      }
    }
    if (Object.prototype.hasOwnProperty.call(this.#record, 'errorTextStyles')) {
      this.#errorTextStyles[STYLE_TYPE.BASE] = {
        ...REVEAL_ELEMENT_ERROR_TEXT_DEFAULT_STYLES[STYLE_TYPE.BASE],
        ...this.#errorTextStyles[STYLE_TYPE.BASE],
        ...this.#record.errorTextStyles[STYLE_TYPE.BASE],
      };
      getCssClassesFromJss(this.#errorTextStyles, `${this.#name}-error`);
      if (this.#record.errorTextStyles[STYLE_TYPE.GLOBAL]) {
        const newErrorTextGlobalStyles = {
          ...this.#errorTextStyles[STYLE_TYPE.GLOBAL],
          ...this.#record.errorTextStyles[STYLE_TYPE.GLOBAL],
        };
        generateCssWithoutClass(newErrorTextGlobalStyles);
      }
    }
  }

  private updateDataView() {
    if (Object.prototype.hasOwnProperty.call(this.#record, 'altText')) {
      this.#dataElememt.innerText = this.#record.altText;
    } else if (this.#revealedValue) {
      this.#dataElememt.innerText = this.#revealedValue;
    } else if (Object.prototype.hasOwnProperty.call(this.#record, 'token')) {
      this.#dataElememt.innerText = this.#record.token;
    }
  }

  // Cleanup method to prevent memory leaks
  public destroy() {
    // Remove download event listener
    if (this.#downloadHandler) {
      window.removeEventListener('message', this.#downloadHandler);
      this.#downloadHandler = undefined;
    }

    // Revoke blob URLs to free memory
    this.#blobUrls.forEach((url: string) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        printLog(
          `Failed to revoke blob URL: ${error}`,
          MessageType.ERROR,
          this.#context?.logLevel,
        );
      }
    });
    this.#blobUrls = [];

    // Clear file list
    this.#filesList = [];
  }
}

export default RevealFrame;
