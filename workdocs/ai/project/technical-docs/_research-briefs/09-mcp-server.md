# Research Brief — `mcp-server`

Scope: `@decaf-ts/mcp-server` (`/workspaces/decaf-ts/mcp-server`). Single module
assigned to this brief. The brief was produced by a read-only review of `src/`,
`tests/`, `workdocs/`, `docs/`, README, and `package.json` — no tests or builds
were executed.

---

### mcp-server (`@decaf-ts/mcp-server` v1.15.2)

#### 1. Identity
- **Directory:** `/workspaces/decaf-ts/mcp-server`
- **Package name:** `@decaf-ts/mcp-server`
- **Version:** `1.15.2` (`package.json:134`)
- **Description:** `"mcp server for code assistance of decaf-ts projects"`
  (`package.json:3`)
- **License:** `AGPL-3.0` (`package.json:133`); README states an
  MIT-with-AGPL-trigger hybrid (`README.md:131`).
- **Binary:** `decaf-mcp` → `./dist/mcp-server.cjs` (`package.json:5-7`).

#### 2. Purpose & role
The package is a Model Context Protocol (MCP) server built on
`@modelcontextprotocol/sdk`. It exposes decaf-ts–aware **tools**, **prompts**,
and **resources** to AI coding agents (Codex/Claude/Copilot), plus an **agent
orchestration** layer that drives an opinionated SPEC/TASK workflow via
behavior trees (mistreevous) or GOAP planning (goap-solver). It also bundles a
comprehensive **Jira/Xray** integration (issue/transition/comment/link/
attachment/worklog/xray-step tooling, Markdown↔ADF conversion) and a
**file-summarizer** that delegates to a provider CLI. It sits at the
application/integration layer of the decaf-ts stack — it depends on core,
decoration, decorator-validation, db-decorators, injectable-decorators, logging,
and cli, and is consumed by AI tooling rather than by other decaf packages.

#### 3. Dependencies
- **Runtime decaf modules** (`package.json:106-112`): `@decaf-ts/cli`,
  `@decaf-ts/core`, `@decaf-ts/db-decorators`, `@decaf-ts/decoration`,
  `@decaf-ts/decorator-validation`, `@decaf-ts/injectable-decorators`,
  `@decaf-ts/logging`. (`@decaf-ts/utils` is dev-only.)
- **Key external deps:** `@modelcontextprotocol/sdk` (`^1.27.1`) and
  `@modelcontextprotocol/inspector`; `commander` (CLI); `goap-solver` (GOAP
  planning); `mistreevous` (behavior trees); `jira.js` (Jira REST v3) +
  `graphql`/`graphql-tag` (Xray GraphQL); `remark-*`/`unified` (Markdown→ADF
  pipeline); `ts-morph` (declared but unused — see inaccuracies); `zod`
  (schemas); `uuid`.
- **Dependents:** This is a leaf application package; nothing in the decaf-ts
  monorepo depends on it at runtime. It is consumed as a CLI/standalone MCP
  server (`decaf-mcp`) by external AI agents.

#### 4. Architecture & structure
Top-level `src/` layout:
- `mcp-server.ts` — `McpServer` class: owns the underlying `MCP` client
  (stored in a `WeakMap`), `boot(transport, options)` lifecycle, and `load()`
  which registers prompts/tools/resources and (optionally) agent-mode assets.
- `cli-module.ts` + `bin/cli.ts` — Commander-based CLI (`decaf-mcp`) with
  `start`, `agent` (subcommands: `setup`, `start`, `do`, `manage`, `plan`,
  `review`, `create-specs`, `implement`, `execute`), `md-to-ast`, and
  `repo:init`.
- `builders/` — fluent builder hierarchy: `Builder`/`UsableBuilder` (base,
  `decorator-validation` `Model`s), `ToolBuilder`, `PromptBuilder`,
  `NamedPromptBuilder` (asset-driven prompts), `ResourceBuilder` (defined in
  `resources/` usage), `AgentBuilder`. `ToolBuilder`/`PromptBuilder` wrap the
  MCP SDK `registerTool`/`registerPrompt` calls with validation, usage-meta
  injection (`reasoning`/`effort`/`cost`), and duplicate-registration
  tolerance.
