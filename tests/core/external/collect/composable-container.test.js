import {
  COLLECT_FRAME_CONTROLLER, SDK_DETAILS
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
CollectElement.mockImplementation(()=>({
  isMounted : ()=>(true),
  mount: jest.fn(),
  isValidElement: ()=>(true),
  unmount:mockUnmount,
  updateElement:updateMock
}))

jest.mock('../../../../src/event-emitter');
const emitMock = jest.fn();
let emitterSpy;
EventEmitter.mockImplementation(()=>({
  on: jest.fn().mockImplementation((name,cb)=>{emitterSpy = cb}),
  _emit: jest.fn()
}));


const metaData = {
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
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
      off: jest.fn()
    });
  });
  

  it('test constructor',  () => {
    const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
    const frameReadyCb = on.mock.calls[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: COLLECT_FRAME_CONTROLLER + mockUuid
    }, cb2)
    expect(cb2).toHaveBeenCalled()
    expect(document.querySelector('iframe')).toBeTruthy();
    expect(container).toBeInstanceOf(ComposableContainer);
  });

  it('test create method',()=>{
    const container = new ComposableContainer({layout:[1]}, metaData, {}, context);
    const element = container.create(cvvElement);
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

  it('test collect',()=>{
    const div = document.createElement('div');
    div.id = 'composable'
    document.body.append(div);
    const container = new ComposableContainer({layout:[2],styles:{base:{width:'100px',}}}, metaData, {}, context);
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    emitterSpy();
    container.mount('#composable');
   
    container.collect();
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
        expect(err.error.description).toBe(parameterizedString(SKYFLOW_ERROR_CODE.COMPOSABLE_CONTAINER_NOT_MOUNTED.description, SDK_DETAILS.sdkName, SDK_DETAILS.sdkVersion));
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
    const frameReadyCb = on.mock.calls[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: COLLECT_FRAME_CONTROLLER + mockUuid
    }, cb2)
    emitterSpy();
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    setTimeout(()=>{
      container.mount('#composable');
      container.unmount();
      expect(mockUnmount).toBeCalled();
    },0)

  });
    
});