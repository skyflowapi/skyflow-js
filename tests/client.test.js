/*
Copyright (c) 2022 Skyflow, Inc.
*/
import Client from "../src/client";
describe("Client Class",()=>{
    beforeEach(()=>{
        jest.clearAllMocks();
        jest.resetAllMocks();
    });
    test("Client fromJson method",()=>{
        const testClientObject = Client.fromJSON({config:{},metadata:{}});
        expect(testClientObject).toBeInstanceOf(Client);
    });
    test("client toJSON", () => {
        const testClient = new Client({},{});
        const testClient2 = testClient.toJSON({},{key: 'value'})
        expect(testClient2.metaData).toBeDefined()
    })
    test("Client Request Method without errors",()=>{
        try{
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                onload: jest.fn(),
                readyState: 4,
                status: 200,
                response: JSON.stringify({'message':'Hello World!'}),
                getAllResponseHeaders:jest.fn().mockImplementation(()=>("content-type: application/json"))
              };
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                headers:{
                    "content-type": "application/json",
                    "Auth":"eyde.ed.ewe"
                },
                body:{
                    "key":"value"
                }
            });
            expect(xhrMock.open).toBeCalledWith('GET', 'https://example-test.com');
            expect(xhrMock.setRequestHeader).toBeCalledWith("Auth","eyde.ed.ewe");
            expect(xhrMock.send).toBeCalledWith(JSON.stringify({
                "key":"value"
            }));
            xhrMock.onload();
        }catch(err){
            console.log(err);
        }
    });
    test("Client Request Method with url-formencoded content-type",()=>{
        try{
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                onload: jest.fn(),
                readyState: 4,
                status: 200,
                response: JSON.stringify({'message':'Hello World!'}),
                getAllResponseHeaders:jest.fn().mockImplementation(()=>(`content-type: application/json 
                x-request-id: req_123`))
              };
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                headers:{
                    "content-type": "application/x-www-form-urlencoded" 
                },
                body:{
                    "key":"value"
                }
            });
            expect(xhrMock.setRequestHeader).toBeCalledWith("content-type","application/x-www-form-urlencoded");
            xhrMock.onload();
        }catch(err){
            console.log(err);
        }
    });

    test("Client Request Method with form-data content-type",()=>{
        try{
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                onload: jest.fn(),
                readyState: 4,
                status: 200,
                response: JSON.stringify({'message':'Hello World!'}),
                getAllResponseHeaders:jest.fn().mockImplementation(()=>(`content-type: application/json 
                x-request-id: req_123`))
              };
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                headers:{
                    "Auth":"eyde.ed.ewe",
                    "content-type": "multipart/form-data" 
                },
                body:{
                    "key":"value"
                }
            });
            xhrMock.onload();
            expect(xhrMock.setRequestHeader).toBeCalledWith("Auth","eyde.ed.ewe");
        }catch(err){
            console.log(err);
        }
    });
    test("Client Request Method with url-formencoded content-type and navigator as null",()=>{
        try{
            const mockNavigator = {
                userAgent: "", // Set userAgent to null or any desired value
                // Add other properties or methods as needed for your test case
              };
              
              // Replace the original navigator object with the mock navigator
              Object.defineProperty(window, 'navigator', {
                value: mockNavigator,
                configurable: true,
                enumerable: true,
                writable: false,
              });
              
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                onload: jest.fn(),
                readyState: 4,
                status: 200,
                response: JSON.stringify({'message':'Hello World!'}),
                getAllResponseHeaders:jest.fn().mockImplementation(()=>(`content-type: application/json 
                x-request-id: req_123`))
              };
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                headers:{
                    "content-type": "application/x-www-form-urlencoded" 
                },
                body:{
                    "key":"value"
                }
            });
            expect(xhrMock.setRequestHeader).toBeCalledWith("content-type","application/x-www-form-urlencoded");
            xhrMock.onload();
        }catch(err){
            console.log(err);
        }
    });
    
    test("Client Request Method with error 1",()=>{
        try{
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                onload: jest.fn(),
                readyState: 4,
                status: 401,
                response: JSON.stringify({'message':'Hello World!'}),
                getAllResponseHeaders:jest.fn().mockImplementation(()=>(`content-type: text/plain
                x-request-id: req_123`))
              };
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                headers:{
                    "Auth":"eyde.ed.ewe"
                },
                body:{
                    "key":"value"
                }
            }).catch(err=>{
                expect(err).toBeDefined();
            });
            expect(xhrMock.open).toBeCalledWith('GET', 'https://example-test.com');
            expect(xhrMock.setRequestHeader).toBeCalledWith("Auth","eyde.ed.ewe");
            expect(xhrMock.send).toBeCalledWith(JSON.stringify({
                "key":"value"
            }));
            xhrMock.onload();
        }catch(err){
            console.log(err);
        }
    });
    test("Client Request Method with error 2",()=>{
        try{
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                onload: jest.fn(),
                readyState: 4,
                status: 401,
                response: JSON.stringify({'error': {'message':'Something went wrong'}}),
                getAllResponseHeaders:jest.fn().mockImplementation(()=>("content-type: application/json"))
              };
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                headers:{
                    "Auth":"eyde.ed.ewe"
                },
                body:{
                    "key":"value"
                }
            }).catch(err=>{
                expect(err).toBeDefined();
            });
            expect(xhrMock.open).toBeCalledWith('GET', 'https://example-test.com');
            expect(xhrMock.setRequestHeader).toBeCalledWith("Auth","eyde.ed.ewe");
            expect(xhrMock.send).toBeCalledWith(JSON.stringify({
                "key":"value"
            }));
            xhrMock.onload();
        }catch(err){
            console.log(err);
        }
    });
    test("Client Request Method with error 3",(done)=>{
        try{
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(()=>{return null});
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                headers:{
                    "Auth":"eyde.ed.ewe"
                },
                body:{
                    "key":"value"
                }
            });
            resp.catch((err)=>{
                expect(err).toBeDefined();
                done();
            })
        }catch(err){
            console.log(err);
        }
    });
    test("Client Request Method with error 4",(done)=>{
        try{
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                onload: jest.fn(),
                onerror:jest.fn(),
                readyState: 4,
                status: 401,
                response: JSON.stringify({'message':'Hello World!'}),
                getAllResponseHeaders:jest.fn().mockImplementation(()=>("content-type: text/plain"))
              };
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                headers:{
                    "Auth":"eyde.ed.ewe"
                },
                body:{
                    "key":"value"
                }
            });
            xhrMock.onerror();
            resp.catch((err)=>{
                expect(err).toBeDefined();
                done();
            })

        }catch(err){
            console.log(err);
        }
    });
    test("Client Request Method with error 5",(done)=>{
        try{
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                onload: jest.fn(),
                onerror:jest.fn(),
                readyState: 4,
                status: 401,
                response: JSON.stringify({'message':'Hello World!'}),
                getAllResponseHeaders:jest.fn().mockImplementation(()=>("content-type: unknown"))
              };
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                headers:{
                    "Auth":"eyde.ed.ewe"
                },
                body:{
                    "key":"value"
                }
            });
            xhrMock.onload();
            resp.catch((err)=>{
                expect(err).toBeDefined();
                done();
            })

        }catch(err){
            console.log(err);
        }
    });

    test("Client Request Method with error 6",(done)=>{
        try{
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                onload: jest.fn(),
                onerror:jest.fn(),
                readyState: 4,
                status: 401,
                response: JSON.stringify({error: {'message':'Invalid Request'}}),
                getAllResponseHeaders:jest.fn().mockImplementation(()=>(`content-type: application/json
                x-request-id: req_123`))
              };
            
            jest.spyOn(window, 'XMLHttpRequest').mockImplementation(() => xhrMock);
            const testClient = new Client({},{});
            const resp = testClient.request({
                requestMethod:"GET",
                url:"https://example-test.com",
                body:{
                    "key":"value"
                }
            });
            xhrMock.onload();
            resp.catch((err)=>{
                expect(err.error.description).toBe('Invalid Request');
                done();
            })


        }catch(err){
            console.log(err);
        }
    });

});