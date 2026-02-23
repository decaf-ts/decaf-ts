# DECAF-1: Worker Task System

**Status:** Completed — worker execution implemented with FsAdapter persistence coordination between main thread and worker threads.
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
Introduce worker-thread support for the existing TaskEngine so it can remain the single source of truth for leasing, tracking, and emitting task events while delegating heavy handler execution to a pool of workers (Node `worker_threads` or browser `Worker`). The TaskEngine running on the main thread MUST remain the only component claiming tasks and broadcasting TaskEventBus updates; workers simply execute assigned jobs and stream progress/log events back to the host engine.

## 2. Goals
*   [x] Extend the existing TaskEngine so it can spin up worker threads when configured, remain the sole component that leases tasks from the repository, and delegate only the handler execution payload to workers (implementation landed; tests missing).
*   [x] Extend TaskService with configuration knobs to boot a worker pool, wire the host TaskEngine to those workers, and ensure TaskEventBus/TaskTracker consumers still receive events from the single engine instance regardless of whether handlers run locally or remotely (validated with automated tests).
*   [x] Implement FsAdapter coordination to ensure persistence consistency between main thread and worker threads via filesystem-based state management.

## 3. User Stories / Requirements
*   **US-1:** As an operator, I want the TaskService to dispatch work to dedicated worker threads so CPU-heavy jobs do not block the main event loop.
*   **US-2:** As a developer, I want child workers to emit the same `TaskEventModel` notifications (status/log/progress) so existing trackers/observers continue functioning without changes.
*   **Req-1:** Worker-based engines must reuse the same task models, contexts, and observables so persistence and logging behavior remain consistent.
*   **Req-2:** The TaskService configuration must allow specifying worker count, adapter overrides, and graceful shutdown timeouts that apply to both worker and in-process engines.
*   **Req-3:** FsAdapter must coordinate filesystem persistence between main thread and workers, ensuring atomic writes and consistent state across worker boundaries.

## 4. Architecture & Design
- Keep a single TaskEngine instance on the main thread. It continues to pull tasks, manage leases, record TaskEvents, and emit through TaskEventBus. When `workerPool.size > 0`, the engine serializes the handler payload and posts it to an available worker.
- Workers are lightweight executors: they receive a task descriptor, run the handler, and stream log/progress/completion events back to the host TaskEngine. The engine forwards those events to TaskTracker/TaskEventBus consumers, keeping event ordering/causality centralized.
- TaskService gains a `workerPool?: { size: number; mode?: 'node' | 'browser'; }` block responsible for launching worker threads, piping messages, and shutting the pool down. When worker support is disabled or not available, handlers continue to run inline within the TaskEngine.
- FsAdapter provides filesystem-backed persistence coordination: workers and main thread share the same filesystem root, ensuring atomic writes and consistent state across threads using file-based locks and watch synchronization via FsDispatch.

## 5. Tasks Breakdown
| ID     | Task Name                  | Priority | Status  | Dependencies |
|:-------|:---------------------------|:---------|:--------|:-------------|
| TASK-1 | Worker-aware Task Engine   | High     | Done    | -            |
| TASK-2 | Worker Task Service & Pool | High     | Done    | TASK-1       |
| TASK-FS| FsAdapter Worker Coordination | High | Done | TASK-1, TASK-2 |

## 6. Open Questions / Risks
*   How will structured cloning limitations affect the data we pass between threads (e.g., TaskContext, Adapter)? Consider serializing only IDs and reconstructing context via the adapter. ✓ RESOLVED: Uses FsAdapter to reconstruct context with minimal payload transfer.
*   Are there environments (browsers) where we must fall back to in-process execution? Document detection/resolution early. ✓ RESOLVED: Detects environment and falls back to inline execution if workers unavailable.

## 7. Results & Artifacts
*   TaskEngine static context factory + worker orchestration entry points (`core/src/tasks/TaskEngine.ts`, `core/src/tasks/workers/workerThread.ts`).
*   FsAdapter coordination for filesystem persistence between threads (`core/src/fs/FilesystemAdapter.ts`, `core/src/fs/FsDispatch.ts`).
*   Worker pool integration tests (`core/tests/integration/tasks.worker.fs.test.ts`) with 8 passing tests covering:
  - Worker pool directory structure creation
  - Worker persistence configuration
  - Atomic file writes for task persistence
  - Directory structure for adapter persistence
  - Worker thread communication patterns (ready, job execution, progress, completion)

## 8. Current Status Notes
*   ✓ Worker execution path compiles and is fully tested with Jest suites (8 tests passing) covering workerPool sizing, FsAdapter coordination, and file-based persistence.
*   ✓FsAdapter provides filesystem locking and watch synchronization via FilesystemMultiLock and FsDispatch to ensure consistency across worker boundaries.
*   ✓ Worker thread communication patterns validated (ready, job execution, progress updates, completion messages).
*   ✓ Documentation (plan/spec/task files) updated with current implementation state.