- `prompts/` — prompt registry (`Prompts` array in `prompts/index.ts`):
  `interactive-jsdoc`, the `JsDocPrompts` (NamedPromptBuilder-based, loaded
  from `assets/prompts/documentation/*.json`), the `TsCodeDesignPatterBuilder`
  prompt, plus Jira/summarization prompts.
- `tools/` — `registerTools(server)` aggregator: registers summarization,
  server-info, and Jira tools. Also `tools/decoration/` (a lightweight in-repo
  decoration builder used only by unit tests) and `tools/server-info.ts`.
- `resources/` — `Resources` array + `register-resources.ts`. Resources:
  `repo.metadata`, decoration schematics (metadata/builder/validation), golden
  overrides (model-builder/validation-errors/xray-step-template), and Jira
  ticket templates. Assets are loaded from `src/assets/resources/` (with
  obfuscated `.enc` fallbacks decrypted via `utils/obfuscation.ts`).
- `modules/` — the bulk of the domain logic, re-exported from
  `modules/index.ts` as `Agent`, `Jira`, `Summarization`, `TemplateModule`.
  - `modules/agent/` — agent orchestration. `agent.ts` (`Agent` class:
    behavior-tree + GOAP execution), `blackboard.ts` (shared key/value store),
    `runtime/` (workspace bootstrap, catalog loading, registry, commands,
    execute, model-type/provider resolution, agent-mode registration), and a
    set of standalone stdin-driven behavior-tree agent processes
    (`architect/`, `build/`, `main/`, `oversight/`, `summarization/`,
    `task/`, `testing/`).
  - `modules/jira/` — Jira client (`makeJiraClient` via `jira.js`
    `Version3Client`), `XrayClient` (GraphQL), Markdown↔ADF pipeline
    (`adf/`, `markdown/`), schemas, ~25 tool modules under `tools/`, prompts,
    env/error/rate-limit helpers, and `register-utils.ts` which registers all
    Jira tools centrally.
  - `modules/summarization/` — `file-summarizer` tool + prompt that shells out
    to a provider CLI (`runProviderPrompt`).
  - `modules/template-module/` — empty placeholder exporting empty
    `Tools`/`Resources`/`Prompts` arrays.
- `utils/` — environment (`LoggedEnvironment` accumulation), asset
  path resolution, asset reader (`@injectable`), obfuscation, repo-init,
  project-root, stdio error logger, icons, banner, module-loader.
- `constants.ts` — `ReasoningLevel`/`EffortLevel`/`Cost` enums + `SystemPrompt`.
- `environment.ts` → re-exports `Environment`/`DefaultMcpEnvironment`
  (`utils/environment.ts`), which holds server identity, icons, Jira/Xray
  config, and initializes `Logging`.

#### 5. Public API surface (barrel `src/index.ts` → `mcp-server.ts`)
The barrel re-exports only `./mcp-server`. The meaningful public symbols:
- **`McpServer`** (`mcp-server.ts`) — main class; `boot(transportType, options)`
  is the entry point. `McpServerRuntimeOptions` (agentMode, workspacePath,
  agentProvider, modelType, executeSpec, entryFile).
- **`Environment` / `DefaultMcpEnvironment`** (`environment.ts`) —
  `LoggedEnvironment`-accumulated config (name, title, version, jira, xray,
  icons, …).
- **Builders** (via `builders/index.ts`, not from the top barrel): `Builder`,
  `UsableBuilder`, `ToolBuilder`, `PromptBuilder`, `NamedPromptBuilder`,
  `AgentBuilder`. Each provides a static `builder` factory and fluent setters.
- **`Prompts`** (`prompts/index.ts`) — ordered array of prompt builders loaded
  at boot.
- **`Resources`** (`resources/index.ts`) — ordered array of resource builders.
- **`registerTools` / `registerResources`** — central registrars used by
  `McpServer.load()`.
