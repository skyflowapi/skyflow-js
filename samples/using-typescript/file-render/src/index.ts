/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  ErrorTextStyles,
  SkyflowConfig,
  InputStyles,
  RevealElementInput,
  RevealContainer,
  RevealElement,
  RenderFileResponse,
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
  }
  const skyflowClient: Skyflow = Skyflow.init(config);

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
    } as InputStyles,
    errorTextStyles: {
      base: {
        color: "#f44336",
      },
    } as ErrorTextStyles,
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
    } as InputStyles,
    errorTextStyles: {
      base: {
        color: "yellow",
      },
    } as ErrorTextStyles,
  };

  const renderContainer = skyflowClient.container(Skyflow.ContainerType.REVEAL) as RevealContainer;

  const renderFileInput1: RevealElementInput = {
    ...renderStyleOptions,
    skyflowID: "<SKYFLOW_ID1>",
    column: "<COLUMN_NAME1>",
    table: "<TABLE1>",
    altText: "Alt text 1",
  }
  const renderFileElement1: RevealElement = renderContainer.create(renderFileInput1);
  renderFileElement1.mount("#renderFileElement1");

  const renderFileInput2: RevealElementInput = {
    ...renderStyleOptions2,
    skyflowID: "<SKYFLOW_ID2>",
    column: "<COLUMN_NAME2>",
    table: "<TABLE2>",
    altText: "Alt text 2",
  }
  const renderFileElement2: RevealElement = renderContainer.create(renderFileInput2);

  renderFileElement2.mount("#renderFileElement2");

  const renderButton = document.getElementById("renderFiles") as HTMLButtonElement;

  if (renderButton) {
    renderButton.addEventListener("click", () => {
      const renderFile1Response: Promise<RenderFileResponse> = renderFileElement1.renderFile();
      renderFile1Response.then((res: RenderFileResponse) => {
        console.log("response 1", res);
      })
      .catch((err: any) => {
        console.log("Error 1", err);
      });

      const renderFile2Response: Promise<RenderFileResponse> = renderFileElement2.renderFile();
      renderFile2Response.then((res: RenderFileResponse) => {
        console.log("response 2", res);
      })
      .catch((err: any) => {
        console.log("Error 2", err);
      });
    });
  }
} catch (err: unknown) {
  console.log(err);
}
