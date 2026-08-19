/*
  Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB composable reveal container tests. The shared reveal() orchestration is
// covered by the @core suite; here we assert the flowDB divergence injected into
// the subclass: create() builds this package's ComposableRevealElement,
// instantiateInternalElement builds the token-only internal element,
// validateRecords/validateOptions run the flowDB validators, revealExtraData
// forwards the reveal options into the frame payload, and handleRevealResponse
// maps a full failure ({ error }) to SkyflowFlowDBError while resolving on success.
import SkyflowError from '@core/errors';
import { LogLevel, Env, Context } from '../../../../src/utils/common';
import ComposableRevealContainer from '../../../../src/external/reveal/composable-reveal-container';
import ComposableRevealElement from '../../../../src/external/reveal/composable-reveal-element';
import ComposableRevealInternalElement from '../../../../src/external/reveal/composable-reveal-internal';
import SkyflowFlowDBError from '../../../../src/libs/skyflow-flowdb-error';
import { ContainerType } from '../../../../src/skyflow';
import { Metadata } from '../../../../src/internal/internal-types';

jest.mock('@core/iframe-libs/iframer', () => {
  const actualModule = jest.requireActual('@core/iframe-libs/iframer');
  const mockedModule = { ...actualModule };
  mockedModule.__esModule = true;
  mockedModule.getIframeSrc = jest.fn(() => 'https://google.com');
  return mockedModule;
});

const mockUuid = '1234';
jest.mock('@core/libs/uuid', () => ({
  __esModule: true,
  default: jest.fn(() => mockUuid),
}));

const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve('token'));

const metaData: Metadata = {
  uuid: '123',
  sdkVersion: '',
  sessionId: '1234',
  clientDomain: 'http://abc.com',
  containerType: ContainerType.COMPOSE_REVEAL,
  clientJSON: {
    config: {
      vaultID: 'vault123',
      vaultURL: 'https://sb.vault.dev',
      getBearerToken,
    },
    metaData: {
      uuid: '123',
      clientDomain: 'http://abc.com',
    },
  },
  getSkyflowBearerToken: getBearerToken,
  skyflowContainer: {
    isControllerFrameReady: true,
  } as any,
};

const context: Context = { logLevel: LogLevel.ERROR, env: Env.PROD };
const options = { layout: [1] };

describe('flowDB composable reveal container', () => {
  it('constructs a ComposableRevealContainer', () => {
    const container = new ComposableRevealContainer(metaData, context, options);
    expect(container).toBeInstanceOf(ComposableRevealContainer);
  });

  // create() delegates to the base buildComposableRevealElement and returns this
  // package's ComposableRevealElement.
  it('create() returns a ComposableRevealElement', () => {
    const container = new ComposableRevealContainer(metaData, context, options);
    const element = container.create({ token: '1815-6223-1073-1425' });
    expect(element).toBeInstanceOf(ComposableRevealElement);
  });

  // instantiateInternalElement builds the token-only internal element.
  it('instantiateInternalElement builds a ComposableRevealInternalElement', () => {
    const container = new ComposableRevealContainer(metaData, context, options);
    const internal = (container as any).instantiateInternalElement('el-1', {});
    expect(internal).toBeInstanceOf(ComposableRevealInternalElement);
  });

  // validateRecords runs the flowDB token-only reveal-record validator.
  describe('validateRecords (token-only)', () => {
    const container = new ComposableRevealContainer(metaData, context, options);
    const validate = (records: any[]) => (container as any).validateRecords(records);

    it('accepts a valid token record', () => {
      expect(() => validate([{ token: '1815-6223-1073-1425' }])).not.toThrow();
    });

    it('throws when the token key is missing', () => {
      expect(() => validate([{ label: 'x' }])).toThrow(SkyflowError);
    });
  });

  // validateOptions runs the flowDB tokenGroupRedactions validator.
  describe('validateOptions (tokenGroupRedactions)', () => {
    const container = new ComposableRevealContainer(metaData, context, options);
    const validate = (opts?: any) => (container as any).validateOptions(opts);

    it('is a no-op when options are absent', () => {
      expect(() => validate(undefined)).not.toThrow();
    });

    it('throws when tokenGroupRedactions is not an array', () => {
      expect(() => validate({ tokenGroupRedactions: 'nope' })).toThrow(SkyflowError);
    });
  });

  // revealExtraData forwards the reveal options into the frame payload.
  it('revealExtraData wraps the options under { options }', () => {
    const container = new ComposableRevealContainer(metaData, context, options);
    const revealOptions = { tokenGroupRedactions: [{ tokenGroupName: 'g', redaction: 'MASKED' }] };
    expect((container as any).revealExtraData(revealOptions)).toEqual({ options: revealOptions });
  });

  // handleRevealResponse: a full failure ({ error }) rejects with SkyflowFlowDBError;
  // otherwise it resolves with the reveal data.
  describe('handleRevealResponse', () => {
    it('rejects a full failure ({ error }) as SkyflowFlowDBError', () => {
      const container = new ComposableRevealContainer(metaData, context, options);
      const resolve = jest.fn();
      const reject = jest.fn();
      (container as any).handleRevealResponse({ error: { message: 'boom' } }, resolve, reject);
      expect(resolve).not.toHaveBeenCalled();
      expect(reject).toHaveBeenCalledTimes(1);
      expect(reject.mock.calls[0][0]).toBeInstanceOf(SkyflowFlowDBError);
    });

    it('resolves the reveal data on success', () => {
      const container = new ComposableRevealContainer(metaData, context, options);
      const resolve = jest.fn();
      const reject = jest.fn();
      const data = { success: [{ token: 't1' }] };
      (container as any).handleRevealResponse(data, resolve, reject);
      expect(reject).not.toHaveBeenCalled();
      expect(resolve).toHaveBeenCalledWith(data);
    });
  });
});
