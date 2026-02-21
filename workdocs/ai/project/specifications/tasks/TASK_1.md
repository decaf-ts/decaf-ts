# TASK-1: Worker-aware Task Engine

**ID:** TASK-1
**Specification:** [Link to Specification](../DECAF_1.md)
**Priority:** High
**Status:** In Progress — worker orchestration exists but lacks automated coverage and documentation updates.

## 1. Description
Adapt the existing `TaskEngine` so it remains the single orchestrator that leases tasks from the repository while optionally dispatching handler execution to worker threads. The host engine keeps all scheduling/state/event responsibilities; workers act only as execution sandboxes that receive serialized task payloads and stream progress/completion events back to the engine for publication via the existing bus.

## 2. Objectives
*   [ ] Update the engine loop so only the main thread claims tasks and posts execution jobs to workers when configured.
*   [ ] Ensure worker threads stream logs/progress/status back through message channels that the engine consumes and re-emits via `TaskEventBus`.
*   [ ] Keep serialization boundaries minimal: send handler identifiers + inputs to workers, and ship progress payloads/errors back to the engine for consistent persistence.

## 3. Implementation Plan
**Proposed Changes:**
*   Collapse the worker orchestration into `TaskEngine` itself: the main thread always claims tasks, persists state/events, and forwards handler execution to workers only when a pool is configured.
*   Replace `WorkerTaskService` with a lightweight worker harness that receives serialized `TaskInvocation` payloads, executes handlers, and streams `TaskEventModel` data back through the single host engine.
*   Extend `TaskEngineConfig` with a `workerPool` descriptor (size/mode/modules) and move the former `WorkerTaskService` spawn/shutdown logic directly into the engine.
*   Introduce a `TaskWorkerHost` helper that multiplexes messages, reconstructs contexts for each running task, and resolves completion/error into the existing bus/repo flows.

**Technical Details:**
*   The host engine keeps a queue of leased tasks; for each available worker it posts the minimal payload: task id, handler signature, serialized context/input/output expectations.
*   Workers use the new harness script to `require` handlers via `TaskHandlerRegistry`, execute them, and emit log/progress/completion messages as structured JSON; they never instantiate their own engine instance.
*   Message protocol includes: `ready`, `claim`, `progress`, `completed`, `failed`, mirroring the lifecycle so the host can call the same private methods currently used for in-process execution (e.g., `_execute`, `_handleError`).
*   Graceful shutdown remains governed by the engine’s `gracefulShutdownMsTimeout`; stop/start commands are broadcast to workers from the engine when `stop()` is invoked.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit test the worker message handlers to ensure `TaskEventModel` payloads are forwarded to the proxy observer.
*   [ ] Integration test that spinning up a worker engine results in tasks being claimed and transitions being recorded in the main repo.

**Manual Verification:**
*   1. Start the service with `workerPool.size > 1` and verify the CLI/observers still receive logs from both workers.
*   2. Trigger a long running task and confirm the main thread remains responsive while workers process it.

## 5. Blockers & Clarifications
*   **Blocker:** Need to confirm which environments must be supported (Node only or also browsers) and ensure Worker APIs exist there.
*   **Clarification:** Determine how to pass fragment-friendly contexts (e.g., logger references) into the worker without transferring functions.

## 6. Execution Log
*   [2026-02-20] - Implemented single-host TaskEngine with worker dispatch, removed WorkerTaskService, updated worker harness, and added worker pool tests.
*   [2026-02-21] - Reopened task to add worker pool regression tests, update docs, and align with constitution requirements.
