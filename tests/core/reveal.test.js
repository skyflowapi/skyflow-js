import Skyflow, { RedactionType } from '../../src/Skyflow';

const testTokenId = '1677f7bd-c087-4645-b7da-80a6fd1a81a4';
const testRedactionType = RedactionType.PLAIN_TEXT;
const testInvalidTokenId = '80a6fd1a81a4-b7da-c087-4645';
const skyflow = Skyflow.init({
  vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
  vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
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
          redaction: RedactionType.PLAIN_TEXT,
        },
      ],
    }).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
  test('should throw error for Missing redaction Property', (done) => {
    skyflow.detokenize({
      records: [
        {
          token: testTokenId,
        },
      ],
    }).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });
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
