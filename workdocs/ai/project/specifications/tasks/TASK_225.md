# TASK-225: for-angular Graph Page Working Execution UI (Run button, real-time state, RamAdapter persistence)

**ID:** TASK-225
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md) — §18
**Priority:** High
**Status:** Pending

## 1. Description
Wire the graph execution engine into the for-angular graph page so users can run the displayed workflow and see live execution results. Add a "Run workflow" button, display real-time node/edge/loop state via `GraphExecutionStateMapper`, show actual workflow outputs (replacing the static "pending run result" string), and persist execution results via RamAdapter.

## 2. Objectives
*   [x] Add a "Run workflow" button to `graph.page.html` (next to or below the input form).
*   [x] On click: collect workflow input form values, call `GraphExecutionService.execute(workflow, inputs)`.
*   [x] Subscribe to `GraphExecutionService.events$` and feed events to `GraphExecutionStateMapper`.
*   [x] Display node status badges on the canvas: `running` (spinner), `succeeded` (check), `failed` (error icon), `cached` (cache icon).
*   [x] Display edge values (last routed value) as edge labels or tooltips.
*   [x] Replace `workflowOutputValue()` with actual execution outputs from the result.
*   [x] Show execution errors (if any) in the outputs panel.
*   [x] Persist execution results via `GraphExecutionResultRepository` (RamAdapter).
*   [x] On page load, retrieve the most recent execution result for the current workflow and display it.
*   [x] Provide `GRAPH_EXECUTION_ENGINE_CONFIG` with demo executors registered for the publishing workflow.

## 3. Implementation Plan
**Proposed Changes:**
*   Update `for-angular/src/app/pages/graph/graph.page.ts`:
    *   Inject `GraphExecutionService`.
    *   Add `runWorkflow()` method.
    *   Add `nodeStates` and `edgeStates` signals.
    *   Subscribe to `events$` and apply `GraphExecutionStateMapper`.
    *   Add `lastResult` signal for persisted results.
    *   Load most recent result on init via repository.
*   Update `for-angular/src/app/pages/graph/graph.page.html`:
    *   Add "Run workflow" button.
    *   Add status badges to node templates.
    *   Display actual outputs in the outputs panel.
    *   Display error state when execution fails.
*   Update `for-angular/src/graph/components/graph-renderer/graph-renderer.component.ts`:
    *   Accept `nodeStates` and `edgeStates` as `@Input()` signals.
    *   Pass state to node templates for badge rendering.
*   Add `GraphExecutionResultModel` and `GraphExecutionResultRepository` to for-angular (imported from `@decaf-ts/integrations/graph` or defined locally).
*   Register `GraphExecutionService` and `GRAPH_EXECUTION_ENGINE_CONFIG` in the app providers or graph page providers.
*   Register demo executors for the publishing workflow nodes (`GraphIntakeWorkflow`, `GraphPlanningPipeline`, `GraphDraftNode`, `GraphReviewNode`, `GraphPublishWorkflow`).

**Technical Details:**
*   Use Angular signals (`signal()`, `computed()`) for reactive state — consistent with the existing graph renderer pattern.
*   The `GraphExecutionStateMapper` is pure (no Angular) and can be called directly in the event subscription.
*   RamAdapter is already configured in `app.config.ts` (`provideDecafDbAdapter(RamAdapter, { user: 'user' })`).
*   Node status badges should be rendered in `GraphNodeTemplateComponent` based on the `nodeStates` input.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit test: `GraphPage` component has a "Run workflow" button.
*   [x] Unit test: clicking "Run" calls `GraphExecutionService.execute()`.
*   [x] Unit test: events from `events$` update `nodeStates` via `GraphExecutionStateMapper`.
*   [x] Unit test: `workflowOutputValue()` returns actual outputs after execution, not "pending run result".
*   [x] Unit test: execution results are persisted to RamAdapter and retrievable.

**Manual Verification:**
*   Run `ng serve`, navigate to the graph page, fill in inputs, click "Run workflow", and observe live node/edge state updates and final outputs.

## 5. Blockers & Clarifications
*   Depends on TASK-224 (NestJS backend module) for the `GraphExecutionResultModel` and repository pattern.
*   The demo executors for the publishing workflow nodes must produce meaningful outputs (e.g., `GraphIntakeWorkflow` normalizes the request string, `GraphPlanningPipeline` generates a plan, etc.).

## 6. Execution Log
*   [pending] - Task created during DECAF-32 Phase 2 specification.
