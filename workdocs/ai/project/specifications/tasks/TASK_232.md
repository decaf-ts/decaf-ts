# TASK-232: Quarantine or migrate in-browser demo executors

**ID:** TASK-232
**Specification:** [DECAF-35](../DECAF_35.md)
**Priority:** High
**Status:** Pending

## 1. Description
The for-angular demo currently imports `GraphExecutionEngine`, `ForeachGraphNodeExecutor`, `WhileGraphNodeExecutor`, `UntilGraphNodeExecutor`, and `GraphNodeExecutorRegistry` directly into the browser bundle via `graph-demo-executors.ts`, `GraphExecutionService.ts`, and `GraphExecutionEventSubjectObserver.ts`. This violates the frontend/backend boundary. Either migrate the graph page to the NestJS SSE backend (TASK-224/226) or quarantine the demo executors to a dev-only entry excluded from the production bundle.

## 2. Objectives
* [ ] Decide Option A (migrate to SSE) vs Option B (quarantine) — ask the user.
* [ ] **Option A:** Rewrite `GraphExecutionService` to call `POST /graph/execute` and stream `/graph/events` via `ServerEventConnector`. Delete `graph-demo-executors.ts` and `GraphExecutionEventSubjectObserver.ts`. Remove the temporary ESLint override from TASK-231.
* [ ] **Option B:** Move demo files to `for-angular/src/graph/execution-dev/`. Add ESLint override for that directory. Configure `angular.json` production build to exclude it. Verify production bundle has no engine code.
* [ ] Production bundle contains no `GraphExecutionEngine`, executor, or registry code.

## 3. Implementation Plan
**Proposed Changes (Option A — preferred):**
* Rewrite `GraphExecutionService.execute(workflow)` to:
  1. `POST /graph/execute` with the workflow definition → receive `{ runId }`.
  2. Open `ServerEventConnector` on `/graph/events` filtered by `runId`.
  3. Map SSE events to the existing RxJS `Observable<GraphExecutionEvent>` API (reuse `GraphExecutionStateMapper`).
  4. Complete the observable on `workflow.completed` / `workflow.failed`.
* Delete `for-angular/src/graph/execution/graph-demo-executors.ts`.
* Delete `for-angular/src/graph/execution/GraphExecutionEventSubjectObserver.ts`.
* Remove the temporary ESLint override from TASK-231.
* Add a backend URL config (default `http://localhost:3000`) to the graph page.
* Update the graph page e2e to boot a NestJS backend before running.

**Proposed Changes (Option B — fallback):**
* `git mv for-angular/src/graph/execution/{graph-demo-executors,GraphExecutionService,GraphExecutionEventSubjectObserver}.ts for-angular/src/graph/execution-dev/`.
* Add ESLint override for `for-angular/src/graph/execution-dev/**` allowing `@decaf-ts/integrations/graph`.
* In `angular.json` production config, exclude `src/graph/execution-dev/**` from the build (or lazy-load it behind a dev-only route).
* Remove the temporary ESLint override from TASK-231 for the old paths.

**Technical Details:**
* Option A reuses the NestJS `GraphExecutionModule` (TASK-224) and `ServerEventConnector` (TASK-226) — both already built and tested.
* Option B keeps the demo working in dev mode but the graph page won't execute in production without a backend.
* `GraphExecutionStateMapper` (pure event → UI state) stays in production code either way — it imports only `GraphExecutionEventType` from `./shared`.

## 4. Verification Plan
**Automated Tests:**
* [ ] `npm run build` in for-angular — production build succeeds.
* [ ] `npm run test` in for-angular — tests pass.
* [ ] (Option A) e2e against a live NestJS backend — graph page executes a workflow via SSE.

**Manual Verification:**
* Inspect `for-angular/www/` production bundle for `GraphExecutionEngine`, `ForeachGraphNodeExecutor`, `WhileGraphNodeExecutor`, `UntilGraphNodeExecutor`, `GraphNodeExecutorRegistry` — none should appear (grep the bundled JS).
* (Option A) Graph page runs a workflow and shows real-time node state from SSE.
* (Option B) Graph page works in `ng serve` (dev) but the production build has no engine code.

## 5. Blockers & Clarifications
* **Clarification:** Option A vs Option B? Default to Option A if TASK-224/226 are stable. Ask the user before implementing.
* Depends on TASK-231 (the lint boundary must be in place).

## 6. Execution Log
* (pending)
