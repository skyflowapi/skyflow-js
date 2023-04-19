import Skyflow from "../../src/skyflow";

const mGetRandomValues = jest.fn().mockReturnValue(new Uint32Array(10));
Object.defineProperty(window, "crypto", {
  value: { getRandomValues: mGetRandomValues },
});

const skyflow = Skyflow.init({
  vaultID: "vault_id",
  vaultURL: "https://vault.test.com",
  getBearerToken: () =>
    new Promise((resolve, reject) => {
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
    }),
});

jest.setTimeout(15000);

describe("Delete PureJS -> delete() method input", () => {
  test("should throw error for Empty Input Array", (done) => {
    skyflow.delete([]).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should throw error for Empty Object in Input", (done) => {
    skyflow.delete({ records: [{}] }).catch((err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should throw error for Missing table Property", (done) => {
    skyflow
      .delete({
        records: [
          {
            id: "id1",
          },
        ],
      })
      .catch((err) => {
        expect(err).toBeDefined();
        done();
      });
  });

  test("should throw error for Missing id Property", (done) => {
    skyflow
      .delete({
        records: [
          {
            table: "table",
          },
        ],
      })
      .catch((err) => {
        expect(err).toBeDefined();
        done();
      });
  });
});

// describe("delete method tests", () => {
//   const cause = {
//     error: {
//       code: 400,
//       description: "invalid",
//     },
//   };
//   test("formatErrorResponse fn test", () => {
		
// 	});
// });

// describe("delete fn response test", () => {
//   test("only success response", () => {
//     const testInput = {
//       records: [{ id: "29ebda8d-5272-4063-af58-15cc674e332b", table: "cards" }],
//     };
//     const deleteResponse = { deleted: true };
//     const res = skyflow.delete(testInput);
//   });

//   test("both error and success response", () => {});

//   test("only error response", () => {
//     const testInput = {
//       records: [{ id: "29ebda8d-5272-4063-af58-15cc674e332b", table: "cards" }],
//     };
//     const deleteResponse = { deleted: true };
//     const res = skyflow.delete(testInput);
//   });
// });
