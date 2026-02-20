# DECAF-1: Worker Task System

**Status:** Planned
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
Introduce a worker-thread capable TaskEngine/TaskService pair that reuses the existing TaskModel/TaskEvent/TaskTracker objects and observables while running task execution inside one or more Node (or browser) workers. This will provide isolation for expensive jobs, enable more predictable concurrency, and keep the task lifecycle contracts (observables, trackers, event bus) intact for consumers.

## 2. Goals
*   [ ] Create a worker-aware TaskEngine implementation that can live inside a worker thread, mirror all state updates in the root datastore, and push progress/log/status events back to the main thread via TaskEventBus/TaskTracker observables.
*   [ ] Extend TaskService with configuration knobs to boot a pool of worker TaskEngines, manage their lifecycle/shutdown, and forward service hooks/observable wiring to message listeners so repositories and trackers see the same events regardless of whether the engine runs in-process or in a worker.

## 3. User Stories / Requirements
*   **US-1:** As an operator, I want the TaskService to dispatch work to dedicated worker threads so CPU-heavy jobs do not block the main event loop.
*   **US-2:** As a developer, I want child workers to emit the same `TaskEventModel` notifications (status/log/progress) so existing trackers/observers continue functioning without changes.
*   **Req-1:** Worker-based engines must reuse the same task models, contexts, and observables so persistence and logging behavior remain consistent.
*   **Req-2:** The TaskService configuration must allow specifying worker count, adapter overrides, and graceful shutdown timeouts that apply to both worker and in-process engines.

## 4. Architecture & Design
- Introduce `WorkerTaskEngine` (name tentative) that wraps the existing `TaskEngine` logic inside a worker-friendly shim; the shim will listen for task assignments from the main thread, execute them through the shared engine logic, and post event/observable updates via message ports.
- Extend `TaskService` to include a new config section (`workerPool?: { size: number; mode?: 'node' | 'browser'; }`) and a manager that instantiates worker threads, maintains their message channels, and routes `TaskEventModel`, logs, and progress back through the existing `TaskEventBus`. Observables will listen to a proxy that re-emits worker messages.
- Keep a fallback path for synchronous engines when worker threads are unavailable (e.g., browsers without Worker support).

## 5. Tasks Breakdown
| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-1 | Worker-aware Task Engine | High | Pending | - |
| TASK-2 | Worker Task Service & Pool | High | Pending | TASK-1 |

## 6. Open Questions / Risks
*   How will structured cloning limitations affect the data we pass between threads (e.g., TaskContext, Adapter)? Consider serializing only IDs and reconstructing context via the adapter.
*   Are there environments (browsers) where we must fall back to in-process execution? Document detection/resolution early.

## 7. Results & Artifacts
*   Placeholder for new worker engine/service implementations, message-channel adapters, and any tests/examples added under `core/src/tasks/`
