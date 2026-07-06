# TASK-226: Full-Stack E2E Test (for-nest supplier → for-http adapter → for-angular consumer)

**ID:** TASK-226
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md) — §19
**Priority:** High
**Status:** Completed

## 1. Description
Create a dedicated full-stack e2e test that boots an actual NestJS backend (using `@decaf-ts/for-nest` and `@decaf-ts/integrations` graph engine) as the supplier, uses for-http's `ServerEventConnector` as the client consumer, and validates the complete production communication pipeline: HTTP-triggered execution → SSE event streaming → RamAdapter persistence retrieval.

## 2. Objectives
*   [x] Boot a real NestJS application with `GraphExecutionModule` (from TASK-224) using `@nestjs/testing`.
*   [x] Configure RamAdapter as the server-side persistence adapter.
*   [x] Use `ServerEventConnector` from `@decaf-ts/for-http` as the SSE client (the same class for-angular uses in production).
*   [x] Use `supertest` for HTTP POST to trigger execution.
*   [x] Validate: HTTP execute returns correct result (`{ runId, status, outputs }`).
*   [x] Validate: SSE events arrive in correct order (`workflow.started` → `workflow.planned` → `node.started` → `node.completed` → `edge.valueRouted` → `workflow.completed`).
*   [x] Validate: `runId` from HTTP response matches `runId` in all SSE events.
*   [x] Validate: SSE events have monotonically incrementing sequence numbers.
*   [x] Validate: `workflow.completed` event payload contains correct output values after JSON serialization through SSE.
*   [x] Validate: `GET /graph/results/:runId` retrieves the full persisted result from RamAdapter.
*   [x] Validate: error scenario — invalid workflow (missing executor) produces `workflow.failed` event with error payload.
*   [x] Validate: multiple runs with different inputs produce separate runIds, separate persisted results, and correct outputs.
*   [x] Validate: SSE connection cleanup (no open handles after test suite).

## 3. Implementation Plan
**Proposed Changes:**
*   Create `integrations/tests/e2e/graph/full-stack.e2e.test.ts`.
*   The test file will:
    *   Create a NestJS testing module with `GraphExecutionModule` and RamAdapter.
    *   Start the app on a random port (`app.listen(0)`).
    *   Open a `ServerEventConnector` to `/graph/events`.
    *   For each test: POST to `/graph/execute`, wait for SSE events, assert.
    *   After all tests: close SSE connector, close NestJS app.
*   Promote the existing `GraphExecutionController` test fixture to use the proper `GraphExecutionModule` from TASK-224.

**Technical Details:**
*   Use `NODE_OPTIONS="--experimental-vm-modules"` for ESM jest support.
*   Import `jest`, `describe`, `beforeAll`, `afterAll`, `it`, `expect` from `@jest/globals`.
*   Use `jest.setTimeout(60000)` for the full suite (NestJS boot + SSE + HTTP).
*   The SSE event wait pattern: poll `receivedEvents` array every 100ms until `workflow.completed` arrives, with a 5s timeout.
*   Clean up: `removeListener()` first, then `connector.close(true)`, then `app.close()`.
*   RamAdapter state must be reset between test suites (or use unique runIds).

## 4. Verification Plan
**Automated Tests:**
*   [x] `full-stack.e2e.test.ts` with all scenarios listed in §2.

**Manual Verification:**
*   Run `npm run test:e2e` in integrations and confirm all graph e2e tests pass.

## 5. Blockers & Clarifications
*   Depends on TASK-224 (NestJS `GraphExecutionModule`) for the server-side module.
*   Depends on TASK-225 (for-angular graph page) for the `GraphExecutionResultModel`/repository pattern.
*   The existing `graph-execution.e2e.test.ts` (from Phase 1) will be superseded by this more comprehensive test.

## 6. Execution Log
*   [completed] - Created `integrations/tests/e2e/graph/full-stack.e2e.test.ts` with 9 test scenarios covering all 13 objectives from §2.
*   [completed] - Uses `GraphExecutionModule.forRoot()` (from TASK-224) via `@nestjs/testing` — the proper production module, not the test fixture.
*   [completed] - Uses `ServerEventConnector` from `@decaf-ts/for-http` as the SSE client (same class for-angular uses in production).
*   [completed] - Uses `supertest` for HTTP POST to trigger execution and GET to retrieve persisted results.
*   [completed] - Validates: HTTP execute returns `{ runId, status, outputs }` with correct values.
*   [completed] - Validates: SSE events arrive in correct order (workflow.started → workflow.planned → node.started → node.completed → edge.valueRouted → workflow.completed).
*   [completed] - Validates: `runId` from HTTP response matches `runId` in all SSE events.
*   [completed] - Validates: SSE events have monotonically incrementing sequence numbers.
*   [completed] - Validates: `workflow.completed` event payload contains correct output values after JSON serialization through SSE.
*   [completed] - Validates: `GET /graph/results/:runId` retrieves the full persisted result from RamAdapter.
*   [completed] - Validates: error scenario — invalid workflow (missing executor `nonexistent.executor`) produces `workflow.failed` event with error payload containing the executor name.
*   [completed] - Validates: multiple runs with different inputs produce separate runIds, separate persisted results, and correct outputs.
*   [completed] - Validates: SSE connection cleanup — no open handles reported by `--detectOpenHandles`.
*   [completed] - All 116 graph tests pass (102 original + 5 TASK-224 unit tests + 9 TASK-226 e2e tests). Lint clean.
