# TASK-139: Document and verify nested contextual call patterns

**ID:** TASK-139
**Specification:** [Link to Specification](../DECAF_18.md)
**Priority:** Medium
**Status:** Pending

## 1. Description
Document the intended nested operation flow where an outer contextual method opens a context, passes `ctxArgs` to child calls, and each child decides whether to reuse or derive a new context of its own.

## 2. Objectives
*   [ ] Provide a reference nested-call example for services and repositories.
*   [ ] Explain how `ctxArgs` propagates through child methods.
*   [ ] Record the expected behavior when an inner method changes operation scope.

## 3. Implementation Plan
**Proposed Changes:**
*   Add clear usage guidance for `MaybeContextualArg<T>`-based methods.
*   Summarize the intended behavior when inner calls open their own operation contexts.

**Technical Details:**
*   Keep the documentation aligned with the `ContextualLoggedClass` contract so implementation and usage stay in sync.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: nested contextual call example remains valid against the documented contract.

**Manual Verification:**
*   [ ] Review the example workflow for readability and correctness.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Created task stub.
