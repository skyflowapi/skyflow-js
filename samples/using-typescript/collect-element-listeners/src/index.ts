/*
  Copyright (c) 2025 Skyflow, Inc.
*/

import Skyflow, { 
  CollectContainer,
  CollectElement, 
  CollectResponse,
  ErrorTextStyles,
  InputStyles,
  SkyflowConfig,
  LabelStyles,
  CollectElementInput,
  ElementState,
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
    options: {
      logLevel: Skyflow.LogLevel.ERROR,
      // Actual value of element can only be accessed inside the handler, 
      // when the env is set to DEV.
      // Make sure the env is set to PROD when using skyflow-js in production
      env: Skyflow.Env.DEV,
    }
  }
  const skyflowClient: Skyflow = Skyflow.init(config);

  // Create collect Container
  const collectContainer = skyflowClient.container(Skyflow.ContainerType.COLLECT) as CollectContainer;

  // Custom styles for collect elements
  const inputStyles: InputStyles = {
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
  }
  const labelStyles: LabelStyles = {
    base: {
      fontSize: '16px',
      fontWeight: 'bold',
    },
  }
  const errorTextStyles: ErrorTextStyles = {
    base: {
      color: '#f44336',
    },
  }
  
  // Create collect elements
  const cardNumberInput : CollectElementInput = {
    table: 'pii_fields',
    column: 'primary_card.card_number',
    inputStyles: inputStyles,
    labelStyles: labelStyles,
    errorTextStyles: errorTextStyles,
    placeholder: 'card number',
    label: 'Card Number',
    type: Skyflow.ElementType.CARD_NUMBER,
  };
  const cardNumberElement: CollectElement = collectContainer.create(cardNumberInput);

  const cvvInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'primary_card.cvv',
    inputStyles: inputStyles,
    labelStyles: labelStyles,
    errorTextStyles: errorTextStyles,
    label: 'Cvv',
    placeholder: 'cvv',
    type: Skyflow.ElementType.CVV,
  };
  const cvvElement: CollectElement = collectContainer.create(cvvInput);

  const expiryDateInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'expiry_date',
    inputStyles: inputStyles,
    labelStyles: labelStyles,
    errorTextStyles: errorTextStyles,
    label: 'Expiry Date',
    placeholder: 'MM/YYYY',
    type: Skyflow.ElementType.EXPIRATION_DATE,
  };
  const expiryDateElement: CollectElement = collectContainer.create(expiryDateInput);

  const cardHolderNameInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'first_name',
    inputStyles: inputStyles,
    labelStyles: labelStyles,
    errorTextStyles: errorTextStyles,
    label: 'Card Holder Name',
    placeholder: 'cardholder name',
    type: Skyflow.ElementType.CARDHOLDER_NAME,
  };
  const cardHolderNameElement: CollectElement = collectContainer.create(cardHolderNameInput);

  // Mount the elements.
  cardNumberElement.mount('#collectCardNumber');
  cvvElement.mount('#collectCvv');
  expiryDateElement.mount('#collectExpiryDate');
  cardHolderNameElement.mount('#collectCardholderName');

  // Add listeners to Collect Elements.

  // Add READY EVENT Listener.
  cardNumberElement.on(Skyflow.EventName.READY, (readyState: ElementState) => {
    console.log('Ready Event Triggered', readyState);
  });

  // Add CHANGE EVENT Listener.
  cvvElement.on(Skyflow.EventName.CHANGE, (changeState: ElementState) => {
    console.log('CHANGE Event Triggered', changeState);
  });

  // Add FOCUS EVENT Listener.
  expiryDateElement.on(Skyflow.EventName.FOCUS, (focusState: ElementState) => {
    console.log('FOCUS Event Triggered', focusState);
  });

  // Add BLUR EVENT Listener.
  cardHolderNameElement.on(Skyflow.EventName.BLUR, (blurState: ElementState) => {
    console.log('BLUR Event Triggered', blurState);
  });

  // Collect all elements data.
  const collectButton = document.getElementById('collectPCIData') as HTMLButtonElement;
  if (collectButton) {
    collectButton.addEventListener('click', () => {
      const collectResponse: Promise<CollectResponse> = collectContainer.collect();
      collectResponse
        .then((response: CollectResponse) => {
          console.log(response);
          const responseElement = document.getElementById('collectResponse') as HTMLElement;
          if (responseElement) {
            responseElement.innerHTML = JSON.stringify(response, null, 2);
          }
        })
        .catch((err: CollectResponse) => {
          console.log(err);
          const responseElement = document.getElementById('collectResponse') as HTMLElement;
          if (responseElement) {
            responseElement.innerHTML = JSON.stringify(err, null, 2);
          }
        });
    });
  }
} catch (err: unknown) {
  console.error(err);
}