# TASK-155: Implement Graph Primitives and Exports in `ui-decorators`

**ID:** TASK-155
**Specification:** [DECAF-24: Graph Metadata Layer and Angular Graph Adapter](../DECAF_24.md)
**Priority:** High
**Status:** Completed

## 1. Description
Implement the framework-neutral graph primitives in `ui-decorators`, including the `@node(...)` and `@port(...)` decorators, metadata keys, and exports. This task should keep the module independent from any concrete graph library while making the graph contract discoverable and reusable.

## 2. Objectives
*   [x] Compose `@node(...)` from `@uimodel(...)` plus graph metadata.
*   [x] Implement `@port(...)` so it enriches existing property metadata rather than duplicating it.
*   [x] Export the graph primitives from the `ui-decorators` package surface.

## 3. Implementation Plan
**Proposed Changes:**
*   Formalize the `src/graph` folder as the canonical graph layer.
*   Add or update the graph metadata reader so downstream adapters can obtain a neutral graph definition.
*   Wire the graph submodule into the package entrypoint and subpath exports.

**Technical Details:**
*   Keep the implementation free of concrete graph-editor dependencies.
*   Use existing Decaf metadata as the source of truth for property-level details such as labels, types, and validation hints.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `@node(...)` composes UI and graph metadata
*   [ ] Unit Test: `@port(...)` derives graph metadata from existing Decaf metadata

**Manual Verification:**
*   Confirm the package exports the graph primitives without importing a renderer.

## 5. Blockers & Clarifications
*   **Clarification 1:** Should the graph primitives be exported from the package root or a dedicated `./graph` subpath, or both?

## 6. Execution Log
*   [2026-06-18] - Created the `ui-decorators` implementation task for DECAF-24.
*   [2026-06-18] - Implemented the graph decorators, readers, exports, and regression coverage in `ui-decorators`.
