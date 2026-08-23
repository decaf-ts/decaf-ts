# 02 — Query Design

This section specifies the **design** of the decaf-ts query layer: the fluent `Statement`/`Condition`/`Paginator` DSL, method-name parsing, prepared-statement "squashing", adapter-specific query compilation, sequence generation, and pagination. It is grounded in the research briefs for `@decaf-ts/core` and the SQL/NoSQL adapter packages. The architecture (component map, layering) is detailed in the [Architecture Handbook](../architecture-handbook/03-persistence-core.md); this document covers the query design rationale, build/execute/paginate contracts, and acceptance criteria.

No domain specification/bug/incident records are referenced here — the design is described directly from the grounded briefs.

## 1. Scope

In scope: the query DSL in `@decaf-ts/core` (`query/` subsystem), how concrete adapters compile it (`CouchDBStatement`/Mango, `TypeORMStatement`/`SelectQueryBuilder`, `RamStatement`/predicate), and sequence generation. Out of scope: the persistence CRUD lifecycle and transaction model (see [01 — Persistence Design](./01-persistence-design.md)).

## 2. Design Principles

- **P-Q1 — One fluent builder, many compilers.** `Statement<M,A,R,Q>` is an abstract fluent builder (`select/distinct/max/min/sum/avg/count/from/where/orderBy/thenBy/groupBy/limit/offset/execute/raw/prepare/paginate`); `build()` is abstract and each adapter compiles to its native query shape. *Why:* application query code is portable; only the compiler is backend-specific. *Enforced by:* `Statement.build()` abstract + `RamStatement.build()`, `CouchDBStatement.build()`, `TypeORMStatement.build()`.
- **P-Q2 — Composable condition trees.** `Condition<M>` + `Condition.builder()` / `Condition.attribute()` form a composable tree (`eq/dif/gt/lt/gte/lte/in/between/regexp/startsWith/endsWith/and/or/not`). *Why:* arbitrary boolean predicates map cleanly to each backend's selector language. *Enforced by:* `Condition` operators and the per-adapter `translateOperators`/`parseCondition`.
- **P-Q3 — Method names are queries.** `MethodQueryBuilder` parses method names (`findByXAndAgeGreaterThanOrderByAgeAsc`) into structured `QueryAssist` so `@query`-decorated repository methods work without a hand-written body. `OperatorsMap` maps operator-suffixes to `Condition`s. *Why:* common queries are declarable by naming convention. *Enforced by:* `@query(opts?)` + `MethodQueryBuilder` (prefixes: `findBy`/`pageBy`/`countBy`/`sumBy`/`avgBy`/`minBy`/`maxBy`/`distinctBy`/`groupBy`).
- **P-Q4 — Prepared-statement squashing.** When `forcePrepareSimpleQueries`/`forcePrepareComplexQueries` flags are set, `Statement.executionPrefix` calls `squash()`/`prepare()` to reduce the query to a `PreparedStatement` (`{class, method, args, params}`) dispatched through `Repository.statement`. *Why:* repeatable query shapes become cheap, cacheable dispatches. *Enforced by:* `Statement.executionPrefix` + `Repository.statement`/`executePrepared`.
- **P-Q5 — Pagination is adapter-owned.** `Paginator<M,R,Q>` is abstract (`serialize/apply/deserialize`, `next/previous/page`); adapters choose offset vs bookmark paging. *Why:* CouchDB needs bookmark paging; SQL/RAM can use offset. *Enforced by:* `CouchDBPaginator` (bookmark, forward-only) vs `TypeORMPaginator` (`findAndCount` with `skip`/`take`) vs `RamPaginator`.
- **P-Q6 — Defaults prevent accidental full scans.** Adapter statements apply a default `limit` when none is set (CouchDB `CouchDBQueryLimit` = 250; TypeORM `TypeORMQueryLimit` = 250). *Why:* large reads do not accidentally load whole tables. Callers set an explicit `.limit()` or use the paginator for large reads.
- **P-Q7 — Errors are Decaf types.** Query build/execution errors wrap in `QueryError`; paging errors in `PagingError`.

## 3. Query API Surface

### 3.1 `Statement<M,A,R,Q>`

