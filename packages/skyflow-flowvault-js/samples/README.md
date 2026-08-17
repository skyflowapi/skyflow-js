# skyflow-flowvault-js samples

Runnable samples for [`skyflow-flowvault-js`](../README.md), Skyflow's **Flow vault** JavaScript SDK.

Test the SDK by adding your `VAULT_ID`, `VAULT_URL`, and `SERVICE-ACCOUNT` details as the corresponding values in each sample.

> **Note:** `skyflow-flowvault-js` v1.x is **Elements-only**. There are no pure-JS (`insert`/`get`/`delete`), file-upload, file-render, or 3DS samples here — those live in the [`skyflow-js` samples](../../skyflow-js/samples/README.md).

## Prerequisites
-  A Skyflow account. If you don't have one, register for one on the [Try Skyflow](https://skyflow.com/try-skyflow) page.
- A **Flow vault**. `skyflow-flowvault-js` does not work against a PDB vault — use [`skyflow-js`](../../skyflow-js/README.md) for those.
- [Node.js](https://nodejs.org/en/) version 10 or above
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) version 6.x.x
- [express.js](http://expressjs.com/en/starter/hello-world.html)

## Get Started

### Create the vault
1. Sign in to Skyflow Studio. In a browser, navigate to Skyflow Studio.
2. Create a Flow vault.
3. Once the vault is created, click the gear icon and select **Edit Vault Details**.

To run the following commands, you'll need to retrieve your vault-specific values, **<vault_url>** and **<vault_id>**. Find your vault values by clicking the vault menu icon > Edit vault details. Note your **Vault URL** and **Vault ID** values, then click Cancel. You'll need these later.

### Create a service account
1. In Studio, click **Settings** in the upper navigation.
2. In the side navigation, click **Vault**, then choose your vault from the dropdown menu.
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

---

## Sample catalog

Every sample exists in up to three flavors. Pick the one that matches how you consume the SDK:

| Flavor | Directory | How the SDK is loaded |
|---|---|---|
| Script tag | [`using-script-tag/`](using-script-tag) | `<script src="https://js.skyflow.com/flowvault/v1/index.js">`, SDK on the `Skyflow` global |
| npm (JavaScript) | [`using-npm/`](using-npm) | `import Skyflow from 'skyflow-flowvault-js'` |
| npm (TypeScript) | [`using-typescript/`](using-typescript) | `import Skyflow, { ... } from 'skyflow-flowvault-js'` |

| Sample | What it shows | Script tag | npm | TypeScript |
|---|---|---|---|---|
| skyflow-elements | Collect and reveal data with Skyflow Elements | [html](using-script-tag/skyflow-elements.html) | [js](using-npm/skyflow-elements) | [ts](using-typescript/skyflow-elements) |
| collect-elements | Collect data with Collect Elements | [html](using-script-tag/collect-elements.html) | — | — |
| skyflow-elements-update | Update existing records through Elements | [html](using-script-tag/skyflow-elements-update.html) | [js](using-npm/skyflow-elements-update) | [ts](using-typescript/skyflow-elements-update) |
| skyflow-elements-update-records | Update records via the update-records flow | [html](using-script-tag/skyflow-elements-update-records.html) | [js](using-npm/skyflow-elements-update-records) | [ts](using-typescript/skyflow-elements-update-records) |
| collect-element-listeners | Event listeners on Collect Elements | [html](using-script-tag/collect-element-listeners.html) | [js](using-npm/collect-element-listeners) | [ts](using-typescript/collect-element-listeners) |
| custom-validations | Custom validation rules on Elements | [html](using-script-tag/custom-validations.html) | [js](using-npm/custom-validations) | [ts](using-typescript/custom-validations) |
| composable-elements | Collect data with Composable Elements | [html](using-script-tag/composable-elements.html) | [js](using-npm/composable-elements) | [ts](using-typescript/composable-elements) |
| composable-elements-update | Update Composable Elements | [html](using-script-tag/composable-elements-update.html) | [js](using-npm/composable-elements-update) | [ts](using-typescript/composable-elements-update) |
| composable-reveal | Reveal data with Composable Reveal Elements | [html](using-script-tag/composable-reveal.html) | — | [ts](using-typescript/Reveal-composable) |
| input formatting | `format`/`translation` on Collect and Reveal Elements | [collect](using-script-tag/collect-elements-input-formatting.html), [reveal](using-script-tag/reveal-elements-input-formatting.html) | [js](using-npm/skyflow-elements-input-formatting) | [ts](using-typescript/skyflow-elements-input-formatting) |
| masking | Masked input on Collect Elements | [html](using-script-tag/masking.html) | — | — |
| card-brand-choice | Card brand choice (co-badged cards) | [html](using-script-tag/card-brand-choice.html) | — | — |
| upsert-support | Upsert on insert (`tableName`/`uniqueColumns`/`updateType`) | [html](using-script-tag/upsert-support.html) | — | — |
| bearer-token-with-context | `getBearerTokenWithContext` token provider | [html](using-script-tag/bearer-token-with-context.html) | — | — |

---

## Running a script-tag sample

1. Open the `.html` file under [`using-script-tag/`](using-script-tag).
2. Replace **<VAULT_ID>** and **<VAULT_URL>** with your vault-specific values.
3. Replace **<TOKEN_END_POINT_URL>** with `http://localhost:3000/`.
4. Serve the file:

        cd using-script-tag
        npx live-server skyflow-elements.html --port=8000

From your browser, navigate to `http://localhost:8000/` to view the page.

> **Note:** These HTML files must be served via a web server for the script-tag-based Skyflow sample to work correctly. Opening the file directly in a browser (using the `file://` protocol) may prevent the SDK from loading as expected. You can use a simple local server like `live-server` to run the file.

## Running an npm or TypeScript sample

1. Install dependencies in the sample directory:

        cd using-npm/skyflow-elements
        npm i

2. Open `src/index.js` (or `src/index.ts` under `using-typescript/`) and replace **<VAULT_ID>**, **<VAULT_URL>**, and **<TOKEN_END_POINT_URL>** with your values.
3. Start the sample:

        npm start

From your browser, navigate to the URL printed by parcel to view the page.
