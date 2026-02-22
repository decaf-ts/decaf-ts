# TASK-36: Refactor TypeORMStatement to Use TypeORM Query API

**Specification:** [DECAF-6](../DECAF_6.md)  
**Priority:** High  
**Status:** Pending  
**Estimated Time:** 6-8 hours

## Objective
Refactor TypeORMStatement to use TypeORM's native query builder API (the same FindOperator pattern used in listBy/findBy/findOneBy/repository.find()) instead of custom SQL string generation. This ensures all queries use the same underlying query building mechanism and work across all database drivers.

## Background

### TypeORMStatement Current State
TypeORMStatement's `parseCondition()` method currently:
1. Uses `translateOperators()` to map operators to PostgreSQL-specific SQL
2. Manually constructs SQL strings like `${tableName}.${attr1} ${sqlOperator} :${attrRef}`
3. Passes these strings to SelectQueryBuilder.where()

```typescript
// Current implementation
protected parseCondition(condition, tableName, qb): TypeORMQuery<M> {
  const sqlOperator = translateOperators(operator); // PostgreSQL-specific
  const queryStr = `${tableName}.${attr1} ${sqlOperator} :${attrRef}`; // SQL string
  return { query: qb.where(queryStr, values) as any };
}
```

### Repository Methods Pattern (What We Want)
Repository methods (listBy, findBy, page, etc.) use TypeORM's FindOperator API:

```typescript
// TypeORMRepository.listBy() - Uses TypeORM's native find options
const transformedQuery: FindManyOptions<M> = {
  where: { [key]: Like(`%${value}%`) },
  order: { [key]: 'ASC' },
};
return this.adapter.client.findBy(transformedQuery);
```

## Problem Statement
**TypeORMStatement should use TypeORM's query builder API the same way listBy/findBy do** - not raw SQL strings or custom translation layers.

### Issues:
1. `translateOperators()` creates PostgreSQL-specific SQL instead of using TypeORM operators
2. Custom SQL string building bypasses TypeORM's operator system
3. Inconsistent with repository methods that work across drivers
4. Harder to maintain and test

## Solution: Use TypeORM FindOperator Pattern

### Refactored TypeORMStatement.parseCondition()
Instead of SQL string building, use TypeORM's FindOperator objects:

```typescript
// BEFORE (Current)
protected parseCondition(condition, tableName, qb): TypeORMQuery<M> {
  const sqlOperator = translateOperators(operator);
  const queryStr = `${tableName}.${attr1} ${sqlOperator} :${attrRef}`;
  return { query: qb.where(queryStr, values) as any };
}

// AFTER (Target - same as listBy/findBy)
protected parseCondition(condition, alias): FindOptionsWhere<M> {
  const { attr1, operator, comparison } = condition;
  
  // Use TypeORM's FindOperator - driver-agnostic
  const whereClause = {
    [`${alias}.${attr1}`]: this.translateToTypeORMOperator(operator, comparison)
  };
  
  return whereClause;
}

private translateToTypeORMOperator(operator: Operator, comparison: any) {
  switch (operator) {
    case Operator.EQUAL:
      return comparison;  // Direct assignment
    case Operator.BIGGER:
      return MoreThan(comparison);
    case Operator.BIGGER_EQ:
      return MoreThanOrEqual(comparison);
    case Operator.SMALLER:
      return LessThan(comparison);
    case Operator.SMALLER_EQ:
      return LessThanOrEqual(comparison);
    case Operator.IN:
      return In(Array.isArray(comparison) ? comparison : [comparison]);
    case Operator.BETWEEN:
      return Between(comparison[0], comparison[1]);
    case Operator.STARTS_WITH:
      return Like(`${comparison}%`);
    case Operator.ENDS_WITH:
      return Like(`%${comparison}`);
    default:
      return comparison;
  }
}
```

### Benefits:
1. **Driver Agnostic:** TypeORM operators work across all database drivers
2. **Consistent:** Uses same pattern as listBy/findBy/findOneBy
3. **Maintainable:** No custom SQL translation layer needed
4. **Type Safe:** Leverages TypeORM's FindOperator types
5. **Testable:** Easier to unit test operator translation

