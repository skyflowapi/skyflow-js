/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { ELEMENT_EVENTS_TO_IFRAME, PUREJS_TYPES } from '../../../../src/core/constants';
import clientModule from '../../../../src/client';
import * as busEvents from '../../../../src/utils/bus-events';
import { LogLevel, Env, RedactionType } from '../../../../src/utils/common';
import SkyflowFrameController from '../../../../src/core/internal/skyflow-frame/skyflow-frame-controller';

busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));
const on = jest.fn();
const mockUuid = '1244'
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

// const insertResponse = {
//   vaultID: 'vault123',
//   responses: [
//     {
//       table: 'table1',
//       records: [
//         {
//           skyflow_id: 'testId',
//         },
//       ],
//     },
//     {
//       table: 'table1',
//       fields: {
//         '*': 'testId',
//         first_name: 'token1',
//         primary_card: {
//           card_number: 'token2',
//           cvv: 'token3',
//         },
//       },
//     },
//   ],
// };
const insertResponse = {"vaultID":"<VaultID>","responses":[{"records":[{"skyflow_id":"id","tokens":{"card_number":"token","cvv":"token","expiry_date":"token","fullname":"token"}}]}]}

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
const renderResponse = {
  fields : {
    skyflow_id: '1234'
  }
}

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
const detokenizeRecordWithRedaction = [{
  token: 'token1',
  redaction: RedactionType.MASKED,
}]
const detokenizeResponse = {
  records: [{
    token_id: 'token1',
    fields: {
      cvv: '123',
    },
  }],
};
const detokenizeResponseWithRedaction = {
  records: [{
    token_id: 'token1',
    value: '123'
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

const getByIdReqWithoutRedaction = [{
  ids: ['id1'],
  table: 'table1',
}];

const getOptionsTrue = { tokens: true };
const getOptionsFalse = { tokens: false };

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
    const clientReq = jest.fn(() => Promise.resolve(detokenizeResponseWithRedaction));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecordWithRedaction,
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
      records: detokenizeRecordWithRedaction,
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

  test('get success second case', (done) => {
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

  test('get method should send request url with tokenization true and without redaction when tokens flag is true', (done) => {
    let reqArg;
    const clientReq = jest.fn((arg) => {
      reqArg = arg;
      return Promise.resolve(getByIdRes)
    });
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET,
      records: getByIdReqWithoutRedaction,
      options: getOptionsTrue
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    try {
      setTimeout(() => {
        expect(cb2.mock.calls[0][0].records.length).toBe(1);
        expect((reqArg.url).includes('tokenization=true')).toBe(true);
        expect((reqArg.url).includes('redaction=PLAIN_TEXT')).toBe(false);
        done();
      }, 1000);
    } catch (err) {
      done(err);
    }
  });

  test('get method should send request url with tokenization false and redaction when tokens flag is false', (done) => {
    let reqArg;
    const clientReq = jest.fn((arg) => {
      reqArg = arg;
      return Promise.resolve(getByIdRes)
    });
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
      options: getOptionsFalse
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    try {
      setTimeout(() => {
        expect(cb2.mock.calls[0][0].records.length).toBe(1);
        expect((reqArg.url).includes('tokenization=false')).toBe(true);
        expect((reqArg.url).includes('redaction=PLAIN_TEXT')).toBe(true);
        done();
      }, 1000);
    } catch (err) {
      done(err);
    }
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

const deleteRecords = {
  records: [
    {
      table: 'pii_fields',
      id: '29ebda8d-5272-4063-af58-15cc674e332b',
    },
    {
      table: 'pii_fields',
      id: '29ebda8d-5272-4063-af58-15cc674e332b',
    },
  ],
};

const deleteOptions = {};

const deleteResponse = {  
  skyflow_id: '29ebda8d-5272-4063-af58-15cc674e332b',
  deleted: true
};

const deleteErrorResponse = {
  error: {
      grpc_code: 5,
      http_code: 404,
      message: "No Records Found",
      http_status: "Not Found",
      details: []
  }
}

describe('Deleting records from the vault', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });

    busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));
  });

  test('delete records success', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(deleteResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DELETE,
      records: deleteRecords,
      options: deleteOptions,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);
    
    setTimeout(() => {
      try {
        expect(cb2.mock.calls[0][0].records.length).toBe(2);
        expect(cb2.mock.calls[0][0].records[0].deleted).toBeTruthy();
        expect(cb2.mock.calls[0][0].records[1].deleted).toBeTruthy();
        expect(cb2.mock.calls[0][0].error).toBeUndefined();
        done();
      } catch(err) {
        done(err);
      }
    }, 1000);
  });

  test('delete records with error', (done) => {
    const clientReq = jest.fn(() => Promise.reject(deleteErrorResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq, toJSON: toJson }));

    SkyflowFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DELETE,
      records: deleteRecords,
      options: deleteOptions,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      try {
        expect(cb2.mock.calls[0][0].error).toBeDefined();
        done();
      } catch(err) {
        done(err);
      }
    }, 1000);
  });
});

describe('getAcessToken error delete', () => {
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
    
    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const deleteData = {
      type: PUREJS_TYPES.DELETE,
      records: deleteRecords,
      options: deleteOptions,
    };
    const deleteCb = jest.fn();
    onCb(deleteData, deleteCb);

    setTimeout(() => {
      try {
        expect(deleteCb.mock.calls[0][0].error).toBeDefined();
        done();
      } catch(err) {
        done(err);
      }
    }, 1000);
  });
});

describe('test render file request', () => { 

  let emitSpy;
  let targetSpy;
  let onSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock("../../../../src/core-utils/reveal",()=>({
      __esModule: true,
      getFileURLFromVaultBySkyflowID: jest.fn()
    }));
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
    onSpy = jest.spyOn(bus, 'on');

    busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));

  });

  test("render files",()=>{
    const clientReq = jest.fn(() => Promise.reject({
      errors:[{skyflowID:"1815-6223-1073-1425","error":{"code":404,"description":"id not found"}}]
    }));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq })); 
    SkyflowFrameController.init(); 

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    console.log(emitSpy.mock.calls)
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);
  
    const revelRequestEventName = ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST;
    const data = {
      "records":[
        {
          skyflowID: "1815-6223-1073-1425",
        }
      ]
    }
    console.log(onSpy.mock.calls)
    const emitterCb = jest.fn();
    bus.emit(revelRequestEventName,data,emitterCb);
    const onCbName = on.mock.calls[1][0];
    expect(onCbName).toBe(revelRequestEventName);
    const onCb =  on.mock.calls[1][1];
    onCb(data,emitterCb);
  });
})