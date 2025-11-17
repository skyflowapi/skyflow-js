/*
Copyright (c) 2022 Skyflow, Inc.
*/
import {
  COLLECT_FRAME_CONTROLLER,
  ElementType,
  ELEMENT_EVENTS_TO_IFRAME,
  ELEMENT_EVENTS_TO_CONTAINER,
  SKYFLOW_FRAME_CONTROLLER_READY,
  ELEMENTS,
  ELEMENT_EVENTS_TO_CLIENT
} from '../../../../src/core/constants';
import CollectContainer from '../../../../src/core/external/collect/collect-container';
import * as iframerUtils from '../../../../src/iframe-libs/iframer';
import SkyflowError from '../../../../src/libs/skyflow-error';
import Skyflow from '../../../../src/skyflow';
import { LogLevel, Env, ValidationRuleType } from '../../../../src/utils/common';
import SKYFLOW_ERROR_CODE from '../../../../src/utils/constants';
import logs from '../../../../src/utils/logs';
import { parameterizedString } from '../../../../src/utils/logs-helper';

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
  skyflowContainer: {
    isControllerFrameReady : true,
  },
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
  uuid: '123',
  skyflowContainer: {
    isControllerFrameReady : false,
  },
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
  let onSpy;
  let windowSpy;

  beforeEach(() => {
    windowSpy = jest.spyOn(window, "window", "get");
    emitSpy = null;
    targetSpy = null;
    onSpy = null;
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    onSpy = jest.spyOn(bus, 'on');
    targetSpy.mockReturnValue({
      on,
      off: jest.fn()
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });
  it('should throw error when collect call made with no elements ', () => {
    const collectContainer = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
    expect(collectContainer).toBeDefined();
    collectContainer.collect().then().catch(err => {
      expect(err).toBeDefined();
      expect(err instanceof SkyflowError).toBeTruthy();
    })
  });
    it('should throw error when collect call made with no elements case2 ', () => {
    const collectContainer = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
    expect(collectContainer).toBeDefined();
    collectContainer.collect().then().catch(err => {
      expect(err).toBeDefined();
      expect(err instanceof SkyflowError).toBeTruthy();
    })
  });
    it('should throw error when uploadfiles call made with no elements ', () => {
    const collectContainer = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
    expect(collectContainer).toBeDefined();
    collectContainer.uploadFiles().then().catch(err => {
      expect(err).toBeDefined();
      expect(err instanceof SkyflowError).toBeTruthy();
    })
  });
      it('should throw error when uploadfiles call made with no elements ', () => {
    const collectContainer = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
    expect(collectContainer).toBeDefined();
    collectContainer.uploadFiles().then().catch(err => {
      expect(err).toBeDefined();
      expect(err instanceof SkyflowError).toBeTruthy();
    })
  });

  it("container collect success", () => {
    let collectContainer = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    const element1 = collectContainer.create(cvvElement);
    const element2 = collectContainer.create(cardNumberElement);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });

    collectContainer.collect().then().catch(err => {
      expect(err).toBeDefined();
    })

    const collectRequestCb = emitSpy.mock.calls[2][2];
    collectRequestCb({
      data: {}
    })

    collectRequestCb({
      error:"error",
    })

    collectContainer.collect({
      tokens: true,
      additionalFields:true,
      upsert: true
    }).then().catch(err => {
      expect(err).toBeDefined();
    })
  });

  it("container collect case when tokens are invalid", () => {
    let collectContainer = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    const element1 = collectContainer.create(cvvElement);
    const element2 = collectContainer.create(cardNumberElement);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });

    collectContainer.collect({tokens: "demo", upsert: true}).then().catch(err => {
      expect(err).toBeDefined();
    })
  });

  it("container collect case when additional fields are invalid", () => {
    let collectContainer = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    const element1 = collectContainer.create(cvvElement);
    const element2 = collectContainer.create(cardNumberElement);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });

    collectContainer.collect({additionalFields: 'hlo'}).then().catch(err => {
      expect(err).toBeDefined();
    })
  });

    it("container collect case when upsert are invalid", () => {
    let collectContainer = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    const element1 = collectContainer.create(cvvElement);
    const element2 = collectContainer.create(cardNumberElement);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });

    collectContainer.collect({upsert: []}).then().catch(err => {
      expect(err).toBeDefined();
    })
  });
  it("container collect case when elements are invalid", () => {
    let collectContainer = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    const cvvEle = {
      column: '',
      styles: {
        base: {
        color: '#1d1d1d',
      },
      },
      placeholder: 'cvv',
      label: 'cvv',
      type: 'CVV',
    };
    const element1 = collectContainer.create(cvvEle);
    const element2 = collectContainer.create(cardNumberElement);

    element1.mount(div1);
    element2.mount(div2);
    const mockFrames = {};
  
  // Helper function to add frame entries
  const addMockFrame = () => {
    mockFrames[element1.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
      };
    mockFrames[element2.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
    };   
  };

  // Add your test frames
  addMockFrame();
  
  // Set up window.parent.frames
  Object.defineProperty(window.parent, 'frames', {
    value: mockFrames,
    writable: true,
    configurable: true
  });
    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });

    collectContainer.collect().then().catch(err => {
      expect(err).toBeDefined();
      expect(err instanceof SkyflowError).toBeTruthy();   
      expect(err.error.code).toEqual(SKYFLOW_ERROR_CODE.MISSING_TABLE_IN_COLLECT.code);
      expect(err.error.description).toEqual(parameterizedString(logs.errorLogs.MISSING_TABLE_IN_COLLECT));
    })
  });

  it('should resolve successfully when collect is called and isSkyflowFrameReady is false', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
  
    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
  
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');
  
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
  
    element1.mount(div1);
    element2.mount(div2);
      // Helper function to add frame entries
    const mockFrames = {};
    const addMockFrame = () => {
    mockFrames[element1.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
      };
    mockFrames[element2.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
    };   
   };

   // Add your test frames
   addMockFrame();
  
   // Set up window.parent.frames
   Object.defineProperty(window.parent, 'frames', {
    value: mockFrames,
    writable: true,
    configurable: true
  });
  
    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });
  
    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });
  
    const collectPromise = container.collect({ tokens: true });
  
    const frameReadyCb = on.mock.calls[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: SKYFLOW_FRAME_CONTROLLER_READY + mockUuid,
    }, cb2);
  
    const emitCallback = emitSpy.mock.calls[2][2];
    emitCallback({
      data: { success: true },
    });

    await expect(collectPromise).resolves.toEqual({
      data: { success: true },
    });
  });
  it('should throw error when collect is called and isSkyflowFrameReady is false', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
  
    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
  
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');
  
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
  
    element1.mount(div1);
    element2.mount(div2);
      // Helper function to add frame entries
    const mockFrames = {};
    const addMockFrame = () => {
    mockFrames[element1.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
      };
    mockFrames[element2.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
    };   
   };

   // Add your test frames
   addMockFrame();
  
   // Set up window.parent.frames
   Object.defineProperty(window.parent, 'frames', {
    value: mockFrames,
    writable: true,
    configurable: true
  });
  
    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });
  
    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });
  
    const collectPromise = container.collect({ tokens: true });
  
    const frameReadyCb = on.mock.calls[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: SKYFLOW_FRAME_CONTROLLER_READY + mockUuid,
    }, cb2);
  
    const emitCallback = emitSpy.mock.calls[2][2];
    emitCallback({
      error: { code: 400, description: 'Skyflow frame controller is not ready' },
    });
    collectPromise.catch(err => {
      expect(err).toBeDefined();
      expect(err.code).toEqual(400);
      expect(err.description).toEqual('Skyflow frame controller is not ready');
    });
  });
  it('should throw error when collect is called and isSkyflowFrameReady is false and tokens is invalid', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
  
    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
  
    const div1 = document.createElement('div');
  
    const element1 = container.create(cvvElement);
  
    element1.mount(div1);
      // Helper function to add frame entries
    const mockFrames = {};
    const addMockFrame = () => {
    mockFrames[element1.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
      };
   };

   // Add your test frames
   addMockFrame();
  
   // Set up window.parent.frames
   Object.defineProperty(window.parent, 'frames', {
    value: mockFrames,
    writable: true,
    configurable: true
  });
  
    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });
  
  
    container.collect({ tokens: 'true' }).then(()=>{
      expect(true).toBeFalsy(); d
    }).catch(err => {
      expect(err).toBeDefined();
      expect(err instanceof SkyflowError).toBeTruthy();
      expect(err.error.code).toEqual(SKYFLOW_ERROR_CODE.INVALID_TOKENS_IN_COLLECT.code);
      expect(err.error.description).toEqual(parameterizedString(logs.errorLogs.INVALID_TOKENS_IN_COLLECT));
    });

  });
  it('should throw error when collect is called and isSkyflowFrameReady is false and upsert is invalid', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
  
    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
  
    const div1 = document.createElement('div');
  
    const element1 = container.create(cvvElement);
  
    element1.mount(div1);
      // Helper function to add frame entries
    const mockFrames = {};
    const addMockFrame = () => {
    mockFrames[element1.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
      };
   };

   // Add your test frames
   addMockFrame();
  
   // Set up window.parent.frames
   Object.defineProperty(window.parent, 'frames', {
    value: mockFrames,
    writable: true,
    configurable: true
  });
  
    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });
  
  
    container.collect({ upsert: [] }).then(()=>{
      expect(true).toBeFalsy(); d
    }).catch(err => {
      expect(err).toBeDefined();
      expect(err instanceof SkyflowError).toBeTruthy();
      expect(err.error.code).toEqual(SKYFLOW_ERROR_CODE.EMPTY_UPSERT_OPTIONS_ARRAY.code);
      expect(err.error.description).toEqual(parameterizedString(logs.errorLogs.EMPTY_UPSERT_OPTIONS_ARRAY));
    });

  });
  it('should throw error when collect is called and isSkyflowFrameReady is false and additionalFields is invalid', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
  
    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
  
    const div1 = document.createElement('div');
  
    const element1 = container.create(cvvElement);
  
    element1.mount(div1);
      // Helper function to add frame entries
    const mockFrames = {};
    const addMockFrame = () => {
    mockFrames[element1.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
      };
   };

   // Add your test frames
   addMockFrame();
  
   // Set up window.parent.frames
   Object.defineProperty(window.parent, 'frames', {
    value: mockFrames,
    writable: true,
    configurable: true
  });
  
    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });
  
  
    container.collect({ additionalFields: [] }).then(()=>{
      expect(true).toBeFalsy(); 
    }).catch(err => {
      expect(err).toBeDefined();
      expect(err instanceof SkyflowError).toBeTruthy();
      expect(err.error.code).toEqual(SKYFLOW_ERROR_CODE.RECORDS_KEY_NOT_FOUND_IN_ADDITIONAL_FIELDS.code);
      expect(err.error.description).toEqual(parameterizedString(logs.errorLogs.RECORDS_KEY_NOT_FOUND_IN_ADDITIONAL_FIELDS));
    });

  });
  it('should throw error when collect is called and isSkyflowFrameReady is false and additionalFields is invalid', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});
  
    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
  
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');
  
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
  
    element1.mount(div1);
      // Helper function to add frame entries
    const mockFrames = {};
    const addMockFrame = () => {
    mockFrames[element1.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
      };
   };

   // Add your test frames
   addMockFrame();
  
   // Set up window.parent.frames
   Object.defineProperty(window.parent, 'frames', {
    value: mockFrames,
    writable: true,
    configurable: true
  });
  
    const mountCvvCb = onSpy.mock.calls[2][1];
    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });
  
  
    container.collect().then(()=>{
      expect(true).toBeFalsy(); 
    }).catch(err => {
      expect(err).toBeDefined();
      expect(err instanceof SkyflowError).toBeTruthy();
      expect(err.error.code).toEqual(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED.code);
      expect(err.error.description).toEqual(parameterizedString(logs.errorLogs.ELEMENTS_NOT_MOUNTED));
    });

  });

  it('element type radio or checkox created', async () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    const element1 = container.create({
      table: 'pii_fields',
      column: 'primary_card.cvv',
      styles: {
        base: {
          color: '#1d1d1d',
        },
      },
      label: 'cvv',
      type: 'checkbox',
      value: 'check-box'
    });
    const element2 = container.create({
      table: 'pii_fields',
      column: 'primary_card.card_number',
      styles: {
        base: {
          color: '#1d1d1d',
        },
      },
      label: 'card_number',
      type: 'radio',
      value: 'radio'
    });

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];

    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });

    expect(element1.elementType).toBe('checkbox');
    expect(element2.elementType).toBe('radio');
  });

  it('should successfully upload files when elements are mounted', async () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    const div = document.createElement('div');
    const fileElement = container.create(FileElement);

    fileElement.mount(div);

    const mountCb = onSpy.mock.calls[2][1];
    mountCb({
      name: `element:${FileElement.type}:${btoa(fileElement.getID())}`,
    });
          // Helper function to add frame entries
    const mockFrames = {};
    const addMockFrame = () => {
    mockFrames[fileElement.iframeName()] = {
      postMessage: jest.fn(),
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
      };
   };

   // Add your test frames
   addMockFrame();
  
   // Set up window.parent.frames
   Object.defineProperty(window.parent, 'frames', {
    value: mockFrames,
    writable: true,
    configurable: true
  });

    const uploadPromise = container.uploadFiles({ someOption: true });

    const uploadRequestCb = emitSpy.mock.calls[1][2];
    uploadRequestCb({
      error: { code: 400, description: 'File upload failed' },
    });
    uploadPromise.catch(err => {
      expect(err).toBeDefined();
      expect(err.code).toEqual(400);
      expect(err.description).toEqual('File upload failed');
    });
  });
  it('should throw error when elements are not created', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD });

    const uploadPromise = container.uploadFiles();

    uploadPromise.catch(err => {
      expect(err).toBeDefined();
      expect(err.error.code).toEqual(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT.code);
      expect(err.error.description).toEqual(logs.errorLogs.NO_ELEMENTS_IN_COLLECT);
    });
  });
    it('should throw error when elements are not created and skyflow frame controller not ready', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD });

    const uploadPromise = container.uploadFiles();

    uploadPromise.catch(err => {
      expect(err).toBeDefined();
      expect(err.error.code).toEqual(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_COLLECT.code);
      expect(err.error.description).toEqual(logs.errorLogs.NO_ELEMENTS_IN_COLLECT);
    });
  });
    it('should throw error when elements are created but not mounted', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD });

    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
    const fileElement = container.create(FileElement);
    const uploadPromise = container.uploadFiles();

    uploadPromise.catch(err => {
      expect(err).toBeDefined();
      expect(err.error.code).toEqual(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED.code);
      expect(err.error.description).toEqual(logs.errorLogs.ELEMENTS_NOT_MOUNTED);
    });
  });
  
  it('should successfully upload files when elements are mounted', async () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    const div = document.createElement('div');
    const fileElement = container.create(FileElement);

    fileElement.mount(div);

    const mountCb = onSpy.mock.calls[2][1];
    mountCb({
      name: `element:${FileElement.type}:${btoa(fileElement.getID())}`,
    });

    const uploadPromise = container.uploadFiles({ someOption: true });

    const uploadRequestCb = emitSpy.mock.calls[1][2];
    uploadRequestCb({
      data: { success: true },
    });

    const expectedResponse = await uploadPromise;

    expect(expectedResponse.data.success).toEqual(true);
  });

  it('should throw an error if elements are not mounted', async () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    const div = document.createElement('div');
    const fileElement = container.create(FileElement);

    await expect(container.uploadFiles()).rejects.toThrow(SkyflowError);
  });
    it('should throw an error if elements are not mounted and skyflow frame not ready', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    const div = document.createElement('div');
    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
    const response = container.uploadFiles()
    const frameReadyCb = on.mock.calls[0][1];
    frameReadyCb({});
    expect(response).rejects.toThrow(SkyflowError);
  });
  it('should throw an error if elements are not mounted when skyflow frame controller is not ready', () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    const div = document.createElement('div');
    const fileElement = container.create(FileElement);
    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
    try{
    const response = container.uploadFiles()
    const frameReadyCb = on.mock.calls[0][1];
    frameReadyCb({});
    expect(response).rejects.toThrow(SkyflowError);
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.error.code).toEqual(SKYFLOW_ERROR_CODE.ELEMENTS_NOT_MOUNTED.code);
      expect(err.error.description).toEqual(logs.errorLogs.ELEMENTS_NOT_MOUNTED);
    }
  });

  it('should handle errors during file upload', async () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    const div = document.createElement('div');
    const fileElement = container.create(FileElement);

    fileElement.mount(div);

    const mountCb = onSpy.mock.calls[2][1];
    mountCb({
      name: `element:${FileElement.type}:${btoa(fileElement.getID())}`,
    });

    const uploadPromise = container.uploadFiles({ someOption: true });
    

    const uploadRequestCb = emitSpy.mock.calls[1][2];
    uploadRequestCb({
      error: 'File upload failed',
    });

    await expect(uploadPromise).rejects.toEqual('File upload failed');
  });

  it('should not emit events when isSkyflowFrameReady is false', async () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    
    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
  
    const div = document.createElement('div');
    const fileElement = container.create(FileElement);
  
    fileElement.mount(div);
    const mountCb = onSpy.mock.calls[2][1];
    mountCb({
      name: `element:${FileElement.type}:${btoa(fileElement.getID())}`,
    });

    container.uploadFiles({ someOption: true }).then().catch(err => {
      expect(err).toBeDefined();
    })    
  });

  it('should resolve successfully when file upload is successful', async () => {
    const container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD });

    Object.defineProperty(container, '#isSkyflowFrameReady', {
      value: false,
      writable: true,
    });
  
    const div = document.createElement('div');
    const fileElement = container.create(FileElement);
  
    fileElement.mount(div);
  
    const mountCb = onSpy.mock.calls[2][1];
    mountCb({
      name: `element:${FileElement.type}:${btoa(fileElement.getID())}`,
    });
  
    const uploadPromise = container.uploadFiles({ someOption: true });
    console.log('on', on.mock.calls);
    const frameReadyCb = on.mock.calls[0][1];
    const cb2 = jest.fn();
    frameReadyCb({
      name: SKYFLOW_FRAME_CONTROLLER_READY + mockUuid,
    }, cb2);

    const emitCallback = emitSpy.mock.calls[1][2];
    emitCallback({
      data: { success: true },
    });

    await expect(uploadPromise).resolves.toEqual({
      data: { success: true },
    });
      
    const uploadPromise2 = container.uploadFiles({ someOption: true });
    const frameReadyCb2 = on.mock.calls[0][1];
    const cb3 = jest.fn();
    frameReadyCb2({
      name: SKYFLOW_FRAME_CONTROLLER_READY + mockUuid,
    }, cb3);

    const emitCallback2 = emitSpy.mock.calls[1][2];
    emitCallback2({
      error: { code: 400, description: 'File upload failed' },
    });

    expect(uploadPromise2).resolves.toEqual({
      error: { code: 400, description: 'File upload failed' },
    });
  });

  it('Invalid element type', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({ ...cvvElement, type: 'abc' });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Invalid table', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const cvv = container.create({
        ...cvvElement,
        column: undefined,
        validations: [{
          type: ValidationRuleType.ELEMENT_VALUE_MATCH_RULE,
          params: {}
        }]
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('Invalid validation params, invalid collect element', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let cvv;
    try {
      cvv = container.create(cvvElement);
    } catch (err) { }

    expect(cvv.elementType).toBe('CVV');

    expect(container.collect).rejects.toEqual(new Error(parameterizedString(logs.errorLogs.ELEMENTS_NOT_MOUNTED)));
  });

  it('test default options for card_number', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let card_number;
    try {
      card_number = container.create(cardNumberElement);
    } catch (err) { }

    const options = card_number.getOptions()
    expect(options.enableCardIcon).toBe(true);

  });

  it('test invalid option for EXPIRATION_DATE', () => {

    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { format: 'invalid' });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.format).toBe("MM/YY");
  });

  it('test valid option for EXPIRATION_DATE', () => {
    const validFormat = 'YYYY/MM'
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { format: validFormat });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.format).toBe(validFormat);
  });

  it('test enableCardIcon option is enabled for elements', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { enableCardIcon: true });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.enableCardIcon).toBe(true);

  });

  it('test enableCopy option is enabled for elements', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { enableCopy: true });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.enableCopy).toBe(true);

  });

  it('test enableCardIcon option is disabled for elements', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { enableCardIcon: false });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.enableCardIcon).toBe(false);
  });

  it('test enableCopy option is disabled for elements', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationDateElement, { enableCopy: false });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.enableCopy).toBe(false);

  });

  it('test invalid option for EXPIRATION_YEAR', () => {

    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationYearElement, { format: 'invalid' });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.format).toBe("YY");
  });

  it('test valid option for EXPIRATION_YEAR', () => {
    const validFormat = 'YYYY'
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let expiryElement;
    try {
      expiryElement = container.create(ExpirationYearElement, { format: validFormat });
    } catch (err) { }

    const options = expiryElement.getOptions()
    expect(options.format).toBe(validFormat);
  });

  it("container collect", () => {
    let container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    container.collect().then().catch(err => {
      expect(err).toBeDefined();
    })
  });
  it("container create options", () => {
    let container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    let container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    let file;
    try {
      file = container.create(FileElement);
    } catch (err) { }

    expect(file.elementType).toBe('FILE_INPUT');

    expect(container.collect).rejects.toEqual(new Error(parameterizedString(logs.errorLogs.ELEMENTS_NOT_MOUNTED)));
  });

  it('skyflowID undefined for file Element', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    try {
      const file = container.create({
        ...cvvFileElementElement,
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('skyflowID empty for file Element', () => {
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    const container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    let container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    // const frameReadyCb = on.mock.calls[0][1];
    // const cb2 = jest.fn();
    // frameReadyCb({
    //   name: SKYFLOW_FRAME_CONTROLLER_READY + mockUuid
    // }, cb2)
    // expect(cb2).toHaveBeenCalled()
    container.collect(options).then().catch(err => {
      expect(err).toBeDefined();
    })
  });
  it("container collect options error case 2", () => {
    let container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
  it('test collect and additional fields duplicate elements',()=>{
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    let container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);
    element1.mount(div1);
    element2.mount(div2);
    try{
      container.collect(records).then((res)=>{
        done(res)
      }).catch((err)=>{
        expect(err).toBeDefined();
        // done();
      });

    }catch(err){
      expect(err).toBeDefined();
      // done()
    }
    
  });

  it("container collect options error", () => {
    let container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD });
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
    container.collect(options).then().catch(err => {
      expect(err).toBeDefined();});
  });
});


describe('iframe cleanup logic', () => {
  let container;
  let div1;
  let div2;
  let emitSpy;
  let targetSpy;
  let onSpy;

  beforeEach(() => {
    emitSpy = null;
    targetSpy = null;
    onSpy = null;
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    onSpy = jest.spyOn(bus, 'on');
    targetSpy.mockReturnValue({
      on,
      off: jest.fn()
    });
    div1 = document.createElement('div');
    div2 = document.createElement('div');
    document.body.innerHTML = ''; // Clear body
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    document.body.innerHTML = '';  });

  it('should remove unmounted iframe elements', () => {
    // Create and mount elements
    container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});

    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });

    // Mock iframe elements in document
    const iframe1 = document.createElement('iframe');
    iframe1.id = element1.iframeName();
    document.body.appendChild(iframe1);

    // Trigger cleanup by calling collect
    container.collect().catch((error) => {
      expect(error).not.toBeDefined();
    });
  });

  it('should handle empty document.body', () => {
    container = new CollectContainer(metaData, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});

    const element1 = container.create(cvvElement);
    element1.mount(div1);
    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    // Mock document.body as null
    const originalBody = document.body;
    Object.defineProperty(document, 'body', {
      value: null,
      writable: true
    });

    container.collect().catch(() => {});

    // Restore document.body
    Object.defineProperty(document, 'body', {
      value: originalBody,
      writable: true
    });

    // Elements should remain unchanged
    container.collect().catch((error) => {
      expect(error).not.toBeDefined();
    });
  });
  
  it('should remove unmounted iframe elements', () => {
    container = new CollectContainer(metaData2, [], { logLevel: LogLevel.ERROR, env: Env.PROD }, {});

    // Create and mount elements
    const element1 = container.create(cvvElement);
    const element2 = container.create(cardNumberElement);

    element1.mount(div1);
    element2.mount(div2);

    const mountCvvCb = onSpy.mock.calls[2][1];

    mountCvvCb({
      name: `element:${cvvElement.type}:${btoa(element1.getID())}`,
    });

    const mountCardNumberCb = onSpy.mock.calls[5][1];
    mountCardNumberCb({
      name: `element:${cardNumberElement.type}:${btoa(element2.getID())}`,
    });

    // Mock iframe elements in document
    const iframe1 = document.createElement('iframe');
    iframe1.id = element1.iframeName();
    document.body.appendChild(iframe1);

    // Trigger cleanup by calling collect
    container.collect().catch((error) => {
      expect(error).not.toBeDefined();
    });
  });
});