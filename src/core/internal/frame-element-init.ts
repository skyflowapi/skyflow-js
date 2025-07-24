import injectStylesheet from 'inject-stylesheet';
import bus from 'framebus';
import { getValueAndItsUnit, validateAndSetupGroupOptions } from '../../libs/element-options';
import { getFlexGridStyles } from '../../libs/styles';
import { ContainerType } from '../../skyflow';
import { Context, Env, LogLevel } from '../../utils/common';
import { getContainerType } from '../../utils/helpers';
import {
  ALLOWED_MULTIPLE_FIELDS_STYLES,
  ELEMENT_EVENTS_TO_CLIENT, ELEMENT_EVENTS_TO_IFRAME, ERROR_TEXT_STYLES, STYLE_TYPE,
} from '../constants';
import IFrameFormElement from './iframe-form';
import getCssClassesFromJss, { generateCssWithoutClass } from '../../libs/jss-styles';
import FrameElement from '.';

export default class FrameElementInit {
  iframeFormElement: IFrameFormElement | undefined;

  clientMetaData: any;

  context: Context;

  #domForm: HTMLFormElement;

  frameElement!: FrameElement;

  private static frameEle?: any;

  containerId: string;

  group: any;

  constructor() {
    // this.createIframeElement(frameName, label, skyflowID, isRequired);
    this.context = { logLevel: LogLevel.ERROR, env: Env.PROD }; // client level
    this.containerId = '';
    this.#domForm = document.createElement('form');
    this.#domForm.action = '#';
    this.#domForm.onsubmit = (event) => {
      event.preventDefault();
    };
    this.updateGroupData();
    this.createContainerDiv(this.group);
  }

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
        );
        if (isComposableContainer && errorTextElement) {
          iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.BLUR, (state) => {
            errorTextMap[element.elementName] = state.error;
            this.#updateCombinedErrorText(errorTextElement.id, errorTextMap);
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
