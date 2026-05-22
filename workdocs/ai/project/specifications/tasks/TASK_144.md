# TASK-144: Emit live progress from prompt-based agent tools and child-process orchestration

**ID:** TASK-144
**Specification:** [DECAF-17](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Wire prompt-based agent tools so they emit progress as they run, instead of buffering all feedback until the tool finishes. Child-process orchestration must forward or synthesize progress updates with the active agent and task identifiers.

## 2. Objectives
*   [ ] Emit live progress from `agent.do` and the individual `agent.*` tools.
*   [ ] Forward progress from spawned child processes to the parent orchestration layer.
*   [ ] Ensure blockers and clarification requests appear as progress events.

## 3. Implementation Plan
**Proposed Changes:**
*   Update the agent command runner to publish progress when a tool starts, while it is active, and when it completes.
*   Forward child process progress output into `notifications/progress`.
*   Add `agent.notify` usage to the prompt-driven paths.

**Technical Details:**
*   Keep progress messages concise and tagged with agent name, operation, and SPEC/TASK reference.
*   Preserve the final structured JSON output and `TASK COMPLETE` sentinel.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration Test: `tests/integration/agent-progress.integration.test.ts`
*   [ ] Integration Test: `tests/integration/mcp-dist-inspector-progress.integration.test.ts`

**Manual Verification:**
*   Run a long-running prompt-based agent tool and confirm progress appears before the final result.

## 5. Blockers & Clarifications
*   **Clarification 1:** If a provider CLI is silent, should the runtime emit synthetic heartbeat progress? (Answer: yes, when the tool is still active and no meaningful update has been produced for a while.)

## 6. Execution Log
*   [Date] - Task created.
