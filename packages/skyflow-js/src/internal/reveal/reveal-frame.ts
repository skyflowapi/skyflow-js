/*
Copyright (c) 2022 Skyflow, Inc.
*/
// privacyDB reveal-frame: the shared @core reveal-frame base plus the file-render
// feature. The base's two protected hooks (registerRenderFileResponseListener /
// handleRevealCallRequest) are overridden here to wire the RENDER_FILE bus +
// message paths, so this DOM/file-upload-adjacent surface stays out of flowDB's
// token-only bundle.
import bus from 'framebus';
import getCssClassesFromJss from '@core/libs/jss-styles';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  STYLE_TYPE,
  RENDER_ELEMENT_IMAGE_STYLES,
  DEFAULT_FILE_RENDER_ERROR,
  ELEMENT_EVENTS_TO_CLIENT,
  REVEAL_TYPES,
} from '@core/constants';
import properties from '@core/properties';
import Client from '@core/client';
import CoreRevealFrame from '@core/internal/reveal/reveal-frame';
import {
  IRenderResponseType, IRevealRecord,
} from '../../utils/common';
import { formatForRenderClient, getFileURLFromVaultBySkyflowIDComposable } from '../../api-utils/reveal';

const { getType } = require('mime');

class RevealFrame extends CoreRevealFrame {
  #client!: Client;

  protected registerRenderFileResponseListener(): void {
    const sub2 = (responseUrl) => {
      if (responseUrl.iframeName === this.name) {
        if (Object.prototype.hasOwnProperty.call(responseUrl, 'error') && responseUrl.error === DEFAULT_FILE_RENDER_ERROR) {
          this.setRevealError(DEFAULT_FILE_RENDER_ERROR);
          if (Object.prototype.hasOwnProperty.call(this.record, 'altText')) {
            this.dataElememt.innerText = this.record.altText;
          }
          bus
            .emit(
              ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.name,
              {
                height: this.elementContainer.scrollHeight,
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
        ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_RESPONSE_READY + this.name,
        sub2,
      );
  }

  protected handleRevealCallRequest(event: MessageEvent): void {
    if (event?.origin === this.clientDomain) {
      if (event?.data?.name === ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS + this.name) {
        if (event?.data?.data?.iframeName === this.name
        && event?.data?.data?.type === REVEAL_TYPES.RENDER_FILE) {
          this.renderFile(this.record, event?.data?.clientConfig,
            event?.data?.errorMessages)?.then((resolvedResult) => {
            const result = formatForRenderClient(
              resolvedResult as IRenderResponseType,
              this.record?.column,
            );
            window?.parent?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + this.name,
              data: {
                type: REVEAL_TYPES.RENDER_FILE,
                result,
              },
            }, this.clientDomain);

            window?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name,
            }, properties?.IFRAME_SECURE_ORIGIN);
          })?.catch((error) => {
            window?.parent?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_RESPONSE + this.name,
              data: {
                type: REVEAL_TYPES.RENDER_FILE,
                result: {
                  errors: error,
                },
              },
            }, this.clientDomain);

            window?.postMessage({
              type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name,
            }, properties?.IFRAME_SECURE_ORIGIN);
          });
        }
      }
    }
  }

  private sub2 = (responseUrl: { iframeName?: string; error?: string; url?: string }) => {
    if (responseUrl.iframeName === this.name) {
      if (Object.prototype.hasOwnProperty.call(responseUrl, 'error') && responseUrl.error === DEFAULT_FILE_RENDER_ERROR) {
        this.setRevealError(DEFAULT_FILE_RENDER_ERROR);
        if (Object.prototype.hasOwnProperty.call(this.record, 'altText')) {
          this.dataElememt.innerText = this.record.altText;
        }
        bus
          .emit(
            ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.name,
            {
              height: this.elementContainer.scrollHeight,
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
            this.sub2({
              url,
              iframeName: this.name,
            });
            resolve(resolvedResult);
          },
          (rejectedResult) => {
            this.sub2({
              error: DEFAULT_FILE_RENDER_ERROR,
              iframeName: this.name,
            });
            reject(rejectedResult);
          });
      } catch (err) {
        reject(err);
      }
    });
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
          ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.name,
          {
            height: this.elementContainer.scrollHeight,
          }, () => {
          },
        );
    });
    fileElement.className = `SkyflowElement-${tag}-${STYLE_TYPE.BASE}`;
    if (tag === 'embed' && typeof ext === 'string') {
      fileElement.setAttribute('type', ext);
    }
    fileElement.setAttribute('src', responseUrl);
    if (Object.prototype.hasOwnProperty.call(this.record, 'inputStyles')) {
      this.inputStyles = {};
      if (tag === 'img') {
        this.inputStyles[STYLE_TYPE.BASE] = {
          ...this.record.inputStyles[STYLE_TYPE.BASE],
        };
        if (this.record?.inputStyles
          && this.record?.inputStyles[STYLE_TYPE.BASE]
           && this.record?.inputStyles[STYLE_TYPE.BASE]?.overflow && this.composableContainer) {
          this.elementContainer.className = `SkyflowElement-div-container-${STYLE_TYPE.BASE}`;
          const divStyles = {
            [STYLE_TYPE.BASE]: {
              ...this.record.inputStyles[STYLE_TYPE.BASE],
            },
          };
          this.elementContainer.style.overflow = this.record
            .inputStyles[STYLE_TYPE.BASE].overflow as string;
          this.inputStyles[STYLE_TYPE.BASE] = {
            ...this.inputStyles[STYLE_TYPE.BASE],
          };
          getCssClassesFromJss(divStyles, 'div-container');
        } else {
          this.inputStyles[STYLE_TYPE.BASE] = {
            ...RENDER_ELEMENT_IMAGE_STYLES[STYLE_TYPE.BASE],
            ...this.inputStyles[STYLE_TYPE.BASE],
          };
          getCssClassesFromJss(this.inputStyles, tag);
        }
      } else {
        this.inputStyles[STYLE_TYPE.BASE] = {
          ...RENDER_ELEMENT_IMAGE_STYLES[STYLE_TYPE.BASE],
          ...this.record.inputStyles[STYLE_TYPE.BASE],
        };
        getCssClassesFromJss(this.inputStyles, tag);
      }
    }

    if (this.elementContainer.childNodes[0] !== undefined) {
      this.elementContainer.innerHTML = '';
      this.elementContainer.appendChild(fileElement);
    } else {
      this.elementContainer.appendChild(fileElement);
    }
    if (fileElement instanceof HTMLImageElement
      && this.record?.inputStyles
      && this.record?.inputStyles[STYLE_TYPE.BASE]
      && this.record?.inputStyles[STYLE_TYPE.BASE]?.overflow && this.composableContainer) {
      fileElement.onload = () => {
        if (fileElement?.naturalWidth && fileElement?.naturalHeight) {
          fileElement.style.width = `${fileElement.naturalWidth}px`;
          fileElement.style.height = `${fileElement.naturalHeight}px`;
        }

        if (this.record?.inputStyles[STYLE_TYPE.BASE]?.width) {
          this.elementContainer.style.width = this.record.inputStyles[STYLE_TYPE.BASE].width;
        }
        if (this.record?.inputStyles[STYLE_TYPE.BASE]?.height) {
          this.elementContainer.style.height = this.record.inputStyles[STYLE_TYPE.BASE].height;
        }
        this.elementContainer.style.overflow = this.record
          .inputStyles[STYLE_TYPE.BASE].overflow as string;

        window?.postMessage({
          type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name,
        }, properties?.IFRAME_SECURE_ORIGIN);
      };
    }
  }
}

export default RevealFrame;
