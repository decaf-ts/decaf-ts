# TASK-213: Execution Plan Types, Relation Resolver, and Kahn Topological Planner

**ID:** TASK-213
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add the execution plan types (`GraphExecutionPlanNode`, `GraphExecutionPlanEdge`, `GraphExecutionPlanLayer`, `GraphExecutionPlan`), the `GraphRelationResolver` that normalizes workflow relations into edges, and the `GraphExecutionPlanner` that validates the workflow and produces topological execution layers using Kahn's algorithm. Arbitrary non-loop cycles must be rejected.

## 2. Objectives
*   [ ] Add plan node/edge/layer types and `GraphExecutionPlan` (with `incomingByNode`/`outgoingByNode` maps).
*   [ ] Add `GraphRelationResolver` normalizing workflow relations, resolving workflow boundary aliases (`$workflow`, `workflow`, `graph`, `workflow.name`), and validating endpoints/ports.
*   [ ] Add `GraphExecutionPlanner` with `plan(workflow)` that resolves nodes/relations, validates unique IDs, builds maps, detects cycles, and produces topological layers.
*   [ ] Reject arbitrary non-loop cycles with `GraphCycleError`.
*   [ ] Treat workflow boundary as non-executable; treat loop nodes as ordinary executable nodes at the containing workflow level.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `src/graph/planning/GraphExecutionPlanNode.ts`, `GraphExecutionPlanEdge.ts`, `GraphExecutionPlanLayer.ts`, `GraphExecutionPlan.ts`, `GraphRelationResolver.ts`, `GraphExecutionPlanner.ts`, `GraphTopology.ts`, `index.ts`.
*   Update `src/graph/index.ts` exports.

**Technical Details:**
*   Use Kahn's algorithm. Workflow boundary edges do not count as executable-node dependencies.
*   Errors: `GraphTopologyError` for unknown/ambiguous endpoints, `GraphPortError` for missing/unknown ports.
*   Consume `GraphWorkflowDefinition`/`GraphNodeDefinition` from `@decaf-ts/ui-decorators/graph`; do not duplicate metadata reading.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/graph/GraphRelationResolver.test.ts`
*   [ ] Unit Test: `tests/unit/graph/GraphExecutionPlanner.test.ts`

**Manual Verification:**
*   Confirm deterministic layering for fan-in/fan-out.
*   Confirm cycle rejection for non-loop cycles.

## 5. Blockers & Clarifications
*   None anticipated.

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