Fluent builder. Key methods: `select`/`distinct`/`max`/`min`/`sum`/`avg`/`count`/`from`/`where`/`orderBy`/`thenBy`/`groupBy`/`limit`/`offset`/`execute`/`raw`/`prepare`/`paginate`. Selectors are frozen by the fluent methods. `build()` is abstract. Adapter `Statement` factory: `adapter.Statement<M>(opts?)`.

### 3.2 `Condition<M>`

`Condition.builder()` / `Condition.attribute(name)`. Operators: `eq`, `dif`, `gt`, `lt`, `gte`, `lte`, `in`, `between`, `regexp`, `startsWith`, `endsWith`, `and`, `or`, `not`. `Operator`/`GroupOperator` enums; `PreparedStatementKeys`; `QueryClause`/`QueryAction`/`QueryOptions`; selector/option interfaces (`WhereOption`, `SelectOption`, `CountOption`, `GroupByOption`, …).

### 3.3 `Paginator<M,R,Q>`

Abstract cursor/offset pagination with `serialize`/`apply`/`deserialize`, `next`/`previous`/`page`. `PreparedStatementKeys` integration for prepared paging.

> **Known limitations:** `Paginator.previous()` is never exercised by tests; `Paginator.validatePage` is defined but never called by `page()`/`pagePrepared` — bounds are not enforced by the base paginator; `next()` before the first `page()` yields `NaN` (`_currentPage` undefined). `Paginator.isPreparedStatement()` returns a regex match array, not a boolean (despite the name).

### 3.4 Decorators

`@query(opts?)`, `@prepared()`, `@defaultQueryAttr()`, `@view(opts?)`. Note: `@prepared()` is exported from `src/query/decorators.ts:26` (not `repository/decorators`, despite some README claims).

### 3.5 Adapter-specific extensions

| Adapter | Statement | Paginator | Native shape | Operator translation |
|:--|:--|:--|:--|:--|
| `RamAdapter` | `RamStatement` | `RamPaginator` | in-memory predicate fn + sort fn | `Condition`→predicate |
| `CouchDBAdapter` | `CouchDBStatement` | `CouchDBPaginator` (bookmark) | `MangoQuery` (`MangoSelector`) | `$eq/$ne/$gt/$gte/$lt/$lte/$not/$in/$regex`; `$and/$or`; `STARTS_WITH`→lexicographic `$gte/$lt` range; `ENDS_WITH`→end-anchored `$regex`; `BETWEEN`→`$gte/$lte` |
| `NanoAdapter` / `PouchAdapter` | inherited `CouchDBStatement` | inherited `CouchDBPaginator` | `MangoQuery` via `client.find` | inherited |
| `TypeORMAdapter` | `TypeORMStatement<M,R>` | `TypeORMPaginator<M>` (`findAndCount` + `skip`/`take`) | `SelectQueryBuilder` | `EQUAL/DIFFERENT` vs `null`→`IS [NOT] NULL`; `BETWEEN`; variadic `IN` (`:...param`); `STARTS_WITH`/`ENDS_WITH`→`LIKE %`; **`NOT` is not implemented** |

`HttpStatement` and other transport-flavour statements exist in the HTTP layer and are out of scope here.

## 4. Building & Parameterizing Queries

A query is built by chaining fluent selectors (which freeze state) and then executed:

1. **Build selectors.** `repo.select(["age"]).where(Condition.attribute("age").gt(18)).orderBy(["age","asc"]).limit(10)` freezes the `Statement`'s selectors.
2. **`execute()`** runs `executionPrefix`, which optionally calls `squash()`/`prepare()` (per `forcePrepareSimpleQueries`/`forcePrepareComplexQueries` flags) to obtain `ctxArgs`.
3. **Dispatch.** Either `executePrepared` (dispatches through `Repository.statement`) or `build()` (abstract → adapter compiles to native query) then `adapter.raw(query, true, ctxArgs)`.
4. **Post-process.** `processRecord` (`adapter.revert`) per record; `applyAfterHandlersToResult` enforces `OperationKeys.READ`/`AFTER` DB decorators when `afterQueryHandlers` is set. Errors wrap in `QueryError`.

### 4.1 CouchDB compilation

