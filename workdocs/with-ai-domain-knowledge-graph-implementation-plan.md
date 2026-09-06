# Domain Knowledge Graph Implementation Plan

## Status

Deferred. This document is implementation-ready design, not authorization to
deploy a graph service or weaken the mandatory Context Manifest process.

## Outcome

Give a manager a small, revision-pinned evidence graph for a target module or
multi-module change. The manager uses it before delegation and again during
review. The result must answer, with citations: what owns this behavior, what
depends on it, which tests and documents cover it, which local rules apply,
and what must be revalidated after a change.

## Constraints

- Paperclip remains the system of record for identity, project authorization,
  issue lifecycle, Context Manifests, and tool access.
- The graph is repository evidence, never an autonomous decision maker. A
  manager remains accountable for selecting and explaining the evidence.
- Every node and edge is tied to a Git tree/commit and an indexer version.
  Queries must not combine evidence from different revisions silently.
- No repository-wide prompt dump. All queries use explicit limits and return
  cited paths, symbols, headings, and edge evidence.
- Index no secrets, environment files, dependencies, generated outputs,
  binary data, local state, or unapproved paths. Repository configuration
  provides the explicit allowlist.

## Native Architecture

Implement a `domain-graph` Paperclip extension in the existing control-plane
service and database. It exposes only native Paperclip/MCP tools and stores
data in the existing PostgreSQL instance. There is no agent-readable sidecar,
external vector database, or unmanaged graph service.

### Durable Model

All primary keys are opaque UUIDs. Every table includes `company_id`,
`project_id`, `repository_id`, `snapshot_id`, timestamps, and ownership fields
required by Paperclip authorization.

| Table | Purpose | Required fields |
| --- | --- | --- |
| `domain_graph_repository` | Registered repository/workspace configuration | canonical remote, workspace roots, include/exclude policy, default branch |
| `domain_graph_snapshot` | Immutable indexed Git tree | commit SHA, tree SHA, indexer version, status, source counts, error summary |
| `domain_graph_node` | Addressable evidence | kind, stable key, path, span, qualified name, content hash, attributes, visibility |
| `domain_graph_edge` | Revision-specific relationship | from node, to node, kind, confidence, evidence kind, source span, attributes |
| `domain_graph_index_file` | Incremental ownership/checkpoint | path, content hash, parser version, last indexed snapshot, node/edge counts |
| `domain_graph_manifest` | Immutable Context Manifest | issue ID, snapshot ID, query input, selected graph, citations, graph version, expiry |
| `domain_graph_job` | Idempotent index work | repository/snapshot, changed paths, state, lease, retry count, error evidence |

Node kinds are `repository`, `workspace`, `package`, `module`, `file`,
`symbol`, `test`, `document`, `document_section`, `requirement`, `decision`,
`skill`, and `artifact`. Edge kinds are `CONTAINS`, `IMPORTS`, `EXPORTS`,
`DECLARES`, `REFERENCES`, `DEPENDS_ON`, `TESTS`, `DOCUMENTS`, `GOVERNS`,
`IMPLEMENTS`, `SATISFIES`, `SUPERSEDES`, and `GENERATED_FROM`.

Store deterministic evidence for every edge: source file, byte/span range,
parser/indexer version, extraction rule, confidence, and whether the edge is
explicit or inferred. An inferred edge never satisfies a review gate by
itself.

### Indexing Pipeline

1. A repository registration, merge webhook, or query against an unseen
   commit creates an idempotent `domain_graph_job` keyed by repository and
   Git tree.
2. Resolve the workspace map and allowlisted roots. Hash eligible files.
   Unchanged file hashes reuse their nodes and edges; changed/deleted files
   replace only their owned graph records.
3. Parse TypeScript using `ts-morph` and the workspace's `tsconfig` files.
   Extract packages, source files, exported and referenced symbols, resolved
   imports, type-only dependencies, test imports, and source locations.
4. Run `dependency-cruiser` with the repository configuration in CI. Import
   its JSON module graph as corroborating evidence, and fail indexing on
   configured architectural-boundary violations rather than normalizing them.
5. Parse Markdown with `unified`, `remark-parse`, `remark-gfm`,
   `remark-frontmatter`, and `unist-util-visit`. Create one document-section
   node per heading; resolve relative Markdown links, source links,
   frontmatter targets, and explicit `@relates` declarations.
6. Parse package metadata, workspace maps, test configuration, and approved
   requirements/decision documents. Create cross-module edges only from
   resolvable references.
7. Infer a `TESTS` relation only from an import, declared target, configured
   co-location rule, or explicit document metadata. Mark it `inferred` and
   record the rule and confidence.
8. Run integrity checks: every edge endpoint is in the same snapshot,
   locations are in bounds, all project references authorize correctly, and
   no excluded path contributed data. Then mark the snapshot `complete`.

The job is cancellation-safe: writes use a snapshot transaction, and a failed
job leaves the previous complete snapshot queryable. Jobs use leases and a
bounded retry policy; repeated parser errors produce a visible blocked state,
not stale-success semantics.

### Query Layer

Use PostgreSQL full-text search for lexical candidates and bounded recursive
CTEs for traversal. Default limits: depth 3, 150 nodes, 300 edges, 32 KB of
rendered evidence. Project the selected subgraph into `graphology` only for
centrality, shortest paths, connected components, and impact ranking.

Native tools:

