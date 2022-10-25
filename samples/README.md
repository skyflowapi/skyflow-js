# Js SDK samples
Test the SDK by adding `VAULT-ID`, `VAULT-URL`, and `SERVICE-ACCOUNT` details in the required places for each sample.


## Prerequisites
- [Node.js](https://nodejs.org/en/) version 10 or above
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) version 6.x.x
- [express.js](http://expressjs.com/en/starter/hello-world.html)
## Prepare
- `TOKEN_END_POINT_URL` for generating bearer token.

### Create the vault
1. In a browser, navigate to Skyflow Studio and log in.
2. Create a vault by clicking **Create Vault** > **Start With a Template** > **PIIData**.
3. Once the vault is created, click the gear icon and select **Edit Vault Details**.
4. Note your **Vault URL** and **Vault ID** values, then click **Cancel**. You'll need these later.

### Create a service account
1. In the side navigation click, **IAM** > **Service Accounts** > **New Service Account**.
2. For **Name**, enter "SDK Sample". For Roles, choose **Vault Editor**.
3. Click **Create**. Your browser downloads a **credentials.json** file. Keep this file secure, as You'll need it for each of the samples.

### Create TOKEN_END_POINT_URL
- Create a new directory named `bearer-token-generator`.

        mkdir bearer-token-generator
- Navigate to `bearer-token-generator` directory.

        cd bearer-token-generator
- Initialize npm

        npm init
- Install `skyflow-node`

        npm i skyflow-node
- Create `index.js` file
- Open `index.js` file
- populate `index.js` file with below code snippet
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
- Start the server

        node index.js
    server will start at `localhost:3000`
- Your **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`

# skyflow-js sdk can be included in 2 ways:
- Using script tag
- Using npm

## Using script tag

### collect-element-listeners
This sample template shows event listeners on skyflow elements.
#### Configure
1. Replace **<VAULT_ID>** with your **VAULT ID**.
2. Replace **<VAULT_URL>** with your **VAULT URL**.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the sample

        npx live-server collect-element-listeners.html --port=8000

Open url `http://localhost:8000/` in the browser.

### skyflow-elements
This sample template shows how collect and reveal feature of skyflow elements works using skyflow-js.
#### Configure
1. Replace **<VAULT_ID>** with your **VAULT ID**.
2. Replace **<VAULT_URL>** with your **VAULT URL**.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the sample

        npx live-server skyflow-elements.html --port=8000
 
Open url `http://localhost:8000/` in the browser.

### custom-validations
This sample template shows custom validation feature provided by skyflow-js.
#### Configure
1. Replace **<VAULT_ID>** with your **VAULT ID**.
2. Replace **<VAULT_URL>** with your **VAULT URL**.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the sample

        npx live-server custom-validations.html --port=8000
Open url `http://localhost:8000/` in the browser.

### pure-js
This sample template shows feature of insert and the response after insertion of the data.
#### Configure
1. Replace **<VAULT_ID>** with your **VAULT ID**.
2. Replace **<VAULT_URL>** with your **VAULT URL**.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the sample

        npx live-server pure-js.html --port=8000
Open url `http://localhost:8000/` in the browser.

### skyflow-file-upload.html
This sample template shows file-upload feature of skyflow-js.
#### Configure
1. Replace **<VAULT_ID>** with your **VAULT ID**.
2. Replace **<VAULT_URL>** with your **VAULT URL**.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the sample

        npx live-server skyflow-file-upload.html --port=8000
Open url `http://localhost:8000/` in the browser.


## Using npm
### collect-element-listeners
This sample template shows event listeners on skyflow elements.
#### Setup

        cd using-npm/collect-element-listeners
        npm i
#### Configure
1. open [`index.js`](using-npm/collect-element-listeners/index.js)
2. Replace **<VAULT_ID>** with your **VAULT ID**.
3. Replace **<VAULT_URL>** with your **VAULT URL**.
4. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the sample

        cd using-npm/collect-element-listeners/src
        npx live-server index.html --port=8000
Open url `http://localhost:8000/` in the browser.

### custom-validations
This sample template shows custom validation feature provided by skyflow-js.
#### Setup

        cd using-npm/custom-validations
        npm i
#### Configure
1. open [`index.js`](using-npm/collect-element-listeners/index.js)
2. Replace **<VAULT_ID>** with your **VAULT ID**.
3. Replace **<VAULT_URL>** with your **VAULT URL**.
4. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the sample

        cd using-npm/custom-validations/src
        npx live-server index.html --port=8000
Open url `http://localhost:8000/` in the browser.

### pure-js
This sample template shows feature of insert and the response after insertion of the data.
#### Setup

        cd using-npm/pure-js
        npm i
#### Configure
1. open [`index.js`](using-npm/collect-element-listeners/index.js)
2. Replace **<VAULT_ID>** with your **VAULT ID**.
3. Replace **<VAULT_URL>** with your **VAULT URL**.
4. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the sample

            cd using-npm/pure-js/src
            npx live-server index.html --port=8000
Open url `http://localhost:8000/` in the browser.

### skyflow-elements
This sample template shows how collect and reveal feature of skyflow elements works using skyflow-js.
#### Setup

            cd using-npm/pure-js
            npm i
#### Configure
1. open [`index.js`](using-npm/collect-element-listeners/index.js)
2. Replace **<VAULT_ID>** with your **VAULT ID**.
3. Replace **<VAULT_URL>** with your **VAULT URL**.
4. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`
#### Run the sample

            cd using-npm/skyflow-elements/src
            npx live-server index.html --port=8000
Open url `http://localhost:8000/` in the browser.