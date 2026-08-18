# TASK-260: Extend `@mirror()` metadata and typing with `allow(context)`

**ID:** TASK-260
**Specification:** [Link to Specification](../DECAF_47.md)
**Priority:** High
**Status:** Completed

## 1. Description
Extend the `for-fabric` mirror decorator contract so `@mirror()` can accept an optional `allow(context)` predicate and preserve that predicate in the stored mirror metadata.

## 2. Objectives
*   [x] Add the optional `allow(context): boolean` callback to the decorator surface.
*   [x] Ensure the predicate is stored alongside existing mirror metadata.
*   [x] Keep the existing decorator behavior unchanged when `allow` is omitted.

## 3. Implementation Plan

**Proposed Changes:**
*   Update the shared mirror decorator types in `for-fabric/src/shared/decorators.ts`.
*   Adjust any metadata helpers that read or write mirror configuration.
*   Preserve backward compatibility for existing `@mirror(collection, msp)` usages.

**Technical Details:**
*   The new predicate should be synchronous and accept the current `Context`.
*   The stored metadata should remain usable by the contract and client execution paths without changing the current metadata shape more than necessary.

## 4. Verification Plan

**Automated Tests:**
*   [x] Unit Test: decorator typing and metadata preservation for `allow(context)` - covered by the mirror decorator suite and the blocked-route metadata assertion.

**Manual Verification:**
*   Confirm existing `@mirror()` call sites continue to compile and behave as before when no `allow` callback is provided.

## 5. Blockers & Clarifications

*   **Clarification 1:** Should the predicate be exposed in any public metadata inspection helpers, or only consumed internally?

## 6. Execution Log

*   [2026-08-18] - Task created.
*   [2026-08-18] - Decorator contract updated to carry `allow(context)` metadata and preserve existing call patterns.
