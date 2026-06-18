# TASK-154: Define the Canonical Graph Metadata Contract and Merge Rules

**ID:** TASK-154
**Specification:** [DECAF-24: Graph Metadata Layer and Angular Graph Adapter](../DECAF_24.md)
**Priority:** High
**Status:** Completed

## 1. Description
Define the canonical graph metadata shape that `ui-decorators` will own, including node, port, category, icon, size, color, grouping, and connection-rule fields. This task also defines how graph metadata merges with existing Decaf UI metadata so graph rendering stays derived from a single source of truth.

## 2. Objectives
*   [x] Define the canonical `GraphNodeDefinition` and `GraphPortDefinition` shapes.
*   [x] Define merge rules for `@uimodel(...)`, `@uielement(...)`, validation metadata, and graph metadata.
*   [x] Document which fields are source-of-truth fields and which fields are derived.

## 3. Implementation Plan
**Proposed Changes:**
*   Review the existing `ui-decorators/src/graph` subtree and turn it into the authoritative graph contract.
*   Document the graph metadata keys and the property-level merge rules for derived port metadata.
*   Capture the adapter-facing output model that downstream packages will consume.

**Technical Details:**
*   The canonical contract should remain framework-neutral and should not mention Angular, ngDiagram, Foblex, or any other renderer.
*   The merge rules should prefer existing Decaf metadata for labels, validation, and field types, while graph metadata only contributes graph-specific semantics.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: graph metadata shape and merge rules

**Manual Verification:**
*   Confirm the spec text is specific enough for the implementation tasks to proceed without ambiguity.

## 5. Blockers & Clarifications
*   **Clarification 1:** Which graph runtime should the Angular adapter target first? (Expected: `ngDiagram`.)
*   **Clarification 2:** Should the graph contract expose a subpath entry or only package-root exports?

## 6. Execution Log
*   [2026-06-18] - Created the canonical graph metadata task for DECAF-24.
*   [2026-06-18] - Defined the canonical graph shapes and merge rules in the DECAF-24 spec.
