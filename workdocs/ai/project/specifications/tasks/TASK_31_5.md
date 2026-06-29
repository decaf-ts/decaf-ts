# TASK-31-5: Document the supported ADOS/package-install CLI flow and verification steps

**ID:** TASK-31-5
**Specification:** [Link to Specification](../DECAF_31.md)
**Priority:** Medium
**Status:** Pending

## 1. Description
Document the supported ADOS/orchestration CLI flow, including how the package behaves when loaded from `node_modules` and how to verify the compiled dist artifact.

## 2. Objectives
*   [ ] Explain the supported installation layouts.
*   [ ] Document the required verification steps for dist and inspector testing.

## 3. Implementation Plan
**Proposed Changes:**
*   Update the relevant `mcp-server` docs and repo-level guidance.
*   Describe template resolution and packaging assumptions clearly.

**Technical Details:**
*   Keep the docs aligned with the actual tested command paths.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Documentation lint or snapshot check if available

**Manual Verification:**
*   Review the updated docs against the actual CLI behavior and test flow.

## 5. Blockers & Clarifications
*   **Clarification 1:** Which docs are the authoritative home for this flow: root plan/specs, `mcp-server` workdocs, or both?

## 6. Execution Log
*   [Date] - Started task.
