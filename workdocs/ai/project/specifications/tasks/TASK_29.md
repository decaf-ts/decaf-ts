# TASK-29: Add Instantiation Tests for All Queries

**Specification:** [DECAF-5](../DECAF_5.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 4-6 hours

## Objective
Create comprehensive test coverage for all `FabricClientRepository` query methods to verify they return properly instantiated model objects.

## Current Test Coverage
Existing tests in `for-fabric/tests/unit/client-fabric-client-repository.test.ts`:
- `describe.skip()` — tests are skipped entirely
- Basic adapter and repo setup with mock
- No tests for query methods (listBy, findBy, page, statement, aggregates)

## New Tests Required

### Test File: `for-fabric/tests/unit/client-fabric-client-repository.test.ts`

#### A. Statement Tests
```typescript
describe("FabricClientRepository statement() instantiation", () => {
  it("returns instances for array results", async () => {
    // Mock statement returning JSON array
    // Verify each item is instanceof Wallet
  });

  it("returns single instance for object results", async () => {
    // Mock single object result
    // Verify result is instanceof Wallet
  });

  it("returns page with instance-wrapped data", async () => {
    // Mock paginated result
    // Verify page.data items are instances
  });

  it("skips instantiation when no class is set", async () => {
    // Create repo without class
    // Verify return is plain object
  });
});
```

#### B. List/Find Tests
```typescript
describe("FabricClientRepository list/find methods", () => {
  it("listBy() returns instances", async () => {
    const result = await repo.listBy("id", OrderDirection.ASC);
    expect(result[0]).toBeInstanceOf(Wallet);
  });

  it("findBy() returns instances", async () => {
    const result = await repo.findBy("id", "wallet-1");
    expect(result[0]).toBeInstanceOf(Wallet);
  });

  it("findOneBy() returns instance", async () => {
    const result = await repo.findOneBy("id", "wallet-1");
    expect(result).toBeInstanceOf(Wallet);
  });

  it("find() returns instances", async () => {
    const result = await repo.find("search-term");
    expect(result[0]).toBeInstanceOf(Wallet);
  });

  it("page() returns page with instances", async () => {
    const result = await repo.page("search-term", OrderDirection.ASC, {
      offset: 1,
      limit: 10,
    });
    expect(result.data[0]).toBeInstanceOf(Wallet);
  });
});
```

#### C. Aggregate Tests
```typescript
describe("FabricClientRepository aggregates", () => {
  it("countOf() returns primitive number", async () => {
    const result = await repo.countOf();
    expect(typeof result).toBe("number");
  });

  it("maxOf() returns primitive", async () => {
    const result = await repo.maxOf("id");
    expect(typeof result).toBe("string");
  });

  it("minOf() returns primitive", async () => {
    const result = await repo.minOf("id");
    expect(typeof result).toBe("string");
  });

  it("avgOf() returns primitive number", async () => {
    const result = await repo.avgOf("someField");
    expect(typeof result).toBe("number");
  });

  it("sumOf() returns primitive number", async () => {
    const result = await repo.sumOf("someField");
    expect(typeof result).toBe("number");
  });

  it("distinctOf() returns array of primitives", async () => {
    const result = await repo.distinctOf("id");
    expect(Array.isArray(result)).toBe(true);
    expect(typeof result[0]).toBe("string");
  });

  it("groupOf() returns object with primitive keys", async () => {
    const result = await repo.groupOf("id");
    expect(typeof result).toBe("object");
  });
});
```

#### D. Edge Cases
```typescript
describe("FabricClientRepository edge cases", () => {
  it("handles empty array results", async () => {
    const result = await repo.listBy("id", OrderDirection.ASC);
    expect(result).toEqual([]);
  });

  it("handles null/undefined results from adapter", async () => {
    // Test adapter returns null or undefined
    // Ensure safe handling
  });

  it("preserves model methods after instantiation", async () => {
    const result = await repo.listBy("id", OrderDirection.ASC);
    expect(result[0].hasErrors).toBeInstanceOf(Function);
  });
});
```

## Test Infrastructure
- Mock adapter responses that return pure JSON (no `CouchDBKeys.TABLE`)
- Ensure mocks don't include table metadata to test the fix
- Use `Wallet` model (already defined in test file)

## Deliverables
- [ ] All new tests added to `client-fabric-client-repository.test.ts`
- [ ] Tests pass with coverage >90% for query methods
- [ ] Tests run in CI pipeline
- [ ] Documentation in test comments explaining what's being verified

## Dependencies
- TASK-28 (fix statement() logic) should be complete before writing tests
- Test should fail initially, then pass after the fix
