# TASK-238: Mutation Detection Wiring — Connect Existing Signals/Events to Auto-Save/History

**ID:** TASK-238
**Specification:** [DECAF-36](../DECAF_36.md)
**Priority:** High
**Status:** Completed

## 1. Description
Wire existing Angular signals and ngDiagram events to detect workflow mutations and route them to either `GraphAutoSaveService.onMutation()` (when auto-save is ON) or `GraphHistoryService.push()` (when auto-save is OFF). Mutations include: node drag-end, edge connect/disconnect, port toggle, and node CRUD modal save.

## 2. Objectives
*   [ ] Capture node positioning mutations (drag-end event from ngDiagram).
*   [ ] Capture edge connection mutations (edge-added event/signal).
*   [ ] Capture edge disconnection mutations (edge-removed event/signal).
*   [ ] Capture port toggle mutations (`GraphNodeConfigStore.setPortMode()` / `portModes` signal change).
*   [ ] Capture node CRUD save mutations (`GraphNodeEditModalComponent.save()` result).
*   [ ] Route to auto-save or history based on `GraphAutoSaveService.enabled`.
*   [ ] Build snapshot via `buildGraphRendererSnapshot()` before pushing/saving.

## 3. Implementation Plan
**Proposed Changes:**
*   Create or extend `for-angular/src/graph/services/GraphMutationDetectorService.ts` — central mutation detection and routing.
*   Inject `GraphAutoSaveService`, `GraphHistoryService`, `GraphNodeConfigStore`, and graph renderer state.
*   Wire to ngDiagram events in the graph page component.

**Technical Details:**
*   Use Angular `effect()` to watch `GraphNodeConfigStore` signal changes for port toggles.
*   Use ngDiagram event emitters for drag-end, edge-add, edge-remove.
*   Use `GraphNodeEditModalComponent` save result callback for CRUD mutations.
*   Snapshot built via `buildGraphRendererSnapshot()` (DECAF-32 §20.4) — reuses existing serialization.
*   Node drag: push snapshot on drag-end only (not on every mouse-move) to avoid history flooding.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-angular/tests/graph/GraphMutationDetectorService.test.ts` — verify each mutation type triggers correct routing (auto-save vs. history).

**Manual Verification:**
*   Drag a node, verify snapshot pushed to history (auto-save off) or debounced save (auto-save on).
*   Toggle a port, verify same.
*   Save a node CRUD modal, verify same.

## 5. Blockers & Clarifications
*   Depends on TASK-234 (history) and TASK-236 (auto-save).
*   Need to identify exact ngDiagram event names for drag-end, edge-add, edge-remove.

## 6. Execution Log
*(empty)*
