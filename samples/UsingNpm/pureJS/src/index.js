import Skyflow from "skyflow-js";

try{
    const revealView = document.getElementById("revealView");
    revealView.style.visibility = "hidden";

    const skyflow = Skyflow.init({
      vaultID: "<VAULT_ID>",
      vaultURL: "<VAULT_URL>",
      getBearerToken: () => {
        return new Promise((resolve, reject) => {
          const Http = new XMLHttpRequest();

          Http.onreadystatechange = () => {
            if (Http.readyState === 4 && Http.status === 200) {
              const response = JSON.parse(Http.responseText);
              resolve(response.accessToken);
            }
          };
          const url = "<TOKEN_END_POINT_URL>";
          Http.open("GET", url);
          Http.send();
        });
      },
    });

    // form insert request

    const insertButton = document.getElementById("insertButton");
    if (insertButton) {
      insertButton.addEventListener("click", () => {
        const cardNumberData = document.getElementById("cardNumber").value;
        const cardCvvData = document.getElementById("cardCvv").value;
        const cardExpiryData = document.getElementById("cardExpiry").value;
        const cardholderNameData =
          document.getElementById("cardHolderName").value;
        const response = skyflow.insert({
          records: [
            {
              fields: {
                primary_card: {
                  cvv: cardCvvData,
                  card_number: cardNumberData,
                },
                first_name: cardholderNameData,
                expiry_date: cardExpiryData,
              },
              table: "pii_fields",
            },
          ],
        });

        response
          .then(
            (res) => {
              revealView.style.visibility = "visible";
              document.getElementById("insertResponse").innerHTML =
                JSON.stringify(res, null, 2);

              const fieldsTokenData = res.records[0].fields;

              // fill tokens
              document.getElementById("card_number").innerText =
                fieldsTokenData.primary_card.card_number;
              document.getElementById("cvv").innerText =
                fieldsTokenData.primary_card.cvv;
              document.getElementById("expiry_date").innerText =
                fieldsTokenData.expiry_date;
              document.getElementById("first_name").innerText =
                fieldsTokenData.first_name;

              const revealButton = document.getElementById("revealButton");
              if (revealButton) {
                revealButton.addEventListener("click", () => {
                  const revealResult = skyflow.detokenize({
                    records: [
                      {
                        token: fieldsTokenData.primary_card.card_number
                      },
                      {
                        token: fieldsTokenData.primary_card.cvv
                        
                      },
                      {
                        token: fieldsTokenData.expiry_date
                        
                      },
                      {
                        token: fieldsTokenData.first_name
                      },
                    ],
                  });
                  revealResult
                    .then((res) => {
                      document.getElementById("revealResponse").innerHTML =
                        JSON.stringify(res, null, 2);
                      res.records.map((record) => {
                        const recordKey = Object.keys(record)[1];
                        const ele = document.getElementById(recordKey);
                        ele.innerText = record[recordKey];
                      });
                    })
                    .catch((err) => {
                      document.getElementById("revealResponse").innerHTML =
                        JSON.stringify(err, null, 2);
                      console.log(err);
                    });
                });
              }
            },
            (err) => {
              document.getElementById("insertResponse").innerHTML =
                JSON.stringify(err, null, 2);
            }
          )
          .catch((err) => {
            document.getElementById("insertResponse").innerHTML =
              JSON.stringify(err, null, 2);
          });
      });
    }
}catch(err){

}