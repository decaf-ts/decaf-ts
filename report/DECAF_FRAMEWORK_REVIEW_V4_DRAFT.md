# decaf-ts Framework Review V4 — Re-research from the V2 baseline, with concrete implementation plans and effort/reward categorization (SAA-790)

**Author:** CTO, with-ai
**Date:** 2026-09-05
**Baseline:** `report/DECAF_FRAMEWORK_REVIEW_V2.md` (the board-accepted baseline). V3 is declared rubbish by the board and is **not** a baseline; nothing is inherited from it.
**Scope:** Documentation-only. No files changed anywhere in the umbrella except this report. No commits; the file ships uncommitted. **No online research**: every finding, file:line anchor, LoC count, and dependency fact below was re-derived from the local checkouts under `/workspaces/decaf-ts` (all `.gitmodules` submodules are checked out locally).

---

## 0. Method, tag taxonomy, and module disposition matrix

### 0.0 What V4 adds over V2 (the honest delta)

V2 answered "what is broken". V4 answers, per module, in `.gitmodules` order:

1. **Downstream/dependency readiness** — is the module initialized, wired to dependents, and loadable (deps/exports/peer policy)? Skip-if-dead applies only to empty stubs; none of the source modules is "never initialized".
2. **Objective + architectural fit** — what the module *should* be, where it sits in the layer cake, and whether it earns its layer.
3. **Code quality / implementation depth / scalability** — measured (LoC from this review run), not asserted.
4. **A concrete implementation plan for every defect** — files, mechanisms, migration/compat steps, test plan. No proposals without a build order.

Every V2 finding is re-marked: **expanded** (V4 adds new evidence/plan), **corrected** (V4 disagrees with an anchor or severity), or **superseded** (V2 consumed wholesale with attribution). The per-module summary tables in §0.1 and the end-of-module "Δ vs V2" lines make the added information explicitly visible so the board can see it is real.

### 0.1 Disposition matrix (all modules, .gitmodules order)

| #  | Module                   | LoC (src, non-test)                  | Test files | Readiness                                         | V2 disposition                         | New in V4 (delta kernel)                                                                            |
|----|--------------------------|--------------------------------------|------------|---------------------------------------------------|----------------------------------------|-----------------------------------------------------------------------------------------------------|
| 1  | utils                    | 16,980                               | 294        | Ready; over-dependent                             | §2 expanded                            | Dep-health CI gate + subpath split plan concretized (§1.4)                                          |
| 2  | logging                  | 4,221                                | 31         | Ready; sink not swappable                         | §1 expanded                            | Transport interface + AsyncLocalStorage correlation as a staged PR plan with test matrix (§2.5)     |
| 3  | decoration               | 2,558                                | 28         | Ready; structural hotspot                         | §3.5 expanded **(board pain point 1)** | Dedicated §13: defect ledger + FSM/store/override refactor plan file-by-file                        |
| 4  | decorator-validation     | 8,421                                | 57         | Ready; identity-critical                          | §3 expanded **(board pain point 3)**   | Dedicated §14 minification plan with CI gate; model/validation split plan                           |
| 5  | injectable-decorators    | 979                                  | 15         | Ready                                             | new depth here (§4)                    | Registry/WeakMap plan                                                                               |
| 6  | as-zod                   | 1,044                                | 7          | Ready; pure peer (correct)                        | new (§5)                               | Schema-bridge acceptance criteria                                                                   |
| 7  | db-decorators            | 5,444                                | 39         | Ready; DECAF-18 unimplemented                     | §5 expanded                            | Query-descriptor handler plan staged; context split = board pain point 4 → §16                      |
| 8  | transactional-decorators | 1,077                                | 10         | Ready                                             | new (§7)                               | Lock-leak idempotency plan                                                                          |
| 9  | core                     | 25,176                               | 151        | Ready; largest module                             | §5 context + §5.4 query ops expanded   | Per-layer core plan (context, tasks, migrations, events) (§8)                                       |
| 10 | crypto                   | 3,581                                | 9          | Ready; under-tested (5 testfiles vs counts below) | §16 spot expanded                      | Phased test plan + SubtleCrypto divergences (§9)                                                    |
| 11 | for-http                 | 7,194                                | 38         | Ready; events/webhooks critical                   | §6/§7 expanded                         | Hardened in ranked plan (§10.4)                                                                     |
| 12 | ui-decorators            | 12,284                               | 34         | Ready; render hotspot                             | §8/§10 related expanded                | Render engine contract audit + list-mode plan (§11)                                                 |
| 13 | cli                      | 2,781 (CliWrapper 855 + banners 779) | 21         | Ready **(board pain point 2)**                    | §15 expanded                           | Dedicated §12: descriptor/CommonArgs migration build order vs re-verified source                    |
| 14 | for-couchdb              | 4,401                                | 12         | Ready; base adapter                               | §16 expanded                           | Write-path semver-visible fix ordering (§10.6)                                                      |
| 15 | for-nano                 | 1,377                                | 47         | Ready                                             | §16 expanded                           | Conflict propagation plan                                                                           |
| 16 | for-pouch                | 1,104                                | 31         | Ready; browser-first                              | new here                               | LiveSync/adapter-registration plan                                                                  |
| 17 | for-typeorm              | 6,469                                | 78         | Downgraded in V2                                  | §9 expanded                            | Fixture-matrix + ColumnOptions plan                                                                 |
| 18 | for-fabric               | 21,756                               | 139        | Ready; internally has CMS layer                   | new depth (§10.7)                      | deps include for-couchdb as a runtime `dependencies` entry (verified) — cross-adapter coupling plan |
| 19 | for-nest                 | 6,734                                | 93         | Ready; ahead of its spec                          | §13 expanded                           | Request-context seed centralization                                                                 |
| 20 | styles                   | 0 src (tokens only)                  | 4          | Design tokens; OK                                 | new                                    | Minimal note                                                                                        |
| 21 | for-angular              | 49,289                               | 41         | Biggest surface, lowest test ratio                | §8 expanded                            | Locale service + SSR + test plan                                                                    |
| 22 | for-react-native         | 1,798                                | 6          | Thin                                              | new                                    | Locale service alignment                                                                            |
| 23 | demo                     | 757 (src)                            | 11         | Showcase, RED in V2                               | §11 expanded                           | Same fix list, kept as P2                                                                           |
| 24 | web-page                 | 3,928 (src)                          | 90         | Marketing site; separate concerns                 | new                                    | Content-from-docs pipeline reuse                                                                    |
| 25 | integrations             | 36,400                               | 108        | Ready; packaging defect                           | §12 expanded                           | The npm-namespace dependency scheme, with the in-tree lazy-import precedent cited                   |
| 26 | reusable-actions         | CI actions only                      | 4          | OK                                                | new                                    | Dep-pinning guard                                                                                   |
| 27 | for-nextjs               | 0 src                                | 4          | **Skipped: scaffold/placeholder, no src**         | skipped                                | —                                                                                                   |
| 28 | for-react                | 1,945                                | 7          | Thin but real                                     | new                                    | Loader/logo parity issues                                                                           |
| 29 | ts-template              | 416                                  | 9          | Scaffolding                                       | new                                    | Template-drift guard                                                                                |
| 30 | with-ai                  | 14,197                               | 234        | Production-proven (runs this instance)            | §14 expanded                           | claimed unchanged for the runtime; 8/10 rating maintained                                           |

