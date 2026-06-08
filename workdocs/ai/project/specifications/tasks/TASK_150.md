# TASK-150: Implement per-step maxAttempts/backoff and TaskStepResultModel.attempt

**ID:** TASK-150
**Specification:** [DECAF-22](../DECAF_22.md)
**Priority:** High
**Status:** Completed

## 1. Description
Add `maxAttempts?: number` and `backoff?: TaskBackoffModel` to `TaskStepSpecModel` so individual composite steps can retry in-place. Add `attempt?: number` to `TaskStepResultModel` to record how many tries a step needed. Wrap the step execution block in `TaskEngine.runComposite` with an inner retry loop; call `context.heartbeat()` between retries and invoke `handler.catch?.(...)` only after all step attempts are exhausted. Add `setMaxAttempts` and `setBackoff` to `TaskStepSpecBuilder`.

## 2. Changes
- `core/src/tasks/models/TaskStepSpecModel.ts`: added `maxAttempts?: number` and `backoff?: TaskBackoffModel`.
- `core/src/tasks/models/TaskStepResultModel.ts`: added `attempt?: number`.
- `core/src/tasks/TaskEngine.ts`: replaced single try/catch around `handler.run(...)` with an inner while loop; step retries in-place with heartbeat and backoff.
- `core/src/tasks/builder.ts`: added `setMaxAttempts` and `setBackoff` to `TaskStepSpecBuilder`.

## 3. Design Notes
- Default `maxAttempts` is `undefined` → treated as 1 → loop runs once → identical to previous behavior.
- `step.backoff` falls back to `task.backoff` when not set.
- `handler.catch?.(...)` is called only after all step-level attempts are exhausted.
- After step-level exhaustion, the error is thrown to the task-level handler (which may retry the task from `currentStep`).

## 4. Execution Log
- [2026-06-08] Implemented and verified — all 55 composite task tests pass.
