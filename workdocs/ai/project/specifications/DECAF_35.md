# DECAF-35: Graph Metadata/Engine Split for Frontend/Backend Boundary

**Status:** Planned
**Priority:** High
**Owner:** decaf-dev

## 1. Overview

The graph system currently lives in a single subpath export, `@decaf-ts/integrations/graph`, which ships both the **node metadata** (declarations consumed by the Angular frontend for rendering, palette, and CRUD forms) and the **execution engine** (planner, executors, registry, store, pinning, validation, NestJS module) in one bundle. There is no hard boundary preventing a frontend consumer from importing the engine — and the for-angular demo currently imports `GraphExecutionEngine`, `ForeachGraphNodeExecutor`, `WhileGraphNodeExecutor`, and `UntilGraphNodeExecutor` directly into the browser bundle.

This is wrong: the engine and its future backend dependencies (DB adapters, `isolated-vm` via the Code Node sandbox contract, Mastra composition in ALFRED) must never ship to the frontend. Only the node metadata (the `@node`-decorated classes, their `@input`/`@output`/`@connection` ports, `@uielement` CRUD fields, `GraphNode.applyMetadata()`, category styles, and the shared pure types/enums) is frontend-safe.

This specification splits `integrations/src/graph/` into two subpath exports:

| Export | Consumed by | Contents |
|:---|:---|:---|
| `@decaf-ts/integrations/graph/shared` | for-angular, any TS frontend | Node classes, `GraphNode` base, category styles, shared types/enums, `Metadata.nodes()` accessor |
| `@decaf-ts/integrations/graph` | for-nest, brain, ALFRED backend, tests | Everything in `./shared` **plus** the engine, executors, registry, planner, store, pinning, validation, NestJS module |

The split follows the existing `integrations` subpath convention (`./secrets/aws`, `./blob/s3`, `./blob/local`, etc.). The frontend is whitelisted via ESLint `no-restricted-imports` to import **only** `@decaf-ts/integrations/graph/shared`; importing the full `./graph` is a lint error → build error. The boundary becomes enforced, not conventional.

### 1.1 Goals of the split

1. **Hard frontend/backend boundary.** The frontend bundle can never transitively pull the engine, its executors, or any future backend dependency.
2. **Single source of truth for node metadata.** Node classes live in `shared/` and are imported by both sides; types are not duplicated.
3. **Developer-first authoring unchanged.** A node author still writes one `@node`-decorated class with `@input`/`@output`/`@connection`/`@uielement`/`applyMetadata()` in one file. A backend executor author still writes a kind-keyed `GraphNodeExecutor` implementation.
4. **No engine rewrite.** Engine code moves directory; it is not refactored. The runtime behaviour is identical.

### 1.2 Non-goals

- Rewriting the engine, planner, or executors.
- Changing the `@node`/`@input`/`@output`/`@connection` decorator API surface (owned by `@decaf-ts/ui-decorators/graph`). The `@node` decorator gains a registry side-effect (see §4.4) but its call signature is unchanged.
- Implementing the Code Node sandbox (brain-resident; unaffected).
- Migrating the ALFRED compiler (lives in ALFRED-5; unaffected).

## 2. Goals

* [ ] Split `integrations/src/graph/` into `shared/` (frontend-safe) and `engine/` (backend-only) subtrees.
* [ ] Add `@decaf-ts/integrations/graph/shared` subpath export in `integrations/package.json`.
* [ ] `@decaf-ts/integrations/graph` re-exports `./shared` plus the engine (backend convenience unchanged).
* [ ] All shared types (`SwitchNodeMetadata`, `SwitchCase`, `SwitchCaseCondition`, `ConditionExpression`, `CodeCondition`, `ExprValue`, `NodeMetadataChange`) live in `shared/types.ts`.
* [ ] All shared enums (`GraphExecutionEventType`, `GraphExecutionStatus`) live in `shared/constants.ts`.
* [ ] `@node` decorator registers each class in a node registry (alongside its existing per-class `GraphKeys.NODE` metadata); `Metadata.nodes()` accessor added via the `ui-decorators` override so consumers can discover all `@node`-decorated classes without a hand-maintained array. See §4.4.
* [ ] `@graph` decorator registers each workflow-root class in a workflow registry (alongside its existing per-class `GraphKeys.GRAPH` metadata); `Metadata.workflows()` accessor added via the same override, mirroring `Metadata.nodes()`. See §4.4.
* [ ] ESLint `no-restricted-imports` rule in for-angular forbidding `@decaf-ts/integrations/graph` (full) and `@decaf-ts/integrations/graph/*` except `./shared`.
* [ ] All for-angular production imports repointed to `@decaf-ts/integrations/graph/shared`.
* [ ] In-browser demo executors (`graph-demo-executors.ts`, `GraphExecutionService`, `GraphExecutionEventSubjectObserver`, `GraphExecutionStateMapper.spec.ts`) quarantined to a dev-only entry or migrated to the NestJS SSE backend (TASK-224/226).
* [ ] All existing graph tests (116) continue to pass; lint clean; build clean.