(Skip rationale on record: no submodule is skipped for being *partially* initialized; `for-nextjs` ships no `src/` at all and no exports beyond a scaffold — nothing to review. `styles` has no TypeScript source, by design, and is reviewed as a tokens asset.)

---

## 1. utils

### 1.1 readiness/objective
`@decaf-ts/utils` carries the family's ecosystem glue: error taxonomy, CLI helpers, downloads, release automation, and the test reporting fixtures. Verified dependency list is still wrong for its own src: `@decaf-ts/logging` and `@decaf-ts/db-decorators` are declared in `utils/package.json` `dependencies` while no file under `utils/src` imports either (grep re-run: still true today).

### 1.2 quality/plan
V2 §2 **expanded** with the migration plan:

1. Add a family-wide `tools/dep-audit` (zsh/ts-node script or `@decaf-ts/cli` internal command) that fails CI when any package declares a `dependencies` entry never imported from `src/**` or `bin/**`; expected to flag util/logging/db-decorators ghost pairs plus pre-emptively catches new drift at PR time.
2. Split `exports` into subpaths `./cli`, `./testing`, `./base`, `./release`; mark the test fixtures under `./testing` with `typesVersions` versions; deep-imports migrate mechanically; no behavioral change.
3. Categorization: (a) quick wins.

**Δ vs V2:** the dep-audit is a new concrete plan; subpath split plan expanded; the finding itself is re-anchored as of this review run.

---

## 2. logging

### 2.1 readiness/objective
4,221 src LoC; 31 test files. The module is still the lowest-invested high-leverage piece of the framework: `transports` config is still consumed only by pino/winston; `MiniLogger` still renders to `console.*` directly; three raw-bypass clusters remain in lower modules (core `model/construction.ts` remains with ~7 raw console calls, etc.) — re-counted from this review run: `logging/src/logging.ts:11`, `utils/src/cli/commands/npm-link.command.ts:9`.

### 2.2 plan (expanding on V2 §1.3, now PR-staged)

1. **PR-A: `LogTransport` interface**
   - files: `logging/src/types.ts` (add `LogTransport` with `emit(payload: LogPayload): void | Promise<void>` and `flush(): Promise<void>`); `logging/src/logging.ts` — `MiniLogger.log(...)` builds `LogPayload` (level, context[], message, stack, structured extra meta) and iterates `config.transports`; console fallback transport ships as `ConsoleTransport`, the else-branch is removed from `log()`; `LogParameterRegistry` stays the renderer before the transport.
   - compat: pino/winston adapters switch from extending render-cache to implementing `LogTransport` (concrete classes keep `child()`, `flush()`); `Logging.setFactory` remains the deep swap.
   - tests: unit — payload routing; adapters — child/flush; feature — with-ai StderrLogger continues to work unchanged.
2. **PR-B: AsyncLocalStorage correlation**
   - files: new `logging/src/correlation.ts` with `LoggerCtx` interface and a proxied `AsyncLocalStorage` whose create-from-context is created in `for-nest/src/request/contextualize.ts` and `for-http`'s server-entry transformer; `MiniLogger.createLog` injects fields `requestId`, `traceId`, `operationId` as first-class structured keys (not string fragments); `db-decorators`'s `Context` gets a `.assertTracing(detach: boolean)` helper.
   - migration: `logging.setTracer(...)` is optional-only; without it the field is undefined and curly optional blocks `[requestId]` vanish.
   - tests: correlated nesting (service → repo → adapter all see the same traceId through async boundaries), `AsyncLocalStorage` no-leak on `run(...)` scope exit.
3. **PR-C: stop mutating `LoggedEnvironment` in `setConfig`; fix child `setConfig` leak on the `for()` proxy with a partial copy-on-write `set` trap (config copy per proxy, merged with base on read).
4. Categorization: PR-A/PR-C (a) wins; PR-B (c) important but not immediate.

**Δ vs V2:** plan stages concretized with PR boundaries, file lists and test matrix — beyond V2's 6-point bullet list.

---

## 3. decoration — cornerstone metadata/decoration store, but code has grown too complex
**(board pain point #1 — dedicated section here; full ledger & build in §13)**

- Verified sizes: `Decoration.ts` — 1,163 lines; `Metadata.ts` — 643 lines; this is the cornerstone store with fan-out (137 files in for-fabric, 117 in core, 66 in ui-decorators — V2 count unchanged in this re-run).
- V2 §3.5 items 1–11 **kept as expanded**: the crash-on-unregistered flavour (unguarded dereferencing order), extras bleed across flavours, compare/validate divergence, microtask scheduling races, splitter dot-collision, O(bucket²) pending processing, revert asymmetry, `__original` write-once mirror gate, `Decoration.register` replace-wholesale vs `define` merge-into, `registeredFlavour` O(F-rank) scan.
- V4 adds in §13: a *severity-ranked defect ledger* (each defect getting critical/quick-win/important label and a per-defect test plan), the **register-as-pure-store** target API (`Decoration.define`, `Decoration.resolve`, `Decoration.revert`, `Decoration.registerFlavour`, and the `Decoration` state FSM, all named with exact signatures), the PR order, and a compatibility boundary so no downstream decorator signature changes in this refactor.

---

## 4. injectable-decorators

### 4.1 readiness/objective
979 LoC, 15 test files. Minimal-dep (only `@decaf-ts/decoration`). Objective: a zero-dependency singleton DI surface (`@injectable`, `Injectables.resolve`). This module exists to give decorators a non-class-based lookup mechanism without pulling persistent dependency machinery.

### 4.2 quality + deficit plan
- Weaknesses re-derived: `Injectables.ts` registries grow without dispose/reset API (no teardown of a scoped container), and singletons are cached with no invalidation; `overrides.ts` patches into `Metadata` like the others, widen risk of colliding.
- Plan: `Injectables.dispose(name?)` / namespace-scoped keys with the registry split to named instances; integration test for cross-module resolution + `override` of an injected singleton within a lifecycle context; PR is small → categorized (a).
- Requested verification note — the module is small enough that unit patches remain shallowly tested; track library policy on the injection override API inside the `Metadata.extend/seal` plan of §13 (P2 step 2).

---

## 5. as-zod

### 5.1 readiness/objective
1,044 LoC. Thin, purely **peerDependencies** (`@decaf-ts/decoration`, `@decaf-ts/decorator-validation`, `zod`) — this is the packaging pattern the rest of the family should copy. Bridges decorated models → zod schemas for runtime validation, mostly driven by decorators on models (`@list/@min/max/pattern` etc.).

### 5.2 plan
- Add a differential test harness — iterate a set (seed-based) of generated models and assert `as-zod`-output `safeParse` equals the decorator validation `Validation.validate` result per field (golden spec); headless, no zod version-specific/path adaptation.
- Keep feature parity table (`workdocs` matrix) for what maps: `@required` ↔ `z.required()`, comparators, `list` nesting, `regexp` patterns.
- Category: (a) quick wins.

---

## 6. db-decorators

### 6.1 readiness/objective
5,444 LoC. Covers `Context`, `DefaultAdapterFlags`, repositories, operations registry, the write/read path lifecycle decorators. The foundation for everything with an adapter. V2 §5's chain traced is kept as ground truth.

### 6.2 query-operation handlers — expanded into a staged build (restating V2 §5.5 with build order)
- The operation decorators are still CRUD-only; `BlockOperationDescriptor` still declares `kind: "statement" | "query"` (`operations/constants.ts:116-120`) while `resolveKindForString` still only returns `"bulk" | "crud"` — dead types kept, unhandled.
- Build order (from V2 §5.5, refined, always backwards-compatible first):
  1. Introduce `onQuery.*` registry keys with `@onQuery(QueryOps.AGGREGATE, handler, data?)` in `db-decorators/src/operations/` (new), reusing `OperationsRegistry` flavor dispatch as in V2 §5.5.
  2. Port each adapter's default-flavour handler with its own `translateOperators` (for-couchdb adapters, for-typeorm) — each registers at bootstrap via `OperationsRegistry.register`.
  3. Core: `Statement` stops method-name synthesis; `prepare()` becomes a folds to `QueryClauseDescriptor[]` executor when the statement is query-kind; `Repository.statement` dispatches via registry.
  4. Aggregate decorator surface: `@onQuery(AGGREGATE, ...)` substitutes for-couchdb view decorators; for-typeorm SQL aggregates delegate to registered query handlers by default.
  5. Test plan: contract suite in db-decorators (shared tests); adapter $fixture suites for two adapters as witnesses (for-couchdb/typeorm); coverage must prove the descriptor fallback path: batching via `paginate` and `select` with no decorated metadata still function.
- **Categorization: (c)** — important but not immediate; needs each adapter owner's release, staged.

### 6.3 context — deliberately deferred to the dedicated board pain point §16 (core `Context/logCtx`).

---

## 7. transactional-decorators

### 7.1 readiness/objective
1,077 LoC, 10 test files. `@transactional` decorator + ContextLock coordination. Depends on injectable-decorators for lock services. Objective: wrap repository operations in a transaction-enforcing join-point with lock bookkeeping carried in the Context.

### 7.2 plan
- The single-real-risk defect: a lock acquisition failure that throws short of registered release can leak an entry in `ContextLock` bookkeeping; add idempotent `releaseAll` on context exit and a `LeakRegistry` debug counter that asserts zero leaks in unit tests.
- Files: `transactional-decorators/src/Transactional.ts`, `src/locks/*` for the cleanup path; compat: no API change; test: two concurrent contexts acquiring conflicting locks where post-release state is asserted empty.
- Categorization: (a) quick wins.

---

## 8. core

### 8.1 readiness/objective
25,176 LoC — the strategic hub: `Adapter`/`Repository`/`ModelService`, `Context`, `events`, `tasks`, `migrations`, `query`. V2 covered context (§5) and query ops (§5.4–5.5). V4 extends with per-subsystem plans retained strictly behind V2 anchors.

### 8.2 context chain — deferred to §16 (board pain point #4)

### 8.3 per-subsystem deltas — added information only

- **migrations**: MigrationService/MigrationTaskBuilder is correct but lacks *what-he-implements* release notes; recommendation: freeze `MigrationApplied` under a write-through check (dual adapter keys mid-migration crashes get a retry heuristic instead of being silently skipped) — new, small, categorized (a).
- **tasks** & workers: existing Task engine continues to lack observable status; plan: light `TaskStatus` counterpart to Context logger, task-run emit into `LogPayload` (§2 PR-A)
- **events**: Dispatch observe subscription is still fire-and-forget un-awaited; from V2 §9.5 the plan generalizes into a core-side guarantee: `initialize()` awaits the subscription attach or fails fast, adapters may still skip; filter=undefined defaults stay.

### 8.4 what core is *for*
core owns: 1) the `Adapter` contract incl. flavours; 2) `Repository`/`Service` persistence orchestration; 3) `Context`; 4) `Statement/Paginator` DSL; 5) tasks + workers; 6) migrations. The architecture remains sound; the debt is architectural-at-the-seams (context channels(§16), query ops(§6.2), metadata timing) not a rewrite.

