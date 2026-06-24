# TASK-192: Update consumer repositories to call the shared workflows and replicate the trigger rules

**ID:** TASK-192
**Specification:** [DECAF-29](../DECAF_29.md)
**Priority:** High
**Status:** Completed

## 1. Description
Update each consuming repository so it invokes the shared workflows from `reusable-actions` and retains the correct trigger and guard behavior.

This task ensures the move to reusable workflows does not alter CI semantics.

## 2. Objectives
*   [x] Replace duplicated workflow bodies with reusable workflow calls where possible.
*   [x] Replicate branch, tag, path, and skip rules across the consumer repositories.
*   [x] Keep repository-local workflows only where a local wrapper is required.
*   [x] Preserve existing CI behavior during and after migration.

## 3. Implementation Plan
**Proposed Changes:**
*   Update consumer workflow files to call the shared reusable workflows.
*   Preserve local trigger rules that cannot be moved into the reusable repository.
*   Mirror conditions such as `[skip ci]`, release-only flows, and repo-specific filters.
*   Adjust secrets and permissions in each repository where needed.

**Technical Details:**
*   Keep the consumer repositories thin where possible.
*   Ensure path filters and event conditions remain semantically equivalent after the refactor.
*   Avoid consolidating workflows that intentionally differ in behavior.

## 4. Verification Plan
**Automated Tests:**
*   [x] Consumer workflow files updated.
*   [x] Representative workflow calls resolve to the reusable repo.

**Manual Verification:**
*   [x] Checked trigger parity across repositories.
*   [x] Reviewed repo-specific exclusions and wrappers.

## 5. Blockers & Clarifications
*   None yet.

## 6. Execution Log
*   2026-06-24 - Task file created.
*   2026-06-24 - Converted all consumer `trivy-scan` workflows to thin wrappers around `reusable-actions/.github/workflows/trivy-scan.yml@main` while preserving each repository's trigger block.

## 7. Results & Artifacts
*   `.github/workflows/trivy-scan.yml`
*   `as-zod/.github/workflows/trivy-scan.yml`
*   `cli/.github/workflows/trivy-scan.yml`
*   `core/.github/workflows/trivy-scan.yml`
*   `crypto/.github/workflows/trivy-scan.yml`
*   `db-decorators/.github/workflows/trivy-scan.yml`
*   `decoration/.github/workflows/trivy-scan.yml`
*   `decorator-validation/.github/workflows/trivy-scan.yml`
*   `demo/.github/workflows/trivy-scan.yml`
*   `for-angular/.github/workflows/trivy-scan.yml`
*   `for-couchdb/.github/workflows/trivy-scan.yml`
*   `for-fabric/.github/workflows/trivy-scan.yml`
*   `for-http/.github/workflows/trivy-scan.yml`
*   `for-nano/.github/workflows/trivy-scan.yml`
*   `for-nest/.github/workflows/trivy-scan.yml`
*   `for-pouch/.github/workflows/trivy-scan.yml`
*   `for-react/.github/workflows/trivy-scan.yml`
*   `for-react-native/.github/workflows/trivy-scan.yml`
*   `for-typeorm/.github/workflows/trivy-scan.yml`
*   `integrations/.github/workflows/trivy-scan.yml`
*   `injectable-decorators/.github/workflows/trivy-scan.yml`
*   `logging/.github/workflows/trivy-scan.yml`
*   `styles/.github/workflows/trivy-scan.yml`
*   `transactional-decorators/.github/workflows/trivy-scan.yml`
*   `ui-decorators/.github/workflows/trivy-scan.yml`
*   `utils/.github/workflows/trivy-scan.yml`
