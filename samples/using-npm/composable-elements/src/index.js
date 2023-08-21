/*
	Copyright (c) 2022 Skyflow, Inc.
*/

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
				fontFamily: '"Roboto", sans-serif',
				fontStyle: 'normal',
				fontWeight: 400,
				fontSize: '14px',
				lineHeight: '21px',
				width: '294px'
			},
			global: {
				'@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
			}
		},
		labelStyles: {
		},
	};

	const cardNumberStyles = {
		inputStyles: {
			base: {
				fontFamily: '"Roboto", sans-serif',
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
	};

	const expiryDateStyles = {
		inputStyles: {
			base: {
				fontFamily: '"Roboto", sans-serif',
				fontStyle: 'normal',
				fontWeight: 400,
				fontSize: '14px',
				lineHeight: '21px',
				width: '49px'
			},
		},
		labelStyles: {
		},
	};

	const cvvStyles = {
		inputStyles: {
			base: {
				fontFamily: '"Roboto", sans-serif',
				fontStyle: 'normal',
				fontWeight: 400,
				fontSize: '14px',
				lineHeight: '21px',
				width: '30px'
			},
		},
		labelStyles: {
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
				color: 'red',
				fontFamily: '"Roboto", sans-serif'
			},
			global: {
				'@import' :'url("https://fonts.googleapis.com/css2?family=Roboto&display=swap")',
			}
		}
	}
	// create collect Container
	const composableContainer = skyflow.container(Skyflow.ContainerType.COMPOSABLE, containerOptions);

	const cardHolderNameElement = composableContainer.create({
		table: 'pii_fields',
		column: 'first_name',
		...cardholderStyles,
		placeholder: 'Cardholder Name',
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
		table: 'pii_fields',
		column: 'primary_card.expiry_date',
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
						},
						errorTextStyles: {
							base: {
								color: '#f44336',
								fontFamily: '"Roboto", sans-serif'
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