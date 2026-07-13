# TASK DECAF-41-1: KibanaIndexBuilder with Three Matching Strategies

**ID:** DECAF-41-1
**Specification:** [DECAF-41](../DECAF_41.md)
**Priority:** High
**Status:** Completed

## 1. Description

Implement the `KibanaIndexBuilder` class and `KibanaIndexMatchMode` enum in `integrations/src/kibana/builders/`.

## 2. Objectives

*   [x] Add `KibanaIndexMatchMode` enum to `integrations/src/kibana/types.ts`
*   [x] Create `KibanaIndexBuilder.ts` with three matching strategies (EXACT, PREFIX, LOGGER_GENERATED)
*   [x] Builder extends `Model`, uses validation decorators, fluent setters, `build()` returns `KibanaDataViewConfig`
*   [x] LOGGER_GENERATED mode uses `logParameterRegistry.render()` from `@decaf-ts/logging`

## 3. Implementation Plan

**Proposed Changes:**
*   Modified `integrations/src/kibana/types.ts` — added `KibanaIndexMatchMode` enum
*   Created `integrations/src/kibana/builders/KibanaIndexBuilder.ts` — builder class
*   Created `integrations/src/kibana/builders/index.ts` — re-exports

**Technical Details:**
*   Builder extends `Model` from `@decaf-ts/decorator-validation`, constructor calls `Model.fromModel(this, arg)`
*   Properties decorated with `@required`, `@minlength`, `@option(KibanaIndexMatchMode)`, `@list`, `@prop`
*   `build()` calls `hasErrors()` → throws `ValidationError` on failure
*   `composeLoggerGenerated()` fills partial `LogParameterPayload` with defaults before rendering

## 4. Verification Plan

**Automated Tests:**
*   [x] Unit tests in `tests/unit/kibana/builders.test.ts` — all three modes, validation, field pass-through
*   [x] Build passes (no TypeScript errors in kibana files)
*   [x] Lint passes

## 5. Blockers & Clarifications

*   **Blocker 1:** `@list(() => KibanaIndexBuilder)` fails because builders are NOT `@model()` decorated and thus not in the model registry. (Resolution: Used undecorated `builders` property in collection — validation delegates to each builder's `build()`.)
*   **Blocker 2:** Array properties require `@list` decorator in the validation framework; `@list(() => Object)` works for `sourceFilters` since items are plain objects. (Resolution: Used `@list(() => Object)` for `sourceFilters`.)

## 6. Execution Log

*   2026-07-11 - Implemented `KibanaIndexMatchMode` enum and `KibanaIndexBuilder` class.
*   2026-07-11 - Fixed syntax error (`});` → `}`) and import paths.
*   2026-07-11 - All 21 unit tests pass, lint clean.
