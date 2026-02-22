# TASK-37: Update Repository Methods to Use Unified Query Building

**Specification:** [DECAF-6](../DECAF_6.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 3-4 hours

## Objective
Update TypeORMRepository methods to ensure they use the unified query building from TypeORMStatement instead of custom SQL generation.

## Methods to Update

### Current Implementation Pattern (to be replaced)
```typescript
// TypeORMRepository.ts - current custom query logic
override async listBy(
  key: keyof M,
  order: OrderDirection,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[]> {
  const { log, ctxArgs } = (await this.logCtx(args, PreparedStatementKeys.LIST_BY, true)).for(this.listBy);
  log.verbose(`listing ${Model.tableName(this.class)} by ${key as string} ${order}`);
  
  // Custom SQL building
  return (await this.statement(
    this.listBy.name,
    key,
    order,
    ...ctxArgs
  )) as any;
}
```

### New Implementation (using unified query building)
```typescript
// TypeORMRepository.ts - unified approach
override async listBy(
  key: keyof M,
  order: OrderDirection,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[]> {
  const { log, ctxArgs } = (await this.logCtx(args, PreparedStatementKeys.LIST_BY, true)).for(this.listBy);
  log.verbose(`listing ${Model.tableName(this.class)} by ${key as string} ${order}`);
  
  // Build query using unified TypeORMStatement
  const statement = this.statement(this.listBy.name, key, order, ...ctxArgs);
  const query = await statement.build();
  return this.raw<M[]>(query);
}
```

## Updated Repository Methods

```typescript
// TypeORMRepository.ts (refactored)

override async listBy(
  key: keyof M,
  order: OrderDirection,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[]> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.LIST_BY, true)
  ).for(this.listBy);

  log.verbose(
    `listing ${Model.tableName(this.class)} by ${key as string} ${order}`
  );

  // Use unified query building
  const statement = this.statement(this.listBy.name, key, order, ...ctxArgs);
  const query = await statement.build();
  return this.raw<M[]>(query);
}

override async findBy(
  key: keyof M,
  value: any,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[]> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.FIND_BY, true)
  ).for(this.findBy);

  log.verbose(
    `finding all ${Model.tableName(this.class)} with ${key as string} ${value}`
  );

  const statement = this.statement(this.findBy.name, key, value, ...ctxArgs);
  const query = await statement.build();
  return this.raw<M[]>(query);
}

override async findOneBy(
  key: keyof M,
  value: any,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.FIND_ONE_BY, true)
  ).for(this.findOneBy);

  log.verbose(
    `finding One ${Model.tableName(this.class)} with ${key as string} ${value}`
  );

  const results = await this.findBy(key, value, ...ctxArgs);
  if (!results.length) {
    throw new NotFoundError(
      `${Model.tableName(this.class)} with ${key as string} ${value} not found`
    );
  }
  return results[0];
}

override async find(
  value: string,
  order: OrderDirection = OrderDirection.ASC,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[]> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.FIND, true)
  ).for(this.find);

  log.verbose(`finding ${Model.tableName(this.class)} by default query attributes`);

  const statement = this.statement(this.find.name, value, order, ...ctxArgs);
  const query = await statement.build();
  return this.raw<M[]>(query);
}

override async page(
  value: string,
  direction: OrderDirection = OrderDirection.ASC,
  ref: Omit<DirectionLimitOffset, 'direction'> = { offset: 1, limit: 10 },
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<SerializedPage<M>> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.PAGE, true)
  ).for(this.page);

  log.verbose(`paging ${Model.tableName(this.class)} by default query attributes`);

  const statement = this.statement(this.page.name, value, direction, ref, ...ctxArgs);
  const query = await statement.build();
  return this.raw<SerializedPage<M>>(query);
}

override async paginateBy(
  key: keyof M,
  order: OrderDirection,
  ref: Omit<DirectionLimitOffset, 'direction'> = { offset: 1, limit: 10 },
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<SerializedPage<M>> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.PAGE_BY, true)
  ).for(this.paginateBy);

  log.verbose(
    `paginating ${Model.tableName(this.class)} with page size ${ref.limit}`
  );

  const statement = this.statement(
    this.paginateBy.name,
    key,
    order,
    { limit: ref.limit, offset: ref.offset, bookmark: ref.bookmark },
    ...ctxArgs
  );
  const query = await statement.build();
  return this.raw<SerializedPage<M>>(query);
}
```

## Aggregate Methods

The aggregate methods should also use the unified query builder:

```typescript
// TypeORMRepository.ts (aggregates)

override async countOf(
  key?: keyof M,
  ...args: MaybeContextualArg<ContextOf<A>>
]: Promise<number> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.COUNT_OF, true)
  ).for(this.countOf);

  log.verbose(
    `counting ${Model.tableName(this.class)}${key ? ` by ${key as string}` : ''}`
  );

  const statement = this.statement(
    PreparedStatementKeys.COUNT_OF,
    key ? [key, ...ctxArgs] : ctxArgs
  );
  return this.raw<number>(await statement.build());
}

override async maxOf<K extends keyof M>(
  key: K,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[K]> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.MAX_OF, true)
  ).for(this.maxOf);

  log.verbose(
    `finding max of ${key as string} in ${Model.tableName(this.class)}`
  );

  const statement = this.statement(PreparedStatementKeys.MAX_OF, key, ...ctxArgs);
  return this.raw<M[K]>(await statement.build());
}

override async minOf<K extends keyof M>(
  key: K,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[K]> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.MIN_OF, true)
  ).for(this.minOf);

  log.verbose(
    `finding min of ${key as string} in ${Model.tableName(this.class)}`
  );

  const statement = this.statement(PreparedStatementKeys.MIN_OF, key, ...ctxArgs);
  return this.raw<M[K]>(await statement.build());
}

override async avgOf<K extends keyof M>(
  key: K,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<number> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.AVG_OF, true)
  ).for(this.avgOf);

  log.verbose(
    `calculating avg of ${key as string} in ${Model.tableName(this.class)}`
  );

  const statement = this.statement(PreparedStatementKeys.AVG_OF, key, ...ctxArgs);
  return this.raw<number>(await statement.build());
}

override async sumOf<K extends keyof M>(
  key: K,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<number> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.SUM_OF, true)
  ).for(this.sumOf);

  log.verbose(
    `calculating sum of ${key as string} in ${Model.tableName(this.class)}`
  );

  const statement = this.statement(PreparedStatementKeys.SUM_OF, key, ...ctxArgs);
  return this.raw<number>(await statement.build());
}

override async distinctOf<K extends keyof M>(
  key: K,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[K][]> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.DISTINCT_OF, true)
  ).for(this.distinctOf);

  log.verbose(
    `finding distinct values of ${key as string} in ${Model.tableName(this.class)}`
  );

  const statement = this.statement(PreparedStatementKeys.DISTINCT_OF, key, ...ctxArgs);
  return this.raw<M[K][]>(await statement.build());
}

override async groupOf<K extends keyof M>(
  key: K,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<Record<string, M[]>> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.GROUP_OF, true)
  ).for(this.groupOf);

  log.verbose(`grouping ${Model.tableName(this.class)} by ${key as string}`);

  const statement = this.statement(PreparedStatementKeys.GROUP_OF, key, ...ctxArgs);
  return this.raw<Record<string, M[]>>(await statement.build());
}
```

## Query Building Consistency

### Before (Custom SQL)
```typescript
// TypeORMRepository - before refactoring
// Each method had custom SQL building logic
// Different from TypeORMStatement
// Hard to maintain and test
```

### After (Unified)
```typescript
// TypeORMRepository - after refactoring
// All methods use TypeORMStatement.build()
// Consistent query building across all operations
// Easier to maintain and test

override async create(
  model: M,
  ...args: MaybeContextualArg<ContextOf<A>>
  ): Promise<M> {
  // CRUD methods remain unchanged (use createPrefix, etc.)
}

override async update(
  model: M,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M> {
  // CRUD methods remain unchanged
}

override async statement(
  name: string,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<any> {
  const { log, ctx, ctxArgs } = (
    await this.logCtx(args, PersistenceKeys.STATEMENT, true)
  ).for(this.statement);
  
  log.verbose(`Executing prepared statement ${name}`);
  
  const statement = this.statementBuilder(name, ...ctxArgs);
  const query = await statement.build();
  return this.raw(query);
}

private statementBuilder(
  name: string,
  ...args: any[]
): TypeORMStatement<M, any> {
  const stmt = new TypeORMStatement<M, any>(this.adapter);
  // Build statement based on name and args
  // Use the unified query building
  return stmt;
}
```

## Testing Strategy

### Unit Tests
```typescript
// for-typeorm/tests/unit/repository-query-unified.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TypeORMDriver } from '../../src/types';
import { TypeORMAdapter } from '../../src/TypeORMAdapter';
import { TypeORMRepository } from '../../src/TypeORMRepository';
import { Model, model, pk } from '@decaf-ts/decorator-validation';

describe('TypeORMRepository - Unified Query Building', () => {
  let adapter: TypeORMAdapter;
  let repo: TypeORMRepository<TestModel>;

  @model()
  class TestModel extends Model {
    @pk()
    id!: string;
    name!: string;
    age!: number;
  }

  beforeEach(() => {
    adapter = {
      // Mock adapter
      client: {
        getRepository: jest.fn().mockReturnThis(),
        query: jest.fn(),
      },
      // ... other mock methods
    } as any;

    repo = new TypeORMRepository(adapter, TestModel);
  });

  it('listBy() uses unified query building', async () => {
    const buildSpy = jest.spyOn(TypeORMStatement.prototype, 'build');
    await repo.listBy('id', OrderDirection.ASC);

    expect(buildSpy).toHaveBeenCalled();
  });

  it('findBy() uses unified query building', async () => {
    const buildSpy = jest.spyOn(TypeORMStatement.prototype, 'build');
    await repo.findBy('name', 'John');

    expect(buildSpy).toHaveBeenCalled();
  });

  it('find() uses unified query building', async () => {
    const buildSpy = jest.spyOn(TypeORMStatement.prototype, 'build');
    await repo.find('search');

    expect(buildSpy).toHaveBeenCalled();
  });

  it('page() uses unified query building', async () => {
    const buildSpy = jest.spyOn(TypeORMStatement.prototype, 'build');
    await repo.page('search', OrderDirection.ASC, { limit: 10 });

    expect(buildSpy).toHaveBeenCalled();
  });

  it('aggregate methods use unified query building', async () => {
    const buildSpy = jest.spyOn(TypeORMStatement.prototype, 'build');
    await repo.countOf();

    expect(buildSpy).toHaveBeenCalled();
  });
});
```

### Integration Tests
```typescript
// for-typeorm/tests/integration/unified-query.test.ts

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { TypeORMDriver } from '../../../src/types';
import { TypeORMAdapter } from '../../../src/TypeORMAdapter';
import { TypeORMRepository } from '../../../src/TypeORMRepository';
import { Model, model, pk } from '@decaf-ts/decorator-validation';
import { DataSourceOptions } from 'typeorm';

describe('TypeORMRepository - Unified Query Integration', () => {
  let adapter: TypeORMAdapter;
  let repo: TypeORMRepository<TestModel>;

  @model()
  class TestModel extends Model {
    @pk()
    id!: string;
    name!: string;
    age!: number;
  }

  beforeAll(async () => {
    const config: DataSourceOptions = {
      type: TypeORMDriver.SQLITE,
      database: ':memory:',
      entities: [TestModel],
      synchronize: true,
    };

    adapter = new TypeORMAdapter(config);
    await adapter.initialize();
    repo = new TypeORMRepository(adapter, TestModel);

    // Create test data
    await repo.createAll([
      new TestModel({ id: '1', name: 'Alice', age: 30 }),
      new TestModel({ id: '2', name: 'Bob', age: 25 }),
      new TestModel({ id: '3', name: 'Charlie', age: 35 }),
    ]);
  });

  afterAll(async () => {
    await adapter.destroy();
  });

  it('listBy() returns sorted results', async () => {
    const results = await repo.listBy('age', OrderDirection.ASC);
    expect(results.length).toBe(3);
    expect(results[0].age).toBe(25);
    expect(results[1].age).toBe(30);
    expect(results[2].age).toBe(35);
  });

  it('findBy() returns filtered results', async () => {
    const results = await repo.findBy('name', 'Bob');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Bob');
  });

  it('find() returns matching results', async () => {
    const results = await repo.find('Bob');
    expect(results.length).toBe(1);
  });

  it('page() returns paginated results', async () => {
    const results = await repo.page('search', OrderDirection.ASC, {
      limit: 2,
      offset: 0,
    });

    expect(results.data.length).toBe(2);
    expect(results.total).toBe(3);
  });

  it('countOf() returns correct count', async () => {
    const count = await repo.countOf();
    expect(count).toBe(3);
  });

  it('maxOf() returns maximum value', async () => {
    const maxAge = await repo.maxOf('age');
    expect(maxAge).toBe(35);
  });

  it('minOf() returns minimum value', async () => {
    const minAge = await repo.minOf('age');
    expect(minAge).toBe(25);
  });
});
```

## Deliverables
- [ ] All TypeORMRepository methods updated to use TypeORMStatement.build()
- [ ] CRUD methods (create, update, delete) remain unchanged
- [ ] Query methods (listBy, findBy, find, page, paginateBy) use unified building
- [ ] Aggregate methods (countOf, maxOf, minOf, avgOf, sumOf, distinctOf, groupOf) use unified building
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Query consistency verified across all methods

## Notes
- Ensure backward compatibility with existing code
- The unified approach should produce identical results to the previous implementation
- All tests should continue to pass before merging
