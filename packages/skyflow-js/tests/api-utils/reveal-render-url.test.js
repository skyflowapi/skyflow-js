import { getFileURLForRender } from "../../src/api-utils/reveal";

describe("getFileURLForRender: returnFileMetadata query parameter", () => {
  const record = { skyflowID: "id-1", column: "file", table: "files" };
  const makeClient = () => ({
    config: { vaultURL: "https://vault.test", vaultID: "vault1" },
    request: jest.fn(() => Promise.resolve({})),
  });

  test("is sent by default (SDK default true, API default false)", async () => {
    const client = makeClient();
    await getFileURLForRender(record, client, "token");
    const { url } = client.request.mock.calls[0][0];
    // match path + query only: the base URL may be rewritten for local dev proxies
    expect(url).toMatch(/\/v1\/vaults\/vault1\/files\/id-1\?fields=file&downloadURL=true&contentDisposition=INLINE&returnFileMetadata=true$/);
  });

  test("is omitted when the caller passes false", async () => {
    const client = makeClient();
    await getFileURLForRender(record, client, "token", false);
    const { url } = client.request.mock.calls[0][0];
    expect(url).toMatch(/\/v1\/vaults\/vault1\/files\/id-1\?fields=file&downloadURL=true&contentDisposition=INLINE$/);
    expect(url).not.toContain("returnFileMetadata");
  });
});

import * as busEvents from "@core/utils/bus-events";
import { getFileURLFromVaultBySkyflowID } from "../../src/api-utils/reveal";

describe("getFileURLFromVaultBySkyflowID (collect reveal path): element option forwarded", () => {
  const record = { skyflowID: "id-1", column: "file", table: "files" };
  const makeClient = () => ({
    config: { vaultURL: "https://vault.test", vaultID: "vault1" },
    request: jest.fn(() => Promise.resolve({ fields: { file: "https://signed" } })),
    toJSON: () => ({ metaData: { uuid: "client-1" } }),
  });
  beforeEach(() => { busEvents.getAccessToken = jest.fn(() => Promise.resolve("token")); });

  test("requests metadata by default", async () => {
    const client = makeClient();
    await getFileURLFromVaultBySkyflowID(record, client);
    expect(client.request.mock.calls[0][0].url).toContain("&returnFileMetadata=true");
  });

  test("omits the parameter when the element option is false", async () => {
    const client = makeClient();
    await getFileURLFromVaultBySkyflowID(record, client, false);
    expect(client.request.mock.calls[0][0].url).not.toContain("returnFileMetadata");
  });
});
