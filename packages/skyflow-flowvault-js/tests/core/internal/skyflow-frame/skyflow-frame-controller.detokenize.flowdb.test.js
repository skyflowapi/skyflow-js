/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import { ELEMENT_EVENTS_TO_IFRAME, PUREJS_TYPES, REVEAL_TYPES } from '@core/constants';
import clientModule from '@core/client';
import * as busEvents from '@core/utils/bus-events';
import { LogLevel, Env } from '../../../../src/utils/common';
import SkyflowFrameController from '../../../../src/core/internal/skyflow-frame/skyflow-frame-controller';

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
    metadata: { uuid: '1244' },
  },
  context: { logLevel: LogLevel.ERROR, env: Env.PROD },
};

const toJson = jest.fn(() => ({
  config: {},
  metaData: { uuid: '', sdkVersion: 'skyflow-react-js@1.2.3' },
}));

const detokenizeRecords = [{ token: 'token1' }, { token: 'token2' }];

// flowDB POST /v2/tokens/detokenize response ({ response: [...] } with inline per-token errors)
const flowDBDetokenizeSuccess = {
  response: [
    { token: 'token1', value: 'Bata Gali', tokenGroupName: 'nondet_reg', error: null, httpCode: 200 },
    { token: 'token2', value: 'Deoria', tokenGroupName: 'nondet_reg', error: null, httpCode: 200 },
  ],
};
const flowDBDetokenizePartial = {
  response: [
    { token: 'token1', value: 'Bata Gali', error: null, httpCode: 200 },
    { token: 'token2', value: null, tokenGroupName: null, error: 'token not found', httpCode: 404 },
  ],
};

describe('flowDB detokenize via skyflow-frame-controller', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({ on, emit: emitSpy });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  const triggerController = (clientReq) => {
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(
      () => ({ ...clientData.client, request: clientReq, toJSON: toJson }),
    );
    SkyflowFrameController.init();
    const emitCb = emitSpy.mock.calls[0][2];
    emitCb(clientData);
    return (eventPrefix) => {
      const call = on.mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].startsWith(eventPrefix),
      );
      return call && call[1];
    };
  };

  test('DETOKENIZE resolves flowDB records via a single POST /v2/tokens/detokenize', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(flowDBDetokenizeSuccess));
    const onCb = triggerController(clientReq)(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST);

    const cb = jest.fn();
    onCb({ type: PUREJS_TYPES.DETOKENIZE, records: detokenizeRecords }, cb);

    setTimeout(() => {
      // batch request, not per-token fan-out
      expect(clientReq).toHaveBeenCalledTimes(1);
      const call = clientReq.mock.calls[0][0];
      expect(call.requestMethod).toBe('POST');
      expect(call.url).toBe('https://testurl.com/v2/tokens/detokenize');
      expect(JSON.parse(call.body)).toEqual({
        vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
        tokens: ['token1', 'token2'],
      });

      const result = cb.mock.calls[0][0];
      expect(result.records).toEqual([
        { token: 'token1', value: 'Bata Gali', tokenGroupName: 'nondet_reg' },
        { token: 'token2', value: 'Deoria', tokenGroupName: 'nondet_reg' },
      ]);
      expect(result.records[0].valueType).toBeUndefined();
      done();
    }, 1000);
  });

  test('DETOKENIZE surfaces partial inline errors through the callback', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(flowDBDetokenizePartial));
    const onCb = triggerController(clientReq)(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST);

    const cb = jest.fn();
    onCb({ type: PUREJS_TYPES.DETOKENIZE, records: detokenizeRecords }, cb);

    setTimeout(() => {
      const result = cb.mock.calls[0][0];
      expect(result.error.records).toEqual([{ token: 'token1', value: 'Bata Gali' }]);
      expect(result.error.errors).toEqual([
        { token: 'token2', error: { code: 404, description: 'token not found' } },
      ]);
      done();
    }, 1000);
  });

  test('REVEAL resolves flowDB client shape (token only, no valueType)', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(flowDBDetokenizeSuccess));
    const onCb = triggerController(clientReq)(ELEMENT_EVENTS_TO_IFRAME.REVEAL_CALL_REQUESTS);

    const cb = jest.fn();
    onCb(
      { type: REVEAL_TYPES.REVEAL, records: detokenizeRecords, containerId: 'container1' },
      cb,
    );

    setTimeout(() => {
      expect(clientReq).toHaveBeenCalledTimes(1);
      expect(clientReq.mock.calls[0][0].url).toBe('https://testurl.com/v2/tokens/detokenize');
      const result = cb.mock.calls[0][0];
      expect(result.records).toEqual([
        { token: 'token1', tokenGroupName: 'nondet_reg', httpCode: 200 },
        { token: 'token2', tokenGroupName: 'nondet_reg', httpCode: 200 },
      ]);
      expect(result.records[0].value).toBeUndefined();
      // iframe payload emitted on the REVEAL_RESPONSE_READY channel
      const emittedReadyEvent = emitSpy.mock.calls.find(
        (c) => typeof c[0] === 'string'
          && c[0].startsWith(ELEMENT_EVENTS_TO_IFRAME.REVEAL_RESPONSE_READY),
      );
      expect(emittedReadyEvent).toBeDefined();
      done();
    }, 1000);
  });
});
