# Decaf-TS Design Specification

**Status:** In Progress (incremental — first pass)
**Scope:** decaf-ts monorepo, derived from domain-knowledge specifications in `workdocs/ai/project/specifications/DECAF_*.md`
**Author:** CEO (Paperclip), issue [SAA-102](/SAA/issues/SAA-102)
**Companion:** [Architecture Workbook](../architecture-workbook/README.md)

## Purpose

This is the **design specification** for decaf-ts. Where the [Architecture Workbook](../architecture-workbook/README.md) describes the system *as built* (packages, layers, flows), this document specifies the **design** per subsystem: the goals, requirements, key design decisions, public interfaces, and acceptance rationale — each theme standing on its own as a cohesive description of the overall features, while **referencing the individual DECAF specifications** for authoritative detail.

It is organized by common theme. For specifications that share a theme, the cohesive design for that theme is presented here; individual `DECAF-N` specs are referenced rather than duplicated. Overlaps and contradictions between source specifications are noted inline and consolidated in [10 — Overlaps & Contradictions](./10-overlaps-contradictions.md).

## Out of Scope

Per the task, **anything specific to the `mcp-server` package is excluded**: [DECAF-16](../specifications/DECAF_16.md) and [DECAF-31](../specifications/DECAF_31.md) entirely, and the mcp-server CLI-boot parts of [DECAF-17](../specifications/DECAF_17.md). The agent orchestration model, GOAP, progress relay, and user-request handling from DECAF-17 are in scope.

## How to Read

1. [00 — Introduction & Design Principles](./00-introduction.md)
2. [01 — Persistence & Adapter Design](./01-persistence-design.md)
3. [02 — HTTP Server, Nest & SSE Design](./02-http-server-design.md)
4. [03 — Authorization & Identity Design](./03-authorization-design.md)
5. [04 — Task Engine Design](./04-task-engine-design.md)
6. [05 — Graph Subsystem Design](./05-graph-design.md)
7. [06 — Fabric Integration Design](./06-fabric-design.md)
8. [07 — Cross-Cutting Platform Services Design](./07-platform-services-design.md)
9. [08 — Agent Orchestration Design](./08-agent-orchestration-design.md)
10. [09 — Integrations, UI, CI & Testing Design](./09-integrations-design.md)
11. [10 — Overlaps & Contradictions](./10-overlaps-contradictions.md)

Each section follows a consistent shape adapted from the project specification template: Overview, Goals, Requirements, Architecture & Design (with sequence diagrams), Interfaces, Open Questions/Risks, and Source Specifications.

## Source Specifications

47 in-scope specs grouped by theme (same grouping as the Architecture Workbook):

| Theme | Specifications |
|:------|:---------------|
| Persistence & adapters | DECAF-1, 3, 6, 7, 11, 14 |
| HTTP/server/Nest/SSE/auth | DECAF-10, 13, 33, 42, 43 |
| Task engine & graph | DECAF-12, 22, 24, 32, 34, 35, 36, 48 |
| Fabric | DECAF-2, 5, 21, 37, 47 |
| Decorators, logging, context, integrations services | DECAF-4, 9, 18, 23, 26, 30, 38, 39 |
| Webhooks, agent orchestration, CI, BI, UI, testing | DECAF-15, 17, 19, 20, 25, 27, 29, 40, 41, 44, 45, 46 |

Excluded: DECAF-16, DECAF-31 (mcp-server).