## Current Implementation Issues

### Problem 1: PostgreSQL-Specific SQL String Generation
```typescript
// Current: TypeORMStatement.ts line 576-617
function parse(): TypeORMQuery<M> {
  const sqlOperator = translateOperators(operator);
  const attrRef = `${attr1}${counter}`;
  let queryStr: string;
  let values: Record<string, any>;

  // Direct SQL string building
  queryStr = `${tableName}.${attr1} ${sqlOperator} :${attrRef}`;
  values = { [attrRef]: paramValue };

  return { query: qb.where(queryStr, values) as any };
}
```

### Problem 2: Inconsistent with Repository Methods
```typescript
// Current: TypeORMRepository.ts line 106-123
override async listBy(
  key: keyof M,
  order: OrderDirection,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[]> {
  // Uses custom SQL generation logic
  // NOT using TypeORMStatement.build()
  return (await this.statement(
    this.listBy.name,
    key,
    order,
    ...ctxArgs
  )) as any;
}
```

### Problem 3: Translator Layer
```typescript
// Current: translate.ts (separate file)
export function translateOperators(operator: Operator): string {
  switch (operator) {
    case Operator.EQUAL:
      return '=';
    case Operator.BIGGER:
      return '>';
    // ... direct SQL operator mapping
  }
}
```

## Refactored Implementation

### Step 1: Remove translateOperators

Replace the translator with TypeORM's built-in FindOperators:

```typescript
// src/query/constants.ts (update)
import { FindOperator, In, Between, Like, MoreThan, MoreThanOrEqual, LessThan, LessThanOrEqual, Raw } from 'typeorm';

export function translateToTypeORMOperator(
  operator: Operator,
  comparison: any
): FindOperator<any> | any {
  switch (operator) {
    case Operator.EQUAL:
      return comparison;
    case Operator.BIGGER:
      return MoreThan(comparison);
    case Operator.BIGGER_EQ:
      return MoreThanOrEqual(comparison);
    case Operator.SMALLER:
      return LessThan(comparison);
    case Operator.SMALLER_EQ:
      return LessThanOrEqual(comparison);
    case Operator.IN:
      return In(Array.isArray(comparison) ? comparison : [comparison]);
    case Operator.BETWEEN:
      if (!Array.isArray(comparison) || comparison.length !== 2) {
        throw new QueryError('BETWEEN requires an array with two values');
      }
      return Between(comparison[0], comparison[1]);
    case Operator.STARTS_WITH:
      return Like(`${comparison}%`);
    case Operator.ENDS_WITH:
      return Like(`%${comparison}`);
    case Operator.REGEXP:
      return Raw((alias) => `${alias} ~ :regex`, { regex: comparison });
    default:
      return comparison;
  }
}
```

### Step 2: Refactor parseCondition

```typescript
// TypeORMStatement.ts (refactored)

protected parseCondition(
  condition: Condition<M>,
  tableName: string,
  qb: SelectQueryBuilder<any>,
  counter = 0,
  conditionalOp?: GroupOperator | Operator
): TypeORMQuery<M> {
  const { attr1, operator, comparison } = condition as unknown as {
    attr1: string | Condition<M>;
    operator: Operator | GroupOperator;
    comparison: any;
  };

  function parse(): TypeORMQuery<M> {
    const attrRef = `${attr1}${counter}`;
    const typeORMOperator = translateToTypeORMOperator(operator, comparison);

    const whereClause = {
      [attrRef]: typeORMOperator,
    };

    switch (conditionalOp) {
      case GroupOperator.AND:
        return {
          query: qb.andWhere(`${tableName}.${attr1} = :${attrRef}`, {
            [attrRef]: comparison,
          }) as any,
        };
      case GroupOperator.OR:
        return {
          query: qb.orWhere(`${tableName}.${attr1} = :${attrRef}`, {
            [attrRef]: comparison,
          }) as any,
        };
      default:
        return {
          query: qb.where(`${tableName}.${attr1} = :${attrRef}`, {
            [attrRef]: comparison,
          }) as any,
        };
    }
  }

  // Simplify by using TypeORM'sFindOperator directly
  const where: any = {
    [`${tableName}.${attr1}`]: translateToTypeORMOperator(operator, comparison),
  };

  switch (conditionalOp) {
    case GroupOperator.AND:
      return { query: qb.andWhere(where) as any };
    case GroupOperator.OR:
      return { query: qb.orWhere(where) as any };
    default:
      return { query: qb.where(where) as any };
  }
}
```

