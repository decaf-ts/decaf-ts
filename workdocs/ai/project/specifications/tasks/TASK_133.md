# TASK-133: Rewrite agent prompts/resources to call agent tools and emit `TASK COMPLETE`

**ID:** TASK-133
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Update the agent system prompts and repo-copied behavior resources so each agent explicitly instructs the LLM to call the matching tool entry point, such as `agent.plan`, `agent.review`, `agent.implement`, and `agent.execute`. All agent runs must finish with the literal sentinel `TASK COMPLETE`, and SPEC/TASK updates must continue to mirror Jira when `JIRA_ENABLED=true`.

## 2. Objectives
*   [ ] Update agent prompts to reference the correct agent tools explicitly.
*   [ ] Require the `TASK COMPLETE` sentinel in the agent response contract.
*   [ ] Preserve repo-copied prompt/resource customization.
*   [ ] Keep Jira synchronization active when `JIRA_ENABLED=true`.

## 3. Implementation Plan
**Proposed Changes:**
*   Rewrite the agent prompt resources so they point to the agent tool names directly.
*   Add end-of-run instructions that require `TASK COMPLETE`.
*   Keep prompt and behavior files editable on disk after setup.
*   Preserve the existing Jira sync hooks for SPEC/TASK updates.

**Technical Details:**
*   The prompt surface must be concise and deterministic so the dispatcher can parse it reliably.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: each agent prompt mentions the matching tool name.
*   [ ] Unit Test: each agent run terminates with `TASK COMPLETE`.
*   [ ] Unit Test: Jira sync still mirrors SPEC/TASK updates when enabled.

**Manual Verification:**
*   [ ] Edit a repo-copied prompt file and confirm the new text is loaded at runtime.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-22] - Spec rewritten to require tool-driven prompts and TASK COMPLETE termination.
