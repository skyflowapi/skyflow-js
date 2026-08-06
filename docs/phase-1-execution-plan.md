# Phase 1 — Detailed Code Execution Plan (`core/` extraction)

Companion to [package-split-plan.md](package-split-plan.md). This decomposes **Phase 1** into small, individually-reviewable tasks. Each task is one PR into the integration branch, is **behavior-preserving**, and leaves the build + tests green.

---

## Scope & non-goals

**In scope (Phase 1):** On an integration branch cut from `main` (privacyDB baseline), extract the variant-neutral code into a shared `core/` folder behind the `@core` alias + boundary lint rule, and leave the existing `skyflow-js` (privacyDB) package working on top of it.

**Explicit non-goals (deferred to later phases):**
- **No flowDB.** `main` has no flowDB code; flowvault is built from the `2.9.0-beta.1` deltas as `@core` extensions in a **later phase** (it cannot extend a `core/` that doesn't exist yet).
- **No second package / no `packages/` relocation yet.** During Phase 1 the existing tree stays at the repo root as the `skyflow-js` package; `core/` is added alongside it. Creating `packages/skyflow-js` + `packages/skyflow-flowvault-js` and npm workspaces is Phase 2.

**Invariant after every task:** the public API surface (`index.ts` / `index-node.ts` exports and their shapes), SDK telemetry output, and all existing tests are **unchanged**. Phase 1 is a pure internal refactor.

### End state of Phase 1
```
repo/
  core/                 # variant-neutral shared source + @core barrel
  src/                  # existing skyflow-js (privacyDB), now importing @core
  tsconfig.base.json    # @core/* → core/*
  .eslintrc(.js)        # import/no-restricted-paths: core/ ⇏ src/
```

---

## Working model

- **Branch:** one long-lived integration branch off `main` (e.g. `refactor/pkg-split`). Every task below is a PR **into that branch**, reviewed and merged before the next starts. The branch becomes the release source when the whole split is done.
- **One task = one PR.** Ordered; each builds on the previous. Earliest tasks are lowest-risk (pure moves); boundary-inversion tasks come after the leaves are in place.
- **Moves preserve history:** use `git mv` so `git blame`/`--follow` still work.

### Verification recipe (run at the end of every task)
1. `npm run type-check` — no TS errors.
2. `npm test` — full suite green (no new skips).
3. `npm run build-browser-sdk && npm run build-node-sdk && npm run build-iframe` — all three bundles build.
4. **Public-surface guard:** `npm run build:types` and diff the emitted `types/index-node.d.ts` + `types/index.d.ts` against the pre-Phase-1 snapshot — expect **zero diff** (Tasks that intentionally relocate a type must still produce an identical *exported* shape).
5. **Consumer canary:** `samples/using-typescript/skyflow-elements` still type-checks against the built package.
6. **Boundary lint:** `npx eslint` passes, including `import/no-restricted-paths` (warn until Task 1.11, then error).

### Definition of done (per task)
Verification recipe green · reviewer approves · no change to public surface or telemetry (except where a task explicitly restructures internals with an identical external shape).

---

## Task list

### Task 1.0 — Branch, toolchain, empty boundary scaffolding
**Goal:** stand up the `@core` boundary with nothing moved yet.
- Cut `refactor/pkg-split` from `main`. Capture the baselines: `build:types` snapshot (for the surface guard), current bundle size (webpack-bundle-analyzer), current coverage numbers.
- CI: `actions/setup-node@v4`, Node 18 (build/dev only; leave published `engines` untouched).
- Create empty `core/` + `core/index.ts` (empty barrel).
- Add the `@core` alias in **one source of truth** (`tsconfig.base.json` `paths: { "@core/*": ["core/*"] }`) mirrored to `webpack.common.js` `resolve.alias` and `jest.config.json` `moduleNameMapper`.
- Add `eslint-plugin-import` `import/no-restricted-paths` zone (`core/` ⇏ `src/`), severity **warn** for now.

**Reviewability:** config-only diff; no logic touched.
**Verify:** recipe green; surface snapshot captured.

---

### Task 1.1 — Move zero-import neutral leaves
**Goal:** move the leaves that import nothing (safest first).
- `git mv` → `core/`: `libs/uuid.ts`, `libs/regex.ts`, `libs/deep-clone.ts`, `utils/jwt-utils/`, `libs/jss-styles.ts`, `event-emitter/`, `libs/bus.ts`.
- Repoint importers to `@core/...`; add these to the `core/index.ts` barrel.

**Reviewability:** pure move + import rewrite; small.
**Verify:** type-check + tests green.

---

### Task 1.2 — Move logging, error-codes, DOM/iframe & metrics primitives
**Goal:** move the neutral, downward-only utility tier.
- `git mv` → `core/`: `utils/logs.ts`, `utils/constants.ts` (`SKYFLOW_ERROR_CODE`), `core/constants.ts`, `properties.ts`, `iframe-libs/iframer.ts`, `utils/bus-events/`, `metrics/`.
- `utils/logs-helper/` moves too, **but** it depends on `helpers.getSDKLanguageAndVersion` — pull that one neutral helper across with it (or temporarily import from `src`) and finish the helpers move in Task 1.3.

**Reviewability:** move + import rewrite; watch the `logs-helper → helpers` edge.
**Verify:** recipe green.

---

### Task 1.3 — SDK telemetry identity injection + neutral helpers
**Goal:** make SDK name/version injectable per package (prerequisite for two packages) with **identical** output for skyflow-js.
- Replace `import SDKDetails from '../../../package.json'` ([helpers/index.ts:17](../src/utils/helpers/index.ts#L17)) with build-time `SDK_NAME` / `SDK_VERSION` injected via `DefinePlugin` (mirroring the existing `IFRAME_SECURE_*` injection); the shared helper reads the injected constants.
- Restructure the language-label ([helpers/index.ts:476](../src/utils/helpers/index.ts#L476)) so it's injection-ready (skyflow-js → `JS`), preserving output. (The `=== 'skyflow-js'` broadening for flowvault happens when flowvault is built — not now.)
- Move the remaining neutral helper functions into `core/helpers`.

**Reviewability:** localized to helpers + webpack define; call out the telemetry-preserving intent.
**Verify:** recipe green **plus** an explicit telemetry check — `sdk_name_version` still equals `skyflow-js@<version>` and the label `JS SDK v<version>` (snapshot before/after).

---

### Task 1.4 — Neutral common types → `core/types` + base interfaces
**Goal:** carve the neutral type surface out of `utils/common` and define the base interfaces packages will extend.
- Move to `core/types`: enums (`EventName`, `LogLevel`, `Env`, `RedactionType`, `UpdateType`, `ValidationRuleType`, `ErrorType`, `MessageType`, `RequestMethod`), element/style types (`Style`, `ContainerOptions`, `Input/Label/ErrorTextStyles`, `CollectElement*`, `ICollectOptions`, `ElementState`, `AdditionalFields*`, `CardMetadata`), and the neutral record/response families.
- Define **base interfaces**: base element-input, base record/response envelope, base upsert options — the extension points for privacyDB (now) and flowDB (later).
- Keep privacyDB-specific types in `src`, extending the base.
- Re-export everything from `index-node.ts`/`index.ts` under the **same public names**.

**Reviewability:** larger but mechanical; the surface guard is the safety net.
**Verify:** recipe green; **surface diff must be zero** (same exported names + shapes); using-typescript canary compiles.

---

### Task 1.5 — Invert back-edge: validators
**Goal:** stop shared validators importing "up" into container/`skyflow.ts` types.
- Today `validators/index.ts` imports `IRevealElementInput` (`reveal-container`) and `ISkyflow` (`skyflow.ts`).
- Split: pure validators (card/Luhn/regex/format) → `core/validators`. For request/shape validators that reference input types, **relocate those input interfaces into `core/types`** (Task 1.4's base types) so the dependency points down, not up.

**Reviewability:** focused on one file + the relocated interfaces.
**Verify:** recipe green; boundary lint clean for the moved validators.

---

### Task 1.6 — Invert back-edges: helpers & element-options
**Goal:** clear the remaining shared→container type edges.
- `helpers/index.ts` imports `IRevealElementOptions` (`reveal-container`) + `ContainerType`/`ISkyflow` (`skyflow.ts`). Move `ContainerType` (neutral) to `core`; relocate the referenced input interfaces to `core/types`.
- `libs/element-options.ts` imports concrete `CollectElement`/`ComposableElement` classes — restructure so it depends on `core` interfaces, not concrete element classes (invert via a small interface).

**Reviewability:** two files; each edge removal is independently checkable.
**Verify:** recipe green.

---

### Task 1.7 — Split `internal-types` (neutral → core)
**Goal:** remove the barrel/`skyflow.ts`/`skyflow-container` upward imports from `internal-types`.
- `internal-types/index.ts` imports the `index-node` barrel, `skyflow.ts`, and `external/skyflow-container` (upward edges).
- Move the neutral internal types (`ElementInfo`, `InternalState`, `Metadata`, `ClientMetadata`, `SkyflowElementProps`, etc.) → `core/types`; break the barrel import by referencing concrete types directly.

**Reviewability:** type-only moves; surface guard covers regressions.
**Verify:** recipe green.

---

### Task 1.8 — `skyflow-error` base + styles into core
**Goal:** move the neutral error base and style helpers.
- Move `libs/skyflow-error.ts` (the neutral base) → `core/errors`; keep the public `SkyflowError` exported from the package via a re-export from `@core`.
- Move `libs/styles.ts` + neutral parts of `element-options` → `core`.

**Reviewability:** small; verify the public `SkyflowError` identity is unchanged.
**Verify:** recipe green; `SkyflowError` still exported with identical shape.

---

### Task 1.9 — Extract frame leaf-helpers into core
**Goal:** move the variant-neutral element/frame helpers that both packages will call (the §3.4 leaf helpers).
- Extract into `core` as standalone helpers: the element **validation pass** (`validateElements(options, ctx) → errorMessage`), `getUnformattedValue`, frame/element lookup, checkbox concatenation, duplicate-element detection (`checkForElementMatchRule` / `checkForValueMatch`, currently in `core-utils/collect.ts:471-481`).
- Rewire the privacyDB frame controller + `iframe-form` to call the `@core` helpers.

**Reviewability:** behavior-preserving extraction; element tests are the guard.
**Verify:** collect/reveal element tests green.

---

### Task 1.10 — Carve `core-utils/collect.ts` & `reveal.ts` (privacyDB) against core
**Goal:** separate neutral request-assembly plumbing from privacyDB transport.
- Move neutral helpers → `core`: `constructElementsInsertReq` (`collect.ts:188`), `formatRecordsForIframe` (`reveal.ts:340`), and any other variant-neutral formatter.
- Leave privacyDB `/v1` builders/parsers in `src` (`constructInsertRecordRequest/Response`, `constructUpdate*`, `insertDataInCollect`, `fetchRecordsByTokenId`, `formatRecordsForClient`, GET/render helpers), now consuming the `@core` helpers.

**Reviewability:** the two hardest files, but privacyDB-only (no flowDB interleaving on `main`), so it's a clean neutral-vs-transport cut.
**Verify:** recipe green; collect/reveal/detokenize tests green.

---

### Task 1.11 — Pure-JS transport neutral + barrel finalize + boundary hardening
**Goal:** finish the boundary and lock it.
- Ensure the pure-JS **transport** (the `PUREJS_REQUEST` dispatch + container→frame-controller message flow skeleton) is neutral in `core` so future flowvault pure-JS is additive; the `/v1` data layer stays in `src`.
- Finalize `core/index.ts` — the barrel is the surface flowvault will consume in a later phase.
- Flip `import/no-restricted-paths` to **error**.
- Run the full build; **capture the post-Phase-1 bundle-size** (compare to the Task 1.0 baseline, expect ≤ +2%) and confirm coverage ≥ the `main` floor.

**Reviewability:** mostly wiring + config; final green-field check.
**Verify:** full recipe green; **public surface + telemetry diff = zero**; bundle-size within tolerance; coverage ≥ floor.

---

## Dependency ordering

```
1.0 (scaffold)
 └─ 1.1 (zero-import leaves)
     └─ 1.2 (logs/constants/dom/metrics)
         └─ 1.3 (telemetry inject + helpers)
             └─ 1.4 (neutral types + base interfaces)   ← unblocks the back-edge inversions
                 ├─ 1.5 (validators)
                 ├─ 1.6 (helpers/element-options)
                 └─ 1.7 (internal-types)
                     └─ 1.8 (error base + styles)
                         └─ 1.9 (frame leaf-helpers)
                             └─ 1.10 (collect/reveal carve)
                                 └─ 1.11 (pure-JS transport + finalize)
```

Tasks 1.5–1.7 can be parallel PRs once 1.4 lands. Everything else is linear.

## Risks & watch-items
- **Surface drift:** the emitted-`.d.ts` diff (recipe step 4) is the primary guard — treat any non-empty diff as a defect unless the task intends an identical re-export.
- **Telemetry regression (Task 1.3):** verify `sdk_name_version` explicitly; it's easy to change silently by moving the `package.json` read.
- **`logs-helper → helpers` edge (Task 1.2):** the one ordering hazard in the leaf moves — carry `getSDKLanguageAndVersion` across with it.
- **Circular imports:** relocating interfaces into `core/types` (1.4–1.7) can create cycles if a `core` type pulls a `src` type — the boundary lint rule (error in 1.11) catches these; keep base interfaces dependency-free.
- **Test duplication:** `main` has duplicated `.js`/`.ts` tests — update both (or dedupe) as files move so coverage doesn't drop.
