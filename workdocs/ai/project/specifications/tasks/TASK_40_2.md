# DECAF-40-2: Kibana embed plugin (manifest, templates, installer, host helpers)

**ID:** DECAF-40-2
**Specification:** [Link to Specification](../DECAF_40.md)
**Priority:** High
**Status:** Completed

## 1. Description
Implement the Kibana dashboard embed plugin under `integrations/src/plugins/kibana`: manifest builder, version-parameterized source templates (the reference plugin), installer that materializes files into a target directory and optionally builds, plus host helpers (embed URL builder + DOM-free switch-dashboard message sender).

## 2. Objectives
*   [ ] `buildKibanaManifest(targetVersion)` producing `kibana.json`.
*   [ ] Version-parameterized template strings for all reference plugin files.
*   [ ] `KibanaDashboardEmbedPlugin implements DashboardEmbedPlugin` with `install` (write + optional `yarn build`).
*   [ ] `buildEmbedUrl` and `createSwitchDashboardMessage`/`sendSwitchDashboardMessage`.
*   [ ] Kibana build should also produce a distributable artifact (archive) or Docker image when requested.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `kibana/{index,types,manifest,templates,installer,host}.ts`.

**Technical Details:**
*   Throw Decaf errors (`InternalError`/`UnsupportedError`).
*   `install({ build: true })` spawns `yarn build` best-effort; documented that real builds need the Kibana repo.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit: `tests/unit/plugins/kibana.test.ts` — manifest, url, message, install writes files.

## 5. Blockers & Clarifications
*   **Clarification 1:** Does `install` need to actually build? Answer: best-effort `yarn build` when `build:true`; real builds require Kibana repo.

## 6. Execution Log
*   [Date] - Started task.
