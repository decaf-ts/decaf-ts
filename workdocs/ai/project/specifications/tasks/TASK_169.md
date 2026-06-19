# TASK-169: Harden and test `@allowIf`/`@blockIf`

**ID:** TASK-169
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** High
**Status:** Completed

## 1. Description
`core/src/auth/decorators.ts`'s `allowIf`/`blockIf` proxy the decorated method and unconditionally call `thisArg["logCtx"](args, target.name, true)`. There is currently zero test coverage for either decorator, and no guard for `thisArg` lacking a `logCtx` method — today that case throws an opaque `TypeError` from inside the proxy's `apply` trap. Harden both decorators to fail clearly, and add the missing tests.

## 2. Objectives
*   [x] In both `allowIf` and `blockIf`, check `typeof (thisArg as any).logCtx === "function"` before calling it.
*   [x] When the check fails, throw `UnsupportedError` (`core/src/persistence/errors.ts`) with a message naming the decorator and the class/method it was applied to.
*   [x] Add a full unit test suite for `allowIf`/`blockIf`: handler allows (method runs), handler returns an `AuthorizationError` (method is blocked, error propagates), handler throws (wrapped per existing `InternalError` behavior), and the new missing-`logCtx` guard (throws `UnsupportedError`).

## 3. Implementation Plan
**Proposed Changes:**
*   Modify `core/src/auth/decorators.ts`: add the guard at the top of each proxy's `apply` trap, before the existing `thisArg["logCtx"](...)` call.
*   Add `core/tests/unit/auth-decorators.test.ts` (or similar) covering the scenarios in Objectives.

**Technical Details:**
*   Reuse `UnsupportedError` exactly as `core/src/persistence/ContextLock.ts` already does for `maxConcurrentTransactions=0` (DECAF-7) — same error class, same "operation isn't available" semantics.
*   Keep the existing `InternalError` wrapping behavior for a throwing handler unchanged; only add the new pre-check for the missing-`logCtx` case.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit test: `allowIf` permits the call when the handler returns nothing.
*   [x] Unit test: `allowIf`/`blockIf` propagate the `AuthorizationError` returned by the handler.
*   [x] Unit test: a handler that throws is wrapped in `InternalError`.
*   [x] Unit test: decorating a method on a class without `logCtx` throws `UnsupportedError`, not a raw `TypeError`.

**Manual Verification:**
*   N/A — fully covered by automated tests.

## 5. Blockers & Clarifications
*   **Resolved:** No current callers in the repo relied on the old crash-on-missing-`logCtx` behavior.
*   **Resolved:** `allowIf` and `blockIf` remain intentionally symmetric; the handler controls the allow/block decision and the tests assert identical behavior for both decorators.

## 6. Execution Log
*   [2026-06-19] - Implemented `logCtx` existence guard for both `allowIf` and `blockIf`, added regression tests for success, authorization failure, handler throw, and missing-`logCtx` cases, and kept the decorators symmetric by design.
