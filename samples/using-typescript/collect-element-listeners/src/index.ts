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
      // Actual value of element can only be accessed inside the handler, 
      // when the env is set to DEV.
      // Make sure the env is set to PROD when using skyflow-js in production
      env: Skyflow.Env.DEV,
    }
  });

  // Create collect Container
  const collectContainer = skyflow.container(Skyflow.ContainerType.COLLECT) as CollectContainer;

  // Custom styles for collect elements
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

  
  // Create collect elements
  const cardNumberElement: CollectElement = collectContainer.create({
    table: 'pii_fields',
    column: 'primary_card.card_number',
    ...collectStylesOptions,
    placeholder: 'card number',
    label: 'Card Number',
    type: Skyflow.ElementType.CARD_NUMBER,
  });

  const cvvElement: CollectElement = collectContainer.create({
    table: 'pii_fields',
    column: 'primary_card.cvv',
    ...collectStylesOptions,
    label: 'Cvv',
    placeholder: 'cvv',
    type: Skyflow.ElementType.CVV,
  });

  const expiryDateElement: CollectElement = collectContainer.create({
    table: 'pii_fields',
    column: 'expiry_date',
    ...collectStylesOptions,
    label: 'Expiry Date',
    placeholder: 'MM/YYYY',
    type: Skyflow.ElementType.EXPIRATION_DATE,
  });

  const cardHolderNameElement: CollectElement = collectContainer.create({
    table: 'pii_fields',
    column: 'first_name',
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

  // Add listeners to Collect Elements.

  // Add READY EVENT Listener.
  cardNumberElement.on(Skyflow.EventName.READY, (readyState) => {
    console.log('Ready Event Triggered', readyState);
  });

  // Add CHANGE EVENT Listener.
  cvvElement.on(Skyflow.EventName.CHANGE, (changeState: any) => {
    console.log('CHANGE Event Triggered', changeState);
  });

  // Add FOCUS EVENT Listener.
  expiryDateElement.on(Skyflow.EventName.FOCUS, (focusState: any) => {
    console.log('FOCUS Event Triggered', focusState);
  });

  // Add BLUR EVENT Listener.
  cardHolderNameElement.on(Skyflow.EventName.BLUR, (blurState: any) => {
    console.log('BLUR Event Triggered', blurState);
  });

  // Collect all elements data.
  const collectButton = document.getElementById('collectPCIData');
  if (collectButton) {
    collectButton.addEventListener('click', () => {
      const collectResponse: Promise<CollectResponse> = collectContainer.collect();
      collectResponse
        .then((response) => {
          const responseElement = document.getElementById('collectResponse');
          if (responseElement) {
            responseElement.innerHTML = JSON.stringify(response, null, 2);
          }
        })
        .catch((err: Error) => {
          console.error(err);
        });
    });
  }
} catch (err: unknown) {
  console.error(err);
}