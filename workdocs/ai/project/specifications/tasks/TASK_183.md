# TASK-183: Extract shared workflows and migrate consuming repositories

**ID:** TASK-183
**Specification:** [DECAF-27](../DECAF_27.md)
**Priority:** High
**Status:** Completed

## 1. Description
Extract the shared GitHub Actions workflow set into `reusable-actions/.github/workflows` and migrate the workspace consumers to call the shared definitions instead of duplicating the implementation inline.

This task focuses on the common baseline identified in TASK-181. Repository-specific outliers remain local for now.

## 2. Objectives
*   [x] Extract the common baseline workflows into `reusable-actions/.github/workflows`.
*   [x] Convert the workspace root workflows into thin reusable-workflow callers.
*   [x] Preserve existing trigger shapes in the consumer workflows.
*   [x] Leave repository-specific outlier workflows untouched.

## 3. Implementation Plan
**Proposed Changes:**
*   Copy the shared workflow logic into reusable workflows under `reusable-actions/.github/workflows`.
*   Replace the root `.github/workflows` definitions with wrapper workflows that call the shared repo.
*   Keep outlier workflows such as `for-angular/playwright.yml` and `for-couchdb/docker-*` local.

**Technical Details:**
*   The reusable workflows use `workflow_call` so they can be invoked as a shared automation layer.
*   The root consumer workflows keep their original event triggers and simply forward execution to the shared repo.
*   Shared secrets are inherited in the caller so the reusable workflows can continue to use the existing token names.

## 4. Verification Plan
**Automated Tests:**
*   [x] Workflow files updated in the workspace.

**Manual Verification:**
*   Confirmed reusable workflow definitions exist in `reusable-actions/.github/workflows`.
*   Confirmed the root workspace workflows now reference the shared reusable workflows.
*   Confirmed repository-specific outlier workflows were not changed.

## 5. Blockers & Clarifications
*   None. The migration could be applied directly from the inventory results.

## 6. Execution Log
*   2026-06-23 - Started task.
*   2026-06-23 - Extracted the shared baseline workflows and migrated the workspace consumer workflows to reusable calls across all applicable repositories.

## 7. Results & Artifacts
*   `reusable-actions/.github/workflows/codeql-analysis.yml`
*   `reusable-actions/.github/workflows/jest-coverage.yaml`
*   `reusable-actions/.github/workflows/nodejs-build-prod.yaml`
*   `reusable-actions/.github/workflows/pages.yaml`
*   `reusable-actions/.github/workflows/publish-on-release.yaml`
*   `reusable-actions/.github/workflows/release-on-merge-pr.yml`
*   `reusable-actions/.github/workflows/release-on-tag.yaml`
*   `reusable-actions/.github/workflows/snyk-analysis.yaml`
*   `.github/workflows/codeql-analysis.yml`
*   `.github/workflows/jest-coverage.yaml`
*   `.github/workflows/nodejs-build-prod.yaml`
*   `.github/workflows/pages.yaml`
*   `.github/workflows/publish-on-release.yaml`
*   `.github/workflows/release-on-merge-pr.yml`
*   `.github/workflows/release-on-tag.yaml`
*   `.github/workflows/snyk-analysis.yaml`
*   Consumer repository workflow callers updated across the workspace, including `as-zod`, `cli`, `core`, `crypto`, `db-decorators`, `decoration`, `decorator-validation`, `demo`, `for-angular`, `for-couchdb`, `for-fabric`, `for-http`, `for-nano`, `for-nest`, `for-pouch`, `for-react-native`, `for-typeorm`, `injectable-decorators`, `logging`, `styles`, `transactional-decorators`, `ui-decorators`, `utils`, and `web-page` for the applicable shared workflows.
*   `reusable-actions/README.md`
