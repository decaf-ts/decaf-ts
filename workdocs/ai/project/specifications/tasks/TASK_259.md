# TASK-259: Update Jest `globalTeardown` usage to the transpiled `@decaf-ts/utils/tests` export and document the contract

**ID:** TASK-259
**Specification:** [Link to Specification](../DECAF_46.md)
**Priority:** Medium
**Status:** Completed

## 1. Description

Switch the Jest teardown wiring to the transpiled `@decaf-ts/utils/tests` helper so the consumer no longer depends on the raw source script path.

## 2. Objectives

*   [x] Point Jest `globalTeardown` at the transpiled helper export.
*   [x] Keep the consuming config compatible with the built CJS/ESM output.
*   [x] Document the expected environment variables and disabled-path behavior.

## 3. Implementation Plan

**Proposed Changes:**
*   Replace the raw `.cjs` path in the consumer configuration with the transpiled export.
*   Document the env var contract and how to disable Xray teardown.
*   Add a short note explaining where the shared helper lives in `@decaf-ts/utils/tests`.

**Technical Details:**
*   The consumer should load the same helper after transpilation without a wrapper shim.
*   Preserve the current operational contract for Xray reporting, including the skip path.

## 4. Verification Plan

**Automated Tests:**
*   [x] Config resolution check for the transpiled `globalTeardown` export
*   [x] Regression coverage for disabled Xray teardown

**Manual Verification:**
*   Confirm the consumer repo points at the shared export and not the original script file.

## 5. Blockers & Clarifications

*   **Clarification 1:** Which consuming repository should be updated first after the shared helper is transpiled?

## 6. Execution Log

*   [2026-08-17] - Added `utils/tsconfig.jest.json` and updated Jest to use it for ts-jest resolution.
*   [2026-08-17] - Verified the new helper via the focused Jest suite and the full package test run.
