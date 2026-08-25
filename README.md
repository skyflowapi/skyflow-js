# skyflow-js

Skyflow's JavaScript SDKs let you securely collect, tokenize, and reveal sensitive data in the browser without exposing your front-end infrastructure to sensitive data.

[![CI](https://img.shields.io/static/v1?label=CI&message=passing&color=green?style=plastic&logo=github)](https://github.com/skyflowapi/skyflow-js/actions)
[![License](https://img.shields.io/github/license/skyflowapi/skyflow-js)](https://github.com/skyflowapi/skyflow-js/blob/main/LICENSE)

This repository publishes two SDKs from a shared codebase. Pick the one that matches your vault type:

| SDK | Vault type | Install (npm / script tag) | Import | Documentation |
|-----|------------|----------------------------|--------|---------------|
| **skyflow-js** | PDB vault (v1 API) | `npm i skyflow-js` / `<script src="https://js.skyflow.com/v2/index.js">` | `import Skyflow from 'skyflow-js'` | [packages/skyflow-js/README.md](packages/skyflow-js/README.md) |
| **skyflow-flowvault-js** | Flow vault (v2 API) | `npm i skyflow-flowvault-js` / `<script src="https://js.skyflow.com/flowvault/v1/index.js">` | `import Skyflow from 'skyflow-flowvault-js'` | [packages/skyflow-flowvault-js/README.md](packages/skyflow-flowvault-js/README.md) |

Not sure which one you need? If you are an existing Skyflow JS customer, stay on **skyflow-js** — it is fully backward compatible. **skyflow-flowvault-js** is for Flow vaults; v1.x is Elements-only (no pure-JS, file, or 3DS APIs support yet).

Both SDKs expose the same `Skyflow` global when loaded via script tag, so a single page must load only one of them. If you need both in one app, install both from npm and alias on import.

## Repository layout

- `packages/skyflow-js/` — skyflow-js SDK ([README.md](packages/skyflow-js/README.md))
- `packages/skyflow-flowvault-js/` — skyflow-flowvault-js SDK ([README.md](packages/skyflow-flowvault-js/README.md))
- `core/` — shared internal source compiled into both SDKs (not installable on its own)
- `<package>/samples/` — sample apps for each SDK
