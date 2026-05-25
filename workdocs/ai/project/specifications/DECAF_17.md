# DECAF-17 — Agent-Namespace MCP Startup, Tool-Driven Orchestration, Deterministic GOAP, and Progress Relay

**Status:** In Progress
**Priority:** High
**Owner:** Codex

## 1. Overview
Rework `mcp-server` so it can start directly in agent mode with a `--agent` flag. When agent mode is active, the server must load the agent system prompt, register the agent tooling, and route all agent-specific behavior through explicit tools instead of relying on hidden prompt switching.

This spec absorbs the progress-notification contract that was previously tracked separately. All agent tooling, regardless of execution mode, must emit live progress through the MCP progress API so the manager can relay useful feedback while work is still active.

The prompt and behavior sources copied into `mcp-server/toMigrate` must be written as professional-grade artifacts:

* prompts must use placeholders for configurable arguments such as `<threshold>`, `<workspacePath>`, `<specRef>`, or `<taskRefs>`;
* GOAP artifacts must encode detailed and logical decision-making for each agent;
* mistreevous workflow artifacts must encode the exact agent sequencing for each agent;
* prompt-based mode must stay LLM-driven for the actual task execution, but the prompts themselves must remain small, direct, and compatible with the MCP environment;
* prompt text must not duplicate logic that is already handled in code for GOAP/workflow branching, progress emission, or orchestration selection.

The agent command surface must be namespaced with the `agent` prefix. The supported flows include `agent plan`, `agent review`, `agent create-specs`, `agent implement`, and `agent execute`. Those commands must map onto a general dispatcher tool, `agent.do`, which selects the correct agent from the registry based on the input parameters and forwards the work to that agent.

Add a `manager` agent as the primary user-facing orchestration entry point. The manager must review the plan, assist with spec creation, and concurrently coordinate multiple tasks that are being orchestrated by the orchestrator agent. It must fan out multiple agent calls at once, surface blockers and questions back to the user as soon as they appear, and route the user response back into the waiting agent so it can continue.

The manager owns the user conversation and coordinates multiple in-flight tasks. The orchestrator owns orchestration for a single task or SPEC and decides which other agent to invoke next, including when parallel execution is safe. The architect produces a professional-grade implementation plan using the project documentation, spec/task files, style guides, testing guidelines, and constitution rules. The implementation agent must implement the requested work, run build, lint, focused tests, and the broader suite before accepting completion. The reviewer reuses the architect context/session that originally produced the plan and validates the resulting code, tests, and documentation against that plan. The documentation agent is deferred for now and should be treated as optional later work, not part of the active flow.

Each concrete agent must have a dedicated system prompt that explicitly instructs the LLM to use the matching tool entry point, such as `agent.plan` or `agent.review`, and every agent-facing command must be exposed as a tool. The specialized tools are thin wrappers over `agent.do` so the registry remains the single source of truth for agent selection.

The builder used for agents must register each built agent instance in a runtime registry and must also register the corresponding tool metadata. That registry is then used by `agent.do` to select the right agent for the requested operation.

All agent tools must run as spawned child processes, use the MCP server in agent mode, and report progress succinctly while they work. Every run must end with the literal sentinel `TASK COMPLETE` so the orchestrator can detect that the stream is finished and safely call the next agent.

Every agent-facing tool must publish progress through the MCP notification API while it is active. In prompt-based mode, the prompts may call a dedicated `agent.notify` tool to emit progress. In GOAP and workflow modes, progress must be emitted directly from code with no LLM involvement. Progress updates must include the agent name, the current operation, and the active SPEC/TASK reference when available.

Every agent-facing tool must return a structured JSON payload with:
* `confidence` as an integer from 1 to 100
* `summary` as a concise description of the work performed
* `status` as the final state for the work
* `questions` and `blockers` when the work needs user input

The confidence score must be evaluated before completion. If the score is at or below the configured threshold, the tool must report the run as blocked rather than complete. The default threshold is 50, and it must be configurable through agent configuration.