## 3. User Stories / Requirements

* **US-1:** As a frontend developer, I want to import node classes, types, and enums from `@decaf-ts/integrations/graph/shared` so I can render the palette, node templates, and CRUD forms without pulling the engine into my browser bundle.
* **US-2:** As a backend developer, I want to import the engine, executors, and registry from `@decaf-ts/integrations/graph` so I can build and execute workflows server-side without worrying about frontend code accidentally depending on my internals.
* **US-3:** As a node author, I want to write a single `@node`-decorated class in one file and have both the frontend and backend consume it, so I don't duplicate declarations.
* **US-4:** As a security reviewer, I want the frontend/backend boundary to be a build error (lint + exports map), not a convention, so a misimport cannot ship the engine to browsers.
* **Req-1:** The `@decaf-ts/integrations/graph/shared` export MUST NOT transitively depend on the engine, executors, store, pinning, validation, NestJS module, or any backend-only dependency.
* **Req-2:** The `@decaf-ts/integrations/graph` export MUST re-export everything from `./shared` so backend consumers see a single import surface.
* **Req-3:** Node class source code MUST NOT change — only its file location (`graph/nodes/` → `graph/shared/nodes/`).
* **Req-4:** `GraphNode.applyMetadata()` MUST remain on the node class in `shared/` because the frontend needs it to compute Switch's dynamic ports without a backend round-trip. It is pure computation with no engine dependency.
* **Req-5:** Shared types and enums MUST live in `shared/` and be imported by both sides. Engine-private types MUST live in `engine/` and not be re-exported from `shared/`.
* **Req-6:** for-angular production code MUST be unable to import `@decaf-ts/integrations/graph` (full) — enforced by ESLint `no-restricted-imports` with an allow-list for `./shared`.
* **Req-7:** The in-browser demo executors MUST either (a) be removed in favour of the NestJS SSE backend (TASK-224/226), or (b) be quarantined to a dev-only entry that is excluded from the production bundle.
* **Req-8:** All 116 existing graph tests MUST continue to pass after the split.
* **Req-9:** The `@node` decorator MUST register each decorated class in a node registry so `Metadata.nodes()` can return all `@node`-decorated constructors without a hand-maintained array. This follows the existing `Metadata.flavouredAs(flavour): Constructor[]` pattern (`decoration/src/metadata/Metadata.ts:230`) and the `Injectables.services()` pattern (`injectable-decorators/src/Injectables.ts`). See §4.4.
* **Req-10:** The `@graph` decorator MUST register each decorated workflow-root class in a workflow registry so `Metadata.workflows()` can return all `@graph`-decorated constructors. Same pattern as `Metadata.nodes()`. See §4.4.

## 4. Architecture & Design

### 4.1 Directory layout

Current:

```
integrations/src/graph/
  index.ts               ← exports everything (metadata + engine)
  constants.ts           ← mixed: shared enums + engine-private constants
  types.ts               ← mixed: shared types + engine-private types
  decorators.ts          ← engine-private (pinnable)
  nodes/                 ← frontend-safe (moves to shared/)
    base.ts  category-styles.ts  triggers.ts  flow-control.ts  agent.ts  index.ts
  execution/  registry/  store/  planning/  validation/  loops/
  pinning/  snapshots/  errors/  events/
```

After:

