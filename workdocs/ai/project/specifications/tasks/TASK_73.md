# TASK_73: Add unit tests for Lock class and MultiLock

**Task ID:** TASK_73  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 4 hours  
**Reference:** DECAF_7 (Section 3 User Stories US-6, US-7, US-8)

## Description
Add unit tests for Lock and MultiLock classes to verify hierarchical locking, maxConcurrent configuration, and level/tableName/recordId parameters.

## Requirements (from DECAF_7)
- Lock supports hierarchical levels: none, adapter, table, record
- Lock supports configurable maxConcurrent transactions (null = unlimited)
- Lock is passed via adapter config, not created internally
- Unit tests in `core/tests/unit/transaction-decorator.test.ts`

## Deliverables
- [ ] Unit tests for Lock.acquire() with level/tableName/recordId
- [ ] Unit tests for Lock.release() with level/tableName/recordId
- [ ] Unit tests for MultiLock hierarchical locking
- [ ] Unit tests for maxConcurrent configuration
- [ ] Tests for level parameter combinations (none, adapter, table, record)
- [ ] Tests for tableName and recordId optional parameters

## Dependencies
- TASK_67 (Lock/MultiLock classes)

## Blocked By
- None

## Notes
- Test both base Lock and MultiLock implementations
- Verify no-op behavior in base Lock class
- Test adapter override capability
