# Splitting `skyflow-js` into privacyDB + flowDB Packages — Architecture & Migration Plan

**Status:** Proposed
**Scope:** Split the single `skyflow-js` codebase into two independently publishable npm packages that share one common core, with flowDB built by *extending* common interfaces.
**Sources:** privacyDB baseline restored from `main`; flowDB deltas taken from the `2.9.0-beta.1` tag.

---

## 1. Goal

Produce two independently versioned, independently published npm packages that share a single common code + interface layer:

| Unit | Surface | Sourced from | First version |
|---|---|---|---|
| `skyflow-js` (package) | **privacyDB** (existing public API) | `main` | continues current semver |
| `skyflow-flowvault-js` (package) | **flowDB** (Flow Vault `/v2` API) | `2.9.0-beta.1` tag deltas | `1.0.0` |
| `core/` (shared **folder**, not a package) | shared code + interfaces | common ancestor of both | n/a — compiled into each package |

The organizing principle: **create common code & interfaces both SDKs use, and implement flowDB by extending those common things** — not by branching inside shared code. There is no runtime `isFlowDB` toggle in the target design; the variant is fixed per package at build time.

The shared code lives in a plain `core/` **folder** (not an npm package): both SDK packages import it via a `@core` path alias, it is compiled into each package's bundle at build time, and a boundary lint rule keeps it variant-neutral (see §3.1). Only the two SDKs are packages, because only they are published.

This reframes the split as a **three-way factoring of a common ancestor**:

- `core/` ≈ infra present nearly identically in both `main` and the `2.9.0-beta.1` flowDB tag.
- `skyflow-js` ≈ `main` minus core.
- `skyflow-flowvault-js` ≈ the `2.9.0-beta.1` flowDB additions minus core, expressed as core extensions.

---

## 2. Key findings that shape the plan

1. **The npm tarball is small; the expensive shared runtime is already externalized.** `package.json` ships only `dist/sdkNodeBuild` (UMD node bundle) + `types/`. The browser bundle (`dist/v1`) and the **entire Elements iframe runtime** (`dist/v1/elements`, built from `src/index-internal.ts`) deploy to S3/CloudFront and load at runtime via `IFRAME_SECURE_SITE` / `customElementsURL`. The largest shared asset never enters the package boundary.

2. **The data layer already uses a variant-adapter pattern.** `core-utils/collect.ts` and `reveal.ts` are structured around `IInsertVariant` / `IDetokenizeVariant` strategy objects (`flowDBInsertVariant`, `flowDBDetokenizeVariant`) fed into a shared `executeInsert(variant, …)` / `executeDetokenize(variant, …)`. flowDB's adapter is built; privacyDB's is restored from `main`.

3. **There is no runtime variant flag anywhere.** Selection today is authoring-time: in `core-utils`, by which wrapper the caller imports (`insertDataInCollect` vs `insertDataInCollectFlowDB`); everywhere else the code unconditionally calls the flowDB wrapper. Per-package builds make this compile-time-fixed, which is cleaner.

4. **The flowDB source is not a clean privacyDB baseline.** In `2.9.0-beta.1` the privacyDB *element* paths were replaced by flowDB, legacy privacyDB type exports are commented out, and many privacyDB tests are `skip`ped. Because `skyflow-js` is sourced from `main`, this is handled by construction rather than manual restoration.

5. **`webpack.common.js` is package-agnostic.** No package name, output dir, or iframe URL is hardcoded in it; only `entry`, `output.path`, and the UMD `library` name differ per artifact. `webpack.dev.js` already runs multiple entry points through one config.

---

## 3. Target architecture

