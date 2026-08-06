# TASK-253: Define the cron-selector contract, serialization rules, and downstream multi-schedule expectations

**ID:** TASK-253
**Specification:** [Link to Specification](../DECAF_44.md)
**Priority:** High
**Status:** Completed

## 1. Description

Define the public contract for the new `cron-selector` component, including its supported modes, emitted cron format, and the downstream expectations for semicolon-separated schedules.

## 2. Objectives

*   [x] Document the supported schedule modes and their cron output rules.
*   [x] Document the expected component API for Angular parent usage.
*   [x] Define the downstream handling expectations for multiple cron expressions.

## 3. Implementation Plan

**Proposed Changes:**
*   Add the formal contract to `workdocs/ai/project/specifications/DECAF_44.md`.
*   Clarify how daily, hourly, weekly, and raw cron outputs should be represented.
*   Define the semicolon-separated multi-schedule behavior for downstream consumers.

**Technical Details:**
*   Keep the scope intentionally limited to the medication-schedule use case.
*   Avoid any dependency on Material or Bootstrap in the contract.

## 4. Verification Plan

**Automated Tests:**
*   [x] Documentation review against the downstream scheduling contract.

**Manual Verification:**
*   Review the component contract against the downstream scheduling contract.

## 5. Blockers & Clarifications

*   **Clarification 1:** Should the component expose both a control-value-accessor and a direct cron input/output API?
*   **Clarification 2:** Should downstream calendar integrations default to multiple `VEVENT` entries or `RDATE` merging?

## 6. Execution Log

*   [2026-08-05] - Task created as part of DECAF-44.
*   [2026-08-05] - Completed as part of the cron-selector implementation and downstream contract update.
