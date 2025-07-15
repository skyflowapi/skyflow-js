import injectStylesheet from 'inject-stylesheet';
import bus from 'framebus';
import { getValueAndItsUnit } from '../../libs/element-options';
import { getFlexGridStyles } from '../../libs/styles';
import { ContainerType } from '../../skyflow';
import {
  Context, Env, LogLevel,
} from '../../utils/common';
import {
  getContainerType,
} from '../../utils/helpers';
import {
  ALLOWED_MULTIPLE_FIELDS_STYLES,
  ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, ERROR_TEXT_STYLES, STYLE_TYPE,
} from '../constants';
import IFrameFormElement from './iframe-form';
import getCssClassesFromJss, { generateCssWithoutClass } from '../../libs/jss-styles';
import FrameElement from '.';
import Client from '../../client';
import RevealFrame from './reveal/reveal-frame';

export default class RevealComposableFrameElementInit {
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

  revealFrameList: any[] = [];

  constructor() {
    console.log('Initializing RevealComposableFrameElementInit');
    // this.createIframeElement(frameName, label, skyflowID, isRequired);
    this.context = { logLevel: LogLevel.INFO, env: Env.DEV }; // client level
    this.containerId = '';
    this.#domForm = document.createElement('form');
    this.#domForm.action = '#';
    this.#domForm.onsubmit = (event) => {
      event.preventDefault();
    };
    try {
      this.updateGroupData();
      this.createContainerDiv(this.group);
    } catch (e: any) {
      console.error('Error in RevealComposableFrameElementInit:', e);
    }

    bus
      // .target(this.clientMetaData.clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CONTAINER + this.containerId, {}, (data: any) => {
        this.#context = data.context;
        data.client.config = {
          ...data.client.config,
        };
        this.#client = Client.fromJSON(data.client) as any;
      });
  }

  updateGroupData = () => {
    console.log('Updating group data', window.name);

    const url = window.location?.href;
    const configIndex = url.indexOf('?');
    const encodedString = configIndex !== -1 ? decodeURIComponent(url.substring(configIndex + 1)) : '';
    console.log('encodedString', encodedString);
    const parsedRecord = encodedString ? JSON.parse(atob(encodedString)) : {};
    console.log('Parsed Record', parsedRecord);
    this.clientMetaData = parsedRecord.clientJSON.metaData;
    this.group = parsedRecord.record;
    console.log('Group data', parsedRecord.record);
    this.containerId = parsedRecord.containerId;
    this.context = parsedRecord.context;
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
    console.log('Starting RevealComposableFrameElementInit');
    RevealComposableFrameElementInit.frameEle = new RevealComposableFrameElementInit();
  };

  createContainerDiv = (newGroup) => {
    console.log('New Group Data', newGroup);
    // this.group = validateAndSetupGroupOptions(
    //   this.group,
    //   newGroup,
    //   false,
    // );
    this.group = newGroup;
    const {
      rows, styles, errorTextStyles,
    } = this.group;
    console.log('Rows', rows.length);
    console.log('Rows', rows);
    console.log('Styles', styles);
    console.log('Error Text Styles', errorTextStyles);
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
      console.log('inside Row', row);
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
        // const iFrameFormElement = this.createIframeElement(
        //   element.elementName,
        //   element.label,
        //   element.skyflowID,
        //   element.required,
        // );
        // this.frameElement = new FrameElement(
        //   iFrameFormElement,
        //   element,
        //   elementDiv,
        //   this.clientMetaData.clientDomain,
        // );
        // this.frameList.push(this.frameElement);
        const revealFrame = new RevealFrame(element, this.#context,
          this.containerId, elementDiv);
        this.revealFrameList.push(revealFrame);
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
