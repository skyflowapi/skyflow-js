# JS SDK samples

Test the SDK by adding your `VAULT_ID`, `VAULT_URL`, and `SERVICE-ACCOUNT` details as the corresponding values in each sample.


## Prerequisites
-  A Skyflow account. If you don't have one, register for one on the [Try Skyflow](https://skyflow.com/try-skyflow) page.
- [Node.js](https://nodejs.org/en/) version 10 or above
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) version 6.x.x
- [express.js](http://expressjs.com/en/starter/hello-world.html)

## Get Started

### Create the vault
1. Sign in to Skyflow Studio.In a browser, navigate to Skyflow Studio.
2. Create a vault by clicking **Create Vault** > **Start With a Template** > **Quickstart vault**.
3. Under Quickstart, click Create.Once the vault is created, click the gear icon and select **Edit Vault Details**.

To run the following commands, you'll need to retrieve your vault-specific values, **<vault_url>** and **<vault_id>**. Find your vault values by clicking the vault menu icon > Edit vault details.Note your **Vault URL** and **Vault ID** values, then click Cancel. You'll need these later.


### Create a service account
1. In Studio, click **Settings** in the upper navigation.
2. In the side navigation, click **Vault**, then choose the **Quickstart** vault from the dropdown menu.
3. Under in the side navigation click, **IAM**, click **> Service Accounts > New Service Account**.
4. For **Name**, enter "SDK Sample". For **Roles**, choose **Vault Editor.**
5. Click **Create**. 

### Create a service account bearer token generation endpoint
1. Create a new directory named `bearer-token-generator`.

        mkdir bearer-token-generator
2. Navigate to `bearer-token-generator` directory.

        cd bearer-token-generator
3. Initialize npm

        npm init
4. Install `skyflow-node`

        npm i skyflow-node
5. Create an `index.js` file and open the file.
6. Populate `index.js` file with below code snippet.
```javascript
const express = require('express')
const app = express()
var cors = require('cors')
const port = 3000
const {
    generateBearerToken,
    isExpired
} = require('skyflow-node');

app.use(cors())

let filepath = 'cred.json';
let bearerToken = "";

function getSkyflowBearerToken() {
    return new Promise(async (resolve, reject) => {
        try {
            if (!isExpired(bearerToken)) resolve(bearerToken)
            else {
                let response = await generateBearerToken(filepath);
                bearerToken = response.accessToken;
                resolve(bearerToken);
            }
        } catch (e) {
            reject(e);
        }
    });
}

app.get('/', async (req, res) => {
  let bearerToken = await getSkyflowBearerToken();
  res.json({"accessToken" : bearerToken});
})

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
```
7.  Run the following command to start your local server.

        node index.js
    server will start at `localhost:3000`
8. Your **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
    * Include the Skyflow JavaScript SDK

## Using script tag

### Event listeners
This sample shows you how to use event listeners with Skyflow Elements.

#### Configure
1. Navigate to the using-script-tag and open the collect-element-listeners.html file.
2. Replace **<VAULT_ID>** and **VAULT URL** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`

#### Run the following command.
        npx live-server collect-element-listeners.html --port=8000

From your browser, navigate to `http://localhost:8000/` to view the page.

### Skyflow-Elements
This sample shows you how to collect and reveal data with Skyflow Elements.

#### Configure
1. Navigate to the using-script-tag and open the skyflow-elements.html file.
2. Replace **<VAULT_ID>** and **VAULT URL** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`

#### Run the following command.
        npx live-server skyflow-elements.html --port=8000
 
From your browser, navigate to `http://localhost:8000/` to view the page.

### custom-validations
This sample shows you how to create custom validation with Skyflow Elements. 

#### Configure
1. Navigate to the using-script-tag and open the custom-validations.html file.
2. Replace **<VAULT_ID>** and **VAULT URL** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`

#### Run the following command.
        npx live-server custom-validations.html --port=8000

From your browser, navigate to `http://localhost:8000/` to view the page.

### Record insertion
This sample shows you how to insert data.

#### Configure
1. Navigate to the using-script-tag and open the collect-element-listeners.html file.
2. Replace **<VAULT_ID>** and **VAULT URL** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`

#### Run the following command.
        npx live-server pure-js.html --port=8000

From your browser, navigate to `http://localhost:8000/` to view the page.

### File upload
This sample shows you how to upload files to your vault.

#### Configure
1. Navigate to the using-script-tag and open the skyflow-file-upload.html file.
2. Replace **<VAULT_ID>** and **VAULT URL** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the following command.
        npx live-server skyflow-file-upload.html --port=8000

From your browser, navigate to `http://localhost:8000/` to view the page.


## Using npm
### collect-element-listeners
This sample shows you how to use event listeners with Skyflow Elements.
#### Run the following command.

        cd using-npm/collect-element-listeners
        npm i
#### Configure
1. open [`index.js`](using-npm/collect-element-listeners/index.js)
2. Replace **<VAULT_ID>** and **VAULT URL** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
Run the following command.


        cd using-npm/collect-element-listeners/src
        npx live-server index.html --port=8000
From your browser, navigate to `http://localhost:8000/` to view the page.

### skyflow-elements
This sample shows you how to collect and reveal data with Skyflow Elements.
#### Run the following command.

        cd using-npm/custom-validations
        npm i
#### Configure
1. open [`index.js`](using-npm/collect-element-listeners/index.js)
2. Replace **<VAULT_ID>** and **VAULT URL** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the following command.

        cd using-npm/custom-validations/src
        npx live-server index.html --port=8000
From your browser, navigate to `http://localhost:8000/` to view the page.

### custom-validations
This sample shows you how to create custom validation when using Skyflow Elements. 

#### Run the following command.

        cd using-npm/pure-js
        npm i
#### Configure
1. open [`index.js`](using-npm/collect-element-listeners/index.js)
2. Replace **<VAULT_ID>** and **VAULT URL** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the following command.

            cd using-npm/pure-js/src
            npx live-server index.html --port=8000
From your browser, navigate to`http://localhost:8000/` to view the page.

### Record Insertion
This sample shows you how to insert data into your vault.

#### Run the following command.

            cd using-npm/pure-js
            npm i
#### Configure
1. open [`index.js`](using-npm/collect-element-listeners/index.js)
2. Replace **<VAULT_ID>** and **VAULT URL** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`

#### Run the following command.

            cd using-npm/skyflow-elements/src
            npx live-server index.html --port=8000
From your browser, navigate to `http://localhost:8000/` to view the page.
