# TASK-149: Implement atEnd insertion + required ctx on TaskContext/TaskEngine

**ID:** TASK-149
**Specification:** [DECAF-22](../DECAF_22.md)
**Priority:** High
**Status:** Completed

## 1. Description
Add `atEnd(ctx: TaskContext)` to `TaskContext.scheduleSteps()` and make `ctx` required on `afterCurrent`. Wire the corresponding `scheduleCompositeStepsAtEnd` engine callback in `TaskEngine.runComposite`. Engine callbacks use the handler's `ctx` for logging only; persistence and bus operations continue to use the engine's own context closure.

## 2. Changes
- `core/src/tasks/TaskContext.ts`: added `atEnd(ctx)` to `scheduleSteps()` return; made `ctx` required on `afterCurrent`.
- `core/src/tasks/TaskEngine.ts`: added `scheduleCompositeStepsAtEnd` cache entry; both callbacks accept `ctx` and use it for logging via `ctx.logger.for(...)`.
- `core/src/tasks/types.ts`: added optional `scheduleCompositeStepsAtEnd` to `TaskFlags`; updated `scheduleCompositeSteps` signature to include `ctx`.

## 3. Execution Log
- [2026-06-08] Implemented and verified — all 55 composite task tests pass.
