# TASK-181: Inventory existing GitHub Actions usage across the workspace repositories

**ID:** TASK-181
**Specification:** [DECAF-27](../DECAF_27.md)
**Priority:** High
**Status:** Completed

## 1. Description
Inventory the current GitHub Actions layout across the `decaf-ts` workspace so the new `reusable-actions` repository can be designed around actual duplication instead of assumptions.

The inventory covers repo-level `.github/workflows` directories only. `node_modules` workflow files were excluded from the scan.

## 2. Objectives
*   [x] Identify every workspace repository that currently has GitHub Actions workflows.
*   [x] Capture the shared baseline workflow set used across the repositories.
*   [x] Highlight repository-specific workflow outliers that should not be blindly centralized.
*   [x] Record the inventory in a task artifact that can drive the reusable-actions migration.

## 3. Implementation Plan
**Proposed Changes:**
*   Scan all repo-level `.github/workflows` directories in the workspace.
*   Group workflows by repository and by file name.
*   Identify the common workflow baseline and the repo-specific exceptions.
*   Record the findings in this task file and update the spec/plan if needed.

**Technical Details:**
*   Ignore dependency-installed workflow files under `node_modules`.
*   Treat the repository root `.github/workflows` as the seed configuration set for the workspace.
*   Keep the output focused on workflow names and repository distribution, since content-level deduplication belongs to the next task.

## 4. Verification Plan
**Automated Tests:**
*   [x] Repository scan completed with shell commands.

**Manual Verification:**
*   Confirmed repo-level workflow directories across the workspace.
*   Confirmed root-level workflow files exist in `.github/workflows`.

## 5. Blockers & Clarifications
*   None. The inventory was completed from local workspace state.

## 6. Execution Log
*   2026-06-23 - Started task.
*   2026-06-23 - Completed repo-level inventory of GitHub Actions usage across the workspace.

## 7. Inventory Results

### Repository coverage
The workspace currently has GitHub Actions workflows in the following repository roots:

*   `.` root workspace workflows
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
*   `for-pouch`
*   `for-react-native`
*   `for-typeorm`
*   `injectable-decorators`
*   `logging`
*   `styles`
*   `transactional-decorators`
*   `ui-decorators`
*   `utils`
*   `web-page`

### Common baseline workflow set
These workflow files are present in 24 repository roots and form the shared baseline:

*   `codeql-analysis.yml`
*   `jest-coverage.yaml`
*   `nodejs-build-prod.yaml`
*   `pages.yaml`
*   `publish-on-release.yaml`
*   `release-on-merge-pr.yml`
*   `release-on-tag.yaml`
*   `snyk-analysis.yaml`

### Repository-specific workflow outliers
These workflows are only present in specific repositories and should be treated as exceptions during extraction:

*   Root workspace only:
    *   `auto-merge-renovate.yml`
    *   `bug-in-progress-workflow.yml`
    *   `bug-pull-request-workflow.yml`
    *   `release-chain.yaml`
    *   `renovate.yml`
    *   `trivy-scan.yml`
*   `for-angular`:
    *   `playwright.yml`
*   `for-couchdb`:
    *   `docker-couchdb.yaml`
    *   `docker-couchdb-boot.yaml`
*   `utils`:
    *   `auto-merge-renovate.yml`
    *   `bug-in-progress-workflow.yml`
    *   `bug-pull-request-workflow.yml`
    *   `renovate.yml`
    *   `trivy-scan.yml`
*   `web-page`:
    *   `static.yml`

### Notes
*   `for-angular` and `web-page` each have one extra workflow beyond the common baseline.
*   `for-couchdb` has two CouchDB-specific container bootstrap workflows that are likely not reusable as-is.
*   `utils` contains the broader automation governance workflows, which are also likely to remain specialized.
*   The workspace root contains the largest policy/automation set and is the most likely source for the initial reusable workflow candidates.
