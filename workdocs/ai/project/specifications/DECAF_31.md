# DECAF-31 — mcp-server CLI Packaging, ADOS Setup, and Dist Inspector Validation

**Status:** Completed
**Priority:** High
**Owner:** Codex

## 1. Overview
`mcp-server` currently has two related problems:

1. The agent/ADOS setup is not documented clearly enough to explain how the CLI should behave when the package is installed and loaded from `node_modules`.
2. The MCP server is again failing to load in scenarios that depend on the compiled `dist` artifact, especially when exercised through the inspector transport.

This specification hardens the `mcp-server` CLI and packaging path so the server works both from a source checkout and as a published Node library. It also re-validates the orchestration-oriented CLI surface, including `decaf-mcp repo:init <path> --orchestration --agent <agent>`, and any related command paths that currently fail with template resolution errors such as:

`Error: Templates directory not found. Searched: /home/tvenceslau/local-workspace/others/mocho/node_modules/@decaf-ts/assets/templates`

The expected result is a CLI and dist build that can be loaded reliably from `node_modules`, resolves templates and workspace assets correctly, and passes integration coverage through the inspector transport after `build:dist`.

## 2. Goals
*   [x] Make `mcp-server` load reliably from the compiled `dist` artifact under the inspector transport.
*   [x] Revalidate the `repo:init` orchestration flow and related ADOS/orchestration CLI commands when installed as a library in `node_modules`.
*   [x] Fix template and asset resolution so packaged CLI commands do not assume a source-tree working directory.
*   [x] Add or repair integration tests that cover `build:dist`, inspector boot, and the orchestration CLI paths.
*   [x] Update the documentation to explain the working installation and boot model for `mcp-server` and the ADOS setup.

## 3. User Stories / Requirements
*   **US-1:** As a consumer, I want `mcp-server` to boot from `dist` through the inspector so I can validate the published package, not just the source tree.
*   **US-2:** As a user, I want `decaf-mcp repo:init <path> --orchestration --agent <agent>` to work when the package is installed inside `node_modules`.
*   **US-3:** As a maintainer, I want template and resource resolution to work in both source and installed-library layouts so the CLI does not depend on a repo-local path.
*   **US-4:** As a maintainer, I want integration tests that fail when the packaged CLI or inspector boot path regresses.
*   **Req-1:** The CLI must locate templates and copied orchestration assets without assuming the repository root is the process cwd.
*   **Req-2:** The dist artifact must remain directly usable by the inspector transport after `build:dist`.
*   **Req-3:** The orchestration/ADOS commands must preserve their current command names and flags while fixing the underlying path logic.
*   **Req-4:** Documentation must describe the supported installation and runtime layout for both source checkout and installed package use.

## 4. Architecture & Design
The fix should be implemented in the `mcp-server` package with a clear separation between:

* CLI argument parsing and command dispatch.
* Workspace and template path resolution.
* Packaged asset discovery when the module is installed under `node_modules`.
* Dist build and inspector boot validation.
* Integration tests that exercise the real compiled artifact instead of mocked internals.

The likely implementation areas are:

* `mcp-server/src/utils/*` for path and asset resolution helpers.
* `mcp-server/src/cli-module.ts` for orchestration CLI command wiring and flags.
* `mcp-server/src/modules/agent/runtime/*` for any agent workspace bootstrap behavior that still assumes source-tree paths.
* `mcp-server/tests/integration/*` for inspector and CLI end-to-end coverage.
* `mcp-server/workdocs/*` and the root `workdocs/ai/project/*` docs for the ADOS/CLI usage guidance.

The path resolution logic should prefer the installed package assets when running from `node_modules`, while still supporting source checkout development where assets live under the repository tree.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:-------|:-------------|
| TASK-31-1 | [Fix packaged asset and template resolution for `mcp-server` CLI commands](./tasks/TASK_31_1.md) | High | Completed | - |
| TASK-31-2 | [Repair `repo:init` orchestration and ADOS setup when installed from `node_modules`](./tasks/TASK_31_2.md) | High | Completed | TASK-31-1 |
| TASK-31-3 | [Restore compiled `dist` loading and inspector transport validation for `mcp-server`](./tasks/TASK_31_3.md) | High | Completed | TASK-31-1 |
| TASK-31-4 | [Add and repair integration tests for orchestration CLI flows and dist boot](./tasks/TASK_31_4.md) | High | Completed | TASK-31-2, TASK-31-3 |
| TASK-31-5 | [Document the supported ADOS/package-install CLI flow and verification steps](./tasks/TASK_31_5.md) | Medium | Completed | TASK-31-2, TASK-31-4 |

## 6. Open Questions / Risks
*   Which asset root should be treated as canonical when both the source tree and an installed package are present?
*   Should the template search order prefer the package-local assets first, then fall back to the workspace copy, or the reverse?
*   Does the inspector validation need to cover both standard boot and agent boot, or only the agent-enabled dist path?
*   Are there additional orchestration CLI commands beyond `repo:init` that share the same broken template lookup and should be covered by the same fix?
*   Documentation may need to distinguish between development-time source usage and production-like installed-package usage to avoid future path regressions.

## 7. Results & Artifacts
*   A completed `DECAF-31` specification covering `mcp-server` CLI packaging and ADOS setup hardening.
*   CLI/path-resolution fixes for packaged use under `node_modules`.
*   Integration tests covering `build:dist`, inspector boot, and orchestration CLI commands.
*   Updated documentation for the packaged `mcp-server` boot and template resolution model.
