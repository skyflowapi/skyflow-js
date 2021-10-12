import EventEmitter from '../../src/event-emitter/index';

describe('Event emitter test', () => {
  const eventObj = new EventEmitter();
  eventObj.on(
    'CHANGE',
    () => {
      console.log(' Change event');
    },
    false,
  );

  eventObj.on(
    'READY',
    () => {
      console.log('Ready event');
    },
    false,
  );

  eventObj.on(
    'FOCUS',
    () => {
      console.log('Focus');
    },
    false,
  );

  /**
   * off event
   */
  test('test off() event ', () => {
    eventObj.off('FOCUS', () => {});
    expect(eventObj.hasListener('FOCUS')).toBe(false);
  });
  test('test haslistener() ', () => {
    expect(eventObj.hasListener('CHANGE')).toBe(true);
  });

  test('test no existing events', () => {
    expect(eventObj.hasListener('ESCAPE')).toBe(false);
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
      'READY',
      () => {
        console.log('Ready event');
      },
      false,
    );
    eventObjReset.resetEvents();
    expect(eventObjReset.hasListener('READY')).toBe(false);
  });
});
