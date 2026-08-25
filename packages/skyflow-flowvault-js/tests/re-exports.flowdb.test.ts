/*
Copyright (c) 2025 Skyflow, Inc.
*/
// flowvault re-export / thin-subclass surface. These modules either re-export a
// variant-neutral @core default verbatim (so the package's own import paths stay
// stable) or bind a @core base class to flowDB's token-only reveal-input shape.
// Importing each executes its declaration; the assertions pin the identity /
// prototype chain that the split relies on.
import ComposableCollectElement from '../src/external/collect/compose-collect-element';
import CoreComposableCollectElement from '@core/external/collect/composable-collect-element';
import SkyflowContainer from '../src/external/skyflow-container';
import CoreSkyflowContainer from '@core/external/skyflow-container';
import RevealFrame from '../src/internal/reveal/reveal-frame';
import CoreRevealFrame from '@core/internal/reveal/reveal-frame';
import RevealElement from '../src/external/reveal/reveal-element';
import CoreRevealElement from '@core/external/reveal/reveal-element';
import ComposableRevealElement from '../src/external/reveal/composable-reveal-element';
import CoreComposableRevealElement from '@core/external/reveal/composable-reveal-element';
import ComposableRevealInternalElement from '../src/external/reveal/composable-reveal-internal';
import CoreComposableRevealInternalElement from '@core/external/reveal/composable-reveal-internal';
import * as coreLogsHelper from '@core/utils/logs-helper';
import {
  printLog, parameterizedString, getElementName, LogLevelOptions, EnvOptions,
} from '../src/utils/logs-helper';
import { UpdateType } from '../src/utils/common';

describe('pure @core re-exports (identity preserved)', () => {
  test('compose-collect-element re-exports the @core default', () => {
    expect(ComposableCollectElement).toBe(CoreComposableCollectElement);
  });

  test('skyflow-container re-exports the @core default', () => {
    expect(SkyflowContainer).toBe(CoreSkyflowContainer);
  });

  test('reveal-frame re-exports the @core default', () => {
    expect(RevealFrame).toBe(CoreRevealFrame);
  });
});

describe('logs-helper re-exports the variant-neutral @core helpers', () => {
  test('binds printLog / parameterizedString / getElementName from @core', () => {
    expect(printLog).toBe(coreLogsHelper.printLog);
    expect(parameterizedString).toBe(coreLogsHelper.parameterizedString);
    expect(getElementName).toBe(coreLogsHelper.getElementName);
  });

  test('binds the LogLevelOptions / EnvOptions maps from @core', () => {
    expect(LogLevelOptions).toBe(coreLogsHelper.LogLevelOptions);
    expect(EnvOptions).toBe(coreLogsHelper.EnvOptions);
  });
});

describe('reveal element subclasses bind the @core bases', () => {
  test('RevealElement extends the @core reveal element', () => {
    expect(Object.getPrototypeOf(RevealElement)).toBe(CoreRevealElement);
  });

  test('ComposableRevealElement extends the @core composable reveal element', () => {
    expect(Object.getPrototypeOf(ComposableRevealElement)).toBe(CoreComposableRevealElement);
  });

  test('ComposableRevealInternalElement extends the @core composable reveal-internal element', () => {
    expect(Object.getPrototypeOf(ComposableRevealInternalElement))
      .toBe(CoreComposableRevealInternalElement);
  });
});

describe('UpdateType enum (flowDB-specific)', () => {
  test('exposes exactly UPDATE and REPLACE', () => {
    expect(UpdateType.UPDATE).toBe('UPDATE');
    expect(UpdateType.REPLACE).toBe('REPLACE');
    expect(Object.values(UpdateType)).toEqual(['UPDATE', 'REPLACE']);
  });
});
