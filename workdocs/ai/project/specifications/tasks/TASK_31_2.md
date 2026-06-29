# TASK-31-2: Repair `repo:init` orchestration and ADOS setup when installed from `node_modules`

**ID:** TASK-31-2
**Specification:** [Link to Specification](../DECAF_31.md)
**Priority:** High
**Status:** Pending

## 1. Description
Repair the orchestration-oriented CLI flow so `decaf-mcp repo:init <path> --orchestration --agent <agent>` works when `mcp-server` is consumed as a Node library.

## 2. Objectives
*   [ ] Validate `repo:init` with orchestration and agent flags.
*   [ ] Fix any CLI wiring that depends on source-tree assumptions.

## 3. Implementation Plan
**Proposed Changes:**
*   Review `repo:init` command assembly and downstream template copying.
*   Fix any path or env handling that breaks when invoked from `node_modules`.
*   Ensure orchestration/ADOS setup still emits the expected files.

**Technical Details:**
*   Reuse the same resolution helpers that the main CLI boot path uses.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration Test: `repo:init --orchestration --agent` from packaged layout
*   [ ] Integration Test: orchestration command file generation

**Manual Verification:**
*   Run the command from a simulated installed package and inspect the generated workspace.

## 5. Blockers & Clarifications
*   **Clarification 1:** Which orchestration/ADOS command variants should be included in the supported matrix?

## 6. Execution Log
*   [Date] - Started task.
