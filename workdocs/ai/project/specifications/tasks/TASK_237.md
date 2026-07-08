# TASK-237: GraphToolbarComponent — Save, Auto-Save Toggle, Undo, Redo Buttons

**ID:** TASK-237
**Specification:** [DECAF-36](../DECAF_36.md)
**Priority:** High
**Status:** Completed

## 1. Description
Create a `GraphToolbarComponent` in `for-angular/src/graph/components/graph-toolbar/` that renders Undo, Redo, Auto-Save toggle, Save, and Start buttons on the top-right of the canvas. Undo/Redo interact with `GraphHistoryService`; Save calls `GraphSaveService`; Auto-Save toggle binds to `GraphAutoSaveService.enabled`.

## 2. Objectives
*   [ ] Implement `GraphToolbarComponent` (TS + HTML + SCSS).
*   [ ] Undo button — disabled when `!canUndo()`, calls `GraphHistoryService.undo()` and restores snapshot to canvas.
*   [ ] Redo button — disabled when `!canRedo()`, calls `GraphHistoryService.redo()` and restores snapshot to canvas.
*   [ ] Auto-Save toggle — `ion-toggle` bound to `GraphAutoSaveService.enabled`, default OFF.
*   [ ] Save button — calls `GraphSaveService.save()`, shows loading spinner while saving, success/error toast.
*   [ ] Start button — existing run functionality (re-positioned/aligned with Save).
*   [ ] Undo/Redo hidden or disabled when Auto-Save is ON (per §6 Q1 default).
*   [ ] Export from `for-angular/src/graph/components/index.ts`.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-angular/src/graph/components/graph-toolbar/graph-toolbar.component.ts`.
*   Create `for-angular/src/graph/components/graph-toolbar/graph-toolbar.component.html`.
*   Create `for-angular/src/graph/components/graph-toolbar/graph-toolbar.component.scss`.
*   Register in `for-angular/src/graph/components/for-angular-graph-components.module.ts`.
*   Export from `for-angular/src/graph/components/index.ts`.
*   Add to graph page template (replace/augment existing Start button area).

**Technical Details:**
*   Use Angular signals for reactive button states (`canUndo`, `canRedo`, `isSaving`, `autoSaveEnabled`).
*   Use Ionic components (`ion-button`, `ion-toggle`, `ion-spinner`, `ion-toast`).
*   Snapshot restoration: call `buildGraphRendererStateFromSnapshot()` (DECAF-32 §20.4) to restore canvas state from history snapshot.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-angular/tests/graph/GraphToolbarComponent.test.ts` — button states, disabled conditions, save click, undo/redo click.

**Manual Verification:**
*   Verify button alignment (top-right, Save aligned with Start).
*   Verify Undo/Redo disabled states.
*   Verify Auto-Save toggle default OFF.

## 5. Blockers & Clarifications
*   Depends on TASK-234 (history) and TASK-236 (auto-save).

## 6. Execution Log
*(empty)*
