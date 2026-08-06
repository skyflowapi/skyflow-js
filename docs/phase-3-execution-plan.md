# Phase 3 — Detailed Code Execution Plan (build & release)

Companion to [package-split-plan.md](package-split-plan.md); follows [phase-2-execution-plan.md](phase-2-execution-plan.md). Same model: each task is one PR into the integration branch, individually reviewable. Because these are CI/CD changes, "reviewable" also means **validated in sandbox, never against prod, and skyflow-js's release path is never broken**.

---

## Entry state (end of Phase 2)
```
repo/
  core/
  packages/skyflow-js/            # privacyDB, builds all 3 artifacts locally
  packages/skyflow-flowvault-js/  # flowDB v1.0.0, builds all 3 artifacts locally
  package.json                    # private workspace root
```
Both packages build locally; **no release automation is package-aware yet.**

## Scope
Make the release + CI pipeline serve **two independently-versioned packages** from one repo:
- Parameterize `common-release.yml` by package (dir, name, dist path, S3 prefix, publish target, version/tag parsing).
- Per-package **caller workflows** with per-package **tag namespaces** and **secrets** (two iframe deploy pipelines).
- Workspace-aware CI (`pr.yml` / `main.yml`) + `bump_version.sh`.
- Toolchain → Node 18 in the release workflow (CI was bumped in Phase 1).

