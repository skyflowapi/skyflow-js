import Elements from "./elements/external";
import Client from "./client";
import uuid from "./libs/uuid";
import { properties } from "./properties";

class Skyflow {
  client: Client;
  static version = properties.VERSION;
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
      uuid: this.uuid,
      clientDomain: location.origin,
    });
  }
}

export default Skyflow;
