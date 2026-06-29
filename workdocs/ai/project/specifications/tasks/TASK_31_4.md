# TASK-31-4: Add and repair integration tests for orchestration CLI flows and dist boot

**ID:** TASK-31-4
**Specification:** [Link to Specification](../DECAF_31.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add or repair the integration tests needed to validate the orchestration CLI flows, packaged boot path, and dist inspector behavior.

## 2. Objectives
*   [ ] Cover the CLI paths that currently fail or are not tested.
*   [ ] Make sure regressions fail in CI before release.

## 3. Implementation Plan
**Proposed Changes:**
*   Extend the current MCP server integration suite with packaging-aware cases.
*   Unskip or replace any skipped end-to-end coverage relevant to the bug.
*   Add assertions for template resolution, dist boot, and agent/orchestration command behavior.

**Technical Details:**
*   Keep the tests real and integration-focused rather than mocked.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration Test: orchestration CLI command set
*   [ ] Integration Test: dist boot through inspector transport

**Manual Verification:**
*   Run the focused integration suite and confirm the regressions are reproduced before the fix and resolved after.

## 5. Blockers & Clarifications
*   **Clarification 1:** Which tests should remain skipped, if any, after the fix?

## 6. Execution Log
*   [Date] - Started task.