All agent calls to an actual LLM must return a confidence score. Normal mode uses prompts to decide how to execute the task. GOAP mode removes LLM-driven orchestration decisions entirely and resolves the next step programmatically from GOAP. Workflow mode removes LLM-driven sequencing entirely and resolves the next step through mistreevous trees. The actual task work may still invoke LLMs where necessary, but branching, sequencing, and tool selection must be handled by code in GOAP/workflow modes.

When `--goap` is enabled, the runtime must not use LLM-driven reasoning for orchestration decisions. Instead, it must use deterministic GOAP or `mistreevous` decision trees to choose the next agent, spawn it, and continue the workflow without ambiguity. The GOAP path may remain staged, but the deterministic branch structure must already exist. Progress emission remains mandatory in this mode and must come from code rather than prompts.

Repo-copied agent resources remain the source of truth for prompts, commands, behavior trees, and serialized orchestration artifacts so users can customize them without changing code. When `JIRA_ENABLED=true`, the agent workflow must continue to mirror SPEC/TASK updates to the matching Jira tickets before advancing to the next stage.

This spec replaces the earlier dynamic mode-switch design as the primary agent contract and absorbs the progress-notification contract into the same agent system.

## 2. Goals
*   [ ] Add a `--agent` startup path so `mcp-server` boots directly into agent mode and loads the agent system prompt plus agent tooling.
*   [ ] Add the `agent` command namespace with `plan`, `review`, `create-specs`, `implement`, `execute`, and the general `agent.do` dispatcher.
*   [ ] Register agent instances in a runtime registry through `AgentBuilder` and expose the matching tool metadata for each agent.
*   [ ] Add the `manager` agent as the user-facing entry point for concurrent orchestration and user feedback routing.
*   [ ] Ensure every agent prompt explicitly instructs the LLM to call the correct agent tool and to finish with `TASK COMPLETE`.
*   [ ] Make all agent tools spawn child processes that run the MCP server in agent mode and report succinct `SPEC/TASK` progress updates.
*   [ ] Make every agent-facing tool return structured JSON with confidence, summary, status, questions, and blockers, and gate completion on the configured confidence threshold.
*   [ ] Keep `--goap` deterministic and non-LLM: use serialized GOAP or `mistreevous` decision trees to orchestrate the next agent selection.
*   [ ] Preserve repo-copied prompt/resource customization and Jira synchronization for SPEC/TASK updates when enabled.
*   [ ] Add the shared progress-notification contract, `agent.notify` helper, and manager relay path so long-running agent work reports progress live.
*   [ ] Add integration coverage against the compiled `dist` artifact using the inspector transport and a full mock task flow across the orchestrator, architect, implementation, reviewer, and documentation agents.

## 3. User Stories / Requirements
*   **US-1:** As a user, I want `decaf-mcp --agent` to start the server in agent mode so the agent tooling is available from boot.
*   **US-2:** As a user, I want to invoke `decaf-mcp agent plan`, `decaf-mcp agent review`, `decaf-mcp agent create-specs`, `decaf-mcp agent implement`, or `decaf-mcp agent execute SPEC-XXX` so the correct agent is selected through explicit tooling.
*   **US-3:** As a maintainer, I want the agent system prompts to explicitly call the matching `agent.*` tool so the model does not free-form the orchestration path.
*   **US-4:** As a maintainer, I want `AgentBuilder` to register each agent in a runtime registry and register the appropriate tool so `agent.do` can dispatch deterministically.
*   **US-5:** As a user, I want a manager agent to coordinate multiple agent calls, surface blockers and questions, and route replies back so the system can continue without losing context.
*   **US-6:** As an orchestrator, I want each spawned agent process to report succinct progress, return structured JSON, and end with `TASK COMPLETE` so the next step can be scheduled safely.
*   **US-7:** As a maintainer, I want `--goap` to use deterministic decision trees without LLM calls so orchestration stays predictable.
*   **US-8:** As a maintainer, I want the compiled `dist` artifact and inspector integration tests to validate the full agent stack, including a mock end-to-end task run.
*   **US-9:** As a project maintainer, I want `JIRA_ENABLED=true` runs to keep Jira tickets synchronized with SPEC/TASK updates.
*   **US-10:** As a manager, I want live progress events from long-running agent calls so I can relay blockers and questions back to the user before completion.
*   **Req-10:** All agent tooling must emit progress through the MCP notification API while executing, including prompt mode, GOAP mode, and workflow mode.
*   **Req-11:** Prompt-based mode must expose a dedicated `agent.notify` tool so prompts can request progress updates without waiting for completion.
*   **Req-12:** GOAP/workflow modes must emit progress programmatically from code, with no LLM involvement in the progress path.
*   **Req-13:** Tool calls to an actual LLM must return a confidence score, and the configured threshold must determine whether the result is accepted or blocked.
*   **Req-14:** Prompt and behavior artifacts copied into `mcp-server/toMigrate` must remain editable and must use placeholders for configurable values that the tool layer can substitute.

