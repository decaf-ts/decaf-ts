# TASK-235: GraphSaveService + Backend PUT /graph/workflow/:id Endpoint

**ID:** TASK-235
**Specification:** [DECAF-36](../DECAF_36.md)
**Priority:** High
**Status:** Completed

## 1. Description
Create a `@service()`-decorated `GraphSaveService` in `for-angular` that sends the full graph snapshot to a new backend `PUT /graph/workflow/:id` endpoint in the NestJS graph module. The endpoint persists the snapshot using the existing adapter (RamAdapter or configured).

## 2. Objectives
*   [ ] Implement `GraphSaveService` in `for-angular/src/graph/services/GraphSaveService.ts` with `save(workflowId, snapshot, ...args)` and `isSaving()` signal.
*   [ ] Add `PUT /graph/workflow/:id` endpoint to NestJS graph controller (`integrations/src/nest/graph/`).
*   [ ] Endpoint accepts `GraphSnapshot` JSON body and persists via existing repository/adapter.
*   [ ] Loading indicator support (`isSaving()` signal for UI).
*   [ ] Error handling: Decaf `BaseError` subclasses only.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-angular/src/graph/services/GraphSaveService.ts`.
*   Extend `integrations/src/nest/graph/GraphExecutionController.ts` (or new `GraphWorkflowController`) with `@Put(':id')` method.
*   Add workflow persistence model if needed (or reuse existing graph snapshot model from DECAF-32 TASK-224).

**Technical Details:**
*   Use `for-http` `HttpAdapter` for the frontend→backend call (existing pattern in for-angular).
*   `@service()` from `@decaf-ts/core` per Constitution §2.
*   Context propagation: `...args: MaybeContextArgs` on save method.
*   Reuse `GraphSnapshot` type from `@decaf-ts/integrations/graph/shared`.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-angular/tests/graph/GraphSaveService.test.ts` — save call, isSaving state, error handling.
*   [ ] Integration Test: `integrations/tests/nest/graph/` — PUT endpoint persists and retrieves snapshot.

**Manual Verification:**
*   Click Save button, verify network request, verify snapshot persisted on reload.

## 5. Blockers & Clarifications
*   **Q:** Does the existing NestJS graph module already have a persistence model for workflow snapshots, or do we need a new one? (Check DECAF-32 TASK-224 implementation.)

## 6. Execution Log
*(empty)*