### Step 3: Refactor build() Method

```typescript
// TypeORMStatement.ts (refactored build method)

protected build(): TypeORMQuery<M> {
  const log = this.log.for(this.build);
  const tableName = Model.tableName(this.fromSelector);
  const alias = this.alias || tableName.substring(0, 1).toLowerCase();

  // Create base query using repository
  const repository = this.adapter.client.getRepository(Metadata.constr(this.fromSelector));
  const baseQuery = repository.createQueryBuilder(alias);

  let query = baseQuery;

  // Handle SELECT clause
  if (typeof this.countSelector !== 'undefined') {
    const field = this.countSelector === null ? '*' : this.countSelector;
    query = query.select(`COUNT(${alias}.${field})`, 'count');
  } else if (typeof this.countDistinctSelector !== 'undefined') {
    const field = this.countDistinctSelector === null ? '*' : this.countSelector;
    query = query.select(`COUNT(DISTINCT ${alias}.${field})`, 'count');
  } else if (this.sumSelector) {
    query = query.select(`SUM(${alias}.${this.sumSelector})`, 'sum');
  } else if (this.avgSelector) {
    query = query.select(`AVG(${alias}.${this.avgSelector})`, 'avg');
  } else if (this.maxSelector) {
    query = query.select(`MAX(${alias}.${this.maxSelector})`, 'max');
  } else if (this.minSelector) {
    query = query.select(`MIN(${alias}.${this.minSelector})`, 'min');
  } else if (this.distinctSelector) {
    query = query.select(`${alias}.${this.distinctSelector}`, this.distinctSelector);
  } else if (this.selectSelector) {
    query = query.select(this.selectSelector.map((s) => `${alias}.${s}`));
  }

  // Handle WHERE clause (using TypeORM FindOperator)
  if (this.whereCondition) {
    const where = this.buildWhereClause(this.whereCondition, alias, tableName);
    query = query.where(where);
  }

  // Handle GROUP BY
  if (this.groupBySelectors && this.groupBySelectors.length) {
    for (const field of this.groupBySelectors) {
      query = query.groupBy(`${alias}.${field}`);
    }
  }

  // Handle ORDER BY
  if (this.orderBySelectors && this.orderBySelectors.length) {
    for (const [field, dir] of this.orderBySelectors) {
      query = query.addOrderBy(`${alias}.${field}`, dir.toUpperCase() as 'ASC' | 'DESC');
    }
  }

  // Handle LIMIT
  if (this.limitSelector) {
    query = query.limit(this.limitSelector);
  }

  // Handle OFFSET
  if (this.offsetSelector) {
    query = query.offset(this.offsetSelector);
  }

  return { query } as TypeORMQuery<M>;
}

private buildWhereClause(
  condition: Condition<M>,
  alias: string,
  tableName: string
): any {
  const { attr1, operator, comparison } = condition as any;

  // Build TypeORM condition object
  const attrName = `${alias}.${attr1}`;
  const typeORMOperator = translateToTypeORMOperator(operator, comparison);

  if (operator === GroupOperator.AND || operator === GroupOperator.OR) {
    // Recursively build AND/OR conditions
    const left = this.buildWhereClause(attr1 as Condition<M>, alias, tableName);
    const right = this.buildWhereClause(comparison as Condition<M>, alias, tableName);

    if (operator === GroupOperator.AND) {
      return {
        [QueryOrderer.joinConditions(left, right, 'AND')]: true,
      };
    } else {
      return {
        [QueryOrderer.joinConditions(left, right, 'OR')]: true,
      };
    }
  }

  return {
    [attrName]: typeORMOperator,
  };
}
```

