# TASK-186: Extract or parameterize shared workflows in `reusable-actions`

**ID:** TASK-186
**Specification:** [DECAF-28](../DECAF_28.md)
**Priority:** High
**Status:** Pending

## 1. Description
Refactor workflows that are shared across repositories so the common behavior lives in `reusable-actions` and the remaining differences are exposed as inputs.

This task turns the inventory into reusable workflow definitions or reusable workflow inputs.

## 2. Objectives
*   [ ] Move reusable workflow bodies into `reusable-actions` where appropriate.
*   [ ] Parameterize commands, versions, secrets, and other repository-specific inputs.
*   [ ] Preserve existing workflow behavior while reducing duplication.
*   [ ] Identify any workflow that cannot be generalized and document why.

## 3. Implementation Plan
**Proposed Changes:**
*   Update shared workflows under `reusable-actions/.github/workflows`.
*   Add or refine workflow inputs for install, build, test, release, and reporting steps.
*   Normalize reusable permissions and environment assumptions where possible.
*   Leave repo-specific wrapper workflows only when the trigger wiring must stay local.

**Technical Details:**
*   Preserve compatibility with the current consumers.
*   Keep shared workflows generic enough for the widest practical set of repositories.
*   Avoid encoding repository-specific names or paths unless they are truly universal.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Reusable workflow definitions updated.
*   [ ] Consumer repositories still reference valid workflow calls.

**Manual Verification:**
*   [ ] Confirmed reusable workflow inputs cover the known use cases.
*   [ ] Confirmed repo-local exceptions remain intentionally local.

## 5. Blockers & Clarifications
*   None yet.

## 6. Execution Log
*   2026-06-24 - Task file created.

