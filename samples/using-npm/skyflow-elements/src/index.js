/*
Copyright (c) 2022 Skyflow, Inc.
*/
import Skyflow from "skyflow-js";

try{
     const revealView = document.getElementById("revealView");
     revealView.style.visibility = "hidden";

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
       options:{
         logLevel:Skyflow.LogLevel.ERROR,
         env:Skyflow.Env.PROD,
       }
     });

     // create collect Container
     const collectContainer = skyflow.container(Skyflow.ContainerType.COLLECT);

     //custom styles for collect elements
     const collectStylesOptions = {
       inputStyles: {
         base: {
           border: "1px solid #eae8ee",
           padding: "10px 16px",
           borderRadius: "4px",
           color: "#1d1d1d",
           marginTop: "4px",
         },
         complete: {
           color: "#4caf50",
         },
         empty: {},
         focus: {},
         invalid: {
           color: "#f44336",
         },
       },
       labelStyles: {
         base: {
           fontSize: "16px",
           fontWeight: "bold",
         },
       },
       errorTextStyles: {
         base: {
           color: "#f44336",
         },
       },
     };

     // create collect elements
     const cardNumberElement = collectContainer.create({
       table: "pii_fields",
       column: "primary_card.card_number",
       ...collectStylesOptions,
       placeholder: "card number",
       label: "Card Number",
       type: Skyflow.ElementType.CARD_NUMBER,
     });

     const cvvElement = collectContainer.create({
       table: "pii_fields",
       column: "primary_card.cvv",
       ...collectStylesOptions,
       label: "Cvv",
       placeholder: "cvv",
       type: Skyflow.ElementType.CVV,
     });

     const expiryDateElement = collectContainer.create({
       table: "pii_fields",
       column: "primary_card.expiry_date",
       ...collectStylesOptions,
       label: "Expiry Date",
       placeholder: "MM/YYYY",
       type: Skyflow.ElementType.EXPIRATION_DATE,
     });

     const cardHolderNameElement = collectContainer.create({
       table: "pii_fields",
       column: "first_name",
       ...collectStylesOptions,
       label: "Card Holder Name",
       placeholder: "cardholder name",
       type: Skyflow.ElementType.CARDHOLDER_NAME,
     });

     // mount the elements
     cardNumberElement.mount("#collectCardNumber");
     cvvElement.mount("#collectCvv");
     expiryDateElement.mount("#collectExpiryDate");
     cardHolderNameElement.mount("#collectCardholderName");

     // collect all elements data
     const collectButton = document.getElementById("collectPCIData");
     if (collectButton) {
       collectButton.addEventListener("click", () => {
         const collectResponse = collectContainer.collect();
         collectResponse
           .then((response) => {
             document.getElementById("collectResponse").innerHTML =
               JSON.stringify(response, null, 2);

             revealView.style.visibility = "visible";

             const revealStyleOptions = {
               inputStyles: {
                 base: {
                   border: "1px solid #eae8ee",
                   padding: "10px 16px",
                   borderRadius: "4px",
                   color: "#1d1d1d",
                   marginTop: "4px",
                 },
               },
               labelStyles: {
                 base: {
                   fontSize: "16px",
                   fontWeight: "bold",
                 },
               },
               errorTextStyles: {
                 base: {
                   color: "#f44336",
                 },
               },
             };

             // create Reveal Elements With Tokens
             const fieldsTokenData = response.records[0].fields;
             const revealContainer = skyflow.container(
               Skyflow.ContainerType.REVEAL
             );
             const revealCardNumberElement = revealContainer.create({
               token: fieldsTokenData.primary_card.card_number,
               label: "Card Number",
               ...revealStyleOptions,
             });
             revealCardNumberElement.mount("#revealCardNumber");

             const revealCardCvvElement = revealContainer.create({
               token: fieldsTokenData.primary_card.cvv,
               label: "CVV",
               ...revealStyleOptions,
               altText: "###",
             });
             revealCardCvvElement.mount("#revealCvv");

             const revealCardExpiryElement = revealContainer.create({
              token: fieldsTokenData.primary_card.expiry_date,
              label: "Card Expiry Date",
               ...revealStyleOptions,
             });
             revealCardExpiryElement.mount("#revealExpiryDate");

             const revealCardholderNameElement = revealContainer.create({
               token: fieldsTokenData.first_name,
               label: "Card Holder Name",
               ...revealStyleOptions,
             });
             revealCardholderNameElement.mount("#revealCardholderName");

             const revealButton = document.getElementById("revealPCIData");

             if (revealButton) {
               revealButton.addEventListener("click", () => {
                revealContainer.reveal().then((res)=>{
                  console.log(res);
                }).catch((err)=>{
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
}catch(err){
    console.log(err);
}