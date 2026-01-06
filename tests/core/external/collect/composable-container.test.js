import {
  COLLECT_FRAME_CONTROLLER,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CLIENT,
  ElementType
} from '../../../../src/core/constants';
import * as iframerUtils from '../../../../src/iframe-libs/iframer';
import { LogLevel, Env, ValidationRuleType, ErrorType } from '../../../../src/utils/common';
import logs from '../../../../src/utils/logs';
import ComposableContainer from "../../../../src/core/external/collect/compose-collect-container";
import ComposableElement from '../../../../src/core/external/collect/compose-collect-element';
import CollectElement from '../../../../src/core/external/collect/collect-element';
import SKYFLOW_ERROR_CODE from '../../../../src/utils/constants';
import EventEmitter from '../../../../src/event-emitter';
import { parameterizedString } from '../../../../src/utils/logs-helper';
import { SKYFLOW_FRAME_CONTROLLER_READY } from '../../../../src/core/constants';
import SkyflowError from '../../../../src/libs/skyflow-error';

const bus = require('framebus');

iframerUtils.getIframeSrc = jest.fn(() => ('https://google.com'));

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve('token'));

const mockUuid = '1234';
jest.mock('../../../../src/libs/uuid', () => ({
  __esModule: true,
  default: jest.fn(() => (mockUuid)),
}));

const mockUnmount = jest.fn();
const updateMock = jest.fn();
jest.mock('../../../../src/core/external/collect/collect-element');
CollectElement.mockImplementation((_,tempElements)=>{
  tempElements.rows[0].elements.forEach((element)=>{
    element.isMounted = true;
  })
  return {
  isMounted : ()=>(true),
  mount: jest.fn(),
  isValidElement: ()=>(true),
  unmount:mockUnmount,
  updateElement:updateMock
}})

jest.mock('../../../../src/event-emitter');
const emitMock = jest.fn();
let emitterSpy;
let composableUpdateSpy;
EventEmitter.mockImplementation(()=>({
  on: jest.fn().mockImplementation((name,cb)=>{
    if (name === ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_UPDATE_OPTIONS){
      composableUpdateSpy = cb;
    }
    emitterSpy = cb
  }),
  _emit: emitMock
}));


const metaData = {
  getSkyflowBearerToken: getBearerToken,
  skyflowContainer:{
    isControllerFrameReady: true
  },
  uuid: '123',
  config: {
    vaultID: 'vault123',
    vaultURL: 'https://sb.vault.dev',
    getBearerToken,
  },
  metaData: {
    clientDomain: 'http://abc.com',
  },
  clientJSON: {
    config: {
      vaultID: 'vault123',
      vaultURL: 'https://sb.vault.dev',
      getBearerToken,
    },
  },
};
const metaData2 = {
  getSkyflowBearerToken: getBearerToken,
  skyflowContainer:{
    isControllerFrameReady: false
  },
  uuid: '123',
  config: {
    vaultID: 'vault123',
    vaultURL: 'https://sb.vault.dev',
    getBearerToken,
  },
  metaData: {
    clientDomain: 'http://abc.com',
  },
  clientJSON: {
    config: {
      vaultID: 'vault123',
      vaultURL: 'https://sb.vault.dev',
      getBearerToken,
    },
  },
};

const cvvElement = {
  table: 'pii_fields',
  column: 'primary_card.cvv',
  styles: {
    base: {
      color: '#1d1d1d',
    },
  },
  placeholder: 'cvv',
  label: 'cvv',
  type: 'CVV',
  validations:[
    {
      type: ValidationRuleType.LENGTH_MATCH_RULE,
      params: {
        min : 2, // Optional.
        max : 4, // Optional.
        error: 'Error' // Optional, default error is 'VALIDATION FAILED'.
      }
    }
  ]
};

const collectStylesOptions = {
  inputStyles: {
    cardIcon: {
      position: "absolute",
      left: "8px",
      top: "calc(50% - 10px)",
    },
  },
};

const cardNumberElement = {
  table: 'pii_fields',
  column: 'primary_card.card_number',
  type: 'CARD_NUMBER',
  ...collectStylesOptions,
};

const FileInuptElement = {
  table: 'pii_fields',
  column: 'profile_picture',
  type: ElementType.FILE_INPUT,
  skyflowID:'id1',
  ...collectStylesOptions,
}

