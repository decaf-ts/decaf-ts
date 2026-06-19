# TASK_167: Document `maxConcurrentTransactions` (and its no-effect caveat in `for-typeorm`)

**Task ID:** TASK_167
**Priority:** Medium
**Status:** Completed
**Estimated Time:** 1.5 hours
**Reference:** DECAF_7 (Section 7); depends on TASK-165

## Description
Document the new `maxConcurrentTransactions` flag in `core`'s "How to Use" guide, and explicitly call out in `for-typeorm`'s guide that the flag has no effect there since `TypeORMContextLock` fully overrides the lock lifecycle.

## Deliverables
- [x] `core/workdocs/5-HowToUse.md` — new "Limiting concurrent transactions (`maxConcurrentTransactions`)" subsection under "Transactions (`@transactional`)": the `-1`/`0`/`N` semantics, a `Repository.override(...)` usage example, and a note that the limit is shared per-adapter rather than per-call
- [x] `core/workdocs/5-HowToUse.md` — updated the "How adapters provide native transactions" subsection to note that overriding `begin`/`commit`/`rollback` without calling `super.*()` opts out of the semaphore entirely
- [x] `for-typeorm/workdocs/5-HowToUse.md` — callout in the "Transactions" section: `maxConcurrentTransactions` is silently ignored by `TypeORMAdapter`, since `TypeORMContextLock` never calls `super.begin()`/`super.commit()`/`super.rollback()`; concurrency there is governed by Postgres itself (connection pool, row/table locks, isolation level)

## Dependencies
- TASK-165 (the gating implementation)

## Blocked By
- None

## Notes
- Followed the same convention as TASK-77: documentation lives in each module's `workdocs/5-HowToUse.md`, not a standalone doc file.
