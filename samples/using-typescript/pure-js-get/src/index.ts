/*
Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, { 
  GetResponse,
  IGetInput,
  IGetOptions,
  IGetRecord,
  ISkyflow,
} from "skyflow-js";

try {
  const config: ISkyflow = {
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
  const skyflow = Skyflow.init(config);
  // form get request
  const getButton = document.getElementById("getButton");
  if (getButton) {
    getButton.addEventListener("click", () => {
      const getRecords: Array<IGetRecord> = [
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
      const getRecordsInput: IGetInput = {
        records: getRecords
      };
      const response: Promise<GetResponse> = skyflow.get(getRecordsInput);

      response
        .then((res: GetResponse) => {
          const getResponseElement = document.getElementById("getResponse");
          if (getResponseElement) {
            getResponseElement.innerHTML = JSON.stringify(res, null, 2);
          }
        })
        .catch((err: GetResponse) => {
          const getResponseElement = document.getElementById("getResponse");
          if (getResponseElement) {
            getResponseElement.innerHTML = JSON.stringify(err, null, 2);
          }
          console.log(err);
        });
    });
  }

  const getTokensButton = document.getElementById("getTokens");
  if (getTokensButton) {
    getTokensButton.addEventListener("click", () => {
      const getRecords: Array<IGetRecord> = [
        {
          ids: ["<SKYFLOW_ID1>", "<SKYFLOW_ID2>"],
          table: "<TABLE_NAME>",
        },
      ];
      const getRecordsInput: IGetInput = {
        records: getRecords
      };
      const getOptions: IGetOptions = { tokens: true }
      const response: Promise<GetResponse> = skyflow.get(
        getRecordsInput,
        getOptions,
      );

      response
        .then((res: GetResponse) => {
          const getResponseElement = document.getElementById("getResponse");
          if (getResponseElement) {
            getResponseElement.innerHTML = JSON.stringify(res, null, 2);
          }
        })
        .catch((err: GetResponse) => {
          const getResponseElement = document.getElementById("getResponse");
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