```
repo/
  core/                     # SHARED SOURCE — plain folder, NOT a package. Imported via @core alias,
                            # compiled into each package's bundle at build time.
    - iframe skeleton + variant-neutral frame leaf-helpers
    - event bus (event-emitter), framebus wrapper (libs/bus), bus-events
    - iframer, JSS (jss-styles), metrics
    - pure validators (card / Luhn / regex / format), validateElements, getUnformattedValue
    - logs + error-codes (utils/constants), logs-helper, jwt-utils
    - constants (event protocol, styles, card infra, element metadata, ElementType/CardType)
    - neutral common types + BASE element-input / response-envelope interfaces
    - skyflow-error BASE class
    - uuid / regex / deep-clone
    - index.ts barrel — the surface both SDKs consume

  packages/
    skyflow-js/             # privacyDB (from main).  name: "skyflow-js"
      - index.ts / index-node.ts     (PDB public surface, incl. /v1 response types)
      - index-internal.ts            → builds PDB iframe → hosted at PDB URL
      - /v1 data layer (privacyDB collect/reveal/get/getById/delete builders)
      - PDB element input/response types extending @core bases
      - PDB upsert options { table, column }
      - PDB frame controller — owns its own tokenize/revealData, calls @core leaf helpers

    skyflow-flowvault-js/   # flowDB (from 2.9.0-beta.1 tag).  name: "skyflow-flowvault-js", v1.0.0
      - index.ts / index-node.ts     (flowDB public surface)
      - index-internal.ts            → builds flowvault iframe → hosted at flowvault URL
      - /v2 data layer (flowDB insert/update/detokenize builders + parsers)
      - flowDB element input/response types extending @core bases
      - flowDB upsert options { tableName, uniqueColumns, updateType }
      - skyflow-flowdb-error (extends @core error base)
      - flowDB frame controller — owns its own tokenize/revealData (incl. cvvMap), calls @core leaf helpers

  tsconfig.base.json        # @core/* → core/*  (single source of truth for the alias)
  .eslintrc.js              # boundary rule: core/ may not import from packages/*
```

Each SDK package builds all three artifacts (browser, node, **its own** iframe) from `@core + its variant`. `core/` is a shared source folder, not a package: it is compiled into each package's bundle at build time (nothing is published or installed separately, so consumers still install one self-contained package with no peer dependency).

### 3.1 Packaging strategy: monorepo with workspaces

Chosen over the alternatives:

| Option | Bundle-size risk for existing skyflow-js | Sync burden | Verdict |
|---|---|---|---|
| **Monorepo + workspaces (chosen)** | None — each SDK bundles only its variant + core | Low — one source of truth, atomic cross-cutting PRs | ✅ |
| Single build, 2 entry points, tree-shake | High/uncertain — interleaved `core-utils` can't tree-shake apart; UMD/IIFE tree-shakes poorly | Low | ✗ doesn't deliver two publishable packages |
| Two repos + shared scoped package | None | High — shared code drifts, cross-repo PRs | ✗ sync cost during fast-moving flowDB beta |

**Versioning:** independent semver per SDK (`skyflow-js` continues its line; `skyflow-flowvault-js` starts at `1.0.0`). The `core/` folder has no version of its own — it is source compiled into each package. Same npm dist-tag scheme across both SDKs.

**Shared core is a folder, not a package.** Only the two publishable SDKs are packages (each needs its own `package.json` `name`/`version`). The shared code is a plain `core/` folder consumed by both via a `@core` path alias, with two guardrails:

- **Path alias (ergonomics)** — one source of truth in `tsconfig.base.json` `paths` (`@core/* → core/*`), mirrored to `webpack` `resolve.alias` and `jest` `moduleNameMapper`. Keeps imports clean (`@core/validators`, not `../../../core/...`) and relocation-safe. Because `core/` is not under `node_modules`, `babel-loader`'s `exclude: /node_modules/` does not skip it — it compiles normally, so **no build-ordering step and no separate core build.**
- **Boundary rule (enforcement)** — `import/no-restricted-paths` (`eslint-plugin-import`) forbids `core/**` from importing `packages/**`, so core stays variant-neutral. This is the actual enforcement; the alias does not enforce. (A folder relies on this lint rule where a package would add only a partial resolution-level barrier — which would still need the same rule for relative reach-arounds — so the folder loses no practical enforcement.)

The two SDKs still live under npm **workspaces** purely for dev ergonomics (one `npm install`, shared devDeps, unified lint/test) — the shared *code* is just not one of the workspace packages.

### 3.2 Iframe strategy: separate builds, single codebase

