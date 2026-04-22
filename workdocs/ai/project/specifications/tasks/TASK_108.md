# TASK-108: Validate builder + documentation for `DecafModelControllerBuilder`

**ID:** TASK-108
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** Medium
**Status:** In Progress

## 1. Description
Add or update tests/docs to prove that `DecafModelControllerBuilder` only emits endpoints that are not blocked via `@BlockOperations`, that it preserves the existing `sqaggre` annotations/static helpers, and that `addComplexQueries` still wires decorated repository queries into the Nest surface.

## 2. Objectives
*   [ ] Create regression tests (unit or integration) that instantiate the builder for a sample model and assert only allowed CRUD/statements/queries exist.
*   [ ] Confirm that the builder copies over static helpers, such as `get class()` and any metadata-dependent methods, even when they are not exposed as HTTP routes.
*   [ ] Update or extend the documentation (README or for-nest docs) to explain how to use the new builder and how `@BlockOperations` affects the generated controller surface.

## 3. Implementation Plan
**Proposed Changes:**
*   Write Jest tests in `for-nest/tests` that register a mocked model with certain `BlockOperations` flags and inspect the generated prototype for absence of blocked routes.
*   Validate the Swagger decorators still pick up `sqaggre` (or equivalent) metadata by checking the controller's decorated metadata before and after builder usage.
*   Update the for-nest docs or README to describe the builder steps and the relationship between `BlockOperations` and controller surface.

**Technical Details:**
*   Reuse the existing fixtures (e.g., `Product.ts`) to avoid crafting new models when possible.
*   When testing dynamic queries, ensure `addComplexQueries` yields the same handler names and Swagger metadata as before.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit test that blocked statements are omitted from the generated class.
*   [ ] Integration/acceptance test that a decorated query still results in a Nest route when not blocked.

**Manual Verification:**
*   Inspect generated controller metadata to ensure `sqaggre` annotations remain and match the previous implementation.

## 5. Blockers & Clarifications
*   Need clarity on where `sqaggre` annotations currently live so the test can target the correct metadata keys.
*   Determine whether existing fixtures already cover dynamic queries or if new ones must be added.

## 6. Execution Log
-   [x] Added Jest coverage verifying `DecafModelControllerBuilder` omits blocked CRUD/statement/bulk routes, honors the new bulk-all block descriptor, and still registers metadata-driven query handlers; also corrected the metadata setup so controller queries load in tests.
