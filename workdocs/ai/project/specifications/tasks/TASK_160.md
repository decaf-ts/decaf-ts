# TASK-160: Add Workflow Serialization and Restore Support for Graph State

**ID:** TASK-160
**Specification:** [DECAF-24: Graph Metadata Layer and Angular Graph Adapter](../DECAF_24.md)
**Priority:** High
**Status:** Completed

## 1. Description
Add a framework-neutral workflow snapshot contract so a `@graph(...)` workflow can be serialized and restored with node positions, edge links, workflow input values, port expansion state, and any other UI state required to recreate the canvas exactly.

## 2. Objectives
*   [x] Define a serializable graph snapshot shape for workflow roots.
*   [x] Capture node positions, edges, and port/UI state from the Angular graph renderer.
*   [x] Restore a saved workflow snapshot back into the renderer and graph model.

## 3. Implementation Plan
**Proposed Changes:**
*   Add a canonical workflow snapshot DTO under `ui-decorators/src/graph` so future adapters can serialize the same graph state.
*   Extend the Angular graph adapter to export/import node positions, relations, duplicated value nodes, and workflow input values.
*   Make restore logic tolerant of missing or renamed nodes by using graph metadata identifiers rather than only canvas node IDs.

**Technical Details:**
*   The snapshot format must remain renderer-neutral.
*   Node chrome state such as expansion/collapse should be preserved where possible.
*   Workflow inputs must round-trip through the same model/validation pipeline used by the live renderer.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: graph snapshots serialize node positions, ports, and edges.
*   [x] Unit Test: graph snapshots restore the same workflow topology and input values.

**Manual Verification:**
*   Save a workflow snapshot, reload it, and confirm the diagram state matches the original canvas.

## 5. Blockers & Clarifications
*   **Clarification 1:** Should serialization be exposed as a pure metadata helper in `ui-decorators`, or as an Angular service in `for-angular`, or both?
*   **Clarification 2:** Should the snapshot format include visual layout data only, or also persisted runtime values for workflow output placeholders?

## 6. Execution Log
*   [2026-06-18] - Created the workflow serialization task for DECAF-24.
*   [2026-06-18] - Implemented the framework-neutral workflow snapshot contract and restore helpers in `ui-decorators` so the package can be released independently of the Angular restore wiring.
*   [2026-06-18] - Implemented the Angular snapshot save/load wiring, node state restoration, and metadata-driven graph reload flow in `for-angular`.
