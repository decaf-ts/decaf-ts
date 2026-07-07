# TASK-230: Split graph package into shared/ and engine/

**ID:** TASK-230
**Specification:** [DECAF-35](../DECAF_35.md)
**Priority:** High
**Status:** Pending

## 1. Description
Split `integrations/src/graph/` into `shared/` (frontend-safe metadata, types, constants, nodes) and `engine/` (backend-only execution engine, executors, registry, store, pinning, validation, NestJS module). Add `@decaf-ts/integrations/graph/shared` subpath export. Partition `types.ts` and `constants.ts` into shared vs engine-private parts. Add a registry side-effect to the `@node` decorator (in `ui-decorators/graph`) and a `Metadata.nodes(): Constructor[]` accessor (in `ui-decorators/src/overrides/Metadata.ts`) so consumers discover `@node`-decorated classes via the metadata store instead of a hand-maintained array. Backend convenience export (`./graph`) re-exports both.

## 2. Objectives
* [ ] Create `integrations/src/graph/shared/` and `integrations/src/graph/engine/` directories.
* [ ] Move `graph/nodes/` → `graph/shared/nodes/` (source unchanged; update internal import paths).
* [ ] Partition `graph/types.ts`: shared types (`ExprValue`, `ConditionExpression`, `CodeCondition`, `SwitchCaseCondition`, `SwitchCase`, `SwitchNodeMetadata`, `NodeMetadataChange`) → `shared/types.ts`; engine-private types → `engine/types.ts`.
* [ ] Partition `graph/constants.ts`: `GraphExecutionStatus`, `GraphExecutionEventType` → `shared/constants.ts`; engine-private constants → `engine/constants.ts`.
* [ ] Move `graph/decorators.ts` (`@pinnable`) → `engine/decorators.ts`.
* [ ] Move all engine modules (`execution/`, `registry/`, `store/`, `planning/`, `validation/`, `loops/`, `pinning/`, `snapshots/`, `errors/`, `events/`) → `engine/`.
* [ ] (Upstream `ui-decorators/graph`) Add registry side-effect to `@node` decorator: after setting per-class `GraphKeys.NODE` metadata, append the constructor to the node registry keyed by `GraphKeys.NODE` (mirroring `@flavour`'s registry population). Call signature unchanged.
* [ ] (Upstream `ui-decorators/graph`) Create `ui-decorators/src/overrides/Metadata.ts` extending base `Metadata` with `static nodes(): Constructor[]` reading the registry. Re-export from `ui-decorators/src/overrides/index.ts`.
* [ ] Create `shared/index.ts` re-exporting `./constants`, `./types`, `./nodes`, and re-exporting `Metadata` (with `nodes()`) from `@decaf-ts/ui-decorators`.
* [ ] Create `engine/index.ts` barrel file re-exporting `../shared` + all engine modules.
* [ ] Update `graph/index.ts` to re-export `./engine`.
* [ ] Add `"./graph/shared"` entry to `integrations/package.json` `exports`.
* [ ] Update internal `integrations` imports (nest module, tests) to new paths.
* [ ] Add unit test: `Metadata.nodes()` returns exactly the `@node`-decorated constructors from `shared/nodes/` after importing them.
* [ ] All 116 graph tests pass; ui-decorators tests pass; lint clean; build clean.

## 3. Implementation Plan
**Proposed Changes:**
* Create `integrations/src/graph/shared/` and `integrations/src/graph/engine/`.
* `git mv integrations/src/graph/nodes integrations/src/graph/shared/nodes`.
* Partition `types.ts` and `constants.ts` by moving shared declarations to `shared/` and keeping engine-private in `engine/`.
* `git mv` each engine module directory into `engine/`.
* Create `shared/index.ts` and `engine/index.ts`.
* Rewrite `graph/index.ts` to `export * from "./engine";`.
* Add `./graph/shared` to `integrations/package.json` `exports` (mirror existing `./graph` entry).
* Update import paths in `integrations/src/nest/graph/*` and `integrations/tests/**`.
* In `ui-decorators/src/graph/decorators.ts`, add registry side-effect to the `@node` decorator's `innerNode` function: after `apply(uimodel(tag, props), metadata(GraphKeys.NODE, meta))(target)`, also append `target` to the `GraphKeys.NODE` registry in the `Metadata` store (mirroring how `@flavour` populates the flavour registry).
* Create `ui-decorators/src/overrides/Metadata.ts` with `static nodes(): Constructor[]` reading the registry via `this.innerGet(Symbol.for(GraphKeys.NODE)) || []`. Re-export from `ui-decorators/src/overrides/index.ts`.

**Technical Details:**
* Engine types that reference shared types must import from `../shared` (one level up). The reverse (shared importing engine) is forbidden — verify no circular imports with `madge`.
* `GraphNode.applyMetadata()` stays on the class in `shared/nodes/base.ts` — it is pure computation with no engine dependency.
* The `./graph/shared` export must resolve to `lib/esm/graph/shared/index.js` and `lib/cjs/graph/shared/index.cjs` after build.
* The `@node` decorator's call signature is unchanged — only its internal implementation gains a registry side-effect. Existing node classes do not need re-decoration.
* `Metadata.nodes()` follows the `Metadata.flavouredAs(flavour): Constructor[]` pattern at `decoration/src/metadata/Metadata.ts:230`.

## 4. Verification Plan
**Automated Tests:**
* [ ] `npm run build` in `integrations` — both `./graph` and `./graph/shared` resolve.
* [ ] `npm run lint` in `integrations` — 0 errors.
* [ ] `npm run test` in `integrations` — 116 graph tests pass.

**Manual Verification:**
* `node -e "require('@decaf-ts/integrations/graph/shared')"` resolves and exports `Metadata` (with `nodes()`), `AgentNode`, `SwitchFlowNode`, `GraphExecutionEventType`.
* `Metadata.nodes()` returns all `@node`-decorated constructors (17 from `shared/nodes/`).
* `node -e "require('@decaf-ts/integrations/graph')"` resolves and exports `GraphExecutionEngine` (engine) plus everything from `./shared`.

## 5. Blockers & Clarifications
* None anticipated. Mechanical move; engine code is not rewritten.

## 6. Execution Log
* (pending)
