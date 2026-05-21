# TASK-126: Add default Jira ticket template resources to the MCP resource registry

**ID:** TASK-126
**Specification:** [Link to Specification](../DECAF_16.md)
**Priority:** High
**Status:** Completed

## 1. Description
Create the default Jira ticket template resources that will back the new guided ticket creation flow. The templates must be registered as MCP resources so other prompts and tools can resolve them by resource identity instead of reading raw markdown assets directly.

## 2. Objectives
*   [x] Define the default template set for common ticket types such as bug, incident, release, feature, test, and related variants.
*   [x] Register the templates through the `mcp-server` resource registry.
*   [x] Keep the template content aligned with the existing Jira markdown template conventions.

## 3. Implementation Plan
**Proposed Changes:**
*   Add new resource definitions under `mcp-server/src/resources/` for the Jira ticket templates.
*   Reuse or adapt the existing template assets so the resource payloads stay consistent with the markdown converter expectations.
*   Update the resource registry export list so the new resources are discoverable during server boot.

**Technical Details:**
*   Keep the default templates as the canonical source for later prompt and tool resolution.
*   Use the existing resource builder pattern to keep registration consistent with the rest of the server.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: resource registration returns the new Jira template resources.
*   [x] Integration Test: server info/resource listing exposes the ticket template resources.

**Manual Verification:**
*   Inspect the resource listing and confirm the default Jira ticket templates appear with the expected names and URIs.

## 5. Blockers & Clarifications
*   Resolved: the implementation uses one catalog resource plus one resource per default template type.

## 6. Execution Log
*   [2026-05-21] - Started task.
*   [2026-05-21] - Added Jira template resources for bug, feature, test, and catalog exposure.
*   [2026-05-21] - Expanded the template set to include incident and release resources with catalog metadata.
