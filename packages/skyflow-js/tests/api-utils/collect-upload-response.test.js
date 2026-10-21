import { constructUploadResponse } from "../../src/api-utils/collect";

describe("constructUploadResponse", () => {
  const metadata = { fileName: "kyc.jpeg", fileSize: 1024, fileType: "application/jpeg" };

  test("maps skyflowID to skyflow_id and passes fileMetadata through untouched", () => {
    const out = (constructUploadResponse({
      skyflowID: "4423ccdf-75eb-4e2e-abfc-acb43b1440cd",
      fileMetadata: metadata,
    }));
    expect(out).toEqual({ skyflow_id: "4423ccdf-75eb-4e2e-abfc-acb43b1440cd", fileMetadata: metadata });
  });

  test("accepts the raw JSON string the client returns", () => {
    const out = (constructUploadResponse(JSON.stringify({ skyflowID: "id-1", fileMetadata: metadata })));
    expect(out.fileMetadata).toEqual(metadata);
  });

  test("omits fileMetadata when the vault does not return it", () => {
    const out = (constructUploadResponse({ skyflowID: "id-2" }));
    expect(out).toEqual({ skyflow_id: "id-2" });
    expect(out).not.toHaveProperty("fileMetadata");
  });
});
