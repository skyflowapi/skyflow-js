/*
Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, { 
  GetResponse,
  GetRequest,
  GetOptions,
  GetRecord,
  SkyflowConfig,
} from "skyflow-js";

try {
  const config: SkyflowConfig = {
    vaultID: "<VAULT_ID>",
    vaultURL: "<VAULT_URL>",
    getBearerToken: () => {
      return new Promise((resolve, reject) => {
        const Http = new XMLHttpRequest();

        Http.onreadystatechange = () => {
          if (Http.readyState === 4 && Http.status === 200) {
            const response = JSON.parse(Http.responseText);
            resolve(response.accessToken);
          }
        };
        const url = "<TOKEN_END_POINT_URL>";
        Http.open("GET", url);
        Http.send();
      });
    },
    options: {
      logLevel: Skyflow.LogLevel.ERROR,
      env: Skyflow.Env.PROD,
    },
  }
  const skyflowClient: Skyflow = Skyflow.init(config);
  // form get request
  const getButton = document.getElementById("getButton") as HTMLButtonElement;
  if (getButton) {
    getButton.addEventListener("click", () => {
      const getRecords: Array<GetRecord> = [
        {
          ids: ["<SKYFLOW_ID1>", "<SKYFLOW_ID2>"],
          table: "<TABLE_NAME>",
          redaction: Skyflow.RedactionType.PLAIN_TEXT,
        },
        {
          columnValues: ["<COLUMN_VALUE1>", "<COLUMN_VALUE2>"],
          columnName: "<UNIQUE_COLUMN_NAME>",
          table: "<TABLE_NAME>",
          redaction: Skyflow.RedactionType.PLAIN_TEXT,
        },
      ];
      const getRecordsInput: GetRequest = {
        records: getRecords
      };
      const response: Promise<GetResponse> = skyflowClient.get(getRecordsInput);

      response
        .then((res: GetResponse) => {
          const getResponseElement = document.getElementById("getResponse") as HTMLElement;
          if (getResponseElement) {
            getResponseElement.innerHTML = JSON.stringify(res, null, 2);
          }
        })
        .catch((err: GetResponse) => {
          const getResponseElement = document.getElementById("getResponse") as HTMLElement;
          if (getResponseElement) {
            getResponseElement.innerHTML = JSON.stringify(err, null, 2);
          }
          console.log(err);
        });
    });
  }

  const getTokensButton = document.getElementById("getTokens") as HTMLButtonElement;
  if (getTokensButton) {
    getTokensButton.addEventListener("click", () => {
      const getRecords: Array<GetRecord> = [
        {
          ids: ["<SKYFLOW_ID1>", "<SKYFLOW_ID2>"],
          table: "<TABLE_NAME>",
        },
      ];
      const getRecordsInput: GetRequest = {
        records: getRecords
      };
      const getOptions: GetOptions = { tokens: true }
      const response: Promise<GetResponse> = skyflowClient.get(
        getRecordsInput,
        getOptions,
      );

      response
        .then((res: GetResponse) => {
          const getResponseElement = document.getElementById("getResponse") as HTMLElement;
          if (getResponseElement) {
            getResponseElement.innerHTML = JSON.stringify(res, null, 2);
          }
        })
        .catch((err: GetResponse) => {
          const getResponseElement = document.getElementById("getResponse") as HTMLElement;
          if (getResponseElement) {
            getResponseElement.innerHTML = JSON.stringify(err, null, 2);
          }
          console.log(err);
        });
    });
  }
} catch (err: unknown) {
  console.log(err);
}
