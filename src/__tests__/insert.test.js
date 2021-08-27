import Skyflow from "../Skyflow";

describe("Insert Records Test", () => {
  /**
   * success inserting records
   */
  test("should insert records", async () => {
    var skyflow = Skyflow.init({
      vaultId: "e20afc3ae1b54f0199f24130e51e0c11",
      vaultURL: "https://sb.area51.vault.skyflowapis.dev",
      getAccessToken: () => {
        return Promise.resolve(
          "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL21hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJjbGkiOiJiNTJkYWUzZjNhOTg0MTAzYWMxMzgyOGYzOTFjMTdkMCIsImV4cCI6MTYzMDA2NDE1NCwiaWF0IjoxNjMwMDYyNjU0LCJpc3MiOiJzYS1hdXRoQG1hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJqdGkiOiJ1OGNmMGE3ZWQxNWY0NzY3OGFjMTAxOTQxYjFlY2NmNSIsInNjcCI6WyJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwicmVjb3Jkcy5jcmVhdGUiLCJyZWNvcmRzLnVwZGF0ZSIsInJlY29yZHMuZGVsZXRlIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwiYWNjb3VudHMucmVhZCIsIndvcmtzcGFjZXMucmVhZCIsInVzZXJzLnJlYWQiLCJzZXJ2aWNlQWNjb3VudC52YXVsdC5jcmVhdGUiLCJzZXJ2aWNlQWNjb3VudC5yZWFkIiwic2VydmljZUFjY291bnQudXBkYXRlIiwic2VydmljZUFjY291bnQuZGVsZXRlIiwic2VydmljZUFjY291bnQuc3RhdHVzLnVwZGF0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcudmF1bHQuY3JlYXRlIiwidmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwidmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJ2YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcuc3RhdHVzLnVwZGF0ZSIsInNxbFNlcnZpY2VBY2NvdW50LmNyZWF0ZSIsInZhdWx0cy5yZWFkIiwidmF1bHRzLnVwZGF0ZSIsInZhdWx0cy5kZWxldGUiLCJ2YXVsdHMuc3RhdHVzLnVwZGF0ZSIsImtleS5jcmVhdGUiLCJrZXkudXBkYXRlIiwia2V5LnZhdWx0LnVwZGF0ZSIsImtleS52YXVsdC5yZWFkIiwidmF1bHRUZW1wbGF0ZXMudmFsaWRhdGUiLCJzcWwucmVhZCIsInJlY29yZHMucmVhZCIsInJlY29yZHMuY3JlYXRlIiwicmVjb3Jkcy51cGRhdGUiLCJyZWNvcmRzLmRlbGV0ZSIsInJvbGVzLnZhdWx0LmNyZWF0ZSIsInJvbGVzLnZhdWx0LnJlYWQiLCJyb2xlcy52YXVsdC51cGRhdGUiLCJyb2xlcy52YXVsdC5kZWxldGUiLCJyb2xlcy52YXVsdC5tZW1iZXJzLnJlYWQiLCJyb2xlcy5wb2xpY3kucmVhZCIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcuY3JlYXRlIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJyb2xlcy52YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcubWVtYmVycy5yZWFkIiwicm9sZXMuZGVmaW5pdGlvbnMucmVhZCIsInJvbGVzLm1lbWJlclJvbGVzLnJlYWQiLCJyb2xlcy5tZW1iZXJQZXJtaXNzaW9ucy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwicG9saWNpZXMudmF1bHQuY3JlYXRlIiwicG9saWNpZXMudmF1bHQucmVhZCIsInBvbGljaWVzLnZhdWx0LnVwZGF0ZSIsInBvbGljaWVzLnZhdWx0LmRlbGV0ZSIsInBvbGljaWVzLnZhdWx0LnN0YXR1cy51cGRhdGUiLCJwb2xpY2llcy5yb2xlLnZhdWx0LnJlYWQiXSwic3ViIjoiSnNTZGsifQ.WNAqd6_tLmom3G1rFgTJBUJDTIHI0yPscn3RA7CEd1DmOxR622GdcYNHiJpmXkAP3uqJ-KlL7STkjMuCotqTlyBeR8ODz6xdMvqrvRAvI7_iyDjEkGbozVpmE0SDkt7ZLcyW4bfZX6QkRz4m8U6kq13qz2PA0uojaFYhkvqR6BiGHU9Lqz7YiHtQ7d3SFM7hKOl26F9Gm4HpPHqgsH-T-mbf5SlZhM2Vdgu9TLCkfLrriRcKS_EyhieUOoWl9g04VsRpAitwMlWc7TfIEg9R6AM8A7b7GnKh_Q2k5dg2croNITOv6yPUoKsNy8arjlQ5GT3YSr8rAL4Zw2IYDgvKFA"
        );
      },
    });
    const response = await skyflow.insert(
      {
        records: [
          {
            table: "pii_fields",
            fields: {
              first_name: "Joseph",
              middle_name: "Dave",
              last_name: "Gomez",
            },
          },
        ],
      },
      {
        tokens: true,
      }
    );
    expect(response.hasOwnProperty("records")).toBe(true);
  });

  test("should fail inserting records  ", async () => {
    var skyflow = Skyflow.init({
      vaultId: "e20afc3ae1b54f0199f24130e51e0c11",
      vaultURL: "https://sb.area51.vault.skyflowapis.dev",
      getAccessToken: () => {
        return Promise.resolve(
          "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL21hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJjbGkiOiJiNTJkYWUzZjNhOTg0MTAzYWMxMzgyOGYzOTFjMTdkMCIsImV4cCI6MTYzMDA2NDE1NCwiaWF0IjoxNjMwMDYyNjU0LCJpc3MiOiJzYS1hdXRoQG1hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJqdGkiOiJ1OGNmMGE3ZWQxNWY0NzY3OGFjMTAxOTQxYjFlY2NmNSIsInNjcCI6WyJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwicmVjb3Jkcy5jcmVhdGUiLCJyZWNvcmRzLnVwZGF0ZSIsInJlY29yZHMuZGVsZXRlIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwiYWNjb3VudHMucmVhZCIsIndvcmtzcGFjZXMucmVhZCIsInVzZXJzLnJlYWQiLCJzZXJ2aWNlQWNjb3VudC52YXVsdC5jcmVhdGUiLCJzZXJ2aWNlQWNjb3VudC5yZWFkIiwic2VydmljZUFjY291bnQudXBkYXRlIiwic2VydmljZUFjY291bnQuZGVsZXRlIiwic2VydmljZUFjY291bnQuc3RhdHVzLnVwZGF0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcudmF1bHQuY3JlYXRlIiwidmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwidmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJ2YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcuc3RhdHVzLnVwZGF0ZSIsInNxbFNlcnZpY2VBY2NvdW50LmNyZWF0ZSIsInZhdWx0cy5yZWFkIiwidmF1bHRzLnVwZGF0ZSIsInZhdWx0cy5kZWxldGUiLCJ2YXVsdHMuc3RhdHVzLnVwZGF0ZSIsImtleS5jcmVhdGUiLCJrZXkudXBkYXRlIiwia2V5LnZhdWx0LnVwZGF0ZSIsImtleS52YXVsdC5yZWFkIiwidmF1bHRUZW1wbGF0ZXMudmFsaWRhdGUiLCJzcWwucmVhZCIsInJlY29yZHMucmVhZCIsInJlY29yZHMuY3JlYXRlIiwicmVjb3Jkcy51cGRhdGUiLCJyZWNvcmRzLmRlbGV0ZSIsInJvbGVzLnZhdWx0LmNyZWF0ZSIsInJvbGVzLnZhdWx0LnJlYWQiLCJyb2xlcy52YXVsdC51cGRhdGUiLCJyb2xlcy52YXVsdC5kZWxldGUiLCJyb2xlcy52YXVsdC5tZW1iZXJzLnJlYWQiLCJyb2xlcy5wb2xpY3kucmVhZCIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcuY3JlYXRlIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJyb2xlcy52YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcubWVtYmVycy5yZWFkIiwicm9sZXMuZGVmaW5pdGlvbnMucmVhZCIsInJvbGVzLm1lbWJlclJvbGVzLnJlYWQiLCJyb2xlcy5tZW1iZXJQZXJtaXNzaW9ucy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwicG9saWNpZXMudmF1bHQuY3JlYXRlIiwicG9saWNpZXMudmF1bHQucmVhZCIsInBvbGljaWVzLnZhdWx0LnVwZGF0ZSIsInBvbGljaWVzLnZhdWx0LmRlbGV0ZSIsInBvbGljaWVzLnZhdWx0LnN0YXR1cy51cGRhdGUiLCJwb2xpY2llcy5yb2xlLnZhdWx0LnJlYWQiXSwic3ViIjoiSnNTZGsifQ.WNAqd6_tLmom3G1rFgTJBUJDTIHI0yPscn3RA7CEd1DmOxR622GdcYNHiJpmXkAP3uqJ-KlL7STkjMuCotqTlyBeR8ODz6xdMvqrvRAvI7_iyDjEkGbozVpmE0SDkt7ZLcyW4bfZX6QkRz4m8U6kq13qz2PA0uojaFYhkvqR6BiGHU9Lqz7YiHtQ7d3SFM7hKOl26F9Gm4HpPHqgsH-T-mbf5SlZhM2Vdgu9TLCkfLrriRcKS_EyhieUOoWl9g04VsRpAitwMlWc7TfIEg9R6AM8A7b7GnKh_Q2k5dg2croNITOv6yPUoKsNy8arjlQ5GT3YSr8rAL4Zw2IYDgvKFA"
        );
      },
    });
    try {
      const response = await skyflow.insert(
        {
          records: [
            {
              table: "ABC",
              fields: {
                first_name: "john",
                middle_name: "clarke",
                last_name: "henry",
              },
            },
          ],
        },
        {
          tokens: true,
        }
      );
      expect(response.hasOwnProperty("error")).toBe(true);
    } catch (error) {
      expect(error.hasOwnProperty("error")).toBe(true);
    }
  });

  test("test of inserting records with wrong table name passed", async () => {
    try {
      var skyflow = Skyflow.init({
        vaultId: "e20afc3ae1b54f0199f24130e51e0c11",
        vaultURL: "https://sb.area51.vault.skyflowapis.dev",
        getAccessToken: () => {
          return Promise.resolve(
            "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL21hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJjbGkiOiJiNTJkYWUzZjNhOTg0MTAzYWMxMzgyOGYzOTFjMTdkMCIsImV4cCI6MTYzMDA2NDE1NCwiaWF0IjoxNjMwMDYyNjU0LCJpc3MiOiJzYS1hdXRoQG1hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJqdGkiOiJ1OGNmMGE3ZWQxNWY0NzY3OGFjMTAxOTQxYjFlY2NmNSIsInNjcCI6WyJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwicmVjb3Jkcy5jcmVhdGUiLCJyZWNvcmRzLnVwZGF0ZSIsInJlY29yZHMuZGVsZXRlIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwiYWNjb3VudHMucmVhZCIsIndvcmtzcGFjZXMucmVhZCIsInVzZXJzLnJlYWQiLCJzZXJ2aWNlQWNjb3VudC52YXVsdC5jcmVhdGUiLCJzZXJ2aWNlQWNjb3VudC5yZWFkIiwic2VydmljZUFjY291bnQudXBkYXRlIiwic2VydmljZUFjY291bnQuZGVsZXRlIiwic2VydmljZUFjY291bnQuc3RhdHVzLnVwZGF0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcudmF1bHQuY3JlYXRlIiwidmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwidmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJ2YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcuc3RhdHVzLnVwZGF0ZSIsInNxbFNlcnZpY2VBY2NvdW50LmNyZWF0ZSIsInZhdWx0cy5yZWFkIiwidmF1bHRzLnVwZGF0ZSIsInZhdWx0cy5kZWxldGUiLCJ2YXVsdHMuc3RhdHVzLnVwZGF0ZSIsImtleS5jcmVhdGUiLCJrZXkudXBkYXRlIiwia2V5LnZhdWx0LnVwZGF0ZSIsImtleS52YXVsdC5yZWFkIiwidmF1bHRUZW1wbGF0ZXMudmFsaWRhdGUiLCJzcWwucmVhZCIsInJlY29yZHMucmVhZCIsInJlY29yZHMuY3JlYXRlIiwicmVjb3Jkcy51cGRhdGUiLCJyZWNvcmRzLmRlbGV0ZSIsInJvbGVzLnZhdWx0LmNyZWF0ZSIsInJvbGVzLnZhdWx0LnJlYWQiLCJyb2xlcy52YXVsdC51cGRhdGUiLCJyb2xlcy52YXVsdC5kZWxldGUiLCJyb2xlcy52YXVsdC5tZW1iZXJzLnJlYWQiLCJyb2xlcy5wb2xpY3kucmVhZCIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcuY3JlYXRlIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJyb2xlcy52YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcubWVtYmVycy5yZWFkIiwicm9sZXMuZGVmaW5pdGlvbnMucmVhZCIsInJvbGVzLm1lbWJlclJvbGVzLnJlYWQiLCJyb2xlcy5tZW1iZXJQZXJtaXNzaW9ucy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwicG9saWNpZXMudmF1bHQuY3JlYXRlIiwicG9saWNpZXMudmF1bHQucmVhZCIsInBvbGljaWVzLnZhdWx0LnVwZGF0ZSIsInBvbGljaWVzLnZhdWx0LmRlbGV0ZSIsInBvbGljaWVzLnZhdWx0LnN0YXR1cy51cGRhdGUiLCJwb2xpY2llcy5yb2xlLnZhdWx0LnJlYWQiXSwic3ViIjoiSnNTZGsifQ.WNAqd6_tLmom3G1rFgTJBUJDTIHI0yPscn3RA7CEd1DmOxR622GdcYNHiJpmXkAP3uqJ-KlL7STkjMuCotqTlyBeR8ODz6xdMvqrvRAvI7_iyDjEkGbozVpmE0SDkt7ZLcyW4bfZX6QkRz4m8U6kq13qz2PA0uojaFYhkvqR6BiGHU9Lqz7YiHtQ7d3SFM7hKOl26F9Gm4HpPHqgsH-T-mbf5SlZhM2Vdgu9TLCkfLrriRcKS_EyhieUOoWl9g04VsRpAitwMlWc7TfIEg9R6AM8A7b7GnKh_Q2k5dg2croNITOv6yPUoKsNy8arjlQ5GT3YSr8rAL4Zw2IYDgvKFA"
          );
        },
      });
      const response = await skyflow.insert(
        {
          records: [
            {
              // table: "pii_fields",
              fields: {
                first_name: "john",
                middle_name: "clarke",
                last_name: "henry",
              },
            },
          ],
        },
        {
          tokens: true,
        }
      );
      expect(response.hasOwnProperty("error")).toBe(true);
    } catch (err) {
      expect(err.message).toBe("table or fields parameter cannot be passed as empty");
    }
  });

  test("fails in insertion due to absence of field parameter", async () => {
    try {
      var skyflow = Skyflow.init({
        vaultId: "e20afc3ae1b54f0199f24130e51e0c11",
        vaultURL: "https://sb.area51.vault.skyflowapis.dev",
        getAccessToken: () => {
          return Promise.resolve(
            "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL21hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJjbGkiOiJiNTJkYWUzZjNhOTg0MTAzYWMxMzgyOGYzOTFjMTdkMCIsImV4cCI6MTYzMDA2NDE1NCwiaWF0IjoxNjMwMDYyNjU0LCJpc3MiOiJzYS1hdXRoQG1hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJqdGkiOiJ1OGNmMGE3ZWQxNWY0NzY3OGFjMTAxOTQxYjFlY2NmNSIsInNjcCI6WyJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwicmVjb3Jkcy5jcmVhdGUiLCJyZWNvcmRzLnVwZGF0ZSIsInJlY29yZHMuZGVsZXRlIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwiYWNjb3VudHMucmVhZCIsIndvcmtzcGFjZXMucmVhZCIsInVzZXJzLnJlYWQiLCJzZXJ2aWNlQWNjb3VudC52YXVsdC5jcmVhdGUiLCJzZXJ2aWNlQWNjb3VudC5yZWFkIiwic2VydmljZUFjY291bnQudXBkYXRlIiwic2VydmljZUFjY291bnQuZGVsZXRlIiwic2VydmljZUFjY291bnQuc3RhdHVzLnVwZGF0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcudmF1bHQuY3JlYXRlIiwidmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwidmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJ2YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcuc3RhdHVzLnVwZGF0ZSIsInNxbFNlcnZpY2VBY2NvdW50LmNyZWF0ZSIsInZhdWx0cy5yZWFkIiwidmF1bHRzLnVwZGF0ZSIsInZhdWx0cy5kZWxldGUiLCJ2YXVsdHMuc3RhdHVzLnVwZGF0ZSIsImtleS5jcmVhdGUiLCJrZXkudXBkYXRlIiwia2V5LnZhdWx0LnVwZGF0ZSIsImtleS52YXVsdC5yZWFkIiwidmF1bHRUZW1wbGF0ZXMudmFsaWRhdGUiLCJzcWwucmVhZCIsInJlY29yZHMucmVhZCIsInJlY29yZHMuY3JlYXRlIiwicmVjb3Jkcy51cGRhdGUiLCJyZWNvcmRzLmRlbGV0ZSIsInJvbGVzLnZhdWx0LmNyZWF0ZSIsInJvbGVzLnZhdWx0LnJlYWQiLCJyb2xlcy52YXVsdC51cGRhdGUiLCJyb2xlcy52YXVsdC5kZWxldGUiLCJyb2xlcy52YXVsdC5tZW1iZXJzLnJlYWQiLCJyb2xlcy5wb2xpY3kucmVhZCIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcuY3JlYXRlIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJyb2xlcy52YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcubWVtYmVycy5yZWFkIiwicm9sZXMuZGVmaW5pdGlvbnMucmVhZCIsInJvbGVzLm1lbWJlclJvbGVzLnJlYWQiLCJyb2xlcy5tZW1iZXJQZXJtaXNzaW9ucy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwicG9saWNpZXMudmF1bHQuY3JlYXRlIiwicG9saWNpZXMudmF1bHQucmVhZCIsInBvbGljaWVzLnZhdWx0LnVwZGF0ZSIsInBvbGljaWVzLnZhdWx0LmRlbGV0ZSIsInBvbGljaWVzLnZhdWx0LnN0YXR1cy51cGRhdGUiLCJwb2xpY2llcy5yb2xlLnZhdWx0LnJlYWQiXSwic3ViIjoiSnNTZGsifQ.WNAqd6_tLmom3G1rFgTJBUJDTIHI0yPscn3RA7CEd1DmOxR622GdcYNHiJpmXkAP3uqJ-KlL7STkjMuCotqTlyBeR8ODz6xdMvqrvRAvI7_iyDjEkGbozVpmE0SDkt7ZLcyW4bfZX6QkRz4m8U6kq13qz2PA0uojaFYhkvqR6BiGHU9Lqz7YiHtQ7d3SFM7hKOl26F9Gm4HpPHqgsH-T-mbf5SlZhM2Vdgu9TLCkfLrriRcKS_EyhieUOoWl9g04VsRpAitwMlWc7TfIEg9R6AM8A7b7GnKh_Q2k5dg2croNITOv6yPUoKsNy8arjlQ5GT3YSr8rAL4Zw2IYDgvKFA"
          );
        },
      });
      const response = await skyflow.insert(
        {
          records: [
            {
              table: "pii_fields",
              // fields: {
              //   first_name: "john",
              //   middle_name: "clarke",
              //   last_name: "henry",
              // },
            },
          ],
        },
        {
          tokens: true,
        }
      );
      expect(response.hasOwnProperty("error")).toBe(true);
    } catch (err) {
      expect(err.message).toBe(
        "table or fields parameter cannot be passed as empty"
      );
    }
  });

  
   test("fails in insertion due to absence of field parameter", async () => {
    try {
      var skyflow = Skyflow.init({
        vaultId: "e20afc3ae1b54f0199f24130e51e0c11",
        vaultURL: "https://sb.area51.vault.skyflowapis.dev",
        getAccessToken: () => {
          return Promise.resolve(
            "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL21hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJjbGkiOiJiNTJkYWUzZjNhOTg0MTAzYWMxMzgyOGYzOTFjMTdkMCIsImV4cCI6MTYzMDA2NDE1NCwiaWF0IjoxNjMwMDYyNjU0LCJpc3MiOiJzYS1hdXRoQG1hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJqdGkiOiJ1OGNmMGE3ZWQxNWY0NzY3OGFjMTAxOTQxYjFlY2NmNSIsInNjcCI6WyJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwicmVjb3Jkcy5jcmVhdGUiLCJyZWNvcmRzLnVwZGF0ZSIsInJlY29yZHMuZGVsZXRlIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwiYWNjb3VudHMucmVhZCIsIndvcmtzcGFjZXMucmVhZCIsInVzZXJzLnJlYWQiLCJzZXJ2aWNlQWNjb3VudC52YXVsdC5jcmVhdGUiLCJzZXJ2aWNlQWNjb3VudC5yZWFkIiwic2VydmljZUFjY291bnQudXBkYXRlIiwic2VydmljZUFjY291bnQuZGVsZXRlIiwic2VydmljZUFjY291bnQuc3RhdHVzLnVwZGF0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcudmF1bHQuY3JlYXRlIiwidmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwidmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJ2YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcuc3RhdHVzLnVwZGF0ZSIsInNxbFNlcnZpY2VBY2NvdW50LmNyZWF0ZSIsInZhdWx0cy5yZWFkIiwidmF1bHRzLnVwZGF0ZSIsInZhdWx0cy5kZWxldGUiLCJ2YXVsdHMuc3RhdHVzLnVwZGF0ZSIsImtleS5jcmVhdGUiLCJrZXkudXBkYXRlIiwia2V5LnZhdWx0LnVwZGF0ZSIsImtleS52YXVsdC5yZWFkIiwidmF1bHRUZW1wbGF0ZXMudmFsaWRhdGUiLCJzcWwucmVhZCIsInJlY29yZHMucmVhZCIsInJlY29yZHMuY3JlYXRlIiwicmVjb3Jkcy51cGRhdGUiLCJyZWNvcmRzLmRlbGV0ZSIsInJvbGVzLnZhdWx0LmNyZWF0ZSIsInJvbGVzLnZhdWx0LnJlYWQiLCJyb2xlcy52YXVsdC51cGRhdGUiLCJyb2xlcy52YXVsdC5kZWxldGUiLCJyb2xlcy52YXVsdC5tZW1iZXJzLnJlYWQiLCJyb2xlcy5wb2xpY3kucmVhZCIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcuY3JlYXRlIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJyb2xlcy52YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcubWVtYmVycy5yZWFkIiwicm9sZXMuZGVmaW5pdGlvbnMucmVhZCIsInJvbGVzLm1lbWJlclJvbGVzLnJlYWQiLCJyb2xlcy5tZW1iZXJQZXJtaXNzaW9ucy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwicG9saWNpZXMudmF1bHQuY3JlYXRlIiwicG9saWNpZXMudmF1bHQucmVhZCIsInBvbGljaWVzLnZhdWx0LnVwZGF0ZSIsInBvbGljaWVzLnZhdWx0LmRlbGV0ZSIsInBvbGljaWVzLnZhdWx0LnN0YXR1cy51cGRhdGUiLCJwb2xpY2llcy5yb2xlLnZhdWx0LnJlYWQiXSwic3ViIjoiSnNTZGsifQ.WNAqd6_tLmom3G1rFgTJBUJDTIHI0yPscn3RA7CEd1DmOxR622GdcYNHiJpmXkAP3uqJ-KlL7STkjMuCotqTlyBeR8ODz6xdMvqrvRAvI7_iyDjEkGbozVpmE0SDkt7ZLcyW4bfZX6QkRz4m8U6kq13qz2PA0uojaFYhkvqR6BiGHU9Lqz7YiHtQ7d3SFM7hKOl26F9Gm4HpPHqgsH-T-mbf5SlZhM2Vdgu9TLCkfLrriRcKS_EyhieUOoWl9g04VsRpAitwMlWc7TfIEg9R6AM8A7b7GnKh_Q2k5dg2croNITOv6yPUoKsNy8arjlQ5GT3YSr8rAL4Zw2IYDgvKFA"
          );
        },
      });
      const response = await skyflow.insert(
        {
          records: [
            {
              table: "pii_fields",
              fields: {
                name: "john",
                middle_name: "clarke",
                last_name: "henry",
              },
            },
          ],
        },
        {
          tokens: true,
        }
      );
      expect(response.hasOwnProperty("error")).toBe(true);
    } catch (err) {
      expect(err.error.message).toBe(
        "Invalid field present in JSON name"
      );
    }
  });
  
  test("fails in insertion due to wrong key passed instead of records key", async () => {
    try {
      var skyflow = Skyflow.init({
        vaultId: "e20afc3ae1b54f0199f24130e51e0c11",
        vaultURL: "https://sb.area51.vault.skyflowapis.dev",
        getAccessToken: () => {
          return Promise.resolve(
            "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL21hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJjbGkiOiJiNTJkYWUzZjNhOTg0MTAzYWMxMzgyOGYzOTFjMTdkMCIsImV4cCI6MTYzMDA2NDE1NCwiaWF0IjoxNjMwMDYyNjU0LCJpc3MiOiJzYS1hdXRoQG1hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJqdGkiOiJ1OGNmMGE3ZWQxNWY0NzY3OGFjMTAxOTQxYjFlY2NmNSIsInNjcCI6WyJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwicmVjb3Jkcy5jcmVhdGUiLCJyZWNvcmRzLnVwZGF0ZSIsInJlY29yZHMuZGVsZXRlIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwiYWNjb3VudHMucmVhZCIsIndvcmtzcGFjZXMucmVhZCIsInVzZXJzLnJlYWQiLCJzZXJ2aWNlQWNjb3VudC52YXVsdC5jcmVhdGUiLCJzZXJ2aWNlQWNjb3VudC5yZWFkIiwic2VydmljZUFjY291bnQudXBkYXRlIiwic2VydmljZUFjY291bnQuZGVsZXRlIiwic2VydmljZUFjY291bnQuc3RhdHVzLnVwZGF0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcudmF1bHQuY3JlYXRlIiwidmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwidmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJ2YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcuc3RhdHVzLnVwZGF0ZSIsInNxbFNlcnZpY2VBY2NvdW50LmNyZWF0ZSIsInZhdWx0cy5yZWFkIiwidmF1bHRzLnVwZGF0ZSIsInZhdWx0cy5kZWxldGUiLCJ2YXVsdHMuc3RhdHVzLnVwZGF0ZSIsImtleS5jcmVhdGUiLCJrZXkudXBkYXRlIiwia2V5LnZhdWx0LnVwZGF0ZSIsImtleS52YXVsdC5yZWFkIiwidmF1bHRUZW1wbGF0ZXMudmFsaWRhdGUiLCJzcWwucmVhZCIsInJlY29yZHMucmVhZCIsInJlY29yZHMuY3JlYXRlIiwicmVjb3Jkcy51cGRhdGUiLCJyZWNvcmRzLmRlbGV0ZSIsInJvbGVzLnZhdWx0LmNyZWF0ZSIsInJvbGVzLnZhdWx0LnJlYWQiLCJyb2xlcy52YXVsdC51cGRhdGUiLCJyb2xlcy52YXVsdC5kZWxldGUiLCJyb2xlcy52YXVsdC5tZW1iZXJzLnJlYWQiLCJyb2xlcy5wb2xpY3kucmVhZCIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcuY3JlYXRlIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJyb2xlcy52YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcubWVtYmVycy5yZWFkIiwicm9sZXMuZGVmaW5pdGlvbnMucmVhZCIsInJvbGVzLm1lbWJlclJvbGVzLnJlYWQiLCJyb2xlcy5tZW1iZXJQZXJtaXNzaW9ucy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwicG9saWNpZXMudmF1bHQuY3JlYXRlIiwicG9saWNpZXMudmF1bHQucmVhZCIsInBvbGljaWVzLnZhdWx0LnVwZGF0ZSIsInBvbGljaWVzLnZhdWx0LmRlbGV0ZSIsInBvbGljaWVzLnZhdWx0LnN0YXR1cy51cGRhdGUiLCJwb2xpY2llcy5yb2xlLnZhdWx0LnJlYWQiXSwic3ViIjoiSnNTZGsifQ.WNAqd6_tLmom3G1rFgTJBUJDTIHI0yPscn3RA7CEd1DmOxR622GdcYNHiJpmXkAP3uqJ-KlL7STkjMuCotqTlyBeR8ODz6xdMvqrvRAvI7_iyDjEkGbozVpmE0SDkt7ZLcyW4bfZX6QkRz4m8U6kq13qz2PA0uojaFYhkvqR6BiGHU9Lqz7YiHtQ7d3SFM7hKOl26F9Gm4HpPHqgsH-T-mbf5SlZhM2Vdgu9TLCkfLrriRcKS_EyhieUOoWl9g04VsRpAitwMlWc7TfIEg9R6AM8A7b7GnKh_Q2k5dg2croNITOv6yPUoKsNy8arjlQ5GT3YSr8rAL4Zw2IYDgvKFA"
          );
        },
      });
      const response = await skyflow.insert(
        {
          errors: [
            {
              table: "pii_fields",
              fields: {
                first_name: "john",
                middle_name: "clarke",
                last_name: "henry",
              },
            },
          ],
        },
        {
          tokens: true,
        }
      );
      expect(response.hasOwnProperty("error")).toBe(true);
    } catch (err) {
      expect(err.message).toBe("records object key value not found");
    }
  });

  test("fails in insertion due to empty table name passed", async () => {
    try {
      var skyflow = Skyflow.init({
        vaultId: "e20afc3ae1b54f0199f24130e51e0c11",
        vaultURL: "https://sb.area51.vault.skyflowapis.dev",
        getAccessToken: () => {
          return Promise.resolve(
            "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL21hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJjbGkiOiJiNTJkYWUzZjNhOTg0MTAzYWMxMzgyOGYzOTFjMTdkMCIsImV4cCI6MTYzMDA2NDE1NCwiaWF0IjoxNjMwMDYyNjU0LCJpc3MiOiJzYS1hdXRoQG1hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJqdGkiOiJ1OGNmMGE3ZWQxNWY0NzY3OGFjMTAxOTQxYjFlY2NmNSIsInNjcCI6WyJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwicmVjb3Jkcy5jcmVhdGUiLCJyZWNvcmRzLnVwZGF0ZSIsInJlY29yZHMuZGVsZXRlIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwiYWNjb3VudHMucmVhZCIsIndvcmtzcGFjZXMucmVhZCIsInVzZXJzLnJlYWQiLCJzZXJ2aWNlQWNjb3VudC52YXVsdC5jcmVhdGUiLCJzZXJ2aWNlQWNjb3VudC5yZWFkIiwic2VydmljZUFjY291bnQudXBkYXRlIiwic2VydmljZUFjY291bnQuZGVsZXRlIiwic2VydmljZUFjY291bnQuc3RhdHVzLnVwZGF0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcudmF1bHQuY3JlYXRlIiwidmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwidmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJ2YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcuc3RhdHVzLnVwZGF0ZSIsInNxbFNlcnZpY2VBY2NvdW50LmNyZWF0ZSIsInZhdWx0cy5yZWFkIiwidmF1bHRzLnVwZGF0ZSIsInZhdWx0cy5kZWxldGUiLCJ2YXVsdHMuc3RhdHVzLnVwZGF0ZSIsImtleS5jcmVhdGUiLCJrZXkudXBkYXRlIiwia2V5LnZhdWx0LnVwZGF0ZSIsImtleS52YXVsdC5yZWFkIiwidmF1bHRUZW1wbGF0ZXMudmFsaWRhdGUiLCJzcWwucmVhZCIsInJlY29yZHMucmVhZCIsInJlY29yZHMuY3JlYXRlIiwicmVjb3Jkcy51cGRhdGUiLCJyZWNvcmRzLmRlbGV0ZSIsInJvbGVzLnZhdWx0LmNyZWF0ZSIsInJvbGVzLnZhdWx0LnJlYWQiLCJyb2xlcy52YXVsdC51cGRhdGUiLCJyb2xlcy52YXVsdC5kZWxldGUiLCJyb2xlcy52YXVsdC5tZW1iZXJzLnJlYWQiLCJyb2xlcy5wb2xpY3kucmVhZCIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcuY3JlYXRlIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJyb2xlcy52YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcubWVtYmVycy5yZWFkIiwicm9sZXMuZGVmaW5pdGlvbnMucmVhZCIsInJvbGVzLm1lbWJlclJvbGVzLnJlYWQiLCJyb2xlcy5tZW1iZXJQZXJtaXNzaW9ucy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwicG9saWNpZXMudmF1bHQuY3JlYXRlIiwicG9saWNpZXMudmF1bHQucmVhZCIsInBvbGljaWVzLnZhdWx0LnVwZGF0ZSIsInBvbGljaWVzLnZhdWx0LmRlbGV0ZSIsInBvbGljaWVzLnZhdWx0LnN0YXR1cy51cGRhdGUiLCJwb2xpY2llcy5yb2xlLnZhdWx0LnJlYWQiXSwic3ViIjoiSnNTZGsifQ.WNAqd6_tLmom3G1rFgTJBUJDTIHI0yPscn3RA7CEd1DmOxR622GdcYNHiJpmXkAP3uqJ-KlL7STkjMuCotqTlyBeR8ODz6xdMvqrvRAvI7_iyDjEkGbozVpmE0SDkt7ZLcyW4bfZX6QkRz4m8U6kq13qz2PA0uojaFYhkvqR6BiGHU9Lqz7YiHtQ7d3SFM7hKOl26F9Gm4HpPHqgsH-T-mbf5SlZhM2Vdgu9TLCkfLrriRcKS_EyhieUOoWl9g04VsRpAitwMlWc7TfIEg9R6AM8A7b7GnKh_Q2k5dg2croNITOv6yPUoKsNy8arjlQ5GT3YSr8rAL4Zw2IYDgvKFA"
          );
        },
      });
      const response = await skyflow.insert(
        {
          records: [
            {
              table: "",
              fields: {
                first_name: "john",
                middle_name: "clarke",
                last_name: "henry",
              },
            },
          ],
        },
        {
          tokens: true,
        }
      );
      expect(response.hasOwnProperty("error")).toBe(true);
    } catch (err) {
      expect(err.message).toBe("Table can't be passed as empty");
    }
  });

  test("fails in insertion due to empty records object passed", async () => {
    try {
      var skyflow = Skyflow.init({
        vaultId: "e20afc3ae1b54f0199f24130e51e0c11",
        vaultURL: "https://sb.area51.vault.skyflowapis.dev",
        getAccessToken: () => {
          return Promise.resolve(
            "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL21hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJjbGkiOiJiNTJkYWUzZjNhOTg0MTAzYWMxMzgyOGYzOTFjMTdkMCIsImV4cCI6MTYzMDA2NDE1NCwiaWF0IjoxNjMwMDYyNjU0LCJpc3MiOiJzYS1hdXRoQG1hbmFnZS5za3lmbG93YXBpcy5kZXYiLCJqdGkiOiJ1OGNmMGE3ZWQxNWY0NzY3OGFjMTAxOTQxYjFlY2NmNSIsInNjcCI6WyJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJhY2NvdW50cy5yZWFkIiwid29ya3NwYWNlcy5yZWFkIiwidmF1bHRzLnJlYWQiLCJ2YXVsdFRlbXBsYXRlcy52YWxpZGF0ZSIsInNxbC5yZWFkIiwicmVjb3Jkcy5yZWFkIiwicmVjb3Jkcy5jcmVhdGUiLCJyZWNvcmRzLnVwZGF0ZSIsInJlY29yZHMuZGVsZXRlIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwiYWNjb3VudHMucmVhZCIsIndvcmtzcGFjZXMucmVhZCIsInVzZXJzLnJlYWQiLCJzZXJ2aWNlQWNjb3VudC52YXVsdC5jcmVhdGUiLCJzZXJ2aWNlQWNjb3VudC5yZWFkIiwic2VydmljZUFjY291bnQudXBkYXRlIiwic2VydmljZUFjY291bnQuZGVsZXRlIiwic2VydmljZUFjY291bnQuc3RhdHVzLnVwZGF0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcudmF1bHQuY3JlYXRlIiwidmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwidmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJ2YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInZhdWx0RnVuY3Rpb25Db25maWcuc3RhdHVzLnVwZGF0ZSIsInNxbFNlcnZpY2VBY2NvdW50LmNyZWF0ZSIsInZhdWx0cy5yZWFkIiwidmF1bHRzLnVwZGF0ZSIsInZhdWx0cy5kZWxldGUiLCJ2YXVsdHMuc3RhdHVzLnVwZGF0ZSIsImtleS5jcmVhdGUiLCJrZXkudXBkYXRlIiwia2V5LnZhdWx0LnVwZGF0ZSIsImtleS52YXVsdC5yZWFkIiwidmF1bHRUZW1wbGF0ZXMudmFsaWRhdGUiLCJzcWwucmVhZCIsInJlY29yZHMucmVhZCIsInJlY29yZHMuY3JlYXRlIiwicmVjb3Jkcy51cGRhdGUiLCJyZWNvcmRzLmRlbGV0ZSIsInJvbGVzLnZhdWx0LmNyZWF0ZSIsInJvbGVzLnZhdWx0LnJlYWQiLCJyb2xlcy52YXVsdC51cGRhdGUiLCJyb2xlcy52YXVsdC5kZWxldGUiLCJyb2xlcy52YXVsdC5tZW1iZXJzLnJlYWQiLCJyb2xlcy5wb2xpY3kucmVhZCIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcuY3JlYXRlIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy5yZWFkIiwicm9sZXMudmF1bHRGdW5jdGlvbkNvbmZpZy51cGRhdGUiLCJyb2xlcy52YXVsdEZ1bmN0aW9uQ29uZmlnLmRlbGV0ZSIsInJvbGVzLnZhdWx0RnVuY3Rpb25Db25maWcubWVtYmVycy5yZWFkIiwicm9sZXMuZGVmaW5pdGlvbnMucmVhZCIsInJvbGVzLm1lbWJlclJvbGVzLnJlYWQiLCJyb2xlcy5tZW1iZXJQZXJtaXNzaW9ucy5yZWFkIiwid29ya2Zsb3dzLnJlYWQiLCJ3b3JrZmxvd1J1bnMuY3JlYXRlIiwid29ya2Zsb3dSdW5zLnJlYWQiLCJ3b3JrZmxvd1J1bnMudXBkYXRlIiwicG9saWNpZXMudmF1bHQuY3JlYXRlIiwicG9saWNpZXMudmF1bHQucmVhZCIsInBvbGljaWVzLnZhdWx0LnVwZGF0ZSIsInBvbGljaWVzLnZhdWx0LmRlbGV0ZSIsInBvbGljaWVzLnZhdWx0LnN0YXR1cy51cGRhdGUiLCJwb2xpY2llcy5yb2xlLnZhdWx0LnJlYWQiXSwic3ViIjoiSnNTZGsifQ.WNAqd6_tLmom3G1rFgTJBUJDTIHI0yPscn3RA7CEd1DmOxR622GdcYNHiJpmXkAP3uqJ-KlL7STkjMuCotqTlyBeR8ODz6xdMvqrvRAvI7_iyDjEkGbozVpmE0SDkt7ZLcyW4bfZX6QkRz4m8U6kq13qz2PA0uojaFYhkvqR6BiGHU9Lqz7YiHtQ7d3SFM7hKOl26F9Gm4HpPHqgsH-T-mbf5SlZhM2Vdgu9TLCkfLrriRcKS_EyhieUOoWl9g04VsRpAitwMlWc7TfIEg9R6AM8A7b7GnKh_Q2k5dg2croNITOv6yPUoKsNy8arjlQ5GT3YSr8rAL4Zw2IYDgvKFA"
          );
        },
      });
      const response = await skyflow.insert(
        {
          records: [],
        },
        {
          tokens: true,
        }
      );
      expect(response.hasOwnProperty("records")).toBe(true);
    } catch (err) {
      expect(err.message).toBe("records object is empty");
    }
  });
});
