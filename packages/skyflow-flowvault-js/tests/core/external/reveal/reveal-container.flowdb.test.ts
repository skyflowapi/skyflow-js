/*
  Copyright (c) 2025 Skyflow, Inc.
*/
// flowDB reveal container tests. The shared reveal()/mount() mechanics are covered
// by the @core suite; here we assert the flowDB divergence injected into the
// subclass: createRevealElement builds this package's RevealElement, validateRecords
// runs the token-only reveal-record validator, validateOptions runs the flowDB
// tokenGroupRedactions validator, and wrapRevealError maps to SkyflowFlowDBError.
import bus from 'framebus';
import SKYFLOW_ERROR_CODE from '@core/utils/constants';
import SkyflowError from '@core/errors';
import logs from '@core/utils/logs';
import { LogLevel, Env, Context } from '../../../../src/utils/common';
import RevealContainer from '../../../../src/external/reveal/reveal-container';
import RevealElement from '../../../../src/external/reveal/reveal-element';
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
  containerType: ContainerType.REVEAL,
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

describe('flowDB reveal container', () => {
  const on = jest.fn();
  let targetSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    jest.spyOn(bus, 'on');
    targetSpy.mockReturnValue({ on, off: jest.fn(), emit: jest.fn() });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('constructs a RevealContainer', () => {
    const container = new RevealContainer(metaData, context);
    expect(container).toBeInstanceOf(RevealContainer);
    expect(container).toHaveProperty('create');
    expect(container).toHaveProperty('reveal');
  });

  // create() delegates to the injected createRevealElement factory, which builds
  // this package's (token-only) RevealElement.
  it('create() returns a flowDB RevealElement', () => {
    const container = new RevealContainer(metaData, context);
    const element = container.create({ token: '1815-6223-1073-1425' });
    expect(element).toBeInstanceOf(RevealElement);
  });

  // validateRecords runs the flowDB token-only reveal-record validator.
  describe('validateRecords (token-only)', () => {
    const container = new RevealContainer(metaData, context);
    const validate = (records: any[]) => (container as any).validateRecords(records);

    it('accepts a valid token record', () => {
      expect(() => validate([{ token: '1815-6223-1073-1425' }])).not.toThrow();
    });

    it('throws on an empty records array', () => {
      expect(() => validate([])).toThrow(SkyflowError);
    });

    it('throws when the token key is missing', () => {
      expect(() => validate([{ label: 'x' }])).toThrow(SkyflowError);
    });
  });

  // validateOptions runs the flowDB tokenGroupRedactions validator.
  describe('validateOptions (tokenGroupRedactions)', () => {
    const container = new RevealContainer(metaData, context);
    const validate = (options?: any) => (container as any).validateOptions(options);

    it('is a no-op when options are absent', () => {
      expect(() => validate(undefined)).not.toThrow();
    });

    it('accepts a valid tokenGroupRedactions array', () => {
      expect(() => validate({
        tokenGroupRedactions: [{ tokenGroupName: 'g1', redaction: 'MASKED' }],
      })).not.toThrow();
    });

    it('throws when tokenGroupRedactions is not an array', () => {
      expect(() => validate({ tokenGroupRedactions: 'nope' })).toThrow(SkyflowError);
    });
  });

  // wrapRevealError maps any reveal error onto SkyflowFlowDBError.
  it('wrapRevealError maps the error to SkyflowFlowDBError', () => {
    const container = new RevealContainer(metaData, context);
    const wrapped = (container as any).wrapRevealError({ http_code: 404, message: 'Not Found' });
    expect(wrapped).toBeInstanceOf(SkyflowFlowDBError);
  });

  it('reveal() rejects when there are no reveal elements', (done) => {
    const container = new RevealContainer(metaData, context);
    container.reveal().catch((error: any) => {
      expect(error).toBeInstanceOf(SkyflowError);
      expect(error.error.code).toEqual(SKYFLOW_ERROR_CODE.NO_ELEMENTS_IN_REVEAL.code);
      expect(error.error.description).toEqual(logs.errorLogs.NO_ELEMENTS_IN_REVEAL);
      done();
    });
  });
});
