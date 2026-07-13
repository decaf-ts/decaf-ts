# TASK DECAF-41-3: Exports, README, and Unit Tests

**ID:** DECAF-41-3
**Specification:** [DECAF-41](../DECAF_41.md)
**Priority:** High
**Status:** Completed

## 1. Description

Wire the builder exports, update documentation, and add comprehensive unit tests.

## 2. Objectives

*   [x] Update `integrations/src/kibana/index.ts` to re-export builders
*   [x] Update `integrations/README.md` with KibanaIndexBuilder documentation
*   [x] Create comprehensive unit tests for all three modes, validation, collection, and field pass-through

## 3. Implementation Plan

**Proposed Changes:**
*   Modified `integrations/src/kibana/index.ts` — added `export * from "./builders"`
*   Modified `integrations/README.md` — added KibanaIndexBuilder mention
*   Created `integrations/tests/unit/kibana/builders.test.ts` — 18 tests

**Technical Details:**
*   Tests import `KibanaIndexMatchMode` from `../../../src/kibana/types` (not from builders barrel)
*   LOGGER_GENERATED tests register temporary `LogParameterDescriptor` entries and clean up after
*   Validation tests verify `ValidationError` is thrown for missing required fields

## 4. Verification Plan

**Automated Tests:**
*   [x] `tests/unit/kibana/builders.test.ts` — 18 builder + collection tests
*   [x] `tests/unit/kibana.test.ts` — 3 existing helper tests (still pass after refactor)
*   [x] Lint passes (eslint clean)
*   [x] Build passes (no TypeScript errors in kibana files)

**Manual Verification:**
*   All 21 kibana tests pass (18 new + 3 existing)

## 5. Blockers & Clarifications

*   None.

## 6. Execution Log

*   2026-07-11 - Wired exports, wrote tests, updated README.
*   2026-07-11 - Fixed lint error (unused `KibanaDataViewConfig` import in test).
*   2026-07-11 - All 21 tests pass, lint clean, build clean.
