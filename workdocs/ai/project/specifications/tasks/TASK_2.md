# TASK-2: Worker Task Service & Pool

**ID:** TASK-2
**Specification:** [Link to Specification](../DECAF_1.md)
**Priority:** High
**Status:** In Progress — configuration surface exists but lacks automated coverage/documentation.

## 1. Description
Extend `TaskService` with a configurable worker pool so the service can boot worker-thread executors, keep a single TaskEngine instance in the main thread, and expose the same CRUD/tracking APIs while the heavy handler work runs out-of-process.

## 2. Objectives
*   [ ] Add configuration options for enabling a worker pool (`workerPool: { size?: number; mode?: "node" | "browser"; }`) and pass them through during service initialization.
*   [ ] Implement a `WorkerPoolManager` that launches/terminates workers, listens for their event/log progress messages, and replays them via the host TaskEngine’s `TaskEventBus`/`TaskTracker`.
*   [ ] Keep all service hooks (create, push, start, stop) working by routing only the handler execution to workers while the TaskEngine continues to orchestrate leasing, persistence, and status transitions.

## 3. Implementation Plan
**Proposed Changes:**
*   Keep `TaskService` as the only service surface; it now wires the single `TaskEngine` plus optional worker pool by forwarding the `workerPool` configuration down to the engine.
*   Delete the `WorkerTaskService` export and update imports/tests so consumers rely solely on `TaskService`.
*   Provide a simple `TaskWorkerPoolOptions` shape that TaskService injects into the engine config, ensuring all worker lifecycle, messaging, and shutdown logic lives in the engine—not the service.
*   Update service initialization/shutdown hooks to start and stop the engine (and thus the pool) without duplicating worker orchestration logic.

**Technical Details:**
*   The service constructor continues to accept the TaskEngine config; `initialize` now asserts that any `workerPool` config also includes a `workerAdapter` descriptor so workers know how to instantiate persistence.
*   Remove cross-service worker event bus plumbing; TaskService simply consumes the engine’s `TaskEventBus` as before while the engine reports worker-emitted events internally.
*   Extend the TaskService tests to verify the no-worker and worker-enabled modes share the same API surface and that the repository interactions remain unchanged.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration test where the service boots with `workerPool.size = 2` and multiple tasks complete with event logs observable from the main thread.
*   [ ] Test that `TaskService.stop()` waits for all worker threads to confirm shutdown (simulate via message acknowledgements).

**Manual Verification:**
*   1. Deploy the workers in development and confirm `npx decaf task push` still resolves trackers even if actual processing is handled by workers.
*   2. Monitor logs to ensure worker-specific identifiers appear and correlate with recorded task events.

## 5. Blockers & Clarifications
*   **Blocker:** Need to decide whether worker threads will share the filesystem/adapter instances or create new connections per worker; connection heavy adapters may need pooling.
*   **Clarification:** Determine if browser builds will reuse the same message protocol or require a different helper library for browsers without `worker_threads`.

## 6. Execution Log
*   [2026-02-20] - Simplified TaskService initialization to drive the unified TaskEngine worker pool and removed WorkerTaskService surface.
*   [2026-02-21] - Reopened to add worker pool service tests, configuration docs, and align with updated constitution requirements.
