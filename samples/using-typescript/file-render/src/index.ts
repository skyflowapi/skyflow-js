/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  RevealContainer,
  RevealElement,
  RenderFileResponse,
} from "skyflow-js";

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

  const renderStyleOptions = {
    inputStyles: {
      base: {
        border: "2px solid #eae8ee",
        padding: "10px 10px 10px 10px",
        borderRadius: "10px",
        color: "#1d1d1d",
        marginTop: "2px",
        height: "250px",
        width: "400px",
      },
    },
    errorTextStyles: {
      base: {
        color: "#f44336",
      },
    },
  };

  const renderStyleOptions2 = {
    inputStyles: {
      base: {
        border: "2px solid orange",
        padding: "10px 10px 10px 10px",
        borderRadius: "10px",
        color: "#1d1d1d",
        marginTop: "4px",
        height: "260px",
        width: "400px",
      },
    },
    errorTextStyles: {
      base: {
        color: "yellow",
      },
    },
  };

  const renderContainer = skyflow.container(Skyflow.ContainerType.REVEAL) as RevealContainer;

  const renderFileElement1: RevealElement = renderContainer.create({
    ...renderStyleOptions,
    skyflowID: "<SKYFLOW_ID1>",
    column: "<COLUMN_NAME1>",
    table: "<TABLE1>",
    altText: "Alt text 1",
  });
  renderFileElement1.mount("#renderFileElement1");

  const renderFileElement2: RevealElement = renderContainer.create({
    ...renderStyleOptions2,
    skyflowID: "<SKYFLOW_ID2>",
    column: "<COLUMN_NAME2>",
    table: "<TABLE2>",
    altText: "Alt text 2",
  });

  renderFileElement2.mount("#renderFileElement2");

  const renderButton = document.getElementById("renderFiles");

  if (renderButton) {
    renderButton.addEventListener("click", () => {
      const renderFile1Response = renderFileElement1.renderFile();
      renderFile1Response.then((res) => {
        console.log("response 1", res);
      })
      .catch((err) => {
        console.log("Error 1", err);
      });

      const renderFile2Response = renderFileElement2.renderFile();
      renderFile2Response.then((res) => {
        console.log("response 2", res);
      })
      .catch((err) => {
        console.log("Error 2", err);
      });
    });
  }
} catch (err) {
  console.log(err);
}
