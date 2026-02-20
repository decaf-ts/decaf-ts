# TASK-2: Worker Task Service & Pool

**ID:** TASK-2
**Specification:** [Link to Specification](../DECAF_1.md)
**Priority:** High
**Status:** Pending

## 1. Description
Extend `TaskService` with a configurable worker pool so the service can boot multiple worker-thread `TaskEngine` instances, monitor their health, and expose the same CRUD/tracking APIs while the underlying work runs out-of-process.

## 2. Objectives
*   [ ] Add configuration options for enabling a worker pool (`workerPool: { size?: number; mode?: "node" | "browser"; }`) and pass them through during service initialization.
*   [ ] Implement a `WorkerTaskService` manager that launches/terminates workers, listens for their event/log progress messages, and replays them via the existing `TaskEventBus`/`TaskTracker` observables.
*   [ ] Keep all service hooks (create, push, start, stop) working by routing pre/post listeners to worker threads through message commands and ensuring trackers can resolve statuses emitted from those threads.

## 3. Implementation Plan
**Proposed Changes:**
*   Update `ClientBasedService` or `TaskService` initialization to detect worker configuration, create worker threads via a shared helper, and keep references to their message channels.
*   Introduce an observable proxy that unpacks worker messages into `TaskEventModel` updates and calls the same bus observers as the in-process engine would.
*   Provide methods to broadcast control commands (`start`, `stop`, `heartbeat`, `gracefulShutdown`) and handle acknowledgements so the service can gracefully terminate the pool.

**Technical Details:**
*   Use Node's `worker_threads` module (or `Worker` global) to boot the same code path as the standalone worker engine.
*   Worker threads must send `TaskProgressPayload`/`TaskEventModel` messages serialized to JSON; the service will deserialize and pass them to `TaskEventBus.emit` so trackers behave normally.
*   Add lifecycle tracking (start/stop) per worker so the service knows when to respawn or wait during shutdown.

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
*   [Date] - Task created.
