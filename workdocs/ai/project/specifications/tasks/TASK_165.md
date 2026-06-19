# TASK_165: `maxConcurrentTransactions` flag + counting-semaphore gating in the default `ContextLock`

**Task ID:** TASK_165
**Priority:** High
**Status:** Completed
**Estimated Time:** 4 hours
**Reference:** DECAF_7 (Section 2 Goals, last item; Section 3 Req-12)

## Description
The default `ContextLock` was a pure no-op. Reintroduce a (simplified) concurrency cap dropped from the original draft's hierarchical-`LockLevel`/`maxConcurrent` design: a single `maxConcurrentTransactions` `AdapterFlags` flag that the default `ContextLock` itself enforces via an in-process counting semaphore, without reintroducing the dropped hierarchical locking levels (none/adapter/table/record).

## Requirements
- `maxConcurrentTransactions: number` added to `AdapterFlags` (`core/src/persistence/types.ts`), defaulting to `-1` in `DefaultAdapterFlags` (`core/src/persistence/constants.ts`)
- `-1` (or any negative value) → no limit; `ContextLock.begin()`/`commit()`/`rollback()` behave as a no-op, same as before this task
- `0` → transactions disabled outright; `begin()` throws immediately (`UnsupportedError`) for every `@transactional()` call against that adapter
- any positive `N` → at most `N` transactions run concurrently against that adapter; callers beyond the limit queue (FIFO) until a permit frees up via `commit()`/`rollback()`
- the limit is shared across every `ContextLock` instance created for the same adapter (not per-call), since each top-level `@transactional()` call gets its own lock instance via `Adapter.transactionLock()`
- adapters that fully override `begin`/`commit`/`rollback` without calling `super.*()` (e.g. `for-typeorm`'s `TypeORMContextLock`) are unaffected - the flag only gates the default implementation

## Deliverables
- [x] `core/src/persistence/types.ts` — `maxConcurrentTransactions: number` added to `AdapterFlags`
- [x] `core/src/persistence/constants.ts` — `maxConcurrentTransactions: -1` added to `DefaultAdapterFlags`
- [x] `core/src/persistence/ContextLock.ts` — internal `ConcurrencySemaphore` (FIFO counting semaphore: `acquire()`/`release()`), a module-level `WeakMap<Adapter, ConcurrencySemaphore>` keyed per adapter instance, and `begin(ctx)` reading `ctx.getOrUndefined("maxConcurrentTransactions")` to decide: throw (`0`), acquire a permit (`>0`), or no-op (`<0`/default); `commit()`/`rollback()` release the permit if one was acquired
- [x] `core/src/persistence/transactions.ts` — `lock.begin(ctx)` now receives the context (previously called with no arguments); the lock is only cached onto `ctx.cache` *after* `begin()` succeeds, so a rejected `begin()` (e.g. `maxConcurrentTransactions=0`) leaves no stale lock/depth on the context

## Dependencies
- TASK-68 (adapter-overridable lock contract)

## Blocked By
- None

## Notes
- Deliberately did **not** reuse `@decaf-ts/transactional-decorators`'s `SynchronousLock` (it's tightly coupled to that package's own `Transaction`/`TransactionLock` abstraction, which this spec's design intentionally bypasses) - wrote a minimal, self-contained FIFO semaphore instead.
- `UnsupportedError` (`core/src/persistence/errors.ts`, 500) was the existing, semantically-correct error class for "this operation isn't available right now" - its own JSDoc example is almost verbatim this use case.
