# 04 — Task Engine Design

**Source specifications:** [DECAF-1](../specifications/DECAF_1.md), [DECAF-12](../specifications/DECAF_12.md), [DECAF-22](../specifications/DECAF_22.md).

## 1. Overview

An in-process `TaskEngine` (in `@decaf-ts/core`) arbitrates composite task/step dispatch with dependency gating, lock-based mutual exclusion, dynamic step insertion, per-step retry, and optional worker-thread offloading. The main thread is the single source of truth for leasing/tracking/emitting; workers are lightweight executors.

## 2. Goals

- G1 — Keep the event loop responsive by offloading CPU-heavy handlers to a worker pool.
- G2 — Let composite workflows mutate themselves at runtime (dynamic step insertion).
- G3 — Explicit dependency gating and lock-based mutual exclusion.
- G4 — Per-step retry with backoff and a customizable failure hook.
- G5 — Opt-in concurrent composite-step execution with serialized shared-context writes.

## 3. Requirements

- **Req-1 (DECAF-1):** `TaskService` config `workerPool?: { size; mode?: 'node'|'browser' }` plus adapter overrides and graceful-shutdown timeouts. Main-thread `TaskEngine` leases, records `TaskEvent`s, emits via `TaskEventBus`. Workers reconstruct `TaskContext` via `FsAdapter` with minimal payload (IDs) and stream ready/job/progress/completion events back. Inline fallback when workers unavailable.
- **Req-2 (DECAF-12):** `TaskContext.scheduleSteps().afterCurrent(ctx)` inserts steps after the current step; emits a status event of type `update`. `dependencies: string[]` (task-level) / `dependsOn: string[]` (step-level), encoded `<taskId>` or `<taskId>:<stepIndex|stepReference>`; gate checks targets finished before dispatch. `lock: string` optional; no two runnable units with the same lock run concurrently (engine-instance local). `TaskHandler.catch(input, error, context)` default no-op, invoked in the catch path of `taskHandler.run(...)`.
- **Req-3 (DECAF-22):** `afterCurrent(ctx)`/`atEnd(ctx)` require an explicit `TaskContext`. `atEnd` appends at queue tail (not displaced by other handlers' `afterCurrent`). `TaskStepSpecModel.{maxAttempts?, backoff?: TaskBackoffModel, allowConcurrent: boolean (default false)}`; `TaskStepResultModel.attempt?`. Per-step retry is in-process (heartbeat between retries); on exhaustion `handler.catch?.(...)` then propagate to task-level retry. `allowConcurrent=true` steps sharing a `lock` run concurrently up to `TaskEngineConfig.maxConcurrentCompositeSteps` (default -1); a separate write lock serializes shared task-context persistence. `TaskFlags.scheduleCompositeStepsAtEnd` internal.

## 4. Architecture & Design

See [Architecture Workbook §05](../architecture-workbook/05-task-engine.md). Key decisions:

- **Single source of truth on the main thread** centralizes event ordering/causality; workers are stateless executors.
- **Lock scope is engine-instance local** — multi-process coordination delegated to adapter-specific orchestration, not shared in-memory locks.
- **`maxConcurrentCompositeSteps` is independent of the global runnable-task `concurrency` limit.**
- **Per-step retry is in-process** (no DB status changes) — heartbeat extends the lease between retries.

### Failing step with retry and catch

```mermaid
sequenceDiagram
    participant TE as TaskEngine
    participant Step as Step (maxAttempts, backoff)
    participant H as TaskHandler
    TE->>Step: dispatch
    Step->>H: run(input, ctx) -> throw
    Step->>Step: attempt < maxAttempts? heartbeat; backoff; retry
    Step->>H: run(input, ctx) -> throw (exhausted)
    Step->>H: handler.catch(input, error, ctx)
    Step->>TE: propagate to task-level retry (currentStep)
```

## 5. Public Interfaces (selected)

- `TaskService` config: `workerPool?: { size; mode?: 'node'|'browser' }`.
- `TaskContext.scheduleSteps().afterCurrent(ctx)` / `.atEnd(ctx)`.
- `dependencies: string[]` / `dependsOn: string[]` / `lock: string`.
- `TaskHandler.catch(input, error, context)`.
- `TaskStepSpecModel.{maxAttempts?, backoff?, allowConcurrent}`; `TaskStepResultModel.attempt?`.
- `TaskEngineConfig.maxConcurrentCompositeSteps` (default -1).

## 6. Open Questions / Risks

- Parallel foreach with shared state is unsafe in v1 (serial default; separate write lock for `allowConcurrent`).
- Structured-cloning limits across threads (resolved via `FsAdapter` reconstruction).
- Relationship to the Graph Execution Engine is implicit — no spec declares whether the graph engine reuses TaskEngine's dependency/lock/retry machinery (B11). DECAF-32 §3 lists "retry/backoff engine" as a V1 non-goal.

Continue to [05 — Graph Subsystem Design](./05-graph-design.md).
