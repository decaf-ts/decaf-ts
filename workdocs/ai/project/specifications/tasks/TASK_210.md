# TASK-210: Core Graph Scaffolding (Constants, Types, Errors, GraphExecutionContext)

**ID:** TASK-210
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Pending

## 1. Description
Create the foundational `src/graph` area in `@decaf-ts/core`: `constants.ts`, `types.ts`, `decorators.ts`, the structured error classes, and `GraphExecutionContext` which must extend Decaf's `Context` abstraction (mirroring the `TaskEngine`/`TaskContext` pattern). This task establishes the contract every subsequent graph task depends on.

## 2. Objectives
*   [ ] Add `src/graph/constants.ts` with `GRAPH_WORKFLOW_BOUNDARY`, default concurrency/loop limits, `GRAPH_PINNING_METADATA_KEY`, `GraphExecutionStatus`, and `GraphExecutionEventType`.
*   [ ] Add `src/graph/types.ts` with `GraphRunId`, `GraphWorkflowId`, `GraphNodeId`, `GraphPortName`, `GraphExecutionValues`, `GraphExecutionOptions`, `GraphExecutionErrorPayload`, `GraphExecutionEvent`, `GraphNodeExecutionResult`, `GraphExecutionResult`, `GraphExecutionContextOptions`.
*   [ ] Add structured error classes extending `GraphExecutionError`: `GraphCycleError`, `GraphInputError`, `GraphLoopLimitError`, `GraphPinningError`, `GraphPortError`, `GraphStoreError`, `GraphTopologyError`.
*   [ ] Add `GraphExecutionContext` extending Decaf `Context` with `emit`, `progress`, and `log` methods, mirroring `TaskContext` constructor/usage patterns.
*   [ ] Add `src/graph/index.ts` exporting public APIs explicitly (specific-file imports only).

## 3. Implementation Plan
**Proposed Changes:**
*   Create `src/graph/constants.ts`, `src/graph/types.ts`, `src/graph/decorators.ts`, `src/graph/index.ts`.
*   Create `src/graph/errors/*.ts` (one class per file) and `src/graph/errors/index.ts`.
*   Create `src/graph/execution/GraphExecutionContext.ts`.
*   Re-export the graph API from the module entrypoint per existing module conventions.

**Technical Details:**
*   Use `Context` from `../../Context` (or the core-internal path used by `TaskContext`).
*   Follow the one-class-per-file convention from the constitution.
*   Specific-file imports only internally; no folder/index imports internally except external package entrypoints.
*   Do not introduce Angular, RxJS, or Mastra dependencies.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/graph/constants.test.ts`
*   [ ] Unit Test: `tests/unit/graph/errors.test.ts`
*   [ ] Unit Test: `tests/unit/graph/GraphExecutionContext.test.ts`

**Manual Verification:**
*   Confirm `GraphExecutionContext` extends `Context` and `emit`/`progress`/`log` work as expected.
*   Confirm `npm run build` and `npm run lint` pass in the core module.

## 5. Blockers & Clarifications
*   **Clarification 1:** Exact `Context` constructor signature in core — will mirror `TaskContext` at implementation time.
*   **Clarification 2:** Whether `decorators.ts` should stay empty for now (reserved for future core-level graph decorators) — yes, reserve it.

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
