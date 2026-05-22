# TASK-146: Add compiled-dist inspector integration tests for progress notifications and full agent-system progress flow

**ID:** TASK-146
**Specification:** [DECAF-20](../DECAF_20.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add compiled-dist inspector integration tests that prove progress notifications are emitted while agent tooling is still running. Include a larger end-to-end scenario that exercises the full agent chain and verifies the manager sees live progress before the final `TASK COMPLETE` result.

## 2. Objectives
*   [ ] Verify progress notifications are emitted from the compiled `dist` artifact.
*   [ ] Verify the manager/user-facing client receives progress updates before tool completion.
*   [ ] Add one full agent-system integration test that exercises manager, orchestrator, implementation, reviewer, and documentation behavior.

## 3. Implementation Plan
**Proposed Changes:**
*   Extend the dist inspector harness to listen for `onprogress` callbacks.
*   Add one progress-focused long-running tool test.
*   Add one full mock task that runs through the agent chain and checks progress along the way.

**Technical Details:**
*   Tests must run against `build:dist`, not source imports.
*   Tests must use temp or agent-cache workspaces and must not write into `workdocs/ai`.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration Test: `tests/integration/mcp-dist-inspector-progress.integration.test.ts`
*   [ ] Integration Test: `tests/integration/agent-system-full-progress.integration.test.ts`

**Manual Verification:**
*   Observe the inspector progress stream while a long-running agent tool is active.

## 5. Blockers & Clarifications
*   **Clarification 1:** Should the tests assert exact progress counts or only the presence and ordering of key milestones? (Answer: assert ordering and key milestones; keep counts flexible.)

## 6. Execution Log
*   [Date] - Task created.
