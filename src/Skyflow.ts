import Client from "./client";
import uuid from "./libs/uuid";
import { properties } from "./properties";
import {
  constructInsertRecordRequest,
  constructInsertRecordResponse,
} from "./utils/helpers";
import { fetchRecordsByTokenId } from "./core/reveal";

export interface IInsertRecord {
  table: string;
  fields: Record<string, any>;
}

export interface IInsertRecordInput {
  records: IInsertRecord[];
}
export interface ISkyflow {
  vaultId: string;
  vaultURL: string;
  getAccessToken: () => Promise<string>;
  options: Record<string, any>;
}
export enum RecordType {
  SKYFLOW_ID = "SKYFLOW_ID",
  TOKEN = "TOKEN",
}
export enum RedactionType {
  DEFAULT = "DEFAULT",
  PLAIN_TEXT = "PLAIN_TEXT",
  MASKED = "MASKED",
  REDACTED = "REDACTED",
}
export interface IRevealRecord {
  id: string;
  redaction: RedactionType;
}
export interface revealResponseType {
  records: Record<string, string>[];
  errors: Record<string, string>[];
}

class Skyflow {
  #client: Client;
  static version = properties.VERSION;
  #uuid: string = uuid();
  #metadata = {
    uuid: this.#uuid,
    clientDomain: location.origin,
  };

  constructor(config: ISkyflow) {
    this.#client = new Client(
      {
        ...config,
      },
      this.#metadata
    );
  }
  static init(config: ISkyflow): Skyflow {
    return new Skyflow(config);
  }

  insert(
    records: IInsertRecordInput,
    options: Record<string, any> = { tokens: true }
  ) {
    const requestBody = constructInsertRecordRequest(records, options);

    return new Promise((resolve, reject) => {
      this.#client
        .request({
          body: { records: requestBody },
          requestMethod: "POST",
          url:
            this.#client.config.vaultURL +
            "/v1/vaults/" +
            this.#client.config.vaultId,
        })
        .then((response: any) => {
          resolve(
            constructInsertRecordResponse(
              response,
              options.tokens,
              records.records
            )
          );
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  get(
    records: IRevealRecord[],
    options: any = {}
  ): Promise<revealResponseType> {
    return fetchRecordsByTokenId(records, this.#client);
  }
}
export default Skyflow;
