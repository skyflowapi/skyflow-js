import { getAccessToken,getRevealElementValue,getCollectElementValue, updateElementState } from "../../src/utils/busEvents";
import bus from 'framebus';
import { ELEMENT_EVENTS_TO_IFRAME } from "../../src/core/constants";
import logs from "../../src/utils/logs";
const on = jest.fn();
const emit = jest.fn()
describe("Utils/Bus Events",()=>{
    let emitSpy;
    let targetSpy;
    beforeEach(() => {
      jest.clearAllMocks();
      emitSpy = jest.spyOn(bus, 'emit');
      targetSpy = jest.spyOn(bus, 'target');
      targetSpy.mockReturnValue({
        on,
        emit
      });
    });

    test("GetAccessToken Fn valid token,",(done)=>{
        const response = getAccessToken('');
        const emitEventName = emitSpy.mock.calls[0][0];
        const emitCb = emitSpy.mock.calls[0][2];
        expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN);
        emitCb({authToken:"access_Token"});
        response.then((data)=>{
            expect(data).toEqual("access_Token");
            done();
        }).catch((err)=>{
           expect(err).toBeUndefined();
            done();
        });
    });
    test("GetAccessToken Fn Invalid token",(done)=>{
        const response = getAccessToken('');
        const emitEventName = emitSpy.mock.calls[0][0];
        const emitCb = emitSpy.mock.calls[0][2];
        expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.GET_BEARER_TOKEN);
        emitCb({error:"invalid_token"});
        response.then((data)=>{
            expect(data).toBeUndefined();
            done();
        }).catch((err)=>{
           expect(err).toEqual("invalid_token");
            done();
        });
    });
    
    test("getRevealElementValue fn",(done)=>{
        const response = getRevealElementValue("ele_key","reveal:frame:name");
        const emitEventName = emitSpy.mock.calls[0][0];
        const emittedData = emitSpy.mock.calls[0][1];
        const emitCb = emitSpy.mock.calls[0][2];
        expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.GET_REVEAL_ELEMENT);
        expect(emittedData.name).toEqual("reveal:frame:name");
        emitCb("reveal_value");
        response.then((data)=>{
            expect(data.key).toEqual("ele_key");
            expect(data.value).toEqual("reveal_value");
            done();
        }).catch((err)=>{
            console.log(err);
            done();
        });
    });

    test("getCollectElementValue fn valid Element",(done)=>{
        const response = getCollectElementValue("ele_key","element:frame:id:ERROR");
        const emitEventName = emitSpy.mock.calls[0][0];
        const emittedData = emitSpy.mock.calls[0][1];
        const emitCb = emitSpy.mock.calls[0][2];
        expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.GET_COLLECT_ELEMENT);
        expect(emittedData.name).toEqual("element:frame");
        emitCb({isValid:true,value:"collect_ele_value"});
        response.then((data)=>{
            expect(data.key).toEqual("ele_key");
            expect(data.value).toEqual("collect_ele_value");
            done();
        }).catch((err)=>{
            console.log(err);
            done();
        });
    });

    test("getCollectElementValue fn Invalid Element",(done)=>{
        const response = getCollectElementValue("ele_key","element:frame:id:ERROR");
        const emitEventName = emitSpy.mock.calls[0][0];
        const emittedData = emitSpy.mock.calls[0][1];
        const emitCb = emitSpy.mock.calls[0][2];
        expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.GET_COLLECT_ELEMENT);
        expect(emittedData.name).toEqual("element:frame");
        emitCb({isValid:false});
        response.then((data)=>{
           expect(data).toBeUndefined();
            done();
        }).catch((err)=>{
            expect(err).toEqual(logs.errorLogs.INVALID_FIELD);
            done();
        });
    });

    test.only("update Element State after invoke connection", () => {
        updateElementState('element:CVV', '123')
        expect(targetSpy.mock.calls[0][0]).toBeDefined()
    })
});