# TASK_68: Add abstract beginTransaction/endTransaction methods to Adapter base class

**Task ID:** TASK_68  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 2 hours  
**Reference:** DECAF_7 (Section 4 Architecture & Design, Req-6)

## Description
Add abstract async methods `beginTransaction()` and `endTransaction()` to the Adapter base class for transaction management.

## Requirements (from DECAF_7)
- Adapter base class MUST define abstract async methods: beginTransaction, endTransaction
- Base implementation is a no-op (adapters can override)
- beginTransaction called by transaction decorator on first acquire
- endTransaction called by transaction decorator on last release

## Deliverables
- [ ] Updated `core/src/persistence/Adapter.ts` with abstract beginTransaction/endTransaction methods
- [ ] Protected async methods with proper JSDoc comments
- [ ] Default no-op implementation in base class
- [ ] Documentation of when methods are called

## Dependencies
- None

## Blocked By
- None

## Notes
- See DECAF_7 Section 4.2 (Adapter Base Class) for implementation
- RamAdapter will override these methods for transaction management
