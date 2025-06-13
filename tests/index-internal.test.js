/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { FrameController } from './../src/core/internal';
import FrameElementInit from './../src/core/internal/frame-element-init';
import RevealFrame from './../src/core/internal/reveal/reveal-frame';
import SkyflowFrameController from './../src/core/internal/skyflow-frame/skyflow-frame-controller';
import {
    FRAME_ELEMENT,
    FRAME_REVEAL,
    SKYFLOW_FRAME_CONTROLLER,
  } from './../src/core/constants';

jest.mock('framebus')
jest.mock('jquery-mask-plugin/dist/jquery.mask.min')
jest.mock('jss-preset-default')

describe('test index-internal', () => {
  beforeEach(() => {
    jest.resetModules();
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

  test('test init collect FrameElement with proper name values', () => {
    let windowSpy = jest.spyOn(global, 'window', 'get');
    windowSpy.mockImplementation(() => ({
        name: `${FRAME_ELEMENT}:group:ERROR`,
        location: {
            origin: ''
        },
        addEventListener: jest.fn()
    }));

    const mock = jest.fn()
    jest.mock( './../src/core/internal/frame-element-init', () => {
        return {
            startFrameElement: mock
        }
    })
    try {
      const init = require('./../src/index-internal')
    } catch(er) {}
    expect(mock).toHaveBeenCalledTimes(1);
})

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
      jest.mock( './../src/core/internal/frame-element-init.ts', () => {
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
      name: `${FRAME_REVEAL}:${btoa('{test: demo}')}:ERROR`,
      location: {
        origin: '',
      },
      addEventListener: jest.fn(),
    }));

    const mock = jest.fn();
    jest.mock('./../src/core/internal/reveal/reveal-frame', () => {
      return {
      init: mock,
    }});

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  test('test init reveal FrameElement without btoa', () => {
    const windowSpy = jest.spyOn(global, 'window', 'get');
    windowSpy.mockImplementation(() => ({
      name: `${FRAME_REVEAL}:ERROR`,
      location: {
        origin: '',
      },
      addEventListener: jest.fn(),
    }));

    const mock = jest.fn();
    jest.mock('./../src/core/internal/reveal/reveal-frame', () => {
      return {
      init: mock,
    }});

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
