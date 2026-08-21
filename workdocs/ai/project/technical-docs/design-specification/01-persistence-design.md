# 01 — Persistence & Adapter Design

**Source specifications:** [DECAF-1](../specifications/DECAF_1.md), [DECAF-3](../specifications/DECAF_3.md), [DECAF-6](../specifications/DECAF_6.md), [DECAF-7](../specifications/DECAF_7.md), [DECAF-11](../specifications/DECAF_11.md), [DECAF-14](../specifications/DECAF_14.md).

## 1. Overview

A single `Adapter`/`Repository`/`ModelService`/`Context` contract in `@decaf-ts/core` is overridden by concrete adapters (`RamAdapter`, `FilesystemAdapter`, `TypeORMAdapter`, Couch/Nano/Pouch, `FabricClientAdapter`). Identity, transactions, and migrations are generalised from PK/Postgres-specific roots into adapter-overridable, flavour-aware primitives.

## 2. Goals

- G1 — One persistence contract, many backends, flavour-aware behaviour.
- G2 — Identity generation generalised to any property (`@sequence`), backwards-compatible with `@pk`.
- G3 — Transactions with per-adapter native semantics and correct nesting.
- G4 — Deterministic, cross-adapter, semver-ordered, flavour-targeted migrations with task-based orchestration.
- G5 — Restart-safe local persistence and cross-thread coordination (FilesystemAdapter + workers).

## 3. Requirements

- **Req-1 (DECAF-7):** `@transactional(...)` is exported from `@decaf-ts/core`; owns nesting/depth; delegates begin/commit/rollback to `Adapter.transactionLock()` → `ContextLock`. Default `ContextLock` is a no-op with optional `maxConcurrentTransactions` semaphore (`-1` unlimited, `0` disabled, `N>0` cap). `TypeORMContextLock` backs it with a Postgres `QueryRunner`; CRUD routes through the active transactional `EntityManager`.
- **Req-2 (DECAF-7):** Rollback-ends-transaction with a double-rollback guard; context derivation carries `transactionLock` via `toOverrides()`.
- **Req-3 (DECAF-11):** `@sequence(...)` decorates any property; per-property metadata keyed by model identity + property name; `@pk` becomes a backwards-compatible wrapper; propagated through `for-couchdb`/`for-nano`/`for-pouch`/`for-typeorm`/`for-fabric` (Fabric honours private/shared/mirror routing). Implementation order: `core` → `for-couchdb` → `for-nano` → `for-fabric`.
- **Req-4 (DECAF-6):** `detectTypeORMDriver()` resolves POSTGRES/MYSQL/MARIA/SQLITE/SQLSERVER; driver-specific `createDatabase`/`createNotifyFunction`; unified `TypeORMStatement` over `SelectQueryBuilder`; event modes SUBSCRIBER (implemented) and TRIGGER (pending).
- **Req-5 (DECAF-3):** `FilesystemAdapter` mirrors `RamAdapter` API; persists records as `{root}/{table}/{pk}.json`, indexes as `{root}/{table}/indexes/{indexName}.json`; atomic writes (temp + rename); `FsDispatch` watch sync; `FilesystemLock`/`FilesystemMultiLock` table-level cross-process mutual exclusion.
- **Req-6 (DECAF-14):** `@migration` carries version + optional flavour; semver ordering (npm semver); flavour precedence conflicts throw. `MigrationService` (singleton) owns `migrateAdapters`/`migrateNormally`/`migrateViaTasks` with configurable `retrieveLastVersion`/`setCurrentVersion` handlers. Task mode via `MigrationTaskBuilder` → `CompositeTask` with version-hop chaining. `for-nest` exposes headless `npx decaf migrate`. Migration logic lives in `MigrationService`, not `PersistenceService`.
- **Req-7 (DECAF-1):** Worker `TaskEngine` offloads handler execution to `worker_threads`/`Worker`; main thread remains single source of truth for leasing/tracking/emitting; cross-thread coordination via `FilesystemAdapter` with minimal payload (IDs).

## 4. Architecture & Design

See [Architecture Workbook §02](../architecture-workbook/02-core-persistence.md) for the full component map and flows. Key design decisions:

- **Transaction model replaces the never-implemented `TransactionLockProxy`/hierarchical `LockLevel`** with a simpler depth-counter + per-adapter `ContextLock` (DECAF-7).
- **`maxConcurrentTransactions` is a no-op for `for-typeorm`** (native Postgres concurrency) — documented, not enforced (tension B1).
- **`--dry-run` is compatibility-only** in migration CLI — survives parsing precedence but does not bypass persistence (tension B2).
- **Sequences are per-property, not per-PK**, keyed by model identity + property name (DECAF-11).

### Transactional method execution

```mermaid
sequenceDiagram
    participant Caller
    participant Proxy as @transactional proxy
    participant Adapter as TypeORMAdapter
    participant Lock as TypeORMContextLock
    participant QR as QueryRunner
    participant DB as Postgres
    Caller->>Proxy: method(args, ctx)
    Proxy->>Adapter: transactionLock()
    Adapter->>Lock: new TypeORMContextLock
    Proxy->>Lock: begin(ctx) -> QR connect + startTransaction -> BEGIN
    Proxy->>Proxy: cache lock on ctx (depth 0->1)
    loop nested calls reuse lock, depth++
        Proxy->>Adapter: getRepository(m, ctx) -> transactional EntityManager -> CRUD
    end
    alt success: Proxy->>Lock: commit (depth 1->0) -> COMMIT + release
    else error: Proxy->>Lock: rollback (force depth=0) -> ROLLBACK + release; rethrow
    end
```

## 5. Public Interfaces (selected)

- `transactional(...data)` — `@decaf-ts/core`.
- `ContextLock<A>`: `begin(ctx)` / `commit()` / `rollback(err)` / `depth`.
- `Adapter.transactionLock(...args): ContextLock<this>`.
- `AdapterFlags.maxConcurrentTransactions: number` (default `-1`).
- `@sequence(...)` / `@pk(...)` / `Model.sequenceFor(model, property)` / `Model.pk(class, ...)`.
- `enum TypeORMDriver` / `detectTypeORMDriver(options)` / `enum TypeORMEventMode`.
- `@migration` / `MigrationService.{migrateAdapters,migrateNormally,migrateViaTasks,track,retry}` / `MigrationTaskBuilder.addMigrationStep(...).build()`.
- `FilesystemAdapter` / `FsDispatch` / `FilesystemLock` / `FilesystemMultiLock`.
- CLI: `npx decaf migrate --to --flavour --adapter --task-mode --dry-run`.

## 6. Open Questions / Risks

- `maxConcurrentTransactions` no-op for `for-typeorm` (B1); `--dry-run` semantics (B2); migration ownership move (B3); `@pk`/`@sequence` consistency (B4).
- DECAF-6 marked Completed despite pending TRIGGER mode, driver tests, docs (B5).
- DECAF-3 TASK-26 status inconsistency vs DECAF-1's reference to `FilesystemMultiLock` (B6).
- `@pk({ type: "Number" })` always uses Postgres `SERIAL`, ignoring caller-supplied ids (documented DECAF-7 finding).
- Filesystem: large bulk deletes vs recursive scans; pluggable serializers; `fs.watch` cross-platform reliability.

Continue to [02 — HTTP Server, Nest & SSE Design](./02-http-server-design.md).
