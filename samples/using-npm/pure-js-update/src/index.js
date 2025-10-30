/*
Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow from 'skyflow-js';

try {
  const config = {
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
  };
  const skyflowClient = Skyflow.init(config);

  // form update request
  const updateButton = document.getElementById('updateButton');
  if (updateButton) {
    updateButton.addEventListener('click', () => {
      const cardNumberElement = document.getElementById('cardNumber');
      const cardCvvElement = document.getElementById('cardCvv');
      const cardPinElement = document.getElementById('cardPin');

      if (!cardNumberElement || !cardCvvElement || !cardPinElement) {
        console.error('Required form elements not found');
        return;
      }

      const cardNumberData = cardNumberElement.value;
      const cardCvvData = cardCvvElement.value;
      const cardPinData = Number(cardPinElement.value);

      const updateRecord = {
        table: "<TABLE_NAME>",
        fields: {
          cvv: cardCvvData,
          card_number: cardNumberData,
          card_pin: cardPinData,
        },
        skyflowID: "<SKYFLOW_ID>", // replace with actual Skyflow ID
      };

      const updateOptions = {
        tokens: true
      };

      const response = skyflowClient.update(updateRecord, updateOptions);

      response
        .then(
          (res) => {
            const element = document.getElementById('updateResponse');
            if (element) {
              element.innerHTML = JSON.stringify(res, null, 2);
            }
          },
          (err) => {
            const element = document.getElementById('updateResponse');
            if (element) {
              element.innerHTML = JSON.stringify(err, null, 2);
            }
          }
        )
        .catch((err) => {
          const element = document.getElementById('updateResponse');
          if (element) {
            element.innerHTML = JSON.stringify(err, null, 2);
          }
        });
    });
  }
} catch (err) {
  console.error(err);
}