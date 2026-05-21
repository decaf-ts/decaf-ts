# DECAF-17 — mcp-server Agent Mode, Multi-Agent Orchestration, and Spec Sync

**Status:** Planned
**Priority:** High
**Owner:** Codex

## 1. Overview
Add an explicit agent mode to `mcp-server` that exposes agent-specific tooling only when the server is started in agent mode, and provide a CLI setup flow for installing the agent workspace artifacts into a target path. The agent mode must use `mistreevous` for behavior orchestration by default, keep GOAP decision branches available behind a `--goap` flag, and encode all agent behavior as MCP resources so the model can reason over them deterministically.

When `--goap=false`, the system must execute hardcoded `mistreevous` workflows stored in resources. When `--goap=true`, the same workflow decisions must be represented in GOAP terms so the planner can converge on the same outcomes through goal selection. The GOAP implementation may be staged, but the conditional decision structure must already exist so the runtime can switch between modes without redesigning the orchestration graph.

The agent setup flow must be available under the agent CLI command as a `setup` subcommand. It must accept an optional `--path` argument that defaults to `workdocs/ai`, and it must copy the agent markdown/resources to the target path while creating or updating the entry `AGENTS.md` file designated by `--entryFile` (default `./AGENTS.md`).

The agent assets must reference the corresponding `*_template.md` files in `mcp-server/src/assets/templates`, and those template files must remain flat in that folder only, with no nested subfolders.

All agents must read their prompts and command definitions from the resource files previously copied into the repository by `agent setup`. This allows users to customize prompts and behavior by editing the repo-installed resources without changing code.

The same applies to serialized `mistreevous` and GOAP artifacts: they must be kept on disk with the repo-installed agent workspace files so users can replace or tune them when required.

The agent CLI must also support an `--agent-provider` flag, or `AGENT_PROVIDER` environment variable, to select the external CLI provider that actually runs the orchestrator prompt. The default provider is `codex`; valid providers are `claude` and `copilot`. Agent mode startup must load the selected CLI, pass it the orchestrator prompt and associated tooling metadata, and use it as the execution driver for agent-mode orchestration.

Agent mode must initialize eagerly at load time if it has not already been initialized through the CLI setup flow. This means the agent resources, prompts, and entry files must be prepared as part of agent-mode startup so the runtime can resolve them immediately.

The `agent` command must also support an execute flow, exposed as `decaf-mcp agent execute SPEC-XXX` or equivalent `--execute SPEC-XXX` routing, to trigger an automated development run for the requested spec. That execute flow must stop on blockers or clarifications rather than silently guessing.

When `JIRA_ENABLED=true`, the agent automation must create and maintain matching Jira specification tickets for every `SPEC` file. If a `SPEC` file changes, the corresponding Jira ticket must also be updated. Description changes should be minimized; status changes should be reflected by Jira comments, and checklist updates should be mirrored to the ticket when strictly necessary.

## 2. Goals
*   [ ] Add an agent-mode startup path so `decaf-mcp agent start` boots the server in agent mode and exposes agent-only tools/resources/prompts.
*   [ ] Add an `agent setup` CLI subcommand with `--path` and `--entryFile` options that installs the agent workspace files into a target location.
*   [ ] Add an `agent execute SPEC-XXX` flow that runs the automated development pipeline for a specific spec and pauses on blockers or clarifications.
*   [ ] Add provider selection with `AGENT_PROVIDER` / `--agent-provider` so the selected CLI receives the orchestrator prompt and tool metadata.
*   [ ] Define an `Agent` abstraction and `AgentBuilder` that construct agents through `mistreevous` behavior trees with weights and objectives encoded as JSON resources.
*   [ ] Create the core agent roles required for orchestration: main agent, orchestrator, architect, implementation, reviewer, and documentation agents.
*   [ ] Store all agent behaviors as MCP resources and only register them in agent mode.
*   [ ] Load agent prompts, command definitions, mistreevous trees, and GOAP serialized artifacts from the repo-copied resource files instead of hardcoding them in code.
*   [ ] Add `--goap` routing so the runtime can switch between hardcoded `mistreevous` workflows and GOAP-equivalent decision trees.
*   [ ] Add Jira synchronization for `SPEC` file updates when `JIRA_ENABLED=true`.

## 3. User Stories / Requirements
*   **US-1:** As a user, I want to run `decaf-mcp agent setup` so the agent workspace files and AGENTS entry file are installed into my chosen docs path.
*   **US-2:** As a user, I want `decaf-mcp agent start` to run the MCP server in agent mode with agent-specific tooling available only in that mode.
*   **US-3:** As a maintainer, I want agent behavior to be encoded as resources so the model can inspect and reason about the workflow without hidden runtime logic.
*   **US-3a:** As a maintainer, I want the repo-installed agent resources to be user-editable so prompt and behavior changes do not require code changes.
*   **US-4:** As a maintainer, I want agent mode to select a CLI provider (`codex`, `claude`, or `copilot`) so the orchestrator prompt runs through the appropriate external executable.
*   **US-5:** As an orchestrator, I want behavior trees and GOAP-style goals to be explicit so the agent flow is deterministic, inspectable, and recoverable.
*   **US-6:** As a user, I want `decaf-mcp agent execute SPEC-XXX` so the implementation pipeline runs automatically until it needs clarification or hits a blocker.
*   **US-7:** As a project maintainer, I want Jira specification tickets to stay synchronized with `SPEC` changes whenever `JIRA_ENABLED=true`.

## 4. Architecture & Design
The implementation should extend the existing `mcp-server` architecture as follows:

