# TASK-253: Define the cron-selector contract, serialization rules, and calendar-service multi-schedule requirements

**ID:** TASK-253
**Specification:** [Link to Specification](../DECAF_44.md)
**Priority:** High
**Status:** Pending

## 1. Description

Define the public contract for the new `cron-selector` component, including its supported modes, emitted cron format, and the calendar-service behavior required for semicolon-separated schedules.

## 2. Objectives

*   [ ] Document the supported schedule modes and their cron output rules.
*   [ ] Document the expected component API for Angular parent usage.
*   [ ] Define the calendar-service handling for multiple cron expressions.

## 3. Implementation Plan

**Proposed Changes:**
*   Add the formal contract to `workdocs/ai/project/specifications/DECAF_44.md`.
*   Clarify how daily, hourly, weekly, and raw cron outputs should be represented.
*   Define the semicolon-separated multi-schedule behavior for the calendar service.

**Technical Details:**
*   Keep the scope intentionally limited to the medication-schedule use case.
*   Avoid any dependency on Material or Bootstrap in the contract.

## 4. Verification Plan

**Automated Tests:**
*   [ ] Documentation review against the existing `for-angular` calendar/download flow.

**Manual Verification:**
*   Review the component contract against the current calendar service usage.

## 5. Blockers & Clarifications

*   **Clarification 1:** Should the component expose both a control-value-accessor and a direct cron input/output API?
*   **Clarification 2:** Should the calendar service default to multiple `VEVENT` entries or `RDATE` merging?

## 6. Execution Log

*   [2026-08-05] - Task created as part of DECAF-44.
