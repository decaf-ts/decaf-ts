# TASK-30: Document Object Instantiation Behavior

**Specification:** [DECAF-5](../DECAF_5.md)  
**Priority:** Medium  
**Status:** Pending  
**Estimated Time:** 1-2 hours

## Objective
Update documentation to clearly communicate the object instantiation guarantees for `FabricClientAdapter` and `FabricClientRepository`.

## Documentation Sources

### 1. Repository Class Documentation
Update JSDoc in `for-fabric/src/client/FabricClientRepository.ts`:
- Class-level: Add note about instantiation behavior
- Method-level: Add `@returns` that specifies instance types

Example:
```typescript
/**
 * @description Executes a prepared statement query
 * @returns {Promise<M[] | M | SerializedPage<M>>} 
 *   Returns either an array of model instances, a single model instance,
 *   or a paginated result with instance-wrapped data
 */
```

### 2. Specification README / Docs
Add section to `for-fabric/README.md` (or create `for-fabric/docs/QUERY-behavior.md`):

## Object Instantiation Behavior

### Overview
All query operations through `FabricClientRepository` return properly instantiated model objects (class instances) when a model class is associated with the repository. This ensures access to instance methods and preserved class behavior.

### guarantees
- ✅ `listBy()`, `findBy()`, `find()` → `M[]` (instances)
- ✅ `findOneBy()` → `M` (instance)
- ✅ `page()`, `paginateBy()` → `SerializedPage<M>` with `data` containing instances
- ✅ `statement()` → `M[] | M | SerializedPage<M>` (instances)
- ❌ `countOf()`, `maxOf()`, etc. → primitives (no instantiation)

### Aggregation Methods
Aggregate methods return JavaScript primitives (numbers, strings, plain objects) rather than instances. These are designed for computed results, not model instances:

| Method | Return Type | Example |
|:-------|:-----------|:--------|
| `countOf()` | `number` | `42` |
| `maxOf("field")` | `string | number` | `"wallet-99"` |
| `minOf("field")` | `string | number` | `"wallet-1"` |
| `avgOf("field")` | `number` | `3.14` |
| `sumOf("field")` | `number` | `100` |
| `distinctOf("field")` | `Array<string \| number>` | `["a", "b", "c"]` |
| `groupOf("field")` | `Record<string, M[]>` | `{ group1: [instance, ...], ... }` |

### When Plain Objects Are Returned
If a repository is created without a model class (`new FabricClientRepository(adapter)`), queries return plain JSON objects instead of instances. This is useful for raw queries or schema introspection.

### Performance Considerations
- Instantiation adds minimal overhead for typical result sizes
- For very large result sets (>1000 items), consider pagination
- No configuration flag is currently available to disable instantiation

### Migration Guide
If you were relying on receiving plain objects:
- **Before:** `const results: Record<string, any>[] = await repo.find(...);`
- **After:** `const results: MyModel[] = await repo.find(...);`
- Access properties the same way: `results[0].field` or `results[0]["field"]`

### Examples

```typescript
// Query returns instances
const wallets: Wallet[] = await repo.findBy("owner", "alice");
console.log(wallets[0] instanceof Wallet); // true

// Pagination
const page = await repo.page("search", OrderDirection.ASC, { limit: 10 });
console.log(page.data[0] instanceof Wallet); // true

// Aggregates return primitives
const count: number = await repo.countOf();
const maxId: string = await repo.maxOf("id");
```

### API Reference
Reference the specific methods and their `@returns` annotations in the Typedoc/JSDoc comments.

## Deliverables
- [ ] Updated JSDoc in `FabricClientRepository.ts` with instantiation notes
- [ ] Updated `for-fabric/README.md` or new doc file with behavior guide
- [ ] Include code examples showing before/after if relevant
- [ ] Link to this spec (DECAF-5) for more details

## Notes
Keep the documentation concise and focused on practical usage. Link to DECAF-5 spec for implementation details.
