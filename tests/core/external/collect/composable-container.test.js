import {
  COLLECT_FRAME_CONTROLLER,
  ELEMENT_EVENTS_TO_IFRAME
} from '../../../../src/core/constants';
import * as iframerUtils from '../../../../src/iframe-libs/iframer';
import { LogLevel, Env, ValidationRuleType } from '../../../../src/utils/common';
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

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve());

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
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    eventEmitterSpy = jest.spyOn(EventEmitter.prototype, 'on');
    onSpy = jest.spyOn(bus, 'on');
    targetSpy.mockReturnValue({
      on,
      off: jest.fn()
    });
  });
  

  it('test constructor',  () => {
    const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
    expect(container).toBeInstanceOf(ComposableContainer);
  });

  it('test create method',()=>{
    const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
    const element = container.create(cvvElement);
    expect(element).toBeInstanceOf(ComposableElement);
  });
  it('should throw error when create method is called with no element',(done)=>{
    const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
      container.collect().catch((err) => {
        done();
        expect(err).toBeDefined();
        expect(err).toBeInstanceOf(SkyflowError);
        expect(err.error.code).toBe(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.code);
        expect(err.error.description).toBe(parameterizedString(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.description));

      });
  
  })
    it('should throw error when create method is called with no element case 2',(done)=>{
    const container = new ComposableContainer({layout:[1]}, metaData2, {}, context);
      container.collect().catch((err) => {
        done();
        expect(err).toBeDefined();
        expect(err).toBeInstanceOf(SkyflowError);
        expect(err.error.code).toBe(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.code);
        expect(err.error.description).toBe(parameterizedString(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COMPOSABLE.description));
      });
  
  })

  it('test create method with callback',()=>{
    const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
    const element = container.create(cvvElement);
    // on.mock.calls[0][1]({name : "collect_controller1234"},()=>{});
    // on.mock.calls[1][1]({name : "collect_controller"},()=>{});
    expect(element).toBeInstanceOf(ComposableElement);
  });

  it('test mount',()=>{
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);
    const container = new ComposableContainer({layout:[2]}, metaData, {}, context);
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    container.mount('#composable');
  });

  it('test collect with success and error scenarios', async () => {
    // let readyCb;
    // on.mockImplementation((name, cb) => {
    //   readyCb = cb;
    // });
  
    const div = document.createElement('div');
    div.id = 'composable';
    document.body.append(div);
  
    const container = new ComposableContainer(
      { layout: [2], styles: { base: { width: '100px' } } },
      metaData,
      {},
      context
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
  
    const collectPromiseSuccess = container.collect(options);
  
    const collectCb1 = emitSpy.mock.calls[0][2];
    collectCb1(collectResponse);
  
    const successResult = await collectPromiseSuccess;
    expect(successResult).toEqual(collectResponse);
  
    const collectPromiseError = container.collect(options);
    const collectCb2 = emitSpy.mock.calls[1][2];
    collectCb2({ error: 'Error occurred' });
  
    await expect(collectPromiseError).rejects.toEqual('Error occurred');
  });
  it('test collect when isMount is false', async () => {
    let readyCb;
    on.mockImplementation((name,cb)=>{
      readyCb = cb;
    })
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);
    const container = new ComposableContainer({layout:[2],styles:{base:{width:'100px',}}}, metaData, {}, context);
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
    const container = new ComposableContainer({layout:[2],styles:{base:{width:'100px',}}}, metaData, {}, context);
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
    const container = new ComposableContainer({layout:[2],styles:{base:{width:'100px',}}}, metaData, {}, context);
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
    const container = new ComposableContainer({layout:[2],styles:{base:{width:'100px',}}}, metaData2, {}, context);
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

    const container = new ComposableContainer({layout:[2],styles:{base:{width:'100px',}}}, metaData2, {}, context);

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
    const container = new ComposableContainer({layout:[2],styles:{base:{width:'100px',}}}, metaData, {}, context);
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
    let container = new ComposableContainer({layout:[2],styles:{base:{width:'100px'}},errorTextStyles:{base:{color:'red'}}}, metaData, {}, context);
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

    const container = new ComposableContainer({layout:[2]}, metaData, {}, context);
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
      const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
      const element = container.create(cvvElement);
      container.on();
      expect(element).toBeInstanceOf(ComposableElement);
    } catch(err) {
      expect(err).toBeDefined();
    }
  });

  it('test on method without event name will throw error',()=>{
    try {
      const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
      const element = container.create(cvvElement);
      container.on("CHANGE");
      expect(element).toBeInstanceOf(ComposableElement);
    } catch(err) {
      expect(err).toBeDefined();
    }
  });

  it('test on method passing handler as invalid type will throw error',()=>{
    try {
      const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
      const element = container.create(cvvElement);
      container.on("CHANGE","test");
      expect(element).toBeInstanceOf(ComposableElement);
    } catch(err) {
      expect(err).toBeDefined();
    }
  });

  it('test on method without error',()=>{
    const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
    const element = container.create(cvvElement);
    container.on("CHANGE",()=>{});
    expect(element).toBeInstanceOf(ComposableElement);
  });

});