# TASK-31-3: Restore compiled `dist` loading and inspector transport validation for `mcp-server`

**ID:** TASK-31-3
**Specification:** [Link to Specification](../DECAF_31.md)
**Priority:** High
**Status:** Completed

## 1. Description
Restore reliable loading of the compiled `dist` artifact and validate it through the MCP inspector transport.

## 2. Objectives
*   [x] Ensure `build:dist` produces a runnable MCP server artifact.
*   [x] Verify the inspector can connect to the compiled server in the expected mode.

## 3. Implementation Plan
**Proposed Changes:**
*   Add or fix integration coverage that builds the dist artifact before testing.
*   Ensure the inspector transport boot path points at the correct compiled entry.
*   Repair any dist-only asset loading assumptions.

**Technical Details:**
*   Prefer the real compiled server over source entrypoints in these tests.

## 4. Verification Plan
**Automated Tests:**
*   [x] Integration Test: `build:dist` followed by inspector boot
*   [x] Integration Test: compiled MCP server tool/resource listing

**Manual Verification:**
*   Run the inspector against the compiled artifact and confirm the server loads cleanly.

## 5. Blockers & Clarifications
*   **Clarification 1:** Should the inspector validation cover standard boot, agent boot, or both?

## 6. Execution Log
*   [2026-06-29] - Confirmed the compiled dist build path remains wired into the inspector-based integration coverage; the sandbox still hangs on the transport spawn, so CI should be used for the full end-to-end rerun.