`CouchDBStatement.build()` injects `??table`, parses the `Condition`, adds sort, applies the default limit (250), and attaches default + generated `use_index`. `raw()` force-scopes via `scopeToTable` (prevents cross-table leaks), calls `adapter.raw` (`db.find`), then either manual aggregation/grouping or `processRecord` (splits `_id` back to pk via `Sequence.parseValue`, `adapter.revert`).

The index planner introspects `Model.indexes`/`Model.defaultQueryAttributes`, scores candidate indexes (equality×30, range×25, sort×20) and attaches `use_index`; `forceNamedIndexes` (default `true`) gates it; strict mode throws `IndexPlanningError` with a ready-to-paste `@index(...)` suggestion. Range helpers: `nextLexocographicString`/`prefixRange` for `STARTS_WITH`.

### 4.2 TypeORM compilation

`TypeORMStatement.build()` constructs a `SelectQueryBuilder`, applies aggregation/select, `parseCondition` (`qb.where/andWhere/orWhere`), `groupBy`/`orderBy`/`limit`/`skip`; `raw()` checks `ctx.get("allowRawStatements")`, then `getRawOne`/`getRawMany` for aggregations or `getMany()` otherwise. Default ordering = pk ASC when no `orderBy` and not an aggregation.

### 4.3 Method-name parsing

`@query()` on a repository method parses the method name into `QueryAssist` via `MethodQueryBuilder`. Prefixes: `findBy`/`pageBy`/`countBy`/`sumBy`/`avgBy`/`minBy`/`maxBy`/`distinctBy`/`groupBy`. `@prepared()` marks a method callable via `repo.statement("name", ...)`. `@defaultQueryAttr()` / `@view(opts?)` tune attribute defaults and view-backed reads.

> **Test gap:** multi-`ThenBy` parsing is `it.skip`; `Between`/`In`/`OrderBy`/`GroupBy` method-builder paths are skipped in some adapter suites.

## 5. Execution & Pagination

### 5.1 CouchDB bookmark pagination

`Statement.paginate(size)` → `CouchDBPaginator`. `page(n)` validates the page, looks up the cached bookmark (required for non-first pages), strips `skip`, sets `limit=size` + `bookmark`, calls `adapter.raw(..., false)` (full `MangoResponse`), reverts docs, caches the next bookmark. Pagination is **forward-only** (random page access without a cached bookmark throws `PagingError`); `skip` is stripped.

### 5.2 TypeORM offset pagination

`TypeORMPaginator<M>` uses `repo.findAndCount` with `skip`/`take`; maps via `adapter.revert`.

### 5.3 Build → execute → paginate flow

```mermaid
sequenceDiagram
    participant App
    participant Stmt as Statement (adapter-specific)
    participant Build as build()
    participant Adap as Adapter.raw
    participant Drv as Native driver
    participant Pag as Paginator
    App->>Stmt: select().where(Condition).orderBy().limit(n)
    Note over Stmt: fluent methods freeze selectors
    App->>Stmt: execute()
    alt force-prepare flags set
        Stmt->>Stmt: squash()/prepare() → PreparedStatement ctxArgs
        Stmt->>Adap: executePrepared → Repository.statement
    else build path
        Stmt->>Build: build() (abstract)
        Build->>Build: parseCondition + orderBy + groupBy + default limit + use_index
        Build-->>Stmt: native query (QUERY)
        Stmt->>Adap: raw(query, docsOnly, ctxArgs)
    end
    Adap->>Drv: native find/query
    Drv-->>Adap: rows/docs
    Adap->>Adap: processRecord → adapter.revert per record
    Adap->>Adap: applyAfterHandlersToResult (if afterQueryHandlers)
    Adap-->>App: results (or QueryError on failure)
    App->>Stmt: paginate(size)
    Stmt->>Pag: Paginator (adapter-specific)
    alt CouchDB bookmark
        Pag->>Adap: raw(query, false) with bookmark + limit=size, skip stripped
        Adap->>Drv: db.find
        Drv-->>Pag: MangoResponse
        Pag->>Pag: cache next bookmark; revert docs
    else TypeORM offset
        Pag->>Adap: findAndCount({ skip, take })
        Adap-->>Pag: [rows, count]
    end
    Pag-->>App: page
```

## 6. Sequence Generation Design

