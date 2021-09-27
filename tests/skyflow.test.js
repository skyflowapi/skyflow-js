import Skyflow from '../src/Skyflow';

// Skyflow initialization test methods

jest.setTimeout(15000);

const httpRequestToken = () => new Promise((resolve, reject) => {
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
});

describe('Insert Records Test', () => {
  test('should initialize the skyflow object  ', () => {
    try {
      const skyflow = Skyflow.init({
        vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
        vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
        getBearerToken: () => Promise.resolve(httpRequestToken()),
      });
      expect(skyflow.constructor === Skyflow).toBe(true);
    } catch (error) {
      console.log(error.message);
      console.log(error);
    }
  });
  /**
   * invalid vaultId
   */
  test('invalid vaultId throws error', async () => {
    try {
      const skyflow = Skyflow.init({
        vaultID: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9',
        vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
        getBearerToken: () => Promise.resolve(httpRequestToken()),
      });

      const response = await skyflow.insert(
        {
          records: [
            {
              table: 'pii_fields',
              fields: {
                first_name: 'john',
                middle_name: 'clarke',
                last_name: 'henry',
              },
            },
          ],
        },
        {
          tokens: true,
        },
      );
      expect(response.hasOwnProperty('error')).toBe(true);
    } catch (err) {
      expect(err.error.http_status).toBe('Internal Server Error');
    }
  });
  /**
   * Empty VaultId passed throws custom error message
   */
  test('empty vaultId throws error', async () => {
    try {
      const skyflow = Skyflow.init({
        vaultID: ' ',
        vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
        getBearerToken: () => Promise.resolve(httpRequestToken()),
      });

      const response = await skyflow.insert(
        {
          records: [
            {
              table: 'pii_fields',
              fields: {
                first_name: 'john',
                middle_name: 'clarke',
                last_name: 'henry',
              },
            },
          ],
        },
        {
          tokens: true,
        },
      );
      expect(response.hasOwnProperty('error')).toBe(true);
    } catch (err) {
      expect(err.error.message).toBe(
        'unable to retrieve vault mapping for vault ID',
      );
    }
  });
  /**
   * throws error for invalid vaultURL, throws error message -> An error occurred during transaction
   */
  test('invalid vaultURL testing', async () => {
    try {
      const skyflow = Skyflow.init({
        vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
        vaultURL: 'https://sb.area51.vault.skyflowjs.dev',
        getBearerToken: () => Promise.resolve(httpRequestToken()),
      });
      const response = await skyflow.insert(
        {
          records: [
            {
              table: 'pii_fields',
              fields: {
                first_name: 'john',
                middle_name: 'clarke',
                last_name: 'henry',
              },
            },
          ],
        },
        {
          tokens: true,
        },
      );
      expect(response.hasOwnProperty('records')).toBe(true);
    } catch (error) {
      expect(error).toBe('An error occurred during transaction');
    }
  });

  test('invalid method name for getAccessToken', async () => {
    try {
      const skyflow = Skyflow.init({
        vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
        vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
        getTokens: () => Promise.resolve(httpRequestToken()),
      });
      const response = await skyflow.insert(
        {
          records: [
            {
              table: 'pii_fields',
              fields: {
                first_name: 'john',
                middle_name: 'clarke',
                last_name: 'henry',
              },
            },
          ],
        },
        {
          tokens: true,
        },
      );
      expect(response.hasOwnProperty('records')).toBe(true);
    } catch (error) {
      // console.log(error.message);
      expect(error.message).toBe('Invalid client credentials');
    }
  });

  /**
   * getAccessToken method key modified
   */
  test('Random token passed', async () => {
    try {
      const skyflow = Skyflow.init({
        vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
        vaultURL: 'https://sb.area51.vault.skyflowapis.dev',
        getBearerToken: () => Promise.resolve(
          '1225387dsnbkjdbjsdhsdbshdsd.fcshdsndskdnsd_cscssdsdsdsdsdsdsdksmkdnsjbndjnsdnksldsndksnkdnsdnlsnkl_12162127b2jnsddcksdnskjndjfnsjknksnfksnjkfnsnfkcsxcsdfsfsfsfsf',
        ) // token passed as invalid
        ,
      });
      const response = await skyflow.insert(
        {
          records: [
            {
              table: 'pii_fields',
              fields: {
                first_name: 'john',
                middle_name: 'clarke',
                last_name: 'henry',
              },
            },
          ],
        },
        {
          tokens: true,
        },
      );
      expect(response.hasOwnProperty('records')).toBe(true);
    } catch (error) {
      expect(error).toBe(null);
    }
  });
});
