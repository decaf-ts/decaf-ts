# TASK-257: Port the Xray teardown script into `utils/src/tests/` and re-export it from the tests entry point

**ID:** TASK-257
**Specification:** [Link to Specification](../DECAF_46.md)
**Priority:** High
**Status:** Completed

## 1. Description

Move the teardown logic from the standalone `jest-xray-teardown.cjs` script into a shared utility under `utils/src/tests/`, then export it from `utils/src/tests/index.ts` so the helper is available through `@decaf-ts/utils/tests`.

## 2. Objectives

*   [x] Preserve the existing environment variable contract and disabled-path behavior.
*   [x] Keep the same XML parsing, payload upload, and GraphQL helper flow.
*   [x] Expose the helper through the `tests` export in a transpilation-friendly shape.

## 3. Implementation Plan

**Proposed Changes:**
*   Create a shared teardown module under `utils/src/tests/`.
*   Export the helper from `utils/src/tests/index.ts`.
*   Keep the helper pure enough for direct Jest `globalTeardown` usage.

**Technical Details:**
*   Preserve the current console messages and exit behavior when reporting is disabled.
*   Keep the same Xray auth/import endpoints and result-processing rules.

## 4. Verification Plan

**Automated Tests:**
*   [x] Unit Test: `utils/tests/unit/tests.test.ts`
*   [x] Unit Test: `utils/tests/unit/jest-xray-teardown.test.ts`

**Manual Verification:**
*   Confirm the transpiled `@decaf-ts/utils/tests` export resolves from the consuming Jest config.

## 5. Blockers & Clarifications

*   **Clarification 1:** Should the helper export both a default function and a named function for compatibility?

## 6. Execution Log

*   [2026-08-17] - Shared teardown helper added to `utils/src/tests/` and exported from the tests entry point.
*   [2026-08-17] - Verified the helper with disabled, happy-path, and missing-JUnit regression tests.
