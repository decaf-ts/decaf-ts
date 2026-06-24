# TASK-185: Inventory all workflow files and classify them by reuse potential

**ID:** TASK-185
**Specification:** [DECAF-28](../DECAF_28.md)
**Priority:** High
**Status:** Pending

## 1. Description
Inventory every GitHub Actions workflow in the workspace and classify each one as reusable, hybrid, or repository-local.

This task establishes the factual baseline for the migration work by listing workflow files, event triggers, guards, and exceptions before any refactor begins.

## 2. Objectives
*   [ ] Capture the workflow file set for every repository in the workspace.
*   [ ] Record the trigger conditions and notable guards for each workflow.
*   [ ] Classify each workflow by reuse potential.
*   [ ] Identify the workflows that already exist in `reusable-actions` and the ones that do not.

## 3. Implementation Plan
**Proposed Changes:**
*   Scan every `.github/workflows` directory in the workspace.
*   Group workflows by repository and file name.
*   Compare the discovered workflows against the reusable-actions repository.
*   Record the classification outcome in this task file and the DECAF-28 spec if needed.

**Technical Details:**
*   Include event triggers, branch/tag filters, path filters, and skip conditions in the inventory.
*   Treat repo-only automation and repo-specific helper workflows as non-reusable unless analysis proves otherwise.
*   Keep the inventory focused on workflow behavior rather than implementation details alone.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Workspace workflow scan completed.

**Manual Verification:**
*   [ ] Reviewed repository-specific exceptions.
*   [ ] Confirmed the baseline reusable workflow set.

## 5. Blockers & Clarifications
*   None yet.

## 6. Execution Log
*   2026-06-24 - Task file created.