### Step 4: Update raw() Method

```typescript
// TypeORMStatement.ts (refactored raw method)

override async raw<R>(
  rawInput: TypeORMQuery<M>,
  ...args: ContextualArgs<TypeORMContext>
): Promise<R> {
  const { ctx } = this.logCtx(args, this.raw);
  const allowRawStatements = ctx.get('allowRawStatements');
  if (!allowRawStatements) {
    throw new UnsupportedError(
      'Raw statements are not allowed in the current configuration'
    );
  }

  const query = rawInput.query as SelectQueryBuilder<M>;

  // Handle aggregation queries
  if (this.hasAggregation()) {
    if (!this.groupBySelectors || !this.groupBySelectors.length) {
      const result = await query.getRawOne();
      
      // Extract scalar value
      if (
        typeof this.countSelector !== 'undefined' ||
        typeof this.countDistinctSelector !== 'undefined'
      ) {
        return Number(result?.count || 0) as R;
      } else if (this.sumSelector) {
        return Number(result?.sum || 0) as R;
      } else if (this.avgSelector) {
        return Number(result?.avg || 0) as R;
      } else if (this.maxSelector) {
        return result?.max as R;
      } else if (this.minSelector) {
        return result?.min as R;
      } else if (this.distinctSelector) {
        const results = await query.getRawMany();
        return results.map((r: any) => r[this.distinctSelector as string]) as R;
      }
      return result as R;
    } else {
      const results = await query.getRawMany();
      return this.groupResults(results) as R;
    }
  }

  // Standard query - load relations
  const { nonEager } = splitEagerRelations(this.fromSelector);
  query.setFindOptions({
    loadEagerRelations: true,
    loadRelationIds: {
      relations: nonEager,
    },
  });

  return (await query.getMany()) as R;
}
```

### Step 5: Update Repository Methods

```typescript
// TypeORMRepository.ts (refactored methods)

override async listBy(
  key: keyof M,
  order: OrderDirection,
  ...args: MaybeContextualArg<ContextOf<A>>
): Promise<M[]> {
  const { log, ctxArgs } = (
    await this.logCtx(args, PreparedStatementKeys.LIST_BY, true)
  ).for(this.listBy);

  log.verbose(`listing ${Model.tableName(this.class)} by ${key as string} ${order}`);

  // Use statement API instead of custom SQL
  const query = this.statement(this.listBy.name, key, order, ...ctxArgs);
  return this.raw<M[]>(await query.build());
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

  // Use statement API
  const query = this.statement(this.findBy.name, key, value, ...ctxArgs);
  return this.raw<M[]>(await query.build());
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

  const query = this.statement(this.find.name, value, order, ...ctxArgs);
  return this.raw<M[]>(await query.build());
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

  const query = this.statement(this.page.name, value, direction, ref, ...ctxArgs);
  return this.raw<SerializedPage<M>>(await query.build());
}
```

## Benefits of Refactoring

1. **Consistency**: All queries (listBy, findBy, find, page, statement) use the same query building logic
2. **Maintainability**: Remove separate translator layer, rely on TypeORM's operators
3. **Type Safety**: Better TypeScript integration with TypeORM's FindOperator types
4. **Driver Portability**: TypeORM's API handles driver-specific syntax automatically
5. **Testability**: Easier to test query building in isolation

## Deliverables
- [ ] Remove `src/query/translate.ts` or convert to TypeORM operator mapping
- [ ] Refactor `parseCondition()` to use TypeORM operators
- [ ] Refactor `build()` to use repository.createQueryBuilder
- [ ] Update `raw()` to work with TypeORM query objects
- [ ] Update repository methods to use unified query building
- [ ] All existing tests pass
- [ ] New tests for query consistency

## Notes
- Keep backward compatibility with existing TypeORM query API
- Ensure all aggregation functions work with the new approach
- Test with different database drivers to ensure portability
