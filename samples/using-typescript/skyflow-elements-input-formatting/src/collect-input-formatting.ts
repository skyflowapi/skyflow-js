/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  CollectContainer, 
  CollectElement,
  CollectResponse,
} from "skyflow-js";

try {

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
    options: {
      logLevel: Skyflow.LogLevel.ERROR,
      env: Skyflow.Env.PROD,
    }
  });

  // Create collect Container.
  const collectContainer = skyflow.container(Skyflow.ContainerType.COLLECT) as CollectContainer;

  // Custom styles for collect elements.
  const collectStylesOptions = {
    inputStyles: {
      base: {
        border: '1px solid #eae8ee',
        padding: '10px 16px',
        borderRadius: '4px',
        color: '#1d1d1d',
        marginTop: '4px',
      },
      complete: {
        color: '#4caf50',
      },
      empty: {},
      focus: {},
      invalid: {
        color: '#f44336',
      },
    },
    labelStyles: {
      base: {
        fontSize: '16px',
        fontWeight: 'bold',
      },
    },
    errorTextStyles: {
      base: {
        color: '#f44336',
      },
    },
  };

  // Create collect elements.
  const cardNumberElement: CollectElement = collectContainer.create({
    table: 'pii_fields',
    column: 'primary_card.card_number',
    ...collectStylesOptions,
    placeholder: 'card number',
    label: 'Card Number',
    type: Skyflow.ElementType.CARD_NUMBER,
  }, {
    format: 'XXXX-XXXX-XXXX-XXXX' // inbuilt format
  });

  const ssnElement: CollectElement = collectContainer.create({
    table: 'pii_fields',
    column: 'ssn',
    ...collectStylesOptions,
    label: 'SSN',
    placeholder: 'ssn',
    type: Skyflow.ElementType.INPUT_FIELD,
  }, {
    format: 'XXX-XX-XXXX',
    translation: { X: '[0-9]' } // translates each 'X' in format string accepts a digit ranging from 0-9.
  });

  const expiryDateElement: CollectElement = collectContainer.create({
    table: 'pii_fields',
    column: 'primary_card.expiry_date',
    ...collectStylesOptions,
    label: 'Expiry Date',
    placeholder: 'MM/YYYY',
    type: Skyflow.ElementType.EXPIRATION_DATE,
  }, {
    format: 'MM/YYYY' // inbuilt format.
  });

  const passportNumberElement: CollectElement = collectContainer.create({
    table: 'pii_fields',
    column: 'passport_number',
    ...collectStylesOptions,
    label: 'Passport Number',
    placeholder: 'passport number',
    type: Skyflow.ElementType.INPUT_FIELD,
  }, {
    format: 'XXYYYYYYY',
    translation: { X: '[A-Z]', Y: '[0-9]' }
    // translates each 'X' in format string accepts a uppercase alphabet A to Z.
    // and each 'Y' in format string accepts a digit ranging from 0-9.
  });

  // Mount the elements.
  cardNumberElement.mount('#collectCardNumber');
  ssnElement.mount('#collectCvv');
  expiryDateElement.mount('#collectExpiryDate');
  passportNumberElement.mount('#collectCardholderName');

  // Collect all elements data.
  const collectButton = document.getElementById('collectPCIData');
  if (collectButton) {
    collectButton.addEventListener('click', () => {
      const collectResponse: Promise<CollectResponse> = collectContainer.collect();
      collectResponse
        .then((response) => {
          console.log(response);
          response = response;
          const responseElement = document.getElementById('collectResponse');
          if (responseElement) {
            responseElement.innerHTML = JSON.stringify(response, null, 2);
          }
        })
        .catch((err) => {
          const errorElement = document.getElementById('collectResponse');
          if (errorElement){
            errorElement.innerHTML = JSON.stringify(err, null, 2);
          }
          console.log(err);
        });
    });
  }
} catch (err) {
  console.log(err);
}