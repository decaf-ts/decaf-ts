# DECAF-40-4: Package exports, README, and unit tests for both plugins

**ID:** DECAF-40-4
**Specification:** [Link to Specification](../DECAF_40.md)
**Priority:** High
**Status:** Completed

## 1. Description
Wire the new plugin surface into `integrations/package.json` as named subpath exports (`./plugins`, `./plugins/kibana`, `./plugins/superset`), update the README, and add unit tests covering contract parity, URL building, message creation, and install file materialization for both plugins.

## 2. Objectives
*   [ ] Subpath exports added and build produces `lib/esm`, `lib/cjs`, `lib/types`.
*   [ ] README documents the new exports.
*   [ ] Unit tests pass; `npm run lint` and `npm run build` clean.

## 3. Implementation Plan
**Proposed Changes:**
*   Update `integrations/package.json` exports.
*   Update `integrations/README.md`.
*   Add `tests/unit/plugins/` tests.

## 4. Verification Plan
**Automated Tests:**
*   [ ] `npm run lint`, `npm run build`, `npm run test:unit` in `integrations`.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [Date] - Started task.