- **Agent module** (`modules/agent/index.ts`): `Agent`, `Blackboard`,
  `AgentRuntime` (alias of `Agent`), `AGENT_OPERATION_TO_NAME`,
  `createAgentRuntime`, `listAgentDefinitions`, `runAgent`, `runAgentCommand`,
  `runAgentExecution`, `resolveAgentModelType`, `registerAgentModeAssets`,
  `emitProgressNotification`, plus the standalone agent entrypoints
  (`runMainAgent`, etc.).
- **Jira module** (`modules/jira/index.ts`): `makeJiraClient`,
  `normalizeJiraError`, `registerJiraTools`, the Jira prompt builders, and
  named tool exports (`JiraIssueCreate`, `JiraIssueRead`, …).
- **Summarization module**: `registerSummarizationTools`, `summarizeFile`,
  `FileSummarizerInputSchema`, `FileSummarizerPrompt`.
- **CLI** (`cli-module.ts`): default export `decafMcp()` returning the
  Commander tree; `runStandardServer`, `runAgentServer`,
  `executeAgentOperation` are exported helpers.

#### 6. Key patterns & concepts
- **Builder + Model validation.** `Builder` extends `decorator-validation`'s
  `Model`; required fields (`name`, `title`, `description`) are enforced with
  `@required()`. `ToolBuilder.build()` runs `hasErrors()` and throws on
  validation failure before calling `server.registerTool`. Schemas must be
  canonical `ZodObject`s; `modules/jira/schema-utils.ts` (`ensureZodObject`/
  `extractShape`) unwraps `ZodOptional`/`ZodEffects`/`ZodDefault` and extracts
  the raw shape expected by the MCP SDK.
- **Usage meta.** `UsableBuilder` carries `reasoning`/`effort`/`cost`
  (`constants.ts` enums) serialized into `_meta.usage` on every tool/prompt
  invocation.
- **Centralized registration.** A deliberate migration away from per-module
  `registerAll()` (see the fully-commented `modules/jira/register.ts` and the
  large commented block in `McpServer.load()`) toward centralized
  `registerTools`/`registerResources`/`registerAgentModeAssets` called from
  `McpServer.load()`.
- **Asset system.** Prompts/resources are authored as JSON/Markdown in
  `src/assets/` and, for public builds, obfuscated into `.enc` files
  (`obfuscate-prompts.cjs`) decrypted at read time with `ENCRYPTION_KEY`.
  `AssetReader` (`@injectable`) is injected into `PromptBuilder`.
  `NamedPromptBuilder` loads a named prompt plus optional `prefix`/`suffix`
  prompt fragments from a category dir, then `sf(...)`-substitutes
  placeholders.
- **Agent runtime.** `Agent` accepts an `AgentBehaviorDefinition` (a behavior
  tree string + GOAP state/goal/actions + action list) and a set of behaviour
  handlers. `run()` dispatches to `runWorkflow()` (mistreevous
  `BehaviourTree`, stepped with a 50-iteration safety bound) or `runGoap()`
  (`goap-solver` `planner` producing an action sequence). A `Blackboard` carries
  state between actions; progress is reported via an `onProgress` hook.
  `AgentBuilder` constructs and registers an `Agent` in a process-wide
  `registry` (`runtime/registry.ts`) keyed by `workspaceRoot::agentName`.
- **Agent-mode MCP assets.** `registerAgentModeAssets` reads a catalog
  (`assets/resources/agent/catalog.json`, copied into the repo workspace under
  `workdocs/ai/project/agent/`), then registers a `resource://agent.catalog`,
  per-agent `resource://agent.behavior.<name>` and `resource://agent.prompt.<name>`
  resources, an `agent-<name>` prompt, and `agent.do`/`agent.notify` plus
  per-operation `agent.<operation>` tools that dispatch through
  `runAgentCommand`.
- **Provider abstraction.** `runtime/provider.ts` resolves a CLI command per
  provider (`codex` → `codex -s workspace-write exec`, `claude`, `copilot`) and
  `runProviderPrompt` spawns it, piping the prompt to stdin and returning
  `{exitCode, stdout, stderr, command}`.
