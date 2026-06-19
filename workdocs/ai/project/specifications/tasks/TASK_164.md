# TASK_164: Simultaneous-transaction tests against live Postgres

**Task ID:** TASK_164
**Priority:** High
**Status:** Completed
**Estimated Time:** 4 hours
**Reference:** DECAF_7 (Section 3 US-3); depends on TASK-161

## Description
Verify that two genuinely concurrent `@transactional()` calls each acquire their own `TypeORMContextLock` (and therefore their own Postgres connection/transaction), and that the resulting behavior matches native Postgres transaction semantics under the default READ COMMITTED isolation level.

## Deliverables
- [x] `for-typeorm/tests/integration/transaction.concurrent.integration.test.ts`:
  - **Visibility:** an uncommitted insert (held open via a test-controlled gate) is invisible to a second, independent connection until `COMMIT`; visible immediately after
  - **Lock contention:** a concurrent `UPDATE` of the same row blocks on Postgres's row-level write lock until the first transaction ends - confirmed directly via `pg_stat_activity` (`wait_event_type = 'Lock'`), not inferred from timing alone; the blocked update completes with the expected value only after the first transaction commits

## Dependencies
- TASK-161 (`TypeORMContextLock` implementation)

## Blocked By
- None

## Notes
- **Footgun found and fixed during this work, worth keeping in mind for any future contextual-method test helper:** passing test-control callbacks/promises as extra positional arguments to a `@transactional()`-decorated method deadlocks the call. `Repository.logCtx` → `Adapter.context()` → `Adapter.flags()` capture *all* trailing positional arguments into the new `Context`'s `flags.args`, intended for legitimate domain pass-through (e.g. observer `refresh()` calls) - an unresolved `Promise` sitting in there can get awaited downstream before the decorated method itself ever gets the chance to resolve it, deadlocking on itself. Fixed by keeping test-only knobs (`onHeld`, `gate`) as plain instance fields on a per-actor `Repository` instance instead of method parameters.
- Two repository instances pointing at the same `Repository.register()`-cached model+adapter pair will throw `"... already has a registered instance"` unless constructed with `force=true` - needed for the second concurrent actor in the lock-contention test.
