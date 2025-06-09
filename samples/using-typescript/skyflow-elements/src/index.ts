/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  CollectContainer,
  CollectElement,
  CollectResponse,
  RevealContainer,
  RevealElement,
  RevealResponse,
} from 'skyflow-js';

try {
  const revealView = document.getElementById('revealView');
  if (revealView) {
    revealView.style.visibility = 'hidden';
  }
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
    },
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

  // Create collect elements.
  const cardNumberElement: CollectElement = collectContainer.create({
    table: 'pii_fields',
    column: 'primary_card.card_number',
    ...collectStylesOptions,
    placeholder: 'card number',
    label: 'Card Number',
    type: Skyflow.ElementType.CARD_NUMBER,
  },{
    required: true
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
    column: 'primary_card.expiry_date',
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
          const revealCardNumberElement: RevealElement = revealContainer.create({
            token: fieldsTokenData.primary_card.card_number,
            label: 'Card Number',
            redaction: Skyflow.RedactionType.MASKED,
            ...revealStyleOptions,
          });
          revealCardNumberElement.mount('#revealCardNumber');

          const revealCardCvvElement: RevealElement = revealContainer.create({
            token: fieldsTokenData.primary_card.cvv,
            label: 'CVV',
            redaction: Skyflow.RedactionType.REDACTED,
            ...revealStyleOptions,
            altText: '###',
          });
          revealCardCvvElement.mount('#revealCvv');

          const revealCardExpiryElement: RevealElement = revealContainer.create({
            token: fieldsTokenData.primary_card.expiry_date,
            label: 'Card Expiry Date',
            ...revealStyleOptions,
          });
          revealCardExpiryElement.mount('#revealExpiryDate');

          const revealCardholderNameElement: RevealElement = revealContainer.create({
            token: fieldsTokenData.first_name,
            label: 'Card Holder Name',
            ...revealStyleOptions,
          });
          revealCardholderNameElement.mount('#revealCardholderName');

          const revealButton = document.getElementById('revealPCIData');

          if (revealButton) {
            revealButton.addEventListener('click', () => {
              const revealResponse: Promise<RevealResponse> = revealContainer.reveal()
              revealResponse.then((res) => {
                console.log(res);
              }).catch((err) => {
                console.log(err);
              });
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
} catch (err) {
  console.log(err);
}