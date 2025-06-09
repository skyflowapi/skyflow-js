/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, { 
  InsertResponse, 
  DetokenizeResponse,
} from 'skyflow-js';

try {
  const revealView = document.getElementById('revealView');
  if (revealView) {
    revealView.style.visibility = 'hidden';
  }

  const skyflow = Skyflow.init({
    vaultID: '<VAULT_ID>',
    vaultURL: '<VAULT_URL>',
    getBearerToken: () => {
      return new Promise((resolve, reject) => {
        const Http = new XMLHttpRequest();

        Http.onreadystatechange = () => {
          if (Http.readyState === 4 && Http.status === 200) {
            const response = JSON.parse(Http.responseText);
            resolve(response.accessToken);
          }
        };
        const url = '<TOKEN_END_POINT_URL>';
        Http.open('GET', url);
        Http.send();
      });
    },
  });

  // form insert request

  const insertButton = document.getElementById('insertButton');
  if (insertButton) {
    insertButton.addEventListener('click', () => {
      const cardNumberElement = document.getElementById('cardNumber') as HTMLInputElement;
      const cardCvvElement = document.getElementById('cardCvv') as HTMLInputElement;
      const cardExpiryElement = document.getElementById('cardExpiry') as HTMLInputElement;
      const cardholderNameElement = document.getElementById('cardHolderName') as HTMLInputElement;

      if (!cardNumberElement || !cardCvvElement || !cardExpiryElement || !cardholderNameElement) {
        console.error('Required form elements not found');
        return;
      }

      const cardNumberData = cardNumberElement.value;
      const cardCvvData = cardCvvElement.value;
      const cardExpiryData = cardExpiryElement.value;
      const cardholderNameData = cardholderNameElement.value;

      const response: Promise<InsertResponse> = skyflow.insert({
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
            table: 'pii_fields',
          },
        ],
      });

      response
        .then(
          (res: InsertResponse) => {
            if (revealView) {
              revealView.style.visibility = 'visible';
            }
            const insertResponseElement = document.getElementById('insertResponse');
            if (insertResponseElement) {
              insertResponseElement.innerHTML = JSON.stringify(res, null, 2);
            }

            const fieldsTokenData = res.records[0].fields;

            // Fill tokens.
            const revealCardNumberElement = document.getElementById('card_number');
            if (revealCardNumberElement) {
              revealCardNumberElement.innerText = fieldsTokenData.primary_card.card_number;
              revealCardNumberElement.setAttribute('id', fieldsTokenData.primary_card.card_number);
            }

            const revealCardCvvElement = document.getElementById('cvv');
            if (revealCardCvvElement) {
              revealCardCvvElement.innerText = fieldsTokenData.primary_card.cvv;
              revealCardCvvElement.setAttribute('id', fieldsTokenData.primary_card.cvv);
            }

            const revealExpiryDateElement = document.getElementById('expiry_date');
            if (revealExpiryDateElement) {
              revealExpiryDateElement.innerText = fieldsTokenData.primary_card.expiry_date;
              revealExpiryDateElement.setAttribute('id', fieldsTokenData.primary_card.expiry_date);
            }

            const revealFirstNameElement = document.getElementById('first_name');
            if (revealFirstNameElement) {
              revealFirstNameElement.innerText = fieldsTokenData.first_name;
              revealFirstNameElement.setAttribute('id', fieldsTokenData.first_name);
            }

            const revealButton = document.getElementById('revealButton');
            if (revealButton) {
              revealButton.addEventListener('click', () => {
                const revealResult: Promise<DetokenizeResponse> = skyflow.detokenize({
                  records: [
                    {
                      token: fieldsTokenData.primary_card.card_number,
                      redaction: Skyflow.RedactionType.MASKED
                    },
                    {
                      token: fieldsTokenData.primary_card.cvv,
                      redaction: Skyflow.RedactionType.REDACTED
                    },
                    {
                      token: fieldsTokenData.primary_card.expiry_date,
                    },
                    {
                      token: fieldsTokenData.first_name,
                    },
                  ],
                });
                revealResult
                  .then((res: DetokenizeResponse) => {
                    const revealResponseElement = document.getElementById('revealResponse');
                    if (revealResponseElement) {
                      revealResponseElement.innerHTML = JSON.stringify(res, null, 2);
                    }
                    res.records.map((record) => {
                      const recordKey = record['token'];
                      const ele = document.getElementById(recordKey);
                      if (ele) {
                        ele.innerText = record['value'];
                      }
                    });
                  })
                  .catch((err) => {
                    const revealResponseElement = document.getElementById('revealResponse');
                    if (revealResponseElement) {
                      revealResponseElement.innerHTML = JSON.stringify(err, null, 2);
                    }
                    console.log(err);
                  });
              });
            }
          },
          (err) => {
            const element = document.getElementById('insertResponse');
            if (element) {
              element.innerHTML = JSON.stringify(err, null, 2);
            }
          }
        )
        .catch((err) => {
          const element = document.getElementById('insertResponse');
          if (element) {
            element.innerHTML = JSON.stringify(err, null, 2);
          }
        });
    });
  }
} catch (err) {
  console.error(err);
}