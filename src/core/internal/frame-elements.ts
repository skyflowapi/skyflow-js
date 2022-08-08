/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import injectStylesheet from 'inject-stylesheet';
import { FrameElement } from '.';
import {
  ELEMENT_EVENTS_TO_IFRAME,
  ALLOWED_MULTIPLE_FIELDS_STYLES,
} from '../constants';
import {
  getValueAndItsUnit,
  validateAndSetupGroupOptions,
} from '../../libs/element-options';
import { getFlexGridStyles } from '../../libs/styles';
import { getElementName, parameterizedString, printLog } from '../../utils/logs-helper';
import logs from '../../utils/logs';
import { LogLevel, MessageType } from '../../utils/common';

const CLASS_NAME = 'FrameElements';
export default class FrameElements {
  // private frameElements?: Record<string, FrameElement> = [];
  private static group?: any;

  private static frameElements?: any;

  private getOrCreateIFrameFormElement: Function;

  #domForm?: HTMLFormElement;

  #elements: Record<string, FrameElement> = {};

  #name?: string;

  #metaData: any;

  constructor(getOrCreateIFrameFormElement, metaData: any, logLevel: LogLevel) {
    this.#name = window.name;
    this.#metaData = metaData;
    this.getOrCreateIFrameFormElement = getOrCreateIFrameFormElement;
    printLog(parameterizedString(logs.infoLogs.INSIDE_FRAME_ELEMENTS_CONSTRUCOTR, CLASS_NAME),
      MessageType.LOG, logLevel);
    if (FrameElements.group) {
      printLog(parameterizedString(logs.infoLogs.SETUP_IN_CONSTRUCTOR, CLASS_NAME),
        MessageType.LOG, logLevel);
      this.setup(); // start the process
    }
  }

  // called on iframe loaded im html file
  static start = () => {
    const names = window.name.split(':');
    const logLevel = LogLevel[names[names.length - 1]];
    printLog(parameterizedString(logs.infoLogs.EMIT_COLLECT_ELEMENT_FRAME_READY,
      CLASS_NAME, getElementName(window.name)), MessageType.LOG,
    logLevel);
    bus.emit(
      ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + names[3],
      { name: window.name },
      (group: any) => {
        printLog(parameterizedString(logs.infoLogs.COLLECT_FRAME_READY_CB,
          CLASS_NAME, getElementName(window.name)), MessageType.LOG,
        logLevel);
        FrameElements.group = group;
        if (FrameElements.frameElements) {
          printLog(parameterizedString(logs.infoLogs.SETUP_IN_START, CLASS_NAME),
            MessageType.LOG, logLevel);
          FrameElements.frameElements.setup(); // start the process
        }
      },
    );
  };

  // called by IFrameForm
  static init = (getOrCreateIFrameFormElement: Function, metaData) => {
    const names = window.name.split(':');
    const logLevel = LogLevel[names[names.length - 1]];
    printLog(parameterizedString(logs.infoLogs.INSIDE__COLLECT_ELEMENT_INIT,
      CLASS_NAME, getElementName(window.name)), MessageType.LOG,
    logLevel);
    FrameElements.frameElements = new FrameElements(
      getOrCreateIFrameFormElement,
      metaData,
      logLevel,
    );
  };

  setup = () => {
    const names = window.name.split(':');
    const logLevel = LogLevel[names[names.length - 1]];
    printLog(parameterizedString(logs.infoLogs.CREATING_COLLECT_ELEMENT_FORM,
      CLASS_NAME, getElementName(window.name)), MessageType.LOG,
    logLevel);
    this.#domForm = document.createElement('form');
    this.#domForm.action = '#';
    this.#domForm.onsubmit = (event) => {
      event.preventDefault();
    };

    this.updateOptions(FrameElements.group);

    // on bus event call update again
    bus
      .target(this.#metaData.clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
        if (data.name === this.#name) {
          if (data.options !== undefined) {
            // for updating options
            this.updateOptions(data.options);
          }
        }
      });
  };

  updateOptions = (newGroup) => {
    FrameElements.group = validateAndSetupGroupOptions(
      FrameElements.group,
      newGroup,
      false,
    );
    const { group } = FrameElements;
    const { rows } = group;
    const elements = this.#elements;

    group.spacing = getValueAndItsUnit(group.spacing).join('');

    const rootDiv = document.createElement('div');
    rootDiv.className = 'container';
    const containerStylesByClassName = getFlexGridStyles({
      'align-items': group.alignItems || 'stretch',
      'justify-content': group.justifyContent || 'flex-start',
      spacing: group.spacing,
    });

    injectStylesheet.injectWithAllowlist(
      {
        [`.${rootDiv.className}`]: containerStylesByClassName,
      },
      ALLOWED_MULTIPLE_FIELDS_STYLES,
    );

    // rows
    let count = 0;
    rows.forEach((row, rowIndex) => {
      row.spacing = getValueAndItsUnit(row.spacing).join('');
      const rowDiv = document.createElement('div');
      rowDiv.className = `row-${rowIndex}`;
      const rowStylesByClassName = getFlexGridStyles({
        'align-items': row.alignItems || 'stretch',
        'justify-content': row.justifyContent || 'flex-start',
        spacing: row.spacing,
        padding: group.spacing,
      });
      injectStylesheet.injectWithAllowlist(
        {
          [`.${rowDiv.className}`]: rowStylesByClassName,
        },
        ALLOWED_MULTIPLE_FIELDS_STYLES,
      );

      // elements
      row.elements.forEach((element) => {
        const elementDiv = document.createElement('div');
        elementDiv.className = `element-${count}`;
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
        const iFrameFormElement = this.getOrCreateIFrameFormElement(
          element.elementName,
          element.label,
          element.skyflowID,
        );
        elements[element.elementName] = new FrameElement(
          iFrameFormElement,
          element,
          elementDiv,
        );

        rowDiv.append(elementDiv);
      });
      rootDiv.append(rowDiv);
    });

    if (this.#domForm) {
      // for cleaning
      this.#domForm.innerHTML = '';
      document.body.innerHTML = '';
      this.#domForm.append(rootDiv);
      document.body.append(this.#domForm);
    }
  };
}
