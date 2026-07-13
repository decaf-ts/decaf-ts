# TASK DECAF-41-2: KibanaIndexBuilderCollection + Helpers Refactor

**ID:** DECAF-41-2
**Specification:** [DECAF-41](../DECAF_41.md)
**Priority:** High
**Status:** Completed

## 1. Description

Add `KibanaIndexBuilderCollection` for building multiple data views in one fluent chain, and refactor `createDefaultKibanaDataViewConfigs` to use the builder internally.

## 2. Objectives

*   [x] Create `KibanaIndexBuilderCollection` with `for()`, `add()`, `build()` methods
*   [x] Refactor `createDefaultKibanaDataViewConfigs` to use `KibanaIndexBuilder` internally
*   [x] Preserve existing function signature and return shape
*   [x] Update `integrations/src/kibana/builders/index.ts` re-exports

## 3. Implementation Plan

**Proposed Changes:**
*   Created `integrations/src/kibana/builders/KibanaIndexBuilderCollection.ts`
*   Modified `integrations/src/kibana/helpers.ts` — `createDefaultKibanaDataViewConfigs` now uses `KibanaIndexBuilder`
*   Updated `integrations/src/kibana/builders/index.ts` — re-exports collection

**Technical Details:**
*   Collection extends `Model` with `Model.fromModel(this, arg)` constructor
*   `builders` property is undecorated (not `@list`) because `KibanaIndexBuilder` is not in the model registry
*   `build()` calls `hasErrors()` then maps each builder's `build()`
*   Helpers refactor preserves exact return shape (`KibanaDataViewConfig[]`)

## 4. Verification Plan

**Automated Tests:**
*   [x] Existing `kibana.test.ts` — `createDefaultKibanaDataViewConfigs` still passes (same output)
*   [x] Collection tests — `for()`, `add()`, empty collection all pass

## 5. Blockers & Clarifications

*   None.

## 6. Execution Log

*   2026-07-11 - Implemented `KibanaIndexBuilderCollection` and refactored helpers.
*   2026-07-11 - All tests pass including existing helper tests.
