import { properties } from "../properties";

class Client {
  // appSecret: string;
  appId: string;
  // username: string;
  // password: string;
  // metaData: any;
  constructor(
    // username: string,
    // password: string,
    appId: string
    // appSecret: string = "",
    // metaData: any
  ) {
    this.appId = appId;
    // this.appSecret = appSecret;
    // this.username = username;
    // this.password = password;
    // this.metaData = metaData;
  }

  // getAppSecret() {
  //   // get appSecret
  // }

  toJSON() {
    return {
      appId: this.appId,
      // appSecret: this.appSecret,
      // username: this.username,
      // password: this.password,
    };
  }

  static fromJSON(json) {
    const client = new Client(json.appId);
    // get appSecret
    return client;
  }

  deliverPayload(body) {
    return new Promise((resolve, reject) => {
      const httpRequest = new XMLHttpRequest();
      if (!httpRequest) {
        reject("Error while initializing the connection");
      }

      httpRequest.open("POST", properties.CLIENT_URL);
      // httpRequest.setRequestHeader("Skyflow_app_id", this.appId);
      // httpRequest.setRequestHeader(
      //   "content-type",
      //   "application/json; charset=utf-8"
      // );
      httpRequest.responseType = "json";
      httpRequest.send(JSON.stringify({ ...body, Skyflow_app_id: this.appId }));

      httpRequest.onload = () => {
        if (httpRequest.status < 200 || httpRequest.status >= 400)
          reject(httpRequest.response);

        resolve(httpRequest.response);
      };

      httpRequest.onerror = (error) => {
        reject(new Error("An error occurred during transaction"));
      };
    });
  }
}

export default Client;
