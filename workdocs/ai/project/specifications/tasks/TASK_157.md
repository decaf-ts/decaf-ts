# TASK-157: Add Tests, Documentation, and Package Wiring for Graph Support

**ID:** TASK-157
**Specification:** [DECAF-24: Graph Metadata Layer and Angular Graph Adapter](../DECAF_24.md)
**Priority:** Medium
**Status:** Completed

## 1. Description
Add the documentation, package wiring, and regression coverage needed to make the new graph layer usable and maintainable. This includes export paths, README/spec updates, and tests that protect the canonical metadata contract.

## 2. Objectives
*   [x] Add regression tests for graph metadata and adapter behavior.
*   [x] Update the relevant module documentation and package exports.
*   [x] Record the optional dependency and loading strategy for the Angular adapter.

## 3. Implementation Plan
**Proposed Changes:**
*   Add tests around the graph metadata reader, node decorator composition, and port derivation.
*   Update `ui-decorators` and `for-angular` documentation to explain the split between canonical graph metadata and renderer-specific adapters.
*   Wire package manifests and exports so the graph layer is discoverable without forcing the optional adapter dependency.

**Technical Details:**
*   The documentation should make it explicit that `ui-decorators` is the canonical metadata layer and `for-angular` is only one adapter.
*   Any package wiring should preserve backwards compatibility for existing non-graph consumers.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: graph contract regression coverage
*   [x] Integration Test: package exports and optional dependency wiring

**Manual Verification:**
*   Review the generated docs/readme snippets for consistency with the spec.

## 5. Blockers & Clarifications
*   **Clarification 1:** Which docs must be updated first when the implementation starts?

## 6. Execution Log
*   [2026-06-18] - Created the graph support documentation/testing task for DECAF-24.
*   [2026-06-18] - Added `for-angular` graph demo coverage, routing, menu wiring, and regression tests.
