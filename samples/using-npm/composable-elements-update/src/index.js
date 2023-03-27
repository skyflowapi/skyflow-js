import Skyflow from 'skyflow-js';

try {
    const revealView = document.getElementById('revealView');
    revealView.style.visibility = 'hidden';
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
        },
    });

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
        },
        labelStyles: {
        },
        errorTextStyles: {
        },
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
        },
        labelStyles: {
        },
        errorTextStyles: {
        },
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
        },
        labelStyles: {
        },
        errorTextStyles: {
        },
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
        },
        labelStyles: {
        },
        errorTextStyles: {
            base: {
                color: 'red'
            }
        },
    };

    const containerOptions = {
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
    const composableContainer = skyflow.container(Skyflow.ContainerType.COMPOSABLE, containerOptions);

    const cardHolderNameElement = composableContainer.create({
        table: 'pii_fields',
        column: 'first_name',
        ...cardholderStyles,
        label: 'Cardholder Name',
        placeholder: 'cardholder name',
        type: Skyflow.ElementType.CARDHOLDER_NAME,
    });

    const cardNumberElement = composableContainer.create({
        table: 'pii_fields',
        column: 'primary_card.card_number',
        ...cardNumberStyles,
        type: Skyflow.ElementType.CARD_NUMBER,
        placeholder: 'XXXX XXXX XXXX XXXX'
    });

    const expiryDateElement = composableContainer.create({
        table: 'cards',
        column: 'expiry_date',
        ...expiryDateStyles,
        placeholder: 'MM/YY',
        type: Skyflow.ElementType.EXPIRATION_DATE,
    });


    const cvvElement = composableContainer.create({
        table: 'pii_fields',
        column: 'primary_card.cvv',
        ...cvvStyles,
        placeholder: 'CVC',
        type: Skyflow.ElementType.CVV,
    });

    // mount the container
    composableContainer.mount('#composableContainer');

    // Add OnSubmit event listner on composable container
    composableContainer.on(Skyflow.EventName.SUBMIT, () => {
        // Handle when enter key pressed in any container elements
        console.log('Submit Listener is being Triggered.');
    });


    // Sample helper function to determine cvv length. 
    const findCvvLength = (cardBinValue) => {
        console.log('Came here..!');
        const amexRegex = /^3[47][0-9]{4}$/
        return amexRegex.test(cardBinValue.slice(0, 6)) ? 4 : 3
    };

    // Validation rules for cvv element.
    const length3Rule = {
        type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
        params: {
            max: 3,
            error: 'cvv must be 3 digits',
        },
    };

    const length4Rule = {
        type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
        params: {
            min: 4,
            error: 'cvv must be 4 digits',
        },
    };

    // OnChange listener for cardNumber element.
    cardNumberElement.on(Skyflow.EventName.CHANGE, (state) => {
        console.log('update validation', state)
        if (state.isValid) {
            // update cvv element validation rule.
            if (findCvvLength(state.value) === 3) {
                cvvElement.update({ validations: [length3Rule] });
            }
            else
                cvvElement.update({ validations: [length4Rule] });
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
            });

            // update styles on card number
            cardNumberElement.update({
                inputStyles: {
                    base: {
                        color: 'blue'
                    }
                }
            });

            // update table,coloumn on expiry date
            expiryDateElement.update({
                table: 'pii_fields',
                column: 'primary_card.expiry_date',
            });

        });
    }



    // collect all elements data
    const collectButton = document.getElementById('collectPCIData');
    if (collectButton) {
        collectButton.addEventListener('click', () => {
            const collectResponse = composableContainer.collect();
            collectResponse
                .then(response => {
                    document.getElementById('collectResponse').innerHTML =
                        JSON.stringify(response, null, 2);

                    revealView.style.visibility = 'visible';

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

                    // Create Reveal Elements With Tokens.
                    const fieldsTokenData = response.records[0].fields;
                    const revealContainer = skyflow.container(
                        Skyflow.ContainerType.REVEAL
                    );
                    const revealCardNumberElement = revealContainer.create({
                        token: fieldsTokenData.primary_card.card_number,
                        label: 'Card Number',
                        ...revealStyleOptions,

                    });
                    revealCardNumberElement.mount('#revealCardNumber');

                    const revealCardCvvElement = revealContainer.create({
                        token: fieldsTokenData.primary_card.cvv,
                        label: 'Cvv',
                        ...revealStyleOptions,

                    });
                    revealCardCvvElement.mount('#revealCvv');

                    const revealCardExpiryElement = revealContainer.create({
                        token: fieldsTokenData.primary_card.expiry_date,
                        label: 'Card Expiry Date',
                        ...revealStyleOptions,
                    });
                    revealCardExpiryElement.mount('#revealExpiryDate');

                    const revealCardholderNameElement = revealContainer.create({
                        token: fieldsTokenData.first_name,
                        label: 'Card Holder Name',
                        ...revealStyleOptions,
                    });
                    revealCardholderNameElement.mount('#revealCardholderName');

                    const revealButton = document.getElementById('revealPCIData');

                    if (revealButton) {
                        revealButton.addEventListener('click', () => {
                            revealContainer
                                .reveal()
                                .then(res => {
                                    console.log(res);
                                })
                                .catch(err => {
                                    console.log(err);
                                });
                        });
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        });
    }


} catch (err) {
    console.log(err);
}