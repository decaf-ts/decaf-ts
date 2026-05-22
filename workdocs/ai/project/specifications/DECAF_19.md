# DECAF-19: Configurable Agent Execution Mode

**Status:** Completed
**Priority:** High
**Owner:** Architect Agent

## 1. Overview
This specification defines a configurable execution mode for the agent runtime so the system can switch between the current prompt-based agent behavior and deterministic GOAP/workflow execution.

When the model-type flag is set to a non-default mode, manager-driven orchestration must stop asking LLMs to decide what to do next. Instead, the manager must dispatch into the selected GOAP or workflow implementation, let that implementation resolve the steps programmatically, and only call an LLM where the selected task genuinely requires language reasoning.

All workflow and GOAP solving must report back to the manager agent after execution so the manager can present the result to the user. The manager remains the user-facing coordinator, while the internal execution path becomes deterministic for non-default modes.

Planning note:
- The configuration source for the execution mode must align with the repository's canonical runtime config layer during implementation.
- The task plan intentionally keeps the exact config shape open until that layer is confirmed in code.

## 2. Goals
*   [x] Add a configurable model-type flag that selects default prompt-based, GOAP, or workflow behavior.
*   [x] Ensure non-default modes execute programmatically instead of using LLM prompting to choose steps.
*   [x] Keep LLM usage limited to the manager/user interaction path and to tasks that explicitly need model reasoning.
*   [x] Guarantee that GOAP/workflow runs return structured results to the manager agent for user-facing reporting.
*   [x] Preserve the existing default path so current prompt-driven behavior does not regress.

## 3. User Stories / Requirements
*   **US-1:** As a user, I want to choose an execution mode from config so that the agent can run in prompt, GOAP, or workflow mode without changing user commands.
*   **US-2:** As a maintainer, I want orchestration logic to be deterministic in GOAP/workflow modes so that agent behavior is reproducible and easier to test.
*   **US-3:** As a manager agent, I want child workflow results reported back to me so that I can summarize them to the user.
*   **Req-1:** The execution mode flag must be configurable and have a safe default that preserves the current prompt-based agent behavior.
*   **Req-2:** When the mode is not default, the manager must not use LLM prompting to decide orchestration steps.
*   **Req-3:** GOAP/workflow solving logic must be implemented in code and may call LLMs only for explicitly required subtasks.
*   **Req-4:** Every GOAP/workflow execution must emit a structured result back to the manager agent.
*   **Req-5:** The design must preserve the existing separation between manager-facing interaction and internal execution procedures.

## 4. Architecture & Design
The runtime should expose a single configuration source for execution mode selection, then branch early in the manager orchestration layer.

Suggested behavior:
* Default mode keeps the existing prompt-based agent path unchanged.
* GOAP mode routes planning/execution through a deterministic solver or planner, with explicit state transitions and action selection.
* Workflow mode routes execution through a predefined workflow engine or procedure runner rather than an LLM-driven planner.
* Both non-default modes return structured execution results, including success/failure state, actions taken, and any required follow-up for the manager.

The manager agent remains the only component responsible for interacting with the user and summarizing the outcome. Lower-level workflow/goap solvers should not respond directly to the user; they should return results to the manager instead.

Planned result shape:
* execution mode selected
* terminal status
* ordered actions or steps taken
* manager-facing summary payload
* follow-up or remediation hints
* failure details when applicable

Verification note:
* The implementation must prove that orchestration branching happens before any prompt-based decision making in non-default modes.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID       | Task Name                                                                           | Priority | Status    | Dependencies |
|:---------|:------------------------------------------------------------------------------------|:---------|:----------|:-------------|
| TASK-141 | [Define the Execution Mode Configuration and Routing Contract](./tasks/TASK_141.md) | High     | Completed | -            |
| TASK-142 | [Implement Deterministic GOAP/Workflow Reporting to Manager](./tasks/TASK_142.md)   | High     | Completed | TASK-141     |

## 6. Open Questions / Risks
*   The exact config shape is not yet defined, so the implementation must align with the repository's canonical runtime configuration layer instead of inventing a second source of truth.
*   The current repository does not yet document the internal manager/worker boundaries in detail, so the reporting contract may need to be introduced alongside the implementation.
*   The error-handling policy for workflow/goap failures needs to be explicit so the manager can surface useful user-facing messages.

## 7. Results & Artifacts
*   `project/specifications/DECAF_19.md`
*   `project/specifications/tasks/TASK_141.md`
*   `project/specifications/tasks/TASK_142.md`
*   `project/plan.md`

## 8. Agent Progress
*   [2026-05-22] - Specification implemented in code with explicit prompt, GOAP, and workflow routing.
