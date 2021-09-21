import Client from "./client";
import CollectContainer from "./container/external/CollectContainer";
import RevealContainer from "./container/external/RevealContainer";
import uuid from "./libs/uuid";
import { ElementType } from "./container/constants";
import {
  validateInsertRecords,
  validateDetokenizeInput,
  validateGetByIdInput,
  isValidURL,
} from "./utils/validators";
import PureJsController from "./container/external/PureJsController";

export interface IInsertRecord {
  table: string;
  fields: Record<string, any>;
}

export interface IInsertRecordInput {
  records: IInsertRecord[];
}

export enum ContainerType {
  COLLECT = "COLLECT",
  REVEAL = "REVEAL",
}
export interface ISkyflow {
  vaultID: string;
  vaultURL: string;
  getBearerToken: () => Promise<string>;
  options?: Record<string, any>;
}

export enum RedactionType {
  DEFAULT = "DEFAULT",
  PLAIN_TEXT = "PLAIN_TEXT",
  MASKED = "MASKED",
  REDACTED = "REDACTED",
}
export interface IRevealRecord {
  token: string;
  redaction: RedactionType;
}
export interface revealResponseType {
  records?: Record<string, string>[];
  errors?: Record<string, any>[];
}
export interface IDetokenizeInput {
  records: IRevealRecord[];
}

export interface ISkyflowIdRecord {
  ids: string[];
  redaction: RedactionType;
  table: string;
}

export interface IGetByIdInput {
  records: ISkyflowIdRecord[];
}

class Skyflow {
  #client: Client;
  #uuid: string = uuid();
  #metadata = {
    uuid: this.#uuid,
    clientDomain: location.origin,
  };
  #pureJsController: PureJsController;

  constructor(config: ISkyflow) {
    this.#client = new Client(
      {
        ...config,
      },
      this.#metadata
    );
    this.#pureJsController = new PureJsController(this.#client);
  }

  static init(config: ISkyflow): Skyflow {
    if (
      !config ||
      !config.vaultID ||
      !isValidURL(config.vaultURL) ||
      !config.getBearerToken
    ) {
      throw new Error("Invalid client credentials");
    }

    config.vaultURL =
      config.vaultURL.slice(-1) === "/"
        ? config.vaultURL.slice(0, -1)
        : config.vaultURL;

    return new Skyflow(config);
  }

  container(type: ContainerType, options?: Record<string, any>) {
    switch (type) {
      case ContainerType.COLLECT:
        return new CollectContainer(options, {
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
        });
      case ContainerType.REVEAL:
        return new RevealContainer({
          ...this.#metadata,
          clientJSON: this.#client.toJSON(),
        });
      default:
        throw new Error("Invalid container type");
    }
  }

  insert(
    records: IInsertRecordInput,
    options: Record<string, any> = { tokens: true }
  ) {
    validateInsertRecords(records);
    return this.#pureJsController._insert(records, options);
  }

  detokenize(
    detokenizeInput: IDetokenizeInput,
    options: any = {}
  ): Promise<revealResponseType> {
    validateDetokenizeInput(detokenizeInput);
    return this.#pureJsController._detokenize(detokenizeInput.records);
  }

  getById(getByIdInput: IGetByIdInput) {
    validateGetByIdInput(getByIdInput);
    return this.#pureJsController._getById(getByIdInput.records);
  }

  static get ContainerType() {
    return ContainerType;
  }
  static get ElementType() {
    return ElementType;
  }
  static get RedactionType() {
    return RedactionType;
  }
}
export default Skyflow;