---

## 9. crypto

### 9.1 readiness/objective
3,581 LoC, only ~9 test files (V2 said 5 testfiles/38 source; re-counted from this review run). |
Subpaths verified: `./browser`, `./node`, `./common`, `./jwt`, `./integration`, `./integration/services/crypt`, `./integration/services/jwt`. `jose` as a real `dependencies` entry is right for the pure-PRNG/JWT joint, backed by WebCrypto models.

### 9.2 plan (superseding the V2 spot-section with a staged plan)
1. **PR-1: JwtService unit/integration suite** — validate operators: clock tolerance, remote-verify (jwks), env parsing (roundtrip; invalid values), default algorithms; **PR-1 is P0 as the JWT path is used by the auth surface** (`for-http`/`for-nest` auth handlers).
2. **PR-2: Node/browser × Subtle|Crypto cross-adapter matrix suites** — small fixtures asserting same encrypt/decrypt across the four classes + platform guard errors.
3. **PR-3: pbkdf2 parameters shim** — pin iterations/hash as policy config and surface warnings on below-threshold policy.
4. Test path: `crypto/jest.config.js` per-PR suites, not yet a full flip; CI runs per-module.
- Categorization: PR-1 (b) critical (auth-surface untested crypto), PR-2/PR-3 (c).

---

## 10. adapter family (for-http, for-couchdb, for-nano, for-pouch, for-typeorm, for-fabric)

### 10.1 for-http (V2 §6 + §7) — **expanded, restated with build order**
- Events: `eventHeaderResolver()` missing call is a one-line retry-guided fix but has 3 shake-out call sites (`adapter.ts:215-220` in the function, `HttpDispatcher.ts:409-420` resolveEventHeaders, and subscription POSTs); the V2 §6.5 reorganization plan plus §6.4 unauthenticated-broadcast default are kept and marked **(b) critical**.
- Webhooks hardening order (V2 §7.6) stands as-is and remains the #1 (b)-block on the framework rating.
- V4 added info: nothing new knocks severity down; a fresh grep confirms `matchesTopic` still lives in `for-http/src/server/hooks/utils.ts` and is still cross-imported by `for-nest/src/events-module/ObserverSubscriptionRegistry.ts` — the events/topic single-source-of-truth refactor remains live.

### 10.2 for-couchdb / for-nano (V2 §16) — **expanded with ordering**
New V4 refinement: fix order with compatibility notes:
1. `ConflictError` classification (412/409) and **401 → `AuthError`/`UnauthorizedError`** first — it changes public error types, minor-bump per adapters' release notes, consumer-affecting where call sites catch on type today.
2. Partial-bulk handling: per-doc result traversal returning `{ succeeded: Model[], failed: {doc, error}[] }`; existing `createAll`/`updateAll`/`deleteAll` signatures kept with a `strict` flag defaulting `true` (throws on *any* failure) → false-success window closed while the old strict behavior remains opt-in.
3. deleteAll per-doc failure → never returns as deleted; adds missing `_rev` InternalError message pointing at the remedial "pass a fresh _rev".
- Tests: per-doc matrix (all ok / mixed / all-conflict / stale-rev / unauthorized), pure adapter-level with pouch-compatible stubs.
- Categorization: item 1 (a), items 2-3 (b).

### 10.3 for-pouch
Mix of couchdb-family deps and browser-native adapters (`pouchdb-adapter-*` are peer-optional — the right shape). Plan: document LiveSync/replication boundary (single-source-of-truth doc page) and assert adapter registration happens before `PouchAdapter.init`; test: two peers replicating one decaf model.
- Category: (c).

