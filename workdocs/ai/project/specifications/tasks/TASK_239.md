# TASK-239: Keyboard Shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z) with Input-Focus Guard

**ID:** TASK-239
**Specification:** [DECAF-36](../DECAF_36.md)
**Priority:** Medium
**Status:** Completed

## 1. Description
Add keyboard shortcuts for Undo (`Ctrl/Cmd+Z`) and Redo (`Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y`). Shortcuts must be disabled when focus is inside a text input, textarea, or code editor (CodeMirror) to avoid conflicts with native editing behavior.

## 2. Objectives
*   [ ] `Ctrl/Cmd+Z` → Undo (calls `GraphHistoryService.undo()` + restores snapshot).
*   [ ] `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` → Redo (calls `GraphHistoryService.redo()` + restores snapshot).
*   [ ] Guard: shortcuts disabled when `document.activeElement` is an `<input>`, `<textarea>`, or inside a `.cm-editor` (CodeMirror) or `[contenteditable]` element.
*   [ ] Shortcuts disabled when Auto-Save is ON (no undo/redo in auto-save mode).
*   [ ] Prevent default browser behavior on undo/redo when handled.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `for-angular/src/graph/services/GraphKeyboardShortcutsService.ts` — `@HostListener` or `@HostListener`-equivalent global keydown handler.
*   Register on graph page component or as a global service.

**Technical Details:**
*   Listen on `window` `keydown` event.
*   Check `event.target` / `document.activeElement` tag name and parent selectors.
*   Use `event.preventDefault()` when handling.
*   Cross-platform: `event.metaKey || event.ctrlKey`.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-angular/tests/graph/GraphKeyboardShortcutsService.test.ts` — shortcut triggers undo/redo, input-focus guard prevents trigger, auto-save-on disables shortcuts.

**Manual Verification:**
*   Focus canvas, press Ctrl+Z, verify undo.
*   Focus a text input, press Ctrl+Z, verify native undo (not graph undo).

## 5. Blockers & Clarifications
*   Depends on TASK-237 (toolbar) and TASK-234 (history).

## 6. Execution Log
*(empty)*
