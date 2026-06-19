# TASK_162: Deep-nesting `@transactional` test (3+ levels) with RamAdapter

**Task ID:** TASK_162
**Priority:** Medium
**Status:** Completed
**Estimated Time:** 2 hours
**Reference:** DECAF_7 (Section 3 US-2, US-4; Section 5 TASK-74/TASK-76)

## Description
`core`'s existing nested-`@transactional` tests (TASK-74, TASK-76) only exercised 2 levels of nesting (`outer`/`inner`) with a single operation each. Add a test with 3+ levels of nesting and several create/read/update operations per level, against `core`'s own `RamAdapter`, to prove the whole call tree still shares exactly one transaction lock - and that an error at the deepest level triggers exactly one rollback, not one per level.

## Deliverables
- [x] `core/tests/integration/transaction.deep-nesting.integration.test.ts`:
  - `levelOne` → `levelTwo` → `levelThree`, each performing 2+ real `create`/`read`/`update` calls via a `DeepTxRepository`
  - Asserts a single `CountingLock` handed out, `begins === 1`, `commits === 1`, `depth === 0` after a successful run
  - A second scenario (`levelTwoThatFails` → `levelThreeThatFails`) asserts exactly one `rollback()` call and `commits === 0` when the deepest level throws

## Dependencies
- TASK-74, TASK-76 (existing nested-call test patterns)

## Blocked By
- None

## Notes
- Confirms the proxy-owned depth/lock-reuse mechanism (Req-3, Req-4, Req-5) generalizes beyond the 2-level cases already covered, before relying on it for a real native-transaction adapter (TASK-161/163).
