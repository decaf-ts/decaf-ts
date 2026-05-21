# TASK-133: Add JIRA_ENABLED spec synchronization for SPEC file updates

**ID:** TASK-133
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add automation to the agent workflow so that when `JIRA_ENABLED=true`, any update to a `SPEC` file also updates the matching Jira specification ticket. Description changes should be minimized, checklist/task status changes should be mirrored when needed, and status updates should be represented as Jira comments rather than rewriting the ticket description whenever possible.

## 2. Objectives
*   [ ] Detect SPEC file changes in the agent workflow.
*   [ ] Map each SPEC file to its matching Jira ticket.
*   [ ] Update Jira tickets when SPEC files change while minimizing description churn.
*   [ ] Record status changes as Jira comments.
*   [ ] Ensure ticket updates happen before the workflow advances to the next agent stage.

## 3. Implementation Plan
**Proposed Changes:**
*   Integrate Jira update hooks into the agent workflow when `JIRA_ENABLED=true`.
*   Add SPEC-to-ticket mapping logic.
*   Use comments for status updates and reserve description edits for meaningful content changes.

**Technical Details:**
*   The sync logic should avoid noisy Jira churn.
*   Only mirror checklist/task updates when they are part of the SPEC change.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: SPEC file changes trigger Jira update behavior when `JIRA_ENABLED=true`.
*   [ ] Unit Test: status changes are added as Jira comments rather than description rewrites.

**Manual Verification:**
*   Modify a SPEC file in a JIRA-enabled environment and confirm the matching ticket is updated.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Started task.
