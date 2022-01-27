import Skyflow from '../../src/Skyflow';
import {formatRecordsForClient,formatRecordsForIframe} from "../../src/core-utils/reveal";
const testTokenId = '1677f7bd-c087-4645-b7da-80a6fd1a81a4';
const testInvalidTokenId = '80a6fd1a81a4-b7da-c087-4645';

const mGetRandomValues = jest.fn().mockReturnValue(new Uint32Array(10));
Object.defineProperty(window, 'crypto', {
  value: { getRandomValues: mGetRandomValues },
});


const skyflow = Skyflow.init({
  vaultID: 'vault_id',
  vaultURL: 'https://vault.test.com',
  getBearerToken: () => new Promise((resolve, reject) => {
    const Http = new XMLHttpRequest();

    Http.onreadystatechange = () => {
      if (Http.readyState == 4 && Http.status == 200) {
        const response = JSON.parse(Http.responseText);
        resolve(response.accessToken);
      }
    };
    const url = 'http://localhost:8000/js/userToken';
    Http.open('GET', url);
    Http.send();
  }),
});

jest.setTimeout(15000);

describe('Reveal PureJs- get() Method Input', () => {
  test('should throw error for Empty Input Array', (done) => {
    skyflow.detokenize([]).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
  test('should throw error for Empty Object in Input', (done) => {
    skyflow.detokenize({ records: [{}] }).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
  test('should throw error for Missing id Property', (done) => {
    skyflow.detokenize({
      records: [
        {
          // redaction: RedactionType.PLAIN_TEXT,
        },
      ],
    }).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
  // test('should throw error for Missing redaction Property', (done) => {
  //   skyflow.detokenize({
  //     records: [
  //       {
  //         token: testTokenId,
  //       },
  //     ],
  //   }).catch((err) => {
  //     expect(err).toBeDefined();
  //     done();
  //   });
  // });
  test('should throw error for Empty string in id value', (done) => {
    skyflow.detokenize({
      records: [
        {
          token: '',
        },
      ],
    }).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
});

describe("formatRecordsForClient fn test",()=>{
  test("only success records",()=>{
    const testInput = {"records":[{"token":"7402-2242-2342-232","value":"231"}] }
    const fnResponse = formatRecordsForClient(testInput, {"7402-2242-2342-232": "231"});
    expect(fnResponse.success.length).toBe(1);
    expect(fnResponse.errors).toBeUndefined();
  });
  test("both success and error records",()=>{
    const testInput = {"records":[{"token":"7402-2242-2342-232","value":"231"}],"errors":[{"token":"3232-6434-3253-4221"}]};
    const fnResponse = formatRecordsForClient(testInput,{"7402-2242-2342-232": "231"});
    expect(fnResponse.errors.length).toBe(1);
    expect(fnResponse.success.length).toBe(1);
  });
  test("only error records",()=>{
    const testInput = {"errors":[{"token":"3232-6434-3253-4221"}]};
    const fnResponse = formatRecordsForClient(testInput);
    expect(fnResponse.errors.length).toBe(1);
    expect(fnResponse.success).toBeUndefined();
  });
});

describe("formatRecordsForIframe fn test",()=>{
  test("no records should return empty object",()=>{
    const testInput = {};
    const fnResponse = formatRecordsForIframe(testInput);
    expect(fnResponse).toStrictEqual({});
  });
  test("with records should return token value object",()=>{
    const testInput = {"records":[{token:"7823-323-242-2232",value:"token_value"}]};
    const fnResponse = formatRecordsForIframe(testInput);
    expect(fnResponse).toStrictEqual({"7823-323-242-2232":"token_value"});
  });
});
