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
                  expiry_date: cardExpiryData,
                },
                first_name: cardholderNameData,
                
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
                const revealCardNumberElement = document.getElementById("card_number");
                revealCardNumberElement.innerText = fieldsTokenData.primary_card.card_number;
                revealCardNumberElement.setAttribute("id",fieldsTokenData.primary_card.card_number);
                
                const revealCardCvvElement = document.getElementById("cvv");
                revealCardCvvElement.innerText = fieldsTokenData.primary_card.cvv;
                revealCardCvvElement.setAttribute("id",fieldsTokenData.primary_card.cvv);

                const revealExpiryDateElement = document.getElementById("expiry_date");
                revealExpiryDateElement.innerText =  fieldsTokenData.primary_card.expiry_date;
                revealExpiryDateElement.setAttribute("id",fieldsTokenData.primary_card.expiry_date);

                const revealFirstNameElement = document.getElementById("first_name");
                revealFirstNameElement.innerText = fieldsTokenData.first_name;
                revealFirstNameElement.setAttribute("id",fieldsTokenData.first_name);


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
                        const recordKey = record["token"];
                        const ele = document.getElementById(recordKey);
                        ele.innerText = record["value"];
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