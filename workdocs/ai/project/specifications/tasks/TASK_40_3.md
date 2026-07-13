# DECAF-40-3: Superset embed plugin (patch scripts, build scripts, installer with clone+patch+build)

**ID:** DECAF-40-3
**Specification:** [Link to Specification](../DECAF_40.md)
**Priority:** High
**Status:** Completed

## 1. Description
Implement the Superset dashboard embed plugin under `integrations/src/plugins/superset` exposing the **exact same** `DashboardEmbedPlugin` API as Kibana. The "plugin" is a patch-and-build strategy: Decaf holds patch scripts (Python + Bash) that modify Superset's internal `embedded/index.tsx` and `superset-embedded-sdk/src/index.ts`, plus build scripts that compile the patched SDK + frontend and optionally produce a Docker image. `install` materializes the scripts, clones/uses Superset source, applies patches, and builds.

## 2. Objectives
*   [ ] `SupersetDashboardEmbedPlugin implements DashboardEmbedPlugin` with same API as Kibana.
*   [ ] `templates.ts` holds all patch + build scripts as string templates (apply_superset_6_1_patch.py, verify_patch.sh, build-sdk.sh, build-superset-frontend.sh, patch-and-build.sh, build-docker-image.sh).
*   [ ] `buildEmbedUrl` produces a Superset embedded URL (`${host}/${basePath}/embedded/${embeddedId}`).
*   [ ] `sendSwitchDashboardMessage` delegates to `target.switchDashboard(dashboardId, guestToken)` (Superset SDK handle).
*   [ ] `install` materializes scripts, and when `build: true` clones/patches/builds Superset + optionally builds Docker image.
*   [ ] Same message protocol/host helper API as Kibana.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `superset/{index,types,manifest,templates,installer,host}.ts`.
*   Templates hold the full reference patch/build scripts from DECAF-40 §9.

**Technical Details:**
*   Throw `UnsupportedError`/`InternalError` from Decaf error types.
*   `install` accepts `supersetSourcePath` (existing checkout) or clones via git.
*   `install` accepts `dockerImageTag` to build a Docker image.
*   The patched SDK must be packed and installed into Angular (documented).

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit: `tests/unit/plugins/superset.test.ts` — manifest, url, message, install writes scripts.
*   [ ] E2e (Playwright): `tests/e2e/plugins/superset.visual.test.ts` — visual screenshot validation (requires live Superset).

## 5. Blockers & Clarifications
*   **Clarification 1:** Superset has no Kibana-style plugin system. Answer: patch-and-build strategy modifies internal source files.
*   **Clarification 2:** `guestToken` field added to shared `SwitchDashboardPayload`; Kibana ignores it, Superset uses it.

## 6. Execution Log
*   [Date] - Started task.
