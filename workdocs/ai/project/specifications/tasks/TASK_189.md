# TASK-189: Validate the final workflow behavior across representative repositories

**ID:** TASK-189
**Specification:** [DECAF-28](../DECAF_28.md)
**Priority:** Medium
**Status:** Pending

## 1. Description
Validate the migrated workflows against representative repositories to confirm that the shared automation still behaves as expected.

This is the final confidence check for the DECAF-28 migration.

## 2. Objectives
*   [ ] Validate representative consumer repositories after migration.
*   [ ] Confirm build, coverage, release, and security workflows still execute correctly.
*   [ ] Check that the trigger conditions behave the same before and after the migration.
*   [ ] Record any remaining gaps or intentional exceptions.

## 3. Implementation Plan
**Proposed Changes:**
*   Run targeted workflow validations in representative repositories.
*   Compare results against the documented trigger matrix.
*   Verify that shared workflows resolve with the expected inputs and permissions.
*   Capture any remaining repo-local differences explicitly.

**Technical Details:**
*   Focus validation on the repositories that best represent the common and exceptional workflow patterns.
*   Prefer live workflow checks when practical.
*   Keep the validation tied to the inventory and rule matrix produced by the earlier tasks.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Representative workflow checks completed.

**Manual Verification:**
*   [ ] Confirmed no unexpected trigger regressions.
*   [ ] Confirmed known exceptions remain intentional.

## 5. Blockers & Clarifications
*   None yet.

## 6. Execution Log
*   2026-06-24 - Task file created.

