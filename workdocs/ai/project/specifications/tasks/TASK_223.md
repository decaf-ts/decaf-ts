# TASK-223: Workdocs for Graph Engine (Basic Workflow, Fan-in/Fan-out, Loops, Pinnable Nodes, Angular Events/Pinning UI)

**ID:** TASK-223
**Specification:** [DECAF-32: Decaf Graph Execution Engine](../DECAF_32.md)
**Priority:** Medium
**Status:** Pending

## 1. Description
Add the workdocs listed in DECAF-32 §14: basic workflow, fan-in/fan-out, foreach loop, while loop, pinnable nodes (core/integrations), and Angular execution-events and pinning-ui guides.

## 2. Objectives
*   [ ] Add `integrations/workdocs/graph/basic-workflow.md` (workflow input -> node -> workflow output).
*   [ ] Add `integrations/workdocs/graph/fan-in-fan-out.md` (A->C, B->C, C->D, C->E).
*   [ ] Add `integrations/workdocs/graph/foreach-loop.md` (items -> foreach(body workflow) -> results).
*   [ ] Add `integrations/workdocs/graph/while-loop.md` (stateful loop with `count < 10`).
*   [ ] Add `integrations/workdocs/graph/pinnable-nodes.md` (`@pinnable()`, pinning completed node, dependency pinning, cache hit on next run, custom value store adapter).
*   [ ] Add `for-angular/workdocs/graph/execution-events.md` (Angular event subscription and node-state mapping).
*   [ ] Add `for-angular/workdocs/graph/pinning-ui.md` (pin button, pinned badge, cache-hit state, dependency pinning).

## 3. Implementation Plan
**Proposed Changes:**
*   Create the workdoc files with worked examples referencing the implemented APIs.
*   Ensure examples match the actual public exports from `@decaf-ts/integrations/graph` and `@decaf-ts/for-angular/graph`.

**Technical Details:**
*   Keep docs concise and example-driven; reference the spec for full semantics.

## 4. Verification Plan
**Automated Tests:**
*   [ ] None (documentation).

**Manual Verification:**
*   Confirm examples compile against the implemented APIs.

## 5. Blockers & Clarifications
*   Depends on TASK-222 (tests) so examples match verified behaviour.

## 6. Execution Log
*   [pending] - Task created during DECAF-32 specification.
