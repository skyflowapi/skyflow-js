/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { LogLevel,Env } from "../../../../src/utils/common";
import { ELEMENT_EVENTS_TO_IFRAME, FRAME_REVEAL, ELEMENT_EVENTS_TO_CLIENT, REVEAL_TYPES, REVEAL_ELEMENT_OPTIONS_TYPES} from "../../../../src/core/constants";
import SkyflowContainer from '../../../../src/core/external/skyflow-container';
import Client from '../../../../src/client';
import EventEmitter from "../../../../src/event-emitter";
import * as busEvents from '../../../../src/utils/bus-events';
import ComposableRevealInternalElement from "../../../../src/core/external/reveal/composable-reveal-internal";

import bus from "framebus";
import { JSDOM } from 'jsdom';
import { ComposableRevealElement, EventName, RedactionType } from "../../../../src/index-node";

busEvents.getAccessToken = jest.fn(() => Promise.reject('access token'));

const mockUuid = '1234'; 
jest.mock('../../../../src/libs/uuid',()=>({
  __esModule: true,
  default:jest.fn(()=>(mockUuid)),
}));
// const _on = jest.fn();
// const _off = jest.fn();
// const _emit = jest.fn();
const getBearerToken = jest.fn();

const groupEmittFn = jest.fn();
let groupOnCb;
jest.mock('../../../../src/libs/jss-styles', () => {
  return {
    __esModule: true,
    default: jest.fn(),
    generateCssWithoutClass: jest.fn(),
    getCssClassesFromJss: jest.fn().mockReturnValue({
      base: { color: 'red' },
      global: { backgroundColor: 'black' }
    })
  };
});
jest.mock('../../../../src/core/external/skyflow-container', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  }
})

// jest.mock('../../../../src/core/external/reveal/composable-reveal-internal')

// bus.on = _on;
// bus.target = jest.fn().mockReturnValue({
//   on: _on,
// });
// bus.off = _off;
// bus.emit = _emit;

const clientDomain = "http://abc.com";
const skyflowConfig = {
  vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
  vaultURL: 'https://testurl.com',
  getBearerToken: jest.fn(),
  options: { trackMetrics: true, trackingKey: "key" }
};
let controller = new SkyflowContainer(client,{
  logLevel:LogLevel.DEBUG,
  env:Env.DEV
});

const clientData = {
  uuid: '123',
  client: {
    config: { ...skyflowConfig },
    metadata: { uuid :'123',
    skyflowContainer: controller,
  },
  },
  clientJSON:{
    context: { logLevel: LogLevel.ERROR,env:Env.PROD},
    config:{
      ...skyflowConfig,
      getBearerToken:jest.fn().toString()
    }
  },
  skyflowContainer: {
    isControllerFrameReady: true
  },
  clientDomain: clientDomain,
}
const client = new Client(clientData.client.config, clientData);

const on = jest.fn();
const off = jest.fn();
let skyflowContainer;
describe("Reveal Composable Element Class", () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
      off
    });
    const client = new Client(clientData.client.config, clientData);
    skyflowContainer = new SkyflowContainer(client, { logLevel: LogLevel.DEBUG, env: Env.PROD });
  });

  test("constructor", () => {
    const eventEmitter = new EventEmitter();
    const testRevealElement = new ComposableRevealElement(
        "name",
        eventEmitter,
        '123',
    );
    eventEmitter._emit(`${EventName.READY}:name`, {});
    expect(testRevealElement).toBeInstanceOf(ComposableRevealElement);

  });
  test("constructor when details are not passsed", () => {
    const eventEmitter = new EventEmitter();
    const testRevealElement = new ComposableRevealElement(
        undefined,
        eventEmitter,
        undefined,
    );
    eventEmitter._emit(`${EventName.READY}:name`, {});
    expect(testRevealElement).toBeInstanceOf(ComposableRevealElement);
    testRevealElement.iframeName();
    testRevealElement.getID();
  });
  test("iframe name", () => {
    const testRevealElement = new ComposableRevealElement(
        "name",
        new EventEmitter(),
        '123',
    );
    expect(testRevealElement.iframeName()).toBe('123');
  });
  test("getID", () => {
    const testRevealElement = new ComposableRevealElement(
        "name",
        new EventEmitter(),
        '123',
    );
    expect(testRevealElement.getID()).toBe('name');
  });
  test("file render call success case", async () => {
    const eventEmitter = new EventEmitter();
    const testRevealElement = new ComposableRevealElement(
        "name",
        eventEmitter,
        '123',
    );
    eventEmitter.on(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ':name', (data, cb) => {
        console.log('data', data);
        cb({ success: { skyflow_id: '1244', column: 'column' } });
    });
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
    

    const res =  testRevealElement.renderFile()
    await expect(res).resolves.toEqual({ success: { skyflow_id: '1244', column: 'column' } });
  });
  test("file render call error case 1", async () => {
    const eventEmitter = new EventEmitter();
    const testRevealElement = new ComposableRevealElement(
        "name",
        eventEmitter,
        '123',
    );
    eventEmitter.on(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ':name', (data, cb) => {
        console.log('data', data);
        cb({ errors: { skyflow_id: '1244', column: 'column', error:{
    code: 400, description: "No Records Found"
        } } });
    });
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();
    

    const res =  testRevealElement.renderFile()
    await expect(res).rejects.toEqual({"errors": {"column": "column", "error": {"code": 400, "description": "No Records Found"}, "skyflow_id": "1244"}});
  });
  test("file render call error case 2", async () => {
    const eventEmitter = new EventEmitter();
    const testRevealElement = new ComposableRevealElement(
        "name",
        eventEmitter,
        '123',
    );
    eventEmitter.on(ELEMENT_EVENTS_TO_IFRAME.RENDER_FILE_REQUEST + ':name', (data, cb) => {
        console.log('data', data);
        cb({error:
            {
            code: 400, 
            description: "No Records Found"
         } 
        });
    });
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();

    const res =  testRevealElement.renderFile()
    await expect(res).rejects.toEqual({"errors": {"code": 400, "description": "No Records Found"}});
  });
  test("update method", async () => {
    const eventEmitter = new EventEmitter();
    const testRevealElement = new ComposableRevealElement(
        "name",
        eventEmitter,
        '123',
    );
    eventEmitter.on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_ELEMENT_UPDATE_OPTIONS + ':name', (data, cb) => {
        expect(data).toEqual({
            options: {redaction: RedactionType.MASKED},
            updateType: REVEAL_ELEMENT_OPTIONS_TYPES.ELEMENT_PROPS
        });
    });
    const testEmptyDiv = document.createElement("div");
    testEmptyDiv.setAttribute("id", "testDiv");
    document.body.appendChild(testEmptyDiv);
    expect(document.getElementById("testDiv")).not.toBeNull();

    testRevealElement.update({redaction: RedactionType.MASKED})
  });
});
