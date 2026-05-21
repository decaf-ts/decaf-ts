# TASK-138: Preserve parent-child linkage and logger propagation across derived contexts

**ID:** TASK-138
**Specification:** [Link to Specification](../DECAF_18.md)
**Priority:** High
**Status:** Pending

## 1. Description
Define how new contexts derived from previous ones must retain parent-child relationships and preserve the active logger, including any `.for(...)` customization applied to the logger chain.

## 2. Objectives
*   [ ] Document parent/child linkage rules for derived contexts.
*   [ ] Define logger inheritance behavior for nested contexts.
*   [ ] Capture the requirement that derived contexts retain scoped logging consistency.

## 3. Implementation Plan
**Proposed Changes:**
*   Describe how a new child context links back to its parent and how descendants remain discoverable.
*   Specify that the same logger instance must be reused across context derivations after customization.

**Technical Details:**
*   Keep the logger propagation contract compatible with the existing `.for(...)` usage in `logCtx`.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: derived contexts keep parent linkage.
*   [ ] Unit Test: derived contexts preserve logger scoping.

**Manual Verification:**
*   [ ] Inspect nested call examples to ensure logger behavior is unambiguous.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Created task stub.
