import Skyflow from "skyflow-js";

try {
    const skyflowClient = Skyflow.init({
        vaultID: "<VAULT_ID>", // required, since revealElement has formatRegex set
        vaultURL: "<VAULT_URL>", // required, since revealElement has formatRegex set
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

    const expiryMonthElement = revealContainer.create({
        token: '<expirymonth_token>',
        ...styles
    })
    expiryMonthElement.mount("#expirationMonth")

    const expiryYearElement = revealContainer.create({
        token: '<expiryyear_token>',
        ...styles
    }, {
        formatRegex: /..$/  // Since it is in requestXML, after revealing the value, 
                            // last 2 characters are sent in invokeSoapConnection
    })
    expiryYearElement.mount("#expirationYear")

    const cvvElement = revealContainer.create({
        altText: "###",
        ...styles
    })
    cvvElement.mount("#cvv")

    const nameElement = revealContainer.create({
        altText: "###",
        ...styles
    }, {
        formatRegex: /^([\S]+)/  // Since it is in responseXML, after getting response from invokeSoapConnection,
                                 // first word till space is extracted according to the formatRegex and rendered on UI
    })
    nameElement.mount("#name")

    //get elementID, wrap elementID in <Skyflow> tag, to send either in requestXML or responseXML
    const cardNumberID = cardNumberElement.getID()
    const expiryMonthID = expiryMonthElement.getID()
    const expiryYearID = expiryYearElement.getID()
    const cvvElementID = cvvElement.getID()
    const nameID = nameElement.getID()

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
                                    <ExpiryMonth>
                                        <Skyflow>${expiryMonthID}</Skyflow>
                                    </ExpiryMonth>
                                    <ExpiryYear>
                                        <Skyflow>${expiryYearID}</Skyflow>
                                    </ExpiryYear>
                                </GenerateCVV>
                            </soapenv:Body>
                        </soapenv:Envelope>`


    const responseXML = `<soapenv:Envelope>
                            <soapenv:Body>
                                <GenerateCVV>
                                    <CVV>
                                        <Skyflow>${cvvElementID}</Skyflow>
                                    </CVV>
                                    <Name>
                                        <Skyflow>${nameID}</Skyflow>
                                    <Name>
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