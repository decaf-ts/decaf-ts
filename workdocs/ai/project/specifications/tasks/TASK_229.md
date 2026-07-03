# TASK-229: `@connection()` Port Decorator, Category Colour System & Agent Node

**ID:** TASK-229
**Specification:** [DECAF-32](../DECAF_32.md)
**Priority:** High
**Status:** Completed

## 1. Description

DECAF-32 §21.6.1 and §21.8.2 define a third port direction — `@connection()` — for structural dependencies typed by `category` (model/memory/workspace), rendered on the bottom edge of nodes, and a category-based colour/icon resolution system where `@node()` `color`/`icon` are optional overrides resolved from a `GraphCategoryStyle` registry. This task implements the `@connection()` decorator and `PortDirection.CONNECTION` in `ui-decorators/graph`, adds the `GraphCategoryStyle` registry with `effectiveColor`/`effectiveIcon` resolution, creates the `AgentNode` (`core.agent`) with three connection ports, and updates the for-angular renderer to display connection ports on the bottom edge with category-based colouring.

## 2. Objectives

*   [x] Add `PortDirection.CONNECTION = "connection"` to `ui-decorators/src/graph/constants.ts`.
*   [x] Add `@connection()` decorator to `ui-decorators/src/graph/decorators.ts` (returns `port(PortDirection.CONNECTION, graph)` without `schema: true`).
*   [x] Add `category?: string` field to `GraphPortMetadata` for connection typing.
*   [x] Add `connections?: GraphPortDefinition[]` to `GraphWorkflowMetadata` and collect in `graph()` decorator.
*   [x] Implement `GraphCategoryStyle` registry: `registerGraphCategoryStyle()`, `graphCategoryStyleOf()`, `resolveEffectiveColor()`, `resolveEffectiveIcon()` in `constants.ts`.
*   [x] Add `effectiveColor?` and `effectiveIcon?` fields to `GraphNodeDefinition`; compute in `graphDefinitionOf()` in `reader.ts`.
*   [x] Include `connections` array in `graphWorkflowDefinitionOf()` in `reader.ts`.
*   [x] Create `integrations/src/graph/nodes/category-styles.ts` registering built-in category styles (Trigger, Flow Control, Utility, Loop, Workflow, Pipeline, Node, Agent + model/memory/workspace connection categories).
*   [x] Create `AgentNode` in `integrations/src/graph/nodes/agent.ts` with `@input` (instructions, context), `@output` (response, actions), `@connection` (model, memory, workspace); rectangular shape; colour/icon omitted to use category defaults.
*   [x] Export `GRAPH_AGENT_NODES` and register `core.agent` in `nodeTemplateMap` in `GraphRendererComponent`.
*   [x] Add Agent to palette and demo executors.
*   [x] Add `connectionPorts()` + `connectionColor()` methods to `GraphNodeTemplateComponent`; render connection ports on bottom edge.
*   [x] Update `buildMemberNode()` in `utils.ts` to use `effectiveColor`/`effectiveIcon`.
*   [x] Build, lint, and test all three modules (`ui-decorators`, `integrations`, `for-angular`).
*   [x] Playwright-verify Agent node with all ports visible when selected.

## 3. Implementation Plan

**Proposed Changes:**

ui-decorators (`ui-decorators/src/graph/`):
*   `constants.ts` — Add `PortDirection.CONNECTION`; add `GraphCategoryStyle` interface; add `GRAPH_DEFAULT_CATEGORY_STYLE`; add `registerGraphCategoryStyle()`, `graphCategoryStyleOf()`, `resolveEffectiveColor()`, `resolveEffectiveIcon()` functions; add `effectiveColor?`/`effectiveIcon?` to `GraphNodeDefinition`; add `connections` to `GraphWorkflowDefinition`.
*   `decorators.ts` — Add `@connection()` decorator (calls `port(PortDirection.CONNECTION, graph)` without schema); update `graph()` decorator to collect `connections` from ports.
*   `reader.ts` — Update `graphDefinitionOf()` to compute `effectiveColor`/`effectiveIcon` (explicit → category → default); update `graphWorkflowDefinitionOf()` to include `connections` array.

integrations (`integrations/src/graph/nodes/`):
*   `category-styles.ts` — Register built-in category styles at module load via `registerBuiltinCategoryStyles()`.
*   `agent.ts` — `AgentNode` class with `@node({ kind: "core.agent", category: "Agent" })`, `@input`/`@output`/`@connection` decorators; `GRAPH_AGENT_NODES` array.
*   `index.ts` — Barrel exports for category-styles and agent.

