# decaf-ts — Architecture Handbook

This handbook is the authoritative, always-current description of the
**decaf-ts** framework's architecture. It is never versioned and never a dated
snapshot: when the system changes, the relevant section is fixed in place so
the handbook always describes decaf-ts as it actually is right now.

It is grounded in a module-by-module review of the real source, captured in
per-module research briefs under `_research-briefs/`. Every section below
traces back to that evidence. Where a brief was thin, the text says so
explicitly rather than inventing APIs.

## How to read this handbook

The handbook is split one file per architectural area. Read top-to-bottom for
the full picture, or jump to the area you need.

| # | File | Covers |
|---|---|---|
| 00 | [Overview](./00-overview.md) | What decaf-ts is, design philosophy, system context, the three bundled distributions |
| 01 | [Layer architecture](./01-layer-architecture.md) | Module layering and the dependency stack |
| 02 | [Foundation](./02-foundation.md) | `decoration`, `decorator-validation`, `injectable-decorators` |
| 03 | [Persistence core](./03-persistence-core.md) | `db-decorators`, `transactional-decorators`, `core` (Adapter/Context/Dispatch/Sequence/Statement/Paginator, Repository, query, Task Engine, migrations, auth, RAM/FS) |
| 04 | [Persistence adapters](./04-persistence-adapters.md) | `for-couchdb`, `for-nano`, `for-pouch`, `for-typeorm`, `for-fabric` |
| 05 | [HTTP backend](./05-http-backend.md) | `for-http`, `for-nest` |
| 06 | [UI layer](./06-ui-layer.md) | `ui-decorators` (rendering, components, graph, user-requests) |
| 07 | [Integrations](./07-integrations.md) | blob, secrets, keycloak, kibana, feature-flags, namespaces, plugins, loader |
| 08 | [Frontend engines](./08-frontend-engines.md) | `for-angular`, `for-react`, `for-nextjs`, `for-react-native`, `styles` |
| 09 | [Tooling & infrastructure](./09-tooling-infra.md) | `utils`, `cli`, `mcp-server`, `with-ai`, reusable-actions, templates, `bin`, `docker` |
| 10 | [Apps & demos](./10-apps-demos.md) | `web-page`, `demo` |
| 11 | [Cross-cutting concerns](./11-cross-cutting-concerns.md) | logging, crypto, as-zod, versioning, metadata self-registration |
| 12 | [Glossary](./12-glossary.md) | Terms and acronyms used across the handbook |

## Reading guidance by audience

| Audience | Sections | Why |
|---|---|---|
| Engineers building on decaf-ts | 00, 01, then the area they use (02–10) | Understand layering before consuming any one layer |
| Integration partners | 00, 01, 04, 05, 07 | Where the boundaries and contracts live |
| Security / compliance | 00, 03 (auth), 05 (auth handlers), 07 (secrets/namespaces), 11 (crypto) | Trust boundaries, secrets, identity |
| Architects | 00, 01, 11 | Design philosophy, layering rationale, cross-cutting decisions |

## Conventions used here

- **Diagrams**: simple relationship/flow diagrams are inline fenced Mermaid
  (`graph TD` / `sequenceDiagram`). No separate diagram sources are checked in
  for this handbook.
- **Never versioned**: no `vX` caveats or dated snapshots. Fix in place.
- **No invented APIs**: where a research brief did not document an API, the
  text states the gap explicitly.

## Authoring-stage inaccuracies

While authoring this handbook and the companion Design Specification, the
per-module research briefs' own "Inaccuracies found" sections were transcribed
verbatim into each chapter, and additional authoring-stage observations were
recorded where the brief contradicted itself or the stated inputs. **Nothing
was fixed** — these are reported only, per the task contract.

Each chapter carries its detailed entries in its own inaccuracies section, in
the format:

```
**[<module>]** <area> — <what> | Evidence: <file:line> | Suggested fix: <short>
```

Aggregated across all chapters, **457 distinct inaccuracies, 0 exact duplicates** were recorded.
The count is dominated by the briefs' own findings; the largest clusters are
in `integrations` (79), `for-angular` (24), `core` (35), and the `for-*`
adapter families. Many entries are documentation-vs-code drift (README/import
path errors, stale generated reports, unreplaced build placeholders),
mis-classified dependencies (`sideEffects: false` despite load-time
registration; runtime deps under `devDependencies`), and dead/commented code.
A smaller set are real correctness concerns (e.g. `Statement.prepareCondition`
`BIGGER_EQ` dropping the comparison value; `feature-flags` access lookups
ignoring the feature key; a hardcoded JWT shipped in `for-angular`'s published
bundle; `RnDecafCrudField` Rules-of-Hooks violations in `for-react-native`).

See each chapter's inaccuracies section for the full, sourced list. Notable
authoring-stage observations beyond the briefs' own findings include:

- **[inputs]** brief scope — `03-libs.md` covers logging/crypto/as-zod, not
  `db-decorators`/`transactional-decorators` (which live in `01-foundation.md`).
  | Evidence: `03-libs.md:1-12` | Suggested fix: correct the input label.
- **[core vs transactional-decorators]** `@transactional` ownership — two
  non-interchangeable decorators target `ContextLock` vs `SynchronousLock`;
  consumers must import from `@decaf-ts/core`.
  | Evidence: `02-core.md:96-107,344` vs `01-foundation.md` transactional §6 |
  Suggested fix: document the divergence in both READMEs.

These and all per-module entries are recorded for the code owners; the
Technical Documentation Specialist does not modify source.
