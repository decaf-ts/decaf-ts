# TASK_77: Document transaction decorator usage and lock lifecycle

**Task ID:** TASK_77  
**Priority:** Medium  
**Status:** Pending  
**Estimated Time:** 4 hours  
**Reference:** DECAF_7 (Section 4 Architecture & Design, Section 7 Results & Artifacts)

## Description
Document transaction decorator usage patterns, lock lifecycle, hierarchical locking, and integration with adapters.

## Requirements (from DECAF_7)
- Document transaction decorator usage
- Document lock lifecycle (acquire/release, begin/end transaction)
- Document hierarchical locking levels (none, adapter, table, record)
- Document nested transaction behavior
- Document integration with adapters

## Deliverables
- [ ] Documentation in `core/docs/TRANSACTIONS.md`
- [ ] Usage examples for @transactional decorator
- [ ] Lock lifecycle diagram and explanation
- [ ] Hierarchical locking documentation (levels, parameters)
- [ ] Nested transaction behavior explanation
- [ ] Adapter integration guide
- [ ] Configuration examples (maxConcurrent, lock levels)

## Dependencies
- TASK_75 (@transactional decorator tests)
- TASK_76 (integration tests with RamAdapter)

## Blocked By
- None

## Notes
- See DECAF_7 Section 7 for expected artifacts
- Include code examples for all major use cases
- Document the MethodCall Sequence from DECAF_7
