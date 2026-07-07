# TASK-232: Migrate in-browser demo executors to SSE backend

**ID:** TASK-232
**Specification:** [DECAF-35](../DECAF_35.md)
**Priority:** High
**Status:** Done

## 1. Description
The for-angular demo imported `GraphExecutionEngine`, loop executors, and `GraphNodeExecutorRegistry` directly into the browser bundle. This violated the frontend/backend boundary. Migrated the graph page to the NestJS SSE backend (Option A): `GraphExecutionService` now posts the workflow to `POST /graph/execute` and streams events over `GET /graph/events` via `ServerEventConnector`. Deleted the in-browser demo executors and the RxJS observer bridge.

## 2. Objectives
* [x] Move `GraphExecutionEvent` and `GraphExecutionErrorPayload` to `integrations/src/graph/shared/types.ts` (pure data contracts consumed by the frontend via SSE).
* [x] Re-export the two types from `engine/types.ts` so engine modules keep a single import surface.
* [x] Repoint `GraphExecutionStateMapper.ts` to import `GraphExecutionEvent` from `@decaf-ts/integrations/graph/shared`.
* [x] Rewrite `GraphExecutionService` to use `fetch POST /graph/execute` + `ServerEventConnector` on `/graph/events` — no engine import.
* [x] Delete `graph-demo-executors.ts` and `GraphExecutionEventSubjectObserver.ts`.
* [x] Add `GRAPH_BACKEND_URL` injection token (default `http://localhost:3000`).
* [x] Update `graph.page.ts`: remove `createDemoEngineConfig` / `GRAPH_EXECUTION_ENGINE_CONFIG`, provide only `GraphExecutionService`.
* [x] Update `execution/index.ts` barrel: remove deleted exports.
* [x] Remove the temporary ESLint override from TASK-231 (no files need it anymore).
* [x] Production source contains no `GraphExecutionEngine`, executor, or registry code.
* [x] `npm run lint`, `npx tsc --noEmit`, `npx jest` in for-angular all pass.
* [x] `npm run build` and `npx jest` in integrations all pass; no circular imports.

## 3. Implementation Plan
**Changes Made (Option A — SSE migration):**
* `integrations/src/graph/shared/types.ts` — added `GraphExecutionEvent` and `GraphExecutionErrorPayload` (frontend-safe data contracts).
* `integrations/src/graph/engine/types.ts` — removed duplicate declarations, re-exports from `../shared/types`, imports for local use.
* `for-angular/src/graph/execution/GraphExecutionStateMapper.ts` — repointed import to `@decaf-ts/integrations/graph/shared`.
* `for-angular/src/graph/execution/GraphExecutionService.ts` — rewritten: `fetch POST /graph/execute`, `ServerEventConnector.open` on `/graph/events`, `parseEvent` deserialises SSE payload back to `GraphExecutionEvent`, RxJS `Subject` emits events, auto-teardown on terminal workflow events. Added `GRAPH_BACKEND_URL` injection token.
* `for-angular/src/graph/execution/graph-demo-executors.ts` — **deleted**.
* `for-angular/src/graph/execution/GraphExecutionEventSubjectObserver.ts` — **deleted**.
* `for-angular/src/graph/execution/index.ts` — removed deleted exports.
* `for-angular/src/app/pages/graph/graph.page.ts` — removed `createDemoEngineConfig` / `GRAPH_EXECUTION_ENGINE_CONFIG`; `execute()` now returns `{ status, outputs }` (no full `GraphExecutionResult`).
* `for-angular/eslint.config.mjs` — removed the temporary override block (no files need it).

**Technical Details:**
* The SSE endpoint serialises events as `[modelName, operation, id, payload]` tuples. The `id` field is the `runId`; the `payload` contains the full event fields with `timestamp` as an ISO string. `GraphExecutionService.parseEvent` converts `timestamp` back to a `Date`.
* `ServerEventConnector` is a cached singleton per URL — calling `open` with the same URL returns the existing connector. The listener is removed on terminal workflow events (`workflow.completed` / `workflow.failed` / `workflow.cancelled`).
* Pin/unpin operations are not exposed over the current NestJS endpoints; the service no longer exposes them. The `pinNode` method on `graph-node-template.component.ts` is a local UI toggle (not the engine pin).
* `GRAPH_BACKEND_URL` is `providedIn: 'root'` with a factory default of `http://localhost:3000`; consumers override via providers in app config.

## 4. Verification Plan
**Automated Tests:**
* [x] `npm run build` in integrations — passes.
* [x] `npx jest` in integrations — 101 tests pass.
* [x] `npm run lint` in for-angular — 0 errors.
* [x] `npx tsc --noEmit` in for-angular — 0 graph-related errors.
* [x] `npx jest` in for-angular — 42 tests pass.

**Manual Verification:**
* [x] `grep -rn "GraphExecutionEngine\|ForeachGraphNodeExecutor\|...` in for-angular `src/` — 0 matches outside `node_modules`/`.spec.`.
* [x] `grep -rn "from '@decaf-ts/integrations/graph'"` in for-angular `src/` — 0 matches (all production imports use `/shared`).
* [x] ESLint boundary catches violations (re-tested by reverting a production import).
* [x] `madge --circular` on `shared/` and `engine/` — no circular dependencies.

## 5. Blockers & Clarifications
* None. Option A was chosen by the user. The NestJS `GraphExecutionController` (`POST /graph/execute`, `GET /graph/events`) and `ServerEventConnector` (for-http) were already built and tested.

## 6. Execution Log
* Moved `GraphExecutionEvent` + `GraphExecutionErrorPayload` to shared types; re-exported from engine.
* Rewrote `GraphExecutionService` as an SSE-backed client; deleted demo executors and observer bridge.
* Updated graph page to provide `GraphExecutionService` only; removed temporary ESLint override.
* All builds, lints, and tests green across integrations and for-angular.
