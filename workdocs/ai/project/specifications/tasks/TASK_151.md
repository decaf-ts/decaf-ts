# TASK-151: Add test coverage for atEnd, dynamic-step survival, and per-step retry

**ID:** TASK-151
**Specification:** [DECAF-22](../DECAF_22.md)
**Priority:** High
**Status:** Completed

## 1. Description
Add 4 new integration tests to `core/tests/integration/composite-tasks.test.ts` covering the new DECAF-22 features and the previously untested gap of dynamic steps surviving an early static-step failure and retry.

## 2. New Tests
| Test | What it verifies |
|---|---|
| `atEnd() appends steps after all currently queued steps` | Steps inserted via `atEnd()` appear after all existing steps (including ones queued by `afterCurrent`), not just after current |
| `dynamic steps queued via atEnd() survive an early static-step failure and task retry` | `task.steps` is persisted, so dynamically appended steps remain after the task is rescheduled and re-claimed |
| `retries a flaky step in-place without cycling the task` | Step with `maxAttempts: 3` fails twice then succeeds; task-level `attempt` stays 0; `TaskStepResultModel.attempt` is 3 |
| `step exhausting its own maxAttempts propagates to task-level retry` | Step with `maxAttempts: 2` always fails; task with `maxAttempts: 2` retries; total handler invocations = 4 |

## 3. New Handler Classes
- `AtEndEnqueueStep`, `AtEndMiddleStep`, `AtEndTailStep` — for `atEnd` ordering test.
- `StepRetryFlakyHandler`, `StepRetryFinalHandler` — for in-place retry test.
- `StepRetryAlwaysFailHandler` — for step exhaustion test.
- `EarlyFailWithDynamicStep`, `DynamicSurvivorTailStep` — for dynamic-step survival test.

## 4. Execution Log
- [2026-06-08] Implemented and verified — 55 tests pass (51 existing + 4 new), full suite 559 passed.
