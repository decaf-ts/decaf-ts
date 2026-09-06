# with-ai Agent Governance Remediation Audit

Date: 2026-09-06

Scope: source audit of `with-ai`, including all 64 checked-in agent bundles
(46 core and 18 department bundles), shared skills, harness manifests, MCP
gateway configuration, and the non-UI `decaf-ts` testing convention. This is
an audit and remediation design. It makes no agent, skill, configuration, or
runtime changes.

## Executive Verdict

The reported failures share one architectural cause: user intent is prose in
an issue, not a typed capability boundary inherited by child work. The current
instructions have useful role boundaries, but the enforced default is still
"start actionable work". This permits work that is outside the requested
mutability, allows managing agents to act without an evidence-backed local
context pack, and leaves lifecycle responsibilities without an owner or
machine-checkable completion condition.

The repair should be made in this order:

1. Make work mode, allowed mutations, implementation owner, and cleanup owner
   native issue metadata that is inherited by all children.
2. Enforce those fields in Paperclip tool authorization and preflight, not
   merely in prompts.
3. Update the shared policy skills and the affected bundles.
4. Make the repository validator check the semantic contracts and full
   Paperclip template provenance.
5. Add integration tests against a live Paperclip instance before rollout.

Do not solve these problems by adding a separate coordinator, background
tracker, scratch state file, or untracked subagent. Paperclip parentage,
blockers, assignee, issue documents, execution policy, comments, and native
tool grants are the normal control plane. A crash-only cleanup reconciler is
the one justified exception: Paperclip cannot itself delete an external Docker
container after its owning run has died.

## Evidence And Validation Boundary

### Source checks completed

- `node with-ai/docker/scripts/validate-agent-bundles.mjs` passed: 46 core
  bundles, 18 department bundles, three harness manifests, and department
  fragments.
