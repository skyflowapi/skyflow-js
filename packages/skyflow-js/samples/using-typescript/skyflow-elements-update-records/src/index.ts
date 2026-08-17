/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, { 
  CollectContainer,
  CollectElement,
  CollectElementInput,
  CollectResponse,
  ErrorTextStyles,
  CollectOptions,
  InsertRequest,
  InsertRecord,
  InputStyles,
  LabelStyles,
  SkyflowConfig,
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
      env: Skyflow.Env.PROD,
    },
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
    table: 'table1',
    column: 'card_number',
    ...collectStylesOptions,
    placeholder: 'card number',
    label: 'Card Number',
    skyflowID: '',
    type: Skyflow.ElementType.CARD_NUMBER,
  };
  const cardNumberElement: CollectElement = collectContainer.create(cardNumberInput);

  const cvvInput: CollectElementInput = {
    table: 'table1',
    column: 'cvv',
    ...collectStylesOptions,
    label: 'Cvv',
    placeholder: 'cvv',
    type: Skyflow.ElementType.CVV,
    skyflowID: '',
  };
  const cvvElement: CollectElement = collectContainer.create(cvvInput);

  const expiryDateInput: CollectElementInput = {
    table: 'table1',
    column: 'expiry_date',
    ...collectStylesOptions,
    label: 'Expiry Date',
    placeholder: 'MM/YYYY',
    type: Skyflow.ElementType.EXPIRATION_DATE,
    skyflowID: '',
  };
  const expiryDateElement: CollectElement = collectContainer.create(expiryDateInput);

  const cardHolderNameInput: CollectElementInput = {
    table: 'table2',
    column: 'name',
    ...collectStylesOptions,
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

  // Collect all elements data.
  const collectButton = document.getElementById('collectPCIData') as HTMLButtonElement;
  const records: Array<InsertRecord> = [
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
  ];
  const additionalFields: InsertRequest = {
    records: records,
  };
  const collectOptions: CollectOptions = {
    tokens: true,
    additionalFields: additionalFields,
  };
  if (collectButton) {
    collectButton.addEventListener('click', () => {
      const collectResponse: Promise<CollectResponse> = collectContainer.collect(collectOptions);
      collectResponse
        .then((response: CollectResponse) => {
          console.log(response);
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
