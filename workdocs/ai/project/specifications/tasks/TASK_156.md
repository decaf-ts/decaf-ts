# TASK-156: Implement the Angular Graph Adapter in `for-angular`

**ID:** TASK-156
**Specification:** [DECAF-24: Graph Metadata Layer and Angular Graph Adapter](../DECAF_24.md)
**Priority:** High
**Status:** Completed

## 1. Description
Implement the Angular-side graph adapter in a new `for-angular/src/graph` area. The adapter must consume the canonical graph metadata from `ui-decorators` and map it to Angular-compatible graph runtime types, using `ngDiagram` when the optional dependency is available.

## 2. Objectives
*   [x] Add a dedicated Angular graph adapter folder and public exports.
*   [x] Map canonical graph nodes and ports to the Angular graph runtime shape.
*   [x] Keep the adapter optional so the package can build without the graph runtime installed.

## 3. Implementation Plan
**Proposed Changes:**
*   Add a graph adapter layer in `for-angular/src/graph`.
*   Introduce the minimum Angular-facing services/components/directives needed to render graph nodes and handles.
*   Treat `ngDiagram` as an optional dependency and guard the integration path accordingly.

**Technical Details:**
*   The adapter should translate canonical Decaf graph definitions, not read raw decorator metadata directly.
*   The adapter should remain separate from the existing UI rendering system so graph rendering can evolve independently.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: graph definitions map to Angular runtime structures
*   [x] Integration Test: adapter loads when `ngDiagram` is available

**Manual Verification:**
*   Confirm the Angular package still builds when the optional graph dependency is absent.

## 5. Blockers & Clarifications
*   **Clarification 1:** What exact public API should the Angular graph adapter expose first?

## 6. Execution Log
*   [2026-06-18] - Created the Angular graph adapter task for DECAF-24.
*   [2026-06-18] - Implemented the Angular graph adapter, demo page, and ngDiagram integration.
