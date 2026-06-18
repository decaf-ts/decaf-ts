# TASK-159: Build the Angular Graph Renderer and Reusable Value Nodes

**ID:** TASK-159
**Specification:** [DECAF-24: Graph Metadata Layer and Angular Graph Adapter](../DECAF_24.md)
**Priority:** High
**Status:** Completed

## 1. Description
Build a graph renderer component under `for-angular/src/graph` that accepts a `@graph(...)`-decorated class and renders the full workflow graph. Workflow inputs must appear in a left-side column and also as reusable value nodes in the canvas, with output-only semantics so they can be duplicated and connected anywhere in the graph.

## 2. Objectives
*   [x] Add a graph renderer component in `for-angular/src/graph`.
*   [x] Model workflow inputs as duplicateable value nodes with output-only ports.
*   [x] Render the full graph topology and all connections from the `@graph(...)` metadata.

## 3. Implementation Plan
**Proposed Changes:**
*   Introduce reusable node classes for value nodes and any other graph-only primitives needed by the renderer.
*   Build a renderer that maps workflow inputs to a left column and mirrors them on the canvas as draggable value nodes.
*   Connect workflow inputs, mirrored value nodes, and downstream node inputs according to the graph-root relations.

**Technical Details:**
*   The renderer should keep `ngDiagram` optional and only activate when the dependency is present.
*   Reusable value nodes must be ordinary decorated classes so graph input values remain first-class metadata objects.
*   The renderer must not impose connection limits on value nodes.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: workflow inputs produce value-node instances and connection edges.
*   [x] Unit Test: graph renderer consumes a decorated graph root and renders the full topology.

**Manual Verification:**
*   Inspect the demo page to confirm workflow inputs appear both in the left column and as canvas nodes.

## 5. Blockers & Clarifications
*   **Clarification 1:** Should the renderer own its own layout strategy, or should layout remain a data concern of the `@graph(...)` contract?

## 6. Execution Log
*   [2026-06-18] - Created the Angular graph renderer task for DECAF-24.
*   [2026-06-18] - Implemented the workflow-root graph renderer, reusable boundary node classes, and full topology mapping in `for-angular`.
