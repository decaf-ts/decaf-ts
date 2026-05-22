# TASK-131: Add the `agent` command namespace and dispatcher tooling

**ID:** TASK-131
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add the agent-prefixed command namespace so `decaf-mcp agent plan`, `decaf-mcp agent review`, `decaf-mcp agent create-specs`, `decaf-mcp agent implement`, and `decaf-mcp agent execute` resolve to explicit agent tools instead of the standard prompt flow. Introduce the canonical dispatcher tool `agent.do` and ensure the specialized tools forward to it.

## 2. Objectives
*   [ ] Add agent-prefixed CLI command routing for the supported operations.
*   [ ] Implement `agent.do` as the canonical dispatcher.
*   [ ] Add thin wrapper tools such as `agent.plan`, `agent.review`, `agent.create-specs`, `agent.implement`, and `agent.execute`.
*   [ ] Make the wrapper tools forward the operation and arguments to `agent.do`.

## 3. Implementation Plan
**Proposed Changes:**
*   Parse the `agent` prefix before the existing command names.
*   Route each command into the matching agent tool.
*   Keep the generic dispatcher as the single selection point for agent lookup.

**Technical Details:**
*   The command surface should remain deterministic and inspectable.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `agent` prefix routes to the agent command namespace.
*   [ ] Unit Test: `agent.do` selects the correct agent based on the supplied operation.
*   [ ] Integration Test: compiled dist exposes the agent-prefixed commands through the inspector transport.

**Manual Verification:**
*   [ ] Call `decaf-mcp agent plan` and confirm the dispatcher selects the planning agent.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-22] - Spec rewritten to the new agent command namespace model.
