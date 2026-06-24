# TASK-188: Document the action-by-action trigger and condition matrix

**ID:** TASK-188
**Specification:** [DECAF-28](../DECAF_28.md)
**Priority:** Medium
**Status:** Pending

## 1. Description
Document the trigger and guard conditions for each GitHub Actions workflow so the workspace has a clear rule matrix for future changes.

This task produces the decision record that explains what each workflow does, what prevents it from running, and what must stay repository-local.

## 2. Objectives
*   [ ] Document the triggers for every workflow.
*   [ ] Record the guard conditions and skip logic for every workflow.
*   [ ] Identify which inputs are required for each reusable workflow.
*   [ ] Capture the repository-local exceptions and the reason they remain local.

## 3. Implementation Plan
**Proposed Changes:**
*   Create a workflow-by-workflow rule matrix.
*   Include events, filters, permissions, and dependency assumptions.
*   Summarize what behavior is replicated across all consumers.
*   Link the documentation back to the DECAF-28 specification.

**Technical Details:**
*   Treat the matrix as the acceptance record for the migration.
*   Keep the terminology consistent across repositories.
*   Prefer precise behavior descriptions over broad summaries.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Rule matrix published in the task artifact.

**Manual Verification:**
*   [ ] Confirmed each workflow has an explicit trigger/condition entry.
*   [ ] Confirmed exceptions are documented with rationale.

## 5. Blockers & Clarifications
*   None yet.

## 6. Execution Log
*   2026-06-24 - Task file created.

