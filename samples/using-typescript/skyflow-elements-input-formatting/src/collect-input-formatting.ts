/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  CollectContainer, 
  CollectElement,
  CollectElementInput,
  CollectElementOptions,
  CollectResponse,
  ErrorTextStyles,
  InputStyles,
  SkyflowConfig,  
  LabelStyles,
} from "skyflow-js";

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
      env: Skyflow.Env.PROD,
    }
  }
  const skyflowClient: Skyflow = Skyflow.init(config);

  // Create collect Container.
  const collectContainer = skyflowClient.container(Skyflow.ContainerType.COLLECT) as CollectContainer;

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
    } as InputStyles,
    labelStyles: {
      base: {
        fontSize: '16px',
        fontWeight: 'bold',
      },
    } as LabelStyles,
    errorTextStyles: {
      base: {
        color: '#f44336',
      },
    } as ErrorTextStyles,
  };

  // Create collect elements.
  const cardNumberInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'primary_card.card_number',
    ...collectStylesOptions,
    placeholder: 'card number',
    label: 'Card Number',
    type: Skyflow.ElementType.CARD_NUMBER,
  };
  const cardNumberOptions: CollectElementOptions = {
    required: false,
    format: 'XXXX-XXXX-XXXX-XXXX' // inbuilt format
  };
  const cardNumberElement: CollectElement = collectContainer.create(
    cardNumberInput, 
    cardNumberOptions
  );

  const ssnInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'ssn',
    ...collectStylesOptions,
    label: 'SSN',
    placeholder: 'ssn',
    type: Skyflow.ElementType.INPUT_FIELD,
  };
  const ssnOptions: CollectElementOptions = {
    required: false,
    format: 'XXX-XX-XXXX',
    translation: { X: '[0-9]' } // translates each 'X' in format string accepts a digit ranging from 0-9.
  };
  const ssnElement: CollectElement = collectContainer.create(ssnInput, ssnOptions);

  const expiryDateInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'primary_card.expiry_date',
    ...collectStylesOptions,
    label: 'Expiry Date',
    placeholder: 'MM/YYYY',
    type: Skyflow.ElementType.EXPIRATION_DATE,
  };
  const expiryDateOptions: CollectElementOptions =  {
    required: false,
    format: 'MM/YYYY' // inbuilt format.
  };
  const expiryDateElement: CollectElement = collectContainer.create(
    expiryDateInput,
    expiryDateOptions,
  );

  const passportNumberInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'passport_number',
    ...collectStylesOptions,
    label: 'Passport Number',
    placeholder: 'passport number',
    type: Skyflow.ElementType.INPUT_FIELD,
  };
  const passportNumberOptions: CollectElementOptions = {
    required: false,
    format: 'XXYYYYYYY',
    translation: { X: '[A-Z]', Y: '[0-9]' }
    // translates each 'X' in format string accepts a uppercase alphabet A to Z.
    // and each 'Y' in format string accepts a digit ranging from 0-9.
  };
  const passportNumberElement: CollectElement = collectContainer.create(
    passportNumberInput,
    passportNumberOptions,
  );

  // Mount the elements.
  cardNumberElement.mount('#collectCardNumber');
  ssnElement.mount('#collectCvv');
  expiryDateElement.mount('#collectExpiryDate');
  passportNumberElement.mount('#collectCardholderName');

  // Collect all elements data.
  const collectButton = document.getElementById('collectPCIData') as HTMLButtonElement;
  if (collectButton) {
    collectButton.addEventListener('click', () => {
      const collectResponse: Promise<CollectResponse> = collectContainer.collect();
      collectResponse
        .then((response: CollectResponse) => {
          console.log(response);
          response = response;
          const responseElement = document.getElementById('collectResponse') as HTMLElement;
          if (responseElement) {
            responseElement.innerHTML = JSON.stringify(response, null, 2);
          }
        })
        .catch((err: CollectResponse) => {
          const errorElement = document.getElementById('collectResponse') as HTMLElement;
          if (errorElement){
            errorElement.innerHTML = JSON.stringify(err, null, 2);
          }
          console.log(err);
        });
    });
  }
} catch (err: unknown) {
  console.log(err);
}