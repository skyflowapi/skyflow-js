/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { FrameController } from './../src/core/internal';
import FrameElements from './../src/core/internal/frame-elements';
import RevealFrame from './../src/core/internal/reveal/reveal-frame';
import RevealFrameController from './../src/core/internal/reveal/reveal-frame-controller';
import SkyflowFrameController from './../src/core/internal/skyflow-frame/skyflow-frame-controller';
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
    jest.mock('./../src/core/internal/reveal/reveal-frame-controller', () => ({
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
    jest.mock('./../src/core/internal/skyflow-frame/skyflow-frame-controller', () => ({
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
      jest.mock( './../src/core/internal/frame-elements', () => {
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
    jest.mock('./../src/core/internal/reveal/reveal-frame', () => ({
      init: mock,
    }));

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
