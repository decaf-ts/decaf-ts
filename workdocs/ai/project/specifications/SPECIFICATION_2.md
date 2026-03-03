# SPECIFICATION-2: Jira MCP Toolset

**Status:** Completed — Jira MCP tool registry, schemas, and helpers are deployed and validated against the Jira client contracts.
**Priority:** High
**Owner:** Codex

## 1. Overview
Design a full suite of Jira operations (issue CRUD, transitions, assignments, comments, links, attachments, worklogs, and shared schemas) that plug into the Decaf MCP server via the `jira.js` v3 client. The MCP server must register these tools during boot, use the existing `Environment` abstraction for credentials (including optional defaults for Jira project key, issue type, and parent issue key), surface detailed guidance when the required credentials are absent, and keep all application logging on `stderr` so only the MCP protocol writes to `stdout`.

## 2. Goals
*   [ ] Provide CRUD access to Jira issues and ensure each tool exposes precise Zod validation and error normalization.
*   [ ] Extend the Jira toolkit with transitions, assignment/unassignment, comment/listing, link management, attachment uploads, and worklog tracking so full lifecycle workflows are scriptable from the MCP protocol.
*   [ ] Keep documentation, tests, and registration centralized under `workdocs/ai/project`, document the Jira environment requirements (JIRA__HOST, JIRA__EMAIL, JIRA__API_KEY plus optional defaults like JIRA__PROJECT_KEY, JIRA__ISSUE_TYPE, and JIRA__PARENT_ISSUE), and confirm the MCP server logs through the stderr-only logger factory during tool execution.

## 3. User Stories / Requirements
*   **US-1:** As an architect, I want MCP tools that read, update, and delete Jira issues so the agent can reconcile state with the issue tracker.
*   **US-2:** As an operator, I want transition/comment, assignment, linking, attachment, and worklog utilities so the MCP server can automate Jira workflows end-to-end.
*   **Req-1:** The Jira tools must use `jira.js` v3, normalize API errors, and validate inputs via Zod schemas before invoking the client.
*   **Req-2:** Tool registration must happen during server boot via `registerJiraTools`, passing the shared `jiraClient` from `Environment` and never emitting logs on `stdout`.
*   **Req-3:** Each tool requires dedicated unit tests (and integration smoke tests where appropriate) to protect against regressions.

## 4. Architecture & Design
*   Reuse `Environment.jira` for credentials (including the new defaults for project key/issue type) and instantiate `jira.js` only when registering tools. If the environment lacks the required credentials, register the Jira handlers with a `MissingJiraEnvironmentError` that outlines the missing variables while keeping the MCP transport unaffected.
*   Export each tool with `{ name, inputSchema, runTool }` so `registerJiraTools` can map them to MCP registrations with annotations describing read-only/destructive characteristics.
*   Normalize Jira errors via a shared helper and ensure every handler returns either the structured content expected by the MCP protocol or a plain result payload.
*   Keep all tooling documentation, spec files, and planning data inside `workdocs/ai/project` per policy.

## 5. Tasks Breakdown
| ID           | Task Name                                 | Priority | Status | Dependencies |
|--------------|-------------------------------------------|----------|--------|--------------|
| TASK-40      | [Issue CRUD Tools (Read, Update, Delete)](./tasks/TASK_40.md) | High | Completed | - |
| TASK-41      | [Enhanced Transition Tool with Comment Support](./tasks/TASK_41.md) | High | Completed | TASK-40 |
| TASK-42      | [Issue Assignment Tool](./tasks/TASK_42.md) | High | Completed | TASK-41 |
| TASK-43      | [Comment Management Tools (Add, List)](./tasks/TASK_43.md) | High | Completed | TASK-41 |
| TASK-44      | [Issue Link Management Tool](./tasks/TASK_44.md) | High | Completed | TASK-43 |
| TASK-45      | [Attachment Management Tool](./tasks/TASK_45.md) | High | Completed | TASK-40 |
| TASK-46      | [Worklog Management Tool](./tasks/TASK_46.md) | High | Completed | TASK-40 |
| TASK-47      | [Update Zod Schemas for All Operations](./tasks/TASK_47.md) | High | Completed | All of the above |

## 6. Open Questions / Risks
*   Can the Environment always provide Jira credentials during CI runs, or do we need fallback mocks for testing? Assume yes but design factories to throw informative errors when credentials are missing.
*   Log output must stay on `stderr`; confirm no tooling accidentally writes to `stdout`, especially during tool registration and execution.
*   Schema synchronization must stay manageable; track any schema additions centrally in `src/modules/jira/schemas/types/index.ts`.

## 7. Results & Artifacts
*   Jira schemas (`update-issue-input`, assign, comment, link, attachment, worklog`, plus aggregated types).
*   Tool implementations for issue operations, transitions with comments, assignment, comments/listing, links, attachments, and worklogs using `jira.js`.
*   `registerJiraTools` helper that wires all tools into the MCP server during `registerTools`.
*   Dedicated unit (and integration where noted) tests ensuring each tool validates inputs, normalizes errors, and calls the Jira client correctly.
*   Unit tests covering the Jira tools are exercised via `npm run test:unit` inside the `mcp-server` workspace to lock in schema validation and error normalization.
*   The MCP agents now log through stderr (via the shared logger pattern) and rely on Mistreevous-based behaviour trees so only the MCP protocol writes to stdout, satisfying the specification's logging constraint.
*   Spec fixtures under `specs/001-ast-jsdoc-tools` and `specs/002-decoration` ship the golden prompts, fixtures, and metadata helpers that the decoration/task tooling expects.
