# TASK-130: Add `--agent` startup flag and agent bootstrap path

**ID:** TASK-130
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add the direct agent-mode boot path so `mcp-server` can start with `--agent`, load the agent system prompt, and activate the agent tooling at process startup. The startup path must not depend on dynamic switching to expose agent capabilities.

## 2. Objectives
*   [ ] Add the `--agent` CLI flag and wire it into server bootstrap.
*   [ ] Load the agent system prompt during agent-mode startup.
*   [ ] Register the agent tooling immediately when the server boots in agent mode.
*   [ ] Preserve the standard mode boot path unchanged.

## 3. Implementation Plan
**Proposed Changes:**
*   Add CLI plumbing for `--agent`.
*   Route bootstrap into an agent-mode initialization branch.
*   Ensure the agent-mode prompt is loaded before any agent tool invocation.

**Technical Details:**
*   The boot path must be deterministic and testable from the compiled dist artifact.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `--agent` resolves the agent bootstrap branch.
*   [ ] Unit Test: agent-mode startup loads the agent system prompt.
*   [ ] Integration Test: compiled dist booted with `--agent` exposes the agent tool surface.

**Manual Verification:**
*   [ ] Start the compiled server with `--agent` and confirm the agent prompt and tool registration are active.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-22] - Spec rewritten to the new agent-flag architecture.