- **Duplicate-registration tolerance.** Both `ToolBuilder.build()` and the
  agent-mode `register*` helpers swallow errors whose message includes
  `"already registered"`, returning lightweight placeholders.

#### 7. Lifecycle / configuration / environment
- **Boot.** `McpServer.boot(transportType, options)`:
  1. If stdio, swaps the `Logging` factory to a stderr-only logger so stdout
     stays protocol-clean.
  2. Builds `Implementation`/`ServerOptions` (instructions = agent system
     prompt when `agentMode`, else the static `SystemPrompt`).
  3. Constructs the SDK `MCP` client, stores it in the `WeakMap`.
  4. Resolves the transport (`StdioServerTransport` or
     `StreamableHTTPServerTransport`, or validates a passed-in `Transport`
     duck-type).
  5. `load()` → registers prompts (iterating `Prompts`), `registerTools`,
     `registerResources`, and (if `agentMode`) `registerAgentModeAssets`.
  6. `client.connect(transport)`; optional `MCP_DEBUG_TOOLS=1` lists tools.
  `MCP_DEBUG_BOOT=1` appends a boot trace to `/tmp/mcp-boot.log`.
- **CLI.** `decaf-mcp start [--transport] [--path] [--entryFile] [--agent]
  [--agent-provider] [--model-type] [--goap] [--execute]`; `decaf-mcp agent
  <subcommand>`; `decaf-mcp md-to-ast` (stdin Markdown → ADF JSON); `decaf-mcp
  repo:init [targetPath] [--orchestration] [--skills] [--agent ...]`.
- **Environment / env vars** (`utils/environment.ts`):
  - Server identity is fixed (`mcpId: "decaf"`, name/title from defaults,
    `version` from `version.ts`).
  - Jira: `JIRA__HOST`, `JIRA__EMAIL`, `JIRA__API_KEY` (alias `JIRA__APIKEY`),
    `JIRA__PROJECT_KEY`, `JIRA__ISSUE_TYPE`, `JIRA__PARENT_ISSUE`,
    `JIRA__TIMEOUT`, `JIRA__RATE_LIMIT_RETRY_DELAY_MS`. `JIRA_ENABLED=true`
    gates agent→Jira comment sync.
  - Xray: `XRAY__HOST`/`XRAY__API_HOST`, `XRAY__API_USER`, `XRAY__API_SECRET`.
  - Agent: `AGENT_PROVIDER` (default `codex`), `AGENT_MODEL_TYPE` (default
    `prompt`; valid `prompt`/`goap`/`workflow`), `AGENT_WORKSPACE_PATH`
    (default `workdocs/ai`), `AGENT_ENTRY_FILE` (default `./AGENTS.md`).
  - Assets: `DECAF_ASSET_DIR` / `MCP_ASSET_DIR` / `ASSET_DIR`.
  - `ENCRYPTION_KEY` for `.enc` asset decryption; `DANGEROUSLY_OMIT_AUTH` for
    the inspector scripts.
- **Flavours.** No persistence/adapter flavours. `tools/decoration/builder.ts`
  exposes a `DefaultFlavour`-based flavour resolver used only in unit tests.
- **Defaults.** Log level `error`; Jira timeout 1000ms; rate-limit retry delay
  3000ms; Xray host `https://xray.cloud.getxray.app`; `file-summarizer` default
  target `README.md`; workflow safety bound 50 iterations; GOAP confidence 90
  on success / 35 when blocked.

#### 8. Data & control flow
Typical tool call (e.g. `jira-issue-list`):
1. CLI `start` → `runStandardServer` → `new McpServer().boot("stdio", …)`.
2. `load()` calls `registerTools(server)` which calls
   `registerJiraTools(server)`; `makeJiraClient()` is attempted and, on
   `MissingJiraEnvironmentError`, tools still register but their callback
   throws the env error when invoked.
3. For each Jira tool definition `{ name, inputSchema (ZodObject), runTool }`,
   `server.registerTool(name, { title, description, inputSchema, annotations },
   async (args) => tool.runTool(jiraClient, args))` is called.