- All four local bundle files were present for every checked-in bundle:
  `AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, and `TOOLS.md`.
- The pinned upstream Paperclip `paperclip-create-agent` skill at
  `19be4cf9278b70bc151063778a94bf38bfd5c903` and its template index,
  baseline-role guide, draft checklist, API reference, and relevant Coder,
  QA, and SecurityEngineer templates were reviewed.

### What this does not prove

The upstream Paperclip hiring workflow also requires live identity, adapter
configuration, existing agent-config comparison, icon validation, desired
skill/runtime verification, and board-approved hire records. No live
Paperclip credentials or instance were available in this audit. The checked-in
bundles therefore pass structural source validation, not a claim of complete
live-instance conformance. Before a rollout, run the live validation described
in "Rollout and Acceptance" below and reconcile the live instruction files,
desired skills, tool grants, reporting lines, and adapter configuration.

## Findings

### G1 - Unbounded actionable-work default

Severity: critical

The company-wide contract says to start actionable work unless the request is
explicitly planning. It does not distinguish analysis-only, report-only,
review-only, delegation-only, or implementation work. The bundle validator
requires this exact language in every AGENTS file, making the defect systemic.

Effects:

- "No code changes" can still create reports, domain records, child
  implementation work, or other mutations.
- A manager can classify a report as governance/review and act directly.
- The read budget in `common/run-discipline` pressures a run toward a
  write-class action after 25 reads.

Required change:

- Introduce native issue fields `workMode` and `allowedMutationScopes`.
- A parent issue supplies the mode; every child inherits a subset only. Any
  broadening fails preflight and requires a user/board approval record.
- Replace the unconditional contract with a mode-aware contract. Retain the
  Paperclip execution contract for `implementation`, but do not apply its
  action imperative to read-only modes.
- Update the validator so it requires the mode gate and rejects the old
  unconditional phrase except where it is explicitly scoped to
  `implementation`.

Required modes:

| Mode | Allowed work | Prohibited work |
| --- | --- | --- |
| `analysis_only` | Reads; named safe checks; one final Paperclip comment/status disposition | Repository, issue-document, Jira, GitHub, email, calendar, Teams, or child implementation mutations |
| `report_artifact_only` | `analysis_only` plus exactly the declared report destination | Any other file, document, external-system, or child mutation |
| `delegation_only` | Native Paperclip child creation/assignment and a handoff comment | Checkout of a project workspace, substantive analysis/report authoring, repository or external writes |
| `review_only` | Reads, review finding comment/document, request-changes or approval disposition | Implementation, test authoring, broad documentation changes, external writes |
| `implementation` | Only the declared workspace/file surface and approved test infrastructure | Undeclared files, external actions, and scope expansion |
| `external_action` | One approved normalized mutation through its dedicated writer | Reads beyond the approved payload discovery and all other mutations |

For a request such as SAA-768, "report only; no code changes" must normalize
to `report_artifact_only` with an explicit destination. If no destination is
given, normalize to `analysis_only`: return the report in the assigned issue
comment and make no workspace or delivery-document change.

### G2 - CEO delegation is not a specialist-first invariant

Severity: critical

The CEO routes project work well, but retains a broad direct-remit exception
and is instructed to checkout and work on any ticket surviving triage. The
CEO persona also says "Default to action." This allows solo analysis,
governance, and reporting where the requested operating model is delegation
plus final acceptance review.

Required change:

- Replace the CEO direct-remit exception with `delegation_only` for all
  substantive tasks.
- CEO may only classify, create the manager/specialist child, preserve the
  exact work mode and constraints, unblock/escalate, and perform the final
  acceptance review.
- CEO must create the assigned child before checkout. A final review requires
  the child handoff plus a separate CEO `review_only` wake; it is not a
  license to redo the work.
- Add a validator rule that CEO `AGENTS.md`, `HEARTBEAT.md`, and `SOUL.md`
  contain no direct substantive-work path.

### G3 - Managing-agent domain knowledge is optional rather than auditable

Severity: high

The CTO has several Decaf skills, and QA/Security have focused subsets, but
none is required to assemble the repository context before planning,
delegating, or reviewing. The CTO heartbeat requires the canonical plan, but
not the project constitution, mapped record, relevant architecture evidence,
or a selected set of local skills. CEO has no repository-domain skills.

Immediate change: add `common/resolve-domain-context`.

It must create a compact, revision-pinned Context Manifest in a native
Paperclip issue document before a manager creates an execution child or
approves/rejects it. The manifest contains:

- project and workspace identity;
- project `AGENTS.md` and its revision/hash;
- mapped specification/domain record and canonical plan;
- relevant architecture/design records and prior decisions;
- changed surface or requested target paths;
- selected local Decaf skills, each with a reason and revision/hash;
- acceptance criteria, test commands, known risks, and prior evidence;
- for review, executor/QA/security findings and the exact diff revision.

Selection must be path/category based from a small machine-readable skill
index, not prompt-wide loading of every Decaf skill. The manager passes the
manifest ID to each child. A reviewer must use the same manifest plus the
actual changed surface; it may add a narrowly justified skill but may not
silently substitute generic knowledge for local rules.

#### Deferred high-end implementation - revisioned repository knowledge graph

Status: deferred by product decision. The immediate Context Manifest gate is
the required safety control until this is delivered; it must not be relaxed in
anticipation of the graph.

Implement this as a first-class Paperclip extension backed by Paperclip's
existing PostgreSQL database, not as an independently managed graph service.
This keeps project ACLs, issue links, revision history, and lifecycle in the
native control plane. The extension owns these tables, all partitioned by
`companyId`, `projectId`, `repositoryId`, and immutable Git revision:

- `domain_graph_nodes`: repository file, package/module, TypeScript symbol,
  test, documentation section, requirement, decision, skill, and generated
  artifact nodes;
- `domain_graph_edges`: typed, directional, revision-pinned relations such as
  `IMPORTS`, `EXPORTS`, `DECLARES`, `TESTS`, `DOCUMENTS`, `IMPLEMENTS`,
  `GOVERNS`, `DEPENDS_ON`, and `SUPERSEDES`;
- `domain_graph_snapshots`: commit/tree identity, source/indexer version,
  source hashes, completeness state, and timestamps; and
- `domain_context_manifests`: a query's selected nodes/edges, source
  revision, query parameters, graph/indexer version, and the resulting
  citations. This is the existing Context Manifest made reproducible.

Use PostgreSQL recursive CTEs for bounded graph traversal and its full-text
search index for lexical recall. Project only the selected subgraph into
`graphology` for centrality, shortest-path, connected-component, and impact
algorithms. This deliberately avoids adding a second persistent graph
database or a separate service. A graph database is not justified until
measured traversal latency or cross-repository scale exceeds the PostgreSQL
budget; only then evaluate an embedded store such as Kuzu behind the same
Paperclip extension interface, never as an agent-visible side channel.

The indexer is an idempotent Paperclip job, not an agent heartbeat:

1. On repository registration, merge, or an issue query against a new Git
   revision, compute the tree diff and enqueue a repository-scoped index job.
2. Hash every eligible source/document; reuse unchanged nodes and edges;
   delete only relations owned by changed files. Exclude secrets, generated
   outputs, dependencies, binary files, and private runtime state by default.
3. Parse TypeScript through `ts-morph`/the TypeScript compiler for resolved
   imports, exports, declarations, references, package boundaries, and test
   imports. Run `dependency-cruiser` in CI as an independent module-graph
   and architectural-boundary check, importing its JSON result as corroborating
   `IMPORTS`/`DEPENDS_ON` evidence rather than trusting a single parser.
4. Parse Markdown with `unified`, `remark-parse`, `remark-gfm`,
   `remark-frontmatter`, and `unist-util-visit`. Index documents at heading
   granularity, resolve relative links and explicit source links, extract
   frontmatter, and create `DOCUMENTS`/`GOVERNS` edges only when a target is
   resolved. Do not fabricate semantic links from prose.
5. Infer `TESTS` edges only from deterministic evidence: imported symbols,
   co-located naming conventions, declared test targets, or an explicit
   frontmatter link. Mark inferred edges with confidence and evidence rather
   than presenting them as facts.
6. Mark the snapshot complete only after source, documentation, and test
   passes finish. A query against a stale/incomplete snapshot reports that
   fact and falls back to the immediate Context Manifest procedure.

Expose only native Paperclip/MCP read tools, with project authorization and
bounded results:

- `domain_graph.search`: lexical + structural lookup returning citations;
- `domain_graph.context`: target file/symbol/requirement plus depth, returning
  the smallest connected evidence subgraph;
- `domain_graph.impact`: changed paths/symbols to affected modules, tests,
  docs, decisions, and open issues;
- `domain_graph.trace`: requirement or acceptance criterion to implementation,
  tests, and evidence; and
- `domain_graph.verify_manifest`: rejects a manager's plan/review if its
  Context Manifest is missing, stale, cross-project unauthorized, or not
  derived from the requested surface.

Managers invoke `context` before planning and `impact` plus `trace` before
review. The returned immutable manifest ID is required on every execution
child and review disposition. The tools return path/symbol/heading citations,
revision, edge confidence, and omitted-result counts; they do not dump a
repository into the prompt. Cache results by query plus snapshot ID, cap
traversal depth and node count, and store short generated summaries only with
their cited node IDs so that summaries are invalidated with the snapshot.

Library decisions:

- `ts-morph` is the TypeScript semantic extraction adapter, not the graph
  store. It wraps the TypeScript compiler and resolves source-file
  dependencies and symbols.
- `dependency-cruiser` is the independent module graph and architecture-rule
  validator. Its JSON/graph output is imported as evidence and its rules keep
  the graph from silently normalizing forbidden dependencies.
- `unified`/`remark` plus `mdast` are the Markdown AST adapter; they preserve
  headings, links, GFM, and frontmatter as addressable documentation nodes.
- `graphology` is the in-process projection/algorithm library; PostgreSQL is
  the durable, access-controlled source of truth.
- Kuzu is a contingency only: it is embedded and supports persistent typed
  property graphs, but introduces a second durable store and recovery path.
  Do not adopt it in phase one.

Implementation phases and gates:

1. Schema, repository registration, TypeScript/Markdown indexers, snapshot
   contract, and fixture repository. Gate: deterministic re-index of an
   unchanged revision produces the same node/edge identity.
2. MCP search/context/impact/trace tools, ACL checks, result caps, and native
   Context Manifest persistence. Gate: every returned assertion has a
   revision-pinned citation.
3. Manager planning/review enforcement and UI provenance links. Gate: CTO/QA
   cannot delegate, approve, or reject implementation work without a current
   manifest.
4. Incremental indexing, CI boundary verification, metrics, and load tests.
   Gate: query p95 and index freshness meet an agreed repository-size budget;
   evaluate Kuzu only if they do not.

### G4 - QA defects do not create a native repair loop

Severity: high

The upstream Paperclip QA template explicitly requires a failed inspection to
go back to the most relevant coder with actionable repro/evidence. The current
QA bundle routes test gaps to Tester and security issues to Security Engineer,
but has no mandatory workflow for a real implementation defect. Its heartbeat
allows a terminal status immediately after recording findings.

Required change:

- Add immutable `implementationOwnerAgentId` and `implementationIssueId` to
  implementation work when it is delegated. Do not infer the owner from a
  commenter.
- On a QA fail, create a Paperclip child of the implementation issue assigned
  to that owner, with `workMode: implementation`, the Context Manifest ID,
  exact reproduction, expected/actual, evidence, affected acceptance
  criteria, and required regression test.
- Add that repair child to the review gate through native `blockedByIssueIds`.
  QA marks its inspection as `request_changes`/blocked per the native review
  lifecycle; it must not approve or complete the delivery parent.
- If no responsible owner exists, route the defect to CTO as a blocked
  ownership decision. Do not silently assign Tester or leave a finding-only
  comment.
- Require QA to rereview after the repair child reports. The original defect
  evidence remains attached; the rerun evidence is a separate dated entry.
- Add a validator rule and a Paperclip integration test for this exact state
  transition.

### G5 - Test infrastructure has no cleanup ownership or terminal gate

Severity: high

The repository deliberately exposes scoped Docker/Kubernetes test-infra
capability, but there is no shared agent contract requiring the creator to
destroy resources at the end of a task, report the result, or recover from an
abnormal run. This leaves containers, networks, namespaces, and ports alive.

Required change: add `common/test-infra-lifecycle` and attach it to Tester,
QA Specialist, DevOps Engineer, and every executor allowed to start test
infrastructure.

Its contract must be:

1. Before creation, record a native issue document named `test-infra` with
   owner issue/run IDs, explicit resource names, expected teardown command,
   TTL, and cleanup owner.
2. Every resource receives labels/annotations for company, project, issue,
   and run. Never discover resources by broad name matching.
3. Run teardown in a `finally` path after tests, including test failure.
4. Before terminal issue disposition, list only the owned labels and prove
   none remain. A failed teardown blocks the owner issue and creates one
   native cleanup child assigned to DevOps Engineer; it does not leave an
   informal comment-only obligation.
5. A crash-only reconciler may delete only expired, label-owned resources
   whose Paperclip run is terminal/non-live. This is necessary external
   resource reconciliation, not a competing task system. It must open a
   Paperclip cleanup issue with the observed resources and outcome.

Do not use `docker compose down` without a unique project name/labels: it can
tear down another task's environment. The default must be scoped teardown of
resources owned by the current issue.

### G6 - Non-UI test layout and naming are not enforced

Severity: high

The root template scripts scope unit and integration tests under `tests/unit`
and `tests/integration`, and the constitution says `tests/**` with
`*.test.ts`. Agent bundles and Decaf test skills do not turn that into a
non-UI mandatory layout check. Jest's default discovery still admits
`.spec.ts`, so a developer can create conflicting test trees without a
failing CI check.

Required contract for every non-UI Decaf package:

```text
<package>/tests/
  unit/**/*.test.ts
  integration/**/*.test.ts
  e2e/**/*.e2e.ts
  <variant>/**/*.test.ts or <variant>/**/*.<variant>.ts
