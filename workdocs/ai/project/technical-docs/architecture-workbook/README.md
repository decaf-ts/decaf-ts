# Decaf-TS Architecture Workbook

**Status:** In Progress (incremental — first pass)
**Scope:** decaf-ts monorepo, derived from domain-knowledge specifications in `workdocs/ai/project/specifications/DECAF_*.md`
**Author:** CEO (Paperclip), issue [SAA-102](/SAA/issues/SAA-102)

## Purpose

This workbook is an **architecture reference** for the decaf-ts TypeScript monorepo. It synthesizes the per-feature domain specifications (`DECAF-1` … `DECAF-48`) into a cohesive, theme-organized description of the system's architecture: packages, layers, runtime flows, and the contracts that hold them together.

It is *not* a rewrite of the individual specs. Each section stands on its own as a description of a subsystem's overall features, then **references the individual DECAF specifications** for authoritative detail. Where specifications overlap or contradict each other, the conflict is called out explicitly (see [Overlaps & Contradictions](./11-overlaps-contradictions.md)).

## Out of Scope

Per the task, **anything specific to the `mcp-server` package is excluded**:

- [DECAF-31](../specifications/DECAF_31.md) (mcp-server CLI Packaging, ADOS Setup, Dist Inspector) — ignored entirely.
- [DECAF-16](../specifications/DECAF_16.md) (Jira Ticket Template Resources & Guided Creation) — entirely mcp-server resource/prompt/tool layer; excluded from implementation scope, noted only for completeness.
- The mcp-server-specific parts of [DECAF-17](../specifications/DECAF_17.md) (the `--agent` CLI boot path, the `mcp-server/toMigrate` resource directory, the `decaf-mcp` binary, compiled-`dist` inspector transport). The agent orchestration model, GOAP, progress relay, and user-request handling from DECAF-17 **are** in scope.

## How to Read

The workbook is segmented into section files. Read top-to-bottom for the full picture, or jump to a subsystem:

1. [00 — Overview & System Context](./00-overview.md)
2. [01 — Package & Layer Architecture](./01-package-architecture.md)
3. [02 — Core Persistence & Adapters](./02-core-persistence.md)
4. [03 — HTTP Server, Nest & SSE](./03-http-server-nest.md)
5. [04 — Authorization & Identity](./04-authorization.md)
6. [05 — Task Engine & Workers](./05-task-engine.md)
7. [06 — Graph Subsystem](./06-graph.md)
8. [07 — Fabric Integration](./07-fabric.md)
9. [08 — Cross-Cutting Platform Services](./08-platform-services.md)
10. [09 — Agent Orchestration](./09-agent-orchestration.md)
11. [10 — Integrations, UI, CI & Testing Extras](./10-integrations-extras.md)
12. [11 — Overlaps & Contradictions](./11-overlaps-contradictions.md)
13. [Appendix A — Specification Index](./appendix-spec-index.md)

Sequence diagrams (Mermaid) are embedded inline in the relevant sections and collected in each section rather than a single dump.

## Conventions

- `DECAF-N` always refers to the specification file `../specifications/DECAF_N.md`.
- Package names use the published npm scope, e.g. `@decaf-ts/core`, `@decaf-ts/for-http`, `@decaf-ts/integrations`.
- Diagrams use Mermaid `sequenceDiagram` / `flowchart` syntax.
- "Status" notes on individual specs (Completed / Planned / Draft / Rejected) are taken from the spec headers and reflect the spec's self-reported state at the time of authoring, not necessarily the current repo state.

## Source Material

47 in-scope specifications were read in full and digested by theme. The grouping used:

| Theme | Specifications |
|:------|:---------------|
| Core persistence & adapters | DECAF-1, 3, 6, 7, 11, 14 |
| HTTP/server/Nest/SSE/auth | DECAF-10, 13, 33, 42, 43 |
| Task engine & graph | DECAF-12, 22, 24, 32, 34, 35, 36, 48 |
| Fabric | DECAF-2, 5, 21, 37, 47 |
| Decorators, logging, context, integrations services | DECAF-4, 9, 18, 23, 26, 30, 38, 39 |
| Webhooks, agent orchestration, CI, BI, UI, testing | DECAF-15, 16(excluded), 17, 19, 20, 25, 27, 29, 40, 41, 44, 45, 46 |

Excluded: DECAF-31 (mcp-server).