```
integrations/src/graph/
  shared/                ← frontend-safe  →  "@decaf-ts/integrations/graph/shared"
    index.ts
    constants.ts         ← SHARED enums only: GraphExecutionEventType, GraphExecutionStatus
    types.ts             ← SHARED pure types: SwitchNodeMetadata, SwitchCase,
    │                       SwitchCaseCondition, ConditionExpression, CodeCondition,
    │                       ExprValue, NodeMetadataChange
    nodes/
      base.ts            ← GraphNode.applyMetadata()  (pure computation)
      category-styles.ts
      triggers.ts
      flow-control.ts
      agent.ts
      index.ts
  engine/                ← backend-only   →  "@decaf-ts/integrations/graph"
    index.ts             ← re-exports ../shared + all engine modules
    constants.ts         ← engine-private constants (GRAPH_WORKFLOW_BOUNDARY, defaults, etc.)
    types.ts             ← engine-private types (GraphRunId, GraphExecutionOptions, etc.)
    decorators.ts        ← @pinnable
    execution/  registry/  store/  planning/  validation/  loops/
    pinning/  snapshots/  errors/  events/
  index.ts               ← re-exports ./engine (which re-exports ./shared)
```

### 4.2 `package.json` exports

Add one entry mirroring the existing subpath convention:

```json
"./graph/shared": {
  "import": {
    "types": "./lib/types/graph/shared/index.d.mts",
    "default": "./lib/esm/graph/shared/index.js"
  },
  "require": {
    "types": "./lib/types/graph/shared/index.d.cts",
    "default": "./lib/cjs/graph/shared/index.cjs"
  },
  "default": "./lib/esm/graph/shared/index.js"
}
```

The existing `"./graph"` entry stays, pointing at `./lib/.../graph/index.js` which now re-exports `./engine` (which re-exports `./shared`). Backend consumers see no API change.

### 4.3 Type/constant partition

`graph/types.ts` currently mixes shared and engine-private types. Partition:

**Move to `shared/types.ts`** (frontend needs them for rendering/CRUD):

- `ExprValue`, `ConditionExpression`, `CodeCondition`, `SwitchCaseCondition` — the ConditionExpression DSL (DECAF-32 §22.3); consumed by the for-angular `ConditionEditorComponent`.
- `SwitchCase`, `SwitchNodeMetadata` — Switch node metadata; consumed by `SwitchFlowNode.applyMetadata()` and the for-angular switch-edit modal.
- `NodeMetadataChange` — the `{ ports, size, dataPatch }` contract between node class and renderer; consumed by `GraphNodeTemplateComponent.applyNodeMetadata()`.
- Any re-export of `GraphNodeDefinition`, `GraphPortDefinition`, `GraphWorkflowDefinition` from `@decaf-ts/ui-decorators/graph` (already frontend-safe).

**Keep in `engine/types.ts`** (engine-private):

- `GraphRunId`, `GraphWorkflowId`, `GraphNodeId`, `GraphPortName`, `GraphExecutionValues`, `GraphExecutionOptions`, `GraphExecutionResult`, `GraphExecutionEvent`, `GraphExecutionContext`, `GraphNodeExecutor`, `GraphValueKey`, `GraphCachedValue`, etc.

`graph/constants.ts` partitions similarly:

**Move to `shared/constants.ts`:**

- `GraphExecutionStatus` enum (frontend renders execution state — running/succeeded/failed/cached/pinned).
- `GraphExecutionEventType` enum (frontend `GraphExecutionStateMapper` maps events to UI state).

**Keep in `engine/constants.ts`:**

- `GRAPH_WORKFLOW_BOUNDARY`, `GRAPH_DEFAULT_CONCURRENCY`, `GRAPH_DEFAULT_MAX_LOOP_ITERATIONS`, `GRAPH_DEFAULT_MAX_FOREACH_ITERATIONS`, `GRAPH_PINNING_METADATA_KEY`, and any other engine-private constants.

### 4.4 Node and workflow discovery via `Metadata.nodes()` / `Metadata.workflows()` (no hand-maintained arrays)

The original draft of this spec proposed an `ALL_GRAPH_NODES` constant array in `shared/catalogue.ts`. That was wrong: it would be a second source of truth alongside the `@node` decorator, requiring manual updates every time a node class is added or removed.

The decaf pattern is already established:

- `Metadata.flavouredAs(flavour): Constructor[]` (`decoration/src/metadata/Metadata.ts:230`) returns all classes decorated with `@flavour(...)` for a given flavour.
- `Injectables.services()` (`injectable-decorators/src/Injectables.ts`) returns all registered injectable services.
- `Metadata.registeredFlavour(model): string | undefined` (`decoration/src/metadata/Metadata.ts:234`) reverse-looks-up a class.

