/*
Copyright (c) 2022 Skyflow, Inc.
*/
import IFrame from '../../../../src/core/external/common/iframe';

describe('Mount and Unmount Iframe', () => {
  it('mount and unmount', async () => {
    const divElement = document.createElement('div');
    divElement.setAttribute('id', 'cvv');

    const body = document.querySelector('body');
    body.append(divElement);

    const frameElement = new IFrame('frameName', {}, 'containerId');
    frameElement.mount('#cvv');

    await new Promise((r) => setTimeout(r, 2000));
    expect(document.querySelector('iframe')).toBeTruthy();

    frameElement.unmount('#cvv');

    await new Promise((r) => setTimeout(r, 2000));
    expect(document.querySelector('iframe')).toBeFalsy();
  });

  it('invalid selector', async () => {
    const frameElement = new IFrame('frameName', {}, 'containerId');
    try {
      frameElement.mount('abc');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('invalid selector with element id', async () => {
    const frameElement = new IFrame('frameName', {}, 'containerId');
    const elementId = 123;
    try {
      frameElement.mount('abc',elementId);
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
