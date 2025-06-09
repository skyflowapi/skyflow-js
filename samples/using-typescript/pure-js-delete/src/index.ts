/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, { DeleteResponse } from "skyflow-js";

try {
  const skyflow = Skyflow.init({
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
  });

  // form delete request
  const deleteButton = document.getElementById("deleteButton");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      const response: Promise<DeleteResponse> = skyflow.delete({
        records: [
          { id: "<SKYFLOW_ID_1>", table: "<TABLE_NAME>" },
          { id: "<SKYFLOW_ID_2>", table: "<TABLE_NAME>" },
        ],
      });

      response
        .then(
          (res) => {
            const element = document.getElementById("deleteResponse");
            if (element) {
              element.innerHTML = JSON.stringify(res, null, 2);
            }
          },
          (err) => {
            const element = document.getElementById("deleteResponse");
            if (element) {
              element.innerHTML = JSON.stringify(err, null, 2);
            }
          }
        )
        .catch((err) => {
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
