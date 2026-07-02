# TASK-211: Event Observer/Emitter/Factory and Executor Interface/Registry

**ID:** TASK-211
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add the event pipeline (`GraphExecutionObserver`, `GraphExecutionEventEmitter`, `GraphExecutionEventFactory`), the `GraphNodeExecutor` interface, and the `GraphNodeExecutorRegistry`. These components let the engine emit structured events through Decaf's `Observable` pipeline and resolve executors by node kind.

## 2. Objectives
*   [ ] Add `GraphExecutionObserver` extending Decaf's `Observer` with `refresh(event)`.
*   [ ] Add `GraphExecutionEventEmitter` implementing Decaf's `Observable`, with `observe`, `unObserve`, and `updateObservers` (awaiting async observers).
*   [ ] Add `GraphExecutionEventFactory` producing event id, sequence number, and timestamp.
*   [ ] Add `GraphNodeExecutor` interface (`execute(input, context)`).
*   [ ] Add `GraphNodeExecutorRegistry` with `register`, `unregister`, `has`, `resolve` (throwing `GraphExecutionError` on missing executor).
*   [ ] Wire `src/graph/events/index.ts` and `src/graph/registry/index.ts` and update `src/graph/index.ts`.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `src/graph/events/GraphExecutionObserver.ts`, `GraphExecutionEventEmitter.ts`, `GraphExecutionEventFactory.ts`, `index.ts`.
*   Create `src/graph/execution/GraphNodeExecutor.ts`.
*   Create `src/graph/registry/GraphNodeExecutorRegistry.ts`, `GraphNodeExecutorResolver.ts`, `index.ts`.
*   Update `src/graph/index.ts` to export the new public APIs.

**Technical Details:**
*   Match the actual Decaf `Observer`/`Observable` method names from `../../interfaces/Observer` and `../../interfaces/Observable`.
*   Observer failure must not crash execution (isolate observer errors).
*   `GraphExecutionEventFactory` should use `globalThis.crypto?.randomUUID?.()` with a stable fallback.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/graph/GraphExecutionEventEmitter.test.ts`
*   [ ] Unit Test: `tests/unit/graph/GraphExecutionEventFactory.test.ts`
*   [ ] Unit Test: `tests/unit/graph/GraphNodeExecutorRegistry.test.ts`

**Manual Verification:**
*   Confirm observers receive ordered events and async observers are awaited.
*   Confirm `resolve` throws a structured `GraphExecutionError` for unknown kinds.

## 5. Blockers & Clarifications
*   **Clarification 1:** Exact `Observer`/`Observable` method names in core — match the actual interfaces at implementation time.

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
