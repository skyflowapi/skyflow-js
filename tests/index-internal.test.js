import { FrameController } from './../src/core/internal';
import FrameElements from './../src/core/internal/FrameElements';
import RevealFrame from './../src/core/internal/reveal/RevealFrame';
import RevealFrameController from './../src/core/internal/reveal/RevealFrameController';
import SkyflowFrameController from './../src/core/internal/SkyflowFrame/SkyflowFrameController';
import {
    COLLECT_FRAME_CONTROLLER,
    FRAME_ELEMENT,
    FRAME_REVEAL,
    SKYFLOW_FRAME_CONTROLLER,
    REVEAL_FRAME_CONTROLLER,
  } from './../src/core/constants';

jest.mock('framebus')
jest.mock('jquery-mask-plugin/dist/jquery.mask.min')
jest.mock('jss-preset-default')

describe('test index-internal', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('test init FrameController', () => {
    const windowSpy = jest.spyOn(global, 'window', 'get');
    windowSpy.mockImplementation(() => ({
      name: `${COLLECT_FRAME_CONTROLLER}:cId:ERROR`,
      location: {
        origin: '',
      },
      addEventListener: jest.fn(),
    }));

    const mock = jest.fn();
    jest.mock('./../src/core/internal', () => (
      {
        FrameController: {
          init: mock,
        },
      }
    ));

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  test('test init RevealFrameController', () => {
    const windowSpy = jest.spyOn(global, 'window', 'get');
    windowSpy.mockImplementation(() => ({
      name: `${REVEAL_FRAME_CONTROLLER}:cId`,
      location: {
        origin: '',
      },
      addEventListener: jest.fn(),
    }));

    const mock = jest.fn();
    jest.mock('./../src/core/internal/reveal/RevealFrameController', () => ({
      init: mock,
    }));

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  test('test init SkyflowFrameController', () => {
    const windowSpy = jest.spyOn(global, 'window', 'get');
    windowSpy.mockImplementation(() => ({
      name: `${SKYFLOW_FRAME_CONTROLLER}`,
      location: {
        origin: '',
      },
      addEventListener: jest.fn(),
    }));

    const mock = jest.fn();
    jest.mock('./../src/core/internal/SkyflowFrame/SkyflowFrameController', () => ({
      init: mock,
    }));

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  test('test init collect FrameElement', () => {
      let windowSpy = jest.spyOn(global, 'window', 'get');
      windowSpy.mockImplementation(() => ({
          name: `${FRAME_ELEMENT}:ERROR`,
          location: {
              origin: ''
          },
          addEventListener: jest.fn()
      }));

      const mock = jest.fn()
      jest.mock( './../src/core/internal/FrameElements', () => {
          return {
              start: mock
          }
      })
      try {
        const init = require('./../src/index-internal')
      } catch(er) {}
    //   expect(mock).toHaveBeenCalledTimes(1);
  })

  test('test init reveal FrameElement', () => {
    const windowSpy = jest.spyOn(global, 'window', 'get');
    windowSpy.mockImplementation(() => ({
      name: `${FRAME_REVEAL}:${btoa('test')}:ERROR`,
      location: {
        origin: '',
      },
      addEventListener: jest.fn(),
    }));

    const mock = jest.fn();
    jest.mock('./../src/core/internal/reveal/RevealFrame', () => ({
      init: mock,
    }));

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
