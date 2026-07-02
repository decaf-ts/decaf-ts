# TASK-224: NestJS Graph Execution Backend (for-nest + integrations + RamAdapter)

**ID:** TASK-224
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md) — §18/§19
**Priority:** High
**Status:** Pending

## 1. Description
Create a NestJS module that hosts the `GraphExecutionEngine` server-side, exposes REST endpoints for triggering execution and retrieving persisted results, and streams execution events via SSE. Use RamAdapter for persistence of execution results and pinned values. This module serves as the "supplier" in the production pipeline — for-angular consumes it via the for-http adapter.

## 2. Objectives
*   [x] Create `GraphExecutionModule` for for-nest (in `integrations/src/nest/graph/`).
*   [x] Create `GraphExecutionController` with:
    *   `POST /graph/execute` — accepts `{ workflow, inputs }`, triggers `GraphExecutionEngine.execute()`, returns `{ runId, status, outputs }`.
    *   `GET /graph/events` — SSE endpoint streaming `GraphExecutionEvent`s via `@Sse()`, serialized as `[modelName, operation, id, payload]` (matching for-http's `ServerEventConnector` format).
    *   `GET /graph/results/:runId` — retrieves a persisted `GraphExecutionResult` from RamAdapter.
*   [x] Create `GraphExecutionResultModel` (Decaf `Model`) that serializes a `GraphExecutionResult` for storage.
*   [x] Create `GraphExecutionResultRepository` (Decaf `Repository`) backed by RamAdapter.
*   [x] After each successful execution, persist the result via the repository.
*   [x] Register demo executors (`math.add`, `math.multiply`) and the publishing workflow node executors.
*   [x] Wire RamAdapter as the server-side persistence adapter.

## 3. Implementation Plan
**Proposed Changes:**
*   Add `integrations/src/nest/graph/` directory with:
    *   `GraphExecutionModule.ts` — NestJS `DynamicModule` that wires the controller, engine, registry, and RamAdapter.
    *   `GraphExecutionController.ts` — REST + SSE controller.
    *   `GraphExecutionResultModel.ts` — Decaf model for persisted results.
    *   `GraphExecutionResultRepository.ts` — Repository for result persistence.
    *   `GraphExecutorRegistryFactory.ts` — Factory that registers all known executors.
    *   `index.ts` — Barrel export.
*   Re-export from `integrations/src/nest/index.ts`.

**Technical Details:**
*   The SSE endpoint must use `@Sse()` from `@nestjs/common` and return an `Observable<MessageEvent>`.
*   Events must be serialized as `[modelName, operation, id, payload]` to match `ServerEventConnector.parseReceivedEvent()`.
*   The `GraphExecutionResultModel` must store: `runId` (PK), `workflowId`, `status`, `inputs`, `outputs`, `nodeResults`, `startedAt`, `finishedAt`.
*   RamAdapter must be configured with `{ user: "graph-engine" }` and decorated via `RamAdapter.decoration()`.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit test: controller executes workflow and returns correct result.
*   [x] Unit test: SSE endpoint emits events in correct order.
*   [x] Unit test: persisted result is retrievable via repository.

**Manual Verification:**
*   Boot the NestJS app, curl `POST /graph/execute`, and `GET /graph/events` to validate the live pipeline.

## 5. Blockers & Clarifications
*   Depends on TASK-222 (tests) for verified engine behavior.
*   The existing `GraphExecutionController` in `tests/e2e/graph/` is a test fixture — this task promotes it to a proper module in `src/nest/graph/`.

## 6. Execution Log
*   [pending] - Task created during DECAF-32 Phase 2 specification.