This spec follows the same pattern for graph nodes **and** workflow roots. All graph-related override code lives exclusively under `ui-decorators/src/graph/overrides/` (graph code stays in the graph folder; the existing `ui-decorators/src/overrides/` is for model/UI overrides, not graph).

#### 4.4.1 Registry module

A new module-level registry `ui-decorators/src/graph/registry.ts` maintains two `Set<Constructor>` buckets (one for nodes, one for workflows). The `@node` and `@graph` decorators call `registerNode(target)` / `registerWorkflow(target)` as a side-effect after setting per-class metadata. The registry exposes `graphNodes()` / `graphWorkflows()` accessors (returning fresh arrays) and a `resetGraphRegistries()` helper for tests. Idempotent — re-decorating the same class does not duplicate the entry.

#### 4.4.2 `@node` / `@graph` decorator side-effects

The `@node` decorator (`ui-decorators/src/graph/decorators.ts`) gains a `registerNode(target as Constructor)` call inside `innerNode` after the existing `apply(...)`; the `@graph` decorator gains a `registerWorkflow(target as Constructor)` call inside `innerGraph` after the existing `apply(...)`. Decorator call signatures are unchanged.

#### 4.4.3 `Metadata.nodes()` / `Metadata.workflows()` via declaration merging

The `Metadata` class in `@decaf-ts/decoration` has a `private constructor()`, so it **cannot be subclassed**. The decaf override pattern (used by `core`, `decorator-validation`, `transactional-decorators`) is TypeScript **declaration merging** + runtime attachment:

**`ui-decorators/src/graph/overrides/Metadata.ts`** — namespace augmentation declaring the new static methods:

```ts
import "@decaf-ts/decoration";
import type { Constructor } from "@decaf-ts/decoration";

declare module "@decaf-ts/decoration" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Metadata {
    function nodes(): Constructor[];
    function workflows(): Constructor[];
  }
}
```

**`ui-decorators/src/graph/overrides/overrides.ts`** — runtime attachment of the implementations (appended to the existing file that already attaches `RenderingEngine.prototype.renderAsNode`):

```ts
import { Metadata } from "@decaf-ts/decoration";
import { graphNodes, graphWorkflows } from "../registry";

(Metadata as any).nodes = function nodes(): any[] {
  return graphNodes();
}.bind(Metadata);

(Metadata as any).workflows = function workflows(): any[] {
  return graphWorkflows();
}.bind(Metadata);
```

**`ui-decorators/src/graph/overrides/index.ts`** — side-effect import + re-export (appended to the existing barrel):

```ts
import "./Rendering";
export * from "./overrides";
export * from "./Metadata";
```

**`ui-decorators/package.json` `sideEffects`** — the existing array already lists `./lib/esm/graph/overrides/index.js`, `./lib/esm/graph/overrides/overrides.js`, and the CJS equivalents. No change needed — bundlers (webpack, esbuild, vite) preserve the side-effect imports so the runtime attachments run before any consumer code.

#### 4.4.4 Consumer usage

Consumers import `Metadata` from `@decaf-ts/decoration` (or `@decaf-ts/ui-decorators` which re-exports it). Because the graph overrides are side-effect-imported by `ui-decorators/src/graph/index.ts`, any consumer that imports anything from `@decaf-ts/ui-decorators/graph` automatically gets `Metadata.nodes()` / `Metadata.workflows()` available on the class:

```ts
import { Metadata } from "@decaf-ts/decoration";
import "@decaf-ts/ui-decorators/graph"; // side-effect: attaches nodes()/workflows()

const allNodes = Metadata.nodes();        // all @node-decorated constructors
const allWorkflows = Metadata.workflows(); // all @graph-decorated constructors
```

No `ALL_GRAPH_NODES` / `ALL_GRAPH_WORKFLOWS` constants. The frontend builds the palette, `NODE_TEMPLATE_MAP` (kind → component), and CRUD form schemas by calling `Metadata.nodes()` and `graphDefinitionOf()` (from `@decaf-ts/ui-decorators/graph`) on each constructor. Workflow-root discovery uses `Metadata.workflows()` and `graphWorkflowDefinitionOf()`. No engine import, no hand-maintained arrays.

#### 4.4.5 Test coverage

