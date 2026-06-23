# TASK-184: Document reuse patterns and validation steps

**ID:** TASK-184
**Specification:** [DECAF-27](../DECAF_27.md)
**Priority:** Medium
**Status:** Completed

## 1. Description
Document how the new `reusable-actions` repository is intended to be consumed, including the current caller pattern, the secret-handling approach, and the validation checklist for future workflow updates.

## 2. Objectives
*   [x] Document the reusable workflow caller pattern.
*   [x] Document how secrets and triggers should be handled when consuming the shared workflows.
*   [x] Document validation steps for future updates.
*   [x] Keep the documentation aligned with the current workspace implementation.

## 3. Implementation Plan
**Proposed Changes:**
*   Extend `reusable-actions/README.md` with a concrete caller example and reuse rules.
*   Document the current shared workflow contract, including `workflow_call` usage and `secrets: inherit`.
*   Capture a practical validation checklist for future workflow edits.

**Technical Details:**
*   Describe the shared-workflow reference pattern using the current workspace form: `decaf-ts/reusable-actions/.github/workflows/<file>@main`.
*   Make clear that repository-specific triggers remain in the caller.
*   Explain that outlier workflows stay local until they are explicitly migrated.

## 4. Verification Plan
**Automated Tests:**
*   Not applicable. This task updates documentation only.

**Manual Verification:**
*   Reviewed the README content for the reusable workflow caller pattern.
*   Reviewed the checklist for trigger, secret, and local-workflow validation.

## 5. Blockers & Clarifications
*   None. The documentation could be written from the already implemented workflow layout.

## 6. Execution Log
*   2026-06-23 - Started task.
*   2026-06-23 - Documented reusable workflow caller pattern and validation checklist.

## 7. Results & Artifacts
*   `reusable-actions/README.md`
