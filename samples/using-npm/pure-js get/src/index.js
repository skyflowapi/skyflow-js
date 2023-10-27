/*
Copyright (c) 2022 Skyflow, Inc.
*/
import Skyflow from 'skyflow-js';

try {
  const skyflow = Skyflow.init({
    vaultID: '<VAULT_ID>',
    vaultURL: '<VAULT_URL>',
    getBearerToken: () => {
      return new Promise((resolve, reject) => {
        const Http = new XMLHttpRequest();

        Http.onreadystatechange = () => {
          if (Http.readyState === 4 && Http.status === 200) {
            const response = JSON.parse(Http.responseText);
            resolve(response.accessToken);
          }
        };
        const url = '<TOKEN_END_POINT_URL>';
        Http.open('GET', url);
        Http.send();
      });
    },
    options: {
      logLevel: Skyflow.LogLevel.ERROR,
      env: Skyflow.Env.PROD,
    },
  });
  // form get request
  const getButton = document.getElementById('getButton');
  if (getButton) {
    getButton.addEventListener('click', () => {
      const response = skyflow.get({
        records: [
          {
            ids: ['<SKYFLOW_ID1>', '<SKYFLOW_ID2>'],
            table: '<TABLE_NAME>',
            redaction: Skyflow.RedactionType.PLAIN_TEXT,
          },
          {
            columnValues: ['<COLUMN_VALUE1>', '<COLUMN_VALUE2>'],
            columnName: '<UNIQUE_COLUMN_NAME>',
            table: '<TABLE_NAME>',
            redaction: Skyflow.RedactionType.PLAIN_TEXT,
          },
        ],
      });

      response
        .then((res) => {
          document.getElementById('getResponse').innerHTML = JSON.stringify(
            res,
            null,
            2
          );
        })
        .catch((err) => {
          document.getElementById('getResponse').innerHTML = JSON.stringify(
            err,
            null,
            2
          );
          console.log(err);
        });
    });
  }

  const getTokensButton = document.getElementById('getTokens');
  if (getTokensButton) {
    getTokensButton.addEventListener('click', () => {
      const response = skyflow.get(
        {
          records: [
            {
              ids: ['<SKYFLOW_ID1>', '<SKYFLOW_ID2>'],
              table: '<TABLE_NAME>'
            },
          ],
        },
        { tokens: true }
      );

      response
        .then((res) => {
          document.getElementById('getResponse').innerHTML = JSON.stringify(
            res,
            null,
            2
          );
        })
        .catch((err) => {
          document.getElementById('getResponse').innerHTML = JSON.stringify(
            err,
            null,
            2
          );
          console.log(err);
        });
    });
  }
} catch (err) {
  console.log(err);
}
