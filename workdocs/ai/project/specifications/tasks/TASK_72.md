# TASK_72: Create transactionalHandler for decoratee method wrapping

**Task ID:** TASK_72  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 6 hours  
**Reference:** DECAF_7 (Section 4 Architecture & Design, Section 5 Tasks)

## Description
Create transactionalHandler function that wraps decoratee methods with lock acquisition/release and transaction management.

## Requirements (from DECAF_7)
- Use Decoration API for decorator implementation
- Get or create transaction lock using lock from adapter.config.lock
- Check if lock already exists in Context (nested calls)
- Call lockProxy.acquire() before method execution
- Call lockProxy.release() after method execution
- Handle errors properly with try/finally

## Deliverables
- [ ] transactionalHandler function in `@decaf-ts/transactional-decorators`
- [ ] Method wrapping with lock acquisition/release
- [ ] Nested call handling (reuse lock from Context)
- [ ] Proper error handling with try/finally block
- [ ] Integration with Context.current() for lock retrieval

## Dependencies
- TASK_67 (Lock/MultiLock classes)
- TASK_70 (Context.getTransactionLock method)
- TASK_71 (lock injection on first acquire)

## Blocked By
- None

## Notes
- See DECAF_7 Section 4.5 (Decorator Handler) for implementation details
- Handler is the core logic that @transactional decorator uses
