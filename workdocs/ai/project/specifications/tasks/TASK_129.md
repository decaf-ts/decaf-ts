# TASK-129: Expand Jira ticket templates with custom-field tracking and professional incident/release layouts

**ID:** TASK-129
**Specification:** [Link to Specification](../DECAF_16.md)
**Priority:** High
**Status:** Completed

## 1. Description
Expand the resource-backed Jira ticket templates so the guided creation flow can track template-specific custom fields and prompt the user for missing values before the ticket is created. The default templates should be more operationally useful, especially for bug, incident, and release/change request tickets.

## 2. Objectives
*   [x] Track template-specific custom fields in the catalog and prompt metadata.
*   [x] Add more professional bug, incident, and release/change request markdown layouts.
*   [x] Ensure the template-backed flow can collect and render values such as impact, evidence, affected components, rollback plan, test plan, and acceptance criteria.

## 3. Implementation Plan
**Proposed Changes:**
*   Extend the Jira ticket template catalog with field metadata for each default template.
*   Update the template-backed prompt to surface the required custom fields and ask for missing values before the tool call.
*   Rewrite the bug template and add new incident and release/change request templates as first-class resources.

**Technical Details:**
*   Keep the templates resource-backed so the prompt and tool continue to share the same source of truth.
*   Preserve backwards compatibility for `jira-issue-create` and the existing template merge logic.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: prompt generation lists template-specific custom fields.
*   [x] Unit Test: bug, incident, and release templates render the expected sections.
*   [x] Integration Test: resource listings expose the expanded template set.

**Manual Verification:**
*   Ask the model to "open a bug ticket" and confirm it asks for impact and reproduction details before creating the ticket.
*   Ask for an incident and a release/change request ticket and confirm the guided flow uses the new layouts.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Started task.
*   [2026-05-21] - Completed the expanded template set, custom-field metadata, and per-template docs split.
