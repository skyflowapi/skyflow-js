/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { ELEMENT_EVENTS_TO_IFRAME, PUREJS_TYPES } from '../../../../src/core/constants';
import clientModule from '../../../../src/client';
import * as busEvents from '../../../../src/utils/bus-events';
import { LogLevel, Env } from '../../../../src/utils/common';
import SkyflowFrameController from '../../../../src/core/internal/skyflow-frame/skyflow-frame-controller';

jest.mock('easy-soap-request')
const soapRequest = require('easy-soap-request');

busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));
const on = jest.fn();

const skyflowConfig = {
  vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
  vaultURL: 'https://testurl.com',
  getBearerToken: jest.fn(),
};

const clientData = {
  client: {
    config: { ...skyflowConfig },
    metadata: {},
  },
  context: { logLevel: LogLevel.ERROR, env: Env.PROD },
};

const records = {
  records: [
    {
      table: 'pii_fields',
      fields: {
        first_name: 'Joseph',
        primary_card: {
          card_number: '4111111111111111',
          cvv: '123',
        },
      },
    }],
};

const options = {
  tokens: true,
  upsert: [{
    table: '',
    column: '',
  }]
};

const insertResponse = {
  vaultID: 'vault123',
  responses: [
    {
      table: 'table1',
      records: [
        {
          skyflow_id: 'testId',
        },
      ],
    },
    {
      table: 'table1',
      fields: {
        '*': 'testId',
        first_name: 'token1',
        primary_card: {
          card_number: 'token2',
          cvv: 'token3',
        },
      },
    },
  ],
};

const insertResponseWithoutTokens = {
  vaultID: 'vault123',
  responses: [
    {
      records: [
        {
          skyflow_id: 'testId',
        },
      ],
    },
  ],
};

const errorResponse = {
  error: {
    http_code: 403,
    message: 'RBAC: access denied',
  },
};

describe('Inserting records into the vault', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('insert records with tokens as true', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(insertResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INSERT,
      records,
      options,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      expect(cb2.mock.calls[0][0].records[0].fields).toBeDefined();
      expect(cb2.mock.calls[0][0].error).toBeUndefined();
      done();
    }, 1000);
  });

  test('insert records with tokens as false', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(insertResponseWithoutTokens));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INSERT,
      records,
      options: { tokens: false, upsert: [{ table: '', column: '  ' }] },
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      expect(cb2.mock.calls[0][0].records[0].fields).toBeUndefined();
      expect(cb2.mock.calls[0][0].error).toBeUndefined();
      done();
    }, 1000);
  });

  test('insert records with error', (done) => {
    const clientReq = jest.fn(() => Promise.reject(errorResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INSERT,
      records,
      options,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

const detokenizeRecords = [{
  token: 'token1',
  // redaction: 'PLAIN_TEXT',
}];
const detokenizeResponse = {
  records: [{
    token_id: 'token1',
    fields: {
      cvv: '123',
    },
  }],
};
const detokenizeErrorResponse = {
  error: {
    grpc_code: 5,
    http_code: 404,
    message: 'Token not found for token1',
    http_status: 'Not Found',
    details: [],
  },
};

const toJson = jest.fn(() => ({
  config: {},
  metaData: {
    uuid: ''
  }
}))

describe('Retrieving data using skyflowId', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('getById success', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(getByIdRes));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET_BY_SKYFLOWID,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test('getById error', (done) => {
    const clientReq = jest.fn(() => Promise.reject(errorResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET_BY_SKYFLOWID,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});


describe('Retrieving data using skyflow tokens', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('detokenize success', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(detokenizeResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test('detokenize error', (done) => {
    const clientReq = jest.fn(() => Promise.reject(detokenizeErrorResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeUndefined();
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

const getByIdReq = [{
  ids: ['id1'],
  redaction: 'PLAIN_TEXT',
  table: 'table1',
}];
const getByColumnReq = [{
  columnValues: ['id1'],
  columnName: 'column1',
  redaction: 'PLAIN_TEXT',
  table: 'table1',
}];

const getByIdRes = {
  records: [{
    fields: {
      skyflow_id: 'id1',
      cvv: '123',
    },
  }],
};

describe('Retrieving data using skyflow tokens', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('detokenize success', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(detokenizeResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test('detokenize error', (done) => {
    const clientReq = jest.fn(() => Promise.reject(detokenizeErrorResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeUndefined();
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});


describe('Retrieving data using get', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('get success', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(getByIdRes));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });
  test('get success2', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(getByIdRes));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByColumnReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });


  test('get error', (done) => {
    const clientReq = jest.fn(() => Promise.reject(errorResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

describe('Failed to fetch accessToken get', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('accessToken error', (done) => {
    busEvents.getAccessToken = jest.fn(() => Promise.reject({ error: 'error' }));
    SkyflowFrameController.init();
    const onCb = on.mock.calls[0][1];

    const insertData = {
      type: PUREJS_TYPES.INSERT,
      records,
      options: { tokens: false, upsert: [{ table: '', column: '  ' }] },
    };
    const insertCb = jest.fn();
    onCb(insertData, insertCb);

    const detokenizeData = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const detokenizeCb = jest.fn();
    onCb(detokenizeData, detokenizeCb);

    const getByIdData = {
      type: PUREJS_TYPES.GET,
      records: getByIdReq,
    };
    const getByIdCb = jest.fn();
    onCb(getByIdData, getByIdCb);

    setTimeout(() => {
      expect(insertCb.mock.calls[0][0].error).toBeDefined();
      expect(detokenizeCb.mock.calls[0][0].error).toBeDefined();
      expect(getByIdCb.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});
describe('Failed to fetch accessToken Getbyid', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('accessToken error', (done) => {
    busEvents.getAccessToken = jest.fn(() => Promise.reject({ error: 'error' }));
    SkyflowFrameController.init();
    const onCb = on.mock.calls[0][1];

    const insertData = {
      type: PUREJS_TYPES.INSERT,
      records,
      options: { tokens: false, upsert: [{ table: '', column: '  ' }] },
    };
    const insertCb = jest.fn();
    onCb(insertData, insertCb);

    const detokenizeData = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const detokenizeCb = jest.fn();
    onCb(detokenizeData, detokenizeCb);

    const getByIdData = {
      type: PUREJS_TYPES.GET,
      records: getByIdReq,
    };
    const getByIdCb = jest.fn();
    onCb(getByIdData, getByIdCb);

    setTimeout(() => {
      expect(insertCb.mock.calls[0][0].error).toBeDefined();
      expect(detokenizeCb.mock.calls[0][0].error).toBeDefined();
      expect(getByIdCb.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});