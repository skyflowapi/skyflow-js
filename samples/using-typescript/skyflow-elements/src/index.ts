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
  ISkyflow,
  InputStyles,
  IRevealElementInput,
  LabelStyles,
  RevealContainer,
  RevealElement,
  RevealResponse,
} from 'skyflow-js';

try {
  const revealView = document.getElementById('revealView');
  if (revealView) {
    revealView.style.visibility = 'hidden';
  }
  const config: ISkyflow = {
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
  const skyflow: Skyflow = Skyflow.init(config);

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
        fontFamily: '"Roboto", sans-serif'
      },
      complete: {
        color: '#4caf50',
      },
      empty: {},
      focus: {},
      invalid: {
        color: '#f44336',
      },
      global: {
        '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      }
    } as InputStyles,
    labelStyles: {
      base: {
        fontSize: '16px',
        fontWeight: 'bold',
        fontFamily: '"Roboto", sans-serif'
      },
      global: {
        '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      },
      requiredAsterisk:{
        color: 'red'
      }
    } as LabelStyles,
    errorTextStyles: {
      base: {
        color: '#f44336',
        fontFamily: '"Roboto", sans-serif'
      },
      global: {
        '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      }
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
  }
  const cardNumberOptions: CollectElementOptions = {
    required: true
  }
  const cardNumberElement: CollectElement = collectContainer.create(cardNumberInput, cardNumberOptions);

  const cvvInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'primary_card.cvv',
    ...collectStylesOptions,
    label: 'Cvv',
    placeholder: 'cvv',
    type: Skyflow.ElementType.CVV,
  }
  const cvvElement: CollectElement = collectContainer.create(cvvInput);

  const expiryDateInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'primary_card.expiry_date',
    ...collectStylesOptions,
    label: 'Expiry Date',
    placeholder: 'MM/YYYY',
    type: Skyflow.ElementType.EXPIRATION_DATE,
  }
  const expiryDateElement: CollectElement = collectContainer.create(expiryDateInput);

  const cardholderNameInput: CollectElementInput = {
    table: 'pii_fields',
    column: 'first_name',
    ...collectStylesOptions,
    label: 'Card Holder Name',
    placeholder: 'cardholder name',
    type: Skyflow.ElementType.CARDHOLDER_NAME,
  }
  const cardHolderNameElement: CollectElement = collectContainer.create(cardholderNameInput);

  // Mount the elements.
  cardNumberElement.mount('#collectCardNumber');
  cvvElement.mount('#collectCvv');
  expiryDateElement.mount('#collectExpiryDate');
  cardHolderNameElement.mount('#collectCardholderName');

  // Collect all elements data.
  const collectButton = document.getElementById('collectPCIData');
  if (collectButton) {
    collectButton.addEventListener('click', () => {
      const collectResponse: Promise<CollectResponse> = collectContainer.collect();
      collectResponse
        .then((response: CollectResponse) => {
          console.log(response);
          response = response;
          const responseElement = document.getElementById('collectResponse');
          if (responseElement) {
            responseElement.innerHTML = JSON.stringify(response, null, 2);
          }

          if (revealView) {
            revealView.style.visibility = 'visible';
          }

          const revealStyleOptions = {
            inputStyles: {
              base: {
                border: '1px solid #eae8ee',
                padding: '10px 16px',
                borderRadius: '4px',
                color: '#1d1d1d',
                marginTop: '4px',
                fontFamily: '"Roboto", sans-serif'
              },
              global: {
                '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
              }
            },
            labelStyles: {
              base: {
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: '"Roboto", sans-serif'
              },
              global: {
                '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
              }
            },
            errorTextStyles: {
              base: {
                color: '#f44336',
                fontFamily: '"Roboto", sans-serif'
              },
              global: {
                '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
              }
            },
          };

          // Create Reveal Elements With Tokens.
          const fieldsTokenData = response.records[0].fields;
          const revealContainer = skyflow.container(
            Skyflow.ContainerType.REVEAL
          ) as RevealContainer;
          
          const revealCardNumberInput: IRevealElementInput = {
            token: fieldsTokenData.primary_card.card_number,
            label: 'Card Number',
            redaction: Skyflow.RedactionType.MASKED,
            ...revealStyleOptions,
          }
          const revealCardNumberElement: RevealElement = revealContainer.create(revealCardNumberInput);
          revealCardNumberElement.mount('#revealCardNumber');

          const revealCardCvvInput: IRevealElementInput = {
            token: fieldsTokenData.primary_card.cvv,
            label: 'CVV',
            redaction: Skyflow.RedactionType.REDACTED,
            ...revealStyleOptions,
            altText: '###',
          }
          const revealCardCvvElement: RevealElement = revealContainer.create(revealCardCvvInput);
          revealCardCvvElement.mount('#revealCvv');

          const revealCardExpiryInput: IRevealElementInput = {
            token: fieldsTokenData.primary_card.expiry_date,
            label: 'Card Expiry Date',
            ...revealStyleOptions,
          }
          const revealCardExpiryElement: RevealElement = revealContainer.create(revealCardExpiryInput);
          revealCardExpiryElement.mount('#revealExpiryDate');

          const revealCardholderNameInput: IRevealElementInput = {
            token: fieldsTokenData.first_name,
            label: 'Card Holder Name',
            ...revealStyleOptions,
          }
          const revealCardholderNameElement: RevealElement = revealContainer.create(revealCardholderNameInput);
          revealCardholderNameElement.mount('#revealCardholderName');

          const revealButton = document.getElementById('revealPCIData');

          if (revealButton) {
            revealButton.addEventListener('click', () => {
              const revealResponse: Promise<RevealResponse> = revealContainer.reveal()
              revealResponse.then((res: RevealResponse) => {
                console.log(res);
              }).catch((err: RevealResponse) => {
                console.log(err);
              });
            });
          }
        })
        .catch((err: CollectResponse) => {
          console.log(err);
        });
    });
  }
} catch (err: unknown) {
  console.log(err);
}