/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  COLLECT_FRAME_CONTROLLER,
  ElementType,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CONTAINER
} from '../../../../src/core/constants';
import CollectContainer from '../../../../src/core/external/collect/collect-container';
import * as iframerUtils from '../../../../src/iframe-libs/iframer';
import SkyflowError from '../../../../src/libs/skyflow-error';
import Skyflow from '../../../../src/skyflow';
import { LogLevel, Env, ValidationRuleType } from '../../../../src/utils/common';
import SKYFLOW_ERROR_CODE from '../../../../src/utils/constants';
import logs from '../../../../src/utils/logs';

global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

const bus = require('framebus');

iframerUtils.getIframeSrc = jest.fn(() => ('https://google.com'));

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve());

const mockUuid = '1234';
jest.mock('../../../../src/libs/uuid', () => ({
  __esModule: true,
  default: jest.fn(() => (mockUuid)),
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
};
const cvvElement2 = {
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
  skyflowID: '123'
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

const FileElement = {
  table: 'pii_fields',
  column: 'primary_card.file',
  type: 'FILE_INPUT',
  skyflowID: "abc-def"
};

const cvvFileElementElement = {
  table: 'pii_fields',
  column: 'primary_card.cvv',
  styles: {
    base: {
      color: '#1d1d1d',
    },
  },
  placeholder: 'cvv',
  label: 'cvv',
  type: 'FILE_INPUT',
};


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
const collectResponse2 = {
  errors: [
    {
     error: 'error',
     code: '200'
    },
  ],
};
const records = {
  tokens: true,
  additionalFields: {
  records: [
    {
      table: 'pii_fields',
      fields: {
        "primary_card.cvv": '1234',
    },
    },
  ],
  },
  };
describe('Collect container', () => {

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

  it('contructor', async () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    await new Promise((r) => setTimeout(r, 2000));

    const frameReadyCb = on.mock.calls[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: COLLECT_FRAME_CONTROLLER + mockUuid
    }, cb2)
    expect(cb2).toHaveBeenCalled()
    expect(document.querySelector('iframe')).toBeTruthy();
  });

  it('Invalid element type', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({ ...cvvElement, type: 'abc' });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Invalid table', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        table: undefined,
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Invalid column', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        column: undefined,
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Invalid validation params, missing element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        column: undefined,
        validations: [{
          type: ValidationRuleType.ELEMENT_MATCH_RULE,
          params: {}
        }]
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Invalid validation params, invalid collect element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        column: undefined,
        validations: [{
          type: ValidationRuleType.ELEMENT_MATCH_RULE,
          params: {
            element: ''
          }
        }]
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('Invalid validation params, invalid collect element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        column: undefined,
        validations: [{
          type: ValidationRuleType.REGEX_MATCH_RULE,
          params: {
            // not passing regex
          }
        }]
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('valid validation params, regex match rule', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        column: undefined,
        validations: [{
          type: ValidationRuleType.REGEX_MATCH_RULE,
          params: {
            // pass valid regex
            regex: /^5*/
          }
        }]
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });


  it('create valid Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let cvv;
    try {
      cvv = container.create(cvvElement);
    } catch (err) { }

    expect(cvv.elementType).toBe('CVV');

    expect(container.collect).rejects.toEqual(new Error(logs.errorLogs.ELEMENTS_NOT_MOUNTED));
  });

  it('test default options for card_number', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let card_number;
    try {
      card_number = container.create(cardNumberElement);
    } catch (err) { }

    const options = card_number.getOptions()
    expect(options.enableCardIcon).toBe(true);

  });

  it('test invalid option for EXPIRATION_DATE', () => {

    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { format: 'invalid' });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.format).toBe("MM/YY");
  });

  it('test valid option for EXPIRATION_DATE', () => {
    const validFormat = 'YYYY/MM'
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { format: validFormat });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.format).toBe(validFormat);
  });

  it('test enableCardIcon option is enabled for elements', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { enableCardIcon: true });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.enableCardIcon).toBe(true);

  });

  it('test enableCopy option is enabled for elements', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { enableCopy: true });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.enableCopy).toBe(true);

  });

  it('test enableCardIcon option is disabled for elements', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { enableCardIcon: false });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.enableCardIcon).toBe(false);
  });

  it('test enableCopy option is disabled for elements', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { enableCopy: false });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.enableCopy).toBe(false);

  });

  it('test invalid option for EXPIRATION_YEAR', () => {

    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationYearElement, { format: 'invalid' });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.format).toBe("YY");
  });

  it('test valid option for EXPIRATION_YEAR', () => {
    const validFormat = 'YYYY'
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationYearElement, { format: validFormat });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.format).toBe(validFormat);
  });

  it("container collect", () => {
    let container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    container.collect();
    const collectCb = emitSpy.mock.calls[0][2];
    collectCb(collectResponse)
    collectCb({ error: 'Error occured' })
  });
  it("container create options", () => {
    let container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryDate = container.create({
      table: 'pii_fields',
      column: 'primary_card.cvv',
      styles: {
        base: {
          color: '#1d1d1d',
        },
      },
      placeholder: 'cvv',
      label: 'cvv',
      type: Skyflow.ElementType.EXPIRATION_DATE,
    }, {
      format: "MM/YY"
    });
  });
  it("container create options 2", () => {
    let container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryDate = container.create({
      table: 'pii_fields',
      column: 'primary_card.cvv',
      styles: {
        base: {
          color: '#1d1d1d',
        },
      },
      placeholder: 'cvv',
      label: 'cvv',
      type: Skyflow.ElementType.EXPIRATION_DATE,
    }, {
      format: "SS/YYY"
    });
  });

  it('create valid file Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    let file;
    try {
      file = container.create(FileElement);
    } catch (err) { }

    expect(file.elementType).toBe('FILE_INPUT');

    expect(container.collect).rejects.toEqual(new Error(logs.errorLogs.ELEMENTS_NOT_MOUNTED));
  });

  it('skyflowID undefined for file Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        ...cvvFileElementElement,
        skyflowID: undefined,
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('empty table for Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        column: 'col',
        type: 'CARD_NUMBER'
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('invalid table for Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        column: 'col',
        type: 'CARD_NUMBER',
        table: null
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('invalid table for Element case 2', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        column: 'col',
        type: 'CARD_NUMBER',
        table: []
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('missing column for Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        type: 'CARD_NUMBER',
        table: 'table'
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('invalid column for Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        type: 'CARD_NUMBER',
        table: 'table',
        column: null
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('invalid column for Element case 2', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        type: 'CARD_NUMBER',
        table: 'table',
        column: []
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('invalid column for Element case 2', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        type: 'CARD_NUMBER',
        table: 'table',
        column: 'col'
      });
      file.isValidElement().toBeTruthy();
    } catch (err) {
    }
  });
  it('skyflowID is missing for file Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        ...cvvFileElementElement,
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID empty for file Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        ...cvvFileElementElement,
        skyflowID: '',
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID null for file Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        ...cvvFileElementElement,
        skyflowID: null,
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID of invalid type for file Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        ...cvvFileElementElement,
        skyflowID: [],
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID of invalid type for file Element another case', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        ...cvvFileElementElement,
        skyflowID: {},
      });
      file.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID undefined for collect Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        skyflowID: undefined,
      });
      cvv.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID empty for collect Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        skyflowID: '',
      });
      cvv.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID null for collect Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        skyflowID: null,
      });
      cvv.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID of invalid type for collect Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        skyflowID: [],
      });
      cvv.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID null for collect Element another case', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        skyflowID: true,
      });
      cvv.isValidElement()
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("container collect options", () => {
    let container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    container.collect(options);
    const collectCb = emitSpy.mock.calls[0][2];
    collectCb(collectResponse)
    collectCb({ error: 'Error occured' })
  });
  it("container collect options error case 2", () => {
    let container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    const element1 = container.create(cvvElement2);
    const options = {
      tokens: true,
      additionalFields: {
        records: [
          {
            table: "string", //table into which record should be inserted
            fields: {
              column1: "value",
              skyflowID:''
            }
          }
        ]
      },
      upsert: [{
        table: 'table',
        column: 'column'
      }]
    }
    container.collect(options).then().catch(err => {
      expect(err).toBeDefined();
    })
  });
  it('test collect and additional fields duplicate elements',(done)=>{
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    let container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    element1.mount(div1);
    element2.mount(div2);
    try{
      container.collect(records).then((res)=>{
        done(res)
      }).catch((err)=>{
        expect(err).toBeDefined();
        done();
      });
    }catch(err){
      expect(err).toBeDefined();
      done(err)
    }
    
  });

  it("container collect options error", () => {
    let container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR, env: Env.PROD });
    const options = {
      tokens: true,
      additionalFields: {
        records: [
          {
            table: "string", //table into which record should be inserted
            fields: {
              column1: "value",
              skyflowID: 'id'
            }
          }
        ]
      },
      upsert: [{
        table: 'table',
        column: 'column'
      }]
    }
    container.collect(options);
    const emitCb = emitSpy.mock.calls[0][2];
    emitCb({error:{code:404,description:"Not Found"}});
  });
});
