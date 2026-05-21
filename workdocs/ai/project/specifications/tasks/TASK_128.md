# TASK-128: Add the resource-backed Jira ticket creation tool/wrapper and tests

**ID:** TASK-128
**Specification:** [Link to Specification](../DECAF_16.md)
**Priority:** High
**Status:** Completed

## 1. Description
Add the ticket creation entry point that uses the selected template resource and then delegates to the existing Jira issue creation flow. The implementation should preserve backwards compatibility for raw-field creation while allowing the new ticket-type/template-resource path.
The tool metadata should be written so the model can route shorthand requests like "open a bug ticket" to the typed template-backed tool instead of the generic issue creator.

## 2. Objectives
*   [x] Add a creation wrapper or new tool entry point that accepts a ticket type and resolves a template resource.
*   [x] Make the tool metadata and description explicit enough that the model can distinguish the template-backed ticket creator from the generic open/create flow.
*   [x] Reuse the existing Jira issue creation and ADF merge logic.
*   [x] Add tests and documentation proving the new flow still supports raw fields and explicit template overrides.

## 3. Implementation Plan
**Proposed Changes:**
*   Extend the Jira create tool surface in `mcp-server/src/tools/issue/create-tool.ts` and the registered tool wrapper in `mcp-server/src/modules/jira/tools/issue-create.ts`.
*   Resolve the selected template resource before invoking the existing create path.
*   Encode the ticket-type mapping in tool metadata so a request like "open a bug ticket" resolves to the bug template path by default.
*   Update the relevant exports and docs so the new flow is discoverable from the MCP server tooling.

**Technical Details:**
*   Keep the template resolution layer separate from the Jira ADF conversion path.
*   Preserve the existing `jira-issue-create` behavior for users who already provide raw `fields` or explicit `template` content.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: create flow resolves the correct template resource for each supported type.
*   [x] Unit Test: raw field creation remains unchanged.
*   [x] Integration Test: the tool creates a Jira issue using a resource-backed template selection.

**Manual Verification:**
*   Create at least one bug and one feature ticket from the new flow and verify the rendered description matches the chosen resource template.

## 5. Blockers & Clarifications
*   Resolved: publish the template-backed flow as a distinct `jira-ticket-create` tool while keeping `jira-issue-create` for raw issue creation.

## 6. Execution Log
*   [2026-05-21] - Started task.
*   [2026-05-21] - Added `jira-ticket-create`, wired it into Jira registration, and covered it with unit/metadata tests.
*   [2026-05-21] - Extended the wrapper to accept `customFields`, support external `template_path` + `template.content`, and route incident/release templates.
