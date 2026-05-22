# TASK-143: Define the agent progress notification contract and `agent.notify` tool surface

**ID:** TASK-143
**Specification:** [DECAF-20](../DECAF_20.md)
**Priority:** High
**Status:** Pending

## 1. Description
Define the shared progress contract that all agent tools will use to emit live `notifications/progress` events through the MCP SDK. Also define the `agent.notify` tool surface for prompt-based mode so LLM-driven agents can publish progress without waiting for the final result.

## 2. Objectives
*   [ ] Define the common progress payload fields and required metadata.
*   [ ] Specify when agent tools must emit progress updates.
*   [ ] Define the `agent.notify` tool input/output contract.

## 3. Implementation Plan
**Proposed Changes:**
*   Introduce a shared progress helper contract in the agent runtime layer.
*   Add a prompt-mode `agent.notify` tool to the agent command namespace.
*   Document the required metadata for agent, operation, SPEC/TASK reference, and stage.

**Technical Details:**
*   Use the MCP progress notification API as the canonical delivery path.
*   Keep the final tool result structured and separate from progress events.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `tests/unit/agent/runtime/progress.test.ts`
*   [ ] Unit Test: `tests/unit/agent/runtime/notify.test.ts`

**Manual Verification:**
*   Inspect the progress payload contract in the generated docs/spec.

## 5. Blockers & Clarifications
*   **Clarification 1:** Should `total` always be emitted when known, or should the payload allow `progress`-only events? (Answer: keep `total` optional, but include it whenever the runtime can determine a stable total.)

## 6. Execution Log
*   [Date] - Task created.
