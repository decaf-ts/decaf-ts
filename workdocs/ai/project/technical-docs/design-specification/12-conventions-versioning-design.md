# 12 — Conventions & Versioning Design

## Scope

This section documents the cross-cutting conventions and versioning design that
govern decaf-ts packages as a whole: naming, the load-time `sideEffects`
contract, build-placeholder substitution, release-chain and semver derivation,
and migration versioning (which is distinct from package versioning). The
architecture-level discussion lives in the [Architecture Handbook — Cross-cutting concerns](../architecture-handbook/11-cross-cutting-concerns.md).

## Design principles

- **Single schema, many layers.** A decorated model is the one schema; every
  layer reads the same `Metadata`. Enforced by the `db-decorators`/`core`
  override tests that assert metadata flows from decorator → repository →
  adapter.
- **Self-registration is load-bearing, not an optimization.** Importing a
  package must register its library, flavour, and decorator overrides. This is
  enforced by the bundling/side-effect tests where present (several are
  recorded as missing or misleading).
- **Never version documentation.** This specification and the handbook are
  updated in place; release notes (Release Manager's scope) are the only dated,
  append-only artifacts.

## Naming conventions

- **Scope**: all runtime packages are published under the `@decaf-ts` scope.
- **Adapter packages**: `for-<technology>` (`for-couchdb`, `for-nano`,
  `for-pouch`, `for-typeorm`, `for-fabric`, `for-http`, `for-nest`,
  `for-angular`, `for-react`, `for-nextjs`, `for-react-native`).
- **Flavour strings**: short, kebab/snake identifiers (`"nano"`, `"pouch"`,
  `"type-orm"`, `"hlf-fabric"`, `"axios"`). Models bind with `@uses(flavour)`.
- **Metadata reflect keys**: namespaced enums (`ValidationKeys`, `ModelKeys`,
  `DBKeys`, `TransactionalKeys`, `InjectablesKeys`, `UIKeys`, `GraphKeys`).
  There is no unified introspection API (recorded friction).
- **Subpath exports**: optional/cloud providers are subpath-only
  (`@decaf-ts/integrations/blob/s3`, `@decaf-ts/crypto/common`,
  `@decaf-ts/core/fs`).

Recorded deviations: several packages ship stale template metadata
(`name: "@decaf-ts/ts-workspace"`, wrong `repository.url`/`description`) —
`web-page`, `as-infra`, `with-ai`, `mcp-server`, `for-nextjs`, `styles`. These
are reported, not fixed.

## The `sideEffects` contract

Packages that perform load-time registration **must** declare `sideEffects`
truthfully so bundlers do not tree-shake the registration away.

| Package | Reality | Declared | Status |
|---|---|---|---|
| `decorator-validation` | load-time `@validator` registration | `sideEffects` declared | correct |
| `injectable-decorators` | load-time registration | declared | correct |
| `db-decorators` / `transactional-decorators` / `core` | `overrides/` monkey-patches + `Adapter.setCurrent` | declared | correct |
| `for-pouch` | import runs `decoration()` + `Adapter.setCurrent` | `sideEffects: false` | **inaccurate** (recorded) |
| `ui-decorators` | `overrides` patch `ModelBuilder.prototype` at import | `sideEffects` partial (omits `ui/overrides`) | **inaccurate** (recorded) |
| `as-zod` | patches `ModelBuilder.prototype` at import | `sideEffects: false` | **inaccurate** (recorded) |
| `for-http` | `sideEffects` lists non-existent `overrides` paths | stale entries | **inaccurate** (recorded) |

Functional requirement: **FR-CONV-1** — a package that mutates global state at
import must list those source files in `sideEffects`.
- Acceptance — **Pass**: importing the package in a bundler with tree-shaking
  enabled still executes `Metadata.registerLibrary` and the flavour/registry
  side effects (verifiable via a bundling smoke test asserting the side effect
  ran).
- Acceptance — **Fail**: the registration is dropped and `Metadata.libraries`
  omits the package.

## Build-placeholder substitution

Every package exports `VERSION`, `COMMIT`, `FULL_VERSION`, `PACKAGE_NAME` as
build placeholders. `build-scripts --prod` (from `utils`) substitutes them at
publish time.

- `Metadata.registerLibrary(PACKAGE_NAME, VERSION)` records the loaded set,
  introspectable via `Metadata.libraries`.
- The CLI's `src/version.ts` calls `registerLibrary` but is **orphaned**
  (never imported), so `@decaf-ts/cli` never self-registers (recorded
  inaccuracy).
- Several READMEs ship unreplaced `##PACKAGE_SIZE##` placeholders (recorded).

Functional requirement: **FR-CONV-2** — a `build:prod` build substitutes all
build placeholders in published `lib/`/`dist/` output.
- Acceptance — **Pass**: no `##...##` token remains in published artifacts.
- Acceptance — **Fail**: any placeholder token remains.

## Release-chain and semver derivation

Release tooling lives in `utils` (`ReleaseChainRunner`, `runReleaseChain`,
`dispatchReleaseChainWorkflow`) and `bin/tag-release.sh`; the CI twin is the
`reusable-actions` `release-on-merge-pr` / `publish-on-release` / `release-on-tag`
workflows.

- **Semver bump** is derived from the commit message suffix:
  `-breaking` → major, `-bug`/`-fix` → patch, `-prerelease` → prerelease
  (with `--tag prerelease`), otherwise minor.
- `npm version` is run, then a token-authenticated push.
- `bin/bundle.js` publishes `@decaf-ts/dist-*` aggregates.
- **Skip-CI contract**: the canonical `[skip ci]` token suppresses CI;
  `tag-release.sh` normalizes skip-CI variants.

Functional requirement: **FR-CONV-3** — a tagged release derives the correct
semver bump from its commit message and publishes with the resolved dist-tag.
- Acceptance — **Pass**: a `-breaking` commit produces a major bump; a `-fix`
  commit produces a patch bump; a prerelease commits with `--tag prerelease`.
- Acceptance — **Fail**: wrong bump level or wrong dist-tag.

Recorded deviation: `release-on-merge-pr.yml` references an undefined
`${TAG_NAME}` (should be `${TAG}`); Node matrix inconsistency (`22.x` vs `22`).
Reported, not fixed.

## Drift risks

- `with-ai` devDependencies float `latest` and `docker/mcp/managed-mcp.json`
  invokes `@decaf-ts/mcp-server@latest` — non-reproducible (recorded).
- `as-infra` carries a stale `ts-template` semver (`3.10.17`) unrelated to its
  chart `version: 0.1.0` (recorded).
- Committed `lib/` artifacts can lag `package.json` versions (foundation,
  `styles`) (recorded).

## Migration versioning (distinct)

Migration ordering uses `MigrationVersioning`: `StandardMigrationVersioning`
(lexical) by default; `SemverMigrationVersioning` (optional `semver` dep,
falls back to lexical). This governs *which migrations run in which order*,
independent of package semver. Detail and functional requirements live in
[Migrations design](./04-migrations-design.md).

## Environment

No runtime environment variables are read by the versioning/release machinery
itself beyond credentials:

| Variable | Component | Description | Default |
|---|---|---|---|
| `NPM_TOKEN` | utils / bin / CI | npm publish token; resolved via the credentials chain (env → OS keychain → legacy file) | — |
| `DRY_RUN` | bin scripts | dry-run flag for release/link scripts | unset |
| `TIMEOUT` | bin scripts | per-step timeout | — |
| `VERSION` | bin scripts | explicit version override (bypasses derivation) | — |

Secrets: publish tokens live in `.token`/`.npmtoken` files (gitignored) or the
OS keychain via `CredentialsCommand`. Never commit real tokens (recorded: the
`ts-template` ships committed `.token`/`.npmtoken` files — a leak risk to
resolve).

## Secrets (cross-cutting)

| Secret | Stored in | State | Default value | Accessed by | Updated by |
|---|---|---|---|---|---|
| npm publish token | `.npmtoken` (gitignored) or OS keychain | plain text in untracked file, or OS-managed | `<set in .npmtoken / keychain>` | `utils`/`bin`/CI | manual rotation |
| `ENCRYPTION_KEY` (MCP assets) | `.env.secret` | untracked secret file | `<set in .env.secret>` | `mcp-server` | manual rotation |

## E2E runbook (conventions)

### Scope
Verify that a representative package self-registers on import, that
`build:prod` substitutes placeholders, and that a tagged release derives the
correct semver bump. Covers FR-CONV-1/2/3.

### Prerequisites
- A clean checkout with dependencies installed (`npm install`).
- `NPM_TOKEN` available for publish-path tests (or run in dry-run).

### Running
```bash
# Self-registration + placeholder substitution (per package, e.g. core)
npm -w @decaf-ts/core run build:prod
node -e "require('@decaf-ts/core'); console.log(Object.keys(require('@decaf-ts/decoration').Metadata.libraries))"

# Release semver derivation (dry run)
DRY_RUN=true ./bin/tag-release.sh
```

### Expected outcomes
- `Metadata.libraries` lists the imported package with the substituted version.
- Published `lib/` contains no `##...##` tokens.
- `DRY_RUN` reports the derived bump level matching the commit suffix without
  pushing.

Where bundling/side-effect tests do not yet exist (recorded gaps in several
packages), this runbook is the fallback verification until those tests are
added (Tester/QA scope).
