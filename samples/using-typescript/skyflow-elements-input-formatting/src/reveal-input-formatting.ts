/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  ErrorTextStyles,
  InputStyles,
  IRevealElementOptions,
  IRevealElementInput,
  ISkyflow,
  LabelStyles,
  RevealContainer, 
  RevealElement,
  RevealResponse,
} from "skyflow-js";

try {
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

  const revealStyleOptions = {
    inputStyles: {
      base: {
        border: '1px solid #eae8ee',
        padding: '10px 16px',
        borderRadius: '4px',
        color: '#1d1d1d',
        marginTop: '4px',
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

  const revealContainer = skyflow.container(Skyflow.ContainerType.REVEAL) as RevealContainer;
  const revealCardNumberInput: IRevealElementInput = {
    token: '<TOKEN 1>',
    label: 'Card Number',
    ...revealStyleOptions,
  };
  const revealCardNumberOptions: IRevealElementOptions = {
    format: 'XXXX-XXXX-XXXX-XXXX',
    translation: { X: '[0-9]' }
  };
  const revealCardNumberElement: RevealElement = revealContainer.create(
    revealCardNumberInput,
    revealCardNumberOptions,
  );
  revealCardNumberElement.mount('#revealCardNumber');

  const revealSSNInput: IRevealElementInput = {
    token: '<TOKEN 2>',
    label: 'SSN',
    ...revealStyleOptions,
    altText: '###',
  };
  const revealSSNOptions: IRevealElementOptions = {
    format: 'XX-XXX-XXXX',
  };
  const revealSSNElement: RevealElement = revealContainer.create(
    revealSSNInput,
    revealSSNOptions
  );
  revealSSNElement.mount('#revealCvv');

  const revealPhoneNumberInput: IRevealElementInput = {
    token: '<TOKEN 3>',
    label: 'Phone Number',
    ...revealStyleOptions,
  }
  const revealPhoneNumberOptions: IRevealElementOptions = {
    format: '(XXX) XXX-XXXX',
    translation: { X: '[0-9]' }
  }
  const revealPhoneNumberElement: RevealElement = revealContainer.create(
    revealPhoneNumberInput,
    revealPhoneNumberOptions,
  );
  revealPhoneNumberElement.mount('#revealExpiryDate');

  const revealDrivingLicenseInput: IRevealElementInput = {
    token: '<TOKEN 4>',
    label: 'Driving License',
    ...revealStyleOptions,
  };
  const revealDrivingLicenseOptions: IRevealElementOptions = {
    format: 'YXX XXXX XXXX',
    translation: { Y: '[A-Z]', X: '[0-9]' }
  }
  const revealDrivingLicenseElement: RevealElement = revealContainer.create(
    revealDrivingLicenseInput,
    revealDrivingLicenseOptions
  );
  revealDrivingLicenseElement.mount('#revealCardholderName');

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
} catch (err: unknown) {
  console.log(err);
}
