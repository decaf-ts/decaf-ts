# TASK_163: Deep-nesting `@transactional` integration test against live Postgres

**Task ID:** TASK_163
**Priority:** High
**Status:** Completed
**Estimated Time:** 4 hours
**Reference:** DECAF_7 (Section 3 US-2, US-3, US-4); depends on TASK-161

## Description
Prove, against a real Postgres database (not a mock or RAM adapter), that 3+ levels of nested `@transactional` calls with several operations per level all run inside exactly one native Postgres transaction.

## Deliverables
- [x] `for-typeorm/tests/integration/transaction.nested.integration.test.ts`:
  - `levelOne` → `levelTwo` → `levelThree` on a `NestedTxRepository`, each level performing 2+ real `create`/`read`/`update` operations against Postgres
  - **Commit proof:** after a successful run, a brand-new `DataSource` connection (independent of the adapter's pool) confirms all 6 rows from all 3 levels are durably visible
  - **Rollback proof:** `levelTwoThatFails` → `levelThreeThatFails` throws at the deepest level; a fresh connection confirms the level-2 *and* level-3 inserts are both gone - i.e. the native `ROLLBACK` discarded the whole call tree, not just the failing frame

## Dependencies
- TASK-161 (`TypeORMContextLock` implementation)

## Blocked By
- None

## Notes
- Rollback-discards-everything is the strongest available proof of single-transaction atomicity for a real database: if each nested call had its own micro-transaction, a deep failure would only roll back the innermost insert and leave earlier levels' rows committed.
- Caught and fixed an unrelated schema-naming assumption during this work: `@pk({ type: "Number" })` always generates the PK via Postgres `SERIAL`/`nextval()`, silently ignoring any caller-supplied id (confirmed against the existing `String PKs default generated=false` behavior). The nested-levels' explicit `id: 1..8` values happened to match the auto-generated sequence purely because creation order matched intended id order - a coincidence, not a guarantee. Documented here so a future test reusing this id pattern doesn't rely on it.
