# DECAF-20 — Agent Tool Progress Notifications and Manager Relay

**Status:** Planned
**Priority:** High
**Owner:** Codex

## 1. Overview
All agent tooling in `mcp-server` must provide live progress feedback while it is executing. The current pattern of buffering long-running agent work until completion is not sufficient for the manager agent or for the user-facing MCP client.

This specification defines a progress-notification contract for every agent tool so long-running operations can emit live status updates through the MCP notification API. The progress stream must identify the active agent, the current operation, and the active SPEC/TASK reference so the manager can relay concise status updates to the user while work is still in flight.

The design must support three execution families:

* prompt-based agent tools, which may use an explicit `agent.notify` tool to emit progress;
* deterministic GOAP/workflow execution, which must emit progress directly from programmatic steps; and
* manager-orchestrated child-agent runs, which must relay agent progress back to the manager in real time.

The final result for each tool remains structured JSON plus the existing `TASK COMPLETE` sentinel, but progress itself must arrive as side-channel `notifications/progress` events while the request is active.

## 2. Goals
*   [ ] Define a single progress-notification contract shared by all agent tooling.
*   [ ] Expose a dedicated `agent.notify` tool for prompt-based mode so prompts can report progress explicitly.
*   [ ] Ensure deterministic GOAP/workflow runners emit progress without relying on LLM prompting.
*   [ ] Relay long-running child-agent progress back to the manager agent with agent/task identifiers.
*   [ ] Add compiled-dist integration coverage in `tests/**/*.test.ts` files that proves progress notifications are emitted while work is still running.

## 3. User Stories / Requirements
*   **US-1:** As a manager agent, I want live progress events from agent tools so I can keep the user informed during long-running work.
*   **US-2:** As a user, I want agent tools to report blockers and questions as they occur so I do not wait for the final result to discover missing input.
*   **US-3:** As a maintainer, I want GOAP/workflow runs to emit progress programmatically so execution stays deterministic and observable.
*   **Req-1:** Every agent tool must emit progress through the MCP notification API while it is running.
*   **Req-2:** Progress events must include enough metadata to distinguish the agent, operation, SPEC/TASK reference, and current step.
*   **Req-3:** Prompt-based agent mode must support a dedicated `agent.notify` tool that can send progress updates without waiting for completion.
*   **Req-4:** GOAP/workflow execution must emit progress from code, not from prompt-based reasoning.
*   **Req-5:** The manager must receive and relay progress from child-agent runs before the final `TASK COMPLETE` result is returned.
*   **Req-6:** The final tool response must remain structured JSON and still end with `TASK COMPLETE`.

## 4. Architecture & Design
The implementation should define a shared progress helper that all agent tools can call.

Recommended contract:

* Progress is reported through MCP `notifications/progress`.
* Each update should include:
  * `progressToken`
  * `progress` and optional `total`
  * human-readable `message`
  * agent name
  * operation/tool name
  * `specRef` and/or `taskRef` when available
* Progress should be emitted at:
  * tool start
  * major stage transitions
  * blockers or clarification requests
  * completion

The implementation should support the following execution paths:

* **Prompt-based mode:** prompt-driven agent tools call `agent.notify` or a shared progress helper to publish progress updates.
* **GOAP/workflow mode:** deterministic solvers and workflow runners emit progress directly from the programmatic state machine or behavior tree.
* **Manager relay:** the manager agent receives child progress events and forwards concise summaries to the user-facing client.

Tool responses should continue to return a structured JSON payload with:

* `confidence`
* `summary`
* `status`
* `questions`
* `blockers`
* `TASK COMPLETE`

The progress channel is separate from the final response and must not wait until the tool exits.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:-------|:-------------|
| TASK-143 | [Define the agent progress notification contract and `agent.notify` tool surface](./tasks/TASK_143.md) | High | Pending | - |
| TASK-144 | [Emit live progress from prompt-based agent tools and child-process orchestration](./tasks/TASK_144.md) | High | Pending | TASK-143 |
| TASK-145 | [Emit deterministic progress from GOAP/workflow runners and manager relay paths](./tasks/TASK_145.md) | High | Pending | TASK-143, TASK-144 |
| TASK-146 | [Add compiled-dist inspector integration tests for progress notifications and full agent-system progress flow](./tasks/TASK_146.md) | High | Pending | TASK-143, TASK-144, TASK-145 |

## 6. Open Questions / Risks
*   Should progress events include a stable numeric `total` for every tool, or should `total` remain optional when the tool cannot know the full scope in advance?
*   Should the manager relay every child progress event verbatim, or should it collapse some updates into concise summaries before showing them to the user?
*   Some provider CLIs and long-running workflows may not produce useful intermediate output on their own, so the implementation must emit progress from the orchestration layer even when the child process is quiet.
*   The exact shape of the MCP SDK progress callback payload should be matched carefully so the compiled-dist integration tests use the same transport semantics as the real client.

## 7. Results & Artifacts
*   `workdocs/ai/project/specifications/DECAF_20.md`
*   `workdocs/ai/project/specifications/tasks/TASK_143.md`
*   `workdocs/ai/project/specifications/tasks/TASK_144.md`
*   `workdocs/ai/project/specifications/tasks/TASK_145.md`
*   `workdocs/ai/project/specifications/tasks/TASK_146.md`
*   `workdocs/ai/project/plan.md`
*   `mcp-server/tests/**/*.test.ts`
