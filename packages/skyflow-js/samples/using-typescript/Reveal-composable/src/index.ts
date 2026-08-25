/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  ComposableRevealContainer,
  ErrorTextStyles,
  InputStyles,
  LabelStyles,
  RevealElementInput,
  RevealResponse,
  SkyflowConfig,
  ComposableRevealElement
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
    }
  }
  const skyflowClient: Skyflow = Skyflow.init(config);


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
            } as InputStyles,
            labelStyles: {
              base: {
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: '"Roboto", sans-serif'
              },
              global: {
                '@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
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
    const revealContainerOptions = {
				layout: [1, 1, 1, 1],
				styles: {
					base: {
						border: '1px solid #eae8ee',
						padding: '30px 16px',
						borderRadius: '4px',
						margin: '12px 2px',
						boxShadow: '8px',
            width: '400px',
					}
				},
				errorTextStyles: {
					base: {
						color: 'red',
						fontFamily: '"Roboto", sans-serif'
					},
					global: {
						'@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
					}
				}
    }

          const revealContainer = skyflowClient.container(Skyflow.ContainerType.COMPOSE_REVEAL, revealContainerOptions) as ComposableRevealContainer;;


          const revealCardNumberInput: RevealElementInput = {
            token: "<TOKEN1>",
            label: 'Card Number',
            redaction: Skyflow.RedactionType.MASKED,
            ...revealStyleOptions,
          }
          const revealCardNumberElement: ComposableRevealElement = revealContainer.create(revealCardNumberInput);

          const revealCardCvvInput: RevealElementInput = {
            token: "<TOKEN2>",
            label: 'CVV',
            redaction: Skyflow.RedactionType.REDACTED,
            ...revealStyleOptions,
            altText: '###',
          }
          const revealCardCvvElement: ComposableRevealElement = revealContainer.create(revealCardCvvInput);

          const revealCardExpiryInput: RevealElementInput = {
            token: "<TOKEN3>",
            label: 'Card Expiry Date',
            ...revealStyleOptions,
          }
          const revealCardExpiryElement: ComposableRevealElement = revealContainer.create(revealCardExpiryInput);

          const revealCardholderNameInput: RevealElementInput = {
            token: "<TOKEN4>",
            label: 'Card Holder Name',
            ...revealStyleOptions,
          }
          const revealCardholderNameElement: ComposableRevealElement = revealContainer.create(revealCardholderNameInput);

          revealContainer.mount(document.getElementById('revealComposableContainer') as HTMLElement);

          const revealButton = document.getElementById('revealPCIData') as HTMLButtonElement;

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
} catch (err: unknown) {
  console.log(err);
}