### Non-goals
- **No prod cutover in Phase 3.** All validation is in **sandbox**. The integration branch's workflows go live only when the branch merges to `main` (a deliberate, separate cutover step).
- No changes to the SDK code (that's Phases 1–2).

### End state
- `common-release.yml` is package-parameterized; **skyflow-js releases exactly as before** (defaults preserve current behavior).
- `skyflow-flowvault-js` releases from `flowvault-`-prefixed tags to its own S3 prefix / CloudFront / npm name.
- CI builds + tests both packages.

---

## Working model & golden rules
Same integration branch; one PR per task. For release-workflow tasks:
1. **skyflow-js first, unchanged.** Parameterize with defaults that reproduce today's skyflow-js behavior; prove it in **sandbox** before adding flowvault.
2. **Sandbox before prod, always.** Validate every path against SANDBOX secrets/buckets/distributions. Prod secrets are untouched until the merge-time cutover.
3. **Additive for flowvault.** flowvault gets *new* caller workflows + *new* `FLOWVAULT_*` secrets; nothing skyflow-js depends on is modified in place beyond the shared reusable workflow.

### Verification recipe (per task)
1. **`actionlint`** (or YAML validation) passes on changed workflows.
2. **CI green** on a PR to the integration branch (for `pr.yml`/`main.yml` tasks).
3. **Sandbox dry-run** (for release tasks): push a throwaway tag in the sandbox env and confirm — correct package version bumped, artifacts at the right **S3 prefix**, iframe reachable at the right **host**, npm published under the right **name/dist-tag**, CloudFront invalidation hit the right **distribution**.
4. **skyflow-js regression guard:** a sandbox skyflow-js release produces the **same** outputs (version scheme, S3 path `v{version}/`, npm name/tag) as before the change.

### Definition of done (per task)
Recipe green · reviewer approves · prod secrets untouched · skyflow-js sandbox release still correct.

---

## Task list

### Task 3.0 — Workspace-aware CI (`pr.yml` + `main.yml`), Node 18
**Goal:** PR/main CI builds and tests **both** packages.
- `actions/setup-node@v4`, Node 18.
- Run `type-check` + `test` + all three builds **per package** (a `matrix: package: [skyflow-js, skyflow-flowvault-js]`, or `npm run <script> --workspaces`).
- Codecov per package (`codecov-skyflow-js`, `codecov-skyflow-flowvault-js`) with per-package coverage.
- Keep the existing JIRA-ID / eslint PR gates.

**Reviewability:** CI-only; provable by opening a PR to the integration branch.
**Verify:** recipe 1–2; both packages' jobs green.

---

### Task 3.1 — `bump_version.sh` workspace-aware
**Goal:** bump the *right* package's `package.json`.
- Add a package-path argument; `sed` `packages/<pkg>/package.json` instead of the root manifest. Preserve the `-dev.<sha>` internal-build branch of the script.

**Reviewability:** small, self-contained script change.
**Verify:** run the script locally against each package manifest; version updates in the correct file only.

---

### Task 3.2 — Parameterize `common-release.yml` by package (skyflow-js behavior preserved)
**Goal:** make the reusable workflow package-scoped, defaulting to today's skyflow-js behavior.

**One S3 bucket, one CloudFront distribution, both packages — key layout:**
```
# privacyDB (skyflow-js) — UNCHANGED, S3_PREFIX = ""
s3://bucket/v<version>/index.js
s3://bucket/v<version>/elements/index.html
s3://bucket/v<version>/elements/index.js

# flowDB (skyflow-flowvault-js) — NEW, S3_PREFIX = "flowvault/"
s3://bucket/flowvault/v<version>/index.js
s3://bucket/flowvault/v<version>/elements/index.html
s3://bucket/flowvault/v<version>/elements/index.js
```
The prefix goes **before** the version segment (not nested inside a shared `v<version>/`), because the two packages version independently — nesting would risk a key collision if both happen to ship the same version number on unrelated content. This is a pure S3-key change; the existing CloudFront distribution's default `/*` → S3-origin behavior serves the new prefix with **no distribution or behavior change**, *provided* infra confirms two things up front (§9 infra request): the bucket policy/OAC isn't scoped to a specific key prefix, and no CloudFront Function/Lambda@Edge hardcodes a `^/v[0-9]` path assumption. Track that confirmation as an external dependency of this task, not a code change.

- New `inputs`: `PACKAGE_DIR` (e.g. `packages/skyflow-js`), `PACKAGE_NAME`, `DIST_DIR` (browser dist to upload), `S3_PREFIX` (default empty → `v{version}/`, matching the layout above), `INVALIDATION_PATH` (default `/*`, preserving current behavior).
- Steps updated: `setup-node@v4`/Node 18; builds run per package (`-w ${PACKAGE_NAME}` or `working-directory: ${PACKAGE_DIR}`); `bump_version.sh` targets `${PACKAGE_DIR}`; the **Commit Changes** step `git add ${PACKAGE_DIR}/package.json`; **Deploy to S3** uses `s3://${AWS_BUCKET_NAME}/${S3_PREFIX}v${version}/`; **Publish** runs `npm publish -w ${PACKAGE_NAME}` (keeps the beta `--tag v{version}` / internal-JFrog / public branches); **Invalidate CloudFront** uses `--paths "${INVALIDATION_PATH}"` instead of the hardcoded `/*`.
- `INVALIDATION_PATH` is a deliberate escape hatch, not a forced change: skyflow-js keeps `/*` (zero behavior change); flowvault's caller can pass `/flowvault/*` so a flowvault release doesn't churn CloudFront's cache for privacyDB's unrelated keys, and vice-versa. Either package can still opt back into `/*` if scoped invalidation ever misses something.

**Reviewability:** the core reusable-workflow diff; defaults make it a no-op for skyflow-js.
**Verify:** recipe 3–4 — a **sandbox skyflow-js beta** release still bumps `packages/skyflow-js/package.json`, uploads to `v{version}/` (not `flowvault/v{version}/`), invalidates `/*`, and publishes `skyflow-js` identically.

---

### Task 3.3 — Package-scoped version/tag parsing
**Goal:** derive `RELEASE_VERSION` from the *triggering* tag, per package, now that two tag namespaces coexist.
- Add input `TAG_PREFIX` (empty for skyflow-js, `flowvault-` for flowvault). Replace the `git describe`-of-latest-tag logic with parsing `github.ref_name` minus the prefix (e.g. `flowvault-v1.0.0` → `1.0.0`; bare `2.7.9` → `2.7.9`), keeping the `internal` `-dev.<sha>` suffix branch.

**Reviewability:** localized to the version-resolution steps.
**Verify:** version resolves correctly for both a bare-semver tag and a `flowvault-`-prefixed tag (sandbox).

---

### Task 3.4 — Update skyflow-js caller workflows for the new inputs
**Goal:** wire the existing skyflow-js callers to the parameterized reusable workflow **without changing skyflow-js's behavior**.
- `beta-release.yml` / `release.yml` / `internal_release.yml`: pass `PACKAGE_DIR=packages/skyflow-js`, `PACKAGE_NAME=skyflow-js`, `DIST_DIR`, `S3_PREFIX=""`, `TAG_PREFIX=""`. Keep their existing tag triggers (`*.*.*-beta.*`, `*.*.\d+`, `release/*`) and existing SANDBOX/PROD/BLITZ secrets.

**Reviewability:** additive input wiring in three small caller files.
**Verify:** recipe 4 — **sandbox skyflow-js beta** end-to-end identical to pre-Phase-3.

---

### Task 3.5 — Add flowvault caller workflows (tag namespace + `FLOWVAULT_*` secrets)
**Goal:** flowvault's own release entry points.
- New `flowvault-beta-release.yml` / `flowvault-release.yml` (+ optional internal): triggers on `flowvault-v*-beta.*` / `flowvault-v*`; call the reusable workflow with `PACKAGE_DIR=packages/skyflow-flowvault-js`, `PACKAGE_NAME=skyflow-flowvault-js`, `S3_PREFIX=flowvault/`, `TAG_PREFIX=flowvault-`, `INVALIDATION_PATH=/flowvault/*`.
- **Same bucket, same CloudFront distribution, same CDN domain — reuse, don't duplicate, infra secrets.** Since flowvault lands in the *same* bucket behind the *same* distribution (per Task 3.2), the flowvault caller passes the **existing** `SANDBOX_AWS_BUCKET_NAME` / `SANDBOX_CF_DISTRIBUTION_ID` / `SANDBOX_IFRAME_SECURE_ORIGIN` (and `PROD_*` equivalents at cutover) — no new bucket/distribution/domain secrets to provision. The **only** new secret is the iframe *path*: `FLOWVAULT_{SANDBOX,PROD}_IFRAME_SECURE_SITE`, holding the `flowvault/v<version>/elements/…` path instead of the bare `v<version>/elements/…` path skyflow-js uses. `NODE_AUTH_TOKEN` stays the shared npm org token, scoped by `PACKAGE_NAME` to publish `skyflow-flowvault-js`; dist-tag scheme mirrors skyflow-js.
- **Shared-origin note (awareness, not a new gap):** because both packages' iframes are served from the same domain, a browser's `postMessage` origin check (scheme+host+port only, no path) can't distinguish a privacyDB frame from a flowvault frame. This is already true across skyflow-js versions coexisting on that domain today, so the prefix split doesn't introduce it — just don't rely on `IFRAME_SECURE_ORIGIN` alone as a package boundary if the two frame-controllers ever need to reject each other's messages.

**Reviewability:** new files only; nothing skyflow-js touches.
**Verify:** recipe 3 — **sandbox flowvault beta** publishes `skyflow-flowvault-js@1.0.0-beta.x`, uploads to `flowvault/v{version}/` in the **same** sandbox bucket, iframe reachable at the **same** sandbox CDN domain under `/flowvault/v{version}/elements/…`, invalidation scoped to `/flowvault/*` on the **same** distribution.

---

### Task 3.6 — Two iframe deploy pipelines, one bucket/distribution: sandbox end-to-end validation
**Goal:** prove both packages' full release paths coexist **in the same sandbox bucket and distribution**, without touching each other's keys or cache.
- Trigger a sandbox beta for **both** packages back-to-back. Confirm: each bumps its own manifest; each iframe + browser bundle lands under its own S3 prefix (`v{version}/` vs `flowvault/v{version}/`) in the **same** bucket; each npm publish is under the right name/tag; each CloudFront invalidation is scoped to its own path (`/*` vs `/flowvault/*`) on the **same** distribution; **no cross-contamination** — skyflow-js's existing keys/cache are untouched by a flowvault run and vice-versa (spot-check that `v{version}/index.js` for an unrelated existing skyflow-js release still serves post-flowvault-release).

**Reviewability:** no code diff beyond any fixes surfaced; this is the integration checkpoint.
**Verify:** both sandbox releases correct and independent, sharing infra with zero collision.

---

### Task 3.7 — Release runbook + prod-cutover checklist
**Goal:** document how releases work post-split and gate the prod switch.
- A `RELEASING.md`: the two tag schemes, which workflow fires, required prod secrets (skyflow-js `PROD_*` unchanged; flowvault `FLOWVAULT_PROD_*` newly required), and the rollback note.
- A **prod-cutover checklist** (executed at merge time, not now): confirm flowvault prod secrets + infra (§9 infra request) are in place; confirm the first flowvault prod tag; confirm skyflow-js prod release is unaffected.

**Reviewability:** docs-only.
**Verify:** checklist reviewed; no prod action taken in Phase 3.

---

## Dependency ordering
```
3.0 (workspace CI)      ─ independent, do first
3.1 (bump_version)
 └─ 3.2 (parameterize common-release)
     └─ 3.3 (version/tag parsing)
         └─ 3.4 (skyflow-js callers)      ← prove skyflow-js unchanged in sandbox
             └─ 3.5 (flowvault callers)   ← additive
                 └─ 3.6 (both, sandbox e2e)
                     └─ 3.7 (runbook + cutover checklist)
```

## Risks & watch-items
- **Breaking skyflow-js releases** is the top risk. Mitigation: defaults preserve behavior (3.2), skyflow-js callers verified in sandbox **before** flowvault exists (3.4), and skyflow-js's S3 path stays `v{version}/` (no prefix) so existing `js.skyflow.dev` CDN URLs don't move.
- **Version/tag ambiguity (3.3):** the old `git describe`-latest-tag logic is wrong once two namespaces exist — derive from the triggering ref, not the latest tag repo-wide.
- **`npm publish -w` requires npm 7+** — depends on the Node 18 bump (3.0/3.2).
- **Prod secrets & infra lead time:** flowvault's `FLOWVAULT_PROD_IFRAME_SECURE_SITE` secret (the only *new* secret flowvault needs — everything else is reused from skyflow-js's existing bucket/distribution/domain secrets, per 3.5) must exist **before** the cutover — track as an external dependency, not a code task.
- **Bucket-policy / edge-function prefix assumptions (3.2):** confirm with infra, before relying on it, that the shared bucket's policy/OAC isn't scoped to a specific key prefix and that no CloudFront Function/Lambda@Edge on the distribution hardcodes a `^/v[0-9]` path shape — either would silently 403/misroute the new `flowvault/` prefix on a distribution that otherwise looks unchanged.
- **Shared-origin postMessage boundary:** both packages' iframes share one CDN domain, so `IFRAME_SECURE_ORIGIN` checks alone can't distinguish a privacyDB frame from a flowvault frame (browser origin checks ignore path). Pre-existing behavior across skyflow-js versions today, not a new risk from the prefix split — noted so it isn't mistaken for isolation it doesn't provide.
- **The `Commit Changes` force-push** writes the bumped manifest back to the resolved branch — ensure it adds only the package's `package.json`, and that the two packages' automated release commits don't race on the same branch.
- **Cutover is out of scope here** — Phase 3 leaves prod on the old pipeline until the integration branch merges; the runbook (3.7) governs that switch.
