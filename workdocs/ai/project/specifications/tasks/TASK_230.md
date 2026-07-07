# TASK-230: Split graph package into shared/ and engine/

**ID:** TASK-230
**Specification:** [DECAF-35](../DECAF_35.md)
**Priority:** High
**Status:** Pending

## 1. Description
Split `integrations/src/graph/` into `shared/` (frontend-safe metadata, types, constants, catalogue, nodes) and `engine/` (backend-only execution engine, executors, registry, store, pinning, validation, NestJS module). Add `@decaf-ts/integrations/graph/shared` subpath export. Partition `types.ts` and `constants.ts` into shared vs engine-private parts. Add `ALL_GRAPH_NODES` catalogue. Backend convenience export (`./graph`) re-exports both.

## 2. Objectives
* [ ] Create `integrations/src/graph/shared/` and `integrations/src/graph/engine/` directories.
* [ ] Move `graph/nodes/` → `graph/shared/nodes/` (source unchanged; update internal import paths).
* [ ] Partition `graph/types.ts`: shared types (`ExprValue`, `ConditionExpression`, `CodeCondition`, `SwitchCaseCondition`, `SwitchCase`, `SwitchNodeMetadata`, `NodeMetadataChange`) → `shared/types.ts`; engine-private types → `engine/types.ts`.
* [ ] Partition `graph/constants.ts`: `GraphExecutionStatus`, `GraphExecutionEventType` → `shared/constants.ts`; engine-private constants → `engine/constants.ts`.
* [ ] Move `graph/decorators.ts` (`@pinnable`) → `engine/decorators.ts`.
* [ ] Move all engine modules (`execution/`, `registry/`, `store/`, `planning/`, `validation/`, `loops/`, `pinning/`, `snapshots/`, `errors/`, `events/`) → `engine/`.
* [ ] Create `shared/catalogue.ts` exporting `ALL_GRAPH_NODES`.
* [ ] Create `shared/index.ts` and `engine/index.ts` barrel files.
* [ ] Update `graph/index.ts` to re-export `./engine`.
* [ ] Add `"./graph/shared"` entry to `integrations/package.json` `exports`.
* [ ] Update internal `integrations` imports (nest module, tests) to new paths.
* [ ] All 116 graph tests pass; lint clean; build clean.

## 3. Implementation Plan
**Proposed Changes:**
* Create `integrations/src/graph/shared/` and `integrations/src/graph/engine/`.
* `git mv integrations/src/graph/nodes integrations/src/graph/shared/nodes`.
* Partition `types.ts` and `constants.ts` by moving shared declarations to `shared/` and keeping engine-private in `engine/`.
* `git mv` each engine module directory into `engine/`.
* Create `shared/catalogue.ts`, `shared/index.ts`, `engine/index.ts`.
* Rewrite `graph/index.ts` to `export * from "./engine";`.
* Add `./graph/shared` to `integrations/package.json` `exports` (mirror existing `./graph` entry).
* Update import paths in `integrations/src/nest/graph/*` and `integrations/tests/**` to use new internal paths.

**Technical Details:**
* Engine types that reference shared types must import from `../shared` (one level up). The reverse (shared importing engine) is forbidden — verify no circular imports with `madge`.
* `GraphNode.applyMetadata()` stays on the class in `shared/nodes/base.ts` — it is pure computation with no engine dependency.
* The `./graph/shared` export must resolve to `lib/esm/graph/shared/index.js` and `lib/cjs/graph/shared/index.cjs` after build.

## 4. Verification Plan
**Automated Tests:**
* [ ] `npm run build` in `integrations` — both `./graph` and `./graph/shared` resolve.
* [ ] `npm run lint` in `integrations` — 0 errors.
* [ ] `npm run test` in `integrations` — 116 graph tests pass.

**Manual Verification:**
* `node -e "require('@decaf-ts/integrations/graph/shared')"` resolves and exports `ALL_GRAPH_NODES`, `AgentNode`, `SwitchFlowNode`, `GraphExecutionEventType`.
* `node -e "require('@decaf-ts/integrations/graph')"` resolves and exports `GraphExecutionEngine` (engine) plus everything from `./shared`.

## 5. Blockers & Clarifications
* None anticipated. Mechanical move; engine code is not rewritten.

## 6. Execution Log
* (pending)
