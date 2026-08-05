# TASK-255: Update the calendar service for semicolon-separated cron expressions and add verification coverage

**ID:** TASK-255
**Specification:** [Link to Specification](../DECAF_44.md)
**Priority:** Medium
**Status:** Pending

## 1. Description

Update the calendar/download service so it correctly handles semicolon-separated cron values emitted by the new component and turns them into valid calendar output.

## 2. Objectives

*   [ ] Split semicolon-separated cron strings into independent schedules.
*   [ ] Produce either multiple `VEVENT` entries or merged `RDATE` values.
*   [ ] Add tests that cover the mixed-time medication schedule case.

## 3. Implementation Plan

**Proposed Changes:**
*   Adjust the calendar service parsing logic to recognize multi-expression cron input.
*   Preserve existing behavior for single cron expressions.
*   Add documentation for the new multi-schedule behavior.

**Technical Details:**
*   Prevent accidental hour/minute Cartesian products when multiple times are selected.
*   Keep the output compatible with the current download workflow.

## 4. Verification Plan

**Automated Tests:**
*   [ ] Unit Test: `for-angular/tests/calendar/calendar.service.spec.ts`
*   [ ] Integration Test: `for-angular/tests/calendar/calendar-download.integration.spec.ts`

**Manual Verification:**
*   Feed a semicolon-separated cron string into the calendar workflow and confirm the resulting calendar output contains separate occurrences.

## 5. Blockers & Clarifications

*   **Clarification 1:** Should the service prefer multiple `VEVENT` entries or `RDATE` aggregation by default?
*   **Clarification 2:** Are there existing ICS helpers in `for-angular` that should be reused for schedule splitting?

## 6. Execution Log

*   [2026-08-05] - Task created as part of DECAF-44.
