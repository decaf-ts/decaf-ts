# TASK-190: Inventory all workflow files and classify them by reuse potential

**ID:** TASK-190
**Specification:** [DECAF-29](../DECAF_29.md)
**Priority:** High
**Status:** Completed

## 1. Description
Inventory every GitHub Actions workflow in the workspace and classify each one as reusable, hybrid, or repository-local.

This task establishes the factual baseline for the migration work by listing workflow files, event triggers, guards, and exceptions before any refactor begins.

## 2. Objectives
*   [x] Capture the workflow file set for every repository in the workspace.
*   [x] Record the trigger conditions and notable guards for each workflow.
*   [x] Classify each workflow by reuse potential.
*   [x] Identify the workflows that already exist in `reusable-actions` and the ones that do not.

## 3. Implementation Plan
**Proposed Changes:**
*   Scan every `.github/workflows` directory in the workspace.
*   Group workflows by repository and file name.
*   Compare the discovered workflows against the reusable-actions repository.
*   Record the classification outcome in this task file and the DECAF-29 spec if needed.

**Technical Details:**
*   Include event triggers, branch/tag filters, path filters, and skip conditions in the inventory.
*   Treat repo-only automation and repo-specific helper workflows as non-reusable unless analysis proves otherwise.
*   Keep the inventory focused on workflow behavior rather than implementation details alone.

## 4. Verification Plan
**Automated Tests:**
*   [x] Workspace workflow scan completed.

**Manual Verification:**
*   [x] Reviewed repository-specific exceptions.
*   [x] Confirmed the baseline reusable workflow set.

## 5. Blockers & Clarifications
*   None yet.

## 6. Execution Log
*   2026-06-24 - Task file created.
*   2026-06-24 - Completed workspace-wide workflow inventory and classified the reusable baseline versus repository-specific outliers.

## 7. Inventory Results

### Workspace coverage
The workspace currently contains GitHub Actions workflows in these roots:

*   `.`
*   `as-zod`
*   `cli`
*   `core`
*   `crypto`
*   `db-decorators`
*   `decoration`
*   `decorator-validation`
*   `demo`
*   `for-angular`
*   `for-couchdb`
*   `for-fabric`
*   `for-http`
*   `for-nano`
*   `for-nest`
*   `for-nextjs`
*   `for-pouch`
*   `for-react`
*   `for-react-native`
*   `for-typeorm`
*   `injectable-decorators`
*   `integrations`
*   `logging`
*   `reusable-actions`
*   `styles`
*   `transactional-decorators`
*   `ui-decorators`
*   `utils`
*   `web-page`

### Shared baseline present in `reusable-actions`
These reusable workflows already exist in `reusable-actions/.github/workflows`:

*   `codeql-analysis.yml`
*   `jest-coverage.yaml`
*   `nodejs-build-prod.yaml`
*   `pages.yaml`
*   `publish-on-release.yaml`
*   `release-on-merge-pr.yml`
*   `release-on-tag.yaml`
*   `snyk-analysis.yaml`

### Shared workflows still duplicated outside `reusable-actions`
These workflows are widely duplicated across the workspace but are not yet centralized in `reusable-actions`:

*   `trivy-scan.yml`
*   `auto-merge-renovate.yml`
*   `bug-in-progress-workflow.yml`
*   `bug-pull-request-workflow.yml`
*   `renovate.yml`
*   `release-chain.yaml`

### Repository-local workflows
These workflows are intentionally repo-specific and should remain local unless a later task proves otherwise:

*   Root workspace:
    *   `release-chain.yaml`
    *   `auto-merge-renovate.yml`
    *   `bug-in-progress-workflow.yml`
    *   `bug-pull-request-workflow.yml`
    *   `renovate.yml`
    *   `trivy-scan.yml`
*   `for-angular`:
    *   `playwright.yml`
*   `for-couchdb`:
    *   `docker-couchdb.yaml`
    *   `docker-couchdb-boot.yaml`
*   `integrations`:
    *   `jest-test.yaml`
    *   `release-alpha-on-tag.yaml`
*   `web-page`:
    *   `static.yml`

### Classification summary
*   Reusable and already centralized: build, coverage, release, pages, publish, CodeQL, and Snyk workflows.
*   Shared but still duplicated: Trivy scanning and repository-governance workflows.
*   Repo-specific: Docker bootstrap, Playwright, static site, and alpha-release/test-only workflows.
