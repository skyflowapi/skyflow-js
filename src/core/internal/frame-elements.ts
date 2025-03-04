// /*
// Copyright (c) 2022 Skyflow, Inc.
// */
// import bus from 'framebus';
// import injectStylesheet from 'inject-stylesheet';
// import { FrameElement } from '.';
// import {
//   ELEMENT_EVENTS_TO_IFRAME,
//   ALLOWED_MULTIPLE_FIELDS_STYLES,
//   ELEMENT_EVENTS_TO_CLIENT,
//   ERROR_TEXT_STYLES,
//   STYLE_TYPE,
// } from '../constants';
// import {
//   getValueAndItsUnit,
//   validateAndSetupGroupOptions,
// } from '../../libs/element-options';
// import { getFlexGridStyles } from '../../libs/styles';
// import { getElementName, parameterizedString, printLog } from '../../utils/logs-helper';
// import logs from '../../utils/logs';
// import { LogLevel, MessageType } from '../../utils/common';
// import getCssClassesFromJss, { generateCssWithoutClass } from '../../libs/jss-styles';
// import { ContainerType } from '../../skyflow';
// import { getContainerType, getValueFromName } from '../../utils/helpers';

// const CLASS_NAME = 'FrameElements';
// export default class FrameElements {
//   // private frameElements?: Record<string, FrameElement> = [];
//   private static group?: any;

//   private static frameElements?: any;

//   private getOrCreateIFrameFormElement: Function;

//   #domForm?: HTMLFormElement;

//   #elements: Record<string, FrameElement> = {};

//   #name?: string;

//   #metaData: any;

//   constructor(getOrCreateIFrameFormElement, metaData: any, logLevel: LogLevel) {
//     this.#name = window.name;
//     this.#metaData = metaData;
//     this.getOrCreateIFrameFormElement = getOrCreateIFrameFormElement;
//     printLog(parameterizedString(logs.infoLogs.INSIDE_FRAME_ELEMENTS_CONSTRUCOTR, CLASS_NAME),
//       MessageType.LOG, logLevel);
//     if (FrameElements.group) {
//       printLog(parameterizedString(logs.infoLogs.SETUP_IN_CONSTRUCTOR, CLASS_NAME),
//         MessageType.LOG, logLevel);
//       this.setup(); // start the process
//     }
//   }

//   // called on iframe loaded im html file
//   static start = () => {
//     const frameName = window.name;
//     const level = getValueFromName(frameName, 4) || LogLevel.ERROR;
//     const logLevel = LogLevel[level];
//     printLog(parameterizedString(logs.infoLogs.EMIT_COLLECT_ELEMENT_FRAME_READY,
//       CLASS_NAME, getElementName(frameName)), MessageType.LOG,
//     logLevel);
//     bus.emit(
//       ELEMENT_EVENTS_TO_IFRAME.FRAME_READY + getValueFromName(frameName, 3),
//       { name: frameName },
//       () => {
//         console.log('collect element frameready callled');
//         printLog(parameterizedString(logs.infoLogs.COLLECT_FRAME_READY_CB,
//           CLASS_NAME, getElementName(frameName)), MessageType.LOG,
//         logLevel);
//         const url = window.location?.href;
//         const configIndex = url.indexOf('?');
// eslint-disable-next-line max-len
//         const encodedString = configIndex !== -1 ? decodeURIComponent(url.substring(configIndex + 1)) : '';
//         const parsedRecord = encodedString ? JSON.parse(atob(encodedString)) : {};
//         console.log('encoded data', encodedString, '\n', parsedRecord);
//         FrameElements.group = parsedRecord?.record;
//         if (FrameElements.frameElements) {
//           printLog(parameterizedString(logs.infoLogs.SETUP_IN_START, CLASS_NAME),
//             MessageType.LOG, logLevel);
//           FrameElements.frameElements.setup(); // start the process
//         }
//       },
//     );
//   };

//   // called by IFrameForm
//   static init = (getOrCreateIFrameFormElement: Function, metaData) => {
//     const frameName = window.name;
//     const level = getValueFromName(frameName, 4) || LogLevel.ERROR;
//     const logLevel = LogLevel[level];
//     printLog(parameterizedString(logs.infoLogs.INSIDE__COLLECT_ELEMENT_INIT,
//       CLASS_NAME, getElementName(frameName)), MessageType.LOG,
//     logLevel);
//     FrameElements.frameElements = new FrameElements(
//       getOrCreateIFrameFormElement,
//       metaData,
//       logLevel,
//     );
//   };

//   setup = () => {
//     const frameName = window.name;
//     const level = getValueFromName(frameName, 4) || LogLevel.ERROR;
//     const logLevel = LogLevel[level];
//     printLog(parameterizedString(logs.infoLogs.CREATING_COLLECT_ELEMENT_FORM,
//       CLASS_NAME, getElementName(frameName)), MessageType.LOG,
//     logLevel);
//     this.#domForm = document.createElement('form');
//     this.#domForm.action = '#';
//     this.#domForm.onsubmit = (event) => {
//       event.preventDefault();
//     };

//     this.updateOptions(FrameElements.group);

// on bus event call update again
//     bus
//       .target(this.#metaData.clientDomain)
//       .on(ELEMENT_EVENTS_TO_IFRAME.SET_VALUE, (data) => {
//         if (data.name === this.#name) {
//           if (data.options !== undefined) {
//             // for updating options
//             this.updateOptions(data.options);
//           }
//         }
//       });
//   };

