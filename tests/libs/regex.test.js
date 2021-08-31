import { regExFromString } from "../../src/libs/regex";

describe("construct regex", () => {
  it("construct regex", () => {
    const regEx = regExFromString("/[A-Z]/");
    expect(typeof regEx).toBe("object");
  });
});
