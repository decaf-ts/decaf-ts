# TASK-109: Implement property-scoped `@sequence(...)` across core, CouchDB, Nano, and Fabric

**ID:** TASK-109
**Specification:** [Link to Specification](../DECAF_11.md)
**Priority:** High
**Status:** Pending

## 1. Description
Implement the new `@sequence(...)` decorator and the supporting metadata/runtime behavior so persistent sequences can be attached to arbitrary model properties, while preserving the current `@pk(...)` contract for existing users.

## 2. Objectives
*   [ ] Add `@sequence(...)` to `core` with the same options currently accepted by `@pk(...)`.
*   [ ] Make `Model.pk(class, ...)` and related helpers resolve property-specific sequence metadata when requested, while preserving the current PK default.
*   [ ] Propagate the sequence contract through `for-couchdb`, `for-nano`, and `for-fabric`, with Fabric unit coverage for private/shared/mirror behavior.

## 3. Implementation Plan
**Proposed Changes:**
*   Update `core/src/identity` and related overrides so sequence metadata is stored per property and reused by both `@pk(...)` and `@sequence(...)`.
*   Add or adjust repository/model-construction logic that currently assumes only the primary key is sequence-generated.
*   Update the affected adapter modules in the required order: `core`, `for-couchdb`, `for-nano`, then `for-fabric`.
*   Add regression coverage in each module, limiting Fabric verification to unit tests as requested.

**Technical Details:**
*   Preserve existing public behavior for `@pk(...)` users by defaulting unresolved lookups to the PK-decorated property.
*   Use a stable persistent sequence key derived from the model identity plus the decorated property name.
*   Keep Fabric changes aligned with the existing private/shared/mirror routing rules instead of introducing a separate persistence path.

## 4. Verification Plan
**Automated Tests:**
*   [ ] `core`: unit/integration coverage for `@sequence(...)`, property lookup, and backwards-compatible `@pk(...)` behavior.
*   [ ] `for-couchdb`: tests covering persistence and retrieval of property-scoped sequence behavior.
*   [ ] `for-nano`: tests covering adapter-level sequence behavior on top of CouchDB support.
*   [ ] `for-fabric`: unit tests covering shared/private/mirror compatibility for sequence-backed properties.

**Manual Verification:**
*   Inspect sequence naming and metadata resolution for both PK and non-PK properties on representative models.

## 5. Blockers & Clarifications
*   Confirm the final overload or argument shape expected for `Model.pk(class, ...)` before implementation begins.
*   Confirm whether any non-PK `@sequence(...)` property should auto-populate on create by default when `generated: true`, or only when explicitly used by model construction flows.

## 6. Execution Log
*   [2026-04-07] Task created from DECAF-11. Implementation intentionally deferred until follow-up.
