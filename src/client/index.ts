class Client {
  appSecret: string;
  appId: string;
  username: string;
  password: string;
  metaData: any;
  constructor(
    username: string,
    password: string,
    appId: string,
    appSecret: string = "",
    metaData: any
  ) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.username = username;
    this.password = password;
    this.metaData = metaData;
  }

  getAppSecret() {
    // get appSecret
  }

  toJSON() {
    return {
      appId: this.appId,
      appSecret: this.appSecret,
      username: this.username,
      password: this.password,
    };
  }

  static fromJSON(json) {
    // const client = new Client()
    // // get appSec
    // return client;
  }

  init() {}

  deliverPayload(body) {

  }
}

export default Client;
