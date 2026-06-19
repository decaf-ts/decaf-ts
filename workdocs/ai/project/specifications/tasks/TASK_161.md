# TASK_161: Implement native Postgres transaction lock for the TypeORM adapter

**Task ID:** TASK_161
**Priority:** High
**Status:** Completed
**Estimated Time:** 6 hours
**Reference:** DECAF_7 (Section 3 US-3, Req-2; Section 6 "No native-transaction adapter exists yet")

## Description
Implement a concrete `Adapter.transactionLock()` override for `for-typeorm`, backing `@transactional()` with real Postgres `BEGIN`/`COMMIT`/`ROLLBACK` via a dedicated TypeORM `QueryRunner`, and route the adapter's CRUD methods through that transaction's `EntityManager` when one is active.

## Requirements (from DECAF_7)
- Each adapter can expose its own transaction-lock implementation (US-3, Req-2)
- All native transaction logic hidden behind that implementation
- CRUD operations performed under `@transactional()` must participate in the same underlying native transaction, not just have begin/commit/rollback called cosmetically around independently-pooled-connection operations

## Deliverables
- [x] `for-typeorm/src/TypeORMContextLock.ts` — `TypeORMContextLock<A>` extends `ContextLock<A>`; `begin()` creates+connects a `QueryRunner` and calls `startTransaction()`; `commit()`/`rollback()` call the matching native method then release the `QueryRunner`; `manager()` exposes the transactional `EntityManager` while active
- [x] `TypeORMAdapter.transactionLock()` overridden to return `TypeORMContextLock<this>`
- [x] `TypeORMAdapter.getRepository(m, ctx)` private helper: resolves the active `TypeORMContextLock` from `ctx.getOrUndefined("transactionLock")` and returns `lock.manager().getRepository(m)` when present, else falls back to `this.client.getRepository(m)`
- [x] `create`/`read`/`update`/`delete`/`createAll`/`readAll`/`deleteAll` updated to extract `ctx` and call the new `getRepository(m, ctx)` instead of `this.client.getRepository(m)` directly
- [x] `TypeORMContextLock` exported from `for-typeorm`'s package index

## Dependencies
- TASK-68 (adapter-overridable lock contract, `Adapter.transactionLock()`)

## Blocked By
- None

## Notes
- `TypeORMContextLock` is generic (`<A extends TypeORMAdapter = TypeORMAdapter>`) to satisfy the base class's polymorphic `ContextLock<this>` return type under further subclassing.
- Verified via `for-typeorm/tests/integration/transaction.nested.integration.test.ts` and `transaction.concurrent.integration.test.ts` (TASK-163, TASK-164) against a live Postgres container, not just type-checked.
