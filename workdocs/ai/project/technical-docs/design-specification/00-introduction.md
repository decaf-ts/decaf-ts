# 00 — Introduction

## What decaf-ts is

decaf-ts is a model-driven, decorator-first TypeScript application framework
that makes a single decorated `Model` class the source of truth for validation,
persistence, serialization, hashing, and UI rendering. It is published as a
family of small, single-purpose npm packages under the `@decaf-ts` scope,
composed into a strict, upward-only dependency stack.

## Core architecture choice

In one sentence: **behaviour lives in pluggable adapters; contracts and metadata
live in framework core, and a decorated model is the single schema every layer
shares.**

## Top-level responsibilities

- **Reflect and validate** — `decoration` provides a central `Metadata` store;
  `decorator-validation` provides a `Model` base with a validator registry and
  property validators; `injectable-decorators` provides singleton/on-demand DI.
- **Persist** — `db-decorators` and `transactional-decorators` map models to
  storage and coordinate transactions; `core` defines the
  `Adapter`/`Context`/`Dispatch`/`Sequence`/`Statement`/`Paginator`/`Repository`
  contract and the RAM/FS runtimes; `for-*` adapters implement it per storage
  technology (CouchDB, Nano, PouchDB, TypeORM, Hyperledger Fabric).
- **Serve** — `for-http` exposes models as REST (client + server controllers,
  webhooks, SSE events); `for-nest` bootstraps the same into NestJS with a
  request pipeline, auth, and controller generation from models.
- **Render** — `ui-decorators` defines a framework-agnostic rendering contract
  (renderable models, list items, graph metadata, user-requests); frontend
  engines (`for-angular`, `for-react`, `for-nextjs`, `for-react-native`) plus
  `styles` implement it per framework.
- **Integrate** — `integrations` provides blob storage, secrets, Keycloak,
  Kibana, feature flags, multi-tenant namespaces, dynamic loading, dashboard
  plugins, Docker orchestration, and the graph *execution* engine.
- **Tool** — `utils`/`cli` provide the build/release/test CLI; `mcp-server`
  exposes tooling over MCP; `with-ai` packages the agent company runtime;
  reusable actions, templates, `bin`, and `docker` provide CI and local infra.

## Design principles (summary)

The system-wide principles are stated in the [Architecture Handbook — Overview](../architecture-handbook/00-overview.md).
The principles *specific to each design area* (with the test/spec that enforces
them) are stated at the top of each design section below.

## Relationship to the handbook

The architecture, layering rationale, and cross-cutting concerns are documented
in the [Architecture Handbook](../architecture-handbook/README.md). This
specification does not repeat them; it adds the technical design, functional
requirements, environment, and runbook detail.
