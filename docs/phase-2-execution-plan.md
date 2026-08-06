# Phase 2 — Detailed Code Execution Plan (packages + build flowvault)

Companion to [package-split-plan.md](package-split-plan.md); follows [phase-1-execution-plan.md](phase-1-execution-plan.md). Same model: each task is one PR into the integration branch, individually reviewable, leaving the build + tests green.

---

## Entry state (end of Phase 1)
```
repo/
  core/                 # variant-neutral shared source + @core barrel
  src/                  # skyflow-js (privacyDB), importing @core
  tests/                # skyflow-js tests
  tsconfig.base.json    # @core/* → core/*
  .eslintrc(.js)        # import/no-restricted-paths: core/ ⇏ src/
```

## Scope

Phase 2 does two things:
- **(A) Relocate** the existing tree into `packages/skyflow-js` and stand up npm **workspaces** (skyflow-js behavior-preserving).
- **(B) Build `skyflow-flowvault-js`** (v1.0.0, **elements-only**) from the `2.9.0-beta.1` flowDB deltas, reshaped to **extend `@core`** (base types, error base, leaf helpers) rather than redefine them.

### Non-goals (deferred)
- **No release-workflow changes** — parameterizing `common-release.yml`, S3/CloudFront, npm publish is **Phase 3**. Phase 2 ends when both packages build all artifacts locally.
- **flowvault stays elements-only** — no pure-JS `Skyflow.*`, no 3DS, no file upload (per §9 decisions). Keep the pure-JS transport neutral in `core/` but do not expose flowvault pure-JS.

### End state of Phase 2
```
repo/
  core/
  packages/
    skyflow-js/            # privacyDB (relocated) — name "skyflow-js"
      src/  tests/  package.json  tsconfig.json  webpack.*.js
    skyflow-flowvault-js/  # flowDB (new, v1.0.0) — extends @core
      src/  tests/  package.json  tsconfig.json  webpack.*.js
  package.json             # private workspace root ("workspaces": ["packages/*"])
  tsconfig.base.json
  .eslintrc(.js)           # core/ ⇏ packages/
```

**Invariants:** `skyflow-js`'s public surface + telemetry + tests stay **unchanged** throughout. `skyflow-flowvault-js` is anchored to the **ported `*.flowdb.test.js` suites** (its behavioral contract from `2.9.0-beta.1`).

---

## Working model
Same integration branch as Phase 1. One task = one PR, reviewed and merged before the next. `git mv` for all relocations (preserve history). flowvault code is **extracted from the `2.9.0-beta.1` tag** and reshaped onto `@core` — not copied verbatim.

### Verification recipe (end of every task)
1. `npm install` — workspaces link cleanly.
2. `npm run type-check` (per affected package) — no TS errors.
3. `npm test` (per affected package) — green, no new skips.
4. Build the affected package's artifacts (`build-browser-sdk` / `build-node-sdk` / `build-iframe`).
5. **skyflow-js surface guard:** emitted `types/*.d.ts` diff against the Phase-1-end snapshot = **zero** (relocation must not change the published surface).
6. **flowvault behavior anchor:** the ported `*.flowdb.test.js` suites pass.
7. **Boundary lint:** `import/no-restricted-paths` (`core/` ⇏ `packages/`) passes; and `packages/skyflow-flowvault-js` does **not** import `packages/skyflow-js` (add a zone for that too).
8. **Telemetry snapshot:** skyflow-js → `skyflow-js@<v>`; flowvault → `skyflow-flowvault-js@<v>`, label `JS`.

---

## Group A — Relocate skyflow-js + workspaces

### Task 2.0 — Workspaces + relocate `skyflow-js` → `packages/skyflow-js`
**Goal:** move the existing package under `packages/` and make the repo a workspace root, with **zero** behavior change.
- Convert the **root `package.json`** into a private workspace root: `"private": true`, `"workspaces": ["packages/*"]`; move the SDK manifest fields (`name` `skyflow-js`, `version`, `main`, `types`, `files`, `scripts`, `dependencies`) into **`packages/skyflow-js/package.json`**.
- `git mv src → packages/skyflow-js/src`, `git mv tests → packages/skyflow-js/tests`, and the SDK's `webpack.*.js` / `jest.config.json` / `tsconfig.json` into the package.
- Fix `@core` resolution for the new depth: keep `tsconfig.base.json` (`baseUrl` at repo root, `@core/* → core/*`); each package `tsconfig.json` `extends` it; update `webpack resolve.alias` → `../../core`; update `jest moduleNameMapper`.
- Root convenience scripts delegate to workspaces (`npm run build -w skyflow-js`, etc.).

**Reviewability:** large but purely mechanical (moves + path fixes); the surface guard is the safety net.
**Verify:** recipe 1–5; skyflow-js builds all three artifacts; **surface diff = zero**; tests green.

---

## Group B — Build `skyflow-flowvault-js` from `2.9.0-beta.1` as `@core` extensions