`Sequence<A>` is the identity generator (Number/BigInt/String/uuid/serial) backed by `SequenceModel` (`@table("??sequence")`). `@pk(opts?)` defaults to `Number`, `generated: true`; `@sequence(opts?, update?)` decorates any property with per-property metadata keyed by model identity + property name. `ensureSequenceOptions` normalizes options; `DefaultSequenceOptions = NoneSequenceOptions` (`type: undefined`, `generated: false`, `startWith: 0`, `incrementBy: 1`, `cycle: false`); `Serial` zero-pads to 14 digits; `UUID` uses `Math.random()` (non-cryptographic).

Adapter overrides:

- **`TypeORMSequence`** uses **Postgres-specific** catalog SQL: `current`/`increment`/`next`/`range`/`ensureAtLeast` via `last_value`/`is_called`, `setval`, `CREATE SEQUENCE IF NOT EXISTS`, `to_regclass`. `pkDec` records `SEQUENCE` metadata so `Model.generatedBySequence`/`sequenceFor` work for bulk id allocation in `createAllPrefix`. **Won't work on non-Postgres** despite multi-driver detection.
- **`RamAdapter`/`FilesystemAdapter`** use the in-memory `Sequence` backed by `SequenceModel` records.
- **CouchDB-family** rely on `@pk`/`@uuid` generation and `generateId` (`${tableName}__${pk}`); the README-claimed `CouchDBSequence` subsystem does not exist in `for-couchdb` `src/`.

> **Known limitations:** `Sequence.range()` throws `UnsupportedError` for `uuid`/`serial` with a TODO ("just generate valid uuids/serials"). `Sequence.parseValue` has unreachable `toLowerCase()` branches (dead code).

## 7. Acceptance Criteria

| ID | Given | When | Then |
|:--|:--|:--|:--|
| AC-Q-Build | A `Statement` with `where`/`orderBy`/`limit` | `execute()` | Compiles via `build()` to the adapter's native query; default limit applied if unset; results reverted to models. |
| AC-Q-Condition | A `Condition` tree with `and`/`or`/`gt`/`in`/`between`/`startsWith` | `execute()` | Each operator translates to the backend selector (`$gt`/`$in`/`$gte..$lte`/lexicographic range / `LIKE %` / `IS [NOT] NULL`). |
| AC-Q-StartsWith | CouchDB `startsWith("98765432109879")` | `parseCondition` | `selector.$gte === "98765432109879"` and `$lt === "98765432109880"` (next lexicographic string). |
| AC-Q-Null | TypeORM `eq(null)` / `dif(null)` | `parseCondition` | Emits `IS NULL` / `IS NOT NULL`. |
| AC-Q-Not | A `Condition.not(...)` against TypeORM | `parseCondition` | Throws / unsupported — `NOT` is not implemented for TypeORM. |
| AC-Q-UseIndex | A CouchDB query with a matching `@index` and `forceNamedIndexes: true` | `build()` | Attaches `use_index` from generated index candidates. |
| AC-Q-IndexPlan-Strict | A CouchDB query with no usable index and strict mode | `build()` | Throws `IndexPlanningError` carrying a `@index(...)` suggestion + offending query. |
| AC-Q-DefaultLimit | A CouchDB/TypeORM query with no `.limit()` | `execute()` | Applies default limit 250. |
| AC-Q-Paginate-CouchDB | A `CouchDBPaginator` past page 1 without a cached bookmark | `page(n)` | Throws `PagingError`; `skip` is stripped. |
| AC-Q-Paginate-TypeORM | A `TypeORMPaginator` | `page(n)` | Uses `findAndCount({ skip, take })`; returns page + count. |
| AC-Q-MethodBuilder | A repository method `findByNameAndAgeGreaterThan` decorated `@query()` | called | `MethodQueryBuilder` parses the name into `QueryAssist`; query executes. |
| AC-Q-Prepared | `forcePrepareSimpleQueries` set | `execute()` | `squash()`/`prepare()` reduces to a `PreparedStatement` dispatched via `Repository.statement`. |
| AC-Q-Error | A malformed query or driver error | `execute()` | Wraps in `QueryError` (paging in `PagingError`). |
| AC-Q-Seq-Postgres | A `@pk({ type: "Number" })` model on TypeORM/Postgres | `createAll` | `TypeORMSequence.range` allocates ids via Postgres catalog SQL. |
| AC-Q-Seq-Range-Limit | `Sequence.range()` for `uuid`/`serial` | called | Throws `UnsupportedError` (documented limitation). |