4. MCP client invokes the callback; the tool parses args with its Zod schema,
   calls the `jira.js` v3 API (e.g. `issueSearch.searchForIssuesUsingJqlEnhancedSearchPost`),
   and returns a `CallToolResult` via `toCallToolResult`.

Agent `execute` operation:
1. `runAgentCommand({ operation: "execute", … })` → `runAgentExecution` which
   creates a `git worktree`, ensures the agent workspace inside it, loads the
   catalog, and iterates `["manager","orchestrator","architect","implementation","reviewer","documentation"]`.
2. For each agent: in `prompt` model it builds a stage prompt and shells out
   via `runProviderPrompt`; in `goap`/`workflow` model it builds an `Agent`
   runtime and calls `agent.run()` (behavior-tree or GOAP). Blocker detection
   scans stdout/stderr for `clarification`/`blocker`/`needs input`.
3. Progress is appended to the SPEC/TASK markdown files and optionally
   synced to Jira as a comment; the worktree is cleaned up in a `finally`.

#### 9. Testing
- **Layout.** `tests/unit/` (Jest, `jest.config.cjs`) and `tests/integration/`
  (spawns the built `dist/mcp-server.cjs` over stdio via
  `@modelcontextprotocol/sdk` client — `_serverHelper.ts` runs `npm run
  build:dist` on demand). `tests/e2e/jira/` holds an e2e Jira create test.
- **Coverage.**
  - Agent runtime: unit tests for `commands` (workflow/goap skip provider),
    `agents`, `agent-builder`, `register`, `workspace`, `model-type`,
    `provider`, `commands.prompt`, `main`.
  - Jira: per-tool unit tests (`assign`, `attach`, `comment.*`, `issue.*`,
    `link.*`, `worklog.add`, `ticket.*`, `markdown-to-adf`,
    `ticket-template-prompt`) plus many integration tests against a real Jira
    instance (issue create/list/update, links, transitions, Xray steps,
    description sync).
  - Auto-generated smoke tests (`tests/unit/auto-generated/`) verify builders,
    prompts, modules/resources, and core smoke import. `central-registration`
    integration test asserts `registerTools` + `Prompts.build` call the SDK.
  - Dist-asset test (`mcp-dist-assets.test.ts`) verifies obfuscated `.enc`
    assets decrypt correctly when `RUN_DIST_TEST=1`.
- **Notable gaps.**
  - `ts-morph`-based AST/JSDoc tooling tests (`ast-jsdoc-tools/apply.test.ts`,
    `repoRunner.test.ts`, `generator-multi.test.ts`) are all `test.skip` /
    `describe.skip`, and no `ast-jsdoc.generate` tool exists in `src/`.
  - The standalone stdin agents (`architect`, `build`, `oversight`,
    `summarization`, `task`, `testing`) have no dedicated tests.
  - HTTP transport path (`StreamableHTTPServerTransport`) is implemented in
    `boot` but unreachable from the CLI and untested.
  - `prompts/code/design-patterns/builder.ts` and most `prompts/jsdocs/*.ts`
    stubs are not exercised beyond import smoke tests.

#### 10. Usage example
Minimal boot (derived from `tests/integration/central-registration.test.ts` and
`_serverHelper.ts`):
```ts
import { McpServer } from "@decaf-ts/mcp-server";

const server = new McpServer();
await server.boot("stdio", { workspacePath: "workdocs/ai" });
// ... MCP client connects over stdio; tools/prompts/resources are registered.
```
Programmatic tool dispatch in agent mode (derived from
`tests/unit/agent/runtime/commands.test.ts`):
```ts
import { runAgentCommand } from "@decaf-ts/mcp-server/modules/agent/runtime/commands";

const result = await runAgentCommand({
  operation: "plan",
  provider: "codex",
  modelType: "workflow",      // skips provider shell-out; runs behavior tree
  workspacePath: workspaceRoot,
  entryFile: "./AGENTS.md",
});
// result.blocked === false, result.modelType === "workflow"
```

