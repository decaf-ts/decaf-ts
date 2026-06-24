# TASK-191: Extract or parameterize shared workflows in `reusable-actions`

**ID:** TASK-191
**Specification:** [DECAF-29](../DECAF_29.md)
**Priority:** High
**Status:** Completed

## 1. Description
Refactor workflows that are shared across repositories so the common behavior lives in `reusable-actions` and the remaining differences are exposed as inputs.

This task turns the inventory into reusable workflow definitions or reusable workflow inputs.

## 2. Objectives
*   [x] Move reusable workflow bodies into `reusable-actions` where appropriate.
*   [x] Parameterize commands, versions, secrets, and other repository-specific inputs.
*   [x] Preserve existing workflow behavior while reducing duplication.
*   [x] Identify any workflow that cannot be generalized and document why.

## 3. Implementation Plan
**Proposed Changes:**
*   Update shared workflows under `reusable-actions/.github/workflows`.
*   Add or refine workflow inputs for install, build, test, release, and reporting steps.
*   Normalize reusable permissions and environment assumptions where possible.
*   Leave repo-specific wrapper workflows only when the trigger wiring must stay local.

**Technical Details:**
*   Preserve compatibility with the current consumers.
*   Keep shared workflows generic enough for the widest practical set of repositories.
*   Avoid encoding repository-specific names or paths unless they are truly universal.

## 4. Verification Plan
**Automated Tests:**
*   [x] Reusable workflow definitions updated.
*   [x] Consumer repositories still reference valid workflow calls.

**Manual Verification:**
*   [x] Confirmed reusable workflow inputs cover the known use cases.
*   [x] Confirmed repo-local exceptions remain intentionally local.

## 5. Blockers & Clarifications
*   None yet.

## 6. Execution Log
*   2026-06-24 - Task file created.
*   2026-06-24 - Parameterized the shared reusable workflows and added a reusable Trivy workflow for later consumer wiring.

## 7. Results & Artifacts
*   `reusable-actions/.github/workflows/nodejs-build-prod.yaml`
*   `reusable-actions/.github/workflows/jest-coverage.yaml`
*   `reusable-actions/.github/workflows/release-on-merge-pr.yml`
*   `reusable-actions/.github/workflows/release-on-tag.yaml`
*   `reusable-actions/.github/workflows/publish-on-release.yaml`
*   `reusable-actions/.github/workflows/pages.yaml`
*   `reusable-actions/.github/workflows/codeql-analysis.yml`
*   `reusable-actions/.github/workflows/snyk-analysis.yaml`
*   `reusable-actions/.github/workflows/trivy-scan.yml`