## 8. Environment Variables

**The query layer reads no environment variables.** `core`'s `query/` subsystem and the adapter query compilers (`CouchDBStatement`, `TypeORMStatement`, etc.) take all configuration through the `Statement` factory options (e.g. `adapter.Statement({ forceNamedIndexes: false })`) and adapter flags (`CouchDBFlags.forceNamedIndexes`, `TypeORMFlags`). Default limits and index-planning behaviour are constants, not env-driven.

The only env-adjacent behaviour is `MethodQueryBuilder` decorator integration tests in `for-nano` being gated on `process.env.RUN_METHOD_QUERY_BUILDER=true` — a test-harness flag, not a runtime query config.

## 9. Usage Examples

### 9.1 Fluent query (RAM)

```typescript
const results = await repo
  .select(["age"])
  .where(Condition.attribute("age").gt(18))
  .orderBy(["age", "asc"])
  .limit(10)
  .execute();
```

### 9.2 Method-name / prepared-statement query

```typescript
import { query, prepared, Condition, OrderDirection } from "@decaf-ts/core";

class UserRepo extends Repository.forModel(User) {
  @query()                                                     // parses method name → Statement
  async findByNameAndAgeGreaterThan(name: string, age: number, order?: OrderDirection) { /* overridden */ }

  @prepared()                                                  // callable via repo.statement("paginateByAgeBiggerAndName", ...)
  async paginateByAgeBiggerAndName(age: number, name: string, params: { limit: number; offset: number }) {
    return this.select().where(Condition.attribute("age").bigger(age)).paginate(params.limit);
  }
}

const users = await repo.findBy("name", "alice");
const page = await repo.paginateBy("age", OrderDirection.DSC, { limit: 20, offset: 2 }); // NOTE: DSC, not DESC
```

### 9.3 CouchDB `STARTS_WITH` range (from unit test)

```typescript
const statement = new CouchDBStatement({} as any);
(statement as any).fromSelector = GtinStatementModel;
const query = (statement as any).parseCondition(
  Condition.attribute<GtinStatementModel>("productCode").startsWith("98765432109879")
);
// query.selector.productCode.$gte === "98765432109879"; .$lt === "98765432109880"
```

### 9.4 Attaching a generated `use_index` from `@index` metadata (from unit test)

```typescript
jest.spyOn(Model, "tableName").mockReturnValue("assets");
jest.spyOn(Model, "indexes").mockReturnValue({
  owner: { index: { directions: [OrderDirection.ASC], compositions: ["createdAt"] } },
} as any);
const query: MangoQuery = {
  selector: { "??table": "assets", owner: "alice", createdAt: { $gt: "2026-01-01" } },
  sort: [{ createdAt: "asc" }],
};
attachGeneratedUseIndex(Asset, query, undefined, { forceNamedIndexes: true });
// query.use_index === ["assets_owner_createdAt_asc_index", "assets_owner_createdAt_asc_index"]
```

## 10. Inaccuracies

Recorded exactly as found in the briefs (not fixed). Query-relevant subset of the `core` inaccuracies; the full cross-module list is returned separately.

**[core]** `Statement.prepareCondition` `BIGGER_EQ` branch drops the comparison value — unlike every other branch, the `BIGGER_EQ` `>=` path does not push `comparison` into `args`, so squashed `where(attr.gte(x))` loses the bound value. (`SMALLER_EQ` mirrors it correctly.) | Evidence: `src/query/Statement.ts:571-573` (no `args.push`) vs `:578-581` (`SMALLER_EQ` pushes). | Suggested fix: add `args.push(condition.comparison)` to the `BIGGER_EQ` branch.

**[core]** `Statement.prepare` sets `params.skip` while `DirectionLimitOffset`/Paginator use `offset` — `prepare()` writes `params.skip = offsetSelector` (`Statement.ts:955`) but `Paginator.pagePrepared` reads `params.offset`/`params.direction`. Prepared statements built via `prepare()` may have `offset` undefined. | Evidence: `src/query/Statement.ts:955` vs `src/query/types.ts:31-37` and `src/query/Paginator.ts:160, 207`. | Suggested fix: use `offset` consistently (or read both).

