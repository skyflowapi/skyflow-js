/*
Copyright (c) 2022 Skyflow, Inc.
*/
import { getAccessToken } from "../../src/utils/bus-events";
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
    
    test("GetAccessToken Without parameter Fn valid token,",(done)=>{
        const response = getAccessToken();
        const emitEventName = emitSpy.mock.calls[1][0];
        const emitCb = emitSpy.mock.calls[1][2];
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
    test("GetAccessToken Without parameter Fn Invalid token",(done)=>{
        const response = getAccessToken();
        const emitEventName = emitSpy.mock.calls[1][0];
        const emitCb = emitSpy.mock.calls[1][2];
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

});