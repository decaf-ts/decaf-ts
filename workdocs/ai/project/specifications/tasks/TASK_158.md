# TASK-158: Add `@graph(...)` Workflow-Root Metadata in `ui-decorators`

**ID:** TASK-158
**Specification:** [DECAF-24: Graph Metadata Layer and Angular Graph Adapter](../DECAF_24.md)
**Priority:** High
**Status:** Completed

## 1. Description
Introduce a workflow-root `@graph(...)` decorator in `ui-decorators` that models the entire pipeline as a decorated class. The decorator must be generic, framework-neutral, and capable of wrapping future workflow/pipeline engines without coupling to Angular or `ngDiagram`.

## 2. Objectives
*   [x] Add a `@graph(...)` class decorator to the canonical graph layer.
*   [x] Represent workflow inputs, outputs, nodes, and relations in one graph-root contract.
*   [x] Keep the contract generic enough to target arbitrary workflow engines later.

## 3. Implementation Plan
**Proposed Changes:**
*   Extend `ui-decorators/src/graph` with a graph-root decorator and reader support.
*   Define the workflow-level metadata shape for inputs, outputs, nodes, and links.
*   Ensure existing `@node(...)` and `@port(...)` primitives remain usable as node-level building blocks under the workflow root.

**Technical Details:**
*   `@graph(...)` must not assume a renderer or execution backend.
*   The graph-root metadata should be able to describe workflows, pipelines, and future orchestration primitives consistently.
*   Existing UI and validation metadata should remain the source for labels, field types, and constraints.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: graph-root metadata can be read from a decorated class.
*   [x] Unit Test: workflow inputs/outputs and relations are exposed through the reader.

**Manual Verification:**
*   Review the contract to ensure it can represent non-Angular workflow engines without leaking renderer concepts.

## 5. Blockers & Clarifications
*   **Clarification 1:** Should `@graph(...)` be a strict superset of `@node(...)`, or a separate root contract that can compose with node metadata?

## 6. Execution Log
*   [2026-06-18] - Created the workflow-root graph metadata task for DECAF-24.
*   [2026-06-18] - Implemented `@graph(...)` workflow-root metadata, reader support, and workflow input/output derivation in `ui-decorators`.
