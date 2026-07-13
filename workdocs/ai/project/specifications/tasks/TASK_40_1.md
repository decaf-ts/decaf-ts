# DECAF-40-1: Shared DOM-free DashboardEmbedPlugin contract

**ID:** DECAF-40-1
**Specification:** [Link to Specification](../DECAF_40.md)
**Priority:** High
**Status:** Completed

## 1. Description
Define the shared, DOM-free contract (`contract.ts`) that both the Kibana and Superset plugins implement with the exact same API: message protocol constants/types, embed URL options, install options/result, plugin descriptor, and the `DashboardEmbedPlugin` interface.

## 2. Objectives
*   [ ] Message protocol constants + message types (switch/ready/rendered/error).
*   [ ] DOM-free `EmbedMessageTarget` (postMessage shape) so Node builds without DOM libs.
*   [ ] `DashboardEmbedPlugin` interface implemented identically by both plugins.
*   [ ] Generic `targetVersion` (no tool-specific version keys) to guarantee API parity.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `integrations/src/plugins/contract.ts`.
*   Create `integrations/src/plugins/index.ts` aggregator re-exporting contract + both plugins.

**Technical Details:**
*   Keep DOM-free (no `window`/`HTMLIFrameElement`).
*   Re-export the contract from each tool subpath.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit: `tests/unit/plugins/contract.test.ts` — constants/types compile and round-trip.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [Date] - Started task.