for-angular (`for-angular/src/graph/`):
*   `components/graph-node-template/graph-node-template.component.ts` — Add `connectionPorts()` → `visiblePorts(PortDirection.CONNECTION)` and `connectionColor(category)` helper.
*   `components/graph-node-template/graph-node-template.component.html` — Connection ports section on bottom edge.
*   `components/graph-node-template/graph-node-template.component.scss` — `.graph-node__ports--connection`, `.graph-node__port--connection` styles with category colouring.
*   `components/graph-renderer/graph-renderer.component.ts` — Register `core.agent` in `nodeTemplateMap`.
*   `utils.ts` — `buildMemberNode()` uses `effectiveColor ?? color` and `effectiveIcon ?? icon`.
*   `app/pages/graph/graph.page.ts` — Add `GRAPH_AGENT_NODES` to palette.
*   `execution/graph-demo-executors.ts` — Add `core.agent` demo executor.

**Technical Details:**
*   `@connection()` ports do NOT carry workflow data values — they represent structural dependencies; rendered on bottom side.
*   `color` and `icon` on `@node()` are optional overrides; when omitted, category style provides defaults via `resolveEffectiveColor()`/`resolveEffectiveIcon()`.
*   Connection ports are coloured by their `category` field, not by the node's accent colour.
*   Agent node omits `color`/`icon` from `@node()` metadata to demonstrate category-based resolution from "Agent" category (`#7c3aed` / `ti-robot`).
*   Connection port visibility follows the same contextual rules as input/output ports (§21.6): visible when node selected, connection drag in progress, or port has existing connection.

## 4. Verification Plan

**Automated Tests:**
*   [x] Existing `integrations` graph unit tests remain green (96 tests).
*   [x] Existing `for-angular` tests remain green (4 tests).

**Manual Verification:**
*   [x] `npm run build` in `ui-decorators` succeeds.
*   [x] `npm run build` in `integrations` succeeds.
*   [x] `ng build for-angular-app` in `for-angular` succeeds.
*   [x] `npm run lint` in all three modules: 0 errors.
*   [x] Playwright: Agent node appears on canvas; when selected, shows 2 input ports (left), 2 output ports (right), 3 connection ports (bottom: model/memory/workspace); Run succeeds.

## 5. Blockers & Clarifications

*   **Initial port rendering issue:** Agent node appeared on canvas but ports were not visible — investigated and confirmed this was expected behaviour (ports are contextually hidden per §21.6 until the node is selected). Clicking the node to select it revealed all 7 ports. No code change needed.

## 6. Execution Log

*   2026-07-03 — Started task.
*   2026-07-03 — Added `PortDirection.CONNECTION` to `ui-decorators/src/graph/constants.ts`.
*   2026-07-03 — Added `@connection()` decorator to `ui-decorators/src/graph/decorators.ts`.
*   2026-07-03 — Added `category?` field to `GraphPortMetadata`; added `connections?` to `GraphWorkflowMetadata`.
*   2026-07-03 — Implemented `GraphCategoryStyle` registry (`registerGraphCategoryStyle`, `graphCategoryStyleOf`, `resolveEffectiveColor`, `resolveEffectiveIcon`) in `constants.ts`.
*   2026-07-03 — Added `effectiveColor?`/`effectiveIcon?` to `GraphNodeDefinition`; computed in `graphDefinitionOf()` in `reader.ts`.
*   2026-07-03 — Updated `graphWorkflowDefinitionOf()` to include `connections` array.
*   2026-07-03 — Updated `graph()` decorator to collect `connections` from ports.
*   2026-07-03 — Created `integrations/src/graph/nodes/category-styles.ts` with built-in category styles.
*   2026-07-03 — Created `AgentNode` in `integrations/src/graph/nodes/agent.ts` with 3 `@connection` ports.
*   2026-07-03 — Exported `GRAPH_AGENT_NODES` and registered in `nodeTemplateMap`.
*   2026-07-03 — Added `connectionPorts()` + `connectionColor()` to `GraphNodeTemplateComponent`; rendered connection ports on bottom edge.
*   2026-07-03 — Updated `buildMemberNode()` in `utils.ts` to use `effectiveColor`/`effectiveIcon`.
*   2026-07-03 — Added Agent to palette and demo executors.
*   2026-07-03 — Synced built artifacts to `for-angular/node_modules/`.
*   2026-07-03 — **Build:** `ui-decorators`, `integrations`, and `for-angular` builds all succeed.
*   2026-07-03 — **Lint:** 0 errors across all three modules.
*   2026-07-03 — **Tests:** `integrations` 96 tests pass; `for-angular` 4 tests pass.
*   2026-07-03 — **Playwright-verified:** Agent node on canvas; when selected: 2 input ports (left), 2 output ports (right), 3 connection ports (bottom); Run succeeds with full pipeline output.
*   2026-07-03 — Updated DECAF-32 spec: added §21.6.1 (Connection Ports), §21.8.1 (Legacy colour mapping), §21.8.2 (Category Style Registry), §21.8.3 (Connection Port Colours), §22.2.4 (Agent Nodes); marked checklist items.
*   2026-07-03 — Task completed.
