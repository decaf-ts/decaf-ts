# TASK-255: Add raw cron serialization coverage for daily multi-time output and emitted semicolon-separated expressions

**ID:** TASK-255
**Specification:** [Link to Specification](../DECAF_44.md)
**Priority:** Medium
**Status:** Completed

## 1. Description

Add raw cron serialization coverage for daily multi-time output and emitted semicolon-separated expressions.

## 2. Objectives

*   [x] Verify semicolon-separated cron strings are emitted for mixed-minute daily schedules.
*   [x] Verify single-expression cron output for daily schedules that share a minute value.
*   [x] Add tests that cover the mixed-time medication schedule case.

## 3. Implementation Plan

**Proposed Changes:**
*   Validate the component's cron serialization rules for daily, hourly, and weekly modes.
*   Preserve existing behavior for single cron expressions.
*   Add documentation for the emitted multi-expression behavior.

**Technical Details:**
*   Prevent accidental hour/minute Cartesian products when multiple times are selected.
*   Keep the output compatible with downstream calendar or scheduling workflows.

## 4. Verification Plan

**Automated Tests:**
*   [x] Unit Test: `for-angular/src/lib/components/cron-selector/cron-selector.component.spec.ts`
*   [x] Page Smoke Test: `for-angular/src/app/pages/cron-selector/cron-selector.page.spec.ts`

**Manual Verification:**
*   Feed a semicolon-separated cron string into a downstream consumer and confirm the resulting output keeps separate occurrences distinct.

## 5. Blockers & Clarifications

*   **Clarification 1:** Should any downstream calendar integration prefer multiple `VEVENT` entries or `RDATE` aggregation by default?
*   **Clarification 2:** Are there existing ICS helpers outside the UI that should be reused for schedule splitting?

## 6. Execution Log

*   [2026-08-05] - Task created as part of DECAF-44.
*   [2026-08-05] - Completed with raw cron serialization coverage for multi-time daily schedules and downstream contract notes.
