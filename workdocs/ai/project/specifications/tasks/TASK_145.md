# TASK-145: Emit deterministic progress from GOAP/workflow runners and manager relay paths

**ID:** TASK-145
**Specification:** [DECAF-17](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Ensure the deterministic GOAP and workflow execution paths emit progress updates directly from code, and that the manager agent relays those updates back to the user in a concise form.

## 2. Objectives
*   [ ] Emit progress from GOAP/workflow state transitions without using LLM prompting.
*   [ ] Relay child-agent progress back to the manager with the active references.
*   [ ] Keep manager-facing summaries concise and structured.

## 3. Implementation Plan
**Proposed Changes:**
*   Update the deterministic workflow runner to publish stage-level progress updates.
*   Add a manager relay path that forwards agent progress into the user-facing response stream.
*   Standardize stage/blocker/question progress events across GOAP and workflow mode.

**Technical Details:**
*   Progress emission must come from the programmatic solver/state machine.
*   The manager should not wait for tool completion before surfacing useful status.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Integration Test: `tests/integration/agent-goap-progress.integration.test.ts`
*   [ ] Integration Test: `tests/integration/agent-workflow-progress.integration.test.ts`

**Manual Verification:**
*   Execute a deterministic GOAP/workflow run and confirm progress updates appear in order.

## 5. Blockers & Clarifications
*   **Clarification 1:** Should the manager relay every progress event or only events that materially change user-visible state? (Answer: relay every state change, but collapse noisy heartbeats when needed.)

## 6. Execution Log
*   [Date] - Task created.
