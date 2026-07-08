# TASK-234: GraphHistoryService — In-Memory Ring Buffer with Multi-Workflow Support

**ID:** TASK-234
**Specification:** [DECAF-36](../DECAF_36.md)
**Priority:** High
**Status:** Completed

## 1. Description
Create a `@service()`-decorated `GraphHistoryService` in `for-angular/src/graph/services/GraphHistoryService.ts` that maintains an in-memory ring buffer of graph snapshots per workflow ID. Supports undo, redo, configurable cache limit (default 10), and multiple concurrent workflows.

## 2. Objectives
*   [ ] Implement `GraphHistoryService` with `@service()` decorator from `@decaf-ts/core`.
*   [ ] Per-workflow ring buffer (`Map<string, GraphSnapshot[]>`) with cursor tracking.
*   [ ] `push()`, `undo()`, `redo()`, `canUndo()`, `canRedo()`, `clear()`, `clearAll()`, `setLimit()`.
*   [ ] Ring buffer eviction (FIFO when limit exceeded).
*   [ ] Redo stack truncation on `push()` after an undo (standard undo/redo semantics).
*   [ ] Configurable limit via `GRAPH_HISTORY_LIMIT` injection token (default 10).

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-angular/src/graph/services/GraphHistoryService.ts`.
*   Create `for-angular/src/graph/tokens/graph-configuration.tokens.ts` with `GRAPH_HISTORY_LIMIT`.
*   Register provider in `for-angular/src/graph/for-angular-graph.module.ts`.

**Technical Details:**
*   Use `GraphSnapshot` type from `@decaf-ts/integrations/graph/shared` (DECAF-32 §5.11).
*   `@service()` from `@decaf-ts/core` per Constitution §2 Service Pattern.
*   Throw `InternalError` (Decaf error) if `undo()`/`redo()` called when no snapshot available — never native `Error`.
*   Frontend-safe: no `isolated-vm`, `acorn`, or engine imports.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-angular/tests/graph/GraphHistoryService.test.ts` — push/undo/redo, limit eviction, multi-workflow isolation, redo truncation, clear/clearAll.

**Manual Verification:**
*   Push 3 snapshots, undo twice, push new (verify redo stack truncated).

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*(empty)*
