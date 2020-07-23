import Elements from "./elements/external";
import Client from "./client";
import uuid from "./libs/uuid";
import { properties } from "./properties";
import Notebook from "./notebook";

export interface ISkyflowConstructor {
  orgId: string;
  vaultId: string;
  appId: string;
  production: boolean;
  // authToken: string;
}

export interface ISkyflow extends ISkyflowConstructor {
  workflowURL: string;
}

class Skyflow {
  #client: Client;
  static version = properties.VERSION;
  #uuid: string = uuid();
  #metadata = {
    uuid: this.#uuid,
    clientDomain: location.origin,
  };

  constructor(config: ISkyflowConstructor) {
    this.#client = new Client(
      {
        ...config,
        workflowURL: config.production
          ? properties.PROD_WORKFLOW_URL
          : properties.WORKFLOW_URL,
      },
      this.#metadata
    );
  }

  // elements({
  //   fonts: { // todo
  //     cssSrc: 'https://fonts.googleapis.com/css?family=Open+Sans',
  //     // or
  //     family: 'Avenir',
  //     src: 'url(https://my-domain.com/assets/avenir.woff)',
  //   },
  //   locale: "en" // todo
  // })
  elements(options: any) {
    return new Elements(options, {
      ...this.#metadata,
      clientJSON: this.#client.toJSON(),
    });
  }

  notebook(notebookId?: string) {
    return new Notebook(
      notebookId,
      // || this.#client.config.notebookId,
      this.#client,
      this.#metadata
    );
  }
}

export default Skyflow;
