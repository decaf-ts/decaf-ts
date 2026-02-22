# TASK-28: Fix statement() Instantiation Logic

**Specification:** [DECAF-5](../DECAF_5.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 3-6 hours

## Objective
Update `FabricClientRepository.statement()` to consistently instantiate model objects for all query results, removing the current dependency on `CouchDBKeys.TABLE` metadata presence.

## Current Behavior
The `statement()` method (lines 206-244) contains this logic:
- For arrays: only instantiates if `record[CouchDBKeys.TABLE] === Model.tableName(this.class)`
- For single objects: only instantiates if `record[CouchDBKeys.TABLE] === Model.tableName(this.class)`
- For pages: wraps `data` array items correctly

**Issue:** If fabric chaincode doesn't return `CouchDBKeys.TABLE` in the response, results fall through as plain JSON objects.

## Fix Strategy
Replace the conditional instantiation with a more robust approach:

```typescript
protected shouldInstantiate<M extends Model>(): boolean {
  return !!this.class;
}

protected instantiate<M extends Model>(
  record: any,
  clazz: Constructor<M>
): M {
  return new clazz(record);
}
```

Update `statement()` to:
1. Check if `this.class` is set (model class is associated with repository)
2. If yes, instantiate ALL results (arrays and objects) regardless of metadata
3. For aggregates (countOf, maxOf, etc.), skip instantiation explicitly

## Implementation Steps
1. Add helper methods `shouldInstantiate()` and `instantiate()` to `FabricClientRepository`
2. Modify `statement()` to always instantiate when `this.class` is set
3. Ensure aggregate methods document they return primitives
4. Preserve existing behavior for non-model queries (where `this.class` is undefined)

## Tests Required
- [ ] Array result with class set → instances returned
- [ ] Single object result with class set → instance returned
- [ ] Page result with class set → data array wrapped with instances
- [ ] No class set ((undefined)) → plain objects returned
- [ ] Array result without table metadata → instances created anyway
- [ ] Aggregate methods → primitives returned, no instantiation

## Deliverables
- [ ] Updated `for-fabric/src/client/FabricClientRepository.ts` with new instantiation logic
- [ ] All existing tests continue to pass
- [ ] New tests added in `for-fabric/tests/unit/client-fabric-client-repository.test.ts`

## Dependencies
- TASK-27 (audit report) should be complete to understand current behavior
- No breaking changes expected, but verify existing consumers don't rely on JSON-only returns

## Notes
Consider adding a config flag if there are performance concerns for large result sets where instantiation overhead matters.
