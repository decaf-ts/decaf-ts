# TASK_71: Inject transactionLock into Context on first acquire

**Task ID:** TASK_71  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 4 hours  
**Reference:** DECAF_7 (Section 4 Architecture & Design, Req-3, Req-4, Req-7)

## Description
Implement injection of TransactionLockProxy into Context on first acquire, ensuring lock survives multiple logCtx calls.

## Requirements (from DECAF_7)
- acquire/release proxy MUST increase counter on acquire, decrease on release
- First acquire MUST call adapter.beginTransaction() and lock.acquire()
- Last release MUST call lock.release() and adapter.endTransaction()
- Lock MUST survive multiple logCtx() calls (store in Context, not local variable)
- Store lock proxy in Context via `ctx.accumulate({ transactionLock: this })`

## Deliverables
- [ ] TransactionLockProxy acquires lock on first acquire
- [ ] Lock proxy stored in Context via accumulate()
- [ ] Reference counting implemented in TransactionLockProxy
- [ ] Nested calls reuse existing lock from Context
- [ ] Lock persists across logCtx calls for nested decorator usage

## Dependencies
- TASK_67 (Lock/MultiLock classes)
- TASK_70 (Context.getTransactionLock method)

## Blocked By
- None

## Notes
- See DECAF_7 Section 4.1 (TransactionLockProxy class) for implementation
- Critical for nested decorator calls to share same lock instance
