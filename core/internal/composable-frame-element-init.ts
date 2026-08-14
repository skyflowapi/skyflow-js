// Shared composable reveal-frame init, iframe-only (imported solely by each
// package's own subclass, instantiated from src/index-internal.ts). The two
// variants differ only at the reveal seam — request/response mappers and the
// per-package `RevealFrame` class — so those are `protected abstract` hooks each
// package binds in its subclass (see src/internal/composable-frame-element-init),
// rather than a runtime variant registry. privacyDB's `redaction` field is
// carried unconditionally: flowDB's reveal reads only token/iframeName, so the
// extra undefined key is inert there.
import injectStylesheet from 'inject-stylesheet';
import bus from 'framebus';
import getCssClassesFromJss, { generateCssWithoutClass } from '@core/libs/jss-styles';
import {
  ALLOWED_MULTIPLE_FIELDS_STYLES,
  ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, ERROR_TEXT_STYLES, REVEAL_TYPES, STYLE_TYPE,
} from '@core/constants';
import { getFlexGridStyles } from '@core/libs/styles';
import { getValueAndItsUnit } from '@core/libs/element-options';
import IFrameFormElement from '@core/internal/iframe-form';
import FrameElement from '@core/internal';
import Client from '@core/client';
import {
  Context, ContainerType, IRevealRecordComposable, IRevealResponseType,
} from '@core/types';
import { getContainerType } from '@core/helpers';

export default abstract class RevealComposableFrameElementInit {
  iframeFormElement: IFrameFormElement | undefined;

  clientMetaData: any;

  #domForm: HTMLFormElement;

  frameElement!: FrameElement;

  containerId: string;

  group: any;

  frameList: FrameElement[] = [];

  iframeFormList: IFrameFormElement[] = [];

  #client!: Client;

  #context!: Context;

  revealFrameList: any[] = [];

  rootDiv: HTMLDivElement;

  // ---- Injected divergence (bound per package in the subclass) ----

  // Fetch composable reveal records by token id. privacyDB and flowDB map this to
  // their own api-utils/reveal implementation (`*Composable` vs `*ComposableFlowDB`).
  protected abstract fetchRecordsByTokenIdComposable(
    tokenIdRecords: IRevealRecordComposable[],
    client: Client,
    authToken: string,
    options?: Record<string, any>,
  ): Promise<IRevealResponseType>;

  // Shape a reveal response into the client-facing records payload.
  protected abstract formatRecordsForClientComposable(response: any): Record<string, any>;

  // Construct this package's composable `RevealFrame`. Kept as a hook (not a
  // top-level import here) so the DOM-heavy class stays in the iframe bundle only.
  protected abstract createRevealFrame(
    record: any,
    context: Context,
    containerId: string,
    rootDiv?: HTMLDivElement,
  ): any;

  constructor() {
    this.containerId = '';
    this.#domForm = document?.createElement('form');
    this.#domForm.action = '#';
    this.#domForm.onsubmit = (event) => {
      event?.preventDefault();
    };

    this.rootDiv = document?.createElement('div');
    this.updateGroupData();
    this.createContainerDiv(this.group);

