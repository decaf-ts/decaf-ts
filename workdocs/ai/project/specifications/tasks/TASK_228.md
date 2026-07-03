# TASK-228: Implement Full DECAF-32 Node Kind Taxonomy

**ID:** TASK-228
**Specification:** [DECAF-32](../DECAF_32.md)
**Priority:** High
**Status:** Completed

## 1. Description

DECAF-32 §22.2 defines the full ALFRED-5 node kind taxonomy that the engine must recognize: 6 trigger nodes (`core.trigger.manual/webhook/schedule/event/form/chat`), 10 flow-control nodes (`core.flow.if/switch/parallel/merge/map/delay/errorBoundary/humanApproval/return/code`), and the 3 already-implemented loop nodes (`core.loop.foreach/while/until`). Currently only the 3 loop nodes and 5 demo pipeline nodes exist. This task creates the declaration classes for all remaining kinds, wires them into the renderer template map and the "add node" palette, adds demo executors where applicable, and implements the `ConditionExpression` DSL recognition (§22.3, checklist item #146) in the engine's `GraphConditionEvaluator`.

## 2. Objectives

*   [ ] Create 6 trigger node declaration classes (`core.trigger.*`) with `@node`/`@input`/`@output` decorators and appropriate metadata.
*   [ ] Create 10 flow-control node declaration classes (`core.flow.*`) with `@node`/`@input`/`@output` decorators and appropriate metadata.
*   [ ] Add all 16 new node constructors to `GRAPH_DEMO_NODES` so they appear in the "add node" palette.
*   [ ] Register all 16 new kinds in `nodeTemplateMap` in `GraphRendererComponent` so the renderer can display them.
*   [ ] Add demo executors for runnable new kinds in `createDemoEngineConfig()` so Run does not crash (passthrough/transform demos for `map`/`delay`/`return`/`merge`; placeholder passthrough for `if`/`switch`/`parallel`/`errorBoundary`/`humanApproval`/`code`).
*   [ ] Implement `ConditionExpression` DSL (§22.3) recognition in `GraphConditionEvaluator` — dispatch to a `ConditionExpression` evaluator when the condition object has an `op` field.
*   [ ] Add `ConditionExpression` type and `ExprValue` type to `integrations/src/graph/types.ts`.
*   [ ] Add engine tests for `ConditionExpression` evaluation (all ops: eq/neq/gt/gte/lt/lte/and/or/not/exists; ExprValue resolution: const/path/step).
*   [ ] Update `utils.spec.ts` node/edge counts for the expanded palette.
*   [ ] Build, lint, and test both `integrations` and `for-angular` modules.

## 3. Implementation Plan

**Proposed Changes:**

Engine-side (`integrations/src/graph/`):
*   Add `ConditionExpression` and `ExprValue` types to `types.ts` (§22.3 DSL).
*   Create `loops/ConditionExpressionEvaluator.ts` — evaluates `eq/neq/gt/gte/lt/lte/and/or/not/exists` ops with `ExprValue` resolution (`{const}`, `{path}`, `{step, path}`).
*   Update `loops/GraphConditionEvaluator.ts` — detect `op` field on the condition object (cast to `ConditionExpression` when present) and dispatch to `ConditionExpressionEvaluator`; keep existing built-in `type`-based dispatch for backwards compatibility.
*   Export `ConditionExpressionEvaluator` and `ConditionExpression` from the graph barrel.

Production node declarations (`integrations/src/graph/nodes/`):
*   Create `triggers.ts` — 6 trigger node declaration classes (`core.trigger.manual/webhook/schedule/event/form/chat`) with `@node`/`@output`/`@model` decorators. Triggers are metadata-only entrypoints (§22.2.1): they have `@output` ports (trigger payload) and no `@input` ports.
*   Create `flow-control.ts` — 10 flow-control node declaration classes (`core.flow.if/switch/parallel/merge/map/delay/errorBoundary/humanApproval/return/code`) with `@node`/`@input`/`@output`/`@model` decorators. These have no built-in executors (§22.2.2); the planner recognizes them as ordinary executable nodes.
*   Create `nodes/index.ts` barrel and export from the graph barrel so any consumer (for-angular, ALFRED) can reference the canonical declarations.

Renderer (`for-angular/src/graph/components/graph-renderer/graph-renderer.component.ts`):
*   Add all 16 kinds to `nodeTemplateMap` mapping to `GraphNodeTemplateComponent`.

Graph page palette (`for-angular/src/app/pages/graph/graph.page.ts`):
*   Import the production node declarations from `@decaf-ts/integrations/graph` and merge with `GRAPH_DEMO_NODES` for the `[availableNodes]` binding so the palette offers both built-in kinds and demo-specific kinds.

Demo executors (`for-angular/src/graph/execution/graph-demo-executors.ts`):
*   Register `core.flow.map` → transform demo; `core.flow.delay` → passthrough with delay metadata; `core.flow.return` → normalize output; `core.flow.merge` → merge inputs.
*   Register `core.flow.if`/`switch`/`parallel`/`errorBoundary`/`humanApproval`/`code` → placeholder passthrough executors (return input) so Run succeeds with `failFast: false`.
*   Trigger kinds (`core.trigger.*`) → no executors (metadata-only; not executed as steps).

Tests:
*   `integrations/tests/unit/graph/ConditionExpressionEvaluator.test.ts` — cover all 10 ops + ExprValue resolution.
*   Update `for-angular/src/graph/utils.spec.ts` — node count reflects expanded palette.

**Technical Details:**
*   Trigger nodes are metadata-only entrypoints (§22.2.1) — they have `@output` ports (the trigger payload) but no `@input` ports (nothing feeds a trigger). They are not registered as executors.
*   Flow-control nodes are recognized by the planner as ordinary executable nodes (§22.2.2) — they have `@input`/`@output` ports. The engine has no built-in executors for them; demo executors are for-angular-only convenience so the demo Run button doesn't fail.
*   `ConditionExpression` dispatch: when `GraphConditionDefinition` has an `op` field (instead of `type`), the evaluator casts to `ConditionExpression` and delegates. This keeps backwards compatibility with existing `type`-based conditions.
*   `ExprValue` resolution: `{const: x}` → literal; `{path: "a.b"}` → dotted path into state; `{step: "nodeId", path: "out"}` → reserved for cross-node references (resolves from state in v1).
*   All new node classes use `width: 96, height: 96` per §21 minimal node contract.
*   Use bracket notation for index signatures (`noPropertyAccessFromIndexSignature: true` in for-angular tsconfig).

## 4. Verification Plan

**Automated Tests:**
*   [ ] Unit Test: `integrations/src/graph/loops/ConditionExpressionEvaluator.spec.ts`
*   [ ] Unit Test: `for-angular/src/graph/utils.spec.ts` (updated counts)
*   [ ] Existing engine tests remain green (88 tests).

**Manual Verification:**
*   `npm run build` in `integrations` succeeds.
*   `npm run build` (`ng build for-angular-app`) in `for-angular` succeeds.
*   `npm run lint` in both modules: 0 errors.
*   `npm run test` in `integrations`: all tests pass.
*   Playwright: graph page loads, palette shows all node kinds, adding a node works, Run still succeeds.

## 5. Blockers & Clarifications

*   **None identified.** All required patterns (decorator usage, executor registry, template map, palette) are established in the codebase.

## 6. Execution Log

*   2026-07-03 — Started task.
*   2026-07-03 — Added `ConditionExpression` + `ExprValue` types to `integrations/src/graph/types.ts` (§22.3 DSL).
*   2026-07-03 — Created `ConditionExpressionEvaluator` in `integrations/src/graph/loops/ConditionExpressionEvaluator.ts` (all 10 ops: eq/neq/gt/gte/lt/lte/and/or/not/exists; ExprValue resolution: const/path/step).
*   2026-07-03 — Updated `GraphConditionEvaluator` to dispatch on `op` field → `ConditionExpressionEvaluator`; kept `type`-based dispatch for backwards compatibility.
*   2026-07-03 — Exported `ConditionExpressionEvaluator` + `ConditionExpression` from graph barrel.
*   2026-07-03 — Created 6 trigger node declarations in `integrations/src/graph/nodes/triggers.ts` (`ManualTriggerNode`, `WebhookTriggerNode`, `ScheduleTriggerNode`, `EventTriggerNode`, `FormTriggerNode`, `ChatTriggerNode`).
*   2026-07-03 — Created 10 flow-control node declarations in `integrations/src/graph/nodes/flow-control.ts` (`IfFlowNode`, `SwitchFlowNode`, `ParallelFlowNode`, `MergeFlowNode`, `MapFlowNode`, `DelayFlowNode`, `ErrorBoundaryFlowNode`, `HumanApprovalFlowNode`, `ReturnFlowNode`, `CodeFlowNode`).
*   2026-07-03 — Exported production nodes from `integrations/src/graph/nodes/index.ts` and graph barrel.
*   2026-07-03 — Registered all 16 kinds in `nodeTemplateMap` in `GraphRendererComponent`.
*   2026-07-03 — Wired production nodes into graph page palette (`graph.page.ts` imports `GRAPH_TRIGGER_NODES` + `GRAPH_FLOW_CONTROL_NODES` from `@decaf-ts/integrations/graph`).
*   2026-07-03 — Added demo executors for 10 flow-control kinds in `createDemoEngineConfig()`.
*   2026-07-03 — Synced graph artifacts to `for-angular/node_modules/@decaf-ts/integrations/`.
*   2026-07-03 — **Build:** `integrations` build succeeds; `for-angular` `ng build for-angular-app` succeeds.
*   2026-07-03 — **Lint:** `integrations` 0 errors; `for-angular` 0 errors, 4 pre-existing warnings.
*   2026-07-03 — **Tests:** `integrations` graph unit tests: 96 passed (was 88, +8 new ConditionExpression tests). `for-angular` `utils.spec.ts`: 4 passed.
*   2026-07-03 — **Playwright-verified:** Graph page loads, palette shows 24 entries (8 demo + 6 trigger + 10 flow-control), adding a Map node works, Run succeeds with full pipeline output.
*   2026-07-03 — Task completed.
