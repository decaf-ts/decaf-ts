# TASK-127: Add guided Jira ticket creation prompts that resolve template resources by type

**ID:** TASK-127
**Specification:** [Link to Specification](../DECAF_16.md)
**Priority:** High
**Status:** Completed

## 1. Description
Add Jira guidance prompt(s) that help the agent create tickets from the default MCP resources when the user specifies a ticket type but does not provide a custom template. The prompt should ask for any missing required fields, resolve the chosen type to a resource-backed template, and prepare the creation payload for execution.
The prompt must also accept an explicit `<template_path>` reference so the user can point to a different template resource when the default type-specific template is not desired.

## 2. Objectives
*   [x] Map ticket types to the default template resources.
*   [x] Allow `<template_path>` overrides that point to other template resources.
*   [x] Prompt for missing summary, project, and other required ticket fields before execution.
*   [x] Produce a clear action preview that shows which template resource will be used.

## 3. Implementation Plan
**Proposed Changes:**
*   Add or extend Jira prompt definitions under `mcp-server/src/prompts/jira/`.
*   Reference the ticket template resources from the prompt guidance instead of embedding template markdown inline.
*   Include metadata and descriptions that make the typed template flow the preferred route for natural language requests like "open a bug ticket".
*   Keep the prompt instructions aligned with the existing safe write flow used by the Jira agent prompt.

**Technical Details:**
*   Reuse the current prompt-builder pattern so the new guidance appears alongside the existing Jira operational prompts.
*   Ensure the prompt can fall back to the default resource catalog when no custom template is provided.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: prompt generation resolves the correct template resource for each supported ticket type.
*   [x] Unit Test: prompt guidance falls back to the default resource when no template override is provided.

**Manual Verification:**
*   Exercise the prompt path for bug, incident, release, feature, and test tickets and confirm the generated preview references the correct resource.

## 5. Blockers & Clarifications
*   Resolved: keep a single Jira guide prompt that routes by ticket type and `template_path`, rather than one prompt per ticket type.

## 6. Execution Log
*   [2026-05-21] - Started task.
*   [2026-05-21] - Added Jira guidance prompt for template-backed ticket creation and `template_path` overrides.
*   [2026-05-21] - Updated the prompt to surface per-template custom fields and the incident/release template variants.