| Tool | Input | Output | Guard |
| --- | --- | --- | --- |
| `domain_graph.search` | project, query, kinds, snapshot | ranked cited nodes | project ACL, FTS limit |
| `domain_graph.context` | target paths/symbols, depth | smallest connected evidence graph | node/edge cap |
| `domain_graph.impact` | changed paths/symbols | affected code/tests/docs/decisions | cycle-safe bounded traversal |
| `domain_graph.trace` | requirement/criterion | implementations, tests, evidence gaps | explicit-vs-inferred labels |
| `domain_graph.verify_manifest` | issue, manifest ID, target surface | pass/fail with stale/missing evidence | exact project/revision match |

Tools return citations in this form: `repository@commit:path:startLine-endLine`,
plus node ID, edge kind, extraction rule, confidence, and a truncation count.
They never return hidden nodes or content outside the caller's project scope.

### Manager Workflow

Before creating an implementation child, CTO/QA/Security invokes `context`
for the requested surface and `trace` for acceptance criteria. The manager
selects relevant local skills and creates a Context Manifest containing:

- repository/project identity and immutable snapshot;
- target paths/symbols and selected nodes/edges;
- applicable `AGENTS.md`, domain records, decisions, skills, and test rules;
- acceptance criteria, affected tests, risks, known gaps, and omitted results;
- manager rationale for any manually added or excluded evidence.

The execution child carries the manifest ID. Before acceptance/rejection, the
manager invokes `impact` over the actual diff and `trace` over every acceptance
criterion. `verify_manifest` blocks delegation and final review when the
manifest is absent, stale, cross-project, or unrelated to the requested
surface.

## Security And Privacy

- Apply Paperclip project ACLs before retrieval and again before rendering.
- Keep raw source only in the repository; graph rows hold hashes, bounded
  excerpts when explicitly permitted, and source spans.
- Reject secrets by path, extension, entropy/signature scanning, and
  repository-supplied deny patterns before parsing.
- Log query metadata, snapshot, result counts, and manifest creation; never
  log source content or credentials.
- Enforce per-company quotas, traversal/time budgets, and cancellation.

## Library Selection

| Component | Choice | Reason |
| --- | --- | --- |
| TypeScript extraction | `ts-morph` + TypeScript compiler | semantic resolution, symbols, paths, references |
| Independent dependency evidence | `dependency-cruiser` | TypeScript-aware dependency graph and architecture rules |
| Markdown extraction | `unified`, `remark-parse`, `remark-gfm`, `remark-frontmatter`, `unist-util-visit` | stable Markdown AST, headings, links, metadata |
| Durable graph/query store | existing PostgreSQL | native control-plane ACLs, transactions, operations, recursive traversal, FTS |
| In-process graph algorithms | `graphology` | bounded algorithms on selected subgraphs only |
| Deferred contingency | Kuzu | evaluate only if PostgreSQL performance metrics prove the need |

## Delivery Plan

### Phase 0: Contracts And Fixtures

Define repository configuration, schema migration, node/edge taxonomy,
snapshot lifecycle, MCP schemas, and fixture monorepos with TypeScript,
Markdown, test, cross-package, and excluded-secret cases.

Acceptance: same tree and indexer version produces byte-identical logical
node/edge identities; excluded files never produce nodes.

### Phase 1: Deterministic Index

Implement the repository registration, full index, incremental hash-based
index, TypeScript and Markdown extractors, snapshot integrity validation, and
CI `dependency-cruiser` import.

Acceptance: an edit updates only that file's owned graph records; a failed
index leaves the prior complete snapshot usable; every edge has source proof.

### Phase 2: Secure Retrieval And Manifest

Implement search/context/impact/trace/verify tools, ACL enforcement, query
limits, audit events, Context Manifest persistence, and cited result renderer.

Acceptance: unauthorized graph data cannot be inferred through result counts,
and every claim in a manifest resolves to the exact repository revision.

### Phase 3: Manager Enforcement

Require valid manifests for CTO/QA/Security planning, delegation, review, and
defect-return flows. Add Paperclip UI links from issue to manifest and cited
nodes.

Acceptance: attempts to create an implementation child or terminal review
without a current manifest are rejected with an actionable blocker.

### Phase 4: Scale And Operations

Add metrics, index queue controls, retention, backfill, observability,
performance testing, and disaster-recovery exercises. Establish p95 query and
freshness SLOs per repository size tier.

Acceptance: sustained load meets the agreed SLO; only then benchmark Kuzu
behind the same tool/schema contract if PostgreSQL cannot meet it.

## Test Matrix

- TypeScript path aliases, type-only imports, barrels, cycles, generated
  declarations, workspace packages, and renamed symbols.
- Markdown links, headings, duplicate anchors, frontmatter, broken links,
  code fences, requirements, and decisions.
- Multi-module request spanning package boundaries with one snapshot per
  repository and an explicit cross-repository manifest section.
- Stale snapshot, incomplete index, parser failure, deleted file, rebased
  commit, and concurrent index jobs.
- ACL denial, excluded secret file, path traversal, oversized query, cyclic
  graph, and result truncation.
- Manager planning and review gates, including QA repair child and original
  implementation owner.

## Rollout And Rollback

Feature-flag the extension per company/project. Backfill only a selected test
project first, compare graph results against human-reviewed fixtures, then
enable manager warnings, and finally enforcement. Rollback disables graph
queries/enforcement and returns managers to the existing Context Manifest
skill; it never deletes snapshots or mutates repository data.