> Each task below **extracts the flowDB slice from the `2.9.0-beta.1` tag** and reshapes it to consume `@core`. flowvault has **no existing consumers**, so "correct" = matches the beta's flowDB behavior, proven by the ported `*.flowdb.test.js` suites.

### Task 2.1 — Scaffold `packages/skyflow-flowvault-js`
**Goal:** an empty-but-buildable package wired into the workspace.
- `package.json`: `name` `skyflow-flowvault-js`, `version` `1.0.0`, `main`/`types`/`files` mirroring skyflow-js's shape, `dependencies` (same runtime deps).
- `tsconfig.json` extends `tsconfig.base.json`; empty `src/index.ts` (sets `window.SkyflowFlowVault`) + `src/index-node.ts` (empty barrel) + `src/index-internal.ts` (iframe entry stub).
- Register in the boundary lint (flowvault ⇏ skyflow-js).

**Verify:** `npm install` links it; `type-check` green (no-op package).

### Task 2.2 — flowDB types extending `@core` bases
**Goal:** the flowDB type surface as **extensions** of the core base interfaces (not redefinitions).
- Port from the beta: the flowDB internal types (`FlowDBInsert*`, `FlowDBUpdate*`, `FlowDBDetokenize*`, `FlowDBRecordResponse`, `FlowDBError`/`FlowDBFullError`, `CollectRecord/Response`, `RevealRecord/Response`, `FlowDBTokenGroupRedaction`) and the public input types (`IFlowDBUpsertOptions`, `IFlowDBRevealElementInput`, `IRevealElementOptions`, `IRevealOptions`, `TokenGroupRedaction`).
- Reshape so element-input/response/upsert types **`extends`** the `@core` base interfaces from Phase 1 Task 1.4.

**Verify:** `type-check` green; the flowDB response/input shapes match the beta's public contract.

### Task 2.3 — `skyflow-flowdb-error` extending the `@core` error base
**Goal:** flowvault's error class on top of the neutral base.
- Port `libs/skyflow-flowdb-error.ts` (`SkyflowFlowDBError`, `normalizeFlowDBError`); make `SkyflowFlowDBError` **extend** the `@core` `SkyflowError` base. It remains flowvault's public `SkyflowError` export.

**Verify:** `type-check`; a small unit test for `normalizeFlowDBError` (snake→camel) passes.

### Task 2.4 — flowDB **collect** data layer (`/v2`)
**Goal:** flowvault's collect transport, using `@core` assembly helpers.
- Port from beta `core-utils/collect.ts` (flowDB slice): `getFlowDBUpsertForTable`, `constructFlowDBInsertRequest`, `constructFlowDBInsertResponse`, `constructFlowDBInsertError`, `constructFlowDBUpdateRequest`, `flowDBInsertVariant`/`flowDBUpdateVariant`, `executeInsert`, `insertDataInCollectFlowDB`, `updateDataInCollectFlowDB`, and **`replaceCVVTokensInResponse` (cvvMap masking — flowvault-only)**.
- Consume `@core` neutral helpers (`constructElementsInsertReq`, validators) rather than redefining them.

**Verify:** port `tests/core-utils/collect.flowdb.test.js` → green.

### Task 2.5 — flowDB **reveal/detokenize** data layer (`/v2`)
**Goal:** flowvault's reveal transport.
- Port from beta `core-utils/reveal.ts` (flowDB slice): `constructFlowDBDetokenizeRequest/Response/Error`, `flowDBDetokenizeVariant`, `executeDetokenize`, `fetchRecordsByTokenIdFlowDB`, `fetchRecordsByTokenIdComposableFlowDB`, `normalizeFlowDBMetadata`, `formatRecordsForClientFlowDB`, `formatRecordsForClientComposableFlowDB`.
- Consume `@core` neutral formatters where they exist.

**Verify:** port `tests/core-utils/reveal.flowdb.test.js` → green.

### Task 2.6 — flowvault **collect** path (containers, elements, frame controller)
**Goal:** wire the collect element flow end-to-end for flowDB.
- Bring in the collect container + element + `frame-element-init` + the frame-controller `tokenize()`, adapting skyflow-js's core-based scaffolding: swap in `SkyflowFlowDBError`, the flowDB input/response types, and calls to the flowvault collect data layer (Task 2.4). The `tokenize()` calls `@core` leaf helpers (validate/assemble) then flowvault's request-build + response-parse (§3.4).

**Verify:** port `frame-element-init.flowdb.test.js` + the frame-controller collect/tokenize flowDB tests → green.

### Task 2.7 — flowvault **reveal** path (containers, elements, composable)
**Goal:** wire the reveal element flow end-to-end for flowDB.
- Bring in reveal container + element + composable-reveal + `composable-frame-element-init` + the frame `revealData()`, wired to `@core` leaf helpers + the flowvault reveal data layer (Task 2.5) + `SkyflowFlowDBError`. Use `IFlowDBRevealElementInput` (token-only) as the public reveal input.

**Verify:** port `composable-frame-element-init.flowdb.test.js` + `skyflow-frame-controller.detokenize.flowdb.test.js` → green.