## 4. Architecture & Design
The implementation should extend the existing `mcp-server` architecture as follows:

*   Add a direct agent-mode boot path in the CLI so the server can start in standard mode or agent mode.
*   Load the agent system prompt during agent-mode startup and register the agent tooling immediately.
*   Add the `agent` command namespace so `plan`, `review`, `create-specs`, `implement`, and `execute` resolve to agent-backed actions.
*   Define `agent.do` as the canonical dispatcher.
    * It selects the target agent from the registry using the supplied operation and parameters.
    * Thin wrapper tools such as `agent.plan` and `agent.review` forward to `agent.do` with the appropriate operation key.
*   Update `AgentBuilder` so that build time performs two actions:
    * registers the agent instance in the runtime registry,
    * registers the corresponding tool metadata for the agent.
*   Add a manager agent that can fan out work to the orchestrator and other agents, aggregate their JSON responses, and relay questions or blockers back to the user.
*   Add a progress-notification helper and `agent.notify` tool that the prompt-based path can use while code-driven GOAP/workflow paths emit progress directly.
*   Make each agent prompt explicit about tool usage.
    * The orchestrator prompt must say when to call `agent.plan`, `agent.review`, `agent.implement`, or `agent.execute`.
    * The implementation prompt must instruct the model to call its dedicated tool and to terminate with `TASK COMPLETE`.
    * The manager prompt must instruct the model to use `agent.manage` for cross-agent coordination and to surface only concise status updates.
    * The architect prompt must focus on producing a professional-grade implementation plan from the repo documentation, style guides, tests, and constitution rules.
    * The reviewer prompt must reuse the architect context/session that produced the plan and validate the implementation against it.
    * Documentation is deferred for now and should not be considered part of the active flow.
*   Spawn a new child process for each tool invocation.
    * The child process must run the MCP server in agent mode.
    * The child process must report concise progress in `SPEC/TASK` format.
    * The child process must finish with `TASK COMPLETE`.
    * The child process must return a structured JSON payload containing confidence, summary, status, questions, and blockers.
*   Keep provider selection available when an LLM-backed agent is invoked.
    * `AGENT_PROVIDER` and `--agent-provider` continue to resolve the concrete provider CLI per agent invocation.
    * When `--goap` is active, no LLM provider should be used for orchestration decisions.
