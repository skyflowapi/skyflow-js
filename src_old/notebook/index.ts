import Client from "../client";
import { properties } from "../properties";
import RevealElement from "./RevealElement";

export default class Notebook {
  #notebookId: string;
  #client: Client;
  #metadata;
  #appSecret?: string;
  #bearerToken?: string;
  #Headers: Record<string, string> = {};
  #callbacks: Function[] = [];
  constructor(notebookId: string = "", client: Client, metadata, headers: any = {}) {
    this.#metadata = metadata;
    this.#client = client;
    this.#notebookId = notebookId;
    this.#Headers["X-SKYFLOW-APP-ID"] = this.#client.config.appId;

    // if (
    //   headers["Authorization"] &&
    //   headers["X-SKYFLOW-APP-ID"] &&
    //   headers["X-SKYFLOW-APP-SECRET"]
    // ) {
    //   this.#Headers["Authorization"] = headers["Authorization"];
    //   this.#Headers["X-SKYFLOW-APP-ID"] = headers["X-SKYFLOW-APP-ID"];
    //   this.#Headers["X-SKYFLOW-APP-SECRET"] = headers["X-SKYFLOW-APP-SECRET"];
    // } else {
    //   this.#setup();
    // }
  }

  getRecord = (token: string) => {
    return new Promise((resolve, reject) => {
      const callback = () => {
        this.#client
          .request({
            url: this.#client.config.workflowURL + `/getrecords`,
            requestMethod: "POST",
            headers: this.#Headers,
            body: {
              recordID: token,
              orgID: this.#client.config.orgId,
              vaultID: this.#client.config.vaultId,
            },
          })
          .then((data: any) => resolve(data))
          .catch((err) => reject(err));
      };
      callback();
      // if (this.#Headers) {
      //   callback();
      // } else {
      //   this.#callbacks.push(callback);
      // }
    });
  };

  /*
  revealToken("123123wwe", "#wwe", {
    class: ".base", // todo
    styles: {
      "font-size": "12px"
    }
  })
  */
  revealToken = (token: string, domSelectorOrElement: Element | string, options = {}) => {
    return new Promise((resolve, reject) => {
      const callback = () => {
        options = {
          ...options,
          headers: this.#Headers,
          token: token,
        };
        const element = new RevealElement(
          btoa(new Date().getTime() + "").slice(0, -2),
          this.#metadata,
          options,
          { ...this.#client.toJSON(), notebookId: this.#notebookId }
        );

        element.mount(domSelectorOrElement);

        element
          .getPromise()
          ?.then((data) => {
            resolve({ element, data });
          })
          .catch((error) => {
            reject({ element, error });
          });
      };
      callback();
      // if (this.#Headers) {
      //   callback();
      // } else {
      //   this.#callbacks.push(callback);
      // }
    });
  };

  updateRecord = (token: string, fields: any) => {
    return new Promise((resolve, reject) => {
      const callback = () => {
        this.#client
          .request({
            url: this.#client.config.workflowURL + `/updaterecords`,
            requestMethod: "POST",
            headers: this.#Headers,
            body: {
              recordID: token,
              orgID: this.#client.config.orgId,
              vaultID: this.#client.config.vaultId,
              data: {
                record: {
                  ID: token,
                  fields: fields,
                },
              },
            },
          })
          .then((data: any) => resolve(data))
          .catch((err) => reject(err));
      };
      callback();
      // if (this.#Headers) {
      //   callback();
      // } else {
      //   this.#callbacks.push(callback);
      // }
    });
  };

  // #setup = () => {
  //   this.#client
  //     .request({
  //       body: {
  //         username: this.#client.config.username,
  //         password: this.#client.config.password,
  //       },
  //       headers: this.#Headers,
  //       requestMethod: "POST",
  //       url: properties.WORKFLOW_URL + "/v1/auth/token",
  //     })
  //     .then((data: any) => {
  //       if (data.accessToken) {
  //         this.#bearerToken = `Bearer ${data.accessToken}`;

  //         this.#client
  //           .request({
  //             url:
  //               properties.WORKFLOW_URL +
  //               `/v1/applications/${this.#client.config.appId}/reveal`,
  //             requestMethod: "POST",
  //             headers: {
  //               "X-SKYFLOW-APP-ID": this.#client.config.orgAppId,
  //               "X-SKYFLOW-APP-SECRET": this.#client.config.orgAppSecret,
  //               Authorization: this.#bearerToken,
  //               "X-SKYFLOW-ORG-ID": this.#client.config.orgId,
  //             },
  //           })
  //           .then((data: any) => {
  //             this.#appSecret = data.applicationSecret;
  //             if (this.#appSecret && this.#bearerToken) {
  //               this.#Headers = {
  //                 "X-SKYFLOW-APP-ID": this.#client.config.appId,
  //                 "X-SKYFLOW-APP-SECRET": this.#appSecret,
  //                 Authorization: this.#bearerToken,
  //                 "X-SKYFLOW-ORG-ID": this.#client.config.orgId,
  //               };
  //             }

  //             this.#callbacks.forEach((callback) => {
  //               callback();
  //             });
  //             this.#callbacks = [];
  //           })
  //           .catch((err) => {
  //             throw new Error(err);
  //           });
  //       } else {
  //         throw new Error("No accessToken in the response:" + data);
  //       }
  //     })
  //     .catch((err) => {
  //       throw new Error(err);
  //     });
  // };
}
