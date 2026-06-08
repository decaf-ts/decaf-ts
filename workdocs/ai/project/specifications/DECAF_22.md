# DECAF-22 — TaskEngine Step Insertion & Per-Step Retry

- **Status:** COMPLETED
- **Priority:** High
- **Goal:** Extend `core` composite task execution with tail-insertion (`atEnd`), required context on insertion methods, per-step `maxAttempts`/`backoff`, and test coverage for identified gaps.

---

## 1. Overview

DECAF-12 delivered runtime composite-step insertion (`scheduleSteps().afterCurrent()`), dependency gating, lock exclusion, and `TaskHandler.catch`. DECAF-22 extends that with:

1. **`atEnd(ctx)` insertion** — insert steps at the tail of the composite queue, after all currently queued steps, so cleanup/finalization steps are never displaced by other handlers also calling `afterCurrent`.
2. **Required context on insertion methods** — both `afterCurrent(ctx)` and `atEnd(ctx)` require an explicit `TaskContext` argument. The engine callback uses it for scoped logging; engine persistence operations continue to use the engine's own context closure.
3. **Per-step `maxAttempts` / `backoff`** — `TaskStepSpecModel` gains optional `maxAttempts?: number` and `backoff?: TaskBackoffModel`. When set, failed steps retry in-place (with heartbeat between retries) before propagating failure to the task level. Default `maxAttempts` is `undefined` (treated as 1, preserving backward compatibility).
4. **`attempt` on step results** — `TaskStepResultModel` gains `attempt?: number` recording how many tries the step needed.
5. **`setMaxAttempts` / `setBackoff` on `TaskStepSpecBuilder`** — builder helpers expose the new step fields.
6. **Test coverage** — 4 new tests covering: `atEnd()` ordering, dynamic-steps-surviving early failure + retry, per-step in-place retry, and step exhaustion propagating to task-level retry.

## 2. Goals
*   [x] Add `atEnd(ctx: TaskContext)` to `TaskContext.scheduleSteps()`.
*   [x] Make `ctx` required (not optional) on both `afterCurrent` and `atEnd`.
*   [x] Engine callbacks use handler's `ctx` for logging only; engine's own context for persistence and bus.
*   [x] `TaskStepSpecModel` accepts `maxAttempts` and `backoff`.
*   [x] `TaskStepResultModel` records `attempt`.
*   [x] `TaskStepSpecBuilder` exposes `setMaxAttempts` and `setBackoff`.
*   [x] `TaskFlags` updated to include `scheduleCompositeStepsAtEnd` (optional, matching `scheduleCompositeSteps`).
*   [x] All new and existing composite task tests pass.

## 3. Tasks Breakdown
| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-149 | [Implement atEnd insertion + required ctx on TaskContext/TaskEngine](./tasks/TASK_149.md) | High | Completed | - |
| TASK-150 | [Implement per-step maxAttempts/backoff and TaskStepResultModel.attempt](./tasks/TASK_150.md) | High | Completed | - |
| TASK-151 | [Add test coverage for atEnd, dynamic-step survival, and per-step retry](./tasks/TASK_151.md) | High | Completed | TASK-149, TASK-150 |

## 4. Design Notes

- `scheduleCompositeSteps` and `scheduleCompositeStepsAtEnd` are stored in `TaskFlags` as optional fields. They are internal engine callbacks, not user-facing API — the public surface is `ctx.scheduleSteps().afterCurrent(ctx)` / `.atEnd(ctx)`.
- Per-step retry is entirely in-process (no DB status changes during retry); heartbeat is called between retries to extend the lease.
- When all step-level attempts are exhausted, `handler.catch?.(...)` is invoked and then the error propagates to the task-level handler (which may retry the whole task from `currentStep`).
- `step.backoff` falls back to `task.backoff` when absent.

## 5. Results & Artifacts

- Modified: `core/src/tasks/TaskContext.ts`, `core/src/tasks/TaskEngine.ts`, `core/src/tasks/types.ts`, `core/src/tasks/models/TaskStepSpecModel.ts`, `core/src/tasks/models/TaskStepResultModel.ts`, `core/src/tasks/builder.ts`.
- Tests: `core/tests/integration/composite-tasks.test.ts` — 4 new tests added.
- Verification (2026-06-08): `npm run build` passed; `npx jest --runInBand --watchman=false` → 559 passed, 25 skipped, 94 suites passed, 3 skipped. No regressions.
