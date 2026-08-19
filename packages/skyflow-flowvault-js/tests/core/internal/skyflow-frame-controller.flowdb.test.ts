/*
  Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB skyflow-frame controller tests. The shared bus topology + tokenize/
// revealData skeleton live in @core (CoreSkyflowFrameController) and are covered by
// the skyflow-js suite; here we assert only the flowDB API-call divergence injected
// into the subclass: init(), the telemetry identity (getSdkNameAndVersion), the
// error-envelope shape (wrapCallbackError, both branches), the reveal fetch/format
// delegation, and the flowDB collect send path (sendCollectRequest, every branch).
import bus from 'framebus';

// Mock the flowDB api-utils BEFORE importing the controller so its internal
// references bind to the mocks. Reveal is delegated straight through; collect is
// driven branch-by-branch via sendCollectRequest.
jest.mock('../../../src/api-utils/collect', () => ({
  __esModule: true,
  constructElementsInsertReq: jest.fn(() => [{ records: [] }, { updateRecords: [] }]),
  constructFlowDBInsertRequest: jest.fn(() => ({ vaultID: 'vault123', records: [] })),
  constructFlowDBUpdateRequest: jest.fn(() => ({ vaultID: 'vault123', updateRecords: [] })),
  insertDataInCollectFlowDB: jest.fn(() => Promise.resolve({ records: [{ id: 'ins1' }] })),
  updateDataInCollectFlowDB: jest.fn(() => Promise.resolve({ records: [{ id: 'upd1' }] })),
  mergeFlowDBCollectResponses: jest.fn(() => ({ records: [{ id: 'merged' }] })),
}));

jest.mock('../../../src/api-utils/reveal', () => ({
  __esModule: true,
  fetchRecordsByTokenIdFlowDB: jest.fn(() => Promise.resolve({ records: [{ token: 't1' }] })),
  formatRecordsForClientFlowDB: jest.fn((result) => ({ formatted: true, ...result })),
}));

jest.mock('@core/utils/bus-events', () => ({
  ...jest.requireActual('@core/utils/bus-events'),
  getAccessToken: jest.fn(() => Promise.resolve('access-token')),
}));

import * as busEvents from '@core/utils/bus-events';
import SkyflowFrameController from '../../../src/internal/skyflow-frame/skyflow-frame-controller';
import {
  constructElementsInsertReq,
  constructFlowDBInsertRequest,
  mergeFlowDBCollectResponses,
} from '../../../src/api-utils/collect';
import {
  fetchRecordsByTokenIdFlowDB,
  formatRecordsForClientFlowDB,
} from '../../../src/api-utils/reveal';

const nodeCrypto = require('crypto');
Object.defineProperty(window, 'crypto', {
  configurable: true,
  value: { getRandomValues: (arr: any) => nodeCrypto.randomFillSync(arr) },
});

const flowDBClient = {
  config: { vaultID: 'vault123', vaultURL: 'https://vault.test.com' },
  toJSON: () => ({ metaData: { uuid: 'client-uuid' } }),
};

// init() drives the base constructor, which wires bus listeners + emits the
// readiness handshake. We stub bus.target so those emits are inert, then set the
// resolved client/context directly to exercise the hooks in isolation.
const makeController = (): any => {
  const controller: any = SkyflowFrameController.init('client-1');
  controller.client = flowDBClient;
  controller.context = { logLevel: 4 };
  return controller;
};

describe('flowDB SkyflowFrameController', () => {
  beforeEach(() => {
    window.name = 'controller:frameId:Y2xpZW50RG9tYWlu:true';
    jest.spyOn(bus, 'target').mockReturnValue({
      on: jest.fn(),
      emit: jest.fn(),
    } as any);
    jest.spyOn(bus, 'on').mockReturnValue(bus as any);
    (busEvents.getAccessToken as jest.Mock).mockImplementation(() => Promise.resolve('access-token'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('init() returns a SkyflowFrameController instance', () => {
    const controller = SkyflowFrameController.init('client-1');
    expect(controller).toBeInstanceOf(SkyflowFrameController);
  });

  it('init() defaults the clientId when none is supplied', () => {
    const controller = SkyflowFrameController.init();
    expect(controller).toBeInstanceOf(SkyflowFrameController);
  });

  it('exposes the flowDB collect/reveal flags', () => {
    const controller = makeController();
    expect(controller.collectsCVV).toBe(true);
    expect(controller.revealResolvesPartialFailure).toBe(true);
  });

  it('getSdkNameAndVersion delegates to the flowDB telemetry helper', () => {
    const controller = makeController();
    const info = controller.getSdkNameAndVersion('skyflow-flowvault-js@1.0.0');
    expect(info).toHaveProperty('sdkName');
    expect(info).toHaveProperty('sdkVersion');
  });

  // wrapCallbackError: an already-enveloped body ({ error }) is forwarded as-is;
  // anything else is wrapped under { error }.
  describe('wrapCallbackError', () => {
    it('forwards an already-enveloped error as-is', () => {
      const controller = makeController();
      const enveloped = { error: { code: 400, message: 'boom' } };
      expect(controller.wrapCallbackError(enveloped)).toBe(enveloped);
    });

    it('wraps a bare error under { error }', () => {
      const controller = makeController();
      const bare = 'plain-message';
      expect(controller.wrapCallbackError(bare)).toEqual({ error: 'plain-message' });
    });
  });

  it('fetchRevealRecords delegates to fetchRecordsByTokenIdFlowDB', async () => {
    const controller = makeController();
    const records = [{ token: 't1' }];
    const options = { tokenGroupRedactions: [] };
    const result = await controller.fetchRevealRecords(records, options);
    expect(fetchRecordsByTokenIdFlowDB).toHaveBeenCalledWith(records, controller.client, options);
    expect(result).toEqual({ records: [{ token: 't1' }] });
  });

  it('formatRevealForClient delegates to formatRecordsForClientFlowDB', () => {
    const controller = makeController();
    const raw = { records: [{ token: 't1' }] };
    const formatted = controller.formatRevealForClient(raw);
    expect(formatRecordsForClientFlowDB).toHaveBeenCalledWith(raw);
    expect(formatted).toEqual({ formatted: true, records: [{ token: 't1' }] });
  });

  // sendCollectRequest: build the /v2 insert + update requests, fire them together,
  // merge and re-map CVV tokens. Exercised branch-by-branch via a synthetic `built`.
  describe('sendCollectRequest', () => {
    const built = { insertResponseObject: {}, updateResponseObject: {}, cvvMap: {} } as any;

    it('fires insert + update, merges, and resolves with the merged records', async () => {
      const controller = makeController();
      (constructElementsInsertReq as jest.Mock).mockReturnValueOnce([
        { records: [{ table: 'cards' }] }, { updateRecords: [{ skyflowID: 'id1' }] },
      ]);
      (mergeFlowDBCollectResponses as jest.Mock).mockReturnValueOnce({ records: [{ id: 'ok' }] });
      await expect(controller.sendCollectRequest(built, {})).resolves.toEqual({ records: [{ id: 'ok' }] });
    });

    it('resolves { records: [] } when there is nothing to insert or update', async () => {
      const controller = makeController();
      (constructElementsInsertReq as jest.Mock).mockReturnValueOnce([
        { records: [] }, { updateRecords: [] },
      ]);
      await expect(controller.sendCollectRequest(built, {})).resolves.toEqual({ records: [] });
    });

    it('rejects the merged body when it carries no records (total failure)', async () => {
      const controller = makeController();
      (constructElementsInsertReq as jest.Mock).mockReturnValueOnce([
        { records: [{ table: 'cards' }] }, { updateRecords: [] },
      ]);
      (mergeFlowDBCollectResponses as jest.Mock).mockReturnValueOnce({ error: { message: 'all failed' } });
      await expect(controller.sendCollectRequest(built, {})).rejects.toEqual({ error: { message: 'all failed' } });
    });

    it('rejects { error } when request building throws', async () => {
      const controller = makeController();
      (constructFlowDBInsertRequest as jest.Mock).mockImplementationOnce(() => {
        throw new Error('bad-request');
      });
      (constructElementsInsertReq as jest.Mock).mockReturnValueOnce([
        { records: [{ table: 'cards' }] }, { updateRecords: [] },
      ]);
      await expect(controller.sendCollectRequest(built, {})).rejects.toEqual({ error: 'bad-request' });
    });

    it('defaults the clientId to empty when the client metadata has no uuid', async () => {
      const controller = makeController();
      controller.client = { config: { vaultID: 'vault123' }, toJSON: () => ({ metaData: {} }) };
      (constructElementsInsertReq as jest.Mock).mockReturnValueOnce([
        { records: [{ table: 'cards' }] }, { updateRecords: [] },
      ]);
      (mergeFlowDBCollectResponses as jest.Mock).mockReturnValueOnce({ records: [{ id: 'ok' }] });
      await expect(controller.sendCollectRequest(built, {})).resolves.toEqual({ records: [{ id: 'ok' }] });
    });

    it('rejects when the access-token fetch fails', async () => {
      const controller = makeController();
      (constructElementsInsertReq as jest.Mock).mockReturnValueOnce([
        { records: [{ table: 'cards' }] }, { updateRecords: [] },
      ]);
      (busEvents.getAccessToken as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('token-fail')));
      await expect(controller.sendCollectRequest(built, {})).rejects.toThrow('token-fail');
    });
  });
});
