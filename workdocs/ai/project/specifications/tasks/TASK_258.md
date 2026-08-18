# TASK-258: Add optional peer dependency metadata for any new teardown-only package imports

**ID:** TASK-258
**Specification:** [Link to Specification](../DECAF_46.md)
**Priority:** Medium
**Status:** Completed

## 1. Description

Update package metadata so any additional package needed only by the Xray teardown helper is declared as an optional peer dependency with optional peer metadata instead of becoming a hard requirement for all `utils` consumers.

## 2. Objectives

*   [x] Add the teardown-only package to `peerDependencies` if it is newly introduced.
*   [x] Mark the same package optional in `peerDependenciesMeta`.
*   [x] Keep the existing `@decaf-ts/logging` dependency path unchanged unless the implementation requires otherwise.

## 3. Implementation Plan

**Proposed Changes:**
*   Update `utils/package.json` dependency metadata.
*   Verify the package build still succeeds with the new metadata.

**Technical Details:**
*   Apply optional peer metadata only to packages used exclusively by the teardown helper.
*   Keep runtime imports stable for consumers that do not enable Xray teardown.

## 4. Verification Plan

**Automated Tests:**
*   [x] Package build verification in `utils`
*   [x] Unit coverage for any metadata-dependent helper logic

**Manual Verification:**
*   Confirm the package manifest exposes the new dependency as optional rather than required.

## 5. Blockers & Clarifications

*   **Clarification 1:** Is `fast-xml-parser` the only additional package that needs optional peer treatment?

## 6. Execution Log

*   [2026-08-17] - Added `fast-xml-parser` as an optional peer dependency in `utils/package.json`.
*   [2026-08-17] - Verified the utils build after the manifest update.
