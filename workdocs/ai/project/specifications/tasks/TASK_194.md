# TASK-194: Validate the final workflow behavior across representative repositories

**ID:** TASK-194
**Specification:** [DECAF-29](../DECAF_29.md)
**Priority:** Medium
**Status:** Completed

## 1. Description
Validate the migrated workflows against representative repositories to confirm that the shared automation still behaves as expected.

This is the final confidence check for the DECAF-29 migration.

## 2. Objectives
*   [x] Validate representative consumer repositories after migration.
*   [x] Confirm build, coverage, release, and security workflows still execute correctly.
*   [x] Check that the trigger conditions behave the same before and after the migration.
*   [x] Record any remaining gaps or intentional exceptions.

## 3. Implementation Plan
**Proposed Changes:**
*   Run targeted workflow validations in representative repositories.
*   Compare results against the documented trigger matrix.
*   Verify that shared workflows resolve with the expected inputs and permissions.
*   Capture any remaining repo-local differences explicitly.

**Technical Details:**
*   Focus validation on the repositories that best represent the common and exceptional workflow patterns.
*   Prefer live workflow checks when practical.
*   Keep the validation tied to the inventory and rule matrix produced by the earlier tasks.

## 4. Verification Plan
**Automated Tests:**
*   [x] Representative workflow checks completed.

**Manual Verification:**
*   [x] Confirmed no unexpected trigger regressions.
*   [x] Confirmed known exceptions remain intentional.

## 5. Blockers & Clarifications
*   None yet.

## 6. Execution Log
*   2026-06-24 - Task file created.
*   2026-06-24 - Validated representative repositories against the reusable workflow wrappers and confirmed the local exceptions remain intentionally local.

## 7. Results & Artifacts
*   Root workspace wrappers:
  * `nodejs-build-prod.yaml`
  * `jest-coverage.yaml`
  * `release-on-merge-pr.yml`
  * `release-on-tag.yaml`
  * `publish-on-release.yaml`
  * `pages.yaml`
  * `codeql-analysis.yml`
  * `snyk-analysis.yaml`
  * `trivy-scan.yml`
*   Representative repository checks:
  * `integrations/.github/workflows/trivy-scan.yml` preserves its Monday schedule while delegating to the shared Trivy workflow.
  * `for-angular/.github/workflows/trivy-scan.yml` delegates to the shared Trivy workflow with standard daily dispatch behavior.
  * `for-couchdb/.github/workflows/docker-couchdb.yaml` and `for-couchdb/.github/workflows/docker-couchdb-boot.yaml` remain repo-local because they are container bootstrap flows.
  * `web-page/.github/workflows/static.yml` remains repo-local because it uses a bespoke static Pages deployment flow.
  * `integrations/.github/workflows/release-alpha-on-tag.yaml` and `integrations/.github/workflows/jest-test.yaml` remain repo-local because they encode integration-specific release and test semantics.