const ExpirationDateElement = {
  table: 'pii_fields',
  column: 'primary_card.expiry',
  type: 'EXPIRATION_DATE',
};

const ExpirationYearElement = {
  table: 'pii_fields',
  column: 'primary_card.expiry',
  type: 'EXPIRATION_YEAR',
};

const context = { logLevel: LogLevel.ERROR, env: Env.PROD }
const on = jest.fn();

const collectResponse = {
  records: [
    {
      table: 'table',
      fields: {
        first_name: 'token1',
        primary_card: {
          card_number: 'token2',
          cvv: 'token3',
        },
      },
    },
  ],
};
describe('test composable container class',()=>{
  let emitSpy;
  let targetSpy;
  let onSpy;
  let eventEmitterSpy;
  let windowSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    eventEmitterSpy = jest.spyOn(EventEmitter.prototype, 'on');
    onSpy = jest.spyOn(bus, 'on');
    targetSpy.mockReturnValue({
      on,
      off: jest.fn()
    });
    windowSpy = jest.spyOn(window, "window", "get");
  });
  

  it('test constructor',  () => {
    const container = new ComposableContainer(metaData, [], context, {layout:[1]});
    expect(container).toBeInstanceOf(ComposableContainer);
  });

  it('test create method',()=>{
    const container = new ComposableContainer(metaData, [], context, {layout:[1]});
    const element = container.create(cvvElement);
    expect(element).toBeInstanceOf(ComposableElement);
  });
  it('should throw error when create method is called with no element',(done)=>{
    const container = new ComposableContainer(metaData, [], context, {layout:[1]});
      container.collect().catch((err) => {
        done();
        expect(err).toBeDefined();
        expect(err).toBeInstanceOf(SkyflowError);
        expect(err.error.code).toBe(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.code);
        expect(err.error.description).toBe(parameterizedString(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.description));

      });
  
  })
    it('should throw error when create method is called with no element case 2',(done)=>{
    const container = new ComposableContainer(metaData2, {}, context, {layout:[1]});
      container.collect().catch((err) => {
        done();
        expect(err).toBeDefined();
        expect(err).toBeInstanceOf(SkyflowError);
        expect(err.error.code).toBe(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.code);
        expect(err.error.description).toBe(parameterizedString(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.description));
      });
  
  })

  it('test create method with callback',()=>{
    const container = new ComposableContainer(metaData, [], context, {layout:[1]});
    const element = container.create(cvvElement);
    // on.mock.calls[0][1]({name : "collect_controller1234"},()=>{});
    // on.mock.calls[1][1]({name : "collect_controller"},()=>{});
    expect(element).toBeInstanceOf(ComposableElement);
  });

  it('test mount',()=>{
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);
    const container = new ComposableContainer(metaData, [], context, {layout:[2]});
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    container.mount('#composable');
  });

  it('test collect with success and error scenarios', async () => {
  
    const div = document.createElement('div');
    div.id = 'composable';
    document.body.append(div);
  
    const container = new ComposableContainer(
      metaData,
      {},
      context,
      { layout: [2], styles: { base: { width: '100px' } } }
    );
  
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
  
    // emitterSpy();
    // readyCb({ name: `${COLLECT_FRAME_CONTROLLER}1234` }, jest.fn());
  
    container.mount('#composable');
  
    const options = {
      tokens: true,
      additionalFields: {
        records: [
          {
            table: 'string',
            fields: {
              column1: 'value',
            },
          },
        ],
      },
      upsert: [
        {
          table: 'table',
          column: 'column',
        },
      ],
    };
  
    const collectPromiseSuccess =
      container.collect(options);
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + '1234', // containerId
        data: {...collectResponse}
      }
    }));

    const successResult = await collectPromiseSuccess;
    expect(successResult).toEqual(collectResponse);

    const collectPromiseError =
      container.collect(options);
    
      window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_CALL_RESPONSE + '1234', // containerId
        data: { error: "Error occured"}
      }
    }));
    await expect(collectPromiseError).rejects.toEqual("Error occured");

  });

  it('test collect with success and error scenarios', async () => {
  
    const div = document.createElement('div');
    div.id = 'composable';
    document.body.append(div);
  
    const container = new ComposableContainer(
      metaData,
      {},
      context,
      { layout: [2], styles: { base: { width: '100px' } } }
    );
  
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
  
    // emitterSpy();
    // readyCb({ name: `${COLLECT_FRAME_CONTROLLER}1234` }, jest.fn());
  
    container.mount('#composable');
  
    const options = {
      tokens: 'true',
      additionalFields: {
        records: [
          {
            table: 'string',
            fields: {
              column1: 'value',
            },
          },
        ],
      },
      upsert: [
        {
          table: 'table',
          column: 'column',
        },
      ],
    };
  
    const collectPromiseError1 =
      container.collect(options);

    await expect(collectPromiseError1).rejects.toThrow('Validation error. Invalid tokens. Specify a boolean value for tokens.');

    const options1 = {
      tokens: true,
      additionalFields: {
      },
      upsert: [
        {
          table: 'table',
          column: 'column',
        },
      ],
    };

    container.setError({[ErrorType.NOT_FOUND]: "Test error message",})
  
    const collectPromiseError =
      container.collect(options1);
  
    await expect(collectPromiseError).rejects.toBeDefined();

  });
  it('test collect when isMount is false', async () => {
    let readyCb;
    on.mockImplementation((name,cb)=>{
      readyCb = cb;
    })
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);
    const container = new ComposableContainer(metaData, [], context, {layout:[2],styles:{base:{width:'100px',}}});
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    
    container.mount('#composable');
    Object.defineProperty(container, '#isMounted', {
      value: false,
      writable: true,
    });
   
    container.collect();

    on.mockImplementation((name,cb)=>{emitterSpy = cb})
  });

  it('test collect with invalid domElement', (done)=>{
    let readyCb;
    on.mockImplementation((name,cb)=>{
      readyCb = cb;
    })
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);
    const container = new ComposableContainer(metaData, [], context, {layout:[2],styles:{base:{width:'100px',}}});
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    // readyCb({name:`${COLLECT_FRAME_CONTROLLER}1234`},jest.fn());
    try {
      container.mount(null);
      done.fail('Expected mount(null) to throw, but it did not');
    } catch (err) {
      expect(err).toBeInstanceOf(SkyflowError);
      done();
    }
  });

  it('test collect with invalid options', async ()=>{
    let readyCb;
    on.mockImplementation((name,cb)=>{
      readyCb = cb;
    })
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);
    const container = new ComposableContainer(metaData, [], context, {layout:[2],styles:{base:{width:'100px',}}});
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    // readyCb({name:`${COLLECT_FRAME_CONTROLLER}1234`},jest.fn());
    
    container.mount('#composable');

    const options = {
      tokens: 'token',
      additionalFields: {
        records: [
          {
            table: "string",
            fields: {
              column1: "value",
            }
          }
        ]
      },
      upsert: [{
        table: 'table',
        column: 'column'
      }]
    }
   
    await expect(container.collect(options)).rejects.toBeDefined();
  });

  it('test collect',()=>{
    let readyCb;
    on.mockImplementation((name,cb)=>{
      readyCb = cb;
    })
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);
    const container = new ComposableContainer(metaData2, {}, context, {layout:[2],styles:{base:{width:'100px',}}});
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    // readyCb({name:`${COLLECT_FRAME_CONTROLLER}1234`},jest.fn());
    
    container.mount('#composable');
   
    container.collect();

    on.mockImplementation((name,cb)=>{emitterSpy = cb})
  });

  it('test updateListeners function ',()=>{
    let readyCb;
    on.mockImplementation((name,cb)=>{
      readyCb = cb;
    })
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);

    const container = new ComposableContainer(metaData2, {}, context, {layout:[2],styles:{base:{width:'100px',}}});

    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    composableUpdateSpy({elementName: 'element:CARD_NUMBER:MTIzNA=='});

    // readyCb({name:`${COLLECT_FRAME_CONTROLLER}1234`},jest.fn());

    container.mount('#composable');

    container.collect();

    on.mockImplementation((name,cb)=>{emitterSpy = cb})
  });

  it('test collect without mounting the container',(done)=>{
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);
    const container = new ComposableContainer(metaData, [], context, {layout:[2],styles:{base:{width:'100px',}}});
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    try{
      container.collect().then((res)=>{
        done(res)
      }).catch((err)=>{
        expect(err.error.description).toBe(parameterizedString(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED.description));
        done();
      });
    }catch(err){
      done(err)
    }
    
  });

  it("test container collect", () => {
    const containerOptions = {layout:[2],styles:{base:{width:'100px'}},errorTextStyles:{base:{color:'red'}}};
    let container = new ComposableContainer(metaData, [], context, containerOptions);
    // const div = document.createElement('div');
    // div.id = 'composable'
    // document.body.append(div);
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    container.mount('#composable');
    
    const options = {
      tokens: true,
      additionalFields: {
        records: [
          {
            table: "string", //table into which record should be inserted
            fields: {
              column1: "value",
            }
          }
        ]
      },
      upsert: [{
        table: 'table',
        column: 'column'
      }]
    }
    emitterSpy();
    setTimeout(()=>{
      container.collect(options);
      const collectCb = emitSpy.mock.calls[0][2];
      collectCb(collectResponse);
      collectCb({ error: 'Error occured' })
    },200);

  });

  it("test container unmount",()=>{
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);

    const container = new ComposableContainer(metaData, [], context, {layout:[2]});
    // const frameReadyCb = on.mock.calls[0][1];
    // const cb2 = jest.fn();
    // frameReadyCb({
    //   name: SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
    // }, cb2)
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    setTimeout(()=>{
      container.mount('#composable');
      container.unmount();
      expect(mockUnmount).toBeCalled();
    },0)

  });
    
  it('test on method without parameters will throw error',()=>{
    try{
      const container = new ComposableContainer(metaData, [], context, {layout:[1]},);
      const element = container.create(cvvElement);
      container.on();
      expect(element).toBeInstanceOf(ComposableElement);
    } catch(err) {
      expect(err).toBeDefined();
    }
  });

  it('test on method without event name will throw error',()=>{
    try {
      const container = new ComposableContainer(metaData, [], context, {layout:[1]});
      const element = container.create(cvvElement);
      container.on("CHANGE");
      expect(element).toBeInstanceOf(ComposableElement);
    } catch(err) {
      expect(err).toBeDefined();
    }
  });

  it('test on method passing handler as invalid type will throw error',()=>{
    try {
      const container = new ComposableContainer(metaData, [], context, {layout:[1]});
      const element = container.create(cvvElement);
      container.on("CHANGE","test");
      expect(element).toBeInstanceOf(ComposableElement);
    } catch(err) {
      expect(err).toBeDefined();
    }
  });

  it('test on method without error',()=>{
    const container = new ComposableContainer(metaData, [], context, {layout:[1]});
    const element = container.create(cvvElement);
    container.on("CHANGE",()=>{});
    expect(element).toBeInstanceOf(ComposableElement);
  });
  it('test upload FILES with success and error scenarios', async () => {
    const div = document.createElement('div');
    div.id = 'composable';
    document.body.append(div);
  
    const container = new ComposableContainer(
      metaData,
      {},
      context,
      { layout: [1], styles: { base: { width: '100px' } } }
    );
  
    const element1 = container.create(FileInuptElement);  
    container.mount('#composable');
    const options = {};
    container.setError({[ErrorType.NOT_FOUND]: "Test error message",})
    const collectPromiseSuccess = container.uploadFiles(options);

    // Wait for the bearer token promise to resolve and event listener to be set up
    await Promise.resolve('token');

    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + '1234', // containerId
        data: { fileUploadResponse: [{ skyflow_id: 'id1' }] }
      }
    }));

    const successResult = await collectPromiseSuccess;
    expect(successResult).toEqual({ fileUploadResponse: [{ skyflow_id: 'id1' }] });

    // Test error scenario
    const collectPromiseError = container.uploadFiles(options);
    
    await Promise.resolve('token');
    
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + '1234', // containerId
        data: { error: "Error occured"}
      }
    }));
    
    await expect(collectPromiseError).rejects.toEqual("Error occured");

    // Test error scenario case 2 - no fileUploadResponse and no error
    const collectPromiseError2 = container.uploadFiles(options);
    
    await Promise.resolve('token');
    
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: ELEMENT_EVENTS_TO_IFRAME.COMPOSABLE_FILE_CALL_RESPONSE + '1234', // containerId
        data: { errors: "Error occured"}
      }
    }));
    
    await expect(collectPromiseError2).rejects.toEqual({ errors: "Error occured"});
  });
  it('test upload FILES when bearer token fails', async () => {
  const getBearerTokenFail = jest.fn().mockRejectedValue({ error: 'token generation failed' });
  const metaDataFail = {
    ...metaData,
    getSkyflowBearerToken: getBearerTokenFail,
  };

  const div = document.createElement('div');
  div.id = 'composable2';
  document.body.append(div);

  const container = new ComposableContainer(metaDataFail, {}, context, { layout: [1] });
  const element1 = container.create(FileInuptElement);
  container.mount('#composable2');

  await expect(container.uploadFiles({})).rejects.toEqual({ error: 'token generation failed' });
  });

  it('test mount with shadow DOM HTMLElement', () => {
    const shadowHost = document.createElement('div');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    const shadowDiv = document.createElement('div');
    shadowDiv.id = 'shadow-composable';
    shadowRoot.appendChild(shadowDiv);
    document.body.appendChild(shadowHost);

    // Mock getRootNode to return shadowRoot
    shadowDiv.getRootNode = jest.fn(() => shadowRoot);

    const container = new ComposableContainer(metaData, [], context, { layout: [2] });
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);

    container.mount(shadowDiv);

    // Verify eventEmitter.on was called with HEIGHT event
    const onCalls = EventEmitter.mock.results[EventEmitter.mock.results.length - 1].value.on.mock.calls;
    const heightCall = onCalls.find(call => call[0] === ELEMENT_EVENTS_TO_CLIENT.HEIGHT);
    expect(heightCall).toBeDefined();

    // Test the HEIGHT event callback
    if (heightCall) {
      const heightCallback = heightCall[1];
      heightCallback({ iframeName: 'test-iframe' });
    }
  });

  it('test mount with shadow DOM using string selector', () => {
    const shadowHost = document.createElement('div');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    const shadowDiv = document.createElement('div');
    shadowDiv.id = 'shadow-composable-string';
    shadowRoot.appendChild(shadowDiv);
    document.body.appendChild(shadowHost);

    // Mock getElementById to return our shadow element
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn((id) => {
      if (id === 'shadow-composable-string') {
        return shadowDiv;
      }
      return originalGetElementById.call(document, id);
    });

    // Mock getRootNode to return shadowRoot
    shadowDiv.getRootNode = jest.fn(() => shadowRoot);

    const container = new ComposableContainer(metaData, [], context, { layout: [2] });
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);

    container.mount('shadow-composable-string');

    // Verify eventEmitter.on was called with HEIGHT event
    const onCalls = EventEmitter.mock.results[EventEmitter.mock.results.length - 1].value.on.mock.calls;
    const heightCall = onCalls.find(call => call[0] === ELEMENT_EVENTS_TO_CLIENT.HEIGHT);
    expect(heightCall).toBeDefined();

    // Restore original getElementById
    document.getElementById = originalGetElementById;
  });

  it('test mount with regular DOM (no shadow root)', () => {
    const div = document.createElement('div');
    div.id = 'regular-composable';
    document.body.appendChild(div);

    // Mock getRootNode to return document (not a ShadowRoot)
    div.getRootNode = jest.fn(() => document);

    const container = new ComposableContainer(metaData, [], context, { layout: [2] });
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);

    container.mount(div);

    // Verify that HEIGHT event listener is NOT set up for regular DOM
    const onCalls = EventEmitter.mock.results[EventEmitter.mock.results.length - 1].value.on.mock.calls;
    const heightCall = onCalls.find(call => call[0] === ELEMENT_EVENTS_TO_CLIENT.HEIGHT);
    
    // For regular DOM, we don't expect the HEIGHT event to be registered
    // (it's only registered when shadowRoot is not null)
    expect(heightCall).toBeUndefined();
  });

  it('test mount with shadow DOM height event emission', () => {
    const shadowHost = document.createElement('div');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    const shadowDiv = document.createElement('div');
    shadowDiv.id = 'shadow-height-test';
    
    // Create iframe element in shadow root
    const iframe = document.createElement('iframe');
    iframe.id = 'element:group:W29iamVjdCBPYmplY3Rd:1234:ERROR:aHR0cDovL2FiYy5jb20=';
    shadowRoot.appendChild(shadowDiv);
    shadowRoot.appendChild(iframe);
    shadowRoot.getElementById = jest.fn((id) => {
      if (id === iframe.id) return iframe;
      return null;
    });
    
    document.body.appendChild(shadowHost);

    shadowDiv.getRootNode = jest.fn(() => shadowRoot);

    const container = new ComposableContainer(metaData, [], context, { layout: [2] });
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);

    // Mock iframe contentWindow and postMessage
    const mockPostMessage = jest.fn();
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage: mockPostMessage },
      writable: true,
    });

    container.mount(shadowDiv);
  });
});