```

- Exactly one `tests/` root per package. A sibling `test/` root is forbidden.
- No unit/integration/e2e test file lives under `src/`.
- Unit and integration files use only `.test.ts`.
- E2E files use only `.e2e.ts`.
- `.spec.ts` and unclassified test roots are forbidden for non-UI packages.
- UI projects are excluded only through an explicit project classification;
  do not infer an exception from file names.

Concrete changes:

- Add the canonical rule to the root constitution and the ts-workspace
  template source.
- Add `common/enforce-test-layout` and declare it for Tester, QA Specialist,
  Back-End Developer, Full-Stack Engineer, DevOps Engineer, and CTO review.
- Add a repository-local `scripts/validate-test-layout.mjs`, with a
  machine-readable project classifier and allowed variant list.
- Add `npm run validate:test-layout` and make `test`, `test:unit`,
  `test:integration`, `test:e2e`, and CI call it before Jest. Explicit
  `testMatch`/Jest projects must recognize the permitted suffixes only.
- Add fixtures for a valid tree, singular `test/`, duplicate roots, a
  `.spec.ts`, wrong e2e suffix, and an unclassified test.

### G7 - Personal Assistant has direct write capability in the active OpenCode runtime

Severity: critical

This is verified, not a deployment-drift theory. The deployed Personal
Assistant bundle contains the same operational policy as the repository after
the sync process intentionally removes YAML frontmatter: it says every
email/calendar/Teams mutation must be delegated to the matching writer.
`configure-tool-gateways.ts` also correctly installs only Personal
Assistant's read connections in Paperclip's native tool-gateway model.

The active OpenCode execution path does not consume those Paperclip-native
per-agent installs. The repository's own runtime documentation states that
OpenCode loads only the shared global `opencode.json`; that global manifest
contains enabled `*-write` MCP servers. Therefore every OpenCode agent,
including Personal Assistant, receives the same write-capable MCP catalog.
The native allowlist is presently advisory for OpenCode rather than an
enforcement boundary. The unused `generate-agent-mcp-config` command cannot
fix this because the adapter disables project configuration and loads the
global file only.

Required change:

- Replace the shared OpenCode MCP catalog for Paperclip agent execution with
  an adapter-supported, per-agent generated configuration sourced from
  Paperclip's native connection/profile bindings. If OpenCode cannot load a
  per-agent configuration, remove external MCP servers from that harness and
  use a Paperclip adapter/runtime that can enforce the native bindings. Do
  not retain a global write-capable fallback.
- Treat read and write credentials as a second boundary: writer-only
  credentials/processes must not be present in Personal Assistant's spawned
  environment. The current shared environment allows the global configuration
  to start writer servers.
- Add an allowlist test over every effective runtime configuration, not just
  the native gateway records: Personal Assistant may receive only designated
  read tools and Paperclip coordination. It must have no `*-write`, Jira/Xray
  writer, GitHub writer, or direct external mutation grant.
- Add a live post-sync assertion that starts a disposable Personal Assistant
  run, lists its effective tools, and fails deployment if they differ from the
  allowlist. Repeat this for every read-only or delegated-writer role.
- Add a `prepareMutationPayload` issue-document schema. It carries operation,
  target, minimum data, exact approval text, idempotency key, and source
  evidence. Personal Assistant creates the payload then delegates one native
  child to Email Writer, Calendar Writer, Teams Writer, Jira Operations
  Specialist, or Xray Writer. It never executes the operation itself.
- Keep the existing owner-Teams exception only if the explicit owner policy
  says it is allowed. It still routes through Teams Writer.

### G8 - Full Paperclip template provenance is not validated

Severity: medium

The current source validator accepts any syntactically shaped
`instructionSource`. The upstream pinned template index names
`agents/securityengineer.md` and `agents/uxdesigner.md`, but these checked-in
source labels are invalid:

- `agents/security-engineer/AGENTS.md`: `exact:security.md`
- `agents/ux-ui-designer/AGENTS.md`: `exact:ux.md`
- `agents/fable-red-team/AGENTS.md`: `adjacent:security.md`
- `agents/red-team-api-pentester/AGENTS.md`: `adjacent:security.md`
- `agents/red-team-code-auditor/AGENTS.md`: `adjacent:security.md`
- `agents/red-team-exploit-validator/AGENTS.md`: `adjacent:security.md`
- `agents/red-team-leader/AGENTS.md`: `adjacent:security.md`
- `agents/red-team-remediation-engineer/AGENTS.md`: `adjacent:security.md`
- `agents/red-team-web-pentester/AGENTS.md`: `adjacent:security.md`

Required change:

- Correct these labels to the pinned template paths:
  `securityengineer.md` and `uxdesigner.md`.
- Vendor the pinned upstream skill body and references at its exact commit, or
  fetch and lock them in a reproducible validation step. The present 18-line
  metadata pointer cannot independently validate the claimed source.
- Extend `validate-agent-bundles.mjs` to check each `instructionSource`
  against the pinned template index, require a role-adaptation rationale for
  `adjacent`, and run the upstream draft-review checklist mapping.
- Validate all four files, not merely AGENTS/HEARTBEAT/TOOLS skill references.
  `SOUL.md` can currently introduce behavior that receives no comparable
  semantic check.
- Preserve Paperclip-native conventions: reporting line, approved icon,
  `desiredSkills`, adapter/runtime configuration, no legacy promptTemplate,
  heartbeat disabled by default, source issue linkage, and approval-gated
  hires. Verify these against the live instance during rollout.

### G9 - Prompt assembly differs by runtime

Severity: medium

The Paperclip sync process publishes all four bundle files, whereas the local
MCP agent prompt composer uses AGENTS, SOUL, and TOOLS but excludes HEARTBEAT.
Safety-critical behavior can consequently differ by invocation path.

Required change:

- Define one canonical instruction assembly order and test it in both paths.
- Either include HEARTBEAT in the MCP composition or move every
  behavior-critical rule into AGENTS/shared skills. Do not duplicate rules
  without a generated source because drift is inevitable.

### G10 - Issue creation can escape the assigned task tree

Severity: critical

SAA-843 demonstrates that `parentId` is currently a convention rather than a
creation invariant. Some heartbeat files say to read back dependencies after
creation, and the CEO heartbeat says to set `parentId` and `goalId`, but the
shared issue-creation guidance does not require an inherited parent for every
agent and the source validator does not reject a bundle that can create a
free-standing issue from inside an active delivery tree.

Required change:

- Extend the native Paperclip create-issue schema/preflight with
  `creationIntent: child | approved_root | external_operation`.
- When a run has an assigned issue, default and require
  `parentId = currentIssueId`. A different parent must be an ancestor of the
  current issue and require a reason recorded in the creation call.
- `approved_root` requires an explicit board/user authorization reference and
  a `rootJustification`; agents may not use it to escape a delivery tree.
- Immediately `GET` the created issue and fail the caller's work if its
  `parentId`, `goalId`, project, work mode, Context Manifest ID, and
  specification identity differ from the requested values.
- Add a database/API guard, not just prompt language: reject a child whose
  parent is absent, belongs to another company, or violates the permitted
  project-parent relationship. The Paperclip UI and API must use the same
  guard.
- Add a tree-integrity validator that walks every non-terminal issue created
  by an agent and reports orphan roots, cross-goal children, missing inherited
  work mode, and delivery children with no specification/context reference.
- Add SAA-843 as a regression fixture: an executor attempting to create an
  unrelated root while working a child must receive a preflight rejection;
  creating the intended child must succeed and read back correctly.

The only valid exceptions are a board-authorized new company root and native
routine-run issues whose parent routine is declared in their configuration.
Neither exception may be inferred from title text or an agent's judgment.

### G11 - Multi-project work needs a native program aggregate, not a fake multi-project issue

Severity: high

An execution issue can select only one project because its workspace,
credentials, task metadata, repository constitution, and branch identity are
project-bound. Treating the UI's one-project selector as a CEO limitation
causes incorrect delegation. Conversely, allowing one execution issue to
select multiple projects would make workspace and credential authority
ambiguous.

Use the existing native `goalId` as the immediate aggregate where it supports
company-wide grouping. A multi-project request is a program with a project
forest, not one executable project issue:

```text
Paperclip goal/program: "Cross-project outcome"
  Project A delivery root -> Project A children
  Project B delivery root -> Project B children
  Project C delivery root -> Project C children
