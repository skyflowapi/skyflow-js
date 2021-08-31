import Skyflow, { RedactionType } from "../../src/Skyflow";
const testTokenId = "1677f7bd-c087-4645-b7da-80a6fd1a81a4";
const testRedactionType = RedactionType.PLAIN_TEXT;
const testInvalidTokenId = "80a6fd1a81a4-b7da-c087-4645";
const skyflow = Skyflow.init({
  vaultID: "e20afc3ae1b54f0199f24130e51e0c11",
  vaultURL: "https://sb.area51.vault.skyflowapis.dev",
  getBearerToken: () => {
    return new Promise((resolve, reject) => {
      const Http = new XMLHttpRequest();

      Http.onreadystatechange = () => {
        if (Http.readyState == 4 && Http.status == 200) {
          const response = JSON.parse(Http.responseText);
          resolve(response.accessToken);
        }
      };
      const url = "http://localhost:8000/js/userToken";
      Http.open("GET", url);
      Http.send();
    });
  },
});

jest.setTimeout(15000);

describe("Reveal PureJs- get() Method Input", () => {
  test("should throw error for Empty Input Array", () => {
    try {
      skyflow.get([]);
    } catch (error) {
      expect(error.message).toBe("Empty Records");
    }
  });
  test("should throw error for Empty Object in Input", () => {
    try {
      skyflow.get([{}]);
    } catch (error) {
      expect(error.message).toBe("Record cannot be Empty Object");
    }
  });
  test("should throw error for Missing id Property", () => {
    try {
      skyflow.get([
        {
          redaction: RedactionType.PLAIN_TEXT,
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Missing id property");
    }
  });
  test("should throw error for Missing redaction Property", () => {
    try {
      skyflow.get([
        {
          id: testTokenId,
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Missing Redaction property");
    }
  });
  test("should throw error for Empty string in id value", () => {
    try {
      skyflow.get([
        {
          id: "",
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Missing id property");
    }
  });
  test("should throw error for Invalid type in id value", () => {
    try {
      skyflow.get([
        {
          id: true,
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Invalid Token Id");
    }
    try {
      skyflow.get([
        {
          id: 24,
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Invalid Token Id");
    }
    try {
      skyflow.get([
        {
          id: {},
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Invalid Token Id");
    }
  });
  test("should throw error for Empty string in redaction value", () => {
    try {
      skyflow.get([
        {
          id: testTokenId,
          redaction: "",
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Missing Redaction property");
    }
  });
  test("should throw error for Invalid type in redaction value", () => {
    try {
      skyflow.get([
        {
          id: testTokenId,
          redaction: "INVALID",
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Invalid Redaction Type");
    }
    try {
      skyflow.get([
        {
          id: testTokenId,
          redaction: true,
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Invalid Redaction Type");
    }
    try {
      skyflow.get([
        {
          id: testTokenId,
          redaction: {},
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Invalid Redaction Type");
    }
    try {
      skyflow.get([
        {
          id: testTokenId,
          redaction: 899,
        },
      ]);
    } catch (error) {
      expect(error.message).toBe("Invalid Redaction Type");
    }
  });
  test("should NOT throw any error for Valid Id and redadction", () => {
    try {
      skyflow.get([
        {
          id: testTokenId,
          redaction: testRedactionType,
        },
      ]);
    } catch (error) {
      expect(error).toBeNull();
    }
  });
});

describe("Reveal Pure Js - get() Method Response", () => {
  const singleValidTokenResponse = skyflow.get([
    {
      id: testTokenId,
      redaction: testRedactionType,
    },
  ]);
  const singleInvalidTokenResponse = skyflow.get([
    {
      id: testInvalidTokenId,
      redaction: testRedactionType,
    },
  ]);

  const validMultiRedactionResponse = skyflow.get([
    {
      id: testTokenId,
      redaction: testRedactionType,
    },
    {
      id: "be9ca047-0c17-4b8f-acf4-a8793d5dd479",
      redaction: RedactionType.DEFAULT,
    },
  ]);

  test("method response should contain records and errors properties", () => {
    return singleValidTokenResponse
      .then((result) => {
        expect(result.hasOwnProperty("records")).toBe(true);
        expect(result.hasOwnProperty("errors")).toBe(true);
      })
      .catch((error) => {
        expect(error).toBe(false);
        console.log(error);
      });
  });
  test("For Single valid Token, errors must be empty array,and records should not be empty", () => {
    return singleValidTokenResponse
      .then((result) => {
        expect(result.errors.length === 0).toBe(true);
        expect(result.records.length !== 0).toBe(true);
      })
      .catch((error) => {
        expect(error).toBe(false);
        console.log(error);
      });
  });
  test("For Single valid Token, records should have id with testTokenId", () => {
    return singleValidTokenResponse
      .then((result) => {
        expect(result.records[0].id).toBe(testTokenId);
      })
      .catch((error) => {
        expect(error).toBe(false);
        console.log(error);
      });
  });
  test("For Single invalid Token,errors should not be empty,records should be empty", () => {
    return singleInvalidTokenResponse
      .then((result) => {
        expect(result.errors.length !== 0).toBe(true);
        expect(result.records.length === 0).toBe(true);
      })
      .catch((error) => {
        expect(error).toBe(false);
        console.log(error);
      });
  });
  test("For Single invalid Token,errors should have id with testInvalidTokenId", () => {
    return singleInvalidTokenResponse
      .then((result) => {
        expect(result.errors[0].id).toBe(testInvalidTokenId);
      })
      .catch((error) => {
        console.log(error).toBe(false);
        console.log(error);
      });
  });
  test("For valid ids with different Redaction Response, errors must be empty,records should not be empty", () => {
    return validMultiRedactionResponse
      .then((result) => {
        expect(result.records.length !== 0).toBe(true);
        expect(result.records.length === 2).toBe(true);
        expect(result.errors.length === 0).toBe(true);
      })
      .catch((error) => {
        expect(error).toBe(false);
        console.log(error);
      });
  });
});