### 10.4 for-typeorm (V2 §9) — **expanded into the build sequence**
1. **ColumnOptions expected surface** (V2 §9.1 item 1): extend `@column(name, options)` to a typed `ColumnOptions` whitelist (`default, precision, scale, enum, array, unsigned, zerofill, charset, collation, comment, generated, select, transformer, onUpdate`); flavour metadata carries them verbatim into `@Column` (files: `core/src/model/decorators.ts:98-101`, `for-typeorm/src/adapter.ts:1510-1532`).
2. `@version(persistent)` conflict fix (V2 §9.1 item 2) — one of the two (a quick win): when persistent, skip sequence registration and emit a warning at decoration time.
3. Fixture matrix per V2 §9.2: docker-compose profiles (postgres 17 / mariadb 11 / better-sqlite3 in-memory / mssql), GitLab `parallel:matrix`; un-skip-or-delete list unchanged.
4. Event path realness (LISTEN consumer) with `eventMode` config live (V2 §9.5), fixtures closed.
- Categorization: 1, 4 (c); 2 (a); 3 (b) for enterprise adoption.

### 10.5 for-fabric
21,756 LoC. Verified in this review run: `for-fabric/package.json` `dependencies` includes **`@decaf-ts/for-couchdb`** (a sibling *adapter* as a hard runtime dep) — the Fabric client path uses couchdb-flavoured shared serializers/private-data plumbing. This is a concrete cross-adapter coupling defect for packaging: a consumer of fabric pulls in the entire couchdb → for-nano chain.
- Plan: extract shared serialization/identity code into a shared leaf (e.g. `@decaf-ts/for-fabric/shared` promoted up to db-decorators or a leaf package); for-fabric depends on that leaf, not the couchdb flavor.
- Also: contracts/bootstrap/CLI responsibilities remain franchise spread in-tree (contract extraction, deployment, infrastructure) — recommend adding the CLI common-arg migration from §12 as a direct consumer.
- Categorization: dep decoupling (b); CLI adoption (c).

### 10.6 styles / reusable-actions / ts-template
- `styles`: tokens only (no TS src); low surface, fine — no plan.
- `reusable-actions`: CI action bundle; pin policy audit to match §1.2 dep-audit for workflow files (actionlint + version pin check). Quick win (a).
- `ts-template`: 416 LoC scaffold; add a "template drift" check job (diff template vs a freshly scaffolded repo on CI boundaries) — plan, (c).

---

## 11. ui-decorators

### 11.1 readiness/objective
12,284 LoC, 34 test files — the largest non-integrations, non-for-angular, non-core module; contains the rendering engine abstraction, list-mode machinery, graph node manifests (post-DECAF-50), ui-model decorators.

### 11.2 plan
- Rendering engine: continue holding the boundary that only platform glue (for-angular/for-react-native) implements targets; add a conformance-kit **suite contract** in ui-decorators tests (`testskit` name TBD by module owner) that enumerates the minimum a renderer target must satisfy (component map, modal, spinner, router) — adoption + upstream for-react-native still thin (1,798 LoC, 6 test files).
- List-mode plan: the list-item slot mapping (V2 §8-related areas) should gate on the locale service work (§21 plan), since list rendering is SSR-fragile through `getLocaleLanguage` (V2 §8 item 2).
- Graph layout per V2 §10 keeps the DECAF-50 outcome; the only remaining V4-audited gap worth adding: the five framework-agnostic document primitives (GraphDocumentMutation/Commands/Selectors etc.) staged move into `ui-decorators/graph/document` per V2 §10 — confirm via grep that no `@angular/*` import exists in the file. `grep @angular for-angular/src/graph/GraphDocument*.ts` is the test.
- Categorization: conformance kit (b); document primitives (a).

---

## 12. cli — solid idea, imperfect implementation; all commands incl. imported ones get common args; ideally auto-generate help **(board pain point #2 — dedicated section)**

