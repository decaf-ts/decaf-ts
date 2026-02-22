# TASK_76: Add integration tests with RamAdapter

**Task ID:** TASK_76  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 8 hours  
**Reference:** DECAF_7 (Section 3 User Stories US-3, US-5, US-6, US-7)

## Description
Add integration tests with RamAdapter to verify transaction decorator behavior end-to-end with a concrete adapter implementation.

## Requirements (from DECAF_7)
- Integration tests with concrete adapters (RamAdapter, etc.)
- Lock instance from adapter configuration (not singleton)
- Configure max concurrent transactions (null = unlimited)
- Locking at different levels: none, adapter, table, record
- Transaction boundaries properly managed

## Deliverables
- [ ] Integration tests using RamAdapter with @transactional
- [ ] Tests verifying lock from adapter.config.lock
- [ ] Tests for maxConcurrent configuration
- [ ] Tests for hierarchical locking (none, adapter, table, record levels)
- [ ] Tests for nested @transactional calls sharing lock
- [ ] Tests for lock persistence across logCtx calls
- [ ] Tests in `core/tests/e2e/transaction.e2e.test.ts`

## Dependencies
- TASK_69 (RamAdapter lock from config)
- TASK_72 (transactionalHandler function)
- TASK_75 (@transactional decorator tests)

## Blocked By
- None

## Notes
- Full end-to-end integration testing
- Verify all transaction boundaries work correctly with RamAdapter
