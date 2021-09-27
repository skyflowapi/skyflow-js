import bus from 'framebus';
import Bus from '../../src/libs/Bus';

describe('bus test', () => {
  const busObj = new Bus();
  busObj.on('onChange', () => {
    console.log('onChange Event');
  });
  busObj.on('focusin', () => {
    console.log('focusin Event');
  });
  busObj.on('focusOut', () => {
    console.log('focusOut Event');
  });

  /**
   * test onChange event using hasListener()
   */
  test('test onChange event ', () => {
    expect(busObj.hasListener('onChange')).toBe(true);
  });

  /**
   * remove event focusOut
   */
  test('test off() event method ', () => {
    busObj.off('focusOut', () => {});
    expect(busObj.hasListener('focusOut')).toBe(false);
  });

  /**
   * emit method testing
   */
  jest.spyOn(busObj, 'emit');
  test('event emitter test', () => {
    busObj.emit('event2');
    expect(busObj.emit).toHaveBeenCalledTimes(1);
  });

  /**
   * teardown all events
   */
  test('should remove all the events from the  event Object', () => {
    const busEventObj = new Bus();
    busEventObj.on(
      'Ready',
      () => {
        console.log('Ready event');
      },
    );
    busEventObj.teardown();
    expect(busEventObj.hasListener('Ready')).toBe(false);
  });
});