Unit tests in `ui-decorators/tests/unit/graph.test.ts` assert:
- `Metadata.nodes()` returns all `@node`-decorated constructors after import.
- `Metadata.workflows()` returns all `@graph`-decorated constructors after import.
- Re-decorating the same class does not duplicate registry entries.
- Each returned entry is a constructor function.

Tests fail if a new node/workflow is added but not decorated, or if the registry side-effect breaks.

#### 4.4.6 Why this pattern

The `Metadata` class is the canonical metadata accessor in decaf. Every module that adds a new metadata category (`db-decorators`, `core`, `transactional-decorators`, `injectable-decorators`) extends it via the declaration-merging + runtime-attachment pattern. Adding `Metadata.nodes()` / `Metadata.workflows()` is consistent with `Metadata.flavouredAs()`, `Metadata.tasks()` (core), `Metadata.validationFor()` (decorator-validation), and `Injectables.services()` (core override). Standalone arrays or subclassing would be foreign patterns (subclassing is impossible — `Metadata` has a private constructor).

#### 4.4.7 Upstream location

All code for this feature lives in `@decaf-ts/ui-decorators/graph` (already a frontend-safe package):
- `ui-decorators/src/graph/registry.ts` — new registry module.
- `ui-decorators/src/graph/decorators.ts` — `@node`/`@graph` gain registry side-effects.
- `ui-decorators/src/graph/overrides/Metadata.ts` — new namespace augmentation.
- `ui-decorators/src/graph/overrides/overrides.ts` — runtime attachments (appended to existing file).
- `ui-decorators/src/graph/overrides/index.ts` — re-export (appended to existing barrel).

No `integrations` change is needed for this feature — the `shared/` subtree just re-exports `Metadata` from `@decaf-ts/ui-decorators`. The node classes in `shared/nodes/` are decorated with `@node` so they auto-register on import; workflow-root classes decorated with `@graph` auto-register likewise.

### 4.5 Backend executor authoring (unchanged)

A backend executor author writes:

```ts
import type { GraphNodeExecutor } from "@decaf-ts/integrations/graph";
// The kind constant is shared metadata; the interface is engine-private.
import { GRAPH_DEFAULT_CONCURRENCY } from "@decaf-ts/integrations/graph";

class IfFlowExecutor implements GraphNodeExecutor {
  readonly kind = "core.flow.if";
  async execute(ctx) { /* ... */ }
}
```

The registry stays kind→executor. The executor imports the `GraphNodeExecutor` interface from `./graph` (engine) and the `core.flow.if` *kind string* is read from the node definition at registration time — no import of the `IfFlowNode` class itself is required by the executor.

### 4.6 ESLint boundary enforcement (for-angular)

Add to for-angular's ESLint config:

```json
{
  "no-restricted-imports": ["error",
    {
      "patterns": ["@decaf-ts/integrations/graph/*"],
      "allow": ["@decaf-ts/integrations/graph/shared"]
    },
    "@decaf-ts/integrations/graph"
  ]
}
```

The first rule blocks any `./graph/*` subpath except `./shared`. The second blocks the bare `@decaf-ts/integrations/graph` import (which would pull the full engine). Together they make the boundary a lint error.

### 4.7 for-angular demo executor quarantine

The following files currently import the engine into the for-angular bundle:

- `for-angular/src/graph/execution/graph-demo-executors.ts` — instantiates `ForeachGraphNodeExecutor`, `WhileGraphNodeExecutor`, `UntilGraphNodeExecutor`, registers demo `math.add`/`math.multiply` executors, builds a `GraphNodeExecutorRegistry`.
- `for-angular/src/graph/execution/GraphExecutionService.ts` — wraps `GraphExecutionEngine`, exposes `execute()` returning an RxJS `Observable`.
- `for-angular/src/graph/execution/GraphExecutionEventSubjectObserver.ts` — bridges `GraphExecutionObserver` events to an RxJS `Subject`.
- `for-angular/src/graph/execution/GraphExecutionStateMapper.spec.ts` — unit test importing `GraphExecutionEventType`.

Two paths, decided per TASK-3:

**(a) Migrate to SSE backend (preferred for production):** The graph page calls `POST /graph/execute` on the NestJS `GraphExecutionModule` (TASK-224, already built) and consumes `/graph/events` via `ServerEventConnector` (TASK-226, already built). `GraphExecutionService` becomes an HTTP/SSE client; `GraphExecutionEventSubjectObserver` is replaced by `ServerEventConnector` + an RxJS `Subject`. The in-browser engine and demo executors are deleted.

