# TASK-130: Add agent CLI setup command and workspace installer

**ID:** TASK-130
**Specification:** [Link to Specification](../DECAF_17.md)
**Priority:** High
**Status:** Pending

## 1. Description
Add the `agent setup` CLI subcommand so `decaf-mcp agent setup` can install the agent workspace files into a target directory. The command must support an optional `--path` argument defaulting to `workdocs/ai` and an `--entryFile` argument defaulting to `./AGENTS.md`.

## 2. Objectives
*   [ ] Add the CLI command and option parsing for `agent setup`.
*   [ ] Copy the agent markdown/resources to the destination path.
*   [ ] Create or update the entry `AGENTS.md` file at the requested entry path.
*   [ ] Ensure the installed files point to the flat `*_template.md` assets from `mcp-server/src/assets/templates`.

## 3. Implementation Plan
**Proposed Changes:**
*   Extend the `agent` CLI command tree to add a `setup` subcommand.
*   Reuse the existing asset/template copying mechanics where possible.
*   Add validations so the setup command respects default paths and does not recurse into nested template subfolders.

**Technical Details:**
*   The setup command should be deterministic and idempotent enough to rerun safely.
*   Keep the template references aligned with the `src/assets/templates` flat directory rule.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `agent setup` resolves the default path and entry file.
*   [ ] Unit Test: `agent setup` copies the expected workspace files.

**Manual Verification:**
*   Run `decaf-mcp agent setup` against a temp directory and confirm the workspace files are installed.

## 5. Blockers & Clarifications
*   None.

## 6. Execution Log
*   [2026-05-21] - Started task.