*   Keep prompts, commands, behavior trees, and serialized orchestration artifacts in the repo-copied resources so users can customize them on disk.
*   The repo-copied `toMigrate` prompt/behavior artifacts must use placeholders for configurable values, and the tool layer must substitute those placeholders when invoking the agent.
*   Preserve Jira synchronization when `JIRA_ENABLED=true` so SPEC/TASK state changes are mirrored before stage transitions.
*   Ensure the deterministic GOAP path and the `mistreevous` path share the same branch points so the runtime can switch behavior without redesigning the orchestration graph.
*   Gate tool completion on the configured confidence threshold, defaulting to 50, so low-confidence runs are treated as blocked and routed back through the manager/orchestrator flow.
*   Emit progress updates through the MCP notification API for every agent run, including the manager relay path and the deterministic GOAP/workflow path.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-130 | [Add `--agent` startup flag and agent bootstrap path](./tasks/TASK_130.md) | High | Pending | - |
| TASK-131 | [Add the `agent` command namespace and dispatcher tooling](./tasks/TASK_131.md) | High | Pending | TASK-130 |
| TASK-132 | [Implement Agent and AgentBuilder registry plus concrete agent definitions](./tasks/TASK_132.md) | High | Pending | TASK-131 |
| TASK-133 | [Rewrite agent prompts/resources to call agent tools and emit `TASK COMPLETE`](./tasks/TASK_133.md) | High | Pending | TASK-132 |
| TASK-134 | [Implement child-process orchestration, progress reporting, and `agent.do` dispatch](./tasks/TASK_134.md) | High | Pending | TASK-132, TASK-133 |
| TASK-135 | [Implement deterministic GOAP routing and compiled-dist integration tests](./tasks/TASK_135.md) | High | Pending | TASK-134 |
| TASK-140 | [Add manager agent orchestration and confidence-gated JSON tool responses](./tasks/TASK_140.md) | High | Pending | TASK-134, TASK-135 |
| TASK-143 | [Define the agent progress notification contract and `agent.notify` tool surface](./tasks/TASK_143.md) | High | Pending | TASK-134 |
| TASK-144 | [Emit live progress from prompt-based agent tools and child-process orchestration](./tasks/TASK_144.md) | High | Pending | TASK-143 |
| TASK-145 | [Emit deterministic progress from GOAP/workflow runners and manager relay paths](./tasks/TASK_145.md) | High | Pending | TASK-143, TASK-144 |
| TASK-146 | [Add compiled-dist inspector integration tests for progress notifications and full agent-system progress flow](./tasks/TASK_146.md) | High | Pending | TASK-143, TASK-144, TASK-145 |

## 6. Open Questions / Risks
*   How should the runtime map `agent.plan`, `agent.review`, and `agent.execute` onto the generic `agent.do` dispatcher without making the prompt surface brittle?
*   Which orchestration metadata must be serialized so the GOAP branch remains deterministic but still editable in repo-copied resources?
*   How should the child-process wrappers detect and propagate the `TASK COMPLETE` sentinel without truncating useful progress output?
*   Jira synchronization must continue to avoid noisy churn; SPEC/TASK updates should still be mirrored with minimal description edits.
*   Agent-mode MCP client startup is still being validated under the compiled `dist` transport; the current agent-mode handshake needs follow-up before the spec can be closed.

## 7. Results & Artifacts
*   `decaf-mcp --agent` startup path with the agent system prompt and agent tooling loaded at boot.
*   `agent` command namespace with `plan`, `review`, `create-specs`, `implement`, `execute`, and `agent.do`.
*   `AgentBuilder` registry integration that registers each agent instance and its matching tool.
*   Concrete agent prompts that explicitly instruct the LLM to call the correct agent tool and finish with `TASK COMPLETE`.
*   Prompt and behavior artifacts copied into `mcp-server/toMigrate` that use placeholders for configurable values and can be customized without changing code.
*   Child-process orchestration that runs the MCP server in agent mode and reports concise progress.
*   Deterministic GOAP/mistreevous orchestration that does not rely on LLM reasoning for agent selection.
*   Progress-notification support for prompt, workflow, and GOAP modes, including `agent.notify` and manager relay behavior.
*   Compiled-dist integration tests using the inspector transport, including a full mock task flow across orchestrator, architect, implementation, reviewer, and documentation agents.
*   Repo-installed prompt and behavior resources that remain editable after setup.
*   Jira synchronization for SPEC/TASK updates when `JIRA_ENABLED=true`.
