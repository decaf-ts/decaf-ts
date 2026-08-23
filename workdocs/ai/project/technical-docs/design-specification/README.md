# decaf-ts — Design Specification

This Design Specification describes decaf-ts on a technical level: design
principles, entity relationships, per-area functional requirements with
sequence diagrams, environment variables, and an E2E runbook. It is **connective
tissue**: it references (rather than restates) the individual specification,
bug, incident, release, and test domain records that the Delivery
Documentation Specialist owns, and it points to the [Architecture Handbook](../architecture-handbook/README.md)
for architecture rather than duplicating it.

It is never versioned and never a dated snapshot — update it in place so it
always describes decaf-ts as it actually is.

## Contents

| # | File | Covers |
|---|---|---|
| 00 | [Introduction](./00-introduction.md) | What the system is, core architecture choice, top-level responsibilities |
| 01 | [Persistence design](./01-persistence-design.md) | Adapter/Context/Repository/transactions/migrations design, entity relationships |
| 02 | [Query design](./02-query-design.md) | Statement/Paginator/query builders/sequences |
| 03 | [Task engine design](./03-task-engine-design.md) | TaskEngine/handlers/workers/leases/retries |
| 04 | [Migrations design](./04-migrations-design.md) | `@migration`/versioning/execution plan |
| 05 | [Auth & identity design](./05-auth-identity-design.md) | Guards/allow-block/identity/audit |
| 06 | [HTTP & Nest design](./06-http-nest-design.md) | REST adapters/controllers/request pipeline/auth/webhooks/SSE |
| 07 | [UI rendering design](./07-ui-rendering-design.md) | Renderable models/rendering engine/targets/list items |
| 08 | [Graph design](./08-graph-design.md) | Graph decorators/ports/snapshots, execution bridge, and the execution engine (planning, executors, value store, pinning, loops, code sandbox, events, NestJS backend) |
| 09 | [Integrations design](./09-integrations-design.md) | Blob/secrets/keycloak/kibana/feature-flags/namespaces/loader |
| 10 | [Frontend engines design](./10-frontend-engines-design.md) | Angular/React/Next/React-Native engines, forms, i18n, graph editor |
| 11 | [Tooling & MCP design](./11-tooling-mcp-design.md) | utils/cli/MCP server/with-ai/templates/docker |
| 12 | [Conventions & versioning design](./12-conventions-versioning-design.md) | Naming, side-effects, build placeholders, release-chain, semver |

## How this relates to the Architecture Handbook

The handbook describes *what the system is and why it is shaped that way*; this
specification describes *how it behaves and what it requires to run*. Where a
design section's architecture is already covered in the handbook, the section
points to it rather than restating it. Per-module functional requirements,
environment variables, and acceptance criteria live here.

## Domain records

Individual specification, bug, incident, release, and test domain records (owned
by the Delivery Documentation Specialist under `maintain-domain-docs`) are
referenced from the relevant design sections when they exist. At authoring time
no classified domain records were mapped to these design areas; when one is
created, add a one-line reference here rather than restating its content.
