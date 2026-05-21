# TASK-132: Implement Agent and AgentBuilder abstractions plus concrete orchestration agents

**ID:** TASK-132
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Introduce an `Agent` abstraction and an `AgentBuilder` for `mcp-server` that model each agent as a `mistreevous` behavior tree with explicit objectives, weights, actions, retries, and fallbacks. Add the concrete orchestration agents required by the specification, including the main agent, orchestrator, architect, implementation, reviewer, and documentation agents.
All agent behavior must be loaded from the repo-installed resource files created by `agent setup`, so users can customize prompts and serialized behavior artifacts without changing code.

## 2. Objectives
*   [ ] Implement the `Agent` abstraction using `mistreevous`.
*   [ ] Implement an `AgentBuilder` following the project builder pattern.
*   [ ] Add main, orchestrator, architect, implementation, reviewer, and documentation agents.
*   [ ] Support GOAP-based goal solving where adaptive planning is needed, while keeping the hardcoded `mistreevous` branch structure in place.
*   [ ] Load agent behavior, prompts, and serialized decision trees from the repo-copied resource files.

## 3. Implementation Plan
**Proposed Changes:**
*   Create agent classes and builder classes under the agent runtime.
*   Encode behavior trees and objectives as structured data resources.
*   Add the concrete main, orchestrator, architect, implementation, reviewer, and documentation agents.
*   Keep the GOAP decision branches wired as first-class conditionals so the runtime can switch modes later without redefining the orchestration graph.
*   Read prompts and behavior metadata from the repo-installed files so user edits are reflected at runtime.

**Technical Details:**
*   All agents must be instantiated through `AgentBuilder`.
*   Behavior tree definitions should be stored as MCP resources and loaded lazily.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `AgentBuilder` creates agents with the expected objectives and behavior tree shape.
*   [ ] Unit Test: main, orchestrator, architect, implementation, reviewer, and documentation agents resolve their behaviors.
*   [ ] Unit Test: GOAP mode and hardcoded mode resolve the same workflow branch names.
*   [ ] Unit Test: changing a repo-installed prompt or behavior file changes the loaded agent behavior.

**Manual Verification:**
*   Start agent mode and confirm the agents are present and can be invoked.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Started task.
