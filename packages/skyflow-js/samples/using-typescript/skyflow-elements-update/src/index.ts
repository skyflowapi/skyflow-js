/*
  Copyright (c) 2025 Skyflow, Inc.
*/
import Skyflow, {
  CollectContainer,
  CollectElement,
  CollectElementInput,
  CollectElementOptions,
  CollectElementUpdateOptions,
  CollectResponse,
  ErrorTextStyles,
  ElementState,
  InputStyles,
  LabelStyles,
  RevealContainer,
  RevealElement,
  RevealElementInput,
  RevealResponse,
  SkyflowConfig,
  ValidationRule,
} from "skyflow-js";

try {
  const revealView = document.getElementById("revealView") as HTMLElement;
  if (revealView) {
    revealView.style.visibility = "hidden";
  }
  let collectResponseData: CollectResponse = {};
  const config: SkyflowConfig = {
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
  };
  const skyflowClient: Skyflow = Skyflow.init(config);

  // Create collect Container.
  const collectContainer = skyflowClient.container(
    Skyflow.ContainerType.COLLECT
  ) as CollectContainer;

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
    } as InputStyles,
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
    } as LabelStyles,
    errorTextStyles: {
      base: {
        color: "#f44336",
        fontFamily: '"Roboto", sans-serif',
      },
      global: {
        "@import":
          'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
      },
    } as ErrorTextStyles,
  };

  // Create collect elements.
  const cardNumberInput: CollectElementInput = {
    table: "pii_fields",
    column: "card_number",
    ...collectStylesOptions,
    placeholder: "card number",
    label: "Card Number",
    type: Skyflow.ElementType.CARD_NUMBER,
  };
  const cardNumberOptions: CollectElementOptions = {
    required: true,
  };
  const cardNumberElement: CollectElement = collectContainer.create(
    cardNumberInput,
    cardNumberOptions
  );

  const cvvInput: CollectElementInput = {
    table: "pii_fields",
    column: "cvv",
    ...collectStylesOptions,
    label: "Cvv",
    placeholder: "cvv",
    type: Skyflow.ElementType.CVV,
  };
  const cvvElement: CollectElement = collectContainer.create(cvvInput);

  const expiryDateInput: CollectElementInput = {
    table: "pii_fields",
    column: "primary_card.expiry_date",
    ...collectStylesOptions,
    label: "Expiry Date",
    placeholder: "MM/YYYY",
    type: Skyflow.ElementType.EXPIRATION_DATE,
  };
  const expiryDateElement: CollectElement =
    collectContainer.create(expiryDateInput);

  const cardholderNameInput: CollectElementInput = {
    table: "pii_fields",
    column: "name",
    ...collectStylesOptions,
    label: "Card Holder Name",
    placeholder: "cardholder name",
    type: Skyflow.ElementType.CARDHOLDER_NAME,
  };
  const cardHolderNameElement: CollectElement =
    collectContainer.create(cardholderNameInput);

  // Mount the elements.
  cardNumberElement.mount("#collectCardNumber");
  cvvElement.mount("#collectCvv");
  expiryDateElement.mount("#collectExpiryDate");
  cardHolderNameElement.mount("#collectCardholderName");

  // Sample helper function to determine cvv length.
  const findCvvLength = (cardBinValue: string) => {
    const amexRegex = /^3[78][0-9]{4}$/;
    return amexRegex.test(cardBinValue.slice(0, 6)) ? 4 : 3;
  };

  // Validation rules for cvv element.
  const length3Rule: ValidationRule = {
    type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
    params: {
      max: 3,
      error: "cvv must be 3 digits",
    },
  };

  const length4Rule: ValidationRule = {
    type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
    params: {
      min: 4,
      error: "cvv must be 4 digits",
    },
  };

  // OnChange listener for cardNumber element.
  cardNumberElement.on(Skyflow.EventName.CHANGE, (state: ElementState) => {
    if (state.isValid) {
      // update cvv element validation rule.
      if (findCvvLength(state.value as string) === 3) {
        const updateOptions: CollectElementUpdateOptions = {
          validations: [length3Rule],
        };
        cvvElement.update(updateOptions);
      } else {
        const updateOptions: CollectElementUpdateOptions = {
          validations: [length4Rule],
        };
        cvvElement.update(updateOptions);
      }
    }
  });

  // update collect elements' properties
  const updateCollectElementsButton = document.getElementById(
    "updateCollectElements"
  ) as HTMLButtonElement;
  if (updateCollectElementsButton) {
    updateCollectElementsButton.addEventListener("click", () => {
      // update label,placeholder on cardholderName,
      cardHolderNameElement.update({
        label: "CARDHOLDER NAME",
        placeholder: "Eg: John",
        type: Skyflow.ElementType.PIN,
      } as CollectElementInput);

      // update styles on card number
      cardNumberElement.update({
        inputStyles: {
          base: {
            color: "blue",
          },
        },
      } as CollectElementUpdateOptions);

      // update table,coloumn on expiry date
      expiryDateElement.update({
        table: "pii_fields",
        column: "expiration_date",
      } as CollectElementUpdateOptions);
    });
  }

  // Collect all elements data.
  const collectButton = document.getElementById(
    "collectPCIData"
  ) as HTMLButtonElement;
  if (collectButton) {
    collectButton.addEventListener("click", () => {
      const collectResponse: Promise<CollectResponse> =
        collectContainer.collect();
      collectResponse
        .then((response: CollectResponse) => {
          console.log(response);
          collectResponseData = response;
          const responseElement = document.getElementById(
            "collectResponse"
          ) as HTMLElement;
          if (responseElement) {
            responseElement.innerHTML = JSON.stringify(response, null, 2);
          }

          revealView.style.visibility = "visible";

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
            } as InputStyles,
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
            } as LabelStyles,
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
            } as ErrorTextStyles,
          };

          // Create Reveal Elements With Tokens.
          const fieldsTokenData = collectResponseData.records![0].fields;
          const revealContainer = skyflowClient.container(
            Skyflow.ContainerType.REVEAL
          ) as RevealContainer;

          const revealCardNumberInput: RevealElementInput = {
            token: fieldsTokenData.card_number,
            label: "Card Number",
            ...revealStyleOptions,
          };
          const revealCardNumberElement: RevealElement = revealContainer.create(
            revealCardNumberInput
          );
          revealCardNumberElement.mount("#revealCardNumber");

          const revealCardCvvInput: RevealElementInput = {
            token: fieldsTokenData.cvv,
            label: "CVV",
            ...revealStyleOptions,
            altText: "###",
          };
          const revealCardCvvElement: RevealElement =
            revealContainer.create(revealCardCvvInput);
          revealCardCvvElement.mount("#revealCvv");

          const revealCardExpiryInput: RevealElementInput = {
            token: fieldsTokenData.expiration_date,
            label: "Card Expiry Date",
            ...revealStyleOptions,
          };
          const revealCardExpiryElement: RevealElement = revealContainer.create(
            revealCardExpiryInput
          );
          revealCardExpiryElement.mount("#revealExpiryDate");

          const revealCardholderNameInput: RevealElementInput = {
            token: fieldsTokenData.name,
            label: "Card Holder Name",
            ...revealStyleOptions,
          };
          const revealCardholderNameElement: RevealElement =
            revealContainer.create(revealCardholderNameInput);
          revealCardholderNameElement.mount("#revealCardholderName");

          const revealButton = document.getElementById(
            "revealPCIData"
          ) as HTMLButtonElement;

          // update Reveal elements' properties
          const updateRevealElementsButton = document.getElementById(
            "updateRevealElements"
          ) as HTMLButtonElement;
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
              } as RevealElementInput);

              // update label,labelSyles on card number
              revealCardNumberElement.update({
                label: "CARD NUMBER",
                labelStyles: {
                  base: {
                    borderWidth: "5px",
                  },
                },
              } as RevealElementInput);

              // update redaction,inputStyles on expiry date
              revealCardExpiryElement.update({
                redaction: Skyflow.RedactionType.REDACTED,
                inputStyles: {
                  base: {
                    backgroundColor: "#000",
                    color: "#fff",
                  },
                },
              } as RevealElementInput);

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
              } as RevealElementInput);
            });
          }

          if (revealButton) {
            revealButton.addEventListener("click", () => {
              const revealResponse: Promise<RevealResponse> =
                revealContainer.reveal();
              revealResponse
                .then((res: RevealResponse) => {
                  console.log(res);
                })
                .catch((err: RevealResponse) => {
                  console.log(err);
                });
            });
          }
        })
        .catch((err: CollectResponse) => {
          const errorElement = document.getElementById(
            "collectResponse"
          ) as HTMLElement;
          if (errorElement) {
            errorElement.innerHTML = JSON.stringify(err, null, 2);
          }
          console.log(err);
        });
    });
  }
} catch (err: unknown) {
  console.log(err);
}
