/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, { 
  CollectContainer,
  CollectElement,
  CollectResponse,
} from 'skyflow-js';
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
    },
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
    table: 'table1',
    column: 'card_number',
    ...collectStylesOptions,
    placeholder: 'card number',
    label: 'Card Number',
    skyflowID: '',
    type: Skyflow.ElementType.CARD_NUMBER,
  });

  const cvvElement: CollectElement = collectContainer.create({
    table: 'table1',
    column: 'cvv',
    ...collectStylesOptions,
    label: 'Cvv',
    placeholder: 'cvv',
    type: Skyflow.ElementType.CVV,
    skyflowID: '',
  });

  const expiryDateElement: CollectElement = collectContainer.create({
    table: 'table1',
    column: 'expiry_date',
    ...collectStylesOptions,
    label: 'Expiry Date',
    placeholder: 'MM/YYYY',
    type: Skyflow.ElementType.EXPIRATION_DATE,
    skyflowID: '',
  });

  const cardHolderNameElement: CollectElement = collectContainer.create({
    table: 'table2',
    column: 'name',
    ...collectStylesOptions,
    label: 'Card Holder Name',
    placeholder: 'cardholder name',
    type: Skyflow.ElementType.CARDHOLDER_NAME,
  });

  // Mount the elements.
  cardNumberElement.mount('#collectCardNumber');
  cvvElement.mount('#collectCvv');
  expiryDateElement.mount('#collectExpiryDate');
  cardHolderNameElement.mount('#collectCardholderName');

  // Collect all elements data.
  const collectButton = document.getElementById('collectPCIData');
  const records = {
    tokens: true,
    additionalFields: {
      records: [
        {
          table: 'table1',
          fields: {
            skyflowID: '',
            gender: 'MALE',
          },
        },
        {
          table: 'table2',
          fields: {
            gender: 'MALE',
          },
        },
      ],
    },
  };
  if (collectButton) {
    collectButton.addEventListener('click', () => {
      const collectResponse: Promise<CollectResponse> = collectContainer.collect(records);
      collectResponse
        .then((response) => {
          console.log(response);
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
