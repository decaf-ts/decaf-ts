# TASK-132: Implement Agent and AgentBuilder registry plus concrete agent definitions

**ID:** TASK-132
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Implement the `Agent` abstraction and `AgentBuilder` so each agent is registered in a runtime registry and can be selected by `agent.do`. Add the concrete orchestrator, architect, implementation, reviewer, documentation, and main agents that the runtime will dispatch to.

## 2. Objectives
*   [ ] Implement the `Agent` abstraction.
*   [ ] Implement `AgentBuilder` with registry registration on build.
*   [ ] Register the orchestrator, architect, implementation, reviewer, documentation, and main agents.
*   [ ] Make the runtime able to look up agents from the registry by operation name.

## 3. Implementation Plan
**Proposed Changes:**
*   Add a runtime registry for agent instances.
*   Ensure builder construction stores each agent in the registry.
*   Define the concrete agent roles and their responsibilities.

**Technical Details:**
*   Agent registration must be deterministic and safe for repeated test runs.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `AgentBuilder` registers each built agent in the registry.
*   [ ] Unit Test: the orchestrator, architect, implementation, reviewer, documentation, and main agents resolve from the registry.
*   [ ] Unit Test: the registry returns the correct agent for a given operation key.

**Manual Verification:**
*   [ ] Inspect the registry after boot and confirm every agent is present.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-22] - Spec rewritten to the new registry-driven agent model.
