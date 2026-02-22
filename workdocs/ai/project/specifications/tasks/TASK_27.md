# TASK-27: Audit FabricClientRepository Query Methods

**Specification:** [DECAF-5](../DECAF_5.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 2-4 hours

## Objective
Perform a comprehensive audit of `FabricClientRepository` to identify all query methods and their current behavior regarding object instantiation. Document which methods return plain JSON objects vs. properly instantiated model objects.

## Scope
Audit the following methods in `for-fabric/src/client/FabricClientRepository.ts`:
- `statement()` — primary query dispatcher
- `listBy()` — list operations
- `findBy()` — find operations
- `findOneBy()` — singleton find
- `find()` — default find
- `page()` — paginated queries
- `paginateBy()` — paginated by field
- `countOf()` — aggregate (should remain primitive)
- `maxOf()` — aggregate (should remain primitive)
- `minOf()` — aggregate (should remain primitive)
- `avgOf()` — aggregate (should remain primitive)
- `sumOf()` — aggregate (should remain primitive)
- `distinctOf()` — aggregate (should remain primitive)
- `groupOf()` — aggregate (should remain primitive)

## Deliverables
- [ ] Detailed audit report in a new file: `workdocs/ai/project/specifications/tasks/TASK_27.md`
- [ ] In the audit report, categorize each method as:
  - ✅ Returns instances correctly
  - ⚠️ Returns instances conditionally (only if table metadata matches)
  - ❌ Returns JSON objects (needs fix)
- [ ] List any edge cases where instantiation may fail silently
- [ ] Reference specific line numbers and code snippets

## Dependencies
- None (preparatory task)

## Notes
This is a documentation/research task only. No code changes needed.