```

Each delivery root has exactly one `projectId`, its own Context Manifest and
delivery documentation, and the same `goalId`. Native `blockedByIssueIds`
expresses cross-project ordering; no duplicated parent tree, side spreadsheet,
or untracked coordinator is used. CEO owns only program decomposition and
aggregate final review, and delegates one manager-owned root per project.

Required change:

- Add `common/coordinate-multi-project-work` with a preflight that enumerates
  affected projects, identifies one project-local owner per project, identifies
  cross-project contracts/dependencies, and creates one project root per
  project with the shared `goalId`.
- Add an explicit multi-project route to CEO AGENTS/HEARTBEAT: CEO creates or
  uses the goal, never checks out an execution workspace, and delegates each
  project root before final review.
- Update the Paperclip UI with a "Create program" flow rather than changing
  an execution issue's project picker to multi-select. The flow selects many
  projects, previews the generated project roots and dependencies, then
  creates the goal and native project-scoped roots atomically.
- If `goalId` cannot provide program-level descriptions, artifacts, progress,
  and final disposition, add those capabilities to Paperclip as a first-class
  Program/Initiative resource. Do not recreate them in a markdown file or
  external tracker.
- Add a program dashboard showing all roots, blockers, project health, and
  the aggregate readiness gate. A program completes only when every root has
  a valid terminal disposition and all declared cross-project dependencies are
  resolved.
- Test UI and API parity: the same project set must generate the same roots,
  inherited constraints, and dependency graph. Partial creation must roll back
  or leave the program explicitly blocked with the failed project named.

## Concrete File-Level Change Set

The following is the minimum coherent implementation set. Agent files must be
updated only through the Paperclip agent-creation workflow, with the upstream
draft checklist re-run for each changed role.

| Target | Concrete change |
| --- | --- |
| `with-ai/skills/common/work-mode/SKILL.md` | New inherited work-mode/mutation policy and child-scope rule. |
| `with-ai/skills/common/resolve-domain-context/SKILL.md` | New Context Manifest schema, skill selection, planning and review gates. |
| `with-ai/skills/common/test-infra-lifecycle/SKILL.md` | New resource ownership, scoped teardown, proof, and crash-reconciliation contract. |
| `with-ai/skills/common/enforce-test-layout/SKILL.md` | New non-UI test-tree/naming policy and review checklist. |
| `with-ai/skills/common/coordinate-multi-project-work/SKILL.md` | New goal/program decomposition, project-root, and cross-project dependency contract. |
| `with-ai/skills/common/run-discipline/SKILL.md` | Make exploration budget mode-aware; remove any pressure to write in read-only modes. |
| `with-ai/agents/ceo/{AGENTS,HEARTBEAT,SOUL,TOOLS}.md` | Delegation-only CEO and final-review contract; context manifest before dispatch/review. |
| `with-ai/agents/cto/{AGENTS,HEARTBEAT,SOUL,TOOLS}.md` | Context-manifest gate; delegate all downstream execution; mode-aware review only. |
| `with-ai/agents/qa-specialist/{AGENTS,HEARTBEAT,SOUL,TOOLS}.md` | Mandatory defect-return state transition, original-owner routing, rerun review gate. |
| `with-ai/agents/tester/{AGENTS,HEARTBEAT,SOUL,TOOLS}.md` | Test layout policy and infrastructure lifecycle ownership. |
| `with-ai/agents/{back-end-developer,full-stack-engineer,devops-engineer}/...` | Test-layout and test-infra lifecycle declaration; retain role-specific boundaries. |
| `with-ai/agents/personal-assistant/{AGENTS,HEARTBEAT,SOUL,TOOLS}.md` | Payload-to-writer workflow including Jira/Xray routing; preserve no-direct-write rule. |
| Every agent bundle's `AGENTS.md` and `HEARTBEAT.md` | Native create-issue preflight, required inherited parentage, read-back verification, and root-exception rule. |
| `with-ai/agents/{security-engineer,ux-ui-designer,fable-red-team,red-team-*}/AGENTS.md` | Correct `instructionSource` paths and document adjacent-template adaptation. |
| `with-ai/docker/scripts/validate-agent-bundles.mjs` | Validate template provenance, all-four-file semantics, work mode, CEO/QA/PA/test-infra/test-layout contracts. |
| `with-ai/docker/scripts/sync-company.mjs` | Post-sync effective instruction/skill/tool conformance check; report rather than silently tolerate drift. |
| `with-ai/src/cli/commands/configure-tool-gateways.ts` | Formalize and test Personal Assistant's read-only allowlist and writer-only external mutation grants. |
| `with-ai/src/mcp/agents/agent-prompts.ts` | Align prompt file composition with the Paperclip four-file bundle contract. |
| Paperclip issue API/UI | Add create-time parentage guard, tree-integrity audit, and program creation flow with one root per selected project. |
| `scripts/validate-test-layout.mjs`, `package.json`, Jest config, CI | Enforce package test trees and suffixes before test execution. |

## Rollout And Acceptance

1. Open one classified governance root with `workMode: implementation` and
   no mixed functional work. Attach this audit as the source artifact.
2. Use native Paperclip children for: work-mode platform/API support; Context
   Manifest; QA return loop; test-infra lifecycle; test layout; PA gateway
   conformance; bundle provenance; runtime prompt assembly.
3. For each changed agent, execute the full pinned Paperclip hiring/update
   review: current identity, adapter configuration, existing config comparison,
   icon/reporting-line/desired-skills review, source template/adjacent
   rationale, permissions, heartbeat default, source issue link, and
   approval-gated update.
4. Dry-run bundle validation, managed-manifest generation, and sync. Then
   validate the live instance's instruction-file content, desiredSkills,
   reporting lines, adapter/runtime settings, and effective tool grants.
5. Run these required end-to-end acceptance cases:
   - Report-only task: no repository, delivery-document, external, or
     implementation-child mutation occurs.
   - CEO technical request: CEO delegates before checkout and only accepts the
     returned specialist work.
   - QA real defect: repair child is assigned to the recorded responsible
     developer, parent review remains gated, and QA reruns the inspection.
   - Failing test with Docker/Kubernetes test infrastructure: owned resources
     are torn down and proof is recorded; simulated crash is recovered only by
     the scoped labeled-resource reconciler.
   - Invalid non-UI test tree/suffix: CI fails before Jest runs.
   - Personal Assistant mutation request: a normalized payload reaches exactly
     the designated writer; direct write-tool invocation is unavailable.
   - SAA-843 regression: an agent cannot create an issue outside its assigned
     delivery tree; the server verifies parent/goal/project inheritance.
   - Multi-project request: CEO creates one native project root per selected
     project under one goal/program, all cross-project blockers are visible,
     and CEO performs aggregate review without checking out a project.
   - Template provenance: all `instructionSource` labels resolve to the
     pinned template index.
6. Deploy one harness at a time with post-sync live assertions. Roll back the
   agent-bundle/config revision if any effective grant or instruction differs
   from the approved manifest.

## Success Metrics

- Zero repository or delivery-document mutations on `analysis_only` issues.
- 100% of CEO substantive tasks have a specialist child created before CEO
  checkout.
- 100% of QA failed reviews have an owner-assigned repair child or an explicit
  CTO ownership blocker.
- Zero labeled test-infra resources survive successful terminal runs; all
  crash recoveries have a linked cleanup issue.
- Zero non-UI `test/` roots or `.spec.ts` files; test-layout validation runs in
  every package CI job.
- Zero Personal Assistant write-capability grants or direct external writes.
- Zero non-authorized child issues outside their assigned parent/goal tree.
- 100% of multi-project programs decompose to one project-scoped root per
  affected project, with no multi-workspace execution issue.
- 100% of checked-in and live agents pass source-template, desired-skill,
  runtime, and four-file instruction conformance checks.
