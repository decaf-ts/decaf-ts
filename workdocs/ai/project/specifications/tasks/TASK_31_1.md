# TASK-31-1: Fix packaged asset and template resolution for `mcp-server` CLI commands

**ID:** TASK-31-1
**Specification:** [Link to Specification](../DECAF_31.md)
**Priority:** High
**Status:** Completed

## 1. Description
Fix the asset and template lookup logic so `mcp-server` CLI commands can resolve templates, prompts, and orchestration assets when the package is installed under `node_modules`.

## 2. Objectives
*   [x] Remove the assumption that the repository root is always the process cwd.
*   [x] Make template lookup work from both source checkout and installed package layouts.

## 3. Implementation Plan
**Proposed Changes:**
*   Audit the current asset resolution helpers.
*   Update template search paths to understand `node_modules/@decaf-ts/*` layouts.
*   Preserve current behavior for local development workspaces.

**Technical Details:**
*   Keep the resolution logic centralized so CLI commands and runtime boot paths share the same behavior.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: template path resolution helpers
*   [x] Integration Test: packaged CLI command boot path

**Manual Verification:**
*   Run `repo:init` from an installed-package simulation and confirm templates are found.

## 5. Blockers & Clarifications
*   **Clarification 1:** Which path should win when both package-local and workspace-local assets exist?

## 6. Execution Log
*   [2026-06-29] - Added runtime asset resolution fallback and validated packaged-template lookup through the repo-init coverage.
