/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, { 
  DetokenizeResponse,
  DetokenizeRequest,
  InsertRequest,
  InsertRecord,
  InsertResponse,
  RevealRecord,
  SkyflowConfig,
} from 'skyflow-js';

try {
  const revealView = document.getElementById('revealView') as HTMLElement;
  if (revealView) {
    revealView.style.visibility = 'hidden';
  }

  const config: SkyflowConfig = {
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
  }
  const skyflowClient: Skyflow = Skyflow.init(config);

  // form insert request
  const insertButton = document.getElementById('insertButton') as HTMLButtonElement;
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

      const cardNumberData: string = cardNumberElement.value;
      const cardCvvData: string = cardCvvElement.value;
      const cardExpiryData: string = cardExpiryElement.value;
      const cardholderNameData: string = cardholderNameElement.value;

      const insertRecords: Array<InsertRecord> = [
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
      ];
      const insertRequest: InsertRequest = {
        records: insertRecords,
      };
      const response: Promise<InsertResponse> = skyflowClient.insert(insertRequest);

      response
        .then(
          (res: InsertResponse) => {
            if (revealView) {
              revealView.style.visibility = 'visible';
            }
            const insertResponseElement = document.getElementById('insertResponse') as HTMLElement;
            if (insertResponseElement) {
              insertResponseElement.innerHTML = JSON.stringify(res, null, 2);
            }

            const fieldsTokenData = res.records![0].fields;

            // Fill tokens.
            const revealCardNumberElement = document.getElementById('card_number') as HTMLElement;
            if (revealCardNumberElement) {
              revealCardNumberElement.innerText = fieldsTokenData.primary_card.card_number;
              revealCardNumberElement.setAttribute('id', fieldsTokenData.primary_card.card_number);
            }

            const revealCardCvvElement = document.getElementById('cvv') as HTMLElement;
            if (revealCardCvvElement) {
              revealCardCvvElement.innerText = fieldsTokenData.primary_card.cvv;
              revealCardCvvElement.setAttribute('id', fieldsTokenData.primary_card.cvv);
            }

            const revealExpiryDateElement = document.getElementById('expiry_date') as HTMLElement;
            if (revealExpiryDateElement) {
              revealExpiryDateElement.innerText = fieldsTokenData.primary_card.expiry_date;
              revealExpiryDateElement.setAttribute('id', fieldsTokenData.primary_card.expiry_date);
            }

            const revealFirstNameElement = document.getElementById('first_name') as HTMLElement;
            if (revealFirstNameElement) {
              revealFirstNameElement.innerText = fieldsTokenData.first_name;
              revealFirstNameElement.setAttribute('id', fieldsTokenData.first_name);
            }

            const revealButton = document.getElementById('revealButton') as HTMLButtonElement;
            if (revealButton) {
              revealButton.addEventListener('click', () => {
                const detokenizeRecords: Array<RevealRecord> = [
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
                ];
                const detokenizeRequest: DetokenizeRequest = {
                  records: detokenizeRecords
                };
                const detokenizeResult: Promise<DetokenizeResponse> = skyflowClient.detokenize(detokenizeRequest);

                detokenizeResult
                  .then((res: DetokenizeResponse) => {
                    const revealResponseElement = document.getElementById('revealResponse') as HTMLElement;
                    if (revealResponseElement) {
                      revealResponseElement.innerHTML = JSON.stringify(res, null, 2);
                    }
                    res.records!.map((record: Record<string, any>) => {
                      const recordKey = record['token'];
                      const ele = document.getElementById(recordKey) as HTMLElement;
                      if (ele) {
                        ele.innerText = record['value'];
                      }
                    });
                  })
                  .catch((err: DetokenizeResponse) => {
                    const revealResponseElement = document.getElementById('revealResponse') as HTMLElement;
                    if (revealResponseElement) {
                      revealResponseElement.innerHTML = JSON.stringify(err, null, 2);
                    }
                    console.log(err);
                  });
              });
            }
          },
          (err: InsertResponse) => {
            const element = document.getElementById('insertResponse') as HTMLElement;
            if (element) {
              element.innerHTML = JSON.stringify(err, null, 2);
            }
          }
        )
        .catch((err: InsertResponse) => {
          const element = document.getElementById('insertResponse') as HTMLElement;
          if (element) {
            element.innerHTML = JSON.stringify(err, null, 2);
          }
        });
    });
  }
} catch (err: unknown) {
  console.error(err);
}