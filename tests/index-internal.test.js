/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { FrameController } from './../src/core/internal';
import FrameElementInit from './../src/core/internal/frame-element-init';
import RevealFrame from './../src/core/internal/reveal/reveal-frame';
import SkyflowFrameController from './../src/core/internal/skyflow-frame/skyflow-frame-controller';
import {
  COMPOSABLE_REVEAL,
    FRAME_ELEMENT,
    FRAME_REVEAL,
    SKYFLOW_FRAME_CONTROLLER,
  } from './../src/core/constants';

jest.mock('framebus')
jest.mock('jss-preset-default')

describe('test index-internal', () => {
  let origName;
  beforeEach(() => {
    jest.resetModules();
    origName = window.name;
  });
  afterEach(() => {
    window.name = origName;
  });

  test('test init SkyflowFrameController', () => {
    window.name = `${SKYFLOW_FRAME_CONTROLLER}`;

    const mock = jest.fn();
    jest.mock('./../src/core/internal/skyflow-frame/skyflow-frame-controller', () => ({
      init: mock,
    }));

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  test('test init collect FrameElement with proper name values', () => {
    window.name = `${FRAME_ELEMENT}:group:ERROR`;

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
    window.name = `${FRAME_ELEMENT}:ERROR`;

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
    window.name = `${FRAME_REVEAL}:${btoa('{test: demo}')}:ERROR`;

    const mock = jest.fn();
    jest.mock('./../src/core/internal/reveal/reveal-frame', () => {
      return {
      init: mock,
    }});

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  test('test init reveal FrameElement without btoa', () => {
    window.name = `${FRAME_REVEAL}:ERROR`;

    const mock = jest.fn();
    jest.mock('./../src/core/internal/reveal/reveal-frame', () => {
      return {
      init: mock,
    }});

    const init = require('./../src/index-internal');
    expect(mock).toHaveBeenCalledTimes(1);
  });
  test('test init reveal composable FrameElement without btoa', () => {
    window.name = `${COMPOSABLE_REVEAL}:${btoa('{test: demo}')}:ERROR`;

    const mock = jest.fn();
    // For composable reveal frames, index-internal calls static startFrameElement()
    // on the default export class. Mock the module with a class exposing that static.
    jest.mock('./../src/core/internal/composable-frame-element-init.ts', () => ({
      __esModule: true,
      default: class MockComposableRevealInit {
        static startFrameElement() { mock(); }
      },
    }));

    try {
      require('./../src/index-internal');
    } catch (err) {
      // The test should not throw; if it does, surface for debugging.
      // Fail explicitly to aid diagnosis instead of swallowing silently.
      throw err;
    }
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
