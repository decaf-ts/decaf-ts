# DECAF-11 — Property-Scoped Persistent Sequences

- **Status:** Planned
- **Priority:** High
- **Goal:** Introduce a new `@sequence(...)` decorator in `core` that preserves persistent sequence metadata per model property, keeps `@pk()` backwards compatible, and propagates the contract through `for-couchdb`, `for-nano`, and `for-fabric`.

---

## 1. Overview
Add a first-class `@sequence(...)` decorator to the `core` module so any model property can be backed by a persistent sequence, not only the primary key. The sequence identity must be stable and derived from the model identity plus the property name. The new decorator must accept the same options as `@pk`, and `@pk` should remain compatible with existing models while conceptually becoming a specialized wrapper around `@sequence`.

This work also requires extending `Model.pk(class, ...)` and the related metadata lookup paths so callers can request sequence data for a specific property when it exists, while still defaulting to the `@pk` property for legacy behavior. Once the core contract exists, the same sequence semantics must be honored by the CouchDB, Nano, and Fabric adapters, with Fabric additionally respecting the existing private/shared/mirror data constraints.

## 2. Goals
*   [ ] Define and expose `@sequence(...)` in `core` with the same option surface as `@pk`.
*   [ ] Preserve backwards compatibility so existing `@pk()` models and sequence consumers keep working unchanged unless they opt into property-scoped lookup.
*   [ ] Extend adapter behavior so non-primary-key sequences can be created, resolved, and advanced consistently in `for-couchdb`, `for-nano`, `for-pouch`, `for-typeorm`, and `for-fabric` (with Fabric respecting private/shared/mirror semantics).

## 3. User Stories / Requirements
*   **US-1:** As a model author, I want to decorate a non-primary-key property with `@sequence(...)` so the property receives persistent incremental values just like a generated primary key.
*   **US-2:** As an adapter maintainer, I want one sequence metadata contract in `core` so downstream modules do not need ad-hoc logic for primary keys versus other generated properties.
*   **US-3:** As a Fabric integrator, I want property-based sequences to obey the same private/shared/mirror data rules already enforced for generated identifiers.
*   **Req-1:** `@sequence(...)` must accept the same options as `@pk(...)`.
*   **Req-2:** The persistent sequence name must be derived from the model identity plus the decorated property name, so distinct properties never share the same counter unintentionally.
*   **Req-3:** `Model.pk(class, ...)` must be able to resolve sequence metadata for a requested property when present, but default to the `@pk`-decorated attribute for backwards compatibility.
*   **Req-4:** `@pk(...)` must continue to behave as it does today for callers that do not use `@sequence(...)`.
*   **Req-5:** The implementation order must be `core` first, then `for-couchdb`, then `for-nano`, then `for-fabric`.
*   **Req-6:** Verification must include builds/tests in each affected module, with `for-fabric` limited to unit coverage and explicit checks for private/shared/mirror behavior.

## 4. Architecture & Design
The feature starts in `core/src/identity`, where sequence metadata is currently tied to `DBKeys.ID` and primary-key helpers. The new design should separate sequence-bearing property metadata from the notion of the model primary key while preserving the existing primary-key metadata path as the default resolution.

Key design points:
*   Add a dedicated `@sequence(...)` decorator in `core/src/identity/decorators.ts` and export it from the same public surface as `@pk`.
*   Store per-property sequence metadata so `Model.sequenceFor(model, property)` and related helpers can resolve either the legacy PK sequence or a property-specific sequence.
*   Keep `@pk(...)` compatible by making it either delegate to or share the same underlying sequence decorator implementation, while still marking the property as the model id.
*   Update repository/model construction flows that currently assume the only generated sequence is the primary key.
*   Extend the adapter implementations so property-scoped sequences are persisted and interpreted consistently across CouchDB, Nano, and Fabric.
*   For Fabric, ensure sequence-backed properties still respect world-state routing rules for shared, private, and mirror records.

## 5. Tasks Breakdown
| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-109 | [Implement property-scoped `@sequence(...)` across core, CouchDB, Nano, and Fabric](./tasks/TASK_109.md) | High | Pending | - |

## 6. Open Questions / Risks
*   What is the exact existing `Model.pk(class, ...)` overload behavior that must be preserved while adding property-aware lookup?
*   Which current create/update hooks assume only the PK may be sequence-generated, and do any of them need a more general generated-property pass?
*   How should Fabric store or derive sequence names for mirrored/private data so cross-scope collisions cannot occur?

## 7. Results & Artifacts
*   New `@sequence(...)` decorator in `core`.
*   Updated model/repository/adapter metadata resolution for property-scoped sequences.
*   Regression tests in `core`, `for-couchdb`, `for-nano`, and `for-fabric`.
*   Documentation updates describing when to use `@pk(...)` versus `@sequence(...)`.
