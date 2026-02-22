# TASK_66: Refactor @transactional decorator using Decoration API

**Task ID:** TASK_66  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 8 hours  
**Reference:** DECAF_7 (Overview, Section 4 Architecture & Design)

## Description
Refactor the `@transactional` decorator in the `@decaf-ts/transactional-decorators` package to use the Decoration API for proper transaction management with adapter-provided lock instances.

## Requirements (from DECAF_7)
- Use Decoration API for decorator implementation
- Lock MUST survive multiple calls to `logCtx` 
- Lock MUST be passed via adapter configuration, not created internally
- Support hierarchical locking via `acquire(level, tableName?, recordId?)` parameters
- Call adapter's beginTransaction on first acquire
- Call adapter's endTransaction on last release
- Support configurable maxConcurrent transactions

## Deliverables
- [ ] Updated `@transactional` decorator using Decoration API
- [ ] Lock instance persisted in Context via `ctx.accumulate({ transactionLock: lockProxy })`
- [ ] Support for nested decorator calls sharing the same lock instance
- [ ] Proper level/tableName/recordId parameter handling
- [ ] Migration to use Decoration API pattern

## Dependencies
- None

## Blocked By
- None

## Notes
- See DECAF_7 Section 4.5 (Decorator Handler) for implementation details
- Lock must be retrieved from `adapter.config.lock`, not created internally
- Must handle nested calls by reusing existing lock from Context