    window?.addEventListener('message', (event) => {
      const clientDomain = this.clientMetaData?.clientDomain;
      if (!clientDomain) {
        return;
      }
      if (event?.origin === clientDomain) {
        if (event?.data?.name === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_REVEAL
          + this.containerId && event?.data?.data?.type === REVEAL_TYPES.REVEAL) {
          this.#context = event?.data?.context;
          const data = event?.data?.data ?? {};
          const elementIds = data?.elementIds ?? [];
          const revealDataInput: IRevealRecordComposable[] = [];
          this.#client = new Client(event?.data?.clientConfig ?? {}, {
            uuid: '',
            clientDomain: '',
          });
          this.#client.setErrorMessages(event?.data?.errorMessages || {});

          elementIds?.forEach((element) => {
            this.revealFrameList?.forEach((revealFrame) => {
              const data2 = revealFrame?.getData?.();
              if (data2?.name === element?.frameId) {
                if (data2 && !data2?.skyflowID) {
                  const revealRecord: IRevealRecordComposable = {
                    token: data2?.token ?? '',
                    redaction: data2?.redaction,
                    iframeName: data2?.name ?? '',
                  };
                  revealDataInput?.push(revealRecord);
                }
              }
            });
          });

          this.revealData(
            revealDataInput,
            this.containerId,
            event?.data?.clientConfig?.authToken,
            data?.options,
          )
            ?.then((revealResponse: any) => {
              if (revealResponse?.records?.length > 0) {
                const formattedRecord = this.formatRecordsForClientComposable(revealResponse);
                window?.parent?.postMessage(
                  {
                    type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.containerId,
                    data: formattedRecord,
                  },
                  this.clientMetaData?.clientDomain,
                );

                revealResponse?.records?.forEach((record: any) => {
                  this.revealFrameList?.forEach((revealFrame) => {
                    if (revealFrame?.getData()?.name === record?.frameId) {
                      revealFrame?.responseUpdate?.(record);
                    }
                  });
                });
              }

              window?.parent?.postMessage(
                {
                  type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + window?.name,
                  data: {
                    height: this.rootDiv?.scrollHeight ?? 0,
                    name: window?.name,
                  },
                },
                this.clientMetaData?.clientDomain,
              );
            })
            ?.catch((error) => {
              const formattedRecord = this.formatRecordsForClientComposable(error);
              window?.parent?.postMessage(
                {
                  type: ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY + this.containerId,
                  data: formattedRecord,
                },
                this.clientMetaData?.clientDomain,
              );

              error?.records?.forEach((record: any) => {
                this.revealFrameList?.forEach((revealFrame) => {
                  if (revealFrame?.getData()?.name === record?.frameId) {
                    revealFrame?.responseUpdate?.(record);
                  }
                });
              });

              error?.errors?.forEach((error1: any) => {
                this.revealFrameList?.forEach((revealFrame) => {
                  if (revealFrame?.getData()?.name === error1?.frameId) {
                    revealFrame?.responseUpdate?.(error1);
                  }
                });
              });

              window?.parent?.postMessage(
                {
                  type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + window?.name,
                  data: {
                    height: this.rootDiv?.scrollHeight ?? 0,
                    name: window?.name,
                  },
                },
                this.clientMetaData?.clientDomain,
              );
            });
        }
      }
    });

    // eslint-disable-next-line max-len
    // bus?.emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CONTAINER + this.containerId, {}, (data: any) => {
    //   this.#context = data?.context;
    //   if (data?.client?.config) {
    //     data.client.config = {
    //       ...data?.client?.config,
    //     };
    //   }
    //   this.#client = Client?.fromJSON?.(data?.client);
    // });
  }

  updateGroupData = () => {
    const url = window?.location?.href ?? '';
    const configIndex = url?.indexOf('?') ?? -1;
    const encodedString = configIndex !== -1 ? decodeURIComponent(url?.substring(configIndex + 1)) : '';
    const parsedRecord = encodedString ? JSON.parse(atob(encodedString)) : {};
    this.clientMetaData = parsedRecord?.clientJSON?.metaData;
    this.group = parsedRecord?.record;
    this.containerId = parsedRecord?.containerId ?? '';
    this.#context = parsedRecord?.context;
  };

  revealData(
    revealRecords: IRevealRecordComposable[],
    containerId: string,
    authToken: string,
    options?: Record<string, any>,
  ) {
    return new Promise((resolve, reject) => {
      this.fetchRecordsByTokenIdComposable(
        revealRecords,
        this.#client,
        authToken,
        options,
      )?.then(
        (resolvedResult) => {
          resolve(resolvedResult);
        },
        (rejectedResult) => {
          reject(rejectedResult);
        },
      );
    });
  }

  createContainerDiv = (newGroup) => {
    this.group = newGroup;
    const {
      rows = [],
      styles,
      errorTextStyles,
    } = this.group ?? {};
    const isComposableContainer = getContainerType(window?.name) === ContainerType?.COMPOSE_REVEAL;
    this.group.spacing = getValueAndItsUnit(this.group?.spacing)?.join('') ?? '';
    this.rootDiv = document?.createElement('div');
    this.rootDiv.className = 'container';

    const containerStylesByClassName = getFlexGridStyles({
      'align-items': this.group?.alignItems ?? 'stretch',
      'justify-content': this.group?.justifyContent ?? 'flex-start',
      spacing: this.group?.spacing,
    });

    injectStylesheet?.injectWithAllowlist(
      {
        [`.${this.rootDiv?.className}`]: containerStylesByClassName,
      },
      ALLOWED_MULTIPLE_FIELDS_STYLES,
    );

    let count = 0;
    rows?.forEach((row, rowIndex) => {
      row.spacing = getValueAndItsUnit(row?.spacing)?.join('') ?? '';
      const rowDiv = document?.createElement('div');
      rowDiv.id = `row-${rowIndex}`;
      const intialRowStyles = {
        'align-items': row?.alignItems ?? 'stretch',
        'justify-content': row?.justifyContent ?? 'flex-start',
        spacing: row?.spacing,
        padding: this.group?.spacing,
      };

      const rowStylesByClassName = getFlexGridStyles(intialRowStyles);
      let errorTextElement;

      if (isComposableContainer) {
        rowDiv.className = `${rowDiv?.id} SkyflowElement-${rowDiv?.id}-base`;
        const rowStyles = {
          [STYLE_TYPE?.BASE]: {
            ...(styles?.[STYLE_TYPE?.BASE] ?? {}),
          },
        };

        getCssClassesFromJss?.(rowStyles, `${rowDiv?.id}`);

        errorTextElement = document?.createElement('span');
        errorTextElement.id = `${rowDiv?.id}-error`;
        errorTextElement.className = 'SkyflowElement-row-error-base';

        const errorStyles = {
          [STYLE_TYPE?.BASE]: {
            ...ERROR_TEXT_STYLES,
            ...(errorTextStyles?.[STYLE_TYPE?.BASE] ?? {}),
          },
        };
        getCssClassesFromJss?.(errorStyles, 'row-error');
        if (errorTextStyles?.[STYLE_TYPE?.GLOBAL]) {
          generateCssWithoutClass?.(errorTextStyles?.[STYLE_TYPE?.GLOBAL]);
        }
      } else {
        rowDiv.className = `row-${rowIndex}`;
        injectStylesheet?.injectWithAllowlist(
          {
            [`.${rowDiv?.className}`]: rowStylesByClassName,
          },
          ALLOWED_MULTIPLE_FIELDS_STYLES,
        );
      }

      row?.elements?.forEach((element) => {
        const elementDiv = document?.createElement('div');
        elementDiv.className = `element-${count}`;
        elementDiv.id = `${rowDiv?.id}:element-${count}`;
        count += 1;

        const elementStylesByClassName = {
          padding: row?.spacing,
        };

        injectStylesheet?.injectWithAllowlist(
          {
            [`.${elementDiv?.className}`]: elementStylesByClassName,
          },
          ALLOWED_MULTIPLE_FIELDS_STYLES,
        );

        const revealFrame = this.createRevealFrame(
          element,
          this.#context,
          this.containerId,
          elementDiv,
        );
        this.revealFrameList?.push(revealFrame);
        rowDiv?.append(elementDiv);
      });

      this.rootDiv?.append(rowDiv);
      if (isComposableContainer) {
        this.rootDiv?.append(errorTextElement);
      }
    });

    if (this.#domForm) {
      this.#domForm.innerHTML = '';
      document.body.innerHTML = '';
      this.#domForm?.append(this.rootDiv);
      document?.body?.append(this.#domForm);
    }

    window?.parent?.postMessage(
      {
        type: ELEMENT_EVENTS_TO_CLIENT.MOUNTED + this.containerId,
        data: {
          name: window?.name,
        },
      },
      this.clientMetaData?.clientDomain,
    );

    bus?.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + window?.name, (data, callback) => {
      callback?.({
        height: this.rootDiv?.scrollHeight ?? 0,
        name: window?.name,
      });
    });

    window?.parent?.postMessage(
      {
        type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + window?.name,
        data: {
          height: this.rootDiv?.scrollHeight ?? 0,
          name: window?.name,
        },
      },
      this.clientMetaData?.clientDomain,
    );

    window?.addEventListener('message', (event) => {
      if (event?.data?.name === ELEMENT_EVENTS_TO_CLIENT.HEIGHT + window?.name) {
        window?.parent?.postMessage(
          {
            type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + window?.name,
            data: {
              height: this.rootDiv?.scrollHeight ?? 0,
              name: window?.name,
            },
          },
          this.clientMetaData?.clientDomain,
        );
      }
      if (event?.data?.type
         === ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK_COMPOSABLE + window?.name) {
        window?.parent?.postMessage(
          {
            type: ELEMENT_EVENTS_TO_IFRAME.HEIGHT_CALLBACK + window?.name,
            data: {
              height: this.rootDiv?.scrollHeight ?? 0,
              name: window?.name,
            },
          },
          this.clientMetaData?.clientDomain,
        );
      }
    });
  };
}
