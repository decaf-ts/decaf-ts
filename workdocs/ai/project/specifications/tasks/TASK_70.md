# TASK_70: Update Context with getTransactionLock method

**Task ID:** TASK_70  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 2 hours  
**Reference:** DECAF_7 (Section 4 Architecture & Design, Section 3 User Stories US-2)

## Description
Update Context class with a `getTransactionLock()` method to retrieve the transaction lock from context.

## Requirements (from DECAF_7)
- Context MUST always have a lock property (Lock instance from adapter)
- Lock MUST survive multiple logCtx() calls (stored in Context)
- Provide method to retrieve the transaction lock from Context
- Method returns Lock | undefined if not in transaction

## Deliverables
- [ ] Updated `core/src/persistence/Context.ts` with getTransactionLock() method
- [ ] Method returns Lock instance or undefined
- [ ] Uses `ctx.getOrDefault("transactionLock")` internally
- [ ] Proper JSDoc documentation

## Dependencies
- None

## Blocked By
- None

## Notes
- See DECAF_7 Section 4.4 (Context Lock Management) for implementation
- Lock persists across logCtx calls via Context parent-child relationship
