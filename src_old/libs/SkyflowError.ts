interface ISkyflowError {
  type: string;
  code: string;
  message: string;
}
export default class SkyflowError extends Error {
  readonly name = "Skyflow";
  type: string;
  code: string;
  message: string;
  constructor(obj: ISkyflowError) {
    super();
    this.type = obj.type;
    this.code = obj.code;
    this.message = obj.message;
  }

  static TYPES = {
    CUSTOMER: "CUSTOMER",
    MERCHANT: "MERCHANT",
    NETWORK: "NETWORK",
    INTERNAL: "INTERNAL",
    UNKNOWN: "UNKNOWN",
  };
}

