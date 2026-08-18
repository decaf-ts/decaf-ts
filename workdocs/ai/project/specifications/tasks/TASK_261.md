# TASK-261: Short-circuit all mirror paths when `allow` returns `false`

**ID:** TASK-261
**Specification:** [Link to Specification](../DECAF_47.md)
**Priority:** High
**Status:** Completed

## 1. Description
Add the runtime short-circuit so every mirror-related contract, client, and repository path exits before any mirror reads, writes, gates, or context mutations when `allow(context)` returns `false`.

## 2. Objectives
*   [x] Skip mirror collection reads and writes when the predicate blocks mirroring.
*   [x] Skip mirror handlers and gates when the predicate blocks mirroring.
*   [x] Skip any mirror-specific context enrichment when the predicate blocks mirroring.

## 3. Implementation Plan

**Proposed Changes:**
*   Apply the early predicate check in shared decorator helpers.
*   Apply the early predicate check in contract-side mirror routing and write logic.
*   Apply the early predicate check in client-side mirror promotion and repository logic.

**Technical Details:**
*   The predicate must be evaluated before `allowMirroring` and before any other mirror side effect.
*   The result should behave as a hard bypass, not a partial disable path.

## 4. Verification Plan

**Automated Tests:**
*   [x] Unit Test: blocked contract-side mirror routing and writes
*   [x] Unit Test: blocked client-side mirror promotion and repository paths

**Manual Verification:**
*   Verify a false predicate produces no mirror reads, no mirror writes, and no mirror params in the context.

## 5. Blockers & Clarifications

*   **Clarification 1:** Should the bypass be evaluated once per operation, or once per model decoration access?

## 6. Execution Log

*   [2026-08-18] - Task created.
*   [2026-08-18] - Added the early allow predicate bypass to shared mirror handlers and the contract/client authorization paths.