**[core]** `Paginator.isPreparedStatement()` returns a regex match array, not a boolean — despite the `boolean`-sounding name, it returns the `regex.match` result (truthy/falsy but typed as the match). | Evidence: `src/query/Paginator.ts:114-125`. | Suggested fix: coerce with `!!` or rename/retype.

**[core]** `interfaces/index.ts` omits `Paginatable` — the interface file exists but is not re-exported from the interfaces barrel, so it is unreachable through `@decaf-ts/core`. | Evidence: `src/interfaces/index.ts:6-12`. | Suggested fix: add the re-export or remove the unused file.

**[core]** `Paginator.previous()` is never exercised by tests; `Paginator.validatePage` is defined but never called by `page()`/`pagePrepared` — bounds are not enforced by the base paginator; `next()` before the first `page()` yields `NaN` (`_currentPage` undefined). | Evidence: `tests/unit/Pagination.test.ts` (no `previous()`); `src/query/Paginator.ts`. | Suggested fix: exercise `previous()`/`validatePage` or document the limitation.

**[core]** `Condition.not()` is untested. | Evidence: `tests/unit/Condition.test.ts` (`not()` untested). | Suggested fix: add coverage or document support level.

**[core]** `MethodQueryBuilder` multi-`ThenBy` parsing is `it.skip`. | Evidence: `tests/unit/MethodQueryBuilder.test.ts`. | Suggested fix: implement/verify or document the limitation.

**[core]** `Statement.parseValue` (via `Sequence.parseValue`) has unreachable `toLowerCase()` branches — `Number.name || Number.name.toLowerCase()` always returns `"Number"`, so the `toLowerCase()` fallbacks are dead. | Evidence: `src/persistence/Sequence.ts:475, 481, 483`. | Suggested fix: remove the dead `||` branches or invert the logic.

**[core]** `Sequence.range()` throws `UnsupportedError` for `uuid`/`serial` with a TODO ("just generate valid uuids/serials"). | Evidence: `src/persistence/Sequence.ts:259-262`. | Suggested fix: implement or clearly document the limitation.

**[for-couchdb]** `MangoQuery.limit` JSDoc says `@default 25`, but the applied default is 250. | Evidence: `src/types.ts:161` vs `src/query/constants.ts:9` + `src/query/Statement.ts:264-271`. | Suggested fix: change the JSDoc default to `250` (or reference `CouchDBQueryLimit`).

**[for-couchdb]** JSDoc typo `ConuchDB` in the paginator. | Evidence: `src/query/Paginator.ts:14`. | Suggested fix: spell "CouchDB".

**[for-couchdb]** README/Description — claims a "Sequence Management" subsystem (`CouchDBSequence … Sequence Model`) that does not exist in `src/`. | Evidence: `README.md:56-59`, `workdocs/4-Description.md:18-20`; no `*sequence*` file in `src/`. | Suggested fix: remove the section or implement/export a `CouchDBSequence`.

**[for-typeorm]** `TypeORMStatement` `NOT` condition operator is not implemented. | Evidence: `src/query/Statement.ts` `parseCondition` (no `NOT` branch). | Suggested fix: implement `NOT` or document it as unsupported.

**[for-typeorm]** index generator docstrings incorrectly say "CouchDB"/`for-couchdb`. | Evidence: `src/indexes/generator.ts:9-10,12,33-39,70`. | Suggested fix: replace with "TypeORM"/`for-typeorm`.

**[for-typeorm]** index generator — `CREATE INDEX $1 ON $2 ($3)` uses Postgres parameter placeholders for identifiers, which Postgres does not support. | Evidence: `src/indexes/generator.ts:104-106` executed via `client.query(index.query, index.values)` (`TypeORMAdapter.ts:325`); the default-query branch correctly uses interpolation (`:125`). | Suggested fix: interpolate quoted identifiers directly.

**[for-typeorm]** index generator — first "table index" is an empty no-op query (`{ query: "", values: [] }`); `TypeORMAdapter.index()` will execute `client.query("")`. | Evidence: `src/indexes/generator.ts:82-87` vs `TypeORMAdapter.ts:322-328`. | Suggested fix: populate it or skip empty queries in the adapter loop.
