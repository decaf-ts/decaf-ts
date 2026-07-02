# TASK-220: Angular RxJS Bridge, Execution Service, and Execution UI State

**ID:** TASK-220
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add the Angular execution bridge in `for-angular/src/graph/execution`: `GraphExecutionEventSubjectObserver` (RxJS `Subject` bridge implementing `GraphExecutionObserver`), `GraphExecutionService` (Angular `@Injectable()` wrapping `GraphExecutionEngine` and exposing `events$`), and execution UI state types for nodes/edges/loops/cache/pin. The renderer maps graph events to UI state.

## 2. Objectives
*   [ ] Add `GraphExecutionEventSubjectObserver` bridging `GraphExecutionEvent` to an RxJS `Subject`.
*   [ ] Add `GraphExecutionService` with `events$` observable, `execute(workflow, inputs, options)`, and `pinNode(options)` (delegating to pinning service).
*   [ ] Add execution UI state types: `GraphNodeUiExecutionState`, `GraphEdgeUiExecutionState` (with loop, cache, pin fields).
*   [ ] Map graph events to renderer state: `NODE_STARTED` -> running, `EDGE_VALUE_ROUTED` -> active, `NODE_CACHE_HIT` -> cached, `NODE_COMPLETED` -> succeeded, `NODE_FAILED` -> failed, `NODE_PINNED`/`NODE_UNPINNED` -> pinned state, `LOOP_*` -> iteration state, `WORKFLOW_COMPLETED` -> outputs.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-angular/src/graph/execution/GraphExecutionService.ts`, `GraphExecutionEventSubjectObserver.ts`, `index.ts`.
*   Add `for-angular/src/graph/types.ts` execution state types (or extend existing graph types).
*   Wire the renderer to subscribe to `events$` and update node/edge/loop state.

**Technical Details:**
*   RxJS lives only in `for-angular`; core must not depend on RxJS.
*   If pinning is not exposed directly on the engine, inject/use `GraphPinningService` from the Angular service.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-angular/src/graph/execution/GraphExecutionService.spec.ts`
*   [ ] Unit Test: `for-angular/src/graph/execution/GraphExecutionEventSubjectObserver.spec.ts`

**Manual Verification:**
*   Confirm `events$` emits execution events and the renderer updates node/edge/loop state.

## 5. Blockers & Clarifications
*   Depends on TASK-214 (engine) for execution and event emission.

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
