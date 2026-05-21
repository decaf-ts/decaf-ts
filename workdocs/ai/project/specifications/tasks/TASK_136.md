# TASK-136: Define context flag shape and flavour metadata contract

**ID:** TASK-136
**Specification:** [Link to Specification](../DECAF_18.md)
**Priority:** High
**Status:** Pending

## 1. Description
Define the canonical `ContextFlags` shape for the core context system, including the `flavour` metadata field and any required defaulting behavior needed by `Context` and `ContextualLoggedClass`.

## 2. Objectives
*   [ ] Document the minimum state a context must carry.
*   [ ] Specify how `flavour` defaults to `DecafFlavour` when not provided.
*   [ ] Clarify which flags are mandatory versus optional for derived contexts.

## 3. Implementation Plan
**Proposed Changes:**
*   Review `core/src/persistence/types.ts` and the existing context flag composition.
*   Update the spec language so future implementations know which overrides are required when creating derived contexts.

**Technical Details:**
*   Keep the flag contract compatible with existing `ContextFlags` and `AdapterFlags` usage.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: default flavour resolution is documented and enforced.

**Manual Verification:**
*   [ ] Review the resulting spec language for clarity and consistency with current core APIs.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Created task stub.
