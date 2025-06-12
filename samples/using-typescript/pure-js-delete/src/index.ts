/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, { 
  DeleteResponse,
  IDeleteRecordInput,
  IDeleteRecord,
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
  }
  const skyflow: Skyflow = Skyflow.init(config);

  // form delete request
  const deleteButton = document.getElementById("deleteButton");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      const deleteRecords: Array<IDeleteRecord> = [
        { id: "<SKYFLOW_ID_1>", table: "<TABLE_NAME>" },
        { id: "<SKYFLOW_ID_2>", table: "<TABLE_NAME>" },
      ];
      const deleteRecordsInput: IDeleteRecordInput = {
        records: deleteRecords
      };
      const response: Promise<DeleteResponse> = skyflow.delete(deleteRecordsInput);

      response
        .then(
          (res: DeleteResponse) => {
            const element = document.getElementById("deleteResponse");
            if (element) {
              element.innerHTML = JSON.stringify(res, null, 2);
            }
          },
          (err: DeleteResponse) => {
            const element = document.getElementById("deleteResponse");
            if (element) {
              element.innerHTML = JSON.stringify(err, null, 2);
            }
          }
        )
        .catch((err: DeleteResponse) => {
          const element = document.getElementById("deleteResponse");
          if (element) {
            element.innerHTML = JSON.stringify(err, null, 2);
          }
        });
    });
  }
} catch (err: unknown) {
  console.error(err);
}
