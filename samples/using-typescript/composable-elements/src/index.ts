/*
	Copyright (c) 2025 Skyflow, Inc.
*/

import Skyflow, {
	ComposableContainer,
	ComposableElement,
	CollectElementInput,
	CollectResponse,
	RevealContainer,
	RevealElement,
	RevealResponse,
	SkyflowConfig,
	InputStyles,
	LabelStyles,
	ContainerOptions,
	ErrorTextStyles,
	RevealElementInput,
} from 'skyflow-js';

try {
	const revealView = document.getElementById('revealView') as HTMLElement;
	if (revealView) {
		revealView.style.visibility = 'hidden';
	}
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

	//custom styles for collect elements
	const cardholderStyles = {
		inputStyles: {
			base: {
				fontFamily: '"Roboto", sans-serif',
				fontStyle: 'normal',
				fontWeight: '400',
				fontSize: '14px',
				lineHeight: '21px',
				width: '294px'
			},
			global: {
				'@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
			}
		} as InputStyles,
		labelStyles: {
		} as LabelStyles,
	};

	const cardNumberStyles = {
		inputStyles: {
			base: {
				fontFamily: '"Roboto", sans-serif',
				fontStyle: 'normal',
				fontWeight: '400',
				fontSize: '14px',
				lineHeight: '21px',
				width: '294px',
				paddingLeft: '18px'
			},
		} as InputStyles,
		labelStyles: {
		} as LabelStyles,
	};

	const expiryDateStyles = {
		inputStyles: {
			base: {
				fontFamily: '"Roboto", sans-serif',
				fontStyle: 'normal',
				fontWeight: '400',
				fontSize: '14px',
				lineHeight: '21px',
				width: '49px'
			},
		} as InputStyles,
		labelStyles: {
		} as LabelStyles,
	};

	const cvvStyles = {
		inputStyles: {
			base: {
				fontFamily: '"Roboto", sans-serif',
				fontStyle: 'normal',
				fontWeight: '400',
				fontSize: '14px',
				lineHeight: '21px',
				width: '30px'
			},
		} as InputStyles,
		labelStyles: {
		} as LabelStyles,
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
		} as InputStyles,
		errorTextStyles: {
			base: {
				color: 'red',
				fontFamily: '"Roboto", sans-serif'
			},
			global: {
				'@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
			}
		} as ErrorTextStyles,
	}
	// create collect Container
	const composableContainer = skyflowClient.container(Skyflow.ContainerType.COMPOSABLE, containerOptions) as ComposableContainer;

	const cardHolderNameInput: CollectElementInput = {
		table: 'pii_fields',
		column: 'first_name',
		...cardholderStyles,
		placeholder: 'Cardholder Name',
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
		table: 'pii_fields',
		column: 'primary_card.expiry_date',
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

	// collect all elements data
	const collectButton = document.getElementById('collectPCIData') as HTMLButtonElement;
	if (collectButton) {
		collectButton.addEventListener('click', () => {
			const collectResponse: Promise<CollectResponse> = composableContainer.collect();
			collectResponse
				.then((response: CollectResponse) => {
					const responseElement = document.getElementById('collectResponse') as HTMLElement;
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
						} as InputStyles,
						labelStyles: {
							base: {
								fontSize: '16px',
								fontWeight: 'bold',
								fontFamily: '"Roboto", sans-serif'
							},
						} as LabelStyles,
						errorTextStyles: {
							base: {
								color: '#f44336',
								fontFamily: '"Roboto", sans-serif'
							},
						} as ErrorTextStyles,
					};

					// Create Reveal Elements With Tokens.
					const fieldsTokenData = response.records![0].fields;
					const revealContainer = skyflowClient.container(
						Skyflow.ContainerType.REVEAL
					) as RevealContainer;

					const revealCardNumberInput: RevealElementInput = {
						token: fieldsTokenData.primary_card.card_number,
						label: 'Card Number',
						...revealStyleOptions,
					};
					const revealCardNumberElement: RevealElement = revealContainer.create(revealCardNumberInput);
					revealCardNumberElement.mount('#revealCardNumber');

					const revealCardCvvInput: RevealElementInput = {
						token: fieldsTokenData.primary_card.cvv,
						label: 'Cvv',
						...revealStyleOptions,
					}
					const revealCardCvvElement: RevealElement = revealContainer.create(revealCardCvvInput);
					revealCardCvvElement.mount('#revealCvv');

					const revealCardExpiryInput: RevealElementInput = {
						token: fieldsTokenData.primary_card.expiry_date,
						label: 'Card Expiry Date',
						...revealStyleOptions,
					};
					const revealCardExpiryElement: RevealElement = revealContainer.create(revealCardExpiryInput);
					revealCardExpiryElement.mount('#revealExpiryDate');

					const revealCardholderNameInput: RevealElementInput = {
						token: fieldsTokenData.first_name,
						label: 'Card Holder Name',
						...revealStyleOptions,
					}
					const revealCardholderNameElement: RevealElement = revealContainer.create(revealCardholderNameInput);
					revealCardholderNameElement.mount('#revealCardholderName');

					const revealButton = document.getElementById('revealPCIData') as HTMLButtonElement;

					if (revealButton) {
						revealButton.addEventListener('click', () => {
							const revealResponse: Promise<RevealResponse> = revealContainer.reveal();
							revealResponse.then((res: RevealResponse) => {
								console.log(res);
							})
							.catch((err: RevealResponse) => {
								console.error(err);
							});
						});
					}
				})
				.catch((err: CollectResponse) => {
					console.log(err);
					const responseElement = document.getElementById('collectResponse') as HTMLElement;
					if (responseElement) {
						responseElement.innerHTML = JSON.stringify(err, null, 2);
					}
				});
		});
	}
} catch (err: unknown) {
	console.error(err);
}