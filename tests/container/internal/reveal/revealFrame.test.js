import bus from "framebus";
import  getCssClassesFromJss  from "../../../../src/libs/jss-styles";
import { RedactionType } from "../../../../src/Skyflow";
import RevealFrame from "../../../../src/container/internal/reveal/RevealFrame";

const testRecord = {
  token: "1677f7bd-c087-4645-b7da-80a6fd1a81a4",
  redaction: RedactionType.DEFAULT,
  label: "date_of_birth",
  styles: {
    base: {
      color: "#ef3214",
      fontSize: 20,
    },
  },
};
const _on = jest.fn();
const _emit = jest.fn();
bus.target = jest.fn().mockReturnValue({
  on: _on,
});
bus.emit = _emit;

describe("Reveal Frame Class ", () => {
  test("init method should emit an event", () => {
    RevealFrame.init();
    expect(_emit).toBeCalledTimes(1);
  });
  test("constructor should create Span Element with recordId", () => {
    const frame = new RevealFrame(testRecord, { logLevel: 'PROD' });
    const testSpanEle = document.querySelector("span");
    expect(testSpanEle).toBeTruthy();
    // expect(testSpanEle?.innerText).toBe(testRecord.id);
    const expectedClassName = getCssClassesFromJss(
      testRecord.styles,
      btoa(testRecord.label || testRecord.id)
    )["base"];
    // expect(testSpanEle?.classList.contains(expectedClassName)).toBe(true);
    expect(_on).toHaveBeenCalledTimes(2);
  });
});
