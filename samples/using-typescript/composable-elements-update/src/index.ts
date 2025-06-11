/*
	Copyright (c) 2025 Skyflow, Inc.
*/

import Skyflow, {
    CollectElementInput,
    CollectResponse,
    ComposableContainer,
    ComposableElement,
    ContainerOptions,
    ErrorTextStyles,
    ISkyflow,
    InputStyles,
    IValidationRule,
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
		},
	}
	const skyflow = Skyflow.init(config);

    //custom styles for collect elements
    const cardholderStyles = {
        inputStyles: {
            base: {
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '21px',
                width: '294px'
            },
        } as InputStyles,
        labelStyles: {
        } as LabelStyles,
        errorTextStyles: {
        } as ErrorTextStyles,
    };

    const cardNumberStyles = {
        inputStyles: {
            base: {
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '21px',
                width: '294px',
                paddingLeft: '18px'
            },
        } as InputStyles,
        labelStyles: {
        } as LabelStyles,
        errorTextStyles: {
        } as ErrorTextStyles,
    };

    const expiryDateStyles = {
        inputStyles: {
            base: {
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '21px',
                width: '49px'
            },
        } as InputStyles,
        labelStyles: {
        } as LabelStyles,
        errorTextStyles: {
        } as ErrorTextStyles,
    };

    const cvvStyles = {
        inputStyles: {
            base: {
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '21px',
                width: '30px'
            },
        } as InputStyles,
        labelStyles: {
        } as LabelStyles,
        errorTextStyles: {
            base: {
                color: 'red'
            }
        } as ErrorTextStyles,
    };

    const containerOptions: ContainerOptions = {
        layout: [1, 3],
        styles: {
            base: {
                border: '1px solid #eae8ee',
                padding: '10px 16px',
                borderRadius: '4px',
                margin: '12px 2px',
                boxShadow: '8px'
            }
        },
        errorTextStyles: {
            base: {
                color: 'red'
            }
        }
    }
    // create collect Container
    const composableContainer = skyflow.container(Skyflow.ContainerType.COMPOSABLE, containerOptions) as ComposableContainer;

    const cardHolderNameInput: CollectElementInput = {
        table: 'pii_fields',
        column: 'first_name',
        ...cardholderStyles,
        label: 'Cardholder Name',
        placeholder: 'cardholder name',
        type: Skyflow.ElementType.CARDHOLDER_NAME,
    }
    const cardHolderNameElement: ComposableElement = composableContainer.create(cardHolderNameInput);

    const cardNumberInput: CollectElementInput = {
        table: 'pii_fields',
        column: 'primary_card.card_number',
        ...cardNumberStyles,
        type: Skyflow.ElementType.CARD_NUMBER,
        placeholder: 'XXXX XXXX XXXX XXXX'
    }
    const cardNumberElement: ComposableElement = composableContainer.create(cardNumberInput);

    const expiryDateInput: CollectElementInput = {
        table: 'cards',
        column: 'expiry_date',
        ...expiryDateStyles,
        placeholder: 'MM/YY',
        type: Skyflow.ElementType.EXPIRATION_DATE,
    }
    const expiryDateElement: ComposableElement = composableContainer.create(expiryDateInput);

    const cvvInput: CollectElementInput = {
        table: 'pii_fields',
        column: 'primary_card.cvv',
        ...cvvStyles,
        placeholder: 'CVC',
        type: Skyflow.ElementType.CVV,
    }
    const cvvElement: ComposableElement = composableContainer.create(cvvInput);

    // mount the container
    composableContainer.mount('#composableContainer');

    // Add OnSubmit event listner on composable container
    composableContainer.on(Skyflow.EventName.SUBMIT, () => {
        // Handle when enter key pressed in any container elements
        console.log('Submit Listener is being Triggered.');
    });


    // Sample helper function to determine cvv length. 
    const findCvvLength = (cardBinValue: string): number => {
        console.log('Came here..!');
        const amexRegex = /^3[47][0-9]{4}$/
        return amexRegex.test(cardBinValue.slice(0, 6)) ? 4 : 3
    };

    // Validation rules for cvv element.
    const length3Rule: IValidationRule = {
        type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
        params: {
            max: 3,
            error: 'cvv must be 3 digits',
        },
    };

    const length4Rule: IValidationRule = {
        type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
        params: {
            min: 4,
            error: 'cvv must be 4 digits',
        },
    };

    // OnChange listener for cardNumber element.
    cardNumberElement.on(Skyflow.EventName.CHANGE, (state: any) => {
        console.log('update validation', state)
        if (state.isValid && state.value) {
            // update cvv element validation rule.
            if (findCvvLength(state.value) === 3) {
                const updateOptions: CollectElementInput = { validations: [length3Rule] }
                cvvElement.update(updateOptions);
            }
            else {
                const updateOptions: CollectElementInput = { validations: [length4Rule] }
                cvvElement.update(updateOptions);
            }
        }
    });

    // update composable elements
    const updateElementsButton = document.getElementById('updateElements');
    if (updateElementsButton) {
        updateElementsButton.addEventListener('click', () => {
            // update label,placeholder on cardholderName,
            cardHolderNameElement.update({
                label: 'CARDHOLDER NAME',
                placeholder: 'Eg: John'
            } as CollectElementInput);

            // update styles on card number
            cardNumberElement.update({
                inputStyles: {
                    base: {
                        color: 'blue'
                    }
                }
            } as CollectElementInput);

            // update table,coloumn on expiry date
            expiryDateElement.update({
                table: 'pii_fields',
                column: 'primary_card.expiry_date',
            } as CollectElementInput);

        });
    }

    // collect all elements data
    const collectButton = document.getElementById('collectPCIData');
    if (collectButton) {
        collectButton.addEventListener('click', () => {
            const collectResponse: Promise<CollectResponse> = composableContainer.collect();
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

                    // Create Reveal Elements With Tokens.
                    const fieldsTokenData = response.records[0].fields;
                    const revealContainer = skyflow.container(
                        Skyflow.ContainerType.REVEAL
                    ) as RevealContainer;
                    const revealCardNumberElement: RevealElement = revealContainer.create({
                        token: fieldsTokenData.primary_card.card_number,
                        label: 'Card Number',
                        ...revealStyleOptions,
                    });
                    revealCardNumberElement.mount('#revealCardNumber');

                    const revealCardCvvElement: RevealElement = revealContainer.create({
                        token: fieldsTokenData.primary_card.cvv,
                        label: 'Cvv',
                        ...revealStyleOptions,
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
                            const revealResonse: Promise<RevealResponse> = revealContainer.reveal();
                            revealResonse.then((res: RevealResponse) => {
                                console.log(res);
                            })
                            .catch((err: RevealResponse) => {
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
    console.error(err);
}