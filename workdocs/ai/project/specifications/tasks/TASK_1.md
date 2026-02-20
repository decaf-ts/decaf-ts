# TASK-1: Worker-aware Task Engine

**ID:** TASK-1
**Specification:** [Link to Specification](../DECAF_1.md)
**Priority:** High
**Status:** Pending

## 1. Description
Adapt the existing `TaskEngine` so it can run inside a dedicated worker (Node `worker_threads` or browser `Worker`). The worker version must reuse the same models and hooks, serialize/deserialize TaskContext info as needed, and emit `TaskEventModel` updates back to the main thread through the existing observable bus.

## 2. Objectives
*   [ ] Wrap the existing task loop so worker threads can claim tasks, execute handlers, and report back without duplicating business logic.
*   [ ] Ensure `TaskEventBus` observables in the main thread continue receiving logs/progress/status from worker threads via message channels.
*   [ ] Keep serialization/deserialization boundaries minimal; share only IDs and status payloads across the worker barrier.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `WorkerTaskEngine` (or similar) that instantiates a `TaskEngine` inside the worker and exposes ports for sending `TaskEventModel` updates and receiving control messages (`start`, `stop`, `claim`).
*   Implement message handlers that mirror `TaskEventBus.emit` and funnel messages through the existing observable infrastructure (maybe via a proxy `Observable` that forwards worker notifications).
*   Add helper utilities to serialize `TaskModel` snapshots and TaskContext metadata before posting to the main thread, recreating contexts as needed in the worker using the adapter provided in the configuration.

**Technical Details:**
*   Use Node's `Worker` (or fallback to `Worker` API globally) with structured cloning; limit messages to strings/serializable payloads (task IDs, statuses, log arrays).
*   Keep adapter interactions inside the worker; pass configuration (adapter options, worker id, concurrency) when booting it so it can instantiate its own `TaskEngine`.
*   Within the worker, rehydrate contexts by creating a `TaskContext` with the shared adapter and reusing `TaskFlags` for logging/progress.

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
*   [Date] - Task created.
