# DECAF-12 — TaskEngine Dynamic Steps, Dependencies, Locks, and Handler Catch

- **Status:** COMPLETED
- **Priority:** High
- **Goal:** Extend `core` TaskEngine orchestration so composite tasks can enqueue future steps at runtime, task/task-step dependencies are enforced, lock-based mutual exclusion is supported, and `TaskHandler` exposes a customizable failure hook.

---

## 1. Overview
`TaskEngine` currently supports scheduled execution and composite step processing, but does not fully support dynamic workflow mutation and execution constraints required by advanced orchestration flows. This specification adds four capabilities to close those gaps:

1. Dynamic composite-step insertion during handler execution, restricted to steps after the currently running step and emitting a status event of type `update`.
2. Explicit dependency declarations for tasks and steps, including cross-task step dependencies.
3. A lock string on tasks and steps that enforces mutual exclusion across all runnable units sharing the same lock.
4. A default no-op `TaskHandler.catch(input, error, context)` hook, called when `taskHandler.run(...)` fails.

## 2. Goals
*   [x] Support runtime insertion of additional composite steps using the same scheduling-style methodology already used by TaskEngine internals.
*   [x] Enforce dependency gates before task or step execution starts.
*   [x] Enforce lock-based single-flight execution for equal lock keys across tasks and steps.
*   [x] Add `TaskHandler.catch(...)` for custom failure logic without breaking existing handlers.

## 3. User Stories / Requirements
*   **US-1:** As a workflow author, I want a running composite step to append new downstream steps so runtime decisions can reshape the rest of the workflow.
*   **US-2:** As an orchestrator, I want to block task/step execution until dependency targets are finished so execution order is explicit and safe.
*   **US-3:** As an operator, I want lock strings to prevent concurrent execution of conflicting work units.
*   **US-4:** As a handler implementer, I want a `catch(...)` hook to run custom error handling logic consistently when `run(...)` fails.
*   **Req-1:** Dynamic step insertion must only add steps after the currently executing composite step index.
*   **Req-2:** Dynamic step insertion must emit a task status event with type `update`.
*   **Req-3:** Dependencies must support encoded values in the form:
  - `<taskId>` for task-level dependency.
  - `<taskId>:<step index|step reference>` for step-level dependency.
  - Task-level metadata field: `dependencies: string[]`.
  - Step-level metadata field: `dependsOn: string[]`.
*   **Req-4:** Tasks and steps must optionally accept a `lock: string` attribute.
*   **Req-5:** While a lock key is held by a running task/step, any other task/step with the same key must remain non-runnable.
*   **Req-6:** `TaskHandler.catch(input, error, context)` must be called in the `catch` path of `taskHandler.run(...)`.
*   **Req-7:** Default `catch(...)` implementation must be a no-op to preserve backwards compatibility.

## 4. Architecture & Design
Primary module: `core` (`TaskEngine`, task scheduler/executor, task/step models, status event pipeline, and handler contracts).

Design boundaries:
*   Dynamic insertion should reuse existing scheduling and queue semantics where possible to avoid introducing a parallel execution path.
*   Dependency checks should integrate with the same readiness evaluation phase used before a task/step is dispatched.
*   Lock enforcement should be centralized in execution arbitration, not scattered across handlers.
*   `TaskHandler.catch(...)` should be optional and typed, with base/default behavior implemented in shared abstractions.

## 5. Tasks Breakdown
| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-110 | [Implement TaskEngine dynamic steps, dependencies, locks, and handler catch](./tasks/TASK_110.md) | High | Completed | - |

## 6. Open Questions / Risks
*   Lock scope remains engine-instance local. Multi-process coordination is still handled by adapter-specific orchestration, not by shared in-memory TaskEngine locks.

## 7. Results & Artifacts
*   Updated `core` task orchestration contracts and runtime behavior.
*   Tests covering dynamic step insertion, dependency gating, lock exclusion, and handler catch behavior.
*   Documentation updates for TaskEngine/TaskHandler APIs and orchestration rules.
*   Verification (2026-04-23, `core`): `npm run lint`, `npm run build`, `npm run test -- --watchman=false` all passed.
*   Final test summary (2026-04-23): 81 passed suites, 2 skipped suites, 535 passed tests, 23 skipped tests.