*   Add an agent-mode boot path in the CLI so the server can be started in standard mode or agent mode.
*   Add provider selection for agent mode:
    * `AGENT_PROVIDER` environment variable and `--agent-provider` CLI flag,
    * default provider `codex`,
    * supported providers `claude` and `copilot`,
    * provider selection should drive the external CLI that receives the orchestrator prompt and tool metadata.
*   Initialize agent mode eagerly when the runtime loads if the setup flow has not already materialized the required agent workspace artifacts.
*   Introduce an `Agent` abstraction backed by `mistreevous` behavior trees. Each agent should declare:
    * objectives,
    * action steps,
    * weights/priorities,
    * fallback behavior,
    * and success/failure transitions.
*   Introduce an `AgentBuilder` using the existing builder pattern used for prompts/resources/tools. The builder should make it easy to add a new agent by supplying its behavior resource, objectives, and actions.
*   Store all agent behavior JSON under MCP resources and register them only in agent mode.
*   Load the effective prompts, commands, mistreevous trees, and GOAP structures from the repo-installed resources so user edits are honored.
*   Define the following concrete agents:
    * main agent, responsible for spawning and tracking one orchestrator per spec,
    * orchestrator agent, responsible for coordinating the overall task lifecycle,
    * architect agent, responsible for planning and review,
    * implementation agent, responsible for coding, linting, building, and testing,
    * reviewer agent, responsible for validating the implementation against the requested task,
    * documentation agent, responsible for updating docs after code changes.
*   Use `goap-solver` for goal decomposition and task dependency solving when the agent needs adaptive planning, but keep `mistreevous` as the primary orchestration layer and stage the GOAP decision path behind the same branch points.
*   Add an `agent execute SPEC-XXX` workflow:
    * resolve the matching spec,
    * spawn the orchestration path for that spec,
    * stop on blockers, clarifications, or unanswered dependencies,
    * update spec/task artifacts before each stage advances.
*   When the orchestrator receives a `plan` request, call the architect agent via a dedicated tool to produce and validate the implementation plan, resolve blockers/clarifications, and then continue through implementation, review, and documentation stages.
*   Adapt the agent command surface so shared plan/spec/task artifacts remain readable to every agent, while writes happen in git-tree-isolated workspaces that can run in parallel.
*   Add standard progress reporting from child agents back to the orchestrator, and from the orchestrator back to the user, using a fixed `SPEC/TASK` status format.
*   Allow the orchestrator to call the architect, implementation, reviewer, and documentation agents asynchronously as child processes, while keeping orchestration concurrency-safe across multiple git trees.
*   Ensure all agents can read the plan/spec/task artifacts, but isolate work in git trees so multiple orchestrations can run safely in parallel.
*   Require the architect/planner agent to read code, best practices, constitutions, and documentation before it produces a plan or review.
*   Require the implementation/executor agent to follow a strict workflow: plan -> build -> lint -> test individual -> test full suite -> return.
*   Require every agent step to update the relevant spec/task files, and to update Jira issues when enabled, before advancing to the next stage.
*   Add a CLI setup command under `agent`:
    * `decaf-mcp agent setup`
    * options:
      * `--path <path>` defaulting to `workdocs/ai`
      * `--entryFile <file>` defaulting to `./AGENTS.md`
    * behavior:
      * copy the agent markdown/resource files to the target path,
      * create/update the entry AGENTS file,
      * ensure the installed files reference the `*_template.md` assets from `mcp-server/src/assets/templates` only.
*   Add Jira synchronization hooks:
    * if `JIRA_ENABLED=true`, create or update matching Jira tickets for every `SPEC` file,
    * minimize description changes,
    * add status changes as comments,
    * update checklists only when necessary to reflect task completion.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-130 | [Add agent CLI setup command and workspace installer](./tasks/TASK_130.md) | High | Pending | - |
| TASK-131 | [Add agent-mode resources, templates, and registration for behavior trees](./tasks/TASK_131.md) | High | Pending | TASK-130 |
| TASK-132 | [Implement Agent and AgentBuilder abstractions plus concrete orchestration agents](./tasks/TASK_132.md) | High | Pending | TASK-131 |
| TASK-133 | [Add JIRA_ENABLED spec synchronization for SPEC file updates](./tasks/TASK_133.md) | High | Pending | TASK-131 |
| TASK-134 | [Implement agent execute flow, stage progression, and progress reporting](./tasks/TASK_134.md) | High | Pending | TASK-132, TASK-133 |
| TASK-135 | [Add main-agent orchestration and concurrency-safe git-tree execution](./tasks/TASK_135.md) | High | Pending | TASK-132, TASK-134 |

## 6. Open Questions / Risks
*   How much of the agent runtime should live in `mcp-server` versus reusable shared modules?
*   Which parts of the GOAP branch should ship in stage 1 versus stage 2 while keeping the conditional tree shape ready?
*   How should behavior-tree JSON be versioned so agent resources remain stable across updates?
*   Jira synchronization must avoid noisy churn; status and checklist updates should be mirrored with minimal description edits.

## 7. Results & Artifacts
*   `agent setup` CLI command with `--path` and `--entryFile`.
*   `agent execute SPEC-XXX` automated development command.
*   Provider selection for `codex`, `claude`, or `copilot` via `AGENT_PROVIDER` / `--agent-provider`.
*   Agent-mode server startup path with agent-only tooling and resources.
*   `Agent` and `AgentBuilder` abstractions backed by `mistreevous`.
*   Concrete main, orchestrator, architect, implementation, reviewer, and documentation agents.
*   MCP resources containing agent behaviors and objectives.
*   Repo-installed prompt and behavior resources that are editable after `agent setup`.
*   GOAP decision branches staged behind the same orchestration gates.
*   Jira synchronization for `SPEC` file updates when `JIRA_ENABLED=true`.