#### 11. Relationships
- Consumes the decaf-ts foundation: `logging` (logger factory, `LoggedClass`,
  `LoggedEnvironment`), `decorator-validation` (`Model`, `@required`,
  `@list`, `@minlength`, `hasErrors`), `decoration` (`Metadata`,
  `prop`), `injectable-decorators` (`@inject`, `@injectable`), `db-decorators`
  (`InternalError`, `ValidationError`, `SerializationError`), `cli`
  (`build-scripts` tooling), `core` (pulled in transitively).
- Bridges decaf-ts to the **MCP** ecosystem (`@modelcontextprotocol/sdk`) and
  to external AI provider CLIs (`codex`/`claude`/`copilot`).
- Integrates with **Jira/Xray** via `jira.js` and a custom GraphQL Xray
  client, and can sync agent progress back to Jira issues.
- Repository initialization (`repo:init`) scaffolds a decaf-ts agent workspace
  (AGENTS.md, commands, prompts, behaviors, catalog) into target repos.

#### 12. Consumer notes
- **Dual distribution.** The package ships both a bundled CLI
  (`dist/mcp-server.cjs`, built via `build:dist` with
  `@modelcontextprotocol/sdk` externalized) and a library build (`lib/esm`,
  `lib/cjs` referenced by `exports`). The public/obfuscated build
  (`build:public`) re-encrypts assets in `lib/` and `dist/`.
- **Assets are mandatory.** Boot resolves an assets dir (`resolveAssetsDir`).
  Without `src/assets` (or a `DECAF_ASSET_DIR` override) the server cannot
  load named prompts or resources. `.enc` decryption requires `ENCRYPTION_KEY`.
- **Jira is opt-in per call.** Tools register even without credentials; each
  invocation throws `MissingJiraEnvironmentError` with a descriptive env
  summary until `JIRA__HOST`/`JIRA__EMAIL`/`JIRA__API_KEY` are set.
- **Agent workspace is repo-copied.** `ensureAgentWorkspace` copies the bundled
  agent prompts/behaviors/catalog into `workdocs/ai/project/agent/` on first
  run (preserving existing files unless `preserveExisting` is false). The
  catalog (`catalog.json`) drives which agents exist.
- **Model type semantics.** `prompt` shells out to a provider CLI (requires
  the CLI on PATH); `goap` runs the GOAP planner against the behavior
  definition; `workflow` runs the mistreevous behavior tree in-process. Only
  `prompt` actually drives an external LLM.
- **Maturity / versioning.** v1.15.2 with active migration residue (large
  commented-out `registerAll` blocks, `toMigrate/` directory holding older
  agent JSON/MD, stub `jsdocs/*.ts` and `template-module`). The README and
  `workdocs/` are inherited from the `ts-workspace` template and do not
  describe this package (see inaccuracies).

#### 13. Inaccuracies found
1. **[mcp-server]** README — The README is the generic `ts-workspace` template,
   not a description of the MCP server. It opens "This repository is meant to
   provide an enterprise template for any standard Typescript project" and all
   badges/links point at `decaf-ts/ts-workspace`. | Evidence: `README.md:2-14`,
   `README.md:30-34`; vs `package.json:2-3` ("mcp server for code assistance")
   and `package.json:78` (`git+https://github.com/decaf-ts/mcp-server.git`).
   | Suggested fix: Author an mcp-server-specific README describing the MCP
   server, CLI, tools/prompts/resources, agent mode, and env vars.
2. **[mcp-server]** `package.json` keywords — keywords are
   `["template","typescript","ts"]`, inherited from the template and
   inappropriate for an MCP server package. | Evidence: `package.json:88-92`.
   | Suggested fix: Replace with MCP-relevant keywords (e.g. `mcp`,
   `model-context-protocol`, `decaf-ts`, `jira`, `agent`).