**(b) Quarantine to dev-only entry:** If the SSE migration is too large for this spec, move `graph-demo-executors.ts` + the engine-using `GraphExecutionService`/`GraphExecutionEventSubjectObserver` into a `for-angular/src/graph/execution-dev/` directory excluded from the production build (e.g. a separate Angular configuration or lazy-loaded dev route). Add a separate ESLint override for that directory allowing `@decaf-ts/integrations/graph`. The production bundle never includes these files.

Either way, `GraphExecutionStateMapper` (pure event → UI state mapping) and `GraphExecutionStateMapper.spec.ts` stay in production code — they import only `GraphExecutionEventType` from `./shared`.

### 4.8 What does NOT change

- Node class source code (`@node`, `@input`, `@output`, `@connection`, `@model()`, `@required`, `@uielement`, `applyMetadata()`) — only relocated `graph/nodes/` → `graph/shared/nodes/`.
- `@decaf-ts/ui-decorators/graph` (the `@node`/`@input`/`@output`/`@connection` decorators) — already frontend-safe, untouched.
- Code Node sandbox (`isolated-vm`/`acorn`/`typescript`) — already brain-resident, never in `integrations`. This refactor protects that boundary.
- NestJS `GraphExecutionModule` (TASK-224) — imports from `./graph` (engine); unaffected.
- Full-stack e2e tests (TASK-226) — import from `./graph` (engine); unaffected.
- Engine runtime behaviour — code moves directory, isn't rewritten.

## 5. Tasks Breakdown

This specification is broken down into the following tasks.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| TASK-230 | Split `integrations/src/graph/` into `shared/` and `engine/` subtrees, partition types/constants, add `./graph/shared` export. Add `@node`/`@graph` registry side-effects and `Metadata.nodes()` / `Metadata.workflows()` accessors in `ui-decorators/graph` (see §4.4) | High | Pending | — |
| TASK-231 | Add ESLint `no-restricted-imports` boundary in for-angular and repoint all production imports to `@decaf-ts/integrations/graph/shared` | High | Pending | TASK-230 |
| TASK-232 | Quarantine or migrate the in-browser demo executors (`graph-demo-executors.ts`, `GraphExecutionService`, `GraphExecutionEventSubjectObserver`) out of the production bundle | High | Pending | TASK-231 |
| TASK-233 | Verify all 116 graph tests pass, lint clean, build clean, for-angular production bundle contains no engine code | Medium | Pending | TASK-232 |

### TASK-230 — Split graph package into `shared/` and `engine/`

1. Create `integrations/src/graph/shared/` and `integrations/src/graph/engine/` directories.
2. Move `graph/nodes/` → `graph/shared/nodes/` (no source changes; update internal import paths only).
3. Partition `graph/types.ts`:
   - Move `ExprValue`, `ConditionExpression`, `CodeCondition`, `SwitchCaseCondition`, `SwitchCase`, `SwitchNodeMetadata`, `NodeMetadataChange` → `shared/types.ts`.
   - Keep engine-private types (`GraphRunId`, `GraphExecutionOptions`, `GraphExecutionResult`, `GraphExecutionEvent`, `GraphExecutionContext`, `GraphNodeExecutor`, `GraphValueKey`, `GraphCachedValue`, etc.) → `engine/types.ts`.
   - Engine types that reference shared types import from `../shared`.
4. Partition `graph/constants.ts`:
   - Move `GraphExecutionStatus`, `GraphExecutionEventType` enums → `shared/constants.ts`.
   - Keep `GRAPH_WORKFLOW_BOUNDARY`, `GRAPH_DEFAULT_*`, `GRAPH_PINNING_METADATA_KEY` → `engine/constants.ts`.