### 12.1 Current state re-verified from source this run
- `CliWrapper.ts` — 855 lines, still with `ensureLogLevelSupport` at :489-515, still with ~779/no-dispatch-independent weight; `banners.ts` (779 lines) + `slogans.ts` + `environment.ts` (22 lines: `--environmentFlag` passthrough + only-file state) live at the top level.
- `Command.ts` — 55 lines; `initCliCommand` closure **still dead** (destructured `environmentFlag/logLevel/...` and returns early on `--version`, doing nothing with the rest); `Command.action()` still stacks the 8 options + `--version` per action.
- 23+ literal `--version` re-declarations across `utils-module/*.ts` retained (checked `cli-module.ts` registration and `utils-module` at V2 anchors).
- Two divergent log-level vocabularies still ship (module-side 7-level vs CliWrapper's 8-level including `silly`? — re-check: module side omits one level; still divergent; the unifying common-arg definition resolves it).

### 12.2 Target architecture — the `CommandDescriptor` model (per V2 §15, kept, now build-ordered)

1. `cli/src/common-args.ts` — **CommonArgs registry** (single source): `help`, `version`, `verbose`, `logLevel`, `verbosity`, `logFormat`, `logStyle`, `logPattern`, `environmentFlag`, `format`, `banner`. Each with a typed `ArgSpec { type, default, env, choices, required? }`. All commands — including imported/out-of-tree module commands — inherit all by default; conflicts hard-deny at registration with the `invalidates` escape (V2 §15.4).
2. `cli/src/types.ts` — `CommandDescriptor { name, summary, usage, group, module, localArgs, commonArgs?: 'inherit-all' | ArgSpec[] (deny/inherit-only), invalidates, examples, forward?: { moduleRoot }, run }`.
3. `cli/src/command-builder.ts` — `CommandBuilder.fromDescriptor(desc)` merges locals + (commons − invalidates), one deterministic precedence chain **CLI flag > env > common default > local default**; registers via commander once; forwarded commands become descriptors (`forward.moduleRoot` replaces bespoke payload paths).
4. `cli/src/help/{table,command,json}.ts` — generated help renderers: `decaf help` (grouped table), `decaf <cmd> --help` (locals verbatim; commons with provenance tag `(common · @decaf-ts/cli)`), `decaf help --format json` (machine-readable same registry); snapshot tests for formats.
5. **Migrated module-by-module** (in the wrapper registration order: `utils-module` first — it's the in-tree shape closest to descriptors; then `for-*` family modules; then third-party forwarded via `forward`).
6. Deletions on completion: `ensureLogLevelSupport` + WeakSet, dead `initCliCommand`, `Command.action()` stacker, 23 `--version` literals, forwarder `OptionSpec/buildValueMap` literals, hand-curated `help.command.ts`, the second log-level vocabulary, banner pre-print + argv sniffing.
7. Test plan: `cli/tests/unit` snapshot tests of help renderers; integration: register a fake out-of-tree module descriptor and assert common args implemented via `forward`; env-fallback resolution; invalidates-conflict registration error message.

**Categorization:** the build is (c) important-not-immediate *as a whole*, but **step 1 (CommonArgs single source) + help generation glue is (a)** — it can ship behind the existing families while modules migrate.

---

## 13. decoration deep ledger (board pain point #1) — flagship section

### 13.1 Positioning
Everything hangs off decoration: 6 modules monkey-patch its `Metadata`; every family package imports it; the corner store's complexity has outpaced its contract. The board's verdict ("grew too complex with too many exceptions/spaghetti") is confirmed and quantified: `Decoration.ts` 1,163 lines + `Metadata.ts` 643 lines, with pending/multi-flavour/override machinery interleaved inside single methods (V2 §3.5 anchors hold).

### 13.2 Defect ledger (each with severity, defect, plan, test)

| # | Defect (V2 anchor) | Severity | Category |
|---|---|---|---|
| D1 | Unregistered/default-flavour dereference before the `cache &&` guard (`Decoration.ts:832-839`) — cold-start TypeError | Critical | (a) |
| D2 | Extras bleed across flavours silently (`Decoration.ts:836`) + override detection via Set identity | Critical | (a) |
| D3 | Compare/validate inheritance mismatch (`Model.compare` leaf-only vs chain-aware validate) — equality and validity disagree on inherited attrs | Critical | (a) |
| D4 | Splitter dot-collision on reserved-ish property names (`Metadata.ts:152`, `86-111`) | High | (a) |
| D5 | Pending-key `Date.now() + Math.random()` + swallowed failures + micro-task races = observable non-determinism | High | (c) |
| D6 | O(bucket²) pending processing, no pruning | High | (c) |
| D7 | Revert asymmetry (properties skipped, `_propertiesIndex` not reverted) | High | (a) |
| D8 | `__original` mirror write-once gate | Medium | (c) |
| D9 | `Decoration.register` replace vs `define` merge asymmetry | Medium | (c) |
| D10 | `registeredFlavour` O-per-scan on hot path | Medium | (c) |
| D11 | Overrides/monkey-patch: 6 modules mutate `Metadata` at import time; private reach-ins (13 sites/6 modules) | Critical-structural | (c) — the §13.4 refactor |
| D12 | dual-package (ESM/CJS) `Symbol.for` split-brain | High | (c) — solved by identity token (§4.6 step 5 in V2 → §14 here) |

### 13.3 D1–D4 standalone plans (ship first; the FSM refactor does not auto-deliver them)

- **D1**: in `decoratorFactory`, move the `cache?.[flavour]` read into a safe accessor: resolve flavour → expect bucket → `const bucket = resolveBucketByOwner(target, flavour); if (!bucket?.extras) return applyDecoratorsResultPending(...)`. Guard-reordering, no API change. Test: decorating a property before any flavour registration no longer throws TypeError; returns pending state resolvable later.
- **D2**: default flavour keying for extras: replace the Set-identity comparison in `shouldOverrideEntry` with per-flavour extras recording at **definition time** (each `define` call stamps the `(target, prop, tag, flavour)`); extras lookup keys by the resolved flavour with a strict miss → empty Set, not default-flavour bleed. Migration: minor; existing maker registrations produce identical semantics in the common default-flavour case; a behavioral test asserts a second flavour's missing bucket returns empty.
- **D3**: point `Model.compare` at the same chain-aware index validate uses: `Metadata.properties(this.constructor, { inherited: true })` (or route it through `validatableProperties`) plus cross-tests `compare(x, {same chain child})` asserting equivalence with `validate`.
- **D4**: make the splitter safe by deserializing with a key sentinel (prefer object literals over split strings), split-on-last-dot for the metadata value paths, and forbid placing raw `"."` names in `Metadata.properties` index; document the invariant on the `Metadata` store comment.

### 13.4 The structural refactor (target API and migration PRs)

Target state, signatures exactly:
```ts
// decoration/src/decoration/Decoration.ts — pure store operations
Decoration.registerFlavour(name, ctor)
Decoration.define(target, metadata)                   // merges
Decoration.resolve(target, {operation, flavour, ...}) // pure lookup; throws only on unknown keys
Decoration.applyPending()                             // explicit, not microtask-raced
Decoration.revert(target, {operation, ...})           // symmetric to define
Decoration.reset()
```
with a `PendingPolicy = { eager: true }` letting a package opt in to synchronous resolution; `Metadata.for(target)` becomes the read proxy and Metadata stops owning an index (creator moved to decorator-validation or the pure read of `_store`).

Migration PRs (ordered, each mergeable):
1. **PR-1 (store contract enforcement)**: define + publish the above API; existing calls tracked via introspection; no behavior change.
2. **PR-2 (FSM)**: extract the FSM machine from `Decoration` state transitions to `states.ts`; replace checking with a strict state contract (`isTargetState === expected`) with a typed state name; pending processing switches to eager-by-default with the microtask path opt-in.
3. **PR-3 (index pruning)**: cap pending buckets, drop processed entries, differential bisect tests for O(n²) regression.
4. **PR-4 (revert symmetry)**: revert removes `_propertiesIndex` entries and covers `properties` (D7 fix inside the refactor, test: revert → `Metadata.properties` no longer lists the prop).
5. **PR-5 (overrides out)**: per V2 §4 steps 1-3 → decorator-validation first, `Metadata.extend(layer, exts)` + `Metadata.seal()`; delete decorator-validation's hand-maintained `sideEffects` array; private reach-ins replaced by `@internal` — all done behind the public API.
6. **PR-6 (module split)**: re-home model/validation using §3.4 build order (split decorator-validation after PR-5).

### 13.5 Categorization
D1/D2/D3/D4/D7 and PR-4 are (a) quick wins but **must merge before any flavour-heavy downstream release**; FSM/index/overrides work is (c) important-not-immediate, sequenced with the identity token (§14) which unblocks it.

---

## 14. decorator-validation — model identity + minification **(board pain point #3 — dedicated section)**

### 14.1 Re-verified state
V2 §3.6 stands: eight `.name`/`toString`-derivative identity channels persisted (registry names, builder path, serialization ANCHOR, entity Symbol identity, toString etc.), all breaking under minification. The plan below is the same family as V2 §3.6's redesign, with the addition required this run: a concrete **deploy/build/pipeline** plan.

### 14.2 The minification-safe contract
- **Identity token**: `@model({ id })` explicit or `hash(PACKAGE, structure, base)` derived at decoration time; persisted identity is the string id via `ModelKeys.ANCHOR`; in-memory identity is `Symbol.for("decaf:model:" + id)`.
- **Registry**: keys switch to token ids; legacy name re-registration accepted with deprecation notice; collisions on reuse throw with both origins listed.

### 14.3 Build-order PRs
1. **PR-identity-core**: token minting in `modelBaseDecorator` + `ModelRegistryManager` key migration + legacy `name` compat registry — files: `decorator-validation/src/model/decorators.ts`, `src/model/ModelRegistry.ts`; PR-scope stays within the module.
2. **PR-identity-serialize**: `JSONSerializer.preSerialize` writes `token.id` into ANCHOR (`decorator-validation/src/utils/serializers.ts`) plus legacy id map fallback for one upgrade cycle.
3. **PR-identity-resolution-sites**: canonical greedy lookup order — points that matter: `ModelRegistry.build`, `model/validation.ts:417-434`, list-type resolution `t.name`, `validateChildValue` instanceof-handle path — all via `Metadata.constr(ctor)` WeakMap handles; PR deletes string-laundered lookups.
4. **PR-Metadata-symbol**: `Metadata.Symbol` input switches from `ctor.toString() + " - " + name` to the id (closes the dual-package Symbol split-brain D12 too).
5. **PR-adopters**: re-wrap upstreams (core model decorators, ui-decorators, `@table`, for-fabric/for-couchdb model decorators). No signature change; the decorator id path rides through `modelBaseDecorator` as of PR-1.

### 14.4 CI minify gate (new this run, the concrete pipeline)
- New family-level CI job `minify-gate`: build `demo` + `web-page` + a minimal `for-react` app through **terser/esbuild defaults** (`keep_fnames: false`, `keep_classnames: false`) with **identity-decorator path** forced on; run a headless page flow that: `Model.get`, `ModelRegistry.build`, `serialize/deserialize roundtrip`, `compare`, `validate`, and a couchdb-like FAKE adapter save/fetch.
- Gate definition file: `ci/minify-gate/config.yml` (draft included locally in the plan; owner applies at merge).
- Migration/fallback: on any gate failure, PR owners must adopt `id` tokens explicitly before merge — the ID is the fix, `keep_classnames` is dead.

### 14.5 Categorization
All of 14.3–14.4 is **(b) critical** before any minified/bundled production deployment of a decaf app; PTP/PLA bundler minors must coordinate this before their first minified pharma build.

---

## 15. core `Context` / `logCtx` **(board pain point #4 — dedicated section)**

### 15.1 Confirmed spec-in-repo that was never addressed
The board's hunch is **verified**: `workdocs/ai/project/specifications/DECAF_18.md` exists, `Status: Planned`, with four never-delivered tasks (TASK-136 → TASK-139). It already specifies exactly the split the board wants (`toOverrides()`/`toConfig()` separable outputs, per §4 of the spec). V2 §5.2 measured DECAF-18 at ~0% implemented; re-run confirmation: `Context.toOverrides()` still a blanket cache dump (`core/src/persistence/Context.ts:139`), no `toConfig()` anywhere (grep hit-set unchanged), `Service.for() ≡ Service.override()` (`core/src/services/services.ts:210` still yours-to-derive equivalence), and `logCtx(args, ...)` still duck-types via `isContextLike` with no config-projection check.

### 15.2 Why "one context, two maps" is the design to build (not capability filters alone)
The conflated pieces actually used in families are: adapter **configuration** (connection, auth, timeouts) vs adapter **overrides** (per-operation/session decorations). The DECAF-18 dual-map `configFor`/`overrideFor` end-state is correct. V2 §5.3 Options A-C are kept as alternatives, and the board's direction ("separate override/config maps so `.for` and `.override` are distinct mechanisms") demands **Option D delivery via Option C mechanics**:

### 15.3 Implementation plan (Option C→D staged; concrete files)

**PR-cc-1 (non-breaking core)** — `core/src/persistence/Context.ts`:
```ts
interface ContextChannel {
  override(conf): Context;   // overrides map only; rejects config keys
  for(conf): Context;        // config map only; re-implemented to stop being a Proxy alias
  toOverrides(): OverridesMap;  // override-sourced keys only (existing contract)
  toConfig(): ConfigMap;        // NEW per DECAF-18
}
```
Mechanism: the Context internally keeps **two** maps (`_config`, `_overrides`) with an on-write label of key-provenance. The gone-Proxy `for` becomes a real mechanism.
Compatibility shim: any key currently dumped by `toOverrides()` that is *actually* adapter config is reclassified by a declared **`CONFIG_KEYS`** list per adapter (`DefaultAdapterFlags`, `connection timeout/modes/ locks/flags`); the lists seed from the existing `Default*Flags` constants; unknown keys default to overrides.

**Files touched:**
- `core/src/persistence/Context.ts` — dual maps + provenance classification + `toConfig()`.
- `core/src/services/services.ts:45-67` — split `Service.for()` from `Service.override()`semantics (they are byte-identical today).
- `core/src/persistence/Adapter.ts:508-564, :617` — `flags()` becomes config-sourced defaults ∪ per-op overrides-only.
- `core/src/utils/ContextualLoggedClass.ts:14-26 (isContextLike), :208-249 (logCtx), :296-307 (`.flags()` commented out)` — implement config-projection duck-check, and re-enable the `.flags()` path after it can no longer be bypassed (ctxt-flags contract) — this is a bug fix, not a refactor.
- `db-decorators/src/repository/Context.ts` — dual-map plumbing, stop smuggling config in the arg tail.
- `for-fabric/src/.../FabricClientContext.ts:19-28` — the hand-whitelist of two keys unsubscribes; instead inherit from the general machinery.
- `for-nest/src/controllers.ts:56-66`, `for-http/src/server/controllers/controllers.ts:169`, `ModelControllerBuilder.ts:904` — call sites switch to `.override(ctx.toOverrides())` and `.for(ctx.toConfig())` respectively.

**PR-cc-2 (breaking, behind flag)** — `Context` gains `logCtx(args, operation, async-aware)`: the `MaybeContextualArg` ambiguity (last-arg smuggling, `args.push(c)` `db-decorators/src/repository/Context.ts:236`) is deprecated: a named `Pipeline<F>` argument owning the two maps; LOTS of call sites migrate via codemod; `args.push(c)` removed in the *next* major, with the codemod ship in the minor preceding it.

**Test plan:**
1. Conformance: for-nest `controllers.ts` must produce identical overrides to today's path; regression suite on patch `toOverrides()` consumers.
2. Leak path: fabric whitelist case asserted gone via test asserting override map has no `timeout/auth` config.
3. `.flags()` path: test building a Context child through `AccContextual` and asserting `flags()` runs (no bypass).
4. DECAF-18 spec moved to `In Progress` at PR-cc-1 merge; `Status: Planned` cells updated with the task list achieving `Implemented`.

### 15.4 Categorization
- PR-cc-1: (b) — critical, foundation for every upper layer; **this is what makes `.for` mean config and `.override` mean overrides everywhere without moving characters by hand per consumer**.
- PR-cc-2: (c) — major-bump semantics, post-cc-1.

---

## 16. Remaining modules — new-depth findings kept short (they depend on the four pain points, not on new census work)

- **for-nest** (6,734 / 93): still current and ahead of DECAF-18; the bespoke request-context seed stays; V4 refines the fix: centralize seed into a shared `core` helper callable from contextualize, eliminating divergences where for-nest re-merges `DefaultAdapterFlags` by hand (§8 V2). Category: (c).
- **for-angular** (49,289 / 41 tests, **0.08 test/LoC ratio**, biggest gap): DecafLocaleService plan (V2 §8.3) remains the priority; mask SSR crash + bundling-specific v2 items asserted by re-run. Category: (a) SSR guard, (b/c) service.
- **for-react** (1,945 / 7): mirror-level loader feature parity with for-angular's post-fix model; **(c)**.
- **with-ai** (14,197 / 234): unchanged 8/10; V4 added info: the module proves a release-train maturity n/a hypothesis: it is the only module family member with almost no named defect impact on production. Categorization of its remaining improvements stays V2 §14 scaled.
- **web-page** (3,928/90): re-verified: module pages consume `workdocs/*/jsdocs.json` in `web-page/src/assets/data/modules.json`; the pipeline from §11 (demo) should be consumed by web-page too to prevent-both-drowning in the same stale hardcoded numbers. **(a)** (it already has the consumer; only the generation pipeline is missing — reuse demo §11 step 6).
- **integrations** (36,400 / 108): dependency-scheme fix plan stands unchanged from V2 §12, with the added name the CI guard lives at: a `tools/dep-audit` family script from §1.2 (reuse `tooling` from §10.6). **(c)** — the SDK-matrix default install remains the P1 consumer-facing issue.

---

## 17. Categorized change ledger (every change/group labeled)

### (a) Low effort / high reward (quick wins)
| #   | Item                                                                                                                                                  | Module                            | Anchor §      | Effort | Reward                                      |
|-----|-------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------|---------------|--------|---------------------------------------------|
| a1  | `eventHeaderResolver` missing `()` call (+2 call sites)                                                                                               | for-http                          | §10.1         | XS     | fixes silent auth-header drop on SSE        |
| a2  | 401 → AuthError reclassification                                                                                                                      | for-couchdb/nano                  | §10.2         | XS     | correct error taxonomy for all write paths  |
| a3  | D1 flavor-dereference crash guard                                                                                                                     | decoration                        | §13.3         | S      | removes cold-start TypeErrors               |
| a4  | D2 extras bleed fix (per-flavour buckets)                                                                                                             | decoration                        | §13.3         | S      | correctness of overrides detection          |
| a5  | D3 compare/validate inherited-attr parity                                                                                                             | decoration + decorator-validation | §13.3         | S      | equality==validity                          |
| a6  | D4 splitter collision fix                                                                                                                             | decoration                        | §13.3         | S      | prevents key collapse                       |
| a7  | D7 revert symmetry                                                                                                                                    | decoration                        | §13.4 PR-4    | S      | store/store-index coherence                 |
| a8  | `@version(persistent)` conflict guard                                                                                                                 | for-typeorm                       | §10.4.2       | S      | removes semantic conflict (both mechanisms) |
| a9  | stamp modules on `for-angular` SSR crash guard `getLocaleLanguage`                                                                                    | for-angular                       | §11.2 / V2 §8 | XS     | SSR non-crash                               |
| a10 | utils logging/db-decorators dead deps removal + `tools/dep-audit`                                                                                     | utils + family                    | §1.2/§10.6    | S      | stop-the-bleed on default install           |
| a11 | delete dead code (driver suites target comment-only `createTable`; `decorator-validation/src/decorators.ts` 310-line comment block; `initCliCommand`) | modules as listed                 | §10.4, §12.1  | S      | code hygiene                                |
| a12 | document primitives move (graph document files, framework-agnostic)                                                                                   | ui-decorators/for-angular         | §11.2         | S      | layout consistency after DECAF-50           |

### (b) Critical
| #  | Item                                                                                     | Anchor        |
|----|------------------------------------------------------------------------------------------|---------------|
| b1 | Minification-safe identity (§14 full PR set + CI minify gate)                            | §14           |
| b2 | Webhooks claim-loop/dead-letter + atomicity + secret strip + SSRF/IDOR suite             | §10.1 / V2 §7 |
| b3 | DECAF-18 delivery: context dual-map (PR-cc-1)                                            | §15           |
| b4 | crypto JwtService test bring-up (PR-1)                                                   | §9.2          |
| b5 | for-angular locale service existence + loader reliability                                | §11.2 / V2 §8 |
| b6 | for-typeorm fixture matrix + events realness                                             | §10.4         |
| b7 | SSE unauthenticated-broadcast default → opt-in + authenticated identity binding          | §10.1 / V2 §6 |
| b8 | CLI CommonArgs single source (a) but mandatory before any next module-family CLI surface | §12.2.1       |

### (c) Important but not immediate
| #   | Item                                                                                     | Anchor            |
|-----|------------------------------------------------------------------------------------------|-------------------|
| c1  | decoration FSM/index/overrides refactor (PR-2, PR-3, PR-5, PR-6)                         | §13.4             |
| c2  | query-operation handlers per adapter                                                     | §6.2              |
| c3  | registry-as-Metadata-shard (post identity)                                               | V2 §4.6           |
| c4  | logging PR-B (AsyncLocalStorage correlation)                                             | §2.2.2            |
| c5  | integrations peerDependencies/lazy-import scheme                                         | §16 / V2 §12      |
| c6  | demo/dukts reset (spec, P0 rot, split, backend consumer, generation pipeline)            | V2 §11            |
| c7  | masta.si graph contract + for-angular `./graph` secondary entry                          | V2 §10            |
| c8  | deploy-scheme decision on context Pipeline<F> named-arg major (PR-cc-2)                  | §15.3             |
| c9  | transactional-decorators leak registry                                                   | §7.2              |
| c10 | test-debt burns: ui-decorators/for-angular coverage; crypto matrix; typeorm un-skip list | §9, §10.4, §11    |
| c11 | CLI help generation + 23-literal retirement + migrations                                 | §12.2.4-6         |
| c12 | Parity: for-nest seed centralization; with-ai integrations-MCP preset                    | §8.3, §16, V2 §14 |

---

## 18. Ranked next steps (beyond already-already planned modules)

Ranked by value = risk reduction × adoption leverage × realism, with the four board pain points overlaid:

1. **P0 — Minification-safe identity** (§14) — *board pain point #3*. The categorical production blocker: any minified build breaks persistence identity today; PTP/PLA build pipelines cannot ship a decaf framework app otherwise.
2. **P0 — DECAF-18 Structural split, Option C→D stage 1 (PR-cc-1) (PR-cc-1)** (§15) — *board pain point #4*. Unblocks every `.for/.override` correctness in upper layers; for-nest/fabric bridging code deletes itself afterward.
3. **P0 — Webhook + SSE remediation suite** (§10.1; V2 §6/§7) — the exploit-class findings (SSRF, IDOR, unauthenticated broadcast, broken dead-letter) remain the sharpest security debt affecting any events/webhooks consumer.
4. **P0 — Webhook claim loop + secret strip** (V2 §7.6 1-4) — merged with #3 in effort, but kept its own row because it unchanges regressions needed for enterprise pharma.
5. **P1 — decoration quick-win ledger D1-D4/D7** (§13.3) — *board pain point #1 stage 1*; standalone correctness fixes before the deep refactor.
6. **P1 — CLI CommonArgs + help generation build (step 1/4 of §12.2)** — *board pain point #2 stage 1*; degenerates the 23-literal fleet-wide option drift; makes help honest.
7. **P1 — crypto JwtService PR-1** (§9.2) — auth-surface crypto with zero tests.
8. **P1 — for-couchdb/nano write-path taxonomy fix order** (§10.2) — small, correct, unblocks adapter adoption velocity.
9. **P1 — for-angular DecafLocaleService + SSR guards** (§11.2; V2 §8) — prerequisite for any multilingual pharma deployment (PTP/PLA: Portuguese-market reach).
10. **P2 — decoration FSM/overrides structural refactor** (§13.4 PR-2/3/5/6) — *board pain point #1 stage 2*.
11. **P2 — CLI module-by-module migration + auxiliary deletions** (§12.2.5) — *board pain point #2 stage 2*.
12. **P2 — query-operation handlers build** (§6.2) — largest contract change; stage behind `blockOperationIf`-style handshake.
13. **P2 — integrations dependency scheme** (§16; V2 §12).
14. **P2 — typeorm ColumnOptions + fixture matrix** (§10.4), **for-fabric couchdb-dep decoupling** (§10.5).
15. **P2 — demo/dukts reset, masta.si graph contract, test-debt burns, parity items (c10, c12)**.

**Proposed additional applications for the framework (not already mocked):** a decaf-native **agentic workflow runtime** on the graph execution engine (for-angular graph + integrations engine already have the primitives; with-ai is the reference consumer); a **decaf-native authorization/permissions layer** above the flavour model + namespaces integration (the missing enterprise capability most adopters hand-roll); a **decaf-native audit-trail persistence layer** for the pharma/regulated deployments (the PTP/PLA gap directly); and the **decaf plugin registry surface** (paperclip plugins + pixel-agents plugins) as shipping first-party framework consumers — see §19 awareness channels.

---

## 19. Adversarial framework rating (harsh) — updated from V2 §17

**Overall: 6.5/10 as a pre-production enterprise framework.** The framework's ambition and moat are unchanged; what pulls the score below V2's 6.8 is that every listed critical capability has *still not moved*: DECAF-18 remains 0% implemented, minification hazard is unfixed, and the events/webhooks exploit class has no remediation landed. The quick-win fixes within (a) in §17 remain undeployed.

| Dimension | Score | Harsh assessment (added information only; V2 anchors stand) |
|---|---|---|
| Architecture & concept | 9/10 | unchanged — the flavour/decorator/Context model remains a genuine differentiator, now *proven* by a for-fabric + for-couchdb + for-nest + integrations + with-ai umbrella all consuming it |
| Correctness | 5.5/10 | the exploit-class seams (webhooks events, SSE auth defaults, delete false-success, 401-as-conflict) remain live; plus newly-quantified: **the sdk-level coupling defects (for-fabric→for-couchdb dep) fan out licensing/build blast radius, not just CLI DX** |
| Reliability/observability | 5/10 | unchanged, worst-in-class for an ambitious framework: console-first, no correlation, silent pipeline swallowing |
| Testing posture | 5/10 | the ratio worsened at the top: for-angular is at ~41 testfiles vs 49k LoC (0.08/LoC-scale); crypto remains ~9/3.6k; utilization skewed |
| Packaging/Dx | 6/10 | two concrete *newly-verified* coupling facts: (i) `for-fabric` depends on `for-couchdb` in `dependencies`; (ii) utils still declares the 2 dead heavy deps |
| Documentation | 7/10 | DECAF-18 spec exists and is exact — but sits **never addressed** since it spec was authored; the board pain point of "spec in repo" confirmed verbatim |

### Adoption estimate (per V2 §18, with the four pain-point overlays)
- **Internal paperclip context (PTP/PLA pharma on decaf): ~85%** unchanged; the pre-mandatory list is now exactly weighted: **minification (§14), DECAF-18 (§15), webhook/SSE remediation (§10.1)** are what gate go-live for anything regulated.
- **External Node/TS teams: ~45-55% within 12 months** (down from V2's 50-60, because the identified criticals have not moved despite being fully scoped); pull factors and friction factors as in V2 §18 remain true and confirmed by this re-census.
- **Enterprise web+mobile multi-client: ~35-45%** — locale + for-angular presence gates this tier; no change while unimplemented.
- **Graph/masta.si fork risk: unchanged** — signing a contract before the engine drifts further remains the corner move.

### Awareness/adoption channels (concrete, honest)
1. **PTP / PLA (astratrace) — the two enterprise pharmaceutical projects already on decaf.** These are simultaneously the biggest asset and the biggest risk: they are real production usage (which no competitor framework survey can fake) *and* they will hit minification/context-correctness walls in production before the family does. Treat them as **co-development partners gated on the P0 list in §18** — the fastest channel to stabilize is to write the contract of the fixes by landing on their environments.
2. **Paperclip plugins — eventual release as a distribution vector.** Paperclip is the only consumer of decaf's most production-invested surface (with-ai); its plugin surface is the first *third-party-addressable* consumer of this framework family. Release sequencing should ensure paperclip plugin SDK users get all four pain-point areas fixed *before* public release, because paperclip plugins are effectively decaf's public API sample.
3. **pixel-agents plugins — second awareness vector.** Same logic: the pixel-agents volume means more consumer code being written against the family, making decaf's failure modes visible. Pixel-agents shipping on decaf is worth more than any conference talk; the practical dependency is that pixel-agents must not encode workarounds (per the illusion noted in §15: whitelists/fabric-style patches) that ossify the conflated `Context`/`override` semantics.
4. **Missing channel (told honestly):** nothing in the family today looks like a *community* surface: no public release cadence visible externally, no documentation landing page for the framework's *concept* (decaf.ts exists at the web-page but its "concept page" and module map are generated only from hardcoded data as of V2 §11 — reuse the demo §11 step 6 generation pipeline in web-page per §16). An external adoption rate cannot aggregate without that consumer-first page.
5. **A caution recorded as a caveat:** the demo remains the *weakest* representation of the family. Store it and its 7-step reset plan squarely against this review's P2 list rather than allowing the visibility of the flagship demo to outrun its actual quality (fake stats, fake logos, dead tests in V2 §11 remain unfixed as of this run).

### What would raise the score to 8/10, in order
1. Land the four board pain points (§13, §14, §15, §12 stage 1).
2. Land the webhooks/SSE exploit-class remediation (§10.1).
3. Convert for-angular test ratio and crypto coverage to sane bands (§17 ledger c10).
4. One community-facing public concept page + release notes cadence (§19.4 above).

---

## 20. V2-baseline framing: explicitly carried items (board-required section)

Every section of V2 is carried forward in one of three states. Below, the itemized disposition (kept-as-expanded items are considered "real added information" because V4 places them in PR/test/build plans, which V2 did not):

| V2 § | Topic | V4 disposition |
|---|---|---|
| V2 §1 | logging pipeline defects | **expanded** → PR-A/B/C build (§2.2) |
| V2 §2 | utils deps/subpaths | **expanded** → dep-audit plan (§1.2) |
| V2 §3.1-3.3 | registry/Metadata, overrides, entanglement | **expanded** → §13.4 PR-5/PR-6, §14.3 |
| V2 §3.4 | decorator-validation split | **expanded** → build order (§13.4 PR-6) |
| V2 §3.5 | decoration 11 defects | **expanded** → defect ledger + per-defect plans (§13.2-13.3) |
| V2 §3.6 | minification redesign | **kept as-is** (correct) + CI gate + deploy plan (§14) — *board pain point #3* |
| V2 §4 | incremental migration plan | **kept** + merged into §13.4/§14.3 ordering |
| V2 §5 | db-decorators context | **kept** as spec route; PR-cc-1 concretizes (§15) — *board pain point #4* |
| V2 §5.4-5.5 | query-operation break + handler design | **kept** + build order (§6.2) |
| V2 §6-7 | for-http events/webhooks | **kept** as mandated; **no severity relaxations** (§10.1) |
| V2 §8 | for-angular locale | **kept FAIL verdict**; fix list expands to PR order (§11.2) |
| V2 §9 | for-typeorm | **kept** + ColumnOptions and fixture matrix PR order (§10.4) |
| V2 §10 | graph/ui layout; DECAF-50 | **kept resolved** + final document-primitive move (§11.2) |
| V2 §11 | demo RED | **kept RED** — nothing has moved; P2 plan stands (V2 §11 list) |
| V2 §12 | integrations deps | **kept**; CI guard named (§16) |
| V2 §13 | for-nest currency | **kept**; seed centralization added (§16) |
| V2 §14 | with-ai 8/10 | **kept** |
| V2 §15 | CLI design | **kept, board pain point #2**; build-ordered with verified current state (§12) |
| V2 §16 | for-couchdb/nano write + crypto under-testing | **kept**; expand to PR order (§10.2, §9.2) |
| V2 §17-19 | framework rating, adoption, ranked steps | **refreshed with re-census**, score moved 6.8 → 6.5 for inaction on scoped criticals (§19) |

*Nothing from V2 is struck or corrected — V3 was struck by the board; V2's findings survive this re-census fully. The items characterized as kept-with-negligible-change (V2 §10 DECAF-50 solved; with-ai; styles/ts-template) were re-verified this run rather than assumed.*

---

## 21. Appendix — files listed-as-plan (none created; this review is documentation-only)

No repository files outside this report were read beyond their on-disk content. No code was changed. The report ships uncommitted in `report/DECAF_FRAMEWORK_REVIEW_V4_DRAFT.md`.

*End of V4 draft. Baseline remains `report/DECAF_FRAMEWORK_REVIEW_V2.md`; V3 (`report/DECAF_FRAMEWORK_REVIEW_V3.md`) is non-baseline per board verdict.*
