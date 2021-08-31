import {
  COLLECT_FRAME_CONTROLLER,
  ELEMENT_EVENTS_TO_IFRAME,
} from "../../../src/container/constants";
import CollectContainer from "../../../src/container/external/CollectContainer";

const bus = require("framebus");

const _off = jest.fn();
const _target = jest.fn();
const getBearerToken = jest.fn().mockImplementation(() => Promise.resolve());

const _on = jest.fn().mockImplementation((data, callback) => {
  if (data.includes(ELEMENT_EVENTS_TO_IFRAME.FRAME_READY)) {
    let id = data.substring(11);
    callback({ name: COLLECT_FRAME_CONTROLLER + id }, (req) => {});
  }
  if (data.includes(ELEMENT_EVENTS_TO_IFRAME.GET_ACCESS_TOKEN)) {
    callback({}, () => {});
  }
});
bus.target = jest.fn().mockReturnValue({
  on: _on,
  off: _off,
});

const metaData = {
  uuid: "123",
  config: {
    vaultId: "vault123",
    vaultUrl: "sb.vault.dev",
    getBearerToken,
  },
  metaData: {
    clientDomain: "http://abc.com",
  },
  clientJSON: {
    config: {
      getBearerToken,
    },
  },
};

const cvvElement = {
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

describe("Collect container", () => {
  it("contructor", async () => {
    let container = new CollectContainer({}, metaData);
    await new Promise((r) => setTimeout(r, 2000));
    expect(document.querySelector("iframe")).toBeTruthy();
    expect(_on).toHaveBeenCalledTimes(2);
  });

  it("Invalid element type", () => {
    let container = new CollectContainer({}, metaData);
    try {
      let cvv = container.create({ ...cvvElement, type: "abc" });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("Invalid table", () => {
    let container = new CollectContainer({}, metaData);
    try {
      let cvv = container.create({
        ...cvvElement,
        table: undefined,
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("Invalid column", () => {
    let container = new CollectContainer({}, metaData);
    try {
      let cvv = container.create({
        ...cvvElement,
        column: undefined,
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("create valid Element", () => {
    let container = new CollectContainer({}, metaData);
    let cvv;
    try {
      cvv = container.create(cvvElement);
    } catch (err) {}

    expect(cvv.elementType).toBe("CVV");
  });

  // it("create duplicate fields", () => {
  //   let container = new CollectContainer({}, metaData);
  //   let cvv;
  //   try {
  //     let field1 = container.create(cvvElement);
  //     let field2 = container.create(cvvElement);
  //   } catch (err) {
  //     console.log(err)
  //   }

  // });
});
