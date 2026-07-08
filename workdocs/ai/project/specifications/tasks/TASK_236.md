# TASK-236: GraphAutoSaveService — Debounced Mutation Listener

**ID:** TASK-236
**Specification:** [DECAF-36](../DECAF_36.md)
**Priority:** High
**Status:** Completed

## 1. Description
Create a `@service()`-decorated `GraphAutoSaveService` that listens to workflow mutations, debounces them (configurable, default 500ms), and calls `GraphSaveService.save()`. Includes an `enabled` flag bound to the Auto-Save toggle UI and a `flush()` method for immediate save on page unload.

## 2. Objectives
*   [ ] Implement `GraphAutoSaveService` in `for-angular/src/graph/services/GraphAutoSaveService.ts`.
*   [ ] `enabled` signal bound to the Auto-Save toggle.
*   [ ] `onMutation(workflowId, snapshot)` — debounced call to `GraphSaveService.save()`.
*   [ ] `flush()` — cancels debounce timer and saves immediately.
*   [ ] Configurable debounce via `GRAPH_AUTOSAVE_DEBOUNCE_MS` token (default 500ms).
*   [ ] No-op when `enabled === false`.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-angular/src/graph/services/GraphAutoSaveService.ts`.
*   Create `GRAPH_AUTOSAVE_DEBOUNCE_MS` token in `for-angular/src/graph/tokens/graph-configuration.tokens.ts`.
*   Register provider in `for-angular/src/graph/for-angular-graph.module.ts`.

**Technical Details:**
*   Use Angular signals for `enabled` state.
*   Debounce via `setTimeout`/`clearTimeout` or RxJS `debounceTime` (if mutation source is an Observable).
*   `@service()` from `@decaf-ts/core`.
*   Frontend-safe only.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-angular/tests/graph/GraphAutoSaveService.test.ts` — debounce timing, enabled/disabled, flush, no-op when disabled.

**Manual Verification:**
*   Toggle auto-save on, drag a node, verify debounced save fires after 500ms.

## 5. Blockers & Clarifications
*   Depends on TASK-235 (GraphSaveService).

## 6. Execution Log
*(empty)*
