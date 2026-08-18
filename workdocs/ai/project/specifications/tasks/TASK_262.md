# TASK-262: Add regression coverage for blocked and allowed mirror execution paths

**ID:** TASK-262
**Specification:** [Link to Specification](../DECAF_47.md)
**Priority:** High
**Status:** In Progress

## 1. Description
Add regression tests covering both the blocked and allowed mirror flows so the new predicate does not break current mirror behavior when it is truthy or absent.

## 2. Objectives
*   [x] Verify that `allow(context) === false` bypasses all mirror behavior.
*   [ ] Verify that `allow(context) === true` preserves existing mirror behavior.
*   [ ] Verify that omitting `allow` preserves existing mirror behavior.

## 3. Implementation Plan

**Proposed Changes:**
*   Add focused unit tests around the decorator and shared mirror helpers.
*   Add contract-side coverage for mirror routing, writes, and authorization.
*   Add client-side coverage for promotion, repository reads, and context mutation.

**Technical Details:**
*   Prefer high-signal tests that fail if any mirror side effect still leaks through a blocked predicate.
*   Reuse existing mirror fixtures where possible to keep the regression coverage small and explicit.

## 4. Verification Plan

**Automated Tests:**
*   [x] Unit Test: predicate false blocks all mirror behavior - covered in the contract and repository suites.
*   [ ] Unit Test: predicate true preserves existing mirror behavior
*   [ ] Unit Test: omitted predicate preserves existing mirror behavior

**Manual Verification:**
*   Review the captured mirror metadata and context state in each test path.

## 5. Blockers & Clarifications

*   **Clarification 1:** Should the new tests live in the existing mirror suites or in a new dedicated suite?

## 6. Execution Log

*   [2026-08-18] - Task created.
*   [2026-08-18] - Added false-branch regression coverage in the mirror contract and repository suites; client adapter harness coverage remains pending.
