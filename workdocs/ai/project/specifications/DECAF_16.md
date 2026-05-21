# DECAF-16 — Jira Ticket Template Resources & Guided Creation

**Status:** Completed
**Priority:** High
**Owner:** Codex

## 1. Overview
Add resource-backed Jira ticket templates and guided creation tooling in `mcp-server` so agents can create new Jira tickets by type (`bug`, `incident`, `release`, `feature`, `test`, and related ticket classes) without hand-writing the full structure each time. The default templates must live in MCP resources, be discoverable through the server's resource registry, and be usable by prompts that guide the agent to create tickets from those resources when the user does not supply a custom template.

This specification builds on the existing Jira issue creation flow, which already supports template merging in `jira-issue-create`, by adding a first-class template selection layer and a consistent prompt path for creating tickets from those templates.
The guided prompt must also accept an explicit `<template_path>` reference so users can point to a different template resource when the default type-based template is not the desired one.

## 2. Goals
*   [ ] Publish default Jira ticket templates as MCP resources so the server can expose them through the standard resource registry.
*   [ ] Add guided Jira ticket creation prompts that resolve the correct template resource by ticket type when no custom template is provided.
*   [ ] Provide a ticket-creation entry point that reuses the existing Jira issue creation primitive while selecting the correct template payload from resources.
*   [ ] Document the default template catalog and the fallback behavior for users who only specify a ticket type and summary.
*   [ ] Ensure the tool metadata and prompt wording make the template-backed ticket creator the preferred target for phrases like "open a bug ticket", rather than the generic issue creation flow.
*   [ ] Track template-specific custom fields for the default ticket templates and prompt the user for any missing values before ticket creation.

## 3. User Stories / Requirements
*   **US-1:** As an agent, I want a reusable template resource for each ticket type so I can create consistent Jira tickets without reconstructing the format from scratch.
*   **US-2:** As a user, I want to ask for a bug, incident, release, feature, or test ticket and have the server choose the matching template automatically when I do not provide one.
*   **US-4:** As a user, I want the template-backed flow to prompt me for template-specific fields such as impact, steps to reproduce, evidence, rollback plan, and acceptance criteria when they are missing.
*   **US-3:** As a maintainer, I want the new flow to reuse the existing Jira issue creation code path so template rendering stays centralized and backwards compatible.
*   **Req-1:** Default templates must be exposed as MCP resources, not only as local markdown assets, so other prompts and tools can reference them by resource identity.
*   **Req-2:** Prompt guidance must prefer the default resource templates when the user does not supply a custom template and must still allow explicit overrides.
*   **Req-3:** The ticket creation flow must preserve the current `jira-issue-create` behavior for raw field creation and template merging.
*   **Req-4:** The implementation must include tests and documentation covering both the resource registration layer and the ticket creation selection logic.
*   **Req-5:** The prompt/tool contract must accept an explicit `<template_path>` reference so callers can choose a non-default template resource.
*   **Req-6:** Tool metadata must clearly distinguish the template-backed ticket creator from the generic ticket creator so the model can map utterances like "open a bug ticket" to the typed template flow by default.

## 4. Architecture & Design
The implementation should extend the existing `mcp-server` resource and prompt structure:

*   Add ticket template resources under the MCP resource registry, using the same builder pattern as the other resources in `src/resources`.
*   Use the existing Jira asset templates as the source of truth for the default ticket payloads, then expose them through MCP resource URIs so prompts can consume them consistently.
*   Add richer default templates for incident and release/change request flows, with explicit sections for impact, evidence, affected components, implementation plan, rollback plan, test plan, and acceptance criteria.
*   Add one or more Jira guidance prompts under `src/prompts/jira/` that:
    * resolve the requested ticket type to a template resource,
    * accept an explicit `<template_path>` override for alternative template resources,
    * ask for missing required fields and template-specific custom fields before creating the issue,
    * and produce an action preview before the tool is called.
*   Implement the ticket creation flow as a thin wrapper around the existing issue-creation primitive in `src/tools/issue/create-tool.ts` and `src/modules/jira/tools/issue-create.ts`, so template resolution happens before the existing ADF merge logic runs.
*   Publish tool metadata that is specific enough for prompt routing and tool selection, including ticket-type naming and descriptions that make the bug/incident/release/feature/test template path explicit.
*   Surface template-specific field metadata in the resource catalog so the prompt can ask for values like impact, steps to reproduce, evidence, rollback plan, and acceptance criteria.
*   Preserve backwards compatibility for callers that already use `jira-issue-create` with raw `fields` or explicit `template` content.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-126 | [Add default Jira ticket template resources to the MCP resource registry](./tasks/TASK_126.md) | High | Completed | - |
| TASK-127 | [Add guided Jira ticket creation prompts that resolve template resources by type](./tasks/TASK_127.md) | High | Completed | TASK-126 |
| TASK-128 | [Add the resource-backed Jira ticket creation tool/wrapper and tests](./tasks/TASK_128.md) | High | Completed | TASK-127 |
| TASK-129 | [Expand Jira ticket templates with custom-field tracking and professional incident/release layouts](./tasks/TASK_129.md) | High | Completed | TASK-127, TASK-128 |

## 6. Open Questions / Risks
*   Resource-template drift is a risk if the markdown assets and exposed MCP resources diverge, so the implementation should keep one source of truth.
*   Tool routing needs explicit metadata and descriptive naming so the model prefers the typed template flow when the user says "open a bug ticket" or similar shorthand.
*   The inspector CLI transport test remains flaky in this environment, but it is not blocking the feature completion status.

## 7. Results & Artifacts
*   Default Jira ticket templates exposed as MCP resources.
*   Jira guidance prompt(s) that select ticket templates from those resources.
*   A ticket creation entry point that reuses the existing Jira issue creation path.
*   Per-template Jira markdown docs and custom-field metadata for bug, incident, release, feature, and test flows.
*   Tests and documentation covering template selection, resource registration, custom-field prompts, and fallback behavior.
