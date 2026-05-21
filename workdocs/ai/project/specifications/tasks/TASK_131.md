# TASK-131: Add agent-mode resources, templates, and registration for behavior trees

**ID:** TASK-131
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add the MCP resources, prompt wiring, provider selection, and registration logic required to expose agent behavior only when the server boots in agent mode. The agent behavior definitions must be encoded as resources and reference the flat `*_template.md` files from `mcp-server/src/assets/templates`.
The effective prompts, command definitions, mistreevous trees, and GOAP artifacts must be loaded from the repo-copied resources created by `agent setup` so the user can customize them later.

## 2. Objectives
*   [ ] Register agent-only resources in agent mode.
*   [ ] Define the resource-backed behavior tree JSON structure for agents.
*   [ ] Wire the agent prompts/resources into the agent-mode bootstrap path only.
*   [ ] Ensure the assets reference the flat template files in `src/assets/templates`.
*   [ ] Add provider selection for `AGENT_PROVIDER` / `--agent-provider` and eager initialization when agent mode loads.
*   [ ] Add the `--goap` routing flag so the runtime can switch between hardcoded `mistreevous` workflows and GOAP-compatible branches.
*   [ ] Load prompts and serialized agent behavior artifacts from the repo-installed resource files instead of embedded defaults.

## 3. Implementation Plan
**Proposed Changes:**
*   Add agent resource registration modules alongside the existing prompt/resource builders.
*   Store behavior/objective metadata in JSON resources that the model can inspect.
*   Gate all agent-specific resources behind the agent-mode startup path.
*   Resolve the selected agent CLI provider at startup and pass it the orchestrator prompt plus tool metadata.
*   Initialize agent-mode assets on load when the setup flow has not already materialized the workspace.
*   Resolve agent prompts and behavior trees from the repo-copied files so user edits are honored.
*   Add the `--goap` flag plumbing and preserve the same branch conditions for the staged GOAP path.

**Technical Details:**
*   Agent resources should not appear in normal server mode.
*   Keep the resources deterministic and static so they can be read lazily by the model.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: agent-mode resources are only registered in agent mode.
*   [ ] Unit Test: agent resource metadata references the expected template files.
*   [ ] Unit Test: agent provider resolution honors `AGENT_PROVIDER` and `--agent-provider`.
*   [ ] Unit Test: `--goap` routes to the GOAP-capable branch metadata while preserving the hardcoded branch shape.
*   [ ] Unit Test: repo-installed prompt and behavior resources are preferred over embedded defaults.

**Manual Verification:**
*   Boot the server in agent mode and confirm the agent resources appear in the registry.
*   Boot agent mode without a prior setup run and confirm it initializes the workspace artifacts.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Started task.