//   updateOptions = (newGroup) => {
//     FrameElements.group = validateAndSetupGroupOptions(
//       FrameElements.group,
//       newGroup,
//       false,
//     );
//     console.log('---------->update called', FrameElements.group, '=========ll', FrameElements);

//     const { group } = FrameElements;
//     const {
//       rows, styles, errorTextStyles,
//     } = group;
//     console.log('-------update opti', this.#elements, '->', group);
//     const elements = this.#elements;
//     const isComposableContainer = getContainerType(window.name) === ContainerType.COMPOSABLE;

//     group.spacing = getValueAndItsUnit(group.spacing).join('');

//     const rootDiv = document.createElement('div');
//     rootDiv.className = 'container';
//     const containerStylesByClassName = getFlexGridStyles({
//       'align-items': group.alignItems || 'stretch',
//       'justify-content': group.justifyContent || 'flex-start',
//       spacing: group.spacing,
//     });

//     injectStylesheet.injectWithAllowlist(
//       {
//         [`.${rootDiv.className}`]: containerStylesByClassName,
//       },
//       ALLOWED_MULTIPLE_FIELDS_STYLES,
//     );

//     // rows
//     let count = 0;
//     rows.forEach((row, rowIndex) => {
//       row.spacing = getValueAndItsUnit(row.spacing).join('');
//       const rowDiv = document.createElement('div');
//       rowDiv.id = `row-${rowIndex}`;

//       const intialRowStyles = {
//         'align-items': row.alignItems || 'stretch',
//         'justify-content': row.justifyContent || 'flex-start',
//         spacing: row.spacing,
//         padding: group.spacing,
//       };
//       const rowStylesByClassName = getFlexGridStyles(intialRowStyles);
//       let errorTextElement;
//       if (isComposableContainer) {
//         rowDiv.className = `${rowDiv.id} SkyflowElement-${rowDiv.id}-base`;
//         const rowStyles = {
//           [STYLE_TYPE.BASE]: {
//             // ...rowStylesByClassName,
//             // alignItems: rowStylesByClassName['align-items'],
//             // justifyContent: rowStylesByClassName['justify-content'],
//             ...(styles && styles[STYLE_TYPE.BASE]),
//           },
//         };

//         getCssClassesFromJss(rowStyles, `${rowDiv.id}`);

//         errorTextElement = document.createElement('span');
//         errorTextElement.id = `${rowDiv.id}-error`;
//         errorTextElement.className = 'SkyflowElement-row-error-base';

//         const errorStyles = {
//           [STYLE_TYPE.BASE]: {
//             ...ERROR_TEXT_STYLES,
//             ...(errorTextStyles && errorTextStyles[STYLE_TYPE.BASE]),
//           },
//         };
//         getCssClassesFromJss(errorStyles, 'row-error');
//         if (errorTextStyles && errorTextStyles[STYLE_TYPE.GLOBAL]) {
//           generateCssWithoutClass(errorTextStyles[STYLE_TYPE.GLOBAL]);
//         }
//       } else {
//         rowDiv.className = `row-${rowIndex}`;
//         injectStylesheet.injectWithAllowlist(
//           {
//             [`.${rowDiv.className}`]: rowStylesByClassName,
//           },
//           ALLOWED_MULTIPLE_FIELDS_STYLES,
//         );
//       }

//       // elements
//       const errorTextMap = {};
//       row.elements.forEach((element) => {
//         const elementDiv = document.createElement('div');
//         elementDiv.className = `element-${count}`;
//         elementDiv.id = `${rowDiv.id}:element-${count}`;
//         count += 1;
//         const elementStylesByClassName = {
//           padding: row.spacing,
//         };
//         injectStylesheet.injectWithAllowlist(
//           {
//             [`.${elementDiv.className}`]: elementStylesByClassName,
//           },
//           ALLOWED_MULTIPLE_FIELDS_STYLES,
//         );

//         // create a iframeelement
//         // create element by passing iframeformelement and options and mount by default returns
//         const iFrameFormElement = this.getOrCreateIFrameFormElement(
//           element.elementName,
//           element.label,
//           element.skyflowID,
//           element.required,
//         );
//         elements[element.elementName] = new FrameElement(
//           iFrameFormElement,
//           element,
//           elementDiv,
//         );

//         if (isComposableContainer && errorTextElement) {
//           iFrameFormElement.on(ELEMENT_EVENTS_TO_CLIENT.BLUR, (state) => {
//             errorTextMap[element.elementName] = state.error;
//             this.#updateCombinedErrorText(errorTextElement.id, errorTextMap);
//           });
//         }

//         rowDiv.append(elementDiv);
//       });
//       rootDiv.append(rowDiv);
//       if (isComposableContainer) { rootDiv.append(errorTextElement); }
//     });

//     if (this.#domForm) {
//       // for cleaning
//       this.#domForm.innerHTML = '';
//       document.body.innerHTML = '';
//       this.#domForm.append(rootDiv);
//       document.body.append(this.#domForm);
//       console.log('===========> dom form', this.#domForm);
//     }
// bus.on(ELEMENT_EVENTS_TO_CLIENT.HEIGHT + this.#name, (data, callback) => {
//   callback({ height: rootDiv.scrollHeight, name: this.#name });
// });
//   };

//   #updateCombinedErrorText = (elementId, errorMessages) => {
//     const currentErrorElememt = document.getElementById(elementId);
//     let errorText = '';
//     Object.values(errorMessages).forEach((message) => {
//       errorText += (message) && `${message}. `;
//     });
//     if (currentErrorElememt) { currentErrorElememt.innerText = errorText; }
//   };
// }
