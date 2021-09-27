import EventEmitter from '../../src/event-emitter/index';

describe('Event emitter test', () => {
  const eventObj = new EventEmitter();
  eventObj.on(
    'Change',
    () => {
      console.log(' Change event');
    },
    false,
  );

  eventObj.on(
    'Ready',
    () => {
      console.log('Ready event');
    },
    false,
  );

  eventObj.on(
    'Focus',
    () => {
      console.log('Focus');
    },
    false,
  );

  /**
   * off event
   */
  test('test off() event ', () => {
    eventObj.off('Focus', () => {});
    expect(eventObj.hasListener('Focus')).toBe(false);
  });
  test('test haslistener() ', () => {
    expect(eventObj.hasListener('Change')).toBe(true);
  });

  test('test no existing events', () => {
    expect(eventObj.hasListener('Escape')).toBe(false);
  });

  /**
   * _emit testing
   */
  jest.spyOn(eventObj, '_emit');
  test('event emitter test', () => {
    eventObj._emit('event2');
    expect(eventObj._emit).toHaveBeenCalledTimes(1);
  });
  /**
   * testing create child method
   */
  test('should ', () => {
    const mockStaticF = jest.fn().mockReturnValue('worked');
    EventEmitter.createChild = mockStaticF;
    mockStaticF();
    expect(mockStaticF).toHaveBeenCalledTimes(1);
  });
  /**
   * resetEvents test
   */
  test('should resetAll events', () => {
    const eventObjReset = new EventEmitter();
    eventObjReset.on(
      'Ready',
      () => {
        console.log('Ready event');
      },
      false,
    );
    eventObjReset.resetEvents();
    expect(eventObjReset.hasListener('Ready')).toBe(false);
  });
});
