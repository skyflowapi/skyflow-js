import bus from 'framebus';
import uuid from '../../../../src/libs/uuid';
import { RedactionType } from '../../../../src/Skyflow';
import RevealFrameController from '../../../../src/container/internal/reveal/RevealFrameController';

const _on = jest.fn();
const _emit = jest.fn();
bus.target = jest.fn().mockReturnValue({
  on: _on,
});
bus.emit = _emit;

describe('RevealFrameController Class', () => {
  const testFrameController = RevealFrameController.init(uuid());
  test('init method', () => {
    expect(testFrameController).toBeInstanceOf(RevealFrameController);
    expect(_on).toBeCalledTimes(1);
    expect(_emit).toBeCalledTimes(1);
  });
  test('revealData method', () => {
    const testRevealRecords = [
      {
        id: '1677f7bd-c087-4645-b7da-80a6fd1a81a4',
        redaction: RedactionType.DEFAULT,
      },
    ];
    testFrameController.revealData(testRevealRecords);

    expect(_emit).toBeCalledTimes(2);
  });
});
