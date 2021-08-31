import Element from "../../../../src/container/external/element";

const bus = require("framebus");

const _on = jest.fn();
const _off = jest.fn();
const _target = jest.fn();

bus.target = jest.fn().mockReturnValue({
  on: _on,
  off: _off,
});

const input = {
  table: "pii_fields",
  column: "primary_card.cvv",
  styles: {
    base: {
      color: "#1d1d1d",
    },
  },
  placeholder: "cvv",
  label: "cvv",
  type: "CVV",
};

const rows = [
  {
    elements: [
      {
        elementType: input.type,
        name: input.column,
        ...input,
      },
    ],
  },
];

const destroyCallback = jest.fn();
const updateCallback = jest.fn();

describe("collect element", () => {
  it("constructor", async () => {
    const element = new Element(
      { rows },
      {},
      "containerId",
      true,
      destroyCallback,
      updateCallback
    );

    expect(element.elementType).toBe(input.type);
  });

  it("get options", async () => {
    const element = new Element(
      { rows },
      {},
      "containerId",
      true,
      destroyCallback,
      updateCallback
    );

    const options = element.getOptions();
    expect(options.name).toBe(input.column);
  });
});
