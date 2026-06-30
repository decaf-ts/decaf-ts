# TASK-31-5: Document the supported ADOS/package-install CLI flow and verification steps

**ID:** TASK-31-5
**Specification:** [Link to Specification](../DECAF_31.md)
**Priority:** Medium
**Status:** Completed

## 1. Description
Document the supported ADOS/orchestration CLI flow, including how the package behaves when loaded from `node_modules` and how to verify the compiled dist artifact.

## 2. Objectives
*   [x] Explain the supported installation layouts.
*   [x] Document the required verification steps for dist and inspector testing.

## 3. Implementation Plan
**Proposed Changes:**
*   Update the relevant `mcp-server` docs and repo-level guidance.
*   Describe template resolution and packaging assumptions clearly.

**Technical Details:**
*   Keep the docs aligned with the actual tested command paths.

## 4. Verification Plan
**Automated Tests:**
*   [x] Documentation lint or snapshot check if available

**Manual Verification:**
*   Review the updated docs against the actual CLI behavior and test flow.

## 5. Blockers & Clarifications
*   **Clarification 1:** Which docs are the authoritative home for this flow: root plan/specs, `mcp-server` workdocs, or both?

## 6. Execution Log
*   [2026-06-29] - Documented the packaged ADOS flow in `mcp-server/README.md` and recorded the recommended verification commands.
