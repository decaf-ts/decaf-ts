# TASK-137: Implement context transition rules in `ContextualLoggedClass.logCtx`

**ID:** TASK-137
**Specification:** [Link to Specification](../DECAF_18.md)
**Priority:** High
**Status:** Pending

## 1. Description
Define how `ContextualLoggedClass.logCtx(...)` decides whether an incoming argument list already contains a usable `Context` and when it must derive a new one through the `.context()` path.

## 2. Objectives
*   [ ] Specify the two supported `logCtx` call shapes.
*   [ ] Capture the reuse-versus-derive decision matrix for context-bearing args.
*   [ ] Record the operation-based transition rule.

## 3. Implementation Plan
**Proposed Changes:**
*   Describe the `MaybeContextualArg<T>` and `ContextualArgs<T>` call contracts.
*   Write the expected decision flow for existing versus missing contexts.

**Technical Details:**
*   The spec should make the transition behavior explicit enough that services and repositories can rely on it uniformly.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `logCtx` reuses a compatible incoming context.
*   [ ] Unit Test: `logCtx` requests a new context when no context is present.

**Manual Verification:**
*   [ ] Validate the documented call examples against current core service patterns.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Created task stub.