5. Move `graph/decorators.ts` (`@pinnable`) → `engine/decorators.ts`.
6. Move all engine modules: `execution/`, `registry/`, `store/`, `planning/`, `validation/`, `loops/`, `pinning/`, `snapshots/`, `errors/`, `events/` → `engine/` (update internal import paths).
7. (Upstream `ui-decorators/graph`) Add registry side-effect to `@node` decorator: after setting per-class `GraphKeys.NODE` metadata, append the constructor to the node registry keyed by `GraphKeys.NODE` (mirroring `@flavour`'s registry population). Decorator call signature unchanged.
8. (Upstream `ui-decorators/graph`) Add registry side-effect to `@graph` decorator: after setting per-class `GraphKeys.GRAPH` metadata, append the constructor to the workflow registry keyed by `GraphKeys.GRAPH`. Same mechanism as `@node`; call signature unchanged.
9. (Upstream `ui-decorators/graph`) Create `ui-decorators/src/overrides/Metadata.ts` extending base `Metadata` with `static nodes(): Constructor[]` and `static workflows(): Constructor[]` reading the two registries. Re-export from `ui-decorators/src/overrides/index.ts`.
10. Create `shared/index.ts` re-exporting `./constants`, `./types`, `./nodes`, and re-exporting `Metadata` (with `nodes()` + `workflows()`) from `@decaf-ts/ui-decorators`.
11. Create `engine/index.ts` re-exporting `../shared` plus all engine modules.
12. Update `graph/index.ts` to re-export `./engine` (which re-exports `./shared`).
13. Add `"./graph/shared"` entry to `integrations/package.json` `exports`.
14. Update all internal `integrations` imports (nest module, tests) to use the new paths.
15. Add unit tests asserting (a) `Metadata.nodes()` returns exactly the `@node`-decorated constructors from `shared/nodes/` after importing them, and (b) `Metadata.workflows()` returns exactly the `@graph`-decorated workflow-root constructors after importing them. Tests fail if a new node/workflow is added without the decorator or if the registry side-effect breaks.
16. Run `npm run build`, `npm run lint`, `npm run test` in `integrations` and `ui-decorators`; fix any broken import paths.

**Acceptance:** `@decaf-ts/integrations/graph/shared` resolves and exports only node classes, `GraphNode`, category styles, shared types/enums, and `Metadata` (with `nodes()` + `workflows()` accessors). `Metadata.nodes()` returns all `@node`-decorated constructors; `Metadata.workflows()` returns all `@graph`-decorated constructors — both with no hand-maintained arrays. `@decaf-ts/integrations/graph` re-exports everything (backend convenience). All 116 graph tests pass; ui-decorators tests pass.

### TASK-231 — ESLint boundary + repoint for-angular imports

1. Add `no-restricted-imports` rule to for-angular ESLint config forbidding `@decaf-ts/integrations/graph` (bare) and `@decaf-ts/integrations/graph/*` except `./shared`.
2. Repoint all for-angular production imports:
   - `SwitchNodeMetadata`, `SwitchCase`, `SwitchCaseCondition`, `ConditionExpression`, `CodeCondition`, `ExprValue`, `NodeMetadataChange` → `@decaf-ts/integrations/graph/shared`.
   - `GraphExecutionEventType` (used by `GraphExecutionStateMapper`) → `@decaf-ts/integrations/graph/shared`.
3. Leave the demo executor files (`graph-demo-executors.ts`, `GraphExecutionService.ts`, `GraphExecutionEventSubjectObserver.ts`, `GraphExecutionStateMapper.spec.ts`) importing from `@decaf-ts/integrations/graph` (full) — they are handled by TASK-232. Add a temporary ESLint override for those files so lint passes until TASK-232 lands.
4. Run `npm run lint`, `npm run build`, `npm run test` in for-angular; fix breakages.

**Acceptance:** for-angular production code imports only `@decaf-ts/integrations/graph/shared`. Lint passes. Build passes. 42 for-angular tests pass.

### TASK-232 — Quarantine or migrate in-browser demo executors

**Option A — Migrate to SSE backend (preferred):**

1. Rewrite `GraphExecutionService` to call `POST /graph/execute` (TASK-224 endpoint) and stream events from `/graph/events` via `ServerEventConnector` (for-http). The RxJS `Observable` API stays; the implementation switches from in-browser engine to HTTP/SSE.
2. Delete `graph-demo-executors.ts` and `GraphExecutionEventSubjectObserver.ts`.
3. Remove the temporary ESLint override from TASK-231.
4. Update the graph page to boot against a configurable backend URL (default `http://localhost:3000`).
5. Run e2e against a live NestJS backend; verify the graph page executes workflows via SSE.

**Option B — Quarantine to dev-only entry (fallback):**

1. Move `graph-demo-executors.ts`, `GraphExecutionService.ts`, `GraphExecutionEventSubjectObserver.ts` → `for-angular/src/graph/execution-dev/`.
2. Add an ESLint override for `for-angular/src/graph/execution-dev/**` allowing `@decaf-ts/integrations/graph`.
3. Configure `angular.json` production build to exclude `execution-dev/` (or lazy-load it behind a dev route not reachable in production).
4. Verify the production bundle does not contain engine code (bundle analysis).
5. Remove the temporary ESLint override from TASK-231 for non-dev paths.

**Decision criterion:** Option A if the SSE backend (TASK-224/226) is stable enough for the graph page; Option B if it is not. Ask the user before implementing.

**Acceptance:** The for-angular production bundle contains no `GraphExecutionEngine`, executor, or registry code. The graph page either runs via SSE (Option A) or runs in a dev-only route (Option B).

### TASK-233 — Final verification

1. `npm run build && npm run lint && npm run test` in `integrations` — 116 graph tests pass.
2. `npm run build && npm run lint && npm run test` in `for-angular` — 42 tests pass, production bundle has no engine code.
3. `npm run build && npm run lint && npm run test` in `for-nest` — NestJS graph module builds and tests pass.
4. Inspect the for-angular production bundle (`www/`) for any `GraphExecutionEngine` / executor class names — none should appear.
5. Verify `@decaf-ts/integrations/graph/shared` export resolves in a fresh `node_modules` install.

**Acceptance:** All builds, lints, and tests green. Bundle analysis confirms no engine code in the frontend production bundle.

## 6. Open Questions / Risks

* **Option A vs Option B for the demo executors (TASK-232):** Migrating to SSE is the production-correct path but requires the NestJS backend to be running for the graph page to work. Quarantining is faster but leaves dead code. **Recommendation:** ask the user; default to Option A if TASK-224/226 are stable.
* **Loop node declarations:** The three loop kinds (`core.loop.foreach/while/until`) are currently declared in the for-angular demo layer, not in `integrations/src/graph/nodes/`. They should be promoted to `shared/nodes/` as part of this refactor (or in a follow-up) so the frontend can discover them from `ALL_GRAPH_NODES`. Low risk — they work as-is for the demo.
* **Circular imports:** `engine/` types reference `shared/` types (e.g. `GraphExecutionEvent` references `GraphExecutionEventType`). The reverse must not happen. Verify with `madge` or similar after the split.
* **`for-angular/node_modules/@decaf-ts/integrations` manual sync:** The for-angular build currently manually copies `integrations/lib/*` and manually adds the `./graph` export. After adding `./graph/shared`, the manual sync step must also copy the new subpath. Document this in the for-angular build README.
* **Bundle size:** Moving node declarations to `shared/` should not increase the frontend bundle — they were already imported. Removing the engine (TASK-232) should decrease it significantly.

## 7. Results & Artifacts

* `workdocs/ai/project/specifications/DECAF_35.md` — this specification.
* `ui-decorators/src/graph/registry.ts` — node/workflow registries (new).
* `ui-decorators/src/graph/decorators.ts` — `@node` and `@graph` decorators gain registry side-effects (call signatures unchanged).
* `ui-decorators/src/graph/overrides/Metadata.ts` — `Metadata.nodes()` / `Metadata.workflows()` namespace augmentation (new).
* `ui-decorators/src/graph/overrides/overrides.ts` — runtime attachments (appended to existing file).
* `integrations/src/graph/shared/` — frontend-safe metadata, types, constants, nodes.
* `integrations/src/graph/engine/` — backend-only engine, executors, registry, store, pinning, validation, NestJS module.
* `integrations/package.json` — new `./graph/shared` subpath export.
* `for-angular/.eslintrc.*` — `no-restricted-imports` boundary rule.
* `for-angular/src/graph/execution/` — repointed imports (production) + quarantined/migrated demo executors.

## 8. Related Specifications

* **DECAF-32** — Graph execution engine (the code being split). §22.2 node taxonomy, §5.8 executor registry, §5.9 loop executors, §20 node-edit modal, §21 rendering contract.
* **DECAF-34** — Graph node type catalogue (the 20 node types whose metadata lives in `shared/`).
* **ALFRED-5** — Workflow editor nodes (the `@node` declarations compiled by ALFRED).
* **ALFRED-6** — Package boundary: workflow-node logic in `modules/core`, Mastra-specific in `brain`.
* **ALFRED-7** — Module-prefixed node IDs, reference-based workflow serialization.
* **ALFRED-8** — Angular web-components for graph nodes with extended CRUD editing (consumes `shared/`).
