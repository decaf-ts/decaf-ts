# TASK_75: Add unit tests for @transactional decorator

**Task ID:** TASK_75  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 6 hours  
**Reference:** DECAF_7 (Section 3 User Stories US-1, US-2, US-4)

## Description
Add unit tests for @transactional decorator to verify automatic transaction management, lock persistence across logCtx calls, and nested transaction sharing.

## Requirements (from DECAF_7)
- @transactional MUST automatically manage lock acquisition and transaction boundaries
- Lock MUST persist across multiple logCtx calls within a single transaction
- Nested @transactional calls MUST share the same lock instance
- Lock instance MUST come from the adapter configuration, not a singleton

## Deliverables
- [ ] Unit tests for @transactional basic functionality
- [ ] Unit tests for lock persistence across logCtx calls
- [ ] Unit tests for nested @transactional calls sharing lock instance
- [ ] Unit tests for lock injected into Context
- [ ] Tests for lock from adapter.config.lock

## Dependencies
- TASK_71 (lock injection on first acquire)
- TASK_72 (transactionalHandler function)
- TASK_74 (TransactionLockProxy tests)

## Blocked By
- None

## Notes
- Test @transactional decorator integrationend-to-end
- Verify Context contains transactionLock after decorated method execution
