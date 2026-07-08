# TASK-241: Tests — History Service, Auto-Save Debounce, Save Endpoint, Toolbar UX, Keyboard Shortcuts

**ID:** TASK-241
**Specification:** [DECAF-36](../DECAF_36.md)
**Priority:** High
**Status:** Completed

## 1. Description
Add comprehensive test coverage for all DECAF-36 deliverables: `GraphHistoryService` ring buffer semantics, `GraphAutoSaveService` debounce, `GraphSaveService` + backend endpoint, `GraphToolbarComponent` button states and interactions, keyboard shortcut guards, and mutation detection wiring.

## 2. Objectives
*   [ ] `GraphHistoryService` tests — push/undo/redo, limit eviction, multi-workflow isolation, redo truncation, clear/clearAll, edge cases (undo at bottom, redo at top).
*   [ ] `GraphAutoSaveService` tests — debounce timing, enabled/disabled, flush, no-op when disabled.
*   [ ] `GraphSaveService` tests — save call, isSaving state, error handling, context propagation.
*   [ ] Backend `PUT /graph/workflow/:id` integration test — persist + retrieve snapshot round-trip.
*   [ ] `GraphToolbarComponent` tests — button disabled states, save click, undo/redo click, auto-save toggle.
*   [ ] Keyboard shortcut tests — undo/redo trigger, input-focus guard, auto-save-on disables.
*   [ ] Mutation detector tests — each mutation type routes to correct service.
*   [ ] All tests pass, lint clean, build clean.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-angular/tests/graph/GraphHistoryService.test.ts`.
*   Create `for-angular/tests/graph/GraphAutoSaveService.test.ts`.
*   Create `for-angular/tests/graph/GraphSaveService.test.ts`.
*   Create `for-angular/tests/graph/GraphToolbarComponent.test.ts`.
*   Create `for-angular/tests/graph/GraphKeyboardShortcutsService.test.ts`.
*   Create `for-angular/tests/graph/GraphMutationDetectorService.test.ts`.
*   Create `integrations/tests/nest/graph/GraphWorkflowSave.test.ts`.

**Technical Details:**
*   Follow Constitution §3 Testing Philosophy — avoid mocking unless IO.
*   Use Jest with existing `for-angular` test config.
*   Backend integration test boots NestJS module with RamAdapter (existing pattern from DECAF-32 TASK-224).

## 4. Verification Plan
**Automated Tests:**
*   [ ] All test files listed above pass.
*   [ ] `npm run lint` clean in `for-angular` and `integrations`.
*   [ ] `npm run build` clean in `for-angular` and `integrations`.

**Manual Verification:**
*   Playwright verification of toolbar UX (button states, save, undo/redo, auto-save toggle).

## 5. Blockers & Clarifications
*   Depends on all prior tasks (TASK-234 through TASK-240).

## 6. Execution Log
*(empty)*
