# TASK_166: Integration tests for `maxConcurrentTransactions` (-1, 0, 1, 3)

**Task ID:** TASK_166
**Priority:** High
**Status:** Completed
**Estimated Time:** 3 hours
**Reference:** DECAF_7 (Section 3 Req-12); depends on TASK-165

## Description
Verify the default `ContextLock`'s `maxConcurrentTransactions` gating against a real `RamAdapter` + `@transactional()` call tree, covering all four behaviorally distinct cases the flag supports.

## Deliverables
- [x] `core/tests/integration/transaction.max-concurrent.integration.test.ts`:
  - **`-1` (default, no override):** 5 concurrent `@transactional()` calls all proceed without blocking
  - **`0`:** a single `@transactional()` call rejects immediately with an error matching `/disabled/i`
  - **`1`:** two concurrent calls - the second does not proceed (held open via a gate) until the first commits; then it proceeds
  - **`3`:** four concurrent calls - the first three proceed, the fourth waits; releasing one of the first three lets the fourth proceed
  - Test-only pause/signal hooks (`onHeld`, `gate`) are plain instance fields on a per-actor `Repository` instance (not method parameters) and `maxConcurrentTransactions` is set via `Repository.override(...)`, consistent with the positional-argument footgun documented in TASK-164

## Dependencies
- TASK-165 (the gating implementation)

## Blocked By
- None

## Notes
- Each actor needs its own `Repository` instance (constructed with `force=true` to bypass `Repository.register()`'s "already has a registered instance" guard) so per-actor `onHeld`/`gate` fields don't collide - the same pattern established in TASK-164's concurrent-transaction test for `for-typeorm`.
- Negative-condition assertions ("B has not yet proceeded") use a short fixed delay (50ms) rather than a polling `waitFor`, since there's no external signal (like Postgres's `pg_stat_activity`) to poll for an in-process semaphore - acceptable here because the positive paths are still verified deterministically via the `held` promises.
