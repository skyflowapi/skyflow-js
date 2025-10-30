/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  updateResponse,
  SkyflowConfig,
  UpdateRequest,
  UpdateResponse,
  UpdateOptions,
} from 'skyflow-js';

try {
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

  // form update request
  const updateButton = document.getElementById('updateButton') as HTMLButtonElement;
  if (updateButton) {
    updateButton.addEventListener('click', () => {
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

      const updateRecord: UpdateRequest = {
        table: "<TABLE_NAME>",
        fields: {
          cvv: cardCvvData,
          card_number: cardNumberData,
          expiry_date: cardExpiryData,
          cardholder_name: cardholderNameData,
        },
        skyflowID: "<SKYFLOW_ID>", // replace with actual Skyflow ID
      };

      const updateOptions: UpdateOptions = {
        tokens: true
      };

      const response: Promise<UpdateResponse> = skyflowClient.update(updateRecord, updateOptions);

      response
        .then(
          (res: UpdateResponse) => {
            const element = document.getElementById('updateResponse') as HTMLElement;
            if (element) {
              element.innerHTML = JSON.stringify(res, null, 2);
            }
          },
          (err: updateResponse) => {
            const element = document.getElementById('updateResponse') as HTMLElement;
            if (element) {
              element.innerHTML = JSON.stringify(err, null, 2);
            }
          }
        )
        .catch((err: updateResponse) => {
          const element = document.getElementById('updateResponse') as HTMLElement;
          if (element) {
            element.innerHTML = JSON.stringify(err, null, 2);
          }
        });
    });
  }
} catch (err: unknown) {
  console.error(err);
}