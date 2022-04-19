import {
  COLLECT_FRAME_CONTROLLER,
  ELEMENT_EVENTS_TO_IFRAME,
} from '../../../../src/core/constants';
import CollectContainer from '../../../../src/core/external/collect/CollectContainer';
import * as iframerUtils from '../../../../src/iframe-libs/iframer';
import Skyflow from '../../../../src/Skyflow';
import { LogLevel,Env, ValidationRuleType } from '../../../../src/utils/common';
import logs from '../../../../src/utils/logs';
const bus = require('framebus');

iframerUtils.getIframeSrc = jest.fn(() => ('https://google.com'));

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve());

const mockUuid = '1234'; 
jest.mock('../../../../src/libs/uuid',()=>({
  __esModule: true,
  default:jest.fn(()=>(mockUuid)),
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

const cardNumberElement = {
  table: 'pii_fields',
  column: 'primary_card.card_number',
  type: 'CARD_NUMBER',
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
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    await new Promise((r) => setTimeout(r, 2000));

    const frameReadyCb = on.mock.calls[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: COLLECT_FRAME_CONTROLLER+mockUuid
    }, cb2)
    expect(cb2).toHaveBeenCalled()
    expect(document.querySelector('iframe')).toBeTruthy();
  });

  it('Invalid element type', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    try {
      const cvv = container.create({ ...cvvElement, type: 'abc' });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Invalid table', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
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
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
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
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
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
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
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
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
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
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        column: undefined,
        validations: [{
          type: ValidationRuleType.REGEX_MATCH_RULE,
          params: {
           // pass valid regex
           regex:/^5*/
          }
        }]
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });


  it('create valid Element', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    let cvv;
    try {
      cvv = container.create(cvvElement);
    } catch (err) {}

    expect(cvv.elementType).toBe('CVV');

    expect(container.collect).rejects.toEqual(new Error(logs.errorLogs.ELEMENTS_NOT_MOUNTED));
  });

  it('test default options for card_number', () => {
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    let card_number;
    try {
      card_number = container.create(cardNumberElement);
    } catch (err) {}

    const options = card_number.getOptions()
    expect(options.enableCardIcon).toBe(true);

  });

  it('test invalid option for EXPIRATION_DATE', () => {
    
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, {format: 'invalid'});
    } catch (err) {}

    const options = expiryElement.getOptions()
    expect(options.format).toBe("MM/YY");
  });

  it('test valid option for EXPIRATION_DATE', () => {
    const validFormat = 'YYYY/MM'
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, {format: validFormat});
    } catch (err) {}

    const options = expiryElement.getOptions()
    expect(options.format).toBe(validFormat);
  });

  it('test invalid option for EXPIRATION_YEAR', () => {
    
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationYearElement, {format: 'invalid'});
    } catch (err) {}

    const options = expiryElement.getOptions()
    expect(options.format).toBe("YY");
  });

  it('test valid option for EXPIRATION_YEAR', () => {
    const validFormat = 'YYYY'
    const container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationYearElement, {format: validFormat});
    } catch (err) {}

    const options = expiryElement.getOptions()
    expect(options.format).toBe(validFormat);
  });

  it("container collect", () => {
    let container = new CollectContainer({}, metaData,  {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    container.collect();
    const collectCb = emitSpy.mock.calls[0][2];
    collectCb(collectResponse)
    collectCb({error: 'Error occured'})
  });

  it("container create options",()=>{
    let container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    let expiryDate =  container.create({
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
    },{
      format:"MM/YY"
    });
  });
  it("container create options 2",()=>{
    let container = new CollectContainer({}, metaData, {}, { logLevel: LogLevel.ERROR,env:Env.PROD });
    let expiryDate =  container.create({
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
    },{
      format:"SS/YYY"
    });
  });
});
