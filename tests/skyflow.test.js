/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import Skyflow, { ContainerType } from '../src/skyflow';
import CollectContainer from '../src/core/external/collect/collect-container';
import RevealContainer from '../src/core/external/reveal/reveal-container';
import * as iframerUtils from '../src/iframe-libs/iframer';
import { ElementType, ELEMENT_EVENTS_TO_IFRAME } from '../src/core/constants';
import { Env, EventName, LogLevel, RedactionType, RequestMethod } from '../src/utils/common';

jest.mock('../src/utils/jwt-utils', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));
jest.mock('../src/libs/uuid', () => ({
  __esModule: true,
  default: jest.fn(() => 'b5cbf425-6578-4d40-be88-82a748c36c60'),
}));
iframerUtils.getIframeSrc = jest.fn(() => ('https://google.com'));

describe('Skyflow initialization', () => {
  test('should initialize the skyflow object  ', () => {
    const skyflow = Skyflow.init({
      vaultID: 'vault_id',
      vaultURL: 'https://vault.test.com',
      getBearerToken: jest.fn(),
    });
    expect(skyflow.constructor === Skyflow).toBe(true);
  });

  test('invalid vaultURL testing', async () => {
    try {
      const skyflow = Skyflow.init({
        vaultID: 'vault_id',
        vaultURL: 'vaultUrl',
        getBearerToken: jest.fn(),
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('invalid method name for getAccessToken', async () => {
    try {
      const skyflow = Skyflow.init({
        vaultID: 'vault_id',
        vaultURL: 'https://vault.test.com',
        getTokens: () => Promise.resolve(httpRequestToken()),
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe('Create container', () => {
  let skyflow;
  beforeEach(() => {
    skyflow = Skyflow.init({
      vaultID: 'vault_id',
      vaultURL: 'https://vault.test.com',
      getBearerToken: jest.fn(),
    });
  });

  test('create container', () => {
    const collectContainer = skyflow.container('COLLECT');
    expect(collectContainer.constructor).toEqual(CollectContainer);

    const revealContainer = skyflow.container('REVEAL');
    expect(revealContainer.constructor).toEqual(RevealContainer);

    try {
      const revealContainer = skyflow.container('test');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});

describe('skyflow insert validations', () => {
  const skyflow = Skyflow.init({
    vaultID: 'vault_id',
    vaultURL: 'https://vault.test.com',
    getBearerToken: jest.fn(),
  });

  test('invalid input', async () => {
    try {
      const res = await skyflow.insert({});
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  test('records object empty', async () => {
    try {
      const res = await skyflow.insert({ records: [] });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  test('missing fields', async () => {
    try {
      const res = await skyflow.insert({ records: [{ table: 'test' }] });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  test('missing table', async () => {
    try {
      const res = await skyflow.insert({ records: [{ fields: { name: 'joey' } }] });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  test('empty table name', async () => {
    try {
      const res = await skyflow.insert({ records: [{ table: '', fields: { name: 'joey' } }] });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});

const records = {
  records: [
    {
      table: 'pii_fields',
      fields: {
        first_name: 'joey',
        primary_card: {
          card_number: '411',
          cvv: '123',
        },
      },
    }],
};

const options = {
  tokens: true,
};

const insertResponse = {
  records: [
    {
      table: 'pii_fields',
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
const on = jest.fn();

describe('skyflow insert', () => {
  let emitSpy;
  let targetSpy;
  let skyflow;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });

    skyflow = Skyflow.init({
      vaultID: 'vault123',
      vaultURL: 'https://vaulturl.com',
      getBearerToken: jest.fn(),
    });

    // const frameReayEvent = on.mock.calls
    //   .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    // const frameReadyCb = frameReayEvent[0][1];
    // const cb2 = jest.fn();
    // frameReadyCb({}, cb2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('insert success', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res = skyflow.insert(records);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb(insertResponse);

      let data;
      res.then((res) => data = res);

      setTimeout(() => {
        expect(data.records.length).toBe(1);
        expect(data.error).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });
  test('insert success with upsert options', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res = skyflow.insert(records,{upsert:[{
        table: 'table1', column: 'column' 
      }]});

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb(insertResponse);

      let data;
      res.then((res) => data = res);

      setTimeout(() => {
        expect(data.records.length).toBe(1);
        expect(data.error).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });

  test('insert error', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res = skyflow.insert(records);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "resource doesn't exist", code: 404 } });

      let error;
      res.catch((err) => error = err);

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });
  test('insert success else', (done) => {
    try {
      const res = skyflow.insert(records);

      const frameReayEvent = on.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
      const frameReadyCb = frameReayEvent[1][1];
      frameReadyCb();
      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb(insertResponse);

      let data;
      res.then((res) => data = res);

      setTimeout(() => {
        expect(data.records.length).toBe(1);
        expect(data.error).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });
  test('insert success else with upsert options', (done) => {
    try {
      const res = skyflow.insert(records,{
        tokens: undefined,
        upsert:[{table: 'table1',column:'column1'}]
      });

      const frameReayEvent = on.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
      const frameReadyCb = frameReayEvent[1][1];
      frameReadyCb();
      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb(insertResponse);

      let data;
      res.then((res) => data = res);

      setTimeout(() => {
        expect(data.records.length).toBe(1);
        expect(data.error).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });

  test('insert invalid input', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res = skyflow.insert({ records: [] });
      let error;
      res.catch((err) => error = err);

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });
});

const detokenizeInput = {
  records: [{
    token: 'token1',
    // redaction: 'PLAIN_TEXT',
  }],
};
const invalidDetokenizeInput = {
  recordscds: [{
    token: 'token1',
    // redaction: 'PLAIN_TEXT',
  }],
};
const detokenizeRes = {
  records: [{
    token: 'token1',
    cvv: 123,
  }],
};

describe('skyflow detokenize', () => {
  let emitSpy;
  let targetSpy;
  let skyflow;
  const emit = jest.fn();
  const on = jest.fn();
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
      emit,
    });

    skyflow = Skyflow.init({
      vaultID: 'vault123',
      vaultURL: 'https://vaulturl.com',
      getBearerToken: jest.fn(),
    });

    // const frameReayEvent = on.mock.calls
    //   .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    // const frameReadyCb = frameReayEvent[0][1];
    // const cb2 = jest.fn();
    // frameReadyCb({}, cb2);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test('detokenize success', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res = skyflow.detokenize(detokenizeInput);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb(detokenizeRes);

      let data;
      res.then((res) => data = res);

      setTimeout(() => {
        expect(data.records.length).toBe(1);
        expect(data.error).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });

  test('detokenize error', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res = skyflow.detokenize(detokenizeInput);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "token doesn't exist", code: 404 } });

      let error;
      res.catch((err) => error = err);

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });

  test('detokenize success else', (done) => {
    try {
      const res = skyflow.detokenize(detokenizeInput);

      const frameReayEvent = on.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
      const frameReadyCb = frameReayEvent[0][1];
      const frameReadyCb2 = frameReayEvent[1][1];
      frameReadyCb2();
      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb(detokenizeRes);
      res.then((result) => {
        expect(result.records.length).toBe(1);
        expect(result.error).toBeUndefined();
        done();
      });
    } catch (err) {
    }
  });
  test('detokenize error else', (done) => {
    try {
      const res = skyflow.detokenize(detokenizeInput);

      const frameReayEvent = on.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
      const frameReadyCb = frameReayEvent[0][1];
      const frameReadyCb2 = frameReayEvent[1][1];
      frameReadyCb2();
      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "token doesn't exist", code: 404 } });
      res.catch((err) => {
        expect(err).toBeDefined();
        done();
      });
    } catch (err) {
    }
  });
  test('detokenize invalid input 1', () => {
    try {
      const res = skyflow.detokenize(invalidDetokenizeInput);
      res.catch((err) => {
        expect(err).toBeDefined();
      });
    } catch (err) {
    }
  });
  test('detokenize invalid input 2', () => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res = skyflow.detokenize(invalidDetokenizeInput);
      res.catch((err) => {
        expect(err).toBeDefined();
      });
    } catch (err) {
    }
  });
});

const getByIdInput = {
  records: [{
    ids: ['skyflowId1'],
    table: 'pii_fields',
    redaction: 'PLAIN_TEXT',
  }],
};

const getByIdRes = {
  records: [
    {
      fields: {
        cvv: '123',
      },
      table: 'pii_fields',
    },
  ],
};

describe('skyflow getById', () => {
  let emitSpy;
  let targetSpy;
  let skyflow;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });

    skyflow = Skyflow.init({
      vaultID: 'vault123',
      vaultURL: 'https://vaulturl.com',
      getBearerToken: jest.fn(),
    });

    // const frameReayEvent = on.mock.calls
    //   .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    // const frameReadyCb = frameReayEvent[0][1];
    // const cb2 = jest.fn();
    // frameReadyCb({}, cb2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getById success', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res = skyflow.getById(getByIdInput);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb(getByIdRes);

      let data;
      res.then((res) => data = res);

      setTimeout(() => {
        expect(data.records.length).toBe(1);
        expect(data.error).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });
  test('getById success else', (done) => {
    try {
      const res = skyflow.getById(getByIdInput);
      const frameReayEvent = on.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
      const frameReadyCb2 = frameReayEvent[1][1];
      frameReadyCb2();

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb(getByIdRes);

      let data;
      res.then((res) => data = res);

      setTimeout(() => {
        expect(data.records.length).toBe(1);
        expect(data.error).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });

  test('getById error', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    try {
      const res = skyflow.getById(getByIdInput);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST));
      const emitCb = emitEvent[0][2];
      emitCb({ error: { message: "id doesn't exist", code: 404 } });

      let error;
      res.catch((err) => error = err);

      setTimeout(() => {
        expect(error).toBeDefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });
  test('getById invalid input-1', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    const res = skyflow.getById({});
    res.catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
  test('getById invalid input-2', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    const res = skyflow.getById({ records: [] });
    res.catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
  test('getById invalid input-3', (done) => {
    const frameReayEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY));
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
    const res = skyflow.getById({ records: [{}] });
    res.catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
  test('getById invalid input-4', (done) => {
    const res = skyflow.getById({ records: [{}] });
    res.catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
});





describe('Skyflow Enums', () => {
  test('Skyflow.ContainerType', () => {
    expect(Skyflow.ContainerType.COLLECT).toEqual(ContainerType.COLLECT);
    expect(Skyflow.ContainerType.REVEAL).toEqual(ContainerType.REVEAL);
  });

  test('Skyflow.ElementType', () => {
    expect(Skyflow.ElementType.CARDHOLDER_NAME).toEqual(ElementType.CARDHOLDER_NAME);
    expect(Skyflow.ElementType.CARD_NUMBER).toEqual(ElementType.CARD_NUMBER);
    expect(Skyflow.ElementType.CVV).toEqual(ElementType.CVV);
    expect(Skyflow.ElementType.EXPIRATION_DATE).toEqual(ElementType.EXPIRATION_DATE);
  });

  test('Skyflow.RedactionType', () => {
    expect(Skyflow.RedactionType.DEFAULT).toEqual(RedactionType.DEFAULT);
    expect(Skyflow.RedactionType.MASKED).toEqual(RedactionType.MASKED);
    expect(Skyflow.RedactionType.PLAIN_TEXT).toEqual(RedactionType.PLAIN_TEXT);
    expect(Skyflow.RedactionType.REDACTED).toEqual(RedactionType.REDACTED);
  });

  test('Skyflow.RequestMethod', () => {
    expect(Skyflow.RequestMethod.GET).toEqual(RequestMethod.GET);
    expect(Skyflow.RequestMethod.POST).toEqual(RequestMethod.POST);
    expect(Skyflow.RequestMethod.PUT).toEqual(RequestMethod.PUT);
    expect(Skyflow.RequestMethod.DELETE).toEqual(RequestMethod.DELETE);
    expect(Skyflow.RequestMethod.PATCH).toEqual(RequestMethod.PATCH);
  });

  test('Skyflow.LogLevel', () => {
    expect(Skyflow.LogLevel.DEBUG).toEqual(LogLevel.DEBUG);
    expect(Skyflow.LogLevel.ERROR).toEqual(LogLevel.ERROR);
    expect(Skyflow.LogLevel.INFO).toEqual(LogLevel.INFO);
    expect(Skyflow.LogLevel.WARN).toEqual(LogLevel.WARN);
  });

  test('Skyflow.EventName', () => {
    expect(Skyflow.EventName.CHANGE).toEqual(EventName.CHANGE);
    expect(Skyflow.EventName.FOCUS).toEqual(EventName.FOCUS);
    expect(Skyflow.EventName.READY).toEqual(EventName.READY);
    expect(Skyflow.EventName.BLUR).toEqual(EventName.BLUR);
  });

  test('Skflow.Env', () => {
    expect(Skyflow.Env.DEV).toEqual(Env.DEV);
    expect(Skyflow.Env.PROD).toEqual(Env.PROD);
  });
});

describe('Get BearerToken Listener', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });
  test('listener with valid Token', (done) => {
    const bearerFun = () => new Promise((resolve, _) => {
      resolve('validBearerToken');
    });
    const skyflow = Skyflow.init({
      vaultID: '1242',
      vaultURL: 'https://vault.url.com',
      getBearerToken: bearerFun,
    });
    const emitterCb = jest.fn();
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN, {}, emitterCb);

    const onCbEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN));
    expect(onCbEvent).toBeDefined();

    const onCbName = onCbEvent[0][0];
    expect(onCbName.includes(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN)).toBeTruthy();
    const onCb = onCbEvent[0][1];
    onCb({}, emitterCb);
    setTimeout(() => {
      expect(emitterCb).toBeCalledTimes(1);
      done();
    }, 1000);
  });

  test('listener with Invalid Token', (done) => {
    const bearerFun = () => new Promise((_, reject) => {
      reject('Error in userFunction');
    });
    const skyflow = Skyflow.init({
      vaultID: '1242',
      vaultURL: 'https://vault.url.com',
      getBearerToken: bearerFun,
    });
    const emitterCb = jest.fn();
    bus.emit(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN, {}, emitterCb);

    const onCbEvent = on.mock.calls
      .filter((data) => data[0].includes(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN));
    expect(onCbEvent).toBeDefined();

    const onCbName = onCbEvent[0][0];
    expect(onCbName.includes(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN)).toBeTruthy();
    const onCb = onCbEvent[0][1];
    onCb({}, emitterCb);
    setTimeout(() => {
      expect(emitterCb).toBeCalledTimes(1);
      expect(emitterCb).toBeCalledWith({ error: 'Error in userFunction' });
      done();
    }, 1000);
  });
});