3. **[mcp-server]** `package.json` `files` vs `exports` — `exports`/`main`/
   `module`/`types` resolve to `./lib/esm/index.js`, `./lib/cjs/index.cjs`,
   and `./lib/types/index.d.mts`, but the `files` allowlist only ships `dist`
   and `workdocs/assets/slogans.json`; `lib/` is not published. Library
   consumers installing from the registry would get missing-file errors for the
   `import`/`require` conditions. | Evidence: `package.json:8-23` vs
   `package.json:84-87`. | Suggested fix: Add `lib` (and the `bin` script's
   shebang target) to `files`, or drop the `lib`-based `exports` if only the
   bundled CLI is supported.
4. **[mcp-server]** Unused dependency `ts-morph` — `ts-morph` (`^27.0.2`) is
   declared in `dependencies` but is never imported anywhere in `src/` (a grep
   for `ts-morph`/`from 'ts-morph'` returns no source hits). The expected
   AST/JSDoc tooling is absent; the corresponding integration tests are all
   `test.skip`/`describe.skip` and reference a non-existent `ast-jsdoc.generate`
   tool. | Evidence: `package.json:124`; `tests/integration/ast-jsdoc-tools/apply.test.ts:14`
   (`test.skip(...)`), `repoRunner.test.ts:12` (`describe.skip(...)`); no
   `src/**` import of `ts-morph`. | Suggested fix: Remove `ts-morph` from
   `dependencies` until the AST/JSDoc feature is implemented, or implement and
   un-skip the tests.
5. **[mcp-server]** `main.ts` uses `require.main` in an ESM package —
   `package.json` declares `"type": "module"`, but
   `src/modules/agent/main/main.ts:20` does `if (require.main === module)`.
   `require` is not defined in ESM, so importing this module under ESM would
   throw `ReferenceError: require is not defined`. | Evidence:
   `package.json:4` (`"type": "module"`) vs `main.ts:20-22`. | Suggested fix:
   Use an ESM guard (`import.meta.url === pathToFileURL(process.argv[1]).href`)
   or remove the self-invocation block.
6. **[mcp-server]** CLI cannot select HTTP transport — `start --transport`
   defaults to `"stdio"` and `runStandardServer` throws "Unsupported transport
   mode" for any other value, even though `McpServer.boot` implements the
   `StreamableHTTPServerTransport` path for `"http"`. | Evidence:
   `cli-module.ts:84-90` (switch only handles `"stdio"`, else throws) vs
   `mcp-server.ts:287-299` (http branch). | Suggested fix: Wire the CLI
   `--transport http` option through to `boot("http", …)` (with host/port
   options) or document that only stdio is supported.
7. **[mcp-server]** `registerJiraTools` passes full `ZodObject` instead of raw
   shape — Every other registrar extracts `.shape` before calling
   `server.registerTool` (`ToolBuilder.build` via `extractShape` at
   `tool-builder.ts:75-83`; agent-mode tools use `z.object({...}).shape` at
   `runtime/register.ts:166-172,261-265`), but `register-utils.ts:361` passes
   `inputSchema: tool.inputSchema` (the full `ZodObject`). The MCP SDK expects
   a `ZodRawShape` (`Record<string, ZodType>`); passing a `ZodObject` instance
   means the SDK sees no per-key entries, so tool argument schemas would not be
   advertised to clients. | Evidence: `modules/jira/register-utils.ts:356-363`
   vs `builders/tool-builder.ts:75-83` and `modules/agent/runtime/register.ts:166-172`.
   | Suggested fix: Pass `tool.inputSchema.shape` (or run it through
   `extractShape`) consistent with the rest of the codebase.
8. **[mcp-server]** Dead/commented Jira tool modules —
   `modules/jira/tools/search-jql.ts`, `project-list.ts`, and
   `agile-board-list.ts` are entirely commented out and reference non-existent
   source paths (`../../../tools/search/jql-tool`, `../../../tools/project/list-tool`,
   `../../../tools/agile/board-list-tool` that do not exist in `src/tools/`).
   They are misleading leftovers. | Evidence: the three files are 100%
   commented; `src/tools/` contains only `decoration/`, `index.ts`,
   `server-info.ts`. | Suggested fix: Delete these stub files or implement them
   against the existing `issue-list` (JQL) tooling.