**Separate iframe *artifacts*, single iframe *codebase*.** Each package builds its own iframe from the shared core skeleton + its own variant data layer, and hosts it at its own URL.

Rationale:

- The variant becomes **compile-time fixed** per iframe — no runtime adapter/branch inside the iframe. This *deletes* the hardest refactor item (injecting a data adapter into a shared controller).
- A flowDB data-layer change **cannot** break the privacyDB iframe — they are different artifacts.
- Each iframe bundle is smaller (one variant's builders).
- **Version-skew isolation:** each package owns both its client SDK and its hosted iframe, versioned together. A shared iframe would instead have to stay compatible with two independently-versioned SDKs at once — a worse compatibility surface.

**How the iframe URL reaches the client (existing mechanism, replicated per package).** `properties.ts` reads `process.env.IFRAME_SECURE_ORIGIN`/`IFRAME_SECURE_SITE`; [webpack.common.js](../webpack.common.js) `DefinePlugin` inlines them at build time; the release workflow supplies them as `IFRAME_SECURE_SITE: "v${RELEASE_VERSION}/${secret}"` + `IFRAME_SECURE_ORIGIN: ${secret}`. So each build bakes an absolute URL `${ORIGIN}/v${version}/${SITE}` into the bundle; `getIframeSrc()` returns it, and `customElementsURL` can still override at runtime. To produce the two builds, each package's release workflow supplies its own origin/site secrets + version:

| Package | `IFRAME_SECURE_ORIGIN` | `IFRAME_SECURE_SITE` | Baked URL (example) |
|---|---|---|---|
| `skyflow-js` | `https://js.skyflow.dev` | `elements/index.html` | `js.skyflow.dev/v2.7.9/elements/index.html` |
| `skyflow-flowvault-js` | `https://js-flowvault.skyflow.dev` | `elements/index.html` | `js-flowvault.skyflow.dev/v1.0.0/elements/index.html` |

Same S3 bucket / different sub-root folder is fine — the bundle only cares about the final absolute URL. The two distinct **origins** are also what framebus uses for `postMessage` targeting (`.target(IFRAME_SECURE_ORIGIN)`), so separate hosts strengthen cross-package isolation. **Guardrail:** keep the committed `process.env`-based `properties.ts`; the working-tree localhost hardcode is local-dev only and must never be committed or it breaks prod iframe loading. Infra to-do (not SDK): map the `js-flowvault.skyflow.dev` host (CloudFront/CNAME) to its S3 sub-folder.

Costs (accepted, low):

- Two S3 uploads + two CloudFront distributions/invalidations — CI config, not code.
- Shared core code is duplicated inside both hosted iframe bundles — CDN assets, not user installs; a cache/bandwidth non-issue.
- The two `index-internal.ts` entries must stay structurally parallel — mitigated by core owning the skeleton so the entries are thin.

**Non-negotiable:** "separate builds" must not become "fork the iframe code." ~90% of the iframe runtime (DOM building, element rendering, JSS, framebus protocol, frame lifecycle/height/ready handshake) is variant-neutral and lives once in `core/`. Core exposes that skeleton plus variant-neutral leaf helpers; each package composes them into its own frame controller (see §3.4 — helpers, not a callback base).

### 3.3 Element inputs & responses: separate types, common rendering

Three-way split:

1. **Element rendering / DOM / event protocol → common (core).** Framebus event *names* (`COLLECT_CALL_REQUESTS`, `REVEAL_CALL_REQUESTS`, `COMPOSABLE_REVEAL`, etc.) live in core constants; variant-neutral leaf helpers — frame/element lookup, `getUnformattedValue`, checkbox concatenation, duplicate-element detection, and the element **validation pass** — become core helpers both packages call. (Note: `cvvMap` / mock-CVV token masking is **flowDB-only**, not a core concern.)

2. **Element input & response *types* → separate, extending common bases.** They genuinely diverge:
   - Reveal input: PDB `IRevealElementInput` (`skyflowID/table/column/redaction`) vs flowDB `IFlowDBRevealElementInput` (token-only + `tokenGroupRedactions`).
   - Response envelope: flowDB unified `records[]` (`{tableName, skyflowId, tokens, hashedData, httpCode, error}`) vs PDB per-operation responses.
   - Upsert options: PDB `{table, column}` vs flowDB `{tableName, uniqueColumns, updateType}` — confirmed different meanings.

   Core defines **base interfaces** for shared element/style fields and a base record/response envelope; each package **extends** them. Public names (`RevealElementInput`, `CollectResponse`, `UpsertOptions`, `SkyflowError`) then resolve to the correct shape per package automatically.

3. **Parse/build logic for those structures → per-package** (in each package's data layer, and therefore in each package's iframe build): `construct*Request`, `formatRecordsForClient*`, `constructFlowDB*Response` are variant-specific and stay out of core.

### 3.4 Frame-controller decomposition

Applying §3.2/§3.3 to the frame controllers concretely: **core exposes only variant-neutral leaf helpers; each package owns its own `tokenize()` / `revealData()` end-to-end.** No template-method base that calls back into subclass hooks — that callback inversion is the "complex coupling with core" to avoid. Once `cvvMap` (flowDB-only), request keys, and the response envelope all differ per variant, the assembly loop is **genuinely different code, not duplication**; only the frame-iteration + validation pass is structurally identical, and it becomes one shared helper.

Split of `tokenize()` ([skyflow-frame-controller.ts:610-813](../src/core/internal/skyflow-frame/skyflow-frame-controller.ts#L610-L813)):

| Region | Lines | Owner |
|---|---|---|
| Validate elements | 617-651 | **core** — `validateElements(options, ctx) → errorMessage` helper (touches no request/response/cvv shape) |
| Assemble insert/update buckets | 653-743 | **per package** — keys differ; `cvvMap` branches are flowDB-only |
| Build request | 744-757 | **per package** — `constructFlowDBInsertRequest` etc. |
| Send + parse response | 763-806 | **per package** — `cvvMap` masking + response envelope are variant-specific |

Core additionally supplies leaf primitives both packages call: frame/element lookup, `getUnformattedValue`, checkbox concatenation, duplicate-element detection. The same split applies to the second `tokenize()` in [frame-element-init.ts:299-504](../src/core/internal/frame-element-init.ts#L299-L504) and to `revealData`. Net: loose coupling **and** near-zero true duplication (only the validation pass is shared, via a plain function call — no inheritance).

---

## 4. Coupling map (current single tree)

Classification of the interleaved modules, for reference during extraction:

| File | Nature | Action |
|---|---|---|
| `core-utils/collect.ts` | PDB + flowDB builders interleaved; `constructElementsInsertReq` + `replaceCVVTokensInResponse` (CVV is flowDB-only) mixed with variant transport | **Cut** — request/response builders per package; validators to core |
| `core-utils/reveal.ts` | 3 seams: flowDB detokenize/reveal, PDB `/v1` GET/getById/render-file, formatters | **Cut** (hardest file) — parse/format per package |
| `skyflow-frame-controller.ts` | one iframe brain for `/v1` pure-JS + flowDB elements; `tokenize()` = neutral validation + variant assembly/request/response | Each package owns its own `tokenize()`; core supplies leaf helpers only (see §3.4) |
| `frame-element-init.ts` | flowDB-only composable collect; neutral validation + variant assembly/request | Each package owns its own `tokenize()`; core leaf helpers only |
| `composable-frame-element-init.ts` | flowDB-only reveal | Move to flowvault |
| `internal-types/index.ts` | neutral internal types + ~25 flowDB interfaces + `CollectResponse`/`RevealResponse` | **Split** (neutral → core, flowDB → flowvault) |
| `libs/skyflow-flowdb-error.ts` | standalone flowDB error class (currently the public `SkyflowError`) | Move to flowvault; extend core error base |
| `libs/skyflow-error.ts` | neutral error base | Move to core |
| `collect-container.ts`, `reveal-container.ts`, `composable-reveal-container.ts` | variant-neutral except `SkyflowFlowDBError` import + `IFlowDBRevealElementInput` type | Container logic → core base; error/type per package |
| `skyflow.ts` | one `Skyflow` class + `container()` factory serves both | Core base + per-package entry |
| `properties.ts` | plain constants (iframe URL defaults) | Per-package (each sets its own iframe URL default) |
| `utils/common/index.ts` | neutral types **+** one flowDB import (`IFlowDBUpsertOptions`) | Neutral → core; invert the flowDB back-edge |
| `index-node.ts` | public names aliased onto flowDB impls | Per-package index |

**Layering back-edges to invert (all type-only, mechanical) before extraction:**

1. `utils/common/index.ts:4` → `IFlowDBUpsertOptions` from `core-utils/collect` (flowDB name in shared `ICollectOptions`). Move upsert-options types into core; make `common` variant-free.
2. `utils/helpers` & `utils/validators` → `reveal-container` + `skyflow.ts` input types. Relocate referenced interfaces into core types.
3. `libs/element-options` → `collect-element` / `compose-collect-element`.
4. `internal-types` → the `index-node` barrel + `external/skyflow-container`.
5. **The structural edge:** the four frame controllers hard-import flowDB builders from `core-utils`. Resolved by moving variant-neutral leaf helpers to `core/` and letting each package own its own controller (§3.4).

**Cleanly shared today (no back-edges, no flowDB) → core as-is:** `event-emitter`, `libs/bus`, `bus-events`, `iframer`, `jss-styles`, `utils/logs`, `logs-helper`, `utils/constants` (error codes), `jwt-utils`, `libs/skyflow-error`, `uuid`/`regex`/`deep-clone`, `metrics`, `core/constants`, and the neutral bulk of `utils/common`.

---

## 5. Migration phases (sequencing)

### Phase 0 — Baseline
- Confirm the `main` privacyDB baseline and the `2.9.0-beta.1` flowDB delta set as the two source inputs.

### Phase 1 — Establish `core/` from `main` (privacyDB only) — critical path
On an integration branch cut from `main`, extract the variant-neutral code into `core/` (behind the `@core` alias + boundary lint) and leave the existing `skyflow-js` (privacyDB) working on top of it. **No flowDB and no second package yet** — `main` has no flowDB to carve, and flowvault can't extend a `core/` that doesn't exist. Pure internal refactor: public surface + telemetry unchanged throughout.
- Scaffold `core/` + `@core` alias (tsconfig/webpack/jest) + `import/no-restricted-paths` (`core/` ⇏ `src/`).
- Move neutral leaves → `core/` (uuid/regex/bus/jss/logs/constants/iframer/metrics/jwt), then telemetry-identity injection, then neutral common types + **base interfaces**.
- Invert the `main` back-edges (`validators`/`helpers`/`element-options`/`internal-types` → container/`skyflow.ts` types) by relocating the referenced interfaces into `core/types`.
- Extract the variant-neutral **leaf helpers** (`validateElements`, `getUnformattedValue`, frame/element lookup, checkbox concat, duplicate detection) into `core/`; keep the pure-JS transport neutral. **No template-method base with subclass callbacks** (see §3.4).
- Carve `core-utils/collect.ts`/`reveal.ts`: neutral assembly helpers → `core/`; privacyDB `/v1` builders/parsers stay in `skyflow-js`.

→ Full task-by-task breakdown in [phase-1-execution-plan.md](phase-1-execution-plan.md).

### Phase 2 — Physical split + build flowvault from `2.9.0-beta.1`
- Relocate the existing tree into `packages/skyflow-js`; set up npm workspaces for the two SDK packages; keep `core/` at the root.
- **Build `skyflow-flowvault-js` from the `2.9.0-beta.1` flowDB deltas as `@core` extensions:** flowDB element input/response types extending the core bases, flowDB `/v2` data layer (incl. `cvvMap` masking), `skyflow-flowdb-error` extending the core error base, and flowvault's own `tokenize()`/`revealData()` calling the core leaf helpers. Broaden the telemetry language-label check to treat `skyflow-flowvault-js` as `JS`.
- Per-package `index.ts` / `index-node.ts` with correct public names (§6); per-package `package.json` (name / main / types / files).
- Per-package browser + node + iframe webpack configs, each `merge`-ing shared `webpack.common.js`; flowvault's UMD `library` + browser IIFE global = `SkyflowFlowVault` (skyflow-js keeps `Skyflow`).

### Phase 3 — Build & release
- Parameterize `common-release.yml` with inputs (`PACKAGE_DIR`, `PACKAGE_NAME`, `S3_PREFIX`, iframe URL / `BUILD_IFRAME`); add a thin caller workflow per package.
- Two iframe deploy pipelines (one per package), each to its own S3 prefix + CloudFront.
- Untangle tests (§7).

### Phase 4 — Samples & docs
- Repoint `samples/using-script-tag/*.html` and `samples/using-typescript/skyflow-elements` at the correct package/CDN URL.
- Move flowDB samples (currently on preview CDN URLs in `using-script-tag`) under the flowvault package.
- Update README(s) per package.

Critical path is the Phase 1 `core-utils` factoring and validating both iframes against the shared core. The iframe-deploy config cost in Phase 3 is offset by the deleted adapter-injection work in Phase 1.

---

## 6. Backward-compatibility guarantees (`skyflow-js` consumers)

Because `skyflow-js` is sourced from `main`, its public surface is restored by construction. The guarantee, by tier:

- **Safe verbatim:** `Skyflow` (default), `CollectContainer/Element`, `Composable*`, `RevealContainer/Element`, `ComposableReveal*`; common types `ContainerOptions`, `CollectElement*`, `CollectOptions`, `AdditionalFields*`, `CardMetadata`, `Input/Label/ErrorTextStyles`, `RedactionType`, `RenderFileResponse`, `ValidationRule(Type)`, `EventName`, `LogLevel`, `Env`, `ElementState`, `ErrorType`, `ErrorMessages`, `UpdateType`, `CardType`, `ElementType`, `ContainerType`, `SkyflowConfig`.
- **Names that must resolve to the PDB shape** (flowDB-bound in `2.9.0-beta.1`, PDB-bound in `skyflow-js`): `CollectResponse`, `CollectRecord`, `RevealResponse`, `RevealRecord`, `RevealElementInput` (regains `skyflowID/table/column`), `RevealOptions`, `RevealElementOptions`, `UpsertOptions` (back to `{table, column}`), `SkyflowError` (neutral `libs/skyflow-error`, not the flowDB class).
- **Restored from `main`:** `InsertResponse`, `UpdateResponse`, `DetokenizeResponse`, `GetResponse`, `GetByIdResponse`, `DeleteResponse`, `UploadFilesResponse` + their request/record types.

**Canary consumer:** `samples/using-typescript/skyflow-elements/src/index.ts` imports exactly the collision-tier names (`CollectResponse`, `RevealResponse`, `RevealElementInput`, `RevealOptions`, `SkyflowError`) — use it as the compat smoke test for `skyflow-js`.

`skyflow-flowvault-js` carries the flowDB shapes of these same names — no backward-compat constraint (new package, v1.0.0).

---

## 7. Build & release detail

- **Webpack:** share `webpack.common.js` (add the `@core` `resolve.alias`; the existing `babel-loader` `exclude: /node_modules/` already compiles `core/` since it is a plain folder — no change needed there). Each package needs only small browser + node + iframe configs differing in `entry`, `output.path`, and UMD `library` name. The iframe config is per-package (each imports the core skeleton via its `index-internal.ts`).
- **Shared-core wiring:** `@core` alias declared once in `tsconfig.base.json` and mirrored to webpack + jest; `import/no-restricted-paths` enforces `core/` ⇏ `packages/`. `core/` is compiled inline into each build — no separate core build, no build ordering.
- **SDK telemetry identity:** inject `SDK_NAME`/`SDK_VERSION` per package via `DefinePlugin` (from each package's own `package.json`); the shared `core/` helper reads these constants instead of importing `package.json`. Keep the language label `JS` for both SDKs by broadening the `sdkName === 'skyflow-js'` check to include `skyflow-flowvault-js`; preserve the existing `metaData` wrapper-override so a wrapper like `skyflow-react@x` still reports `React`. `skyflow-js` output stays byte-identical (`skyflow-js@<version>`, `JS SDK v<version>`).
- **Hardcoded values to watch:** output dirs (`dist/v1`, `dist/sdkNodeBuild`, `dist/v1/elements`), the UMD/IIFE global (`Skyflow` for skyflow-js, `SkyflowFlowVault` for flowvault), and the iframe URL default in each package's `properties.ts`.
- **Release workflow:** `common-release.yml` is already `workflow_call` but hard-assumes one `package.json`, one `dist/v1` S3 prefix, one `npm publish`. Parameterize by package/dir/prefix; per-package caller workflows. **Tags:** skyflow-js keeps bare-semver triggers; flowvault uses `flowvault-`-prefixed tags (configurable via the workflow trigger pattern). **Toolchain:** `setup-node@v4` / Node 18 across CI.
- **npm publish** keys off `package.json` `name`/`version`; each package publishes independently under its own name.

## 8. Testing

- `jest.config.json` is minimal: `jsdom`, `collectCoverage: true`, no `roots`, no `coverageThreshold`, only an svg mock. **Per-package coverage config is written from scratch.**
- The 5 dedicated `*.flowdb.test.js` files move mechanically to flowvault:
  - `tests/core-utils/collect.flowdb.test.js`, `tests/core-utils/reveal.flowdb.test.js`
  - `tests/core/internal/frame-element-init.flowdb.test.js`, `.../composable-frame-element-init.flowdb.test.js`
  - `tests/core/internal/skyflow-frame/skyflow-frame-controller.detokenize.flowdb.test.js`
- The PDB test files are **half-migrated** in `2.9.0-beta.1` (flowDB `skip`s + inline `SkyflowFlowDBError` assertions in `skyflow.test.*`, `collect-container`, `reveal-container`, `skyflow-frame-controller`, `frame-element-init.*`, `upload-tokenize`). Since `skyflow-js` is sourced from `main`, take its tests from `main` rather than untangling the beta versions.
- Note many tests are duplicated `.js` + `.ts` — deduplicate opportunistically during the split.

---

## 9. Pre-execution prerequisites (blocker checklist)

Grouped by when each must be settled. Status reflects decisions taken so far.

### Resolved / retired (for the record)
- ✅ **Versioned iframe URL delivery** — resolved. Existing `properties.ts` + `DefinePlugin` + release-workflow secrets bake a per-package absolute URL; each package supplies its own origin/site/version (see §3.2).
- ✅ **Workspace transpilation gotcha** — retired by the shared-`core/`-folder decision. Because `core/` is a plain folder (not symlinked under `node_modules`), `babel-loader` compiles it normally; no Option A/B, no build ordering (see §3.1).
- ✅ **Per-package SDK telemetry identity** — resolved. Inject `SDK_NAME`/`SDK_VERSION` per package via `DefinePlugin` from each package's own `package.json`; the shared `core/` helper reads the injected constants instead of `import …/package.json`. flowvault reports `skyflow-flowvault-js@<version>` (no analytics enum to register). Language label stays `JS` for both first-party SDKs — broaden the `sdkName === 'skyflow-js'` check ([helpers/index.ts:476](../src/utils/helpers/index.ts#L476)) to also accept `skyflow-flowvault-js`, leaving the `metaData` wrapper-override (`skyflow-react@x` → `React`) intact. `skyflow-js` telemetry output is unchanged. See §7.
- ✅ **Pure-JS surface ownership** — resolved. `skyflow-flowvault-js` v1.0.0 is **elements-only**; pure-JS `Skyflow.*` methods are deferred to a future release. This is **not a public removal**: on `2.9.0-beta.1` the pure-JS methods are already private (`#insert`/`#detokenize`/… in [skyflow.ts:301-339](../src/skyflow.ts#L301), no public alias; pure-JS types commented out in `index-node.ts`), so flowDB pure-JS was never publicly exposed. `skyflow-js` keeps its pure-JS methods **public** (restored from `main`, where they are public). **`/v2` file-upload/render → `skyflow-js` only**; flowvault has no file support. To keep future flowvault pure-JS additive, keep the pure-JS **transport** (the `PUREJS_REQUEST` dispatch + container→frame-controller flow) variant-neutral in `core/`; only the per-method `/v1` vs `/v2` data layer is package-specific. **Phase-1 verify:** skyflow-js's file-upload endpoint must land on `main`'s behavior, not the beta's `/v2` variant.
- ✅ **3DS / ThreeDS ownership** — resolved. Lives entirely in `skyflow-js`: public on `main` (`ThreeDS` + `ThreeDSBrowserDetails`, [index-node.ts:57,75](../src/index-node.ts)), restored as-is along with the `threeds.ts` module. flowvault has **no** 3DS now (commented out in `2.9.0-beta.1`, never publicly exposed there); a future flowvault 3DS would be additive. 3DS is a package-specific feature, **not** shared `core/`.

_All Phase-1-blocking decisions are now resolved._

### Before Phase 2 (settled)
- ✅ **Toolchain bump for workspaces.** Build/CI moves to **Node 18 LTS** + `setup-node@v4` (from Node 14.17.6). This is a *build/dev* change only — the published `engines` (`node >=12`) stays, so **consumers on older Node are unaffected**.
- ✅ **Git/branch strategy.** Cut a dedicated **integration branch from `main`**; all refactor work targets that branch and merges into it **phase by phase** (not directly to `main`). Use `git mv` for the physical move so `git blame`/`--follow` history is preserved. The integration branch becomes the release source once complete.

### Before Phase 3 (settled)
- ✅ **Tag namespaces.** `skyflow-js` keeps its existing bare-semver tags (no change to current automation); `skyflow-flowvault-js` uses **`flowvault-`-prefixed** tags (`flowvault-v1.0.0`, `flowvault-v1.0.0-beta.1`) with its own caller workflows filtering `flowvault-*`. The prefix lives only in the workflow trigger pattern — **configurable later** via a one-line workflow edit, no artifact impact.
- ✅ **npm name + publish rights.** Confirmed — publish access ready in dev + prod under the same npm org.
- ✅ **UMD/global name** for flowvault browser bundle = **`SkyflowFlowVault`** (consumer-facing global for script-tag/CDN users; skyflow-js keeps `Skyflow`). Applies to both the UMD `library` name and the browser IIFE (`window.SkyflowFlowVault`) and to flowvault's script-tag samples.
- ✅ **Consumer migration comms — not needed.** The `2.9.0-beta.1` flowDB build was shared privately with a single customer, not published to public npm — so there is no public consumer to migrate and no npm deprecation required.
- ⏳ **Infra request (external — infra team).** Provision flowvault SDK + iframe hosting, mirroring the existing skyflow-js setup so the team can correlate. Hand-off checklist:
  1. **DNS host** — `js-flowvault.skyflow.dev` (prod) + dev/sandbox equivalents matching skyflow-js's per-env hosts.
  2. **TLS** — ACM certificate covering the new host(s).
  3. **CDN** — CloudFront distribution for the new host; **origin = the same S3 bucket** as skyflow-js under a dedicated `flowvault/` sub-prefix; serve `/{version}/elements/*` (iframe) and `/{version}/*` (browser bundle); mirror skyflow-js's cache behaviors.
  4. **S3 write** — grant the CI release role write access to the `flowvault/` prefix.
  5. **Invalidation** — the flowvault CloudFront **distribution ID** + IAM permission for the CI role to invalidate it (skyflow-js's release runs ×10 invalidations).
  6. **CI secrets** (per env, mirroring skyflow-js's `PROD_/SANDBOX_` secrets):
     - `FLOWVAULT_{PROD,SANDBOX}_IFRAME_SECURE_ORIGIN` = `https://js-flowvault.skyflow.dev`
     - `FLOWVAULT_{PROD,SANDBOX}_IFRAME_SECURE_SITE` = `elements/index.html`
     - the flowvault CloudFront distribution ID (for invalidation).

### Verification gates (settled)
- ✅ **Bundle-size.** One-time check (not a CI gate): capture `skyflow-js`'s current bundle size from `main` as the baseline and compare the post-split `skyflow-js` once.
- ✅ **Coverage.** Floor = the current `main`-branch coverage per package (no backsliding), applied via per-package `coverageThreshold` after the test split.
