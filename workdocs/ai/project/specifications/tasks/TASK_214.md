# TASK-214: Basic GraphExecutionEngine with Workflow/Node I/O Routing and Observer Events

**ID:** TASK-214
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Completed

## 1. Description
Implement the basic `GraphExecutionEngine`: validates the workflow definition, plans it, seeds workflow inputs, executes layers with a concurrency limit, resolves node inputs from incoming edges, routes outputs to downstream inputs and workflow outputs, emits structured events through the observer pipeline, and returns a `GraphExecutionResult`. Includes the `GraphExecutionFrame` runtime state container.

## 2. Objectives
*   [x] Add `GraphExecutionEngine` implementing `Observable<[GraphExecutionObserver], [GraphExecutionEvent]>`.
*   [x] Add `GraphExecutionEngineConfig` (`registry`, `planner?`, `validator?`, `valueValidator?`, `eventEmitter?`, `valueStoreAdapter?`, `pinningService?`, `defaultOptions?`).
*   [x] Add `GraphExecutionFrame` holding per-run state (run id, plan, value store, node results, events).
*   [x] Implement `execute(workflow, inputs, options)` with default options (concurrency, failFast, validateInputs/Outputs, maxLoopIterations, usePinnedValues, etc.).
*   [x] Implement workflow input/output routing and node input/output routing along edges.
*   [x] Emit `WORKFLOW_STARTED`, `WORKFLOW_PLANNED`, `NODE_STARTED`, `NODE_OUTPUT`, `NODE_COMPLETED`, `EDGE_VALUE_ROUTED`, `WORKFLOW_COMPLETED` (and failure variants).
*   [x] Parallel execution of independent nodes in the same layer via a small internal worker queue (no external concurrency dependency).

## 3. Implementation Plan
**Proposed Changes:**
*   Create `src/graph/execution/GraphExecutionEngine.ts`, `GraphExecutionFrame.ts`, `GraphExecutionResult.ts` (if not already present), `index.ts`.
*   Update `src/graph/index.ts` exports.

**Technical Details:**
*   Resolve executor via `GraphNodeExecutorRegistry.resolve(kind)`.
*   Construct `GraphExecutionContext` per node execution and pass to `executor.execute(inputs, context)`.
*   Node execution algorithm per spec §20.5: resolve inputs -> validate -> check pinned (TASK-219 adds cache-hit) -> execute -> validate outputs -> store outputs -> route edges -> emit events.
*   Observer failures must not crash execution.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: `tests/unit/graph/GraphExecutionEngine.test.ts` (single node, workflow input->node, node->workflow output, node->downstream, independent nodes same layer, async node, ordered events, missing executor, missing required input, full result, context is a Decaf Context, `context.progress(...)` works).

**Manual Verification:**
*   Confirm event ordering and result shape match the spec.

## 5. Blockers & Clarifications
*   Depends on TASK-211 (events/registry), TASK-212 (value store), TASK-213 (planner).

## 6. Execution Log
*   [completed] - Implemented during DECAF-32.