### Task 2.8 — flowvault `Skyflow` class + iframe entry + public barrels
**Goal:** the package's public shell.
- flowvault `Skyflow` class + `container()` factory (elements-only: COLLECT / COMPOSABLE / REVEAL / COMPOSE_REVEAL; **no** pure-JS methods).
- `index-internal.ts` composes the `@core` iframe skeleton + flowvault's frame controllers (its own iframe build).
- `index.ts` sets `window.SkyflowFlowVault`; `index-node.ts` exports the flowDB public surface with the agreed names (`UpsertOptions`=`IFlowDBUpsertOptions`, `RevealElementInput`=`IFlowDBRevealElementInput`, `CollectResponse/Record`, `RevealResponse/Record`, `RevealOptions`, `SkyflowError`=`SkyflowFlowDBError`, plus the shared enums/classes re-exported from `@core`).

**Verify:** `type-check`; all agreed flowDB public names are exported with the right shapes.

### Task 2.9 — flowvault webpack configs + telemetry + iframe URL
**Goal:** produce flowvault's three artifacts with correct identity.
- Per-package `webpack.skyflow-browser.js` / `webpack.skyflow-node.js` / `webpack.iframe.js`, each `merge`-ing the shared `webpack.common.js`; **UMD `library` + IIFE global = `SkyflowFlowVault`**; own `output.path`.
- Telemetry: `DefinePlugin` injects `SDK_NAME=skyflow-flowvault-js` + `SDK_VERSION` from flowvault's `package.json`; **broaden the `@core` language-label check to treat `skyflow-flowvault-js` as `JS`** (leaving the `metaData` wrapper-override → `React` intact).
- flowvault `properties.ts` default iframe URL (`process.env`-based, per §3.2).

**Verify:** all three flowvault artifacts build; telemetry snapshot = `skyflow-flowvault-js@<v>`, label `JS`; skyflow-js telemetry still `skyflow-js@<v>` (label unchanged).

### Task 2.10 — flowvault tests, coverage, samples
**Goal:** lock behavior and give consumers examples.
- Land the ported `*.flowdb.test.js` suites under `packages/skyflow-flowvault-js/tests`; add `coverageThreshold` = floor (Phase-1 baseline convention).
- Port the beta's flowDB samples into flowvault samples (script-tag using the `SkyflowFlowVault` global; the `using-typescript` flow against `skyflow-flowvault-js`).
- flowvault `README` stub.

**Verify:** flowvault coverage ≥ floor; sample type-checks/loads.

### Task 2.11 — Workspace finalize
**Goal:** both packages build green together; lock the boundary.
- Root scripts: `build`/`test`/`type-check` across `--workspaces`.
- Flip any remaining boundary lint to **error** (core ⇏ packages; flowvault ⇏ skyflow-js).
- Full build of **all six artifacts** (browser/node/iframe × 2 packages); capture flowvault bundle size; confirm skyflow-js size still within the Phase-1 baseline tolerance.

**Verify:** full recipe green for both packages; skyflow-js surface diff = zero; both telemetry snapshots correct.

---

## Dependency ordering
```
2.0 (relocate + workspaces)
 └─ 2.1 (scaffold flowvault)
     └─ 2.2 (flowDB types)
         └─ 2.3 (flowDB error base)
             ├─ 2.4 (collect data /v2) ── 2.6 (collect path)
             └─ 2.5 (reveal data /v2) ─── 2.7 (reveal path)
                                            └─ 2.8 (Skyflow class + entries + barrels)
                                                └─ 2.9 (webpack + telemetry + iframe URL)
                                                    └─ 2.10 (tests + coverage + samples)
                                                        └─ 2.11 (workspace finalize)
```
2.4/2.5 parallel after 2.3; 2.6/2.7 parallel after their data layers.

## Risks & watch-items
- **skyflow-js relocation (2.0):** the risk is `@core`/build-path breakage, not logic. The zero-surface-diff + green build is the gate; keep it one atomic PR so there's no half-moved broken state.
- **Reshape drift (2.2):** the beta redefined types; here they must **extend** `@core` bases while keeping the beta's *public* flowDB shapes. Diff the flowvault `.d.ts` against the beta's documented flowDB contract.
- **cvvMap stays in flowvault (2.4):** it is flowDB-only — never let it leak back into `core/`.
- **Accepted duplication:** flowvault's containers/elements/`Skyflow` class largely mirror skyflow-js's (they differ only by error class, input/response types, and data-layer calls). This is the deliberate loose-coupling trade-off (§3.4) — don't "fix" it by hoisting a template-method controller base into core.
- **Elements-only guard:** ensure no pure-JS `Skyflow.*`, 3DS, or file-upload path is exposed on flowvault (they exist in the beta as internal `#`/commented code — leave them out).
- **Two iframe entries in sync (2.8):** `index-internal.ts` in both packages must stay structurally parallel over the shared `@core` skeleton; keep the entries thin.
