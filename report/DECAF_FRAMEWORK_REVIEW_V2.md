# decaf-ts Framework In-Depth Review v2 (SAA-772) — Deep Defect & Design Analysis

**Author:** CTO, with-ai — orchestrator pass for [SAA-772]((/SAA/issues/SAA-772), superseding SAA-769 / v1 (`2f60007`).
**Date:** 2026-09-05
**Scope:** Pure review/evaluate/propose. No repo changes except this report. All findings below were produced by specialist evidence passes on child issues [SAA-773]((/SAA/issues/SAA-773)–[SAA-782]((/SAA/issues/SAA-782) from actual source (:file:line refs), and integrated here; v1 module verdicts were treated as draft and re-derived.

---

## 0. Method, delegation map, and verdict matrix

### 0.1 What changed from v1

This version is not a patch of v1. Each of the board's mandated deep-dive items was delegated to a named specialist who re-derived findings from source on their own evidence issue:

| Item | Subject | Evidence issue | Specialist lens |
|---|---|---|---|
| 1 | Logging observability + pino/winston/Nest interchangeability | SAA-773 | Logging/observability |
| 2 | utils (test-utils role, exclusive exports) | SAA-779 §8 (v1 base) | Framework standards |
| 3 + extras | decorator-validation registry/Metadata/overrides/entanglement/framing + **minification redesign** | SAA-779 | Framework standards |
| 4 | decoration feature/usability deep dive | SAA-779 §5 | Framework standards |
| 5 | db-decorators context system + query-operation pattern break | SAA-774 | Core data layer |
| 6a | for-http events system (SSE) | SAA-775 | Events/transport |
| 6b | for-http webhooks (reliability, signature, enterprise) | SAA-776 | Security-engineering |
| 7 | for-angular LocaleService reliability | SAA-777 | Frontend/platform |
| 8 | for-typeorm compatibility goal vs test debt, `@mirror` bleed, CLI, fake observables | SAA-778 | Persistence adapters |
| 9 | for-graph / ui stack layout | SAA-782 §A | Architecture |
| 10 | dukts demo purist-example critique | SAA-780 §A | Framework standards |
| 11 | integrations dependency scheme fix | SAA-781 §A | Packaging/Dx |
| 12 | for-nest currency vs the sibling modules | SAA-781 §B | Integration currency |
| 13 | with-ai agentic effectiveness | SAA-781 §C | Agentic framework |
| — extra | CLI common-arg injection + help autogeneration design | SAA-780 §B | CLI/Dx |
| — extra | Registry/overrides/decoration simplification plan (incremental) | SAA-779 §7 | Architecture |
| — spot | for-couchdb write-path defects + crypto under-testing proof | SAA-782 §B | Defect hunting |
| — integration | Framework rating, adoption estimate, ranked next steps | this file (§20) | CTO |

Scope rule honored throughout: analysis-only; the only file created in the repo is this report. The one true "live reproduction" performed during evidence gathering (Appendix A of SAA-779) cleaned up after itself.

### 0.2 Headline verdict matrix

| Area | v1 verdict | v2 verdict after source dive | Severity |
|---|---|---|---|
| Logging observability | "works" | **Sink not swappable, correlation absent, pipeline bypassed in 5 upper modules, silent error swallowing, child-config leak** | High |
| decorator-validation identity | "minification risk" | **Hazard confirmed across 9 named identity channels; full id-redesign defined (§4.6)** | Critical-when-minified |
| decoration | "structural spaghetti" | **Confirmed + 4 standalone surfaced defects (crash shape, extras bleed, compare/validate divergence, splitter collision)** | High |
| Regression: registry→Metadata | — | **Replaceable, mostly, but LOW value; gated by the id redesign** | Medium |
| db-decorators context | "conflated" | **DECAF-18 is ~0% implemented; three alternative designs proposed including adapter-scope config token** | High |
| Query ops | "pattern break" | **Confirmed: query ops not first-class; dead `statement/query` kinds; per-adapter serializer divergence; full handler design proposed** | High |
| for-http events | n/a (new depth) | **`eventHeaderResolver` never invoked (dead option); infinite opaque reconnect; `close()` cannot stop backoff; silent post-connect stream death; unauthenticated default SSE broadcast** | Critical/High |
| for-http webhooks | n/a (new depth) | **Failed deliveries retry forever (no true dead-letter); PROCESSING stranded by crash; non-atomic claims; SSRF via subscription URL; plaintext replicated secrets; no replay protection** | Critical |
| for-angular locale | "weak" | **No LocaleService exists at all; 7 disconnected surfaces; SSR crash in `getLocaleLanguage`; `forkJoin` all-or-nothing loading; library bundle mutated in place** | High |
| for-typeorm | "ready" | **Metadata equivalence partial (option surface under-expressed); `@mirror` bleed confirmed; unit tests exercise dead code; event system is simulated (no LISTEN consumer)** | High |
| graph/ui layout | v1 recommendation | **v1 §1.21 CONTRADICTED — DECAF-50 shipped the board-correct layout; remaining gaps enumerated** | Resolved + follow-ups |
| dukts/demo | "fine" | **RED: fake social proof, random stats, stale 4-of-25 module docs, dead test suite testing nonexistent symbols** | High (brand) |
| integrations deps | "growth" | **`optionalDependencies` misuse: SDKs install by default, statically imported anyway, 4 ghost deps** | P1 consumer-facing |
| for-nest | "ready" | **Current and ahead-of-spec on DECAF-18; bespoke request-context seed; `.for()`/`.override()` conflation in one controller path** | Low/Medium |
| with-ai | — | **8/10 — actively runs this very Paperclip instance; gaps: no integrations MCP surface, oversized compose, template Dockerfile** | Low |
| CLI | "spaghetti" | **Green design delivered: CommonArgs registry, inherit-all/invalidates, deny-with-error at registration, generated help formats, migration map** | Design-ready |

### 0.3 Corrections to v1

- **§1.21 (graph) recommendation is struck.** v1 proposed moving shared/serializable graph concerns *into* `integrations`. The shipped DECAF-50 refactor (commit `646e306` + submodule commits `b7e65cb`, `aa5323c`, `1894218`) moved shared node contracts **out of** `integrations` **into** `@decaf-ts/ui-decorators/graph` (112 imports in for-angular/src/graph, all ui-decorators) and cut `for-angular` off `integrations` entirely (zero imports; a test asserts the ban). §11 below documents what remains, not what was contraindicated.
- **§1.2 (logging) "minor" is upgraded.** Logging pipeline defects are systemic (§2).
- **§1.23 (demo) "fine" is upgraded to RED** (§12).
- **§1.17/1.18 (for-typeorm) "Ready" is downgraded** (§10).
- **§1.29 for-nest verdict refined**: it is *ahead* of DECAF-18 adoption on some surfaces, behind on others (§14).

---

## 1. Logging — reliable observability in core and upper layers (evidence: SAA-773)

### 1.1 Architecture

- Package `@decaf-ts/logging` (`logging/package.json:2`), exports `.` plus optional `./winston`/`./pino` subpaths; `pino ^10` and `winston ^3.17` are **optionalDependencies**.
- The `Logger` interface (`logging/src/types.ts:65-215`) exposes level methods (`benchmark`→`silly`), `for(...)` scoping via `Impersonatable` (49-57), `clear()`, `setConfig()`, `root: string[]`. Notably missing from the interface: generic `log(level, ...)`, `context`, `child()`, `flush()` — those exist only on concrete classes/wrappers (key interchangeability issue, §1.4).
- `MiniLogger` (`logging.ts:50-621`) grows a context array per `for()` call (`[app, ClassName, methodName, ...]`) via a **Proxy over the same underlying instance** (`for`, `logging.ts:97-220`), builds a `LogParameterPayload` in `createLog` (271-380), runs filters/theme, and **writes the rendered string directly to `console.*`** (`log`, 403-441).
- Field rendering: `LogParameterRegistry` (logParameters.ts:57-96) with a literal/`{param}`/`[optional-block]` pattern language (125-253); default pattern `{level} [{timestamp}] {app} {context} {separator} {message} {stack}` (constants.ts:190-192).
- Decorators `@log/@benchmark/@debug/...` (decorators.ts:42-215) resolve the logger via `target instanceof LoggedClass ? target["log"] : Logging.for(target)`.
- Pino/Winston adapters **subclass `MiniLogger`** and feed it the *pre-rendered string* (`pino/pino.ts:128-149`, `winston/winston.ts:84-97`); both add `child()`/`flush()`/`level` only on the concrete classes.
- `src/index.ts:19` re-exports **`styled-string-builder`** — a third-party styling library leaks through the public entrypoint.

### 1.2 Consumption and the observability gaps

Counts of raw `console.` in `**/src/*.ts` (non-test): core **53**, for-nest **42**, with-ai **47**, utils **77**, for-http **11**, integrations **12**, decoration **9**, db-decorators **2**. Real production bypasses exist in every one of these modules, e.g.:

- `for-http/src/adapter.ts:203,212` — `console.warn("Failed to sync event subscriptions: ...")` (subscription sync failures escape the pipeline).
- `for-nest/src/events-module/utils.ts:38,43,53` — raw `console.warn/debug` inside the SSE path.
- `db-decorators/src/operations/OperationsRegistry.ts:191` — `console.warn`.
- `integrations/src/nest/graph/main.ts:36-45` — server startup banner via `console.log`.
- `with-ai/src/bin/cli.ts:64,79` — raw `console.log`.

Meanwhile `logCtx` / `Context.logger` is used heavily and correctly in core services, repositories, migrations, tasks, and the for-http/for-nest request path (e.g. `core/src/services/ModelService.ts`, `core/src/repository/Repository.ts`, `for-http/src/HttpDispatcher.ts`, `for-nest/src/webhooks/controllers.ts`).

**What is missing today:**

1. **Default sink is hard-wired to `console.*`** (logging.ts:411-440). The `transports` config field (types.ts:275) is **ignored** by `MiniLogger` and consumed only by the pino/winston adapters. The default pipeline is not sink-swappable at runtime; the only swap point is the static factory `Logging.setFactory`.
2. **Silent error swallowing inside the pipeline**: `applyFilters` catches everything and returns the message unchanged (logging.ts:253-260); `Logging.theme` catches and returns original text (1050-1053); `formatMeta` catches (382-389); `PatternFilter.filter` returns `""` on failure (filters/PatternFilter.ts:75-78). Filter/theme/format failures are invisible.
3. **No true per-request/operation correlation.** `correlationId` is a static config value pinned once per logger via `setConfig` (e.g. `core/src/services/services.ts:160`); it is not propagated through async context. In the request path only `{ ip }` is attached (`for-nest/src/request/contextualize.ts:28`); there is no default `requestId`/`operationId` field, and the operation (`"${req.method} ${req.url}"`) is stored as a Context flag, not emitted as a structured log field.
4. **Global mutable config**: `Logging._config` *is* the `LoggedEnvironment` singleton (logging.ts:708) and `Logging.setConfig` mutates it in place (729-733) — no scoping, tenant isolation, or reset.
5. **Child `setConfig` leaks across siblings.** `for()` returns a Proxy over the **same** target (logging.ts:135) with no `set` trap, so `setConfig` on one child mutates the base instance `conf` shared by all siblings.
6. **Inconsistent pipeline use** — the bypass list above means errors/warnings escape filters, theme, level control, and any sink swap.

### 1.3 Concrete improvement plan (proposed)

1. **Introduce an emitter/transport interface on `MiniLogger`** and honor `config.transports` in the base class so the default path is sink-swappable without a factory swap. `Logging.setFactory` remains the deep-replacement path.
2. **Route every bypassing `console.*` site through `Logging`/`logCtx`** (the five module sites listed in §1.2 are the minimum).
3. **Make pipeline failures observable**: emit a best-effort `error` on a dedicated filter/logger channel instead of silent swallow; add a debug mode that surfaces filter/theme exception context.
4. **Async-context correlation**: bind `correlationId`/`requestId`/`operationId` through `AsyncLocalStorage` (or equivalent), default the for-nest/for-http request path (`contextualize.ts`) to attach both, and emit them as first-class structured fields in string *and* JSON modes.
5. **Stop mutating `LoggedEnvironment` in place from `setConfig`**; keep an explicit config object so scoped/tenant reconfiguration and reset are possible.
6. **Fix the child `setConfig` leak** with a `set` trap on the `for()` proxy (or copy-on-write per child).

### 1.4 Interchangeability verdict: NOT a drop-in; and why

**pino/winston:** the extensions boundary is `Logger` + `Logging` facade + `setFactory` + subclassing `MiniLogger` (the working proof is `with-ai/src/mcp/StderrLogger extends MiniLogger` + `Logging.setFactory(stderrLoggerFactory)`, `StderrLogging.ts:17-76`). But the adapters warp the libraries rather than thin-wrap them:

- A replacement **boundary** requires reproducing `MiniLogger`'s proxy scoping, `ROOT_CONTEXT_SYMBOL`, `getConfigSnapshot`, and the protected `config(key)` — none of which are on the `Logger` interface but are read at runtime (`for-nest/tests/e2e/request-logger-propagation.e2e.test.ts:27,42`; `core/src/utils/ContextualLoggedClass.ts:130-139`).
- `createLog` depends on `LogParameterRegistry` + `Theme` + `styled-string-builder` (which is part of the public surface, index.ts:19), so a replacement must reproduce the rendering engine to keep output stable.
- Pino receives a **flat pre-rendered `name` string** (pino/pino.ts:63); correlation is baked into the string, so pino's structured JSON fields, `redact`, child-bindings, and standard pretty tooling do not see structure. decaf's custom levels (`benchmark`/`critical`/`silly`) force `customLevels + useOnlyCustomLevels: true` (pino.ts:19-30, 52-55), disabling pino's conventional levels and tooling expectations.
- **Conclusion: today pino/winston function as string transports (1/5 interchangeability). A structured sink path (§1.3 item 1) reverses this: once the base emit is structured, a true pino-backed adapter becomes a 50-line class and winston similar.**

**NestJS `LoggerService`:** feasible as a mapping/adapter layer, not a mechanical swap. Nest's per-call convention `(message, context?: string)` does not carry Decaf's context-actor string[] semantics; there are parameter-overload collisions on `verbose(message, context?)` vs `verbose(msg, verbosity?: number|LogMeta, meta?)` (types.ts:133-137) — with Nest's context string landing in a meta slot — and on `error(message, stack?, context?)` vs `error(msg, e?, meta?)` (types.ts:154), where the stack string is not an `Error`. A working adapter must (a) cache logger children by context string, (b) remap the `verbose`/`error` overloads deliberately, and (c) bridge request-scoped correlation by reusing the request `Context` that `DecafRequestHandlerInterceptor` accumulates (`for-nest/src/factory/exceptions/DecafErrorFilter.ts:143-160` already recovers request-scoped loggers via `ContextIdFactory`/`ModuleRef`). Verdict: **feasible with an explicit mapping layer (3/5 drop-in)**.

---

## 2. utils (1.1) — test-utils role and the exclusive-exports policy

- The root/`./tests` dedicated-export split **exists and is honored in code**: `utils/package.json` exports `.` and `./tests` separately; consumers import test-reporting fixtures (`Consumer.ts`, `TestReporter.ts`, jest teardowns) only when they must — observed usages: mcp-server (5 files), with-ai (2), logging (1). The design intent the board described ("exclusive dedicated exports so modules import only when they must") is thus real at the import level, and the placement itself is defensible.
- **But the policy is inverted at the dependency-declaration level:** `@decaf-ts/utils` runtime `dependencies` include `@decaf-ts/logging` **and `@decaf-ts/db-decorators`** (utils/package.json `dependencies`), while **no file under `utils/src` imports either** (grep-verified). Every consumer of `@decaf-ts/utils` transitively installs the db-decorators → decorator-validation → decoration → reflect-metadata chain to use pure CLI/text helpers. Fix: move both to peer/dev (or to the surfaces that actually emit builds referencing them) and add a dep-audit CI check (`optionalDependencies`/`dependencies` with no src `import` fails).
- The package has also grown past its name (CLI release automation, download, text/rendering, error taxonomy); acceptable, but subpath discipline (like `./tests`) should extend (`./cli`, `./testing`) before more consumers arrive.
- Decoration fan-out reminder for context: decoration is imported by every family package (137 files in for-fabric alone; core 117; ui-decorators 66) — expected for a substrate; utils' dependency list is the anomaly, not decoration's fan-out.

---

## 3. decorator-validation (1.4) — registry, overrides, entanglement, framing, minification (evidence: SAA-779)

### 3.1 Can the registry be replaced wholesale by `Metadata`?

Touchpoint analysis (registry → Metadata equivalent):

| Registry touchpoint | file:line | Metadata equivalent | Verdict |
|---|---|---|---|
| `ModelRegistryManager.cache: Record<string, ModelConstructor>` | ModelRegistry.ts:76 | `Metadata.set(Symbol.for('model-registry'), name, ctor)` shard — the pattern is proven (`Validation.registerDecorator` already abuses exactly such a shard at Validation.ts:98-102; flavour buckets live in Metadata at flavourRegistry.ts:22-38) | mechanical |
| `register(ctor, name = ctor.name)` | ModelRegistry.ts:96-103 | same shard, **but the name source must be fixed first (§3.6)** | mechanical, gated by id redesign |
| `get(name)` | ModelRegistry.ts:109-116 | `Metadata.get('model-registry', name)` via splitter | mechanical |
| `build()` rehydration via `Metadata.modelName(obj.constructor)` | ModelRegistry.ts:124-133 | ctor→name reverse map **does not exist** in Metadata | gap |
| `Model.get/register/build/setRegistry` façade | Model.ts:303-367 | thin functions over the shard | mechanical |
| Decorator-time registration | model/decorators.ts:56 | same shard write | mechanical |
| Validator dispatch registry | Validation.ts:16-70, ValidatorRegistry.ts:15-83 | **split verdict** — Metadata's `get` deep-merges + returns clones (Metadata.ts:440-474), wrong identity semantics for dispatch tables; `ValidatorRegistry` "first wins" + instance caching has no Metadata analogue | cannot go wholesale |

**What Metadata lacks precisely:**
1. A **reverse identity map** (ctor → registry name); `Metadata.modelName` (monkey-patched, overrides/overrides.ts:79-84) just returns `ctor.name`, sidestepping Metadata entirely.
2. **Dual-package coherence.** `Symbol.for` shards are process-global but `_metadata` is a per-module-instance private static (Metadata.ts:141): one ESM + one CJS copy of `decoration` yields two stores sharing the same `Symbol.for` keys but writing into different objects — split-brain is silent. (The current `ModelRegistryManager` has the identical trap; migrating alone loses nothing but fixes nothing.)
3. **Serializable identity**: Metadata is runtime-only; persisted payloads need a string id regardless (this is exactly the §3.6 anchor requirement).
4. **Replace/dispatch policy**: Metadata has only the `_allowReRegistration` boolean escape hatch (Metadata.ts:136, 189-191), not first-wins/replace/throw semantics.

**Verdict: REPLACEABLE — mostly, LOW standalone value.** ~80% collapses into two Metadata shards; the wins are one less bespoke registry and deleting `utils/registry.ts` (73 lines of pure interface). The parts that cannot: the reverse map, replaceability semantics, dual-package coherence. **The gating dependency is the id redesign (§3.6), not storage — do the id work first; registry-as-Metadata-shard is a cheap by-product.**

### 3.2 The overrides mechanism — per-module behavior injection, side-effect risk, fragility

Channel inventory (this is *the* highest-frequency hazard in the family):

1. **Monkey-patching another package's exported class.** decorator-validation patches **8 methods** onto decoration's `Metadata` at module scope with `.bind(Metadata)`: `validationFor` (overrides/overrides.ts:13), `modelName` (:79), `validatableProperties` (:86), `allowedTypes` (:97), `getPropDesignTypes` (:115), `isModel` (:151), `isPropertyModel` (:170), `getAttributes` (:186) — with an ambient `declare module "@decaf-ts/decoration"` typing file and a `@ts-expect-error override magic` on `Metadata.get` (overrides/Metadata.ts:102-106).
2. **The pattern is family-wide**: `core/src/overrides/overrides.ts` (tasks, taskFor, validationExceptions, migrationsFor, relations, createdBy, updatedBy...), `db-decorators/src/overrides/overrides.ts:154+` (pk, save/read operations, isTransient), `transactional-decorators/src/overrides/overrides.ts`, `injectable-decorators/src/overrides.ts`, `ui-decorators/src/graph/overrides/overrides.ts`. Six modules mutate decoration's exported class.
3. **Import-registered resolvers**: decoration wires singleton flavour/pending resolvers into module-level mutable slots (decoration/src/decoration/metadataLink.ts:7-8, Decoration.ts:365-370); `Decoration.setResolver` is last-registration-wins global state (Decoration.ts:1064-1066).
4. **Private-API reach-in.** `Metadata["innerGet"]` and `(Metadata as any)["_metadata"]` are consumed from ~13 call sites across 6 modules (Decoration.ts:34,56,59,982,...; core overrides.ts + MigrationService.ts:853; decorator-validation Validation.ts:93,107; for-http DeliveryService.ts:565; for-nest overrides.ts:10,16) with no declared contract.

**Concrete side-effect risks:**
- **Import = mutation.** `decorator-validation/src/index.ts:12` `export * from "./overrides"` means any deeper import executes the patches. Today nothing collides only because no two modules patch the same method name — nothing enforces that; a future `getAttributes` re-declaration silently replaces behavior at import time.
- **Import-order crash (live-reproduced during evidence gathering).** Decorating a property before any flavour exists: `Decoration.flavourResolver(target)` (Decoration.ts:831→31) dereferences the un-resolvable owner → `TypeError: Cannot read properties of undefined (reading 'toString')` at `Metadata.ts:167`. The member-path sibling guards with `target?.constructor || target` (Decoration.ts:980); the factory path does not. Cold-start/import-order conditions convert "not registered yet" into an opaque TypeError.
- **`Metadata.registerLibrary` throws on duplicate registration** (Metadata.ts:612-620) while every package runs it at import with literal placeholders (decoration Metadata.ts:643, decorator-validation index.ts:52) — in a dual ESM/CJS load it slips through into split-brain state.
- **Tree-shaking is declared dead by hand**: decorator-validation maintains an explicit `sideEffects` array (package.json:102+) precisely to keep the patches from being shaken out, while decoration declares `"sideEffects": false` — understating Decoration's static-block resolver registration. The packages optimize *against their own architecture*.

**Containment (registration-first):** a sanctioned `Metadata.extend(layer, extensions)` API asserting registered layer ids (reusing the unused `registerLibrary` id/version store), throwing on collision unless a `migrationHandler` is provided; `Metadata.seal()` after bootstrap so post-bootstrap patching throws; resolver replacement scoped/warned; private reach-ins replaced by `@internal`-marked exports or minimal shard operations (`peekShard`/`setShard`). All patching modules migrate mechanically to pure `extend` calls. (Folded into the ordered plan in §5.)

### 3.3 Model ↔ registry entanglement (circular-dependency fallout)

- **Layer inversion**: `ModelRegistry.fromModel` imports *values* (`jsTypes`, `ValidationKeys`) from the validation layer (ModelRegistry.ts:6-7) while validation imports `ModelConstructor` types from the model layer (validation/decorators.ts:27). `dpdm` reports no cycle because the cycle elides through type-only imports; the **runtime** order holds only through `index.ts` evaluation order — importing `model/Model.ts` directly, or an ESM/CJS interop difference, flips evaluation and `index`'s module-scope `registerLibrary` runs after `./overrides` patching.
- **Constructor replacement + prototype surgery is the actual circular mechanism**: `modelBaseDecorator` replaces the class with a synthetic constructor (copies prototype, `Object.setPrototypeOf(newConstructor, original)` — model/decorators.ts:41-52, hard-defines `.name` – a minification channel too) and registers it under the **original's** name (:56). `construct()` discards `new.target` (model/construction.ts:13-20) so `Model`'s decorator body carries a documented prototype-repair workaround (model/decorators.ts:16-29), and `bindModelPrototype` has a throw-terminal "Could not find proper prototype to bind" state (construction.ts:85). None of these carry a regression test on prototype-chain branching in src.
- **Three coincident key strategies for one datum**: flavours are written under the `Symbol.for("flavour")` string shard (flavourRegistry.ts:32-38) but read via `Metadata["innerGet"](Metadata.Symbol(owner), ...)` (Decoration.ts:982-985) and `Metadata.get(owner, ...)` (Decoration.ts:561, 620). `Metadata.get`'s fallback `Symbol.for(resolvedModel.toString())` (Metadata.ts:377-379) vs the primary `Symbol.for(ctor.toString() + " - " + name)` (166-168) is a further mismatch that can route mis-decorated mixins into an empty fallback shard.

**Verdict: no require-cycle deadlock exists (TSC/dpdm clean), but the fragility is behavioural and concentrated in `modelBaseDecorator` (:14-58) and `Metadata.constr/__original` (Metadata.ts:329-336, 556-565).** The unification of the three key strategies (§5 step 4) must precede any registry re-homing.

### 3.4 The "validation" framing critique

LoC inventory of the module: **model identity/registry, serialization, hashing, equality, date parsing/building, expression/builder DSL, path proxies ≈ 3,800 of ~6,600 src lines are NOT validation** (`Model.ts` 507, `ModelRegistry.ts` 359, `Builder.ts` 695, `construction.ts` 86, `utils/hashing|serialization|serializers|equality|PathProxy` ~540, model decorators). Validation proper (`validation/**` + `model/validation.ts` + `utils/dates`/`DateBuilder`) ≈ 2,800 lines.

Consequences are load-bearing: every downstream consumer that needs only a Model transitively imports the validation engine (decorators, `ValidationKeys`), and vice versa; and `validationExceptions` (a *model* concern) lives under core's overrides (core/src/overrides/overrides.ts:30-43).

**Concrete cut (do it last — §5 step 8):**
1. `@decaf-ts/model`: `model/**`, `utils/{constants, hashing, serialization, serializers, equality, PathProxy}`.
2. `@decaf-ts/validation`: `validation/**` + `model/validation.ts` + `utils/{dates, DateBuilder}`.
3. `@decaf-ts/decoration` stays the substrate.
Back-compat: one major of facade re-exports from a renamed wrapper package. Zero-risk first move even before republishing: add subpath exports `"./model"` and `"./validation"` to decorator-validation's package.json exports map (currently root-only).

### 3.5 decoration deep dive (1.5) — surfaced defects beyond v1 §3.1

1. **Unregistered-key crash + unguarded default-flavour dereference.** `decoratorFactory` (Decoration.ts:832-839) dereferences `cache[flavour]`/`cache[Decoration.defaultFlavour].extras` *before* the `cache &&` check at :839. A flavour-only registration (Decoration.register creates exactly one bucket, :1055-1061) makes a default-flavour target hit extras on `undefined` → `TypeError`. Same defect class as the repro'd cold-start crash (§3.2).
2. **Extras bleed across flavours silently** (Decoration.ts:836): a resolved flavour with no extras bucket reuses the default flavour's extras; `shouldOverrideEntry` (:1068-1090) then compares *bucket identity* (Set reference equality), so override detection depends on how registration constructed the Sets, not their content.
3. **Non-deterministic pending keys + swallowed failures.** Pending key includes `Date.now()` + `Math.random()` (Decoration.ts:540-542) — untestable, no dedupe; `applyPendingEntry` catch-all just `console.error`s (475-482), and eager-resolution paths swallow with `catch { /* ignore */ }` (:597-599) — a throwing decorator application leaves the model decorated-but-incomplete with no error at the decoration expression.
4. **Microtask-scheduled resolution races synchronous reads.** `scheduleDefaultResolve` defers application (515-526); synchronous `Metadata.get` acts as a cross-package back-channel rescue (Metadata.ts:371-376 consults `isDecorated === PENDING`). Observable symptom: **two consumers of the same class can observe different metadata depending on microtask timing.** v1's FSM plan absorbs this, but it should be stated as a correctness symptom, not only architecture.
5. **O(bucket²) pending processing**: every pending entry snapshots the entire metadata bucket and diffs it (Decoration.ts:414-422, 468-474); `resolvePendingDecorators` re-invokes per pass (643-680); buckets never pruned from `state.pending`.
6. **Revert asymmetry**: `revertMetadataDiff` deliberately skips `properties` (Decoration.ts:1126) and `_propertiesIndex` is not reverted either — `Metadata.properties()` can list a property whose metadata was reverted (index/store divergence).
7. **Compare/validate inheritance mismatch (correctness defect).** `Model.compare` uses `Metadata.properties(this.constructor)` (Model.ts:92) — leaf-only index, silently excludes inherited properties — while `validate` uses chain-aware `validatableProperties` (overrides.ts:86-95) and `fromModel` uses chain-aware `getAttributes` (overrides.ts:186-213). **Equality and validity disagree about inherited attributes.**
8. **Splitter dot-collision.** `Metadata.splitter = "."` (Metadata.ts:152) + `setValueBySplitter` building intermediate objects from split keys (86-111): properties named `constructor`/`properties`/etc. can be clobbered or unreadable; only ad-hoc handling exists (Metadata.ts:369, 557-565).
9. **`__original` mirror gate is write-once** (Metadata.ts:590-601 — mirrors only `if (!hasOwnProperty(model, baseKey))`); if `Metadata.mirror` is disabled after first set, mirror-readers get divergent truth vs the store; invariant undocumented.
10. **`Decoration.register` replaces wholesale** (~:1055-1061) while `define` merges extras in the builder (:731-735) — asymmetric replace/merge semantics easy to trip across split registrations.
11. **`registeredFlavour` scans every flavour bucket per lookup** (Metadata.ts:234-256) on the hot path of `flavourResolver` (Decoration.ts:40-43).

Items 1, 2, 7, 8 are **standalone fixes** that survive independently of (and should be shipped before or alongside) the v1 §3.1 store/index/resolver + FSM refactor.

### 3.6 The class-name minification hazard — the actual redesign (board-mandated extra)

Every `.name`/`toString` identity leak enumerated:

| # | Channel | file:line |
|---|---|---|
| 1 | registry key `name = name || constructor.name` | model/ModelRegistry.ts:96-102 |
| 2 | `build()` resolves registry name via `Metadata.modelName` = `ctor.name` | ModelRegistry.ts:127 |
| 3 | nested rebuild by `c.name` / `get(c.name)` | ModelRegistry.ts:290-300; model/validation.ts:417-434 |
| 4 | list element types resolved by `t.name` (+ lowercase compare) | model/validation.ts:224-231; ModelRegistry.ts:244-250 |
| 5 | **serialization anchor = `Metadata.modelName(...) || constructor.name`** — *persisted* by `JSONSerializer.deserialize` → `Model.build(deserialization, className)` | utils/serializers.ts:42, 53-59 |
| 6 | `Metadata.Symbol` identity = `Symbol.for(ctor.toString() + " - " + name)` | decoration/src/metadata/Metadata.ts:166-168 |
| 7 | instance `toString()` leaks name | model/Model.ts:165-167 |
| 8 | `validateChildValue` instanceof check does a *"name → registry" round trip* | model/validation.ts:83-103 |

Minification breaks #1-#8 simultaneously, and two distinct classes can fold into identical minified names — silent registry corruption. `demo/src/utils/FakerRepository.ts:34` independently resolves models by `constructor.name`, showing the channel escapes the module too.

**The redesign (not the workaround status quo, and explicitly NOT any `keep_classnames`-dependent path):**

1. **Identity object at decoration time.** `modelBaseDecorator` (model/decorators.ts:14) already receives `original` and runs once per class — mint an `IdToken = { id, fingerprint }` there. `@model({ id: "pharma.lots.v1" })` for explicit ids (uniqueness-asserted); when absent, derive `id = shortHash(PACKAGE + structure)` from the static metadata bucket **at decoration time** (properties + types + validators are all in `Metadata` within the same pass) — deterministic across minification and minifier settings. Content-hash alone was evaluated and rejected as *primary* (schema drift orphanes persisted anchors, same-shape different-intent models collide); it stays a *component* of the derived id. Symbol layers cannot be serialized → **persisted identity is always the string id**; in-memory identity uses `Symbol.for("decaf:model:" + id)` — which is exactly what `Metadata.Symbol` becomes once its input is the id instead of `toString()`, also fixing §3.1's dual-package hole.
2. **Registry mutation.** `ModelRegistryManager.cache` keys on `token.id`; `register(ctor, name)` still accepted (legacy key + documented deprecation); `build(name)` accepts id or legacy name. Collision rule: same id + different ctor → throw with both origins; same ctor re-registered → idempotent.
3. **Anchor payload & tolerance.** `JSONSerializer.preSerialize` writes `ModelKeys.ANCHOR = token.id`. Persisted-payload breaking change handled with a shipped `legacyIdMap` (`original.name` → id) built at decorator time and consulted on deserialize-miss for exactly one upgrade cycle.
4. **Type-resolution paths.** list/type decorators already hold ctor or lazy-ctor references (validation/decorators.ts:563-588) — minification-safe. Fix only the string laundering sites (#3, #4, #8 above) to resolve by `Metadata.constr(ctor)` handle → WeakMap index inside the registry. **Minification exposure collapses to exactly two surfaces: registry keys and ANCHOR.**
5. **Blast radius (bounded, why this is feasible)**: model/decorators.ts, ModelRegistry.ts, serializers.ts:42 + deserialize fallback, model/validation.ts (3 sites), `Metadata.Symbol` input, plus downstream re-wrappers that funnel through `modelBaseDecorator` (`@table`, ui-decorators, for-* model decorators — all upstream of them via model/decorators.ts:75). `keep_classnames` becomes a consumer-only legacy build flag, not a correctness dependency.
6. **Proof obligation:** CI gate minifying `demo`/`web-page`/one `for-react` app with default name mangling and running the model-driven flows.

---

## 4. Registry / overrides / decoration simplification — incremental migration plan (evidence: SAA-779 §7)

Ordered; each step mergeable behind stable public API:

1. **Export the private API under contract.** `@internal`-named exports for `innerGet`/`innerSet`/`collectConstructorChain`/`Symbol`/`_metadata` access used by the ~13 reach-in call sites. Unlocks: private shapes become refactorable.
2. **`Metadata.extend(layer, extensions)` + `Metadata.seal()`.** Migrate all six patching modules (decorator-validation first); delete decorator-validation's hand-maintained `sideEffects` array (the patch effect becomes a declared registration).
3. **Hoist the 8 overridden functions into decoration as native hooks** delegating to a pluggable ModelMetadataPlugin (decoration does NOT import decorator-validation; it declares hook signatures whose default implementations throw an "import decorator-validation first" guidance error). The `overrides/` folders shrink to one declaration file.
4. **Unify the three flavour key strategies** (§3.3 item 3) on the ctor-handle Symbol; keep the string shard as a derived write-through index only.
5. **Model identity tokens** (§3.6 steps 1-4): decorator-side → registry → serializer/anchor with legacy-map tolerance. One PR per surface.
6. **Registry-as-Metadata-shard — only if the replaceability semantics are preserved** (add a per-shard `setPolicy: 'first-wins'|'replace'|'throw'` parity with `Validation.setRegistry`); otherwise reduce to "delete `utils/registry.ts` interfaces, keep the two manager classes" — cheap and safe either way.
7. **FSM extraction for Decoration states + PropertyIndex with revert parity** (v1 §3.1 steps, unchanged), explicitly including the standalone defects of §3.5 items 1/2/7/8 that the structural refactor does not automatically deliver.
8. **Module split (§3.4)**: `@decaf-ts/model` + `@decaf-ts/validation` + facade re-exports. Last, because every earlier step moves files this will move again.

Sequencing rationale: 1-3 eliminate *all* monkey-patching before anything moves; 4-5 fix identity before registries are re-homed; doing the split earlier would double every PR's blast radius.

---

## 5. db-decorators (1.9) — context system vs `logCtx`/`.context`/`.flags`, and the query-operation pattern break (evidence: SAA-774)

### 5.1 The context chain, traced

1. **db-decorators `Context`** (`db-decorators/src/repository/Context.ts`): `accumulate()` :128-136 re-defines a non-enumerable `cache`; `get()` :151-163 falls back to `(cache as any).parentContext`; `childFrom()` :168-175 seeds a child with the **entire** parent cache; `from()` :180-199 merges `DefaultRepositoryFlags` + overrides into one object; `args()` :204-240 **smuggles the context as the last element of args** (`args.push(c)` :236) — the root of the ambiguity.
2. **core `Context`** (`core/src/persistence/Context.ts`): `override(conf)` :114-137 returns a Proxy intercepting `get` (the real override path); `toOverrides()` :139-144 dumps **every** cache key with no partition; `getFromChildren()`/`pending()`/`getOrUndefined()` is the only DECAF-18 piece that exists.
3. **`ContextualLoggedClass`** (`core/src/utils/ContextualLoggedClass.ts`): `isContextLike()` :14-26 duck-types on `get/accumulate/override/toOverrides/cache` — **does not check any config-projection** (grep: `toConfig` returns 0 hits in core, db-decorators, for-*, integrations); `logCtx()` :208-249 reuses or boots a context; `AbsContextual.context()` **computes `hasFlags` at :296 but the `flags()` call is commented out (:296-303)**, so on this path `.flags()` never runs.
4. **`Adapter.flags()`/`context()`** (`core/src/persistence/Adapter.ts`): `flags()` :508-564 merges `DefaultAdapterFlags` (config defaults) with per-op flags (session/**override**) into one flat object stamped `operation/affectedTables/logger/writeOperation`; `context()` :617 re-feeds the whole `ctx.toOverrides()` dump as overrides; :628-664 derives a child or `accumulate(flags)`.
5. **`Repository`**: `override()` :370-378 Proxy over `_overrides`; `for()` :393-402 Proxy swapping the adapter (`adapter.for(conf)`).
6. **`Service.for()` ≡ `Service.override()`** (`core/src/services/services.ts:45-67`): the two "different" semantics are **byte-for-byte identical** at the service layer.
7. **Consumer-side manual bridging**: `for-nest/src/controllers.ts:56-62` feeds `activeCtx.toOverrides()` into *either* `.override()` or `.for()` depending on runtime type; `for-http/src/server/controllers/controllers.ts:169` unconditionally `override(ctx.toOverrides())`; `ModelControllerBuilder.ts:904` `persistence.for?.(ctx?.toOverrides?.())`; and `for-fabric` is the proof of the failure mode — it must **hand-whitelist two keys** in an overridden `toOverrides()` (`FabricClientContext.ts:19-28`) to avoid leaking adapter config into session overrides.

### 5.2 Where config vs overrides conflate (concrete)

- **(c1)** `toOverrides()` is a blanket cache dump (`Context.ts:139-144`) — `operation`, `model`, `affectedTables`, `args`, `transactionLock`, `dryRun`, `logger`, `timestamp` all become "overrides". No `toConfig()`, no provenance.
- **(c2)** `Service.for() ≡ Service.override()`.
- **(c3)** `Adapter.flags()` :536 merges config defaults and overrides into one undifferentiated object.
- **(c4)** `.flags()` is bypassed on the base contextual path (`ContextualLoggedClass.ts:296-307`); two context-creation paths, two different semantics.
- **(c5)** `childFrom` transplants config + override + operation state wholesale (`Context.ts:173`).
- **(c6)** Consumers feed the same dump to BOTH channels, duck-typing the decision downstream; for-fabric demonstrates the leak.

**Verdict: the conflation is structural.** DECAF-18's `toConfig()/toOverrides()` split is implemented **0%** (spec still `Status: Planned`, `workdocs/ai/project/specifications/DECAF_18.md`); for-nest early-adopts `.toOverrides()` already (§14), which makes finishing the split *loading-bearing* rather than theoretical.

### 5.3 Alternative designs (beyond repeating DECAF-18)

DECAF-18's own end-state (dual `configFor`/`overrideFor` maps + transition rules) is Option D below; three genuinely different designs were derived:

- **Option A — Capability-scoped contexts (non-breaking).** Context declares a `capabilities` set (`'config' | 'override' | 'session' | 'auth'`); derived contexts intersect capabilities; `Context.scope(cap)` returns a filtered **read view** instead of copying. Consumers keep `toOverrides()/toConfig()` as thin wrappers over `scoped('override')/scoped('config')`. Cost: a capability-key index (same bookkeeping DECAF-18 wants, stored differently). **Migration: low.**
- **Option B — Explicit `Pipeline<F>` object (root-cause fix).** Replace the last-arg context smuggling (`args.push(c)` with `MaybeContextualArg`) with a named, typed pipeline argument owning two maps (`config`, `overrides`) and a `child(op)` transition gate; `logCtx` becomes a pure derived-child function. **Root cause (last-arg ambiguity) disappears; cost is a large breaking call-site surface** (every contextual signature, every consumer).
- **Option C — Adapter-scope config token (cleanest, medium churn).** Adapter **configuration** binds to the adapter instance (WeakMap token), not to the per-operation context; the context carries only session/operation overrides; `toOverrides()` (renamed `toSession()`) becomes inherently override-only. Config is already adapter-scoped by convention (`DefaultAdapterFlags`); the work is to stop storing config keys in contexts and update readers like `ctx.get('connectionTimeout')`.
- **Option D — (baseline) DECAF-18's provenance-tagged dual map**, listed for comparison.

**Recommendation: Option C (or A) for the non-breaking path; B only if the family accepts the call-site break. D is the right end-state and C reaches it with the least churn.**

### 5.4 The query-operation pattern break — confirmed in detail

- The operation decorators are **CRUD-only**: `operation()` builds `compoundKey = baseOp + op` (`operations/decorators.ts:625`) registered under `on.*`/`after.*` (`operations/constants.ts:14-15`); lookup is `prefix + key` (:207) and `getDbDecorators` filters by operation string (`repository/utils.ts:114-143`). There is **no query-operation key**.
- The framework's own types anticipate it but nothing resolves it: `BlockOperationDescriptor` declares `{kind:"statement"}` / `{kind:"query"}` (`operations/constants.ts:116-120`), yet `resolveKindForString` (`decorators.ts:63-68`) only ever returns `"bulk"`/`"crud"` — **the `statement`/`query` kinds are dead types**.
- Queries are serialized into a method-name string: `Statement.prepare()` joins tokens and stores `prepared.method = toCamelCase(method.join(" "))` (`core/src/query/Statement.ts:862-961`, `:957`); execution dispatches reflectively: `executePrepared` :438-444 → `Repository.statement` → `(this as any)[name](...ctxArgs)` (`core/src/repository/Repository.ts:1547-1557`).
- **Per-adapter serialization is duplicated**: operator enums (`core/src/query/constants.ts:10-43` vs `for-couchdb/src/query/constants.ts:28-40` vs `for-typeorm/src/query/constants.ts:34-52`); `translateOperators` re-implemented identically (`for-couchdb/src/query/translate.ts:37-47` ≡ `for-typeorm/src/query/translate.ts:37-47`); `build()`+`parseCondition()` forked per adapter (`for-couchdb/query/Statement.ts:166-291, 976-1069`; `for-typeorm/query/Statement.ts:117-…`).
- **Divergent semantics for the same `Condition` tree**: `STARTS_WITH` is a Mango range branch in CouchDB (`Statement.ts:1001-1015`) but maps to plain `LIKE` in TypeORM (`constants.ts:50-51`, no `%` wiring); `BETWEEN` is commented out of the CouchDB operator enum but present in TypeORM; `REGEXP` only really exists on CouchDB; aggregates: CouchDB drives them through **model view decorators** (`@view/@count/@sum/...` via `buildAggregateInfo`, `for-couchdb/query/Statement.ts:504-593`) while TypeORM uses SQL selectors (`:127-179`) — two different definitions of the same operation, and the decorator contract lives inside the adapter, not in db-decorators.
- **The decorator hook only fires post-query on READ** (`Statement.applyAfterHandlersToResult`, `core/src/query/Statement.ts:487-520` → `enforceDBDecorators(..., READ, AFTER)` at :494): only returned model *instances* pass through lifecycle decorators; `select()/count()/paginate()` paths that don't return instances never hit it, and query *composition* has no decorator surface at all.

### 5.5 Proposal: dedicated query-operation handlers, decorator-centric, prefix/suffix localized in db-decorators

The prefix/suffix machinery already exists and stays put: `OperationKeys.ON/AFTER` prefixes (`operations/constants.ts:14-15`), `baseOp + op` compound keys (`decorators.ts:625`), `getHandlersDecorators` `prefix + key` (:207), `getDbDecorators` prefix filter (`repository/utils.ts:119-131`), `prefixMethod`/`suffixMethod`/`wrapMethodWithContext` (`repository/wrappers.ts:16-106`).

1. **Handler contract** (new, parameterised over the adapter query type `Q`):

```ts
// db-decorators/src/operations/queryTypes.ts
export type QueryClauseDescriptor = {
  kind: 'where' | 'select' | 'orderBy' | 'groupBy' | 'aggregate' | 'page' | 'raw';
  key?: string;    // attr / orderAttr
  value?: any;     // comparison / direction / size
};

export type QueryOperationHandler<M extends Model, A extends Adapter<any,any,Q,any>, Q, V = object> =
  (this: A, ctx: ContextOf<A>, clause: QueryClauseDescriptor,
   query: Q, model: Constructor<M>, metadata: V) => Q | void;
```

2. **Registration** reuses `OperationsRegistry` (already flavour-bucketed, `resolveFlavour` :144-151, `byOperation[flavour] || defaultFlavour` :161-165): new keys e.g. `onQuery.*` (a `@onQuery(QueryOps.AGGREGATE, handler, data?)` mirroring `operation()`). Each adapter registers its **default-flavour** translation handler (its `translateOperators`/`parseCondition`/`build`) at bootstrap — db-decorators never learns Mango or SQL, core stops shipping operator maps.
3. **Core `Statement`**: `prepare()`'s method-name synthesis (:865-960, `:957`) and `prepareCondition` (:526-591) are replaced by folding each fluent call (`select/where/orderBy/groupBy/count/sum/limit/offset`) into `QueryClauseDescriptor`s and invoking the registered handlers in the existing prefix/group/priority order (`operations/decorators.ts:189-317`); `prepared` becomes a descriptor list handled lazily; `Repository.statement` stops reflective string dispatch for query ops. `Paginator` (`paginate`, `Statement.ts:1000-1015`) follows the descriptor path.
4. **Replaced inventory**: the duplicated `translateOperators` ×2; per-adapter `build()`/`parseCondition()`; `prepareCondition` + method-name synthesis + `QueryClause` string enum used for name synthesis (`core/src/query/types.ts:103-120`); the CouchDB aggregate view decorators (subsumed by a single `@onQuery(AGGREGATE, ...)`). The `BlockOperationDescriptor` `statement`/`query` kinds finally gain a resolving path through `resolveKindForString`.
5. **Trade-offs**: decorator-first and flavour-pluggable, operator divergence becomes visible as *registered behavior* per adapter; but breaking for `Statement`'s abstract contract and every adapter's `build()`. Stage behind the existing `blockOperationIf`-style metadata handshake; per-flavour default handlers registered by each adapter's bootstrap; ordering semantics re-verified per adapter.

---

## 6. for-http events system (1.11, 1.19a) — configurations, SSE, structure (evidence: SAA-775)

### 6.1 Lifecycle: opaque infinite reconnect, close that cannot stop, silent stream death

- `ServerEventConnector` (`for-http/src/event/ServerEventConnector.ts:12`) holds a **static process-wide cache keyed by URL** (:13-32): one connector per distinct URL, shared by all subscribers. Entries are removed only by `close()`.
- The connector instantiates `EventSourcePlus` with **no policy options** (:203-206). Defaults resolved from `event-source-plus` source: `maxRetryCount` undefined → **retries indefinitely**; exponential backoff from **2 ms** doubling to a 30 s cap; `retryStrategy: "always"` reconnects even after a clean stream end. **There is zero configuration surface** (`open(url, headers?)` is the only entry).
- **`close()` is not a reliable stop** in two races: (i) close during the open IIFE is undone — the IIFE continues and re-assigns `this.es`/`this.controller` (:200-279); (ii) close during the backoff wait cannot stop reconnection — `event-source-plus._handleRetry` allocates a **fresh non-aborted** `AbortController` after the wait (`event-source.ts:70-73`), and the connector never registers `EventSourceController.onAbort` (event-source.ts:275-277).
- **Post-connect errors are silently swallowed**: a one-shot `settled` flag (:208) early-returns on every `onRequestError`/`onResponseError` after the first successful connect, because the library reuses the same hooks object across reconnects — once the stream drops, the connector retries forever, `ready` stays `true`, and no listener is ever told (**stale-ready / silent stream death**).
- **Unhandled rejection**: `ensureListening().then(...)` with no `.catch` (:308) rejects unhandled on failed initial connect.
- **Unbounded cache / orphaned retries**: no pruning on connector GC; `close()` declines while listeners remain (:137-142) unless forced, so an orphaned listener leaves an eternal retrying connection; `isOpen()` (:88-90) returns true while not-ready/reconnecting.

### 6.2 Configuration surface — one dead option, several non-configurable

Client `HttpConfig` (`for-http/src/types.ts:19-31`):

| Option | Honored? |
|---|---|
| `events` (:25) | Yes (`HttpDispatcher.ts:134-137`) |
| `eventsListenerPath` (:23) | Yes (required; `InternalError` if missing) |
| `eventsSubscription` (:26) | Yes (`?cid`, header, subscribe/unsubscribe; re-synced on observe/unObserve `adapter.ts:198-213`) |
| `eventHeaderResolver` (:27-29) | **NO — dead: never invoked** |

**`eventHeaderResolver` defect (concrete)**:

```ts
// adapter.ts:215-220
protected async getEventHeaders() {
  if (!this.config.eventHeaderResolver) return {};
  const headers = await Promise.resolve(this.config.eventHeaderResolver); // <- not called!
  return headers || {};
}
```

`Promise.resolve(fn)` resolves to the function itself (functions are not thenable); the **function object, not a record**, is spread into headers — so custom SSE auth headers are silently dropped on the stream open, on `resolveEventHeaders()` (`HttpDispatcher.ts:409-420`), and on the subscribe/unsubscribe POSTs (`:354-358`). The fix is literally `await this.config.eventHeaderResolver()`.

Also: the connector's `ServerEventConnectorHeaders` allows a function but resolves it **once** at open (:117-125) — auth headers are not refreshed on reconnect despite the library re-evaluating `options.headers` per connect (`event-source.ts:82-97`); `credentials: "include"` is hard-coded.

Server `ObserverEventsOptions` (`for-nest/src/types.ts:17-40`): `enableObserverEvents`, `subscriptionMode`, `observerFlavours`, `observerApiPath` — all honored. Hard-coded: 15 s heartbeat (`EventsController.ts:215`), always-present `/:model` route, no per-connection timeout.

### 6.3 Structure/organization

- Client SSE plumbing (`for-http/src/event/`) is generic (not HTTP-adapter-specific) and consumed only by `HttpDispatcher`; the **topic matcher `matchesTopic` lives in the webhook folder** (`for-http/src/server/hooks/utils.ts:37-63`) and `for-nest`'s events module imports it from there (`ObserverSubscriptionRegistry.ts:2`) — an events concern implemented as a webhook utility and imported across packages.
- `EventsController.listen` (:140-231) and `listenForModel` (:263-306) duplicate the same fingerprint/claim/observe/teardown flow with divergent error behavior.
- Naming misleading: `ServerEvent*` types/connector are *client-side* consumers of server events.
- **for-nest hosts two parallel subscriber systems over the same adapter observer events** — in-memory SSE (`events-module`) and persisted webhooks (`webhooks` module) — both coupled on the webhook-folder `matchesTopic`. A single event-bus/topic layer would remove the duplication.

### 6.4 Own findings beyond the brief (defects, races, contract gaps)

1. **SSE endpoints are unauthenticated by default → full event broadcast.** `EventsController` carries no `@Auth`/guard (`for-nest/src/events-module/EventsController.ts:62`); `DecafModule.forRootAsync` (`module.ts:13-58`) does not register `DecafAuthModule`. Broadcast `listen()` sets `filter = undefined` (:168-174): every create/update/delete event streams to any anonymous client on `GET /events` by default.
2. **Client-supplied `x-correlation-id` is the subscription identity.** `resolveRequesterFingerprint` (`events-module/utils.ts:211-232`) prioritizes unauthenticated `x-correlation-id`; `sanitizeTopics` does **not** block `*.*` (:172-184), and `matchesTopic("*.*", ...)` matches everything (`hooks/utils.ts:39`). A client can therefore scope-subscribe to the full event stream under a synthetic identity, and can pre-claim a victim's correlation id → `ConflictError` connection-claim DoS (`EventsController.ts:101-108`). The subscription permission model is not bound to an authenticated identity unless the host globally installs auth.
3. **Payload-as-context contract gap**: `HttpDispatcher.onEvent` calls `logCtx(args, operation, true)` over a *serialized* payload (`HttpDispatcher.ts:192-207`) — crossing the serialization/context boundary; the server-side context never survives the wire, only its payload.
4. Races: close-during-open undone; close-during-backoff unstoppable; unhandled rejection; `startListening` re-entrancy warnings-not-idempotence (:138-142).
5. Misc: `close()` clears `listeners` without calling removal closures (:153); heartbeat handler logs "Refresh connection" but does nothing (:252-255); `parseReceivedEvent` discriminates single vs bulk events only by payload array-ness, not by operation key or id shape (`ServerEventConnector.ts:41-71`).

### 6.5 Reorganization (concrete)

```
for-http/src/events/            (rename; keep export alias)
  EventSourceConnector.ts       // generic SSE client (was ServerEventConnector)
  topic.ts                      // single source of truth: matchesTopic / eventTopicFor / keyToTopic
for-nest/src/events-module/     // imports for-http/events/topic.ts, NOT server/hooks/utils
```

Plus: extract a shared `openStream(fingerprint, filter)` in `EventsController`; expose reconnect policy (maxRetryCount/maxRetryInterval/retryStrategy) on the connector; refresh headers per reconnect; default-to-authenticated subscription identity; **enable-settable or default-off broadcast**.

---

## 7. for-http webhooks (1.19b) — delivery reliability, signature, enterprise readiness (evidence: SAA-776)

### 7.1 Delivery reliability — durable but racy; dead-letter is broken

Durable: events/subscriptions/deliveries persisted through repositories (`PublisherService.ts:109`, `:135`); payload survives restarts on `WebhookEventRecord.payload` (`WebhookEventRecord.ts:58`). Best-effort: engine lifecycle flags (`DeliveryService.ts:52-54`).

- **Backoff**: 30 s doubling to a 30 min cap (`utils.ts:84-91`); `maxAttempts` **hardcoded at 12** (`PublisherService.ts:122`); no jitter (lockstep retry storms); per-attempt timeout hardcoded 10 s (`DeliveryService.ts:346`).
- **Defect 1 — terminal FAILED deliveries are re-claimed forever.** The claim query selects `status IN [PENDING, FAILED]` with **no `attempts < maxAttempts` predicate** (`DeliveryService.ts:296-307`). After exhaustion, rows get `FAILED` + scheduled `nextAttemptAt` (:375-381) and are re-claimed indefinitely → true dead-lettering never happens, and dead targets burn batch slots every cycle. (Both branches of the status update assign `FAILED` — dead code at :375-378.)
- **Defect 2 — PROCESSING rows are stranded by crash.** `claimDueDeliveries` flips claims to `PROCESSING` (:311-315) with no lease/heartbeat/staleness recovery; a crash (or `stop()` aborting mid-batch, :275-277 breaks without re-pending) permanently loses those events.
- **Defect 3 — non-atomic claim, no exclusivity.** Select-then-update (:296-315) with no transaction/conditional update: two engine instances duplicate-POST the same event; the single-process `Lock` (:56) does not span instances.
- **Defect 4 — wrong-payload fallback.** `readEventForDelivery` (:443-459) falls back to the **latest event on the topic** if the event read fails transiently — the delivery is signed and POSTed with a *different event's* envelope while headers still say `x-webhook-id: <original>`. Silent data corruption with a 2xx.
- **No ordering guarantee**: claiming orders by `nextAttemptAt` schedule, not per-subscription sequence; serial per-process delivery (`processMany`, :274-278) backs up large fan-outs (one event per ~10 s worst case).
- Sync-mode events silently dropped when `!this.syncing` (:709-711).

### 7.2 Signature verification — correct primitives, below industry practice

- Sender: `HMAC-SHA256(secret, rawBody)` hex in `x-webhook-signature` (`utils.ts:65-67`, sent `DeliveryService.ts:351`). Receiver: `WebhookSignatureMiddleware.verify` (`middleware.ts:38-79`) with `timingSafeEqual` + length pre-check (`utils.ts:74-81`), fail-closed.
- **No timestamp binding / replay protection anywhere**: the signature covers only the body; an intercepted delivery verifies forever. Stripe/Svix-style `t=...,v1=<hmac(t.body)>` was considered and is wire-format-additive (keep v1 read-only one release).
- `x-webhook-id`/`x-webhook-topic` headers are **unsigned** (:349-351) — the verified body cannot be bound to a claimed event id.
- **Severity-high receiver landmine**: `getRequestBody` (`middleware.ts:127-138`) falls back to `JSON.stringify(req.body)` when the framework re-parsed the body — key order/spacing differences falsify the preimage; verification is practically unusable without a `rawBody` and nothing enforces or documents it.
- `extractSignature` (:81-108) silently accepts three encodings (`hmac-sha256=`, `sha256=`, bare hex) and ignores the declared `algorithm` — a future Ed25519/v2 scheme turns bare-hex into an algorithm-confusion sink. Allowlist-strict: exactly one scheme per version.
- `lookupSubscription` (:110-114) loads **all active subscriptions** and filters by URL string per request — O(n) paged scan per inbound webhook (DoS amplification); should be an indexed lookup on URL hash + `x-webhook-id` first. A `new WebhookSubscriptionService()` is constructed **per request** (:111) rather than injected.

### 7.3 Secrets handling

- `secret` is a plain `@column() @required()` on `WebhookSubscription` (:38-41) and is **copied onto every delivery row** (`PublisherService.ts:119`, `WebhookDelivery.ts:55-58`): plaintext at rest, no encryption-at-rest integration with `@decaf-ts/integrations/secrets`, no Sensitive marker, duplicated per event so one DB read exposes every secret ever rotated.
- **No rotation support at all**: no dual-secret window, no rotation endpoint; `replayEvent` re-signs with the stored secret so post-rotation replays re-fail (`DeliveryService.ts:521-562`).

### 7.4 Enterprise readiness scorecard

| Capability | Rating | Gap |
|---|---|---|
| Idempotency keys | 2/5 | Envelope UUID + `x-webhook-id` echo exist, but sender-side dedupe does not (no unique (subscriptionId,eventId), non-atomic claims) and no documented receiver contract |
| Dead-letter handling | 1/5 | No DLQ concept; *worse*, the terminal state is unreachable given claim Defect 1 |
| Envelope compat (Stripe/Svix-style) | 1/5 | Bespoke envelope; no timestamp/attempt/`type`+`data` convention; interop needs a translation layer per receiver |
| Attempt observability | 2.5/5 | Per-delivery `attempts/lastAttemptAt/responseStatus/responseBody/errorMessage` persisted (`WebhookDelivery.ts:79-98`, 50 KB truncation); missing: per-attempt history, metrics/hook emission, response headers |
| Subscription lifecycle | 2/5 | active/deactivate/reactivate routes exist; missing auto-disable after sustained failures, endpoint verification handshake, per-subscription backoff/circuit breaker, secret/URL audit trail |

### 7.5 Own adversarial findings (sender- and receiver-side)

1. **SSRF pivot via subscription `url`** — High/High. `POST /webhooks/webhook-subscriptions` (from-model CRUD, `for-nest/src/webhooks/DecafWebhookModule.ts:112`) accepts an arbitrary `targetUrl` (`WebhookSubscription.ts:36`) used verbatim by the engine (`DeliveryService.ts:345`): no scheme/host validation, no private-range blocking, and axios redirect following extends the pivot (302 from a public host to an internal address). Persisted `responseBody` (:366-369) plus an exposed Deliveries read route turns SSRF responses into network reconnaissance exfiltration (service metadata endpoints included).
2. **Secret disclosure via REST serialization** — High. From-model create/read for `WebhookSubscription`/`WebhookDelivery` emits `secret` on every read/list (no forget/Sensitive annotation on the field), and action controllers rely on default-tenant role gates (`FromModelController.ts:231-241`); a leaked subscription secret can mint valid signatures cross-subscription.
3. **IDOR on replay + lifecycle routes** — Medium-High. `POST /webhooks/webhook-events/:id/replay` and deactivate/reactivate (`for-nest/src/webhooks/controllers.ts:20-130`) accept bare ids with no tenant scoping/role gate beyond class default — replay becomes a spam/proxy cannon compounding the SSRF.
4. **Unversioned signature + full-scan subscription lookup** make any unauthenticated endpoint on this middleware a cheap DoS reflector.
5. **Receiver-side replay is live** (no timestamp binding; §7.2).
6. **Full-payload fan-out**: `WebhookObserver.refresh` (`observers.ts:83-109`) ships the **entire** persisted model row for a bare model topic — no field-level redaction; blast radius scales with dataset (PII, internal fields).

### 7.6 Hardening order (each independently shippable)

1. **Fix the claim loop**: terminal `Exhausted`/DLQ status excluded from the claim query + stale-`PROCESSING` lease recovery (a `WHERE`-clause + enum change; non-breaking).
2. **Atomic claim**: CAS-style conditional update or `claimedBy`/`claimedAt` lease.
3. **Timestamp-bind the signature** (`t`, `v1` envelope; legacy accepted one release) → replay protection on both sides.
4. **Strip `secret` from `WebhookDelivery`**; route secret storage through the secrets integration; remove from API serialization defaults.
5. **Auto-disable/backoff per subscription** after N exhausted deliveries + DLQ view + replay-from-DLQ; envelope v2 with `attempt` count and `type`/`data` for interop; configurable `maxAttempts`/timeout.
6. Indexed subscription lookup in the signature middleware (URL hash + header), drop the all-subs scan.

Follow-up routing (owned by CTO after this review): (i) remediation ticket for the claim-loop/dead-letter + SSRF/IDOR/secret-exposure class → coder; (ii) tester-authored fuzz/exploit suite (SSRF via subscription URL, replay hammering, claim-race dual-runner, secret leak via from-model routes).

---

## 8. for-angular locale (1.12) — the reliability verdict (evidence: SAA-777)

**Headline: there is no `LocaleService` in `for-angular`.** Repo-wide, `LocaleService` exists only in `for-react-native` (`I18nLocaleService`-shaped interface, `for-react-native/src/core/services/TranslateService.ts:8`) — a different runtime. The for-angular locale surface is **seven disconnected pieces**, none owning the locale token end-to-end:

| Surface | File:line | Role / defect |
|---|---|---|
| `I18nLoader` | `for-angular/src/lib/i18n/Loader.ts:110` | resource loader; see defects below |
| `provideDecafI18nConfig` | `Loader.ts:228` | **hard-codes `lang: 'en'` default (:229)**; never derives from `navigator.language`, persisted value, query param, or server header |
| `NgxTranslateService` | `services/NgxTranslateService.ts:18` | **`translate()` always rejects**: `firstValueFrom(this.translateService.instant(...))` (:26-29) — `instant()` is synchronous and returns a string, not an Observable |
| `DecafTranslateService` (ui-decorators) | `ui-decorators/src/ui/DecafTranslateService.ts:3-19` | pure stub — logs only |
| `DecafTranslatePipe` | `pipes/translate.pipe.ts:19-43` | **dead code** — no component imports it; disabled-path returns raw HTML (`<div class="dcf-translation-key">$...</div>` :42) |
| `getLocaleLanguage` | `utils/helpers.ts:260-264` | **crashes on SSR**: `getWindow()` returns `undefined` on Node → `undefined.navigator` `TypeError`; only call site is `formatDate` (:360), invoked from list/table render helpers (`list.component.ts:1402,1411`) — **any server-rendered date aborts SSR** |
| locale-context derivation | `Loader.ts:40,58`, `helpers.ts:221` | see below |

### 8.1 Ten concrete defects (selected highlights)

1. **Locale token not owned anywhere** — no Accept-Language read, no cookie/localStorage persistence, no detection, no backend agreement anywhere across `for-angular`, `for-http`, `for-nest` (grep: zero hits).
2. **`getLocaleLanguage()` SSR crash** (above).
3. **No persistence / hydration contract** — no cookie write, no localStorage key, no `TransferState`/`window.__DECAF_LOCALE__` handshake.
4. **All-or-nothing load**: `forkJoin` over all resources (`Loader.ts:150-154`) — a single 404 aborts every bundle; no retry, no per-resource fallback; the React loader (`for-react/src/lib/i18n/Loader.ts:45-49`) is strictly better (returns `{}` per miss).
5. **In-place mutation of the library English bundle**: `recursiveMerge` mutates its first argument and is called with `libLanguage['en']` itself (`Loader.ts:186` + `:164-173`) — app keys pollute the library baseline; non-deterministic across switches.
6. **Static unbounded cache** keyed by lang only; no TTL, eviction, `clear()`, or `use()` invalidation.
7. **Cache-busting version is day-of-week, not a build version**: `?version=${getFullYear()}${getMonth()}${getDay()}` (`Loader.ts:137-138`) — changes daily, not content-tied (same flaw in for-react).
8. **Broken `NgxTranslateService.translate`** (above; it is exported publicly).
9. **`getLocaleFromClassName` mangles acronyms**: `CRUDFormComponent → component.cr_u_d_form` (`helpers.ts:221-247`); `toLocale`-style keys never match authored JSON when casing drifts.
10. **`formatDate` conflates locale tags with format templates** — callers pass `'dd/MM/yyyy'` as a BCP-47 tag → `RangeError` (`helpers.ts:359-381` + `BatchHandler.ts:78`, `BatchForm.ts:95`, `modal-diffs.component.ts:96-97`; verified as an invalid locale in Node).

### 8.2 Required-behaviour spec (R1-R9) for an actual `DecafLocaleService`

R1 single owner of the locale token (interface in ui-decorators/core, platform impls per runtime). R2 deterministic resolution: persisted user choice → `Accept-Language` (backend truth) → `navigator.language` (browser only) → framework fallback. R3 SSR symmetry: server resolves and injects the token (inline/`TransferState`/`<html lang>`); the client never re-derives before first paint (no hydration mismatch). R4 allowlist-mapped `Accept-Language` negotiation with q-weights. R5 cookie (`SameSite=Lax`, `Path=/`, `Secure`) + localStorage sync, agreed key. R6 per-resource load with bounded retry and graceful fallback to inline library keys (never `forkJoin`-bomb). R7 version-hash-keyed cache with explicit invalidation/ETag. R8 translation language decoupled from `Intl` formatting locale (fixed `timeZone` for byte-identical server/client output). R9 self-consistent sync/async API surface.

### 8.3 Redesign + migration (no template changes required)

1. `DecafLocaleService` in ui-decorators; `NgxLocaleService` in for-angular forwarding `setLocale → translateService.use()` and invalidating the cache on change.
2. Bootstrap: `resolve()` seeds `provideDecafI18nConfig` — server: cookie/`Accept-Language`; client: persisted value → `TransferState` → `navigator`; SSR guard in `getLocaleLanguage`.
3. for-http interceptor + for-nest middleware attach `X-Decaf-Locale`/cookie and expose `resolveLocale(headers)` so client and server share one allowlist mapping.
4. Loader: per-resource error handling, bounded retry, pure `mergeDeep` (like for-react), `lang+versionHash` cache key, `clearCache()`, ETag support.
5. Fix or remove `NgxTranslateService.translate`; register (or delete) `DecafTranslatePipe`.
6. Codemod `formatDate(x, 'dd/MM/yyyy')` call sites; add an SSR smoke test (list with dates, no TypeError, stable `<html lang>`) and a hydrate-equality test.

**Verdict: FAIL on reliability — with a concrete, bounded fix path.**

---

## 9. for-typeorm (1.17, 1.18) — compatibility goal, test debt, `@mirror`, CLI, fake observables (evidence: SAA-778)

### 9.1 Objective restated and compliance

The goal is that **decaf decoration emits metadata exactly equivalent to the most feature-rich/compatible TypeORM expectations: 100% compatibility, not divergence.** Current mapping (`TypeORMAdapter.decoration()`): `@table`→`@Entity` (:1363-1388), `@pk`→`@PrimaryGeneratedColumn`/`@PrimaryColumn` (:1393-1501), `@column`→`@Column` (:1510-1532), `@unique` (:1534-1539), `@required`→`nullable:false` (:1541-1546), `@version`→`@VersionColumn` (:1548-1552), `@timestamp` family (:1558-1601), all four relation decorators + join columns/tables (:1603-1886), `@index`→`@Index` (:1889-1928), `@createdBy`/`@updatedBy` (:1930-1948). Equivalence confirmed for: core column types, generated PKs, relations + cascade/onDelete/eager, timestamps.

**Compatibility gaps against the 100% goal:**
1. **`ColumnOptions` under-expression** — decaf `@column(name)` stores only the name (`core/src/model/decorators.ts:98-101`); nothing expresses `default`, `precision`, `scale`, `array`, enums (`simple-enum`/`simple-json`/`json`), `unsigned`, `zerofill`, `charset`, `collation`, `comment`, non-PK `generated`, `select`, `transformer`, `onUpdate`. This is the single largest distance-to-target.
2. **`@version(persistent)` ignored**: `version(true)` attaches decaf sequence versioning (`core/src/model/decorators.ts:392-407`) while the flavour unconditionally emits `VersionColumn` (`:1548-1552`) — a persistent-version model gets **both** mechanisms in conflict.
3. **`generateIndexes` is CouchDB-derived** (`src/indexes/generator.ts` JSDoc says `for-couchdb`): raw unquoted `CREATE INDEX ... (col)` DDL ignoring `unique/where/sparse/synchronize/composite direction`, and it duplicates the `@Index` decorator path as a second index mechanism (`TypeORMAdapter.index()` :308-332).
4. **Diverged defaults**: `@column` sets `nullable = true` for every non-PK (:1525-1527) while TypeORM's default is non-null — an intentional inversion, but it must be documented as semantic difference, not sink in silently.
5. `@oneToOne` maps the decaf `fk` name to `foreignKeyConstraintName` (:1654-1660) and never sets the `JoinColumn` column `name`.
6. `@index` supports neither options objects nor fulltext/spatial variants (:1892-1928).

### 9.2 Test debt — quantified

- Unit: 10 suites / 71 tests, pure-function; **the driver suites test dead code** — `tests/unit/driver-{mysql,postgres,sqlite,sqlserver}.test.ts` exercise `TypeORMAdapter["parseTypeToDriver"]`/`["parseValidationToDriver"]` (e.g. driver-postgres.test.ts:50,77,95) whose only consumer is the fully-commented `createTable` (`TypeORMAdapter.ts:1135-1345`); the private statics have **zero live call sites**.
- Integration: 37 files / 178 declared tests, **36 skipped**; every suite targets **postgres** (sole fixture); 4 of 5 drivers have zero real-DB exercise; `dispatch-subscriber.test.ts:38-43` injects a fake adapter and never touches a DataSource (unit test dressed as integration); `adapter.test.ts:137-147` comments out `repo.observe`, so the event path is never exercised.
- The un-skip-or-delete list: `MethodQueryBuilder.decorator.test.ts` GroupBy/Offset, `model-relations` many-to-many, `multi-adapter-diferent-flavour`, `repository-uuid`, `task-engine.typeorm`, `type-orm-full-decaf-decoration`.

**Integration plan**: fixture matrix as Compose profiles (postgres:17, mariadb:11, better-sqlite3 in-memory, mssql/server); per-driver suites for DDL/PK strategies, sequences, CRUD+bulk (the 5th — relations, transactions, migrations, index existence via `pg_indexes`/`information_schema`, and TRIGGER-mode notify); GitLab `parallel:matrix` (not serial `--runInBand`); make DB boot first-class (`setup.ts:4-7` currently boots docker only under `CI`).

### 9.3 `@mirror` bleed — confirmed

- Dead heritage: `src/decorators.ts` is 310 lines of **fully-commented** superseded mirror registry (`static mirror = true`) — delete.
- Live bleed: the TypeORM `Column` override reads constructor-mirrored decaf metadata to **override TypeORM's own type inference** (`src/overrides/Column.ts:154-161`, reading `Metadata.allowedTypes(object.constructor, propertyName)[0]`) — translation that belongs in the decaf `@column`/`@type` handlers and their flavour extension, not inside an adapter override. This is possible because `decoration` mirrors buckets onto constructors (`decoration/src/metadata/Metadata.ts:592`).
- Additional dual bookkeeping: `TypeORMAdapter.decoration()`'s `pkDec` writes decaf metadata *and* registers TypeORM columns simultaneously (:1393-1501).
- **Re-homing design**: `@column`/`@type`/`@pk`/relation handlers resolve property types and emit explicit TypeORM `type` + options down through the flavour extension; the `Column` override must never re-derive a type from `Metadata.allowedTypes`.

### 9.4 Missing infra/boot CLI — confirmed

No `bin` field, no `decaf-ts/cli` registration. Boot controls exist only as adapter statics (`connect/createDatabase/createUser/createNotifyFunction/deleteDatabase/deleteUser`, `TypeORMAdapter.ts:764-866`) hand-wired in tests' `beforeAll/afterAll` (`adapter.test.ts:95-156`), docker boot gated on `CI` (`setup.ts:4-7`). Proposed CLI surface (`decaf typeorm ...`): `db up/down`, `migrate --to <version>` (`MigrationService.migrateAdapters`), `sequence reset --model X --pk <id>` (`TypeORMSequence.setval/ensureAtLeast`), `e2e --target <matrix>`. One CLI = one canonical spin-up → migrate → sequence-reset → teardown path for true integration tests and local matrix runs.

### 9.5 Fake observables — confirmed

- TRIGGER mode publishes `pg_notify('table_changes', ...)` (`TypeORMDispatch.ts:160-176`, duplicated at `TypeORMAdapter.ts:795`) with **no `LISTEN` consumer anywhere** — zero events reach observers in TRIGGER mode; the surface is simulated.
- Events activate only via `adapter.observe()` (`core/src/persistence/Adapter.ts:1045-1050`) whose subscription is **fire-and-forget unawaited** (`core/src/persistence/Dispatch.ts:336`); `TypeORMDispatch.initialize` drops the subscribe promise (`:216-225`) — subscription errors surface as unhandled rejections, and `initialize()` resolves before the subscriber attaches.
- `setEventMode`/`TypeORMEventMode` have **zero callers**; mode hardcoded `SUBSCRIBER` (`:51`); `updateObservers` explicitly no-ops "e.g., in unit tests" (:257-263).
- Buggy delete payload: `afterRemove` passes `""` as id (`TypeORMEventSubscriber.ts:92`) — delete events carry no record id (and the test *asserts* `ids === ""`, locking the defect in: `dispatch-subscriber.test.ts:78`).
- **Real wiring needed**: an actual pg listener (`client.on('notification')` for `table_changes`) or properly-attached TypeORM subscribers initialized before DataSource init; await subscription; expose `eventMode` via adapter/DataSource options; propagate the deleted id; delete the test-noop escape hatch.

---

## 10. for-graph / ui stack (1.21) — layout audit against the board-correct target (evidence: SAA-782 §A)

**Target layout (board-correct):** `ui-elements` = `@decaf-ts/ui-decorators` (model metadata + shared primitives); Angular lib = `@decaf-ts/for-angular` (web components); `integrations` = **only** the basic demo engine, to be re-implemented on the masta.si framework as its driver (replacing the UI layer there). Moving shared graph concerns into `integrations` is explicitly out.

**What the shipped DECAF-50 refactor achieved** (commit `646e306` docs + submodule commits `b7e65cb` [integrations], `aa5323c` [ui-decorators], `1894218` [for-angular]):

- `integrations/src/graph/shared/**` (constants, types, node manifests, `GraphExecutionStateMapper`, `GraphResolution`) **deleted**; engine/log/nest rewired onto `@decaf-ts/ui-decorators/graph` contracts (92 imports).
- `ui-decorators/src/graph` gained the shared node layout (`nodes/{agents,triggers,loops,utility,flow-control,boundary}`, `manifests.ts`, `category-styles.ts`) and stays framework-agnostic (only `db-decorators`/`decoration`/`decorator-validation` imports; zero `@angular`/`@nestjs`/`@decaf-ts/integrations`).
- `for-angular/src/graph` has **zero** `@decaf-ts/integrations` imports (the only hit is a test asserting the ban, `bundle-wall.spec.ts:40,48`); 112 imports of `@decaf-ts/ui-decorators/graph`; deleted `NgxSessionAdapter.ts` (472 lines) in favor of `SessionRamAdapter.ts` (177).

**Remaining gaps (concrete):**
1. **for-angular graph is not a published lib surface**: `ng-package.json` declares a single entry (`src/lib/public-apis.ts`), and the graph barrel is not re-exported (`public-apis.ts:13-20` — components/directives/engine/i18n/pipes/services/utils, no graph). Add a `./graph` secondary entry point or explicitly document graph as in-repo/app-only. Largest remaining gap against "the Angular lib holds the web components".
2. **Five framework-agnostic document primitives remain in for-angular** with no `@angular/*` import (per the board rule, candidate moves to `ui-decorators/graph/document`): `GraphDocumentMutation.ts`, `GraphDocumentCommands.ts`, `GraphDocumentSelectors.ts`, `GraphNodePaletteFactory.ts`, `GraphDiagramMutationTranslator.ts`. (DECAF-50 §4.12 lists them under for-angular — treat as an ambiguity to resolve, not a hard defect; `GraphDiagramAdapter`/`GraphWorkflowDocumentStore` correctly stay, they import `@angular/`.)
3. Demo-only `GraphDemoNodeData`/`GraphDemoNodeBlueprint` in the lib (`for-angular/src/graph/types.ts`) belong out of app/demo scopes.
4. `integrations` still hosts the full execution engine (90 engine files + `nest/graph` backend) — the *residual external boundary* per the plan (re-implemented on masta.si), listed for completeness.
5. Hygiene: duplicated `export * from "./overrides"` + contradictory side-effect imports in `ui-decorators/src/graph/index.ts`.

**Verdict: DECAF-50 substantially achieved the board-correct layout; v1 §1.21 is withdrawn.** The masta.si re-implementation contract should be written down before integrations' engine drifts further (its 90-file engine is currently the only driver in existence).

---

## 11. dukts / demo (1.23) — purist-example critique (evidence: SAA-780 §A, verdict RED)

**Finding 0 — the vehicle.** "dukts" exists nowhere in the repo or workdocs (zero hits outside Paperclip runtime data); the practical vehicle is the `demo` module (`@decaf-ts/demo` 0.0.1) with its two Angular/Ionic apps. **Step 0 of the fix is writing the missing specification.**

**How far the current implementation is from the objective:**

- **Purely-defined models shared across frontend/backend — embryonic only.** The models exist and are decorator-declared (`DemoModel.ts:15-105`, `CategoryModel.ts:17-52`, `EmployeeModel.ts:11-47`, `UserModel.ts:7-29`), but (a) **UI payload is baked into the same decorator args** (`@uielement('ngx-decaf-crud-field', {label: 'demo.name.label'...})` in shared sources — `DemoModel.ts:35-40` — dragging Angular-family selectors into anything importing the models) and (b) **there is no backend consumer at all** (ew wires `RamAdapter` in-browser only; ionic's `provideDbAdapter` is commented out, `demo/angular/ionic/src/app/app.config.ts:19`), so "shared and tested across frontend and backend" is unproven by construction. Only ~2 of 7 models are actually consumed (`login.page.ts:45`, `dashboard.page.ts:19`); the rest rot.
- **Interface-defined handlers — missing entirely.** Exactly one handler, `LoginHandler extends EventHandler` (a concrete ui-decorators base, `demo/src/utils/handlers.ts:12-30`), consumed by DOM-coupled page code (`login.page.ts:140-145`). The one artifact pointing the right way — the framework-free `IRawQuery<M>` contract (`demo/src/utils/types.ts:11-18`) — is dead code. `FakerRepository` resolves models by `constructor.name` (`:34,36`) — minification-unsafe (§3.6).
- **Content dynamically populated from workspace + all modules' documentation — hardcoded and stale.** `ModulesData` (`demo/angular/ionic/src/app/utils/data.ts:53-146`) hand-copies **4 of ~25 modules** ("decoration, logging, utils, **reflection**" — the last not even being a workspace module), with stale paraphrases. Every module exports `workdocs/jsdocs.json`/`readme-md.json` (`npm run docs`) and a consumer page exists (`module-info.component.ts`) — **and nothing connects them**. Meanwhile the flagship demo ships: `TrustedByCompanies` template filler logos of unrelated products (`data.ts:3-24` = fake social proof), `Math.random` dashboard stats (`dashboard.page.ts:45-54`), hard-coded unlocalized Portuguese layout titles (`demo/src/layouts/Dashboard.ts:14-19`), hand-synced i18n JSON, and a **test suite that tests symbols which no longer exist** (`demo/tests/unit/ts-workspace.test.ts:1-31` imports `ChildClass/Class/complexFunction/something` — zero definitions in `demo/src`; the suite survives via `--passWithNoTests` semantics).

**Concrete step plan (each independently shippable):**
1. **Write the spec record** defining acceptance: identical model/handler sources consumed by one backend + one frontend with zero per-target edits; zero hardcoded demo content; build fails if a referenced module is not in a usable state.
2. **Fix baseline rot (P0)**: real tests over actual models; use-or-delete dead models; remove filler logos; localize `Dashboard.ts`; make `FakerRepository` registry-key-based instead of `constructor.name`.
3. **Interface-split models from UI bindings**: `demo/src/domain/` (framework-free: `@model`, validation, identity) vs `demo/src/ui-binding/` (per-target `@uielement/@uikind/@uihandlers` profile via the decoration flavour mechanism the framework already has). Acceptance: `grep ui-decorators demo/src/domain` empty, ew forms render identically.
4. **Handler contract**: `IHandler<E, C>` interface in `domain/handlers.ts` (`handle(event, ctx)` with the decaf context, not DOM); one client impl, one server impl (credential verification against a seeded backend repo) sharing one unit-test suite.
5. **Backend consumer (minimal)**: `demo/src/server/` node/for-nest app over `domain/` with `RamAdapter`/`FSAdapter`; ew gains a `--remote` mode. Smallest proof of "same source, two hosts".
6. **Generation pipeline**: `demo/scripts/generate-showcase.ts` (built via `npm run build`) reading per-module `package.json` + `workdocs/jsdocs.json` + `workdocs/4-Description.md` → typed `generated/modules.ts`; a `modules-state.json` (CI-greenness-derived) gates include/annotate/exclude = "modules only in usable states". Population at build time from generated artifacts keeps the demo self-contained.
7. **i18n derivation + wiring**: generate `assets/i18n/{en,pt}.json` from model metadata; generate the sidebar routes and dashboard cards from the same module registry.

---

## 12. integrations (1.25) — the dependency scheme fix (evidence: SAA-781 §A)

**Diagnosis: an `optionalDependencies` misuse.** Heavy per-provider SDKs sit in `optionalDependencies` — npm installs those **by default** on a consumer's plain `npm install @decaf-ts/integrations` — while the same providers are **statically imported** at the top of their submodules, so the "optional" marking is cosmetic: the subpaths cannot be imported without the SDKs anyway. Meanwhile several declared deps are **ghost** (declared, never used).

Evidence:
1. Ghost peers: `@decaf-ts/as-zod` is a non-optional peer dep (npm 7+ auto-installs for every consumer) but is **never imported in src/** (one comment reference only); `jose` is an optional peer, never imported.
2. Ghost optionals: `hashicorp-vault` (Vault is implemented over `fetch()` in `src/secrets/vault/VaultSecretService.ts`), `keycloak-admin` (Keycloak driven via axios), `onelogin-node` (never imported) — pure ghost installs.
3. Static heavy imports defeating optionality: `src/blob/s3/S3CompatibleBlobStoreService.ts:11-22`, `src/blob/gcp/GcsBlobStoreService.ts:6`, `src/blob/azure/AzureBlobStoreService.ts:12-13`, `src/blob/ipfs/IpfsBlobStoreService.ts:7`, `src/secrets/aws/AwsSecretService.ts:41`, `src/secrets/gcp/GcpSecretManagerService.ts:1-2` (which also **undeclares** a direct `@grpc/grpc-js` import — hygiene defect).
4. The correct lazy pattern **already exists internally** — `AwsSftpService.ts:84` and `Ssh2SftpService.ts:96` do guarded `await import(...)` with "run npm install <pkg>" errors — the rest of the module simply doesn't follow it.
5. Misleading optional peers: `@decaf-ts/for-nest` (+ `for-http/server`) marked optional yet statically imported under `src/nest/**` — consumers of `./nest`/`./nest/graph` need them regardless.

**Concrete scheme (the expectation codified):**
- `dependencies`: core family + `axios/acorn/acorn-walk/isolated-vm/node-fetch/uuid/tslib` (always needed by `src/index.ts`); `typescript` moves to devDependencies.
- Heavy per-provider SDKs → `peerDependencies` with `peerDependenciesMeta[].optional: true` (NOT `optionalDependencies`): aws-sdk ×3, azure ×3 (identity/keyvault/storage-blob), google-cloud ×2, `@grpc/grpc-js`, `kubo-rpc-client`, `ssh2`. **Default `npm install` on the integrations module finds none of them; a consumer who wants `@decaf-ts/integrations/blob/s3` installs `@aws-sdk/client-s3` themselves.**
- Delete ghost deps entirely (`hashicorp-vault`, `keycloak-admin`, `onelogin-node`, `jose`; make `as-zod` optional or drop).
- **Provider code goes lazy** (required so subpaths don't hard-fail): `import type` for type symbols, guarded `await import()` in `initialize()`/constructor following the existing SFTP pattern; error message names the package to install.
- CI guard: `npm ls` at the package root must show none of the provider SDKs after a plain install; per-subpath smoke test fails with the guided message when the dep is absent; dep-audit fails when an optional dep has no `import()` reference in src.
- Release as minor; re-point only affected `exports` subpaths if needed.

**Verdict: P1 consumer-facing defect (external adopters currently pull the entire cloud SDK matrix); the fix is the split above plus lazy loading, and the pattern precedent exists in-tree.**

---

## 13. for-nest (1.29) — currency analysis (evidence: SAA-781 §B)

**Verdict: current, actively maintained, and in places *ahead* of the spec it depends on.**

- Version 0.15.1, last module sync 2026-09-04 (identical cadence to siblings); all decaf deps pinned `latest`; `@nestjs/common` on `^11.1.14` (newer than integrations' `^11.0.0`).
- Consumes the current `for-http` subpath surfaces (`/server`: `DecafController`, `RequestToContextTransformer`, `AuthHandler/RequestContext` at `src/auth/DecafAuthHandler.ts:3`; `/hooks` for webhooks) — webhook models are wrapped, not duplicated (`DecafWebhookModule.ts:16-19` imports `WebhookDelivery/EventRecord/Subscription` from `for-http/hooks`).
- Early-adopts DECAF-18's `toOverrides()`/`.override()`/`.for()` idiom (`src/controllers.ts:55-66`) — ahead of the still-`Planned` spec.
- **Where it lags/diverges**: (a) a **bespoke hand-rolled request-context seed** (`src/request/contextualize.ts` re-merges `DefaultAdapterFlags` + logger + timestamp + operation + bespoke `extractIp()`) instead of the shared seed mechanism DECAF-18 centralizes — the "manual bridging" v1 §3.4 flagged, and the one live for-nest-vs-family divergence; (b) **one conflation instance**: `controllers.ts:64` passes the same `toOverrides()` payload into both `.override()` (Repository) and `.for()` (ModelService) — override data into a config channel; (c) a defensive three-way service-accessor fallback chain (`controllers.ts:57-62`) that can mask misconfiguration as default behavior.

---

## 14. with-ai (1.30) — agentic effectiveness under Paperclip (evidence: SAA-781 §C; rating 8/10)

**Assessment: high effectiveness — it is the module actually operating a live Paperclip production instance, including the session producing this report.**

- **Deployments**: compose dev stack (`docker/docker-compose.yml`: paperclip on `${PAPERCLIP_PORT:-3100}`, harness-passthrough `boot:claude|codex|opencode` scripts documenting a real compose-env footgun) plus prod parity via `docker-compose.production.yml` + `docker/production/` (Caddy, backup/restore) and a **Helm chart** (`helm/paperclip/` with values-local/minikube-ingress/aws) with resource-limit/`oom_score_adj` tuning that references live exit-137 incidents. Companion services: `company-skills-sync`, `pixel-agents` + relay, `docker-socket-proxy`, `strix-sandbox` (security dept).
- **CLI** (`decaf with-ai ...`): `mcp`, `encrypt-assets`, `install-skills`, `configure-jira-bindings`, `configure-ms365-bindings`, `configure-routines`, `configure-tool-gateways`, `generate-agent-mcp-config`, `init`, `jira-mcp-smoke`, `ensure-env-files`, `down`, `harness-login`, `install-pixel-agents`, `backup`, `restore`, `bootstrap-company`. Clean architecture rule: `src/mcp/` may not import the CLI (enforced by ESLint rule) — CLI/runtime decoupling is real.
- **MCP options**: modules `common` (server-info, file-summarizer), `jira` (23 tools), `xray` (test steps ×4), `agiletest`, `agents` (opt-in per-agent prompts). `McpClientKind = jira | xray | agiletest` — **there is no integrations preset**. The live MCP catalog (`generate-agent-mcp-config` `GLOBAL_CATALOG_NAMES`: 16 read/write servers incl. playwright/github/jira/xray/google/microsoft) is authoritative for per-agent wiring, and our current session exposes exactly the jira/xray/generated subsets predicted. Lazy per-request MCP client building means a missing Jira token degrades one server, not boot. Secrets follow the propose-don't-bake rule (DECAF-52 §6).
- **Top improvements**: (1) expose the `@decaf-ts/integrations` capability layer via MCP (blob/secrets/docker/keycloak/kibana/graph/namespaces presets with lazy clients) — largest functional gap between the agent runtime and its capability library; (2) one source of truth for per-agent MCP surface (the `--preset`-handoff vs managed-catalog catalog is two mechanisms); (3) extract incident-specific settings accumulating inline in ~20-35 KB compose files into typed env vars/profiles so the next incident edit cannot break a prior fix; (4) the template `docker/Dockerfile` does not reflect the real build product (`docker:build-base`/`build-app`) — consolidate or drop it; (5) one runbook for the agents-preset content-encryption flow (`encrypt-assets → install-skills → McpContentResolver`).

---

## 15. CLI — common-argument injection + help autogeneration design (evidence: SAA-780 §B; board-mandated extra)

**Baseline today:** two CLI families with three divergent "common args" definitions coexist: `@decaf-ts/utils` abstract `Command` (`utils/src/cli/command.ts:32`, `DefaultCommandOptions` at `constants.ts:32-62`), and commander-based `@decaf-ts/cli` whose `Command.action()` override stacks 8 options into every action (`cli/src/Command.ts:31-60`, through a wrapper whose `initCliCommand` closure is dead). The only cross-module injected common arg is `--logLevel` via `ensureLogLevelSupport` (`CliWrapper.ts:489-515`, guarded by a `WeakSet`); there are **23 literal `.option("--version", ...)` re-declarations** (`cli/src/utils-module/cli-module.ts:124-345`); help is hand-curated (`help.command.ts:11-43`) vs commander built-in; and **two incompatible log-level vocabularies ship** (`Command.ts:44` — 7 levels; `CliWrapper.ts:524` — 8 levels). ~779 of 855 `CliWrapper` lines are dispatch-independent (banner/state/provenance, per v1 §3.3.4).

**Design:**
1. **`CommandDescriptor`** as the single drop-in shape (name/summary/usage/group/module, `localArgs: Record<string, ArgSpec>`, `commonArgs` default **inherit-all**, `invalidates`, `examples`, `forward: {moduleRoot}` provenance for forwarded commands, `run`). `ArgSpec` carries typed `type/default/env/choices/requiredArg` so the env fallback and list semantics become declaration-driven.
2. **`CommonArgs` single source of truth** (`cli/src/common-args.ts`) consumed by both families: `help/version/verbose/logLevel/verbosity/logFormat/logStyle/banner/environmentFlag/format` — unifying the three divergent sets and the **one** log-level vocabulary; `DefaultCommandValues` becomes a derived map; per-command `--version` literals are retired (version resolves module root via the existing `findModuleRoot`).
3. **Injection mechanics (`CommandBuilder.fromDescriptor`)** run at module registration: effective set = locals + (commons − invalidates); one walk lowers to a commander `Command` (locals first; dedup structural, replacing `ensureLogLevelSupport` + the `Command.action()` stacking); one deterministic precedence chain **CLI flag > env > common default > local default** (generalizing the fragmentary `LoggedEnvironment.accumulate(...)` chains); forwarded commands are descriptors (the bespoke forwarder help/version/payload path collapses); banner rendering becomes a pure output-only function of the resolved `--banner`.
4. **Conflict policy: deny-with-error at registration; override via explicit `invalidates`.** A local arg re-declaring a common flag fails registration with the module path, the arg, and the remedy ("drop it, or add `invalidates: ['version']`"). Rationale: common args exist so `decaf X --logLevel` resolves through the same implementation fleet-wide; a silent shadow makes generated help lie. `invalidates` marks ownership, prints locally without the "(common · @decaf-ts/cli)" annotation, and emits one audit warn. `help`/`version` are builder interceptors resolved before `run`. Hard-deny was chosen over soft-strip because a soft-strip silently changes published modules' behavior whenever CommonArgs evolves. Forwarded out-of-tree modules get the same rule with the consuming module root named in the error.
5. **Generated help formats:** `decaf help` (grouped name|summary|module table); `decaf <cmd> --help` (locals verbatim, commons annotated with provenance, Notes auto-derived from `invalidates`, examples); `decaf help --format json` (the same registry rendered machine-readable — one truth for human and machine help); `decaf help --common`. Renderers in `cli/src/help-text/{table,command,json}.ts`, snapshot-tested.
6. **Migration map (what this deletes)**: `ensureLogLevelSupport`+WeakSet; the `Command.action()` stacker + dead `initCliCommand`; 23 `--version` literals; forwarder `OptionSpec`/`buildValueMap` literals; `printCommandHelp` hand arrays; the two level vocabularies; banner pre-print + argv sniffing. Risks: both families must consume `CommonArgs` (start with utils' already-data-shaped side); 23 help-text snapshot diffs (cosmetic); hard-deny is a minor-bump behavior change for out-of-tree modules that today shadow a common arg. **Verdict: GREEN — it deletes machinery rather than adding it.**

---

## 16. Spot evidence: for-couchdb write path + crypto under-testing (evidence: SAA-782 §B)

**for-couchdb revision/response plumbing (base adapter for for-nano):**
1. Missing `_rev` on write throws `InternalError` (`for-couchdb/src/adapter.ts:356-364`, also `updateAllPrefix` :409-410) — an optimistic-concurrency precondition surfaced as a 500-class error; callers cannot distinguish "supply a fresh rev" from a genuine bug.
2. `for-nano/src/adapter.ts:370-382` (`createAll`): CouchDB `bulk` returns HTTP 201 with **per-doc** `{ok:false, error:"conflict"}`; the guard throws one generic `InternalError` for the whole batch — no `ConflictError`, no partial-success handling, no revs reported for the docs that succeeded.
3. `:536-548` (`updateAll`): same wholesale throw; no conflict classification or retry.
4. `:615-619` (`deleteAll`): per-doc bulk-delete failures are **only logged** and the docs are returned as if deleted — false-success / data-integrity defect.
5. `parseError` (`for-couchdb/src/adapter.ts:562-565`) maps HTTP **401 into `ConflictError`** alongside 412/409 — an authentication failure misclassified as a concurrency conflict (security-relevant classification defect).
6. Meta: no optimistic-concurrency retry/merge policy exists anywhere in the CouchDB write path (the only retry is the changes-feed reconnect, `for-nano/src/NanoDispatch.ts:242`).

**crypto under-testing (5 test files / 38 source files):** untested security-critical surfaces named — `integration/services/JwtService.ts` (**0 tests**; clock-tolerance + remote-verify + env parsing live untested; only low-level `jwt/sign|verify` covered), the four platform adapter classes (`node|browser × Subtle|Crypto`, 0 tests; node/browser divergence ships silently), `node/pbkdf2.ts` (security parameters `iterations=150k, dkLen=32, salt` indirectly covered only), `overrides/ModelBuilderExtensions.ts` (19-line test asserting a marker, not behavior), `@encrypt/@decrypt` hook wiring/error paths (integration-only, indirect). The suite is dominated by CLI tests (`cli.test.ts` 1,023 lines). Priority follow-up: a dedicated crypto test issue starting with JwtService and the platform adapters.

---

## 17. Framework rating (adversarial on gaps)

**Overall: 6.8/10 as a pre-production enterprise framework — architecturally ambitious and genuinely differentiated, with correctness debt concentrated in the seams (lifecycle, async, identity, publication).**

- **Architecture & concept (9/10):** the flavor/decorator/Context model, the shared-type discipline now shipped by DECAF-50, capability-layer integrations, and with-ai as a proving ground are a real moat. The decorator-first query-handler direction (§5.5) is exactly where this should go.
- **Correctness (5.5/10) — the adversary's view:** the exploitable/incorrect seams are production-relevant *today-shaped*: webhooks' broken dead-letter + SSRF + plaintext secret replication; unauthenticated-by-default SSE broadcast with client-controlled subscription identity; `deleteAll` false-success; 401-as-Conflict; two observable metadata-timing divergences (compare vs validate; microtask-scheduled application); broken surfaced APIs (`eventHeaderResolver` never invoked; `NgxTranslateService.translate` always rejects; TRIGGER-mode events with no listener). None of these require exotic conditions to hit — exactly what the minification/id hazard also looks like once a build minifier is encountered in the PTP/PLA pharmaceutical context.
- **Reliability/observability (5/10):** console-first sink with ignored `transports`, no async-context correlation, silent pipeline error swallowing, bypassing `console.*` in five upper modules, event loops that retry silently forever (HTTP events) or strand state (webhooks PROCESSING).
- **Testing posture (5/10):** strong unit cultures in utils/core/nano; but crypto (5 files/38), ui-decorators (18/12k LoC), for-angular (16/56k LoC), driver-matrix coverage, 36 skipped typeorm tests, dead-code unit suites, and a flagship demo with a test suite testing nonexistent symbols.
- **Packaging/Dx (6/10):** integrations' SDK bloat on default install; utils' dead heavy runtime deps; `latest` family version pins; missing publication surfaces (for-angular graph entry; model/validation subpaths).
- **Documentation (7/10):** the workdocs/jsdocs pipeline is real and every module has it; the gap is consumption (demo hardcodes 4/25 modules) and under-documented invariants (mirror gate, rawBody requirement, forkJoin contract of the i18n loader).

**What carries real adoption risk:** the cumulative identity/registry/decoration fragility (§3), because it is invisible until a consumer does an unorthodox import order or minifies; and the i18n/locale absence for any multilingual enterprise deployment — which the PTP/PLA context (Portuguese-market pharma) will hit in production.

## 18. Adoption estimate

- **Internal paperclip context (PTP/PLA pharma on decaf): ~85%** — already committed, with-ai proves operability in production; the blockers here are engineering-debt management, not fit. Identity-id migration (§3.6) and webhook hardening (§7.6) are the pre-mandatory list for anything regulated/pharma-grade (audit trails, secrets-at-rest, ordering guarantees are all currently absent or broken).
- **External Node/TS teams needing adapter-of-adapters persistence: ~50-60% within 12 months** if the P1 list below lands; the strongest pull factors are the decoration-flavor model (write-once models across CouchDB/TypeORM/Fabric), relations + query story, and the documented module family. The friction factors external adopters hit first are (a) default-install bloat via integrations (§11), (b) the console-only logging sink (§1.3), (c) the import-order/decoration cold-start strips (§3.2), which produce TypeErrors without actionable messages.
- **Enterprise web+mobile multi-client (Angular/Ionic/React) teams: ~40%** until the locale service and SSR behavior (§8) and the for-angular graph/lib exports (§10) exist; the UI stack is the differentiator here but the reliability gaps are exactly where these teams measure first.
- **Not-yet-budgeted: graph on masta.si** — the contract for re-implementing integrations' execution engine elsewhere should be authored *before* the engine grows further, otherwise adoption of the graph surface forks permanently between decaf consumers and masta.si consumers.

## 19. Ranked next steps (beyond the already-mocked upcoming modules)

Ranked by risk-reduction / effort ratio in the paperclip production context; P0 = do before the next external release, P1 = this quarter, P2 = planning horizon.

1. **P0 — Webhook remediation suite** (§7.6 steps 1-4): dead-letter fix, atomic claim, timestamp-bound signature, secret removal from delivery rows + secrets-integration storage. Follow-up: SSRF/IDOR fixes via from-model route gating. *Unblocks enterprise pharma usage of the events surface.*
2. **P0 — SSE/events correctness pass** (§6.5 + §6.4): call the dead `eventHeaderResolver`; make broadcast require explicit opt-in; bind subscription identity to an authenticated principal; connector reconnect/hconfig surface + close-reliability fixes.
3. **P0 — Model identity tokens** (§3.6): decorator-time id + ctor-handle in-process identity + legacy anchor map + minified-CI gate. Asserts the framework never depends on non-minified builds — a categorical production-band blocker for the PTP/PLA deployments.
4. **P1 — Logging sink/correlation** (§1.3): transport interface, `AsyncLocalStorage` correlation, console-bypass cleanup, child-config fix. Cheap, high leverage for observability in every upper layer.
5. **P1 — integrations dependency scheme** (§12) + **utils dep hygiene** (§2): the "installs by default, consumers opt in" expectation; releases adopter friction and CD cost.
6. **P1 — Webhook/events DLQ & ordering contract** finishing (§7.4 gaps), plus for-typeorm event realness (LISTEN consumer, awaited subscription, delete ids, configurability — §9.5).
7. **P1 — for-couchdb/nano conflict semantics** (§16): `ConflictError` classification, partial-bulk handling, delete false-success fix, 401 re-classification, optional write-retry policy.
8. **P1 — Locale service implementation** (§8.3): `DecafLocaleService` + per-resource loader + SSR guards; prerequisite for the pharma multilingual deployments.
9. **P1 — Decoration standalone fixes** (§3.5 items 1/2/7/8) before or with the FSM refactor; plus duck-typing hardening in `isContextLike`.
10. **P2 — Registry/overrides migration plan** (§4) and `Metadata.extend`/`seal` — do behind the current API; monkey-patch elimination first (steps 1-3).
11. **P2 — Query-operation handlers** (§5.5) — the largest contract change; stage behind the metadata handshake; schedule with adapter owners.
12. **P2 — demo/dukts reset** (§11): spec record first, then the 7-step plan; the demo is the adoption showcase — as long as it contains fake logos and dead tests, external adoption estimates over-promise.
13. **P2 — CLI CommonArgs/help generation** (§15) after the family stabilizes; start from the utils family.
14. **P2 — Test-debt burns**: cryptoJwtService/platform adapters (§16); for-typeorm fixture matrix + un-skip-or-delete (§9.2); ui-decorators/for-angular coverage ratio.
15. **P2 — masta.si graph contract** + for-angular `./graph` secondary entry (§10), closing the graph boundary between framework and future driver.

**Recommended immediate delegate set** (from the CTO bench, one issue each): Back-End Developer → webhooks claim/dead-letter + secrets strip; Security Engineer → SSRF/IDOR/secret-exposure review of the from-model webhook routes; Back-End Developer → for-http eventHeaderResolver + connector lifecycle; Back-End Developer → model-identity-token MVP (§3.6 steps 1-3 + CI minify gate); Back-End Developer → logging transport/correlation MVP; Front-End Developer → DecafLocaleService skeleton; DevOps Engineer → integrations deps + npm-ls CI guard.

---

## 20. Appendix: specialist evidence pointers

- [SAA-773]((/SAA/issues/SAA-773) logging deep dive (~§1).
- [SAA-774]((/SAA/issues/SAA-774) db-decorators context/query-op (~§5).
- [SAA-775]((/SAA/issues/SAA-775) for-http events (~§6).
- [SAA-776]((/SAA/issues/SAA-776) webhooks (~§7).
- [SAA-777]((/SAA/issues/SAA-777) for-angular locale (~§8).
- [SAA-778]((/SAA/issues/SAA-778) for-typeorm (~§9).
- [SAA-779]((/SAA/issues/SAA-779) decorator-validation/decoration/registry/overrides/minification (~§3, §4).
- [SAA-780]((/SAA/issues/SAA-780) dukts + CLI design (~§11, §15).
- [SAA-781]((/SAA/issues/SAA-781) integrations deps, for-nest, with-ai (~§12, §13, §14).
- [SAA-782]((/SAA/issues/SAA-782) graph/ui layout + for-couchdb/crypto spot (~§10, §16).

*End of v2 report. v1 remains in-tree at `report/DECAF_FRAMEWORK_REVIEW.md` as historical draft; this file supersedes it.*
