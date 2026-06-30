# TASK-108: Validate builder + documentation for `ModelControllerBuilder` parity

**ID:** TASK-108
**Specification:** [Link to Specification](../DECAF_10.md)
**Priority:** Medium
**Status:** Completed

## 1. Description
Add or update tests/docs to prove that the `for-http/server` model controller builder and factory only emit endpoints that are not blocked via `@BlockOperations`, that they preserve the existing controller metadata/static helpers, and that decorated repository queries still wire into the Nest surface through the parity layer.

## 2. Objectives
*   [x] Create regression tests (unit or integration) that instantiate the builder for a sample model and assert only allowed CRUD/statements/queries exist.
*   [x] Confirm that the builder copies over static helpers, such as `get class()` and any metadata-dependent methods, even when they are not exposed as HTTP routes.
*   [x] Update or extend the documentation (README or for-nest docs) to explain how to use the new builder and how `@BlockOperations` affects the generated controller surface.

## 3. Implementation Plan
**Proposed Changes:**
*   Write Jest tests in `for-http/tests` and `for-nest/tests` that compare the factory output with the legacy hardcoded controller surface and assert blocked routes are omitted.
*   Validate the Nest-facing parity layer still preserves route metadata and repository query wiring.
*   Update the for-nest docs or README to describe the builder steps and the relationship between `BlockOperations` and controller surface.

**Technical Details:**
*   Reuse the existing fixtures (e.g., `Product.ts`) to avoid crafting new models when possible.
*   When testing dynamic queries, ensure `addComplexQueries` yields the same handler names and route metadata as before.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit test that blocked statements are omitted from the generated class.
*   [x] Integration/acceptance test that a decorated query still results in a Nest route when not blocked.

**Manual Verification:**
*   Inspect generated controller metadata to ensure the preserved route metadata matches the previous implementation.

## 5. Blockers & Clarifications
*   No current source `sqaggre` producer exists in the tree, so that portion of the original requirement is treated as compatibility documentation rather than an active source assertion.
*   Existing fixtures cover the dynamic-query and composed-PK cases used by the parity tests.

## 6. Execution Log
-   [x] Added Jest coverage in `for-http/tests` and `for-nest/tests` proving `ModelControllerBuilder`/`ModelControllerFactory` parity, blocked CRUD/statement/bulk routes, composed-PK fallback paths, and repository-query wiring.
-   [x] Updated `for-nest/README.md` and `for-nest/workdocs/5-HowToUse.md` to document `controllerConfig`, `allowStatementlessQuery`, `allowGroupingQueries`, and `allowBulkStatement`.
-   [x] Reconciled the old `DecafModelControllerBuilder` wording: the implementation now lives in `for-http/server`, while the legacy Nest controller path remains as the consumer/parity layer.
