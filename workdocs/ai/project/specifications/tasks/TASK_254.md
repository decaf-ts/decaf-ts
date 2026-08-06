# TASK-254: Implement the Ionic standalone cron-selector component and reactive-form binding

**ID:** TASK-254
**Specification:** [Link to Specification](../DECAF_44.md)
**Priority:** High
**Status:** Completed

## 1. Description

Implement the new standalone Ionic component in `for-angular` that lets users build a cron schedule visually and emits the selected schedule as a cron string.

## 2. Objectives

*   [x] Create the standalone Ionic component and template.
*   [x] Support daily, hourly, and weekly schedule modes.
*   [x] Bind the component cleanly to Angular reactive forms.

## 3. Implementation Plan

**Proposed Changes:**
*   Add the component under `for-angular/src/lib/components/cron-selector/`.
*   Use `ion-segment`, `ion-select`, `ion-datetime`, `ion-modal`, and related Ionic controls.
*   Expose the generated cron value to parent components.

**Technical Details:**
*   Keep the UI opinionated and constrained to common medication schedule patterns.
*   Preserve a raw cron output for downstream consumers.

## 4. Verification Plan

**Automated Tests:**
*   [x] Unit Test: `for-angular/src/lib/components/cron-selector/cron-selector.component.spec.ts`

**Manual Verification:**
*   Validate each schedule mode through the UI and inspect the emitted cron string.

## 5. Blockers & Clarifications

*   **Clarification 1:** Should multiple daily times use one cron expression when possible, or always emit multiple expressions?
*   **Clarification 2:** Should the component use a value accessor or a simple input/output contract?

## 6. Execution Log

*   [2026-08-05] - Task created as part of DECAF-44.
*   [2026-08-05] - Implemented standalone Ionic component with CVA + `[(cron)]` binding and verified via Jest.
