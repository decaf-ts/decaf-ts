# TASK-110: Implement TaskEngine dynamic steps, dependencies, locks, and handler catch

**ID:** TASK-110
**Specification:** [Link to Specification](../DECAF_12.md)
**Priority:** High
**Status:** Completed

## 1. Description
Implement the TaskEngine enhancements required by DECAF-12: runtime insertion of future composite steps, dependency-based start gating for tasks and steps, lock-key mutual exclusion for tasks/steps, and `TaskHandler.catch(input, error, context)` with default no-op behavior.

## 2. Objectives
*   [x] Add runtime API/path for composite handlers to push additional steps after the currently executing step.
*   [x] Emit status event type `update` whenever runtime step insertion mutates composite workflow shape.
*   [x] Add dependency metadata/contract and enforce readiness checks for task-level and step-level dependencies.
*   [x] Add optional `lock: string` contract on tasks/steps and block concurrent execution for shared lock keys.
*   [x] Extend TaskHandler contract with `catch(input, error, context)` and invoke it from the `run(...)` catch path.

## 3. Implementation Plan
**Proposed Changes:**
*   Update TaskEngine scheduling/execution internals in `core` to support controlled step injection after current index.
*   Extend task and step descriptors/contracts with dependency and lock metadata.
*   Add centralized dependency/lock arbitration in readiness evaluation.
*   Extend handler abstractions/interfaces to include optional/default `catch(...)`.
*   Update TaskEngine/TaskHandler docs with usage and lifecycle behavior.

**Technical Details:**
*   Preserve backward compatibility for existing handlers that only implement `run(...)`.
*   Keep lock handling deterministic with release guaranteed on success and failure paths.
*   Reuse existing status event pipeline and scheduling patterns to avoid duplicate orchestration logic.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit tests for runtime step insertion ordering and `update` event emission.
*   [x] Unit/integration tests for task-level and cross-task-step dependency gates.
*   [x] Unit/integration tests for lock exclusion across concurrent runnable tasks/steps with same key.
*   [x] Unit tests verifying `TaskHandler.catch(...)` invocation semantics and default no-op behavior.

**Manual Verification:**
*   Execute a sample composite task that appends downstream steps at runtime and confirm visible status updates.
*   Execute conflicting lock scenarios and verify second work unit starts only after lock release.

## 5. Blockers & Clarifications
*   No blockers at implementation close.

## 6. Execution Log
*   [2026-04-23] Task created from DECAF-12.
*   [2026-04-23] Implemented in `core`:
    - Runtime composite step insertion after current step with status `update` event emission.
    - Task and step dependency gating via encoded dependencies (`<taskId>` and `<taskId>:<step index|step reference>`), using `TaskModel.dependencies` and `TaskStepSpecModel.dependsOn`.
    - Lock arbitration via optional `lock` attribute on tasks/steps.
    - `TaskHandler.catch(input, error, context)` default no-op and invocation in failure path.
*   [2026-04-23] Tests added/updated in `core/tests/integration/composite-tasks.test.ts` and `core/tests/unit/task-engine-composite-logging.test.ts`.
*   [2026-04-23] Verification passed in `core`:
    - `npm run lint`
    - `npm run build`
    - `npm run test -- --watchman=false`
*   [2026-04-23] Final Jest summary:
    - Test Suites: 81 passed, 2 skipped
    - Tests: 535 passed, 23 skipped
