import Client from "./client";
import CollectContainer from "./container/external/CollectContainer";
import RevealContainer from "./container/external/RevealContainer";
import uuid from "./libs/uuid";
import { properties } from "./properties";
import { ElementType } from "./container/constants";
import { validateInsertRecords, validateGetRecords } from "./utils/validators";
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
  id: string;
  redaction: RedactionType;
}
export interface revealResponseType {
  records: Record<string, string>[];
  errors: Record<string, any>[];
}

class Skyflow {
  #client: Client;
  static version = properties.VERSION;
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
    if (!config.vaultID || !config.vaultURL || !config.getBearerToken) {
      throw new Error("Invalid client credentials");
    }

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

  get(
    records: IRevealRecord[],
    options: any = {}
  ): Promise<revealResponseType> {
    validateGetRecords(records);
    return this.#pureJsController._get(records);
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
