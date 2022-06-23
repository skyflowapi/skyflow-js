/*
Copyright (c) 2022 Skyflow, Inc.
*/
import Skyflow from "skyflow-js";

try {
  const skyflowClient = Skyflow.init({
      vaultID: "<VAULT_ID>", //optional
      vaultURL: "<VAULT_URL>", //optional
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
  //create container
  const revealContainer = skyflowClient.container(Skyflow.ContainerType.REVEAL)
  const collectContainer = skyflowClient.container(Skyflow.ContainerType.COLLECT)


  //create skyflow elements
  const cardNumberElement = collectContainer.create({
      type: skyflow.ElementType.CARD_NUMBER,
      ...styles
  })
  cardNumberElement.mount("#cardNumber")

  const expiryDateElement = collectContainer.create({
      type: skyflow.ElementType.EXPIRATION_DATE,
      ...styles
  })
  expiryDateElement.mount("#expirationDate")

  const cvvElement = revealContainer.create({
      altText: "###",
      ...styles
  })
  cvvElement.mount("#cvv")

  //get elementID, wrap it in <Skyflow> tag, to send either in requestXML or responseXML
  const cardNumberID = cardNumberElement.getID()
  const expiryDateID = expiryDateElement.getID()
  const cvvElementID = cvvElement.getID()

  const httpHeaders = {
      'Content-Type': 'text/xml;charset=UTF-8',
      SOAPAction: '<soap_action>',
  };

  const requestXML = `<soapenv:Envelope>
                          <soapenv:Header>
                              <ClientID>1234</ClientID>
                          </soapenv:Header>
                          <soapenv:Body>
                              <GenerateCVV>
                                  <CardNumber>
                                      <Skyflow>${cardNumberID}</Skyflow>
                                  </CardNumber>
                                  <ExpiryDate>
                                      <Skyflow>${expiryDateID}</Skyflow>
                                  </ExpiryDate>
                              </GenerateCVV>
                          </soapenv:Body>
                      </soapenv:Envelope>`


  const responseXML = `<soapenv:Envelope>
                          <soapenv:Body>
                              <GenerateCVV>
                                  <CVV>
                                      <Skyflow>${cvvElementID}</Skyflow>
                                  </CVV>
                              </GenerateCVV>
                          </soapenv:Body>
                      </soapenv:Envelope>`

  const connectionConfig = {
      connectionURL: '<connection_url>',
      httpHeaders: httpHeaders,
      requestXML: requestXML,
      responseXML: responseXML,
  }
  const revealButton = document.getElementById("genrateCvv");
  revealButton.addEventListener("click", () => {
      const sdkResponse = skyflow.invokeSoapConnection(connectionConfig);
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
} catch (err) {
  console.log(err);
}