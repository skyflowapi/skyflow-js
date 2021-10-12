import bus from 'framebus';
import Skyflow from '../src/Skyflow';
import CollectContainer from '../src/container/external/CollectContainer';
import RevealContainer from '../src/container/external/RevealContainer';
import * as iframerUtils from '../src/iframe-libs/iframer';
import { ELEMENT_EVENTS_TO_IFRAME } from '../src/container/constants';

iframerUtils.getIframeSrc = jest.fn(() => ('https://google.com'));

describe('Skyflow initialization', () => {
  test('should initialize the skyflow object  ', () => {
    const skyflow = Skyflow.init({
      vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
      vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
      getBearerToken: jest.fn(),
    });
    expect(skyflow.constructor === Skyflow).toBe(true);
  });

  test('invalid vaultURL testing', async () => {
    try {
      const skyflow = Skyflow.init({
        vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
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
        vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
        vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
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
      vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
      vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
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
    vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
    vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
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

    const frameReayEvent = on.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('insert success', (done) => {
    try {
      const res = skyflow.insert(records);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST);
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
    try {
      const res = skyflow.insert(records);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST);
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
});

const detokenizeInput = {
  records: [{
    token: 'token1',
    redaction: 'PLAIN_TEXT',
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

    const frameReayEvent = on.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('detokenize success', (done) => {
    try {
      const res = skyflow.detokenize(detokenizeInput);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST);
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
    try {
      const res = skyflow.detokenize(detokenizeInput);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST);
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

    const frameReayEvent = on.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getById success', (done) => {
    try {
      const res = skyflow.getById(getByIdInput);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST);
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
    try {
      const res = skyflow.getById(getByIdInput);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST);
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
});

const invokeGatewayReq = {
  gatewayURL: 'https://gatewayurl.com',
  methodName: 'POST',
  pathParams: {
    cardNumber: '4111111111111111',
  },
  queryParams: {
    expiryDate: '12/2024',
  },
  responseBody: {
    resource: {
      cvv: 'cvvId:123',
    },
  },
};

const invokeGatewayRes = {
  receivedTimestamp: '2019-05-29 21:49:56.625',
  processingTimeinMs: 116,
};

describe('skyflow invoke gateway', () => {
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

    const frameReayEvent = on.mock.calls
      .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    const frameReadyCb = frameReayEvent[0][1];
    const cb2 = jest.fn();
    frameReadyCb({}, cb2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getById success', (done) => {
    try {
      const res = skyflow.invokeGateway(invokeGatewayReq);

      const emitEvent = emitSpy.mock.calls
        .filter((data) => data[0] === ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST);
      const emitCb = emitEvent[0][2];
      emitCb(invokeGatewayRes);

      let data;
      res.then((res) => data = res);

      setTimeout(() => {
        expect(data).toBeDefined();
        expect(!('resource' in data)).toBeTruthy();
        expect(data.error).toBeUndefined();
        done();
      }, 1000);
    } catch (err) {
    }
  });
});
