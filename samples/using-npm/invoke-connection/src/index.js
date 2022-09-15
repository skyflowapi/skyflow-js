/*
Copyright (c) 2022 Skyflow, Inc.
*/
import Skyflow from "skyflow-js";

try{
    const skyflow = Skyflow.init({
        vaultID: "<VAULT_ID>",
        vaultURL: "<VAULT_URL>",
        getBearerToken: () => {
          return new Promise((resolve, reject) => {
            const Http = new XMLHttpRequest();
  
            Http.onreadystatechange = () => {
              if (Http.readyState == 4) {
                if (Http.status == 200) {
                  const response = JSON.parse(Http.responseText);
                  resolve(response.accessToken);
                } else {
                  reject("Error occured");
                }
              }
            };
  
            Http.onerror = (error) => {
              reject("Error occured");
            };
  
            const url = "<TOKEN_END_POINT_URL>";
            Http.open("GET", url);
            Http.send();
          });
        },
      });
      const styles = {
      inputStyles: {
        base: {
          border: "1px solid #eae8ee",
          padding: "10px 16px",
          "border-radius": "4px",
        }
      }
    }
  
      //card issuance use-case
      const revealContainer = skyflow.container("REVEAL");
  
      const revealCvvElement = revealContainer.create({
        label: "CVV",
        altText: "###",
        ...styles
      });
      const revealCardElement = revealContainer.create({
        token: "0905-8672-0773-0628",
        label: "Card Number",
        ...styles
      });
  
      revealCvvElement.mount("#cvvRevealDiv");
      revealCardElement.mount("#cardNumberDiv");
  
      const revealButton = document.getElementById("genrateCvv");
      revealButton.addEventListener("click", () => {
        const sdkResponse = skyflow.invokeConnection({
          connectionURL:"<CONNECTION_INTEGRATION_URL>",
          methodName: Skyflow.RequestMethod.POST,
          requestHeader: {
            "Authorization": "",
          },
          pathParams: {
            card_number: revealCardElement
          },
          requestBody: {
            "expirationDate": {
              "mm": "01",
              "yy": "46"
            }
          },
          responseBody: {
            "resource": {
              cvv2: revealCvvElement
            }
          }
  
        });
        sdkResponse
          .then(
            (result) => {
              document.getElementById("connectionResponse").innerHTML =
                "<h4>Promise Resolved </h4><br>" + JSON.stringify(result, null, 2);
            },
            (result) => {
              document.getElementById("connectionResponse").innerHTML =
                "<h4>Promise Rejected </h4><br>" + JSON.stringify(result, null, 2);
            }
          )
          .catch((err) => {
            console.log(err);
          });
      });
  
      //Merchant acceptance use-case
      const collectContainer = skyflow.container("COLLECT");
  
      const collectCardNumberElement = collectContainer.create({
        label: "Card Number",
        type: Skyflow.ElementType.CARD_NUMBER,
        ...styles
      })
      collectCardNumberElement.mount("#payCardNumberDiv")
  
      const collectCVVElement = collectContainer.create({
        label: "CVV",
        type: Skyflow.ElementType.CVV,
        ...styles
      })
      collectCVVElement.mount("#payCvvDiv")
  
      const payApprovalCodeElement = revealContainer.create({
        label: "Approval Code",
        altText: "",
        ...styles
      })
      payApprovalCodeElement.mount("#payApprovalCodeDiv")
  
      const payButton = document.getElementById("payMerchant");
      payButton.addEventListener("click", () => {
        const sdkResponse = skyflow.invokeConnection({
          connectionURL:"<CONNECTION_INTEGRATION_URL>",
          methodName: Skyflow.RequestMethod.POST,
          requestHeader: {
            "Authorization": "",
            "Accept": "application/json"
          },
          requestBody:{
            "surcharge": "11.99",
            "amount": "124.02",
            "localTransactionDateTime": "2021-10-04T23:33:06",
            "cpsAuthorizationCharacteristicsIndicator": "Y",
            "riskAssessmentData": {
              "traExemptionIndicator": true,
              "trustedMerchantExemptionIndicator": true,
              "scpExemptionIndicator": true,
              "delegatedAuthenticationIndicator": true,
              "lowValueExemptionIndicator": true
            },
            "cardAcceptor": {
              "address": {
                "country": "USA",
                "zipCode": "94404",
                "county": "081",
                "state": "CA"
              },
              "idCode": "ABCD1234ABCD123",
              "name": "Visa Inc. USA-Foster City",
              "terminalId": "ABCD1234"
            },
            "acquirerCountryCode": "840",
            "acquiringBin": "408999",
            "senderCurrencyCode": "USD",
            "retrievalReferenceNumber": "330000550000",
            "addressVerificationData": {
              "street": "XYZ St",
              "postalCode": "12345"
            },
            "cavv": "0700100038238906000013405823891061668252",
            "systemsTraceAuditNumber": "451001",
            "businessApplicationId": "AA",
            "senderPrimaryAccountNumber": collectCardNumberElement,
            "cardCvv2Value": collectCVVElement,
            "settlementServiceIndicator": "9",
            "visaMerchantIdentifier": "73625198",
            "foreignExchangeFeeTransaction": "11.99",
            "senderCardExpiryDate": "2015-10",
            "nationalReimbursementFee": "11.22"
  
          },
          responseBody: {
            approvalCode: payApprovalCodeElement
          }
        });
        sdkResponse
          .then(
            (result) => {
              document.getElementById("merchantResponse").innerHTML =
                "<h4>Promise Resolved </h4><br>" + JSON.stringify(result, null, 2);
            },
            (result) => {
              document.getElementById("merchantResponse").innerHTML =
                "<h4>Promise Rejected </h4><br>" + JSON.stringify(result, null, 2);
            }
          )
          .catch((err) => {
            console.log(err);
          });
      });
}catch(err){
    console.log(err);
}