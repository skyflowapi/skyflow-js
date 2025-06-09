/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  RevealContainer, 
  RevealElement,
  RevealResponse,
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


  const revealStyleOptions = {
    inputStyles: {
      base: {
        border: '1px solid #eae8ee',
        padding: '10px 16px',
        borderRadius: '4px',
        color: '#1d1d1d',
        marginTop: '4px',
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

  const revealContainer = skyflow.container(Skyflow.ContainerType.REVEAL) as RevealContainer;
  const revealCardNumberElement: RevealElement = revealContainer.create({
    token: '<TOKEN 1>',
    label: 'Card Number',
    ...revealStyleOptions,
  }, {
    format: 'XXXX-XXXX-XXXX-XXXX',
    translation: { X: '[0-9]' }
  });
  revealCardNumberElement.mount('#revealCardNumber');

  const revealSSNElement: RevealElement = revealContainer.create({
    token: '<TOKEN 2>',
    label: 'SSN',
    ...revealStyleOptions,
    altText: '###',
  }, {
    format: 'XX-XXX-XXXX',
  });
  revealSSNElement.mount('#revealCvv');

  const revealPhoneNumberElement: RevealElement = revealContainer.create({
    token: '<TOKEN 3>',
    label: 'Phone Number',
    ...revealStyleOptions,
  }, {
    format: '(XXX) XXX-XXXX',
    translation: { X: '[0-9]' }
  });
  revealPhoneNumberElement.mount('#revealExpiryDate');

  const revealDrivingLicenseElement: RevealElement = revealContainer.create({
    token: '<TOKEN 4>',
    label: 'Driving License',
    ...revealStyleOptions,
  }, {
    format: 'YXX XXXX XXXX',
    translation: { Y: '[A-Z]', X: '[0-9]' }
  });
  revealDrivingLicenseElement.mount('#revealCardholderName');

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
} catch (err) {
  console.log(err);
}
