import Client from "./client";
import uuid from "./libs/uuid";
import { properties } from "./properties";

export interface ISkyflow {
  vaultId: string;
  workspaceUrl: string;
  getAccessToken: () => Promise<string>;
  options: Record<string, any>;
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
}

export default Skyflow;
