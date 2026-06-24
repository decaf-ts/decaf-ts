# TASK-187: Update consumer repositories to call the shared workflows and replicate the trigger rules

**ID:** TASK-187
**Specification:** [DECAF-28](../DECAF_28.md)
**Priority:** High
**Status:** Pending

## 1. Description
Update each consuming repository so it invokes the shared workflows from `reusable-actions` and retains the correct trigger and guard behavior.

This task ensures the move to reusable workflows does not alter CI semantics.

## 2. Objectives
*   [ ] Replace duplicated workflow bodies with reusable workflow calls where possible.
*   [ ] Replicate branch, tag, path, and skip rules across the consumer repositories.
*   [ ] Keep repository-local workflows only where a local wrapper is required.
*   [ ] Preserve existing CI behavior during and after migration.

## 3. Implementation Plan
**Proposed Changes:**
*   Update consumer workflow files to call the shared reusable workflows.
*   Preserve local trigger rules that cannot be moved into the reusable repository.
*   Mirror conditions such as `[skip ci]`, release-only flows, and repo-specific filters.
*   Adjust secrets and permissions in each repository where needed.

**Technical Details:**
*   Keep the consumer repositories thin where possible.
*   Ensure path filters and event conditions remain semantically equivalent after the refactor.
*   Avoid consolidating workflows that intentionally differ in behavior.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Consumer workflow files updated.
*   [ ] Representative workflow calls resolve to the reusable repo.

**Manual Verification:**
*   [ ] Checked trigger parity across repositories.
*   [ ] Reviewed repo-specific exclusions and wrappers.

## 5. Blockers & Clarifications
*   None yet.

## 6. Execution Log
*   2026-06-24 - Task file created.

