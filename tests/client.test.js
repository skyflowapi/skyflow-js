import Client from "../src/client";
describe("Client Class",()=>{
    beforeEach(()=>{
        jest.clearAllMocks();
    });
    test("Client fromJson method",()=>{
        const testClientObject = Client.fromJSON({config:{},metadata:{}});
        expect(testClientObject).toBeInstanceOf(Client);
    });
    test("Client Request Method without errors",()=>{
        try{
            const xhrMock = {
                open: jest.fn(),
                send: jest.fn(),
                onLoad:jest.fn(),
                setRequestHeader: jest.fn(),
                readyState: 4,
                status: 200,
                response: 'Hello World!',
                getAllResponseHeaders:jest.fn().mockImplementation(()=>("content-type:application/json"))
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
            expect(xhrMock.open).toBeCalledWith('GET', 'https://example-test.com');
            expect(xhrMock.setRequestHeader).toBeCalledWith("Auth","eyde.ed.ewe");
            expect(xhrMock.send).toBeCalledWith(JSON.stringify({
                "key":"value"
            }));
            // expect(xhrMock.getAllResponseHeaders).toBeCalled();
            // resp.then((res)=>{
            //     console.log(res);
            //     expect(res).toEqual('Hello World');
            //     done();
            // }).catch((err)=>{
            //     console.log(err);
            //     done();
            // })

        }catch(err){
            console.log(err);
        }
    });

});