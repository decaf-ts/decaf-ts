# Core Module Research Brief — `@decaf-ts/core`

> Consolidated, code-grounded research brief covering the `core` module of the
> `decaf-ts` monorepo (`/workspaces/decaf-ts/core`). Existing doc versions were
> ignored and every statement below is grounded in the actual `src/`, `tests/`,
> `README.md`, `workdocs/`, and generated `docs/`. No tests or builds were run;
> nothing was modified. This is raw technical material for an Architecture
> handbook / design specification.

This brief treats the whole `core` package as one module (it is published as a
single package `@decaf-ts/core`) and follows the requested per-module structure.
Within it, subsystems are documented in the layering order in which they appear
in the barrel: `overrides` → `repository` → `auth`/`identity`/`interfaces`/
`model` → `query` → `services` → `tasks` → `utils` → `migrations` →
`persistence` (last on purpose) → plus the subpath-only runtimes `ram` and `fs`
and the worker-thread engine.

---

### core (`@decaf-ts/core` v0.29.0)

#### 1. Identity

- **Directory:** `/workspaces/decaf-ts/core`
- **Package name:** `@decaf-ts/core`
- **Version:** `0.29.0` (`package.json:4`)
- **Description:** `"Core persistence module for the decaf framework"` (`package.json:5`)
- **License:** MPL-2.0; engines `node >=20.0.0`, `npm >=10.0.0`
- **Repository:** `git+https://github.com/decaf-ts/core.git`
- **Author:** Tiago Venceslau and Contributors

#### 2. Purpose & role

`core` is the foundational persistence layer of the Decaf TypeScript framework.
It defines the abstract `Adapter`/`Context`/`Dispatch`/`Sequence`/`Statement`/
`Paginator` spine, the `Repository` pattern, strongly-typed `Model`/
`BaseModel`/`SequenceModel` machinery, a composable query DSL (`Condition`/
`Statement`/`Paginator`/`MethodQueryBuilder`), a transactional coordination
system, an observer/event layer, a task engine with worker-thread support, a
migration framework, and a service layer (`ModelService`/`PersistenceService`).
It sits at the bottom of the framework layering: every concrete DB adapter
package (`for-typeorm`, `for-couchdb`, `for-pouch`, `for-nano`, …), the HTTP
and Nest packages, and the Angular/UI packages build on top of it. It also
ships two built-in runtimes — an in-memory `RamAdapter` and a persistent
`FilesystemAdapter` — used for testing and lightweight local persistence.

#### 3. Dependencies

**Decaf runtime dependencies** (`package.json` `"dependencies"`):
- `@decaf-ts/db-decorators` (`latest`) — `Ctx`, `OperationKeys`, `BulkCrudOperationKeys`, `DBKeys`, `BaseError`, `InternalError`, `NotFoundError`, `ConflictError`, `ValidationError`, `SerializationError`, decorators (`required`, `prop`, `model`, `list`, `option`, `generated`, `timestamp`, `onCreate`, `onUpdate`, `onDelete`, `afterAny`, `readonly`, `transient`, `composed`, `date`, `inject`, `injectable`, `metadata`, `propMetadata`, `methodMetadata`), `Model`, `ModelBuilder`, `Repository` (the db-decorators base `Rep`), `Decoration`, `Metadata`, `Reflect.metadata` keys.
- `@decaf-ts/decoration` (`latest`) — `Decoration`, `Metadata`, `apply`, flavour machinery.
- `@decaf-ts/decorator-validation` (`latest`) — `Model` validation, `ValidationKeys`, `ModelArg`, serializers (`JSONSerializer`), `ModelBuilder`.
- `@decaf-ts/injectable-decorators` (`latest`) — `Injectables`, `InjectableRegistryImp`, `inject`, `injectable`.
- `@decaf-ts/transactional-decorators` (`latest`) — `Lock`, `MultiLock`, `TransactionalKeys`.

**Dev dependencies:** `@decaf-ts/logging`, `@decaf-ts/utils`, `@types/jest`,
`@types/semver`, `typescript`. `logging` and `utils` are only `devDependencies`
because within the monorepo they resolve via workspace links; downstream
consumers get them transitively. **Optional dependency:** `semver ^7.7.2`
(used by `SemverMigrationVersioning`; falls back to lexical ordering otherwise).

**External (non-decaf) deps:** none at runtime beyond `semver` (optional) and
Node built-ins (`fs`, `path`, `os`, `worker_threads`, `crypto`-ish via
`Math.random`).

**Key external concepts depended on:** TypeScript module augmentation
(`declare module`), Node `worker_threads`, `fs.watch`.

**Modules that depend on `core`:** effectively every other decaf package — all
adapter packages (`for-typeorm`, `for-couchdb`, `for-pouch`, `for-nano`,
`for-fabric`), `for-http`, `for-nest`, `for-angular`, `for-react`,
`for-react-native`, `for-nextjs`, `integrations`, `db-decorators` (circular-ish
linking), `ui-decorators`, `graph-execution`, `mcp-server`, and the apps
(`demo`). `core` is the leaf most dependents point at.

#### 4. Architecture & structure

`src/` is organised into self-contained subsystems, each with its own barrel:

```
src/
  index.ts            # main barrel; exports overrides first, persistence last; ram commented out
  overrides/          # runtime monkey-patches of Metadata/Model/Injectables/ModelBuilder (imported first)
  persistence/        # Adapter, Context, ContextLock, Dispatch, Sequence, ObserverHandler, transactions, generators, event-filters
  interfaces/         # Observable/Observer/Queriable/Paginatable/RawExecutor/ErrorParser/SequenceOptions contracts
  repository/         # Repository, @repository decorator, InjectablesRegistry, OrderDirection, Cascade
  model/              # BaseModel, SequenceModel, @table/@column/@index/@unique/@version + relation decorators + construction lifecycle
  identity/           # @pk, @sequence decorators + sequence-option normalization
  auth/               # @allowIf / @blockIf method auth decorators, AuthKeys
  query/              # Condition, Statement, Paginator, MethodQueryBuilder, options/selectors, @query/@prepared/@defaultQueryAttr/@view
  services/           # Service, ClientBasedService, ModelService, PersistenceService, @service
  tasks/              # TaskEngine, TaskHandler, TaskHandlerRegistry, TaskService, TaskTracker, TaskEventBus, builder DSL, models, CleanUpTask
  workers/            # worker-thread TaskEngine, WorkThreadEnvironment, workerThread entry, messages protocol
  migrations/         # Migration, MigrationService, MigrationTaskBuilder, MigrationTasks, versioning (Standard/Semver), @migration
  ram/                # RamAdapter, RamStatement, RamPaginator (subpath "./ram"; commented out of main barrel)
  fs/                 # FilesystemAdapter (extends RamAdapter), FsDispatch, FsIndexStore, FilesystemLock/MultiLock (subpath "./fs")
  utils/              # ContextualLoggedClass (logCtx engine), AbsContextual, @create/@read/@update/@del/@service/@route guards, throttling, errors, helpers
  types/semver.d.ts   # ambient module declaration for optional `semver`
```

Key subsystem responsibilities:
- **`overrides`** is imported first (`src/index.ts:8`) and patches `Metadata`,
  `Model`, `Injectables`, `ModelBuilder` from external packages with
  persistence-aware methods (`tableName`, `sequenceFor`, `merge`, `indexes`,
  `relations`, `versionOf`, `services()`, `repositories()`, …). It also
  replaces the global `Injectables` registry with `InjectablesRegistry`
  (`src/index.ts:14`).
- **`persistence`** is exported last on purpose (`src/index.ts:34`) because
  `Adapter` is the central façade; `Repository`, `Dispatch`, `Sequence`
  self-register their base classes back into `Adapter` at import time
  (`Adapter["_baseRepository"]`, `_baseDispatch`, `_baseSequence`).
- **`query`** provides the fluent DSL plus the method-name parser that powers
  `@query`-decorated repository methods and prepared-statement "squashing".
- **`tasks` + `workers`** provide a polling task engine with leases, retries,
  backoff, composite steps, dependencies, locks, and a worker-thread pool
  variant for CPU isolation.
- **`migrations`** builds on `tasks` (migrations run as `CompositeTask`s in
  task mode) and provides two versioning strategies.
- **`ram`/`fs`** are concrete runtimes shipped as subpaths; `fs` extends `ram`.

#### 5. Public API surface

`package.json` exposes seven entrypoints: `.` (main), `./migrations`,
`./migrations/SemverMigrationVersioning`, `./ram`, `./fs`, `./tasks`,
`./workers`. The main barrel re-exports everything except `ram` (commented out,
`src/index.ts:30`) and `fs` (never added).

Major exported symbol groups (summarised; not exhaustive):

**persistence**
- `Adapter<CONF,CONN,QUERY,CONTEXT>` — abstract base for all adapters; CRUD, raw, observer, impersonation, flavour registry, factories.
- `Context<F>` — flag-bag context with parent/child chaining, pending tracking, `override()` Proxy.
- `ContextLock` + `SimpleConcurrencyLock` — per-transaction lock + per-adapter FIFO semaphore.
- `Dispatch<A>` — wraps mutating CRUD in Proxy traps to fire observer events.
- `Sequence<A>` — sequence generator (Number/BigInt/String/uuid/serial) backed by `SequenceModel`.
- `ObserverHandler` — observer registry + fan-out; `event-filters` (`onlyOnCreate/Update/Delete/Transactional/Single/Bulk`, `getFilters`).
- `@transactional` + `resolveTransactionLock` — transaction decorator; **must be imported from `@decaf-ts/core`** (`transactions.ts:96-107`).
- `@uuid` decorator + `UUID`/`Serial` generators.
- `UnsupportedError`, `MigrationError`, `MigrationRuleError`.
- `PersistenceKeys` enum, `DefaultAdapterFlags`, `DefaultContextFlags`, `TransactionOperationKeys`, etc.

**repository**
- `Repository<M,A>` — CRUD, bulk CRUD, fluent query, prepared statements, observers; `forModel`, `register`, `get`, `statements`, `queries`.
- `@repository(model, flavour?)` — dual-purpose property-inject / class-register decorator.
- `InjectablesRegistry` — DI registry that auto-resolves repositories by model.
- `OrderDirection` (`ASC="asc"`, `DSC="desc"`), `Cascade`, `DefaultCascade`.
- `ObserverError`; `generateInjectableNameForRepository`.

**model / identity**
- `BaseModel` (adds `createdAt`/`updatedAt`), `SequenceModel` (`@table("??sequence")`).
- Decorators: `@table`, `@column`, `@unique`, `@createdAt`, `@updatedAt`, `@createdBy`, `@updatedBy`, `@version(persistent?)`/`@persistentVersion`, `@index` (composite-capable), `@oneToOne`, `@oneToMany`, `@manyToOne`, `@manyToMany`, `@relation`, `@noValidateOn*`.
- `@pk(opts?)`, `@sequence(opts?, update?)`, `ensureSequenceOptions`.

**auth**
- `@allowIf(handler, ...args)`, `@blockIf(handler, ...args)` — method auth guards (semantic difference encoded by the user handler).
- `AuthKeys` enum (`AUTH`, `ROLES`, `NAMESPACE`) — defined but unused by the decorators.

**query**
- `Statement<M,A,R,Q>` — fluent builder with `select/distinct/max/min/sum/avg/count/from/where/orderBy/thenBy/groupBy/limit/offset/execute/raw/prepare/paginate`.
- `Condition<M>` + `Condition.builder()` / `Condition.attribute()` — composable condition tree (`eq/dif/gt/lt/gte/lte/in/between/regexp/startsWith/endsWith/and/or/not`).
- `Paginator<M,R,Q>` — abstract cursor/offset pagination with `serialize/apply/deserialize`, `next/previous/page`.
- `MethodQueryBuilder` — parses method names (`findByXAndAgeGreaterThanOrderByAgeAsc`) into `QueryAssist`.
- `OperatorsMap` — operator-suffix → Condition mapping for method-name parsing.
- `@query(opts?)`, `@prepared()`, `@defaultQueryAttr()`, `@view(opts?)`.
- `Operator`, `GroupOperator`, `PreparedStatementKeys`, `QueryClause`, `QueryAction`, `QueryOptions`.
- `QueryError`, `PagingError`; selector/option interfaces (`WhereOption`, `SelectOption`, `CountOption`, `GroupByOption`, …).

**services**
- `Service<C>` — abstract lifecycle/observer service; static `boot`/`shutdown` orchestrators; `Service.get(name)`.
- `ClientBasedService<CLIENT,CONF,C>` — `initialize()` → `{config, client}`; `boot()`/`config`/`client` getters.
- `ModelService<M,R>` — repository wrapper exposing full CRUD/query/observer API; `forModel`, `getService`.
- `PersistenceService<A>` — bootstraps a set of adapters from `[Constructor, Config, ...args][]` tuples.
- `@service(key?)` — class/property DI decorator.

**tasks**
- `TaskEngine<A,C>` — polling engine; `push/schedule/track/cancel/start/stop`; composite steps, retries/backoff, dependencies, locks, auto-shutdown.
- `TaskHandler<I,O>` — abstract handler base; `@task(key)` decorator; `TaskHandlerRegistry`.
- `TaskService<A>` — `ClientBasedService` wrapping an engine; auto-starts on push.
- `TaskTracker<O>` — await terminal status, attach log/status pipes, `onSucceed/onFailure/onCancel/onUpdate`.
- `TaskEventBus` (extends `ObserverHandler`), `TaskEventService` (ModelService over `TaskEventModel`).
- `TaskContext` (extends `Context`); `TaskStateChangeError`; task error taxonomy (`TaskControlError`, `TaskFailError`, `TaskRetryError`, `TaskCancelError`, `TaskRescheduleError`, `isTaskError`).
- `CleanUpTask` (`@task("cleanup-task")`).
- Builder DSL: `TaskBuilder`, `TaskBackoffBuilder`, `CompositeTaskBuilder`, `TaskStepSpecBuilder`.
- Models: `TaskModel`, `TaskEventModel`, `TaskStepSpecModel`, `TaskStepResultModel`, `TaskErrorModel`, `TaskBackoffModel`, `TaskLogEntryModel`, `TaskIOSerializer`.
- Enums: `TaskStatus`, `TaskType`, `TaskEventType`, `BackoffStrategy`, `JitterStrategy`; `DefaultTaskEngineConfig`.

**workers** (subpath `./workers`)
- `TaskEngine<A>` (extends `tasks.TaskEngine`) — worker-thread pool dispatch of atomic handlers.
- `WorkThreadEnvironment` / `DefaultWorkThreadEnvironment`; `workerThread.ts` entry; `messages.ts` wire protocol.

**migrations** (subpath `./migrations`; `SemverMigrationVersioning` also a dedicated subpath)
- `AbsMigration<A,R>` (`Migration` interface), `@migration(reference, ...)` decorator.
- `MigrationService<PERSIST,A,R>` — orchestrator: `migrateAdapters`, `migrate`, `track`, `retry`, `sort`, `buildExecutionPlan`, task-mode vs inline.
- `MigrationTaskBuilder`, `MigrationTask` (`@task("migration")`).
- `StandardMigrationVersioning` (lexical), `SemverMigrationVersioning` (semver), `MigrationVersioning` interface.
- `DefaultMigrationConfig`, `PersistenceMigrationConfig`, `MigrationConfig`, `MigrationRule`, `AdapterMigrationHandlers`.

**ram** (subpath `./ram`)
- `RamAdapter`, `RamStatement`, `RamPaginator`, `RamFlavour="ram"`, `createdByOnRamCreateUpdate` handler, `RamConfig`/`RamStorage`/`RawRamQuery`/`RamFlags`/`RamContext` types.

**fs** (subpath `./fs`)
- `FilesystemAdapter`, `FilesystemConfig`, `FsIndexStore`, `helpers` (`encodeId`/`serializeId`/`deserializeId`/`atomicWrite`/`ensureDir`/…). Note: `FsDispatch`, `FilesystemLock`, `FilesystemMultiLock` are **not** exported from the `./fs` barrel.

**utils**
- `ContextualLoggedClass<C>` + `AbsContextual<C>` — the `logCtx` engine; `ContextualArgs`/`MaybeContextualArg`/`ContextualizedArgs`.
- `@create`/`@read`/`@update`/`@del` (operation guards), `@service`, `@auth`, `@roles`, `@route`.
- `@throttle` + `ThrottleMode`/`splitByCount`/`splitBySize`.
- `AuthorizationError`, `ForbiddenError`, `ConnectionError`.
- `injectableServiceKey`, `promiseSequence`, `isOperationBlocked`, `normalizeImport`, `prefixMethod`.

**interfaces** (re-exported from main barrel, but `ContextuallyLogged` and `Paginatable` are *not* re-exported from `interfaces/index.ts`): `ErrorParser`, `Executor`, `Observable`, `Observer`, `Queriable`, `RawExecutor`/`RawPagedExecutor`, `SequenceOptions`.

#### 6. Key patterns & concepts

- **Flavour system.** Every adapter instance has a `flavour` (e.g. `"ram"`, `"fs"`, `"typeorm"`) and optional `alias`. Adapters self-register in `Adapter._cache` keyed by alias; the first constructed adapter becomes the implicit `Adapter.currentFlavour`. `core` monkey-patches `Decoration.flavourResolver` at module load (`Adapter.ts:62-97`) so decoration flavour lookups route through the adapter cache. Models are bound to flavours via `@uses(flavour)`/`Metadata.flavourOf`, and `Repository.forModel` resolves the flavour chain (`Metadata.registeredFlavour` → `Metadata.flavourOf` → `Adapter.currentFlavour`).
- **Decorators as the configuration system.** Persistence behaviour is declared with decorators (`@table`, `@pk`, `@column`, `@index`, `@unique`, `@version`, relations, `@repository`, `@query`, `@prepared`, `@task`, `@migration`, `@service`, `@transactional`). Most are built on `Decoration.for(KEY).define({decorator, args}).apply()` from `@decaf-ts/decoration`, giving flavour-aware override (`Decoration.flavouredAs(...)`).
- **Context + logCtx.** A `Context<F>` (flag bag) is threaded as the trailing argument of every operation. `ContextualLoggedClass.logCtx(args, operation, allowCreate, overrides?)` extracts-or-creates the `Context`, binds a logger to the operation, and returns `{ctx, log, ctxArgs}`. This is the cross-cutting backbone used by `Adapter`, `Repository`, `Dispatch`, `Sequence`, `Statement`, `Service`. `isContextLike` duck-types rather than `instanceof` to survive duplicate `Context` constructors in linked monorepo builds.
- **Adapter as façade + lazy base-class wiring.** `Adapter` declares private statics `_baseRepository`/`_baseSequence`/`_baseDispatch`; `Repository`, `Sequence`, `Dispatch` self-assign them at import time, breaking what would otherwise be a circular dependency.
- **prepare/revert.** `Adapter.prepare(model, ctx)` segregates a model into `{record, id, transient}` (mapping property→column, dropping reserved names, carrying `__metadata`); `Adapter.revert(...)` reconstructs the model, reattaching transient props only when `ctx.get("rebuildWithTransient")`. All CRUD goes through this loop.
- **Transactions.** `@transactional` wraps a method in a Proxy that resolves the adapter's `ContextLock` via `resolveTransactionLock` (walks `ModelService`/`Repository`/`Adapter`), increments `lock.depth`, and calls `begin`/`commit`/`rollback` only at the outermost depth. The default `ContextLock` is a no-op (`maxConcurrentTransactions=-1`); `0` disables; `>0` engages a per-adapter `SimpleConcurrencyLock` FIFO semaphore (`WeakMap`-keyed). Native adapters override `transactionLock()` to wrap real `BEGIN/COMMIT/ROLLBACK`.
- **Observer/event layer.** `Adapter.observe()` lazily creates an `ObserverHandler` and a `Dispatch`; `Dispatch` wraps the six mutating CRUD methods (`create/update/delete` + bulk) in Proxy traps that fire `adapter.refresh(...)` after success. Observer failures are caught/logged so they never fail the CRUD op. `ObserverFilter`s (`event-filters.ts`) restrict events to model/operation.
- **Query DSL + squashing.** `Statement` is a fluent builder; `build()` is abstract (subclasses compile to a native query). When `forcePrepareSimpleQueries`/`forcePrepareComplexQueries` flags are set, `Statement.executionPrefix` calls `squash()`/`prepare()` to reduce the query to a `PreparedStatement` (a `{class, method, args, params}` shape) dispatched through `Repository.statement`. `MethodQueryBuilder` parses method names into structured `QueryAssist` so `@query`-decorated repository methods work.
- **Task engine.** `TaskEngine` polls for runnable tasks (`PENDING`, `WAITING_RETRY` past `nextRunAt`, expired leases, due `SCHEDULED`), claims them via optimistic update with a lease, dispatches to handlers (or runs composite steps with optional concurrency under a shared `lock`), persists status/log/progress `TaskEventModel`s, and emits them on a `TaskEventBus`. Handlers register via `@task("type")`; `TaskHandlerRegistry` bootstraps from `Metadata.tasks()`. Composite tasks support `steps`, `dependsOn`, per-step `maxAttempts`/`backoff`/`canFail`, and `scheduleSteps` for dynamic step insertion. `TaskStateChangeError` thrown from a handler triggers `cancel`/`retry`/`reschedule`.
- **Worker threads.** The worker `TaskEngine` extends the base engine and dispatches *atomic* handlers to Node `worker_threads`, posting `execute` jobs and receiving `ready/log/progress/heartbeat/result` messages. Composite tasks still run on the main thread (the worker override builds the `TaskContext` without `stepWriteLock`/`scheduleCompositeSteps`).
- **Migrations.** `@migration(reference, precedence?, flavour?, rules?)` registers migration classes; `MigrationService.collectMigrations` → `sort` (by `versioning.compare` → precedence tokens → flavour → reference) → `buildExecutionPlan` (filtered by `fromVersion`/`toVersion`) → run inline or as per-version `CompositeTask`s through a `TaskService` (task mode), chaining dependencies and calling `setCurrentVersion` per completed version.
- **Override/monkey-patch module.** `src/overrides` is imported first and augments external namespaces (`Metadata`, `Model`, `Injectables`, `ModelBuilder`) via TS `declare module` + runtime assignment, so core-specific methods (`Model.tableName`, `Model.sequenceFor`, `Model.merge`, `Model.indexes`, `Metadata.relations`, `Injectables.services()`…) are available throughout `core` despite living in external packages.
- **Injectable registry.** `Injectables.setRegistry(new InjectablesRegistry())` (`src/index.ts:14`) enables `@repository` to resolve model→repository automatically; `InjectablesRegistry.get` falls back to `Repository.forModel` when an explicit registration is missing.

#### 7. Lifecycle / configuration / environment

- **Boot/init.** Adapters are constructed with `(config, flavour, alias?)` and self-register; they auto-become `current` if first. `PersistenceService.initialize` accepts `[Constructor, Config, ...args][]` and constructs + `initialize()`s each adapter. `Service.boot()` iterates `Injectables.services()` and boots each `ClientBasedService` (reverse-order `shutdown()`). `ModelService` lazily resolves its repository via `Repository.forModel` and can be created per-model via `ModelService.forModel`.
- **Flavours.** Set per adapter (`RamFlavour="ram"`, `"fs"` literal, custom for DB adapters). Models bind via `@uses(flavour)`; decorations can be flavour-scoped via `Decoration.flavouredAs`.
- **Env vars / defaults.** No required env vars. Notable defaults:
  - `DefaultAdapterFlags.maxConcurrentTransactions = -1` (unbounded); `breakOnSingleFailureInBulk = true`; `enforceUpdateValidation = true`; `allowRawStatements = true`; `observeFullResult = true`; `paginateByBookmark = false`.
  - `DefaultTaskEngineConfig`: `workerId:"default-worker"`, `concurrency:10`, `maxConcurrentCompositeSteps:-1` (Infinity), `leaseMs:60000`, `pollMsIdle:1000`, `pollMsBusy:500`, `logTailMax:100`, `gracefulShutdownMsTimeout:120000`, `autoShutdown:{enabled:false, backoffStepMs:1000, maxIdleDelayMs:60000}`.
  - `FilesystemAdapter` `rootDir` defaults to `path.join(os.tmpdir(), "decaf-fs-adapter")`; `watch` defaults to `true` (`watch !== false`); `watchDebounceMs` default `50`; `alias` default `"fs"`.
  - `Sequence`/`@pk` defaults: `DefaultSequenceOptions = NoneSequenceOptions` (`type: undefined`, `generated: false`, `startWith: 0`, `incrementBy: 1`, `cycle: false`); `@pk` defaults to `Number`, `generated: true`. `Serial` zero-pads to 14 digits.
- **Version constants.** `VERSION`, `COMMIT`, `FULL_VERSION`, `PACKAGE_NAME` are placeholder strings (`"##VERSION##"` etc.) replaced at publish/build time; `Metadata.registerLibrary(PACKAGE_NAME, VERSION)` runs at import.

#### 8. Data & control flow

A typical `repository.create(model)` flow:
1. `Repository.createPrefix` runs `logCtx(args, OperationKeys.CREATE, true)` → builds a `Context` (flags incl. `correlationId`, `affectedTables`, `writeOperation`).
2. Unless `ignoreHandlers`, runs `enforceDBDecorators(..., OperationKeys.CREATE, OperationKeys.ON)` (e.g. `@uuid`/`@pk`/`@sequence` onCreate handlers generate ids; `@createdBy`/`@createdAt` populate audit fields; relation `onCreate` handlers persist nested models and set fks).
3. Unless `ignoreValidation`, runs `model.hasErrors(...)` using `Metadata.validationExceptions` (combining `@noValidateOn*` and nested relations).
4. `adapter.prepare(model, ctx)` → `{record, id, transient}` (column mapping, reserved-name refusal, `__metadata` carried).
5. `adapter.create(clazz, id, record, ctx)` (native I/O; `Dispatch` Proxy trap fires `adapter.refresh(...)` → `updateObservers` after success, observer errors swallowed).
6. `adapter.revert(record, class, id, transient?, ctx)` reconstructs the model; `afterAny` handlers (e.g. `populate`) rehydrate relations from `cacheForPopulate`.
7. Returns the rebuilt model; `@transactional` (if present) commits at the outermost depth.

A query `repo.select(["age"]).where(Condition.attribute("age").gt(18)).orderBy(["age","asc"]).limit(10).execute()`:
1. `Statement` fluent methods freeze selectors; `execute` runs `executionPrefix` (optionally `squash`/`prepare` per force-prepare flags) to obtain `ctxArgs`.
2. Either `executePrepared` (dispatches through `Repository.statement`) or `build()` (abstract → e.g. `RamStatement.build()` compiles `Condition`→predicate, `orderBy`→sort fn) then `adapter.raw(query, true, ctxArgs)`.
3. Post-processing: `processRecord` (`adapter.revert`) per record; `applyAfterHandlersToResult` enforces `OperationKeys.READ`/`AFTER` DB decorators when `afterQueryHandlers` is set. Errors wrapped in `QueryError`.

A task `engine.push(task)` → `tasks.create` → polling `loop` claims it (`tryClaim` optimistic update sets `RUNNING`+lease) → `executeClaimed` builds a `TaskContext`, dispatches to `registry.get(classification).run(input, ctx)`, persists `TaskEventModel`s, emits on `TaskEventBus`, and on error applies backoff (`WAITING_RETRY`) or `FAILED` (or routes `TaskStateChangeError`).

#### 9. Testing

Tests live in `tests/{unit,integration,e2e}`. Jest config `jest.config.cjs`; scripts `test:unit`/`test:integration`/`test:e2e`/`test:all`; coverage via `workdocs/reports/jest.coverage.config.cjs`. A generated `workdocs/reports/coverage/lcov-report/` exists.

**Unit coverage** (selection; ~100 files):
- Query: `query.test.ts` (DSL on RamAdapter: select, where, AND/OR, startsWith/endsWith, orderBy/thenBy, groupBy, limit/offset), `statement.test.ts` (squashing into prepared statements, raw vs prepared execution, pagination), `Pagination.test.ts` (raw + prepared pagination; `previous()` never exercised), `Condition.test.ts` (operators, between, AND/OR trees; `not()` untested), `MethodQueryBuilder.test.ts`/`.new-prefixes.test.ts` (findBy/pageBy/countBy/sumBy/avgBy/minBy/maxBy/distinctBy/groupBy parsing; multi-ThenBy `it.skip`).
- Repository: `repository.test.ts` (CRUD + observer events), `repository.aggregation-methods.test.ts` (countOf/maxOf/…/groupOf), `repository.decorators.test.ts` (`@repository` property vs class), `repository-uuid.test.ts` (uuid/serial pk CRUD).
- Model: `model-relations.test.ts`, `model-relation-manyToOne.test.ts`, `model-relation-manyToMany.test.ts`, `model-relation-oneToOne-undefined.test.ts`, `model-relation-validation.test.ts`, `model.construction.test.ts` (only `repositoryFromTypeMetadata`), `model.merge.test.ts`, `indexes.test.ts`, `pk-override.test.ts`, `pk-construction.test.ts`, `model-serialized-list-update.test.ts`.
- Tasks: `tasks.test.ts`, `composite-tasks.test.ts`, `task-tracker.test.ts`, `tasks.service.test.ts`, `tasks.utils.test.ts`, `tasks.logging.test.ts`, `task-context-logger.test.ts`, `task-engine-auto-shutdown.test.ts`, `task-engine-composite-logging.test.ts`, `task-step-spec-model.test.ts`.
- Migrations: `migration.test.ts` + many focused (`migration.flavour-selection`, `.semver-order`, `.legacy-order`, `.flavour-conflict.error`, `.references-filter`, `.retrieve-last-version`, `.set-current-version`, `.string-precedence-version`, `.task.hops-retry`, `.context-inheritance`, `.adapterless-handlers`, `.handler-routing`), `migration-task-builder.test.ts`.
- Runtimes: `RamAdapter.test.ts` (basic CRUD; last `it` body empty), `RamAdapter.aggregate.test.ts` (min/max/count/distinct; missing countDistinct/sum/avg/groupBy), `filesystem-adapter.test.ts` (persistence across restarts, indexes, spacing, onHydrated, lock contention, watcher mirroring), `fs/filesystem-lock.test.ts`, `fs/helpers.test.ts`.
- Services: `model-service.test.ts`, `service.test.ts`, `service.injection-variants.test.ts`, `service-inference-boot.test.ts`/`2`.
- Utils: `throttle.test.ts` (comprehensive), `utils.errors.test.ts`, `persistence.errors.test.ts`, `query.errors.test.ts`, `repository.errors.test.ts`.
- Transactions: `transaction-cross-service.test.ts`, `transaction-model-service.test.ts`, `transaction-registration-precedence.test.ts`, `transaction-rollback.test.ts`, integration `transaction.deep-nesting`/`.max-concurrent`/`.ram-adapter`.
- Auth: `auth-decorators.test.ts`.

**Integration:** multi-adapter (flavour inheritance, full), adapter-proxy-dispatch, composite-tasks, task-workers, tasks.worker.fs, persistence migration multi-adapter.

**E2E:** `contextualization.test.ts`, repository CRUD/batch/aggregate/query e2e with a richer model set (Product, Market, Leaflet, Batch…).

**Notable gaps:**
- `Repository.forModel` flavour-resolution branches beyond simple `@uses`; `Repository.override`/`for` Proxy behaviour; `InjectablesRegistry.get` auto-resolution fallbacks; `findByPaginate` (undocumented method); `Repository.query()` convenience; `@persistentVersion`/`@version(true)` lifecycle; default `@createdBy`/`@updatedBy` throwing `AuthorizationError`; `ObserverError`; `Paginator.previous()`; `Paginator.validatePage` (defined, never called internally); `Condition.not()`; `Condition.from()`.
- `manyToManyOnUpdate`/`manyToManyOnDelete` are `console.warn` "under development"; only `manyToManyOnCreate` + junction construction are tested.
- `RamAdapter.aggregate.test.ts` lacks `countDistinct`/`sum`/`avg`/`groupBy`.
- `RamAdapter.test.ts` final `it` has an empty body.
- `./fs` and `./ram` subpath export surfaces (and the non-export of `FsDispatch`/locks) are not asserted.
- `FilesystemAdapter` `stopWatching`/`clearPendingObserverRefresh`/rootWatcher add/remove-table path not tested; no `shutdown()` override (watchers/lockfiles not closed by base `shutdown`).

#### 10. Usage example

Minimal CRUD with the RAM runtime (derived from `tests/unit/RamAdapter.test.ts` and `repository.test.ts`):

```typescript
import { Repository, Repository } from "@decaf-ts/core";
import { RamAdapter } from "@decaf-ts/core/ram";
import { table, pk, prop, required } from "@decaf-ts/db-decorators";

@table("users")
class User {
  @pk() id!: string;
  @required() name!: string;
  @prop() age!: number;
}

const adapter = new RamAdapter({ user: "tester" });           // flavour "ram", becomes current
const repo = Repository.forModel(User);                        // resolves adapter + repo

const created = await repo.create({ name: "alice", age: 30 }); // @pk generates a uuid
const read = await repo.read(created.id);
await repo.update({ ...read, age: 31 });
await repo.delete(read.id);                                    // subsequent read throws NotFoundError
```

Prepared-statement / method-name query (derived from `tests/unit/Pagination.test.ts` + `MethodQueryBuilder.new-prefixes.test.ts`):

```typescript
import { query, prepared } from "@decaf-ts/core";
import { OrderDirection } from "@decaf-ts/core";

class UserRepo extends Repository.forModel(User) {            // repository registered via @repository
  @query()                                                     // parses method name → Statement
  async findByNameAndAgeGreaterThan(name: string, age: number, order?: OrderDirection) { /* overridden */ }

  @prepared()                                                  // callable via repo.statement("paginateByAgeBiggerAndName", ...)
  async paginateByAgeBiggerAndName(age: number, name: string, params: { limit: number; offset: number }) {
    return this.select().where(Condition.attribute("age").bigger(age)).paginate(params.limit);
  }
}

const users = await repo.findBy("name", "alice");
const page = await repo.paginateBy("age", OrderDirection.DSC, { limit: 20, offset: 2 });
```

#### 11. Relationships

- **db-decorators / decoration / decorator-validation / injectable-decorators / transactional-decorators:** `core` consumes and *augments* these (`overrides`) — they provide the decorator/registry/validation/lock primitives; `core` adds persistence semantics on top.
- **logging / utils:** devDependencies in-repo but runtime dependencies for consumers; `ContextualLoggedClass` extends `LoggedClass` from `@decaf-ts/logging`.
- **Adapters (`for-typeorm`, `for-couchdb`, `for-pouch`, `for-nano`, `for-fabric`):** subclass `Adapter`, implement the abstract CRUD/raw/Statement/Paginator/parseError/getClient surface, and typically override `transactionLock`, `Context`, `prepare`/`revert`, `getClient`, and add native indexing.
- **for-http / for-nest:** expose repositories/services via controllers using `core`'s operation/context model and `@route`/auth decorators.
- **for-angular / for-react / ui-decorators:** consume `Model`/`Repository`/`Statement` metadata for rendering; `ModelService` is a common injection point.
- **integrations:** uses `PersistenceService`/`ModelService`/task engine/migrations for Keycloak, Docker, namespaces, feature flags, etc.
- **mcp-server / graph-execution:** build services/tasks on the `core` service/task substrate.

#### 12. Consumer notes

- **Import paths matter.** `RamAdapter` is **not** in the main `@decaf-ts/core` barrel (`src/index.ts:30` commented out) — import it from `@decaf-ts/core/ram`. `FilesystemAdapter` is only at `@decaf-ts/core/fs`; it is **not** exported from the root (the README example importing it from `@decaf-ts/core` is wrong). `./tasks`, `./workers`, `./migrations`, `./migrations/SemverMigrationVersioning` are dedicated subpaths.
- **`@transactional` must be imported from `@decaf-ts/core`**, not `@decaf-ts/transactional-decorators`; the base package re-registers its own decorator and would override core's (`transactions.ts:96-107`).
- **First adapter wins.** The first constructed `Adapter` becomes `Adapter.currentFlavour`; later `Repository.forModel` calls fall back to it when a model has no explicit flavour. Call `Adapter.setCurrent(flavour)` to change it.
- **`OrderDirection` is `ASC`/`DSC` (not `DESC`).** Using `OrderDirection.DESC` yields `undefined`.
- **Default `@createdBy`/`@updatedBy` throw `AuthorizationError`** ("This adapter does not support user identification") unless the adapter overrides the handler (RAM/FS provide `createdByOnRamCreateUpdate` via `decoration()`).
- **`maxConcurrentTransactions`:** `-1` (default) = no locking; `0` = transactions disabled (throws `UnsupportedError`); `>0` = per-adapter FIFO semaphore. Native adapters that override `ContextLock.begin/commit/rollback` without `super.*()` opt out of the semaphore entirely.
- **Observer failures never fail CRUD** (caught/logged in `Dispatch`). Observer error logs in `ObserverHandler.updateObservers` index the *filtered* list but log against the *unfiltered* `this.observers[i]` — misreported observer when filters excluded some (see inaccuracies).
- **`Paginator.validatePage` is defined but never called** by `page()`/`pagePrepared`; bounds are not enforced by the base paginator. `next()` before the first `page()` yields `NaN` (`_currentPage` undefined).
- **`@manyToMany` is under development** (`console.warn` on create/update/delete); use with caution.
- **`FilesystemAdapter` does not override `shutdown()`** — base `shutdown()` only closes proxies/dispatch; `FSWatcher`s and lockfiles are not closed. Call `stopWatching()` explicitly.
- **`UUID` generator uses `Math.random()`** (not cryptographic) — fine for non-security IDs only.
- **Maturity / versioning:** `0.29.0`; `manyToMany` and several `console.warn`-gated paths are explicitly experimental; the `workdocs/reports/RELEASE_NOTES.md` and `CHANGELOG.md` track changes. `SemverMigrationVersioning` is optional (requires `semver`).
- **`fs` flavour has no exported constant** (the literal `"fs"` is used inline); contrast `ram/constants.ts` which exports `RamFlavour`.

#### 13. Inaccuracies found

1. **[core] README import path for `FilesystemAdapter`** — README imports `FilesystemAdapter` from `@decaf-ts/core`, but `src/index.ts` does not re-export `./fs` (and `./ram` is commented out). `FilesystemAdapter` is only available via the `@decaf-ts/core/fs` subpath (`package.json` exports). | Evidence: `README.md:197` `import { FilesystemAdapter, Repository } from "@decaf-ts/core";` vs `src/index.ts:30` (`// export * from "./ram";`) and absence of `./fs` in the main barrel. | Suggested fix: change the README import to `@decaf-ts/core/fs`.

2. **[core] README `Adapter` generic parameters are wrong** — README documents `Adapter<N, Q, R, Ctx>` (config, query, result, ctx); the actual signature is `Adapter<CONF, CONN, QUERY, CONTEXT extends Context<AdapterFlags>>` (config, native connection, query, context). There is no `R` (result) parameter. | Evidence: `README.md:108` vs `src/persistence/Adapter.ts:231-236`. | Suggested fix: update the README generic list to `<CONF, CONN, QUERY, CONTEXT>` and describe each.

3. **[core] README "Extending the Adapter" example omits required abstract members** — the example implements only `create` and says implement `read/update/delete/raw`; the code also requires `Statement`, `Paginator`, `parseError`, and `getClient`. The README example would not compile as written. | Evidence: `README.md:304-320` vs abstract methods at `Adapter.ts:426-434, 473, 797-802, 857-861, 911-916, 969-973, 1021-1025, 1259`. | Suggested fix: list all abstract members (`Statement`, `Paginator`, `parseError`, `getClient`, plus the CRUD/raw methods) in the example.

4. **[core] README `create` example signature drops the required trailing `Context` arg** — README shows `async create<M>(clazz, id, model): Promise<Record<string,any>>` but the abstract signature requires `...args: ContextualArgs<CONTEXT>` (a trailing `Context`). This contradicts the README's own `@transactional` section ("Always forward the trailing `...args`"). | Evidence: `README.md:309-313` vs `Adapter.ts:797-802`. | Suggested fix: add `...args: ContextualArgs<any>` to the example signature and forward it.

5. **[core] README native-transaction example uses wrong `begin/commit/rollback` signatures** — README shows `override async begin(): Promise<void>` (no args); the actual methods are `begin(context)`, `commit(context)`, `rollback(err, context)`. | Evidence: `README.md:383-403` vs `ContextLock.ts:112, 141, 151`. | Suggested fix: add the `context` parameter (and `err` for `rollback`) to the example.

6. **[core] README `FilesystemAdapter.shutdown()` comment is inaccurate** — README says `await adapter.shutdown(); // closes open file handles when the app exits`, but `FilesystemAdapter` does not override `shutdown()`; base `Adapter.shutdown()` only shuts down proxies and closes the dispatch — it does not close `FSWatcher`s or remove lockfiles. `stopWatching()` must be called explicitly. | Evidence: `README.md:215` vs `FilesystemAdapter.ts` (no `shutdown` override) and `Adapter.ts:359-389`. | Suggested fix: correct the comment and document `stopWatching()`.

7. **[core] README uses `OrderDirection.DESC` which is `undefined`** — the enum is `ASC="asc"`, `DSC="desc"` (no `DESC` member). README examples at three places use `OrderDirection.DESC`. | Evidence: `README.md:662, 675, 704` vs `src/repository/constants.ts:12-15`. | Suggested fix: change `OrderDirection.DESC` to `OrderDirection.DSC`.

8. **[core] README places `@prepared()` under `repository/decorators`** — README documents `@prepared()` under the "Decorators (`repository/decorators`)" heading, but `@prepared` is exported from `src/query/decorators.ts:26`. `repository/decorators.ts` only exports `@repository`. | Evidence: `README.md:85-87` vs `src/query/decorators.ts:26-40` and `src/repository/decorators.ts` (only `repository`). | Suggested fix: move the `@prepared()` bullet to the query decorators section (or correct the path).

9. **[core] README omits `findByPaginate` from the high-level query method list** — `Repository.findByPaginate(key, value, ref?, ...args)` exists (`Repository.ts:1338-1398`) but is not listed in the README's high-level query methods. | Evidence: `README.md:66-76` (no `findByPaginate`) vs `Repository.ts:1338`. | Suggested fix: add `findByPaginate(key, value, ref?)` to the list.

10. **[core] README `Repository.for(config, ...args)` described as static but is an instance method** — README says `static for(config, ...args)` is a "Proxy factory for building repositories with specific adapter config"; `for(conf, ...args)` is an instance method (`Repository.ts:393-402`); the static factory is `Repository.forModel`. | Evidence: README `:81` vs `Repository.ts:393-402` (instance) and `:1730` (`forModel` static). | Suggested fix: describe `for` as an instance method and `forModel` as the static factory.

11. **[core] `Adapter.static get` JSDoc says it returns `undefined` when missing; code throws `InternalError`** — `static get<A>(flavour?)` JSDoc: "The adapter instance or undefined if not found", but the body throws `InternalError("No adapter...")`. | Evidence: `src/persistence/Adapter.ts:1207-1214`. | Suggested fix: correct the JSDoc to state it throws.

12. **[core] `Adapter.repository()` error message is stale** — message says the base "will be replaced lazily" but `repository()` only throws; there is no lazy replacement. | Evidence: `src/persistence/Adapter.ts:297`. | Suggested fix: remove the "replaced lazily" claim.

13. **[core] `Dispatch.close()` JSDoc vs body mismatch** — JSDoc says "Performs any necessary cleanup"; the body is an intentional no-op with a typo comment `// to nothing in this instance`. | Evidence: `src/persistence/Dispatch.ts:307-314`. | Suggested fix: correct the JSDoc to note the base is a no-op that subclasses may override.

14. **[core] `ObserverHandler.updateObservers` indexes the filtered list but logs against the unfiltered list** — `results` comes from `observers.filter(...).map(...)`, but the error log uses `this.observers[i]` (unfiltered), so the wrong observer is reported when filters excluded some. | Evidence: `src/persistence/ObserverHandler.ts:147-170`. | Suggested fix: capture the filtered array and index into it.

15. **[core] `errors.ts` `UnsupportedError` example references non-existent APIs** — the JSDoc example uses `adapter.supportsTransactions()` and `adapter.beginTransaction()`, which do not exist on `Adapter` (the API is `transactionLock()`). | Evidence: `src/persistence/errors.ts:11-23` vs `Adapter.ts` (no such methods). | Suggested fix: rewrite the example using `transactionLock()`/`maxConcurrentTransactions`.

16. **[core] `Statement.prepareCondition` `BIGGER_EQ` branch drops the comparison value** — unlike every other branch, the `BIGGER_EQ` (and `SMALLER_EQ` mirrors it correctly) `>=` path does not push `comparison` into `args`, so squashed `where(attr.gte(x))` loses the bound value. | Evidence: `src/query/Statement.ts:571-573` (no `args.push`) vs `:578-581` (`SMALLER_EQ` pushes). | Suggested fix: add `args.push(condition.comparison)` to the `BIGGER_EQ` branch.

17. **[core] `Statement.prepare` sets `params.skip` while `DirectionLimitOffset`/Paginator use `offset`** — `prepare()` writes `params.skip = offsetSelector` (`Statement.ts:955`) but `Paginator.pagePrepared` reads `params.offset`/`params.direction`. Prepared statements built via `prepare()` may have `offset` undefined. | Evidence: `src/query/Statement.ts:955` vs `src/query/types.ts:31-37` and `src/query/Paginator.ts:160, 207`. | Suggested fix: use `offset` consistently (or read both).

18. **[core] `Repository.deleteAll` logs under the wrong operation key** — `deleteAll` calls `this.logCtx(args, this.create, ...)` instead of `this.delete`, so observer/logging events for bulk delete are mislabelled as `create`. | Evidence: `src/repository/Repository.ts:979`. | Suggested fix: change `this.create` to `this.delete`.

19. **[core] `@manyToMany` JSDoc is copy-pasted from `@manyToOne`** — the `manyToMany` decorator JSDoc says "Defines a many-to-one relationship" and shows a `@manyToOne` example. | Evidence: `src/model/decorators.ts:646-673`. | Suggested fix: rewrite the `manyToMany` JSDoc.

20. **[core] `SequenceModel` JSDoc says "@category Ram" / "RAM sequence model" but the class lives in the generic `model/` module** — it is used across adapters, not RAM-specific. | Evidence: `src/model/SequenceModel.ts:8,14`. | Suggested fix: correct the category/description to "model".

21. **[core] `Sequence.parseValue` has unreachable `toLowerCase()` branches** — `Number.name || Number.name.toLowerCase()` always returns `"Number"` (the left operand is a truthy string), so the `toLowerCase()` fallbacks are dead. | Evidence: `src/persistence/Sequence.ts:475, 481, 483`. | Suggested fix: remove the dead `||` branches or invert the logic.

22. **[core] `Sequence.range()` throws `UnsupportedError` for `uuid`/`serial` with a TODO** — documented behaviour is incomplete; the TODO says "just generate valid uuids/serials". | Evidence: `src/persistence/Sequence.ts:259-262` (`// TODO just generate valid uuids/serials`). | Suggested fix: implement or clearly document the limitation.

23. **[core] `interfaces/index.ts` omits `ContextuallyLogged` and `Paginatable`** — both interface files exist but are not re-exported from the interfaces barrel, so they are unreachable through `@decaf-ts/core`. | Evidence: `src/interfaces/index.ts:6-12` (omits `ContextuallyLogged`, `Paginatable`). | Suggested fix: add the re-exports or remove the unused files.

24. **[core] `AdapterFlags.lock` field appears unused/dead** — only `ContextFlags.transactionLock` is read by `@transactional`; `AdapterFlags.lock` is declared but not used. | Evidence: `src/persistence/types.ts:189` vs `transactions.ts:46` (uses `transactionLock`). | Suggested fix: remove `lock` or document its intended use.

25. **[core] `@manyToMany` runtime is under development with `console.warn`** — `manyToManyOnCreate`/`OnUpdate`/`OnDelete` emit `console.warn("DECORATOR manyToMany UNDER DEVELOPMENT")` / `"method not yet implemented"` / `"Method under development"` instead of using the context logger. | Evidence: `src/model/construction.ts:897, 1144, 1162`. | Suggested fix: complete the implementation or clearly mark experimental in docs; replace `console.warn` with the context logger.

26. **[core] `construction.ts` contains large blocks of dead/commented code and `console.*` calls** — commented `createOrUpdateBulk` skeleton (with `if (ex.)` syntax errors), ~60 lines of commented prior `oneToManyOnCreateUpdate`, and `console.log`/`console.error` in `getOrCreateJunctionModel`. | Evidence: `src/model/construction.ts:114-175, 541-599, 1058, 1067, 1069`. | Suggested fix: remove dead code; replace `console.*` with the context logger.

27. **[core] `workdocs/ai/focus-areas.md` / README "48 KB kb gzipped" is a double-unit typo** — README line 42 reads "Minimal size: 48 KB kb gzipped". | Evidence: `README.md:42`. | Suggested fix: correct to "48 KB gzipped" (or the accurate measured size).

28. **[core] `RamAdapter.flags` UUID fallback has operator-precedence bug** — `this.config.user || "" + Date.now()` evaluates `"" + Date.now()` first, so the `user` fallback never participates; `config.user` is ignored whenever `flags.UUID` is falsy (the `||` only triggers on a falsy `flags.UUID`). | Evidence: `src/ram/RamAdapter.ts:133`. | Suggested fix: parenthesize as `this.config.user || ("" + Date.now())` or restructure the precedence.

29. **[core] `FilesystemLock.release` is fire-and-forget and can race** — `release(...)` does `void releaseLockFile().then(() => super.release(...))`; `super.release` is not awaited and runs after the lockfile is removed, which can race a concurrent `acquire` on the same name. | Evidence: `src/fs/locks/FilesystemLock.ts:54-56`. | Suggested fix: await the chain or release the in-process lock before removing the lockfile (depending on intended ordering).

30. **[core] `TaskService.track` calls `logCtx(...).for(this.push)` instead of `this.track`** — the logging context for `track` is built under the `push` method name (copy-paste bug). | Evidence: `src/tasks/TaskService.ts:128`. | Suggested fix: change `this.push` to `this.track`.

31. **[core] `TaskEventBus.listeners` is declared but never read/written (dead code)** — a `Set` field that is never used. | Evidence: `src/tasks/TaskEventBus.ts:15`. | Suggested fix: remove the field or wire it.

32. **[core] `Injectables.repositories<R>(flavour)` declared signature takes a `flavour` param but the implementation takes none** — the `declare module` augmentation in `overrides/injectables.ts:9-11` declares a `flavour` parameter; the runtime patch in `overrides.ts:310-317` accepts none. | Evidence: `src/overrides/injectables.ts:9-11` vs `src/overrides/overrides.ts:310-317`. | Suggested fix: align the signature (add the param or remove it from the declaration).

33. **[core] `workdocs/reports/coverage/lcov-report` references a `LegacyMigrationVersioning.ts` that is not in `src/migrations/`** — the coverage HTML lists `src/migrations/LegacyMigrationVersioning.ts.html` but the current `src/migrations/` contains only `StandardMigrationVersioning.ts`/`SemverMigrationVersioning.ts`. Stale generated docs. | Evidence: `workdocs/reports/coverage/lcov-report/src/migrations/LegacyMigrationVersioning.ts.html` vs `src/migrations/` listing. | Suggested fix: regenerate the docs/coverage.

34. **[core] `migrations/index.ts` does not re-export `SemverMigrationVersioning`** — it is only reachable via the dedicated `./migrations/SemverMigrationVersioning` subpath (which `package.json` declares), but the `./migrations` barrel omits it. | Evidence: `src/migrations/index.ts:17` (omits `SemverMigrationVersioning`) vs `package.json` subpath export. | Suggested fix: add it to the `./migrations` barrel for discoverability, or document that only the subpath is supported.

35. **[core] `Paginator.isPreparedStatement()` returns a regex match array, not a boolean** — despite the `boolean`-sounding name, it returns the `regex.match` result (truthy/falsy but typed as the match). | Evidence: `src/query/Paginator.ts:114-125`. | Suggested fix: coerce with `!!` or rename/retype.

---

*End of brief. Total inaccuracies found: 35.*
