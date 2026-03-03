# TASK-27: Audit FabricClientRepository Query Methods

**Specification:** [DECAF-5](../DECAF_5.md)  
**Priority:** High  
**Status:** COMPLETED  
**Completed:** 2026-02-26

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

## Audit Results

### Implementation Review

**FabricClientRepository.statement() (lines 206-244):**
```typescript
if (Array.isArray(result)) {
  return result.map((r: any) =>
    (r as any)[CouchDBKeys.TABLE] &&
    (r as any)[CouchDBKeys.TABLE] === Model.tableName(this.class)
      ? new this.class(r)
      : r
  );
}
return (result as any)[CouchDBKeys.TABLE] &&
  (result as any)[CouchDBKeys.TABLE] === Model.tableName(this.class)
  ? new this.class(result)
  : Paginator.isSerializedPage(result)
    ? Object.assign(result, {
        data: result.data.map((d: any) => new this.class(d)),
      })
    : result;
```

### Query Methods Audit Table

| Method | Returns | Instantiates? | Status |
|:-------|:--------|:--------------|:-------|
| `statement()` | varies | ✅ | **VERIFIED** - Correctly instantiates via `new this.class()` |
| `listBy()` | `M[]` | ✅ | **VERIFIED** - Uses statement() |
| `findBy()` | `M[]` | ✅ | **VERIFIED** - Uses statement() |
| `findOneBy()` | `M` | ✅ | **VERIFIED** - Uses statement() |
| `find()` | `M[]` | ✅ | **VERIFIED** - Uses statement() |
| `page()` | `SerializedPage<M>` | ✅ | **VERIFIED** - Uses statement() |
| `paginateBy()` | `SerializedPage<M>` | ✅ | **VERIFIED** - Uses statement() |
| `countOf()` | `number` | ❌ | **VERIFIED** - Returns primitive (correct) |
| `maxOf()` | `M[K]` | ❌ | **VERIFIED** - Returns primitive (correct) |
| `minOf()` | `M[K]` | ❌ | **VERIFIED** - Returns primitive (correct) |
| `avgOf()` | `number` | ❌ | **VERIFIED** - Returns primitive (correct) |
| `sumOf()` | `number` | ❌ | **VERIFIED** - Returns primitive (correct) |
| `distinctOf()` | `M[K][]` | ❌ | **VERIFIED** - Returns primitives (correct) |
| `groupOf()` | `Record<string, M[]>` | ❌ | **VERIFIED** - Returns structured (correct) |

### Key Findings

1. **✅ CORRECT BEHAVIOR:** The current implementation properly instantiates model objects for all query methods except aggregates
2. **CouchDBKeys.TABLE Check:** Appropriate and necessary for Fabric's response format - Fabric chaincode returns models with table metadata, primitives don't have this
3. **Aggregates:** Correctly return primitive values without attempted instantiation
4. **Paginated Results:** Correctly wrap `data` array items with `new this.class(d)`

## Deliverables

- [x] Detailed audit report ✅
- [x] Categorize each method ✅
- [x] List edge cases ✅
- [x] Reference line numbers ✅

## Edge Cases

1. **Fabric chaincode without table metadata:** If chaincode returns plain JSON without `CouchDBKeys.TABLE`, it will return as-is (not instantiated). This is expected and correct for non-model responses.

2. **Mixed result types:** If a query returns both models and primitives, models will be instantiated while primitives remain as-is (handled by conditional check).

## Dependencies
- None (completed)

## Notes
📝 **CONCLUSION:** NO CODE CHANGES REQUIRED. The current implementation in `FabricClientRepository.statement()` is correct and properly instantiates model objects while returning primitives for aggregate operations.
