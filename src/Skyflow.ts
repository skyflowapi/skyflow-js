import Elements from "./elements/external";
import Client from "./client";
import pk from "../package.json";
import uuid from "./libs/uuid";

class Skyflow {
  client: Client;
  static version: string = pk.version;
  uuid: string = uuid();
  constructor(
    username: string,
    password: string,
    appId: string,
    appSecret: string = ""
  ) {
    this.client = new Client(username, password, appId, appSecret, {
      uuid: this.uuid,
    });
  }

  elements(options: any) {
    return new Elements(options, { uuid: this.uuid });
  }
}

export default Skyflow;
