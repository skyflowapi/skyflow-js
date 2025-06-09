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
} from "skyflow-js";

try {
  const revealView = document.getElementById("revealView");
  if (revealView) {
    revealView.style.visibility = "hidden";
  }
  let response;
  const skyflow = Skyflow.init({
    vaultID: "<VAULT_ID>",
    vaultURL: "<VAULT_URL>",
    getBearerToken: () => {
      return new Promise((resolve, reject) => {
        const Http = new XMLHttpRequest();

        Http.onreadystatechange = () => {
          if (Http.readyState === 4 && Http.status === 200) {
            const response = JSON.parse(Http.responseText);
            resolve(response.accessToken);
          }
        };
        const url = "<TOKEN_END_POINT_URL>";
        Http.open("GET", url);
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
        border: "1px solid #eae8ee",
        padding: "10px 16px",
        borderRadius: "4px",
        color: "#1d1d1d",
        marginTop: "4px",
        fontFamily: '"Roboto", sans-serif',
      },
      complete: {
        color: "#4caf50",
      },
      empty: {},
      focus: {},
      invalid: {
        color: "#f44336",
      },
      global: {
        "@import":
          'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      },
    },
    labelStyles: {
      base: {
        fontSize: "16px",
        fontWeight: "bold",
        fontFamily: '"Roboto", sans-serif',
      },
      global: {
        "@import":
          'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      },
      requiredAsterisk: {
        color: "red",
      },
    },
    errorTextStyles: {
      base: {
        color: "#f44336",
        fontFamily: '"Roboto", sans-serif',
      },
      global: {
        "@import":
          'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      },
    },
  };

  // Create collect elements.
  const cardNumberElement: CollectElement = collectContainer.create(
    {
      table: "pii_fields",
      column: "card_number",
      ...collectStylesOptions,
      placeholder: "card number",
      label: "Card Number",
      type: Skyflow.ElementType.CARD_NUMBER,
    },
    {
      required: true,
    }
  );

  const cvvElement: CollectElement = collectContainer.create({
    table: "pii_fields",
    column: "cvv",
    ...collectStylesOptions,
    label: "Cvv",
    placeholder: "cvv",
    type: Skyflow.ElementType.CVV,
  });

  const expiryDateElement: CollectElement = collectContainer.create({
    table: "pii_fields",
    column: "primary_card.expiry_date",
    ...collectStylesOptions,
    label: "Expiry Date",
    placeholder: "MM/YYYY",
    type: Skyflow.ElementType.EXPIRATION_DATE,
  });

  const cardHolderNameElement: CollectElement = collectContainer.create({
    table: "pii_fields",
    column: "name",
    ...collectStylesOptions,
    label: "Card Holder Name",
    placeholder: "cardholder name",
    type: Skyflow.ElementType.CARDHOLDER_NAME,
  });

  // Mount the elements.
  cardNumberElement.mount("#collectCardNumber");
  cvvElement.mount("#collectCvv");
  expiryDateElement.mount("#collectExpiryDate");
  cardHolderNameElement.mount("#collectCardholderName");

  // Sample helper function to determine cvv length.
  const findCvvLength = (cardBinValue) => {
    console.log("Came here..!");
    const amexRegex = /^3[78][0-9]{4}$/;
    return amexRegex.test(cardBinValue.slice(0, 6)) ? 4 : 3;
  };

  // Validation rules for cvv element.
  const length3Rule = {
    type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
    params: {
      max: 3,
      error: "cvv must be 3 digits",
    },
  };

  const length4Rule = {
    type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
    params: {
      min: 4,
      error: "cvv must be 4 digits",
    },
  };

  // OnChange listener for cardNumber element.
  cardNumberElement.on(Skyflow.EventName.CHANGE, (state) => {
    console.log("update validation", state);
    if (state.isValid) {
      // update cvv element validation rule.
      if (findCvvLength(state.value) === 3) {
        cvvElement.update({ validations: [length3Rule] });
      } else cvvElement.update({ validations: [length4Rule] });
    }
  });

  // update collect elements' properties
  const updateCollectElementsButton = document.getElementById(
    "updateCollectElements"
  );
  if (updateCollectElementsButton) {
    updateCollectElementsButton.addEventListener("click", () => {
      // update label,placeholder on cardholderName,
      cardHolderNameElement.update({
        label: "CARDHOLDER NAME",
        placeholder: "Eg: John",
        type: Skyflow.ElementType.PIN,
      });

      // update styles on card number
      cardNumberElement.update({
        inputStyles: {
          base: {
            color: "blue",
          },
        },
      });

      // update table,coloumn on expiry date
      expiryDateElement.update({
        table: "pii_fields",
        column: "expiration_date",
      });
    });
  }

  // Collect all elements data.
  const collectButton = document.getElementById("collectPCIData");
  if (collectButton) {
    collectButton.addEventListener("click", () => {
      const collectResponse: Promise<CollectResponse> = collectContainer.collect();
      collectResponse
        .then((response) => {
          console.log(response);
          response = response;
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

  revealView!.style.visibility = "visible";

  const revealStyleOptions = {
    inputStyles: {
      base: {
        border: "1px solid #eae8ee",
        padding: "10px 16px",
        borderRadius: "4px",
        color: "#1d1d1d",
        marginTop: "4px",
        fontFamily: '"Roboto", sans-serif',
      },
      global: {
        "@import":
          'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      },
    },
    labelStyles: {
      base: {
        fontSize: "16px",
        fontWeight: "bold",
        fontFamily: '"Roboto", sans-serif',
      },
      global: {
        "@import":
          'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      },
    },
    errorTextStyles: {
      base: {
        color: "#f44336",
        paddingLeft: "20px",
        fontFamily: '"Roboto", sans-serif',
      },
      global: {
        "@import":
          'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      },
    },
  };

  // Create Reveal Elements With Tokens.
  const fieldsTokenData = response.records[0].fields;
  const revealContainer = skyflow.container(Skyflow.ContainerType.REVEAL) as RevealContainer;
  
  const revealCardNumberElement: RevealElement = revealContainer.create({
    token: fieldsTokenData.card_number,
    label: "Card Number",
    ...revealStyleOptions,
  });
  revealCardNumberElement.mount("#revealCardNumber");

  const revealCardCvvElement: RevealElement = revealContainer.create({
    token: fieldsTokenData.cvv,
    label: "CVV",
    ...revealStyleOptions,
    altText: "###",
  });
  revealCardCvvElement.mount("#revealCvv");

  const revealCardExpiryElement: RevealElement = revealContainer.create({
    token: fieldsTokenData.expiration_date,
    label: "Card Expiry Date",
    ...revealStyleOptions,
  });
  revealCardExpiryElement.mount("#revealExpiryDate");

  const revealCardholderNameElement: RevealElement = revealContainer.create({
    token: fieldsTokenData.name,
    label: "Card Holder Name",
    ...revealStyleOptions,
  });
  revealCardholderNameElement.mount("#revealCardholderName");

  const revealButton = document.getElementById("revealPCIData");

  // update Reveal elements' properties
  const updateRevealElementsButton = document.getElementById(
    "updateRevealElements"
  );
  if (updateRevealElementsButton) {
    updateRevealElementsButton.addEventListener("click", () => {
      // update label,inputStyles on cardholderName,
      revealCardholderNameElement.update({
        label: "CARDHOLDER NAME",
        inputStyles: {
          base: {
            color: "#aa11aa",
          },
        },
      });

      // update label,labelSyles on card number
      revealCardNumberElement.update({
        label: "CARD NUMBER",
        labelStyles: {
          base: {
            borderWidth: "5px",
          },
        },
      });

      // update redaction,inputStyles on expiry date
      revealCardExpiryElement.update({
        redaction: Skyflow.RedactionType.REDACTED,
        inputStyles: {
          base: {
            backgroundColor: "#000",
            color: "#fff",
          },
        },
      });

      // update altText,token,inputStyles,errorTextStyles on cvv
      revealCardCvvElement.update({
        altText: "XXXX-XX",
        token: "new-random-roken",
        inputStyles: {
          base: {
            color: "#fff",
            backgroundColor: "#000",
            borderColor: "#f00",
            borderWidth: "5px",
          },
        },
        errorTextStyles: {
          base: {
            backgroundColor: "#000",
            border: "1px #f00 solid",
          },
        },
      });
    });
  }

  if (revealButton) {
    revealButton.addEventListener("click", () => {
      const revealResponse: Promise<RevealResponse> = revealContainer.reveal();
        revealResponse.then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
} catch (err) {
  console.log(err);
}