9. **[mcp-server]** Dead `example-resource` and `template-module` —
   `resources/example-resource/index.ts` is fully commented out and exports
   nothing (yet `ExampleResource` is referenced nowhere). `modules/template-module/index.ts`
   exports empty `Tools`/`Resources`/`Prompts` arrays. Both are unused
   scaffolding. | Evidence: `resources/example-resource/index.ts:1-26` (all
   comments); `modules/template-module/index.ts:5-9`. | Suggested fix: Remove
   the example-resource directory and the template-module, or document them as
   explicit extension points.
10. **[mcp-server]** Stale commented code in `McpServer.load()` —
    `mcp-server.ts:135-224` contains a large commented block referencing
    `Resources`, `Tools`, `issueCreateModule`, `issuePromptModule`, and
    `__deferredMcpRegistrations` that are not imported and do not exist in the
    current code. This obscures the real `load()` flow. | Evidence:
    `mcp-server.ts:135-224`. | Suggested fix: Delete the commented block; the
    live registration already happens via `registerTools`/`registerResources`/
    `registerAgentModeAssets`.
11. **[mcp-server]** Vestigial `prompts/jsdocs/*.ts` stubs — Files like
    `prompts/jsdocs/class-prompt.ts` export trivial stubs
    (`export const ClassPrompt = { name: 'jsdocs.class', description: 'Class docs prompt' };`)
    that are **not** wired into the runtime `Prompts` array (which uses
    `NamedPromptBuilder`s in `jsdocs-prompts.ts` loaded from
    `assets/prompts/documentation/*.json`). The auto-generated smoke test still
    imports them, giving a false impression of a real subsystem. | Evidence:
    `prompts/jsdocs/class-prompt.ts:1`; `prompts/jsdocs-prompts.ts:4-15`
    (uses `NamedPromptBuilder`, not these stubs); `tests/unit/auto-generated/03_prompts.test.ts:7-14`.
    | Suggested fix: Remove the `prompts/jsdocs/*.ts` stubs (or replace them
    with the real named-prompt wiring if they are intended to be the source of
    truth).
12. **[mcp-server]** `mcp-server.ts` reassigns a union-typed parameter to an
    object — `boot(transportType: "stdio" | "http" | Transport, …)` reassigns
    `transportType` to `new StdioServerTransport()` /
    `new StreamableHTTPServerTransport(...)` inside the switch, then later logs
    `transportType.constructor.name`. While it works at runtime, mutating a
    parameter declared as a string union is misleading and defeats the type
    signature. | Evidence: `mcp-server.ts:228` (param type) vs
    `mcp-server.ts:285,288` (reassignment) and `mcp-server.ts:345`
    (`.constructor.name`). | Suggested fix: Use a local `let transport:
    Transport` variable for the resolved transport and keep `transportType` for
    branch selection.
13. **[mcp-server]** `Prompts` array casts hide builder typing —
    `prompts/index.ts:13-14` casts `FileSummarizerPrompt` and
    `InteractiveJsDocPrompt` `as unknown as PromptBuilder`, but both are
    already `PromptBuilder` instances built via `PromptBuilder.builder`. The
    cast suggests a structural mismatch and weakens type safety. | Evidence:
    `prompts/index.ts:13-14`; `prompts/interactive-jsdoc.ts:9-34`;
    `modules/summarization/prompts/file-summarizer-prompt.ts`. | Suggested fix:
    Drop the `as unknown as PromptBuilder` casts (align the prompt builder
    types instead).
14. **[mcp-server]** `agent-cache/` contains committed build artifacts — the
    repo root `agent-cache/` directory holds leftover `dist-inspector-pdm-*`
    directories (e.g. `dist-inspector-pdm-01501-JLnZHu`), which are runtime
    scratch output from integration-test helper runs, not source. | Evidence:
    `agent-cache/` listing (`dist-inspector-pdm-01501-*` entries). | Suggested
    fix: Add `agent-cache/` to `.gitignore` and remove the committed
    directories.

**Total inaccuracies found: 14.**
