# DECAF-52: Port All Repo Scripts to TypeScript decaf CLI Commands

**Status:** Approved — CTO technical review **approved with conditions** 2026-09-04; all conditions folded into this record 2026-09-04 (decision milestone [SAA-659](/SAA/issues/SAA-659))
**Priority:** Medium
**Owner:** Product Manager / CTO (decaf-ts repo-wide contributor tooling)

> **Approval provenance.** Product scope was approved by the Product Manager on 2026-09-04: this is a **new specification, distinct from DECAF-51 — not an amendment** (scope ruling recorded on the domain root; goals, non-goals, user stories, and acceptance-criteria direction approved as summarized below, with wording tightened without changing intent). Technical assessment and architecture direction were supplied as **CTO-approved input** on 2026-09-04 (repo scan inventory and the port-to-decaf-cli direction recorded in §4). The **formal CTO technical review of the drafted technical sections completed 2026-09-04 on [SAA-654](/SAA/issues/SAA-654): APPROVED WITH CONDITIONS** — the five former §6 open questions are now decided (§6), and every inventory correction, condition, and coordination guard from that review is folded into §3/§4/§6 by decision milestone [SAA-659](/SAA/issues/SAA-659). The verbatim CTO verdict remains on [SAA-654](/SAA/issues/SAA-654); none of its decisions may be re-decided or weakened. Implementation is delegated by the domain-root owner (Product Manager) under separate children, each carrying specification `DECAF-52`.

## 1. Overview

This specification ports every executable script in the decaf-ts repository — root `bin/` helpers, the 30-package duplicated `bin/tag-release.sh` copies and 7-package `bin/sync-codex.sh` copies (plus their redistributed compiled copies), `with-ai` executable scripts and docker shell entrypoints, and the root `package.json` orchestration entries that wrap them — to TypeScript as decaf-cli command modules, auto-picked-up and invoked as `decaf <command> ...`. It is contributor tooling: it ships consistency, de-duplication, and maintainability for the people who build decaf-ts, not new end-user product capability. Each ported script keeps its current behavior as the parity baseline; deviations are allowed only where decaf conventions require them, and each deviation is documented.

It is intentionally separate from DECAF-51 (the with-ai MCP/CLI redesign that retires `./mcp-server`): DECAF-51's charter is user-facing MCP/CLI product capability on `with-ai`; this specification's charter is repo-wide developer tooling. Overlap is minimal and cleanly bounded — `mcp-server/bin` is excluded here because it retires under DECAF-51, and both efforts produce decaf-cli command modules from disjoint command sets (the binding sequencing guard and disjoint command-name registry are recorded in §6).

**Verbatim user requirement (2026-09-04, board):**

> decaf-ts's jira is live and working again. (remember you cannot run xray test at this time since that accound doestn supoprt xray). also sote that all scripts currently para or the repo (whatcrs, scripts er wun sinsire/ouside to sync, etc) must be ported to ts (executable scripts shoulb become a cli)

**Interpreted requirement (PM, approved):** all executable scripts currently in the decaf-ts repo (watchers, sync scripts run inside/outside, build/release/link helpers, etc.) must be ported to TypeScript, and executable scripts become decaf CLI commands.

## 2. Goals

*   [ ] Every executable script in scope is ported to TypeScript as a decaf-cli command module, auto-picked-up and invoked as `decaf <command> ...`.
*   [ ] Full decaf conventions across all ported tooling: `@service()`, `logCtx`, decaf errors, zero `console.*`, async/await.
*   [ ] The per-package duplication of `tag-release.sh` (30 in-scope copies) / `sync-codex.sh` (7 per-package copies) is eliminated: one shared TypeScript command implementation replaces all copies.
*   [ ] Root `package.json` orchestration entries invoke the decaf CLI instead of ad hoc node/shell files where they wrap executable scripts.
*   [ ] Watchers/long-running sync scripts run as CLI commands with explicit long-running execution semantics (foreground, signal-clean shutdown — §6 decision 4).
*   [ ] `update-scripts` stops redistributing the retired per-package copies (explicit in-scope deliverable — §4; CTO review: the single most likely silent failure mode of the whole specification otherwise).

**Non-goals (approved):**

*   `mcp-server/bin` — it retires under [DECAF-51](./DECAF_51.md); excluded from this specification (its `obfuscate-prompts.cjs` and `tag-release.sh` go with it).
*   No functional redesign: each ported script keeps its current behavior as the parity baseline; deviations only where decaf conventions require, each documented.
*   No new end-user product features in decaf packages — this is contributor tooling.
*   Live `with-ai/agents/` and `with-ai/skills/` content remains untouched.
*   DECAF-51's own deliverables, phases, and test chain are not altered by this specification.
*   `increase:fs:watches`-type sysctl one-liners in root `package.json` are out of scope — they are not watchers and not script wrappers (CTO inventory correction 9).
*   No daemonization, supervisor, or auto-restart for watchers (§6 decision 4); container-internal long-running sync semantics, if ever needed, are a follow-up specification.

## 3. User Stories / Requirements

*   **US-1:** As a **decaf-ts contributor**, I run every repo script as `decaf <command> ...` so I never need per-package shell paths or `node bin/...` invocations.
*   **US-2:** As a **decaf-ts maintainer**, I edit one shared TypeScript implementation of release/sync tooling instead of ~30 duplicated shell copies drifting apart.
*   **US-3:** As a **decaf-ts maintainer**, I get structured logging, decaf error handling, and consistent CLI help from all repo tooling.
*   **US-4:** As a **contributor running long-lived watchers/sync**, I start them via a CLI command with consistent, documented lifecycle behavior.

**Acceptance criteria (approved direction, made measurable; AC-1/AC-2/AC-3/AC-6 sharpened by the CTO technical review 2026-09-04):**

*   **AC-1:** This specification contains a canonical inventory table (§4): every current script in scope → target CLI command name, owning package/module, and parity notes — or an explicit exclusion with rationale. Every remaining docker `.sh` shim is such an explicit exclusion, and its rationale names the container constraint that requires it (§6 decision 1).
*   **AC-2:** At completion, zero in-scope executable `.js`/`.cjs`/`.mjs`/`.sh` scripts remain unported and unexcluded, measured against the binding "executable script" definition in §4 (which excludes build artifacts and config files).
*   **AC-3:** Each port is verified by running the new command and comparing behavior/output to the legacy script it replaces. Parity evidence must cover interactive flows (version selection, confirmations) and the release-dispatch contract; for de-duplicated copies, the shared implementation is verified against the **union of per-copy behaviors** with documented per-copy deltas (drift is folded in or explicitly dropped with rationale); secret values are redacted from all evidence (§6 decision 3).
*   **AC-4:** Duplicated per-package scripts are served by exactly one shared implementation.
*   **AC-5:** Ported commands satisfy decaf conventions (no `console.*`, decaf errors, `logCtx`) — verifiable by lint/review.
*   **AC-6:** Root `package.json` entries that wrapped ported scripts now invoke the CLI. This includes migrating the entries that inline raw token reads today (`do-install`, `set-git-auth`, `set-dev`) onto `decaf utils credentials` / the existing `git-helper` — **PM scope ruling 2026-09-04: in scope** (recorded with §6 decision 3).

## 4. Architecture & Design

CTO-approved technical direction (2026-09-04; formal CTO technical review completed 2026-09-04 on [SAA-654](/SAA/issues/SAA-654) — approved with conditions; direction adopted as written plus the additions below):

- **Port target:** all in-scope scripts become decaf-cli command modules (auto-picked-up, invoked as `decaf <command> ...`) written in TypeScript under full decaf conventions: `@service()`, `logCtx(args, method, true)` contextual logging, decaf errors only, zero `console.*`, async/await. Commands must be **registered in the cli module tree** (e.g. `utilsCmd.addCommand(...)`), not just implemented.
- **Invocation path for npm scripts:** root `package.json` entries need `decaf` resolvable from the workspace — the implementation children fix one explicit invocation path (workspace link / devDependency / `npx decaf`) and record it here.
- **Hosting and naming (decided, §6 decision 2):** shared cross-package tooling lives in `@decaf-ts/utils` (`utils/src/cli/commands/*.command.ts` + `utils/src/bin/*.ts`), registered in `@decaf-ts/cli`'s existing `utils` module as `decaf utils <command>`; with-ai-specific scripts port into with-ai's own auto-picked-up cli module as `decaf with-ai <command>`; kebab-case command names preserving legacy script base names.
- **Long-running scripts (decided, §6 decision 4):** watchers and long-running sync scripts run as foreground CLI commands with signal-clean SIGINT/SIGTERM shutdown; no daemonization; manual restart.
- **Docker entrypoints (decided, §6 decision 1):** full port by default; a `.sh` file may remain only as a thin shim of ≤ ~10 lines with zero business logic, and only where the container environment requires shell.
- **Release chain (decided, §6 decision 5):** one shared `decaf utils tag-release` plus the already-existing `decaf release chain|dispatch`; chain contract unchanged.
- **Per-command tests:** every ported command gets per-command tests per decaf conventions, alongside the AC-3 parity evidence.
- **`update-scripts` redistribution stop (explicit in-scope deliverable):** `update-scripts` must stop redistributing the retired per-package copies, or AC-2 regresses the next time anyone runs it (CTO review: the single most likely silent failure mode of the whole specification).

**Binding "executable script" definition (CTO inventory correction 10; makes AC-2 measurable):** "executable script" means a `.js`/`.cjs`/`.mjs`/`.sh` file that is a hand-maintained source script invoked directly or via `package.json` entries. It **excludes**: build artifacts (`lib/cjs/**`, `dist/**`, webpack/rollup bundles — including the bundled per-package `.cjs` copies until they are retired by this specification) and config files (`jest.config.cjs`, coverage configs, and similar). The per-package `tag-release.cjs` / `update-scripts.cjs` / `build-scripts.cjs` compiled copies are therefore in scope **only as artifacts to retire** (see inventory), not as scripts to port.

**Canonical script inventory (repo scan, CTO, 2026-09-04; corrected per the CTO technical review — all counts verified by direct inspection of `/workspaces/decaf-ts`):**

| Current script | Scope | Target CLI command | Owning package/module | Parity / notes |
|:---------------|:------|:-------------------|:----------------------|:---------------|
| `bin/run-all.js` | In scope | `decaf utils run-all` | `@decaf-ts/utils` (registered in `@decaf-ts/cli` `utils` module) | **Already ported** — existing TS implementation in `@decaf-ts/utils`; port is parity-verify + switchover + legacy deletion, not new implementation. |
| `bin/npm-link.js` | In scope | `decaf utils npm-link` | `@decaf-ts/utils` | **Already ported.** Credential-touching — §6 decision 3 (mandatory `decaf utils credentials` resolver). |
| `bin/npm-token.js` | In scope | `decaf utils npm-token` | `@decaf-ts/utils` | **Already ported.** Credential-touching — §6 decision 3. |
| `bin/bundle.js` | In scope | `decaf utils bundle` | `@decaf-ts/utils` | Parity baseline. |
| `bin/build-scripts.cjs` | In scope | `decaf utils build-scripts` | `@decaf-ts/utils` | **Already ported.** Parity-verify + switchover + legacy deletion. |
| `bin/update-scripts.cjs` | In scope | `decaf utils update-scripts` | `@decaf-ts/utils` | Parity baseline; **must stop redistributing the retired per-package copies** (explicit in-scope deliverable, §4). |
| `bin/collect-slogans.js` | In scope | `decaf utils collect-slogans` | `@decaf-ts/utils` | Parity baseline. |
| `bin/modules.js` | In scope | `decaf utils modules` | `@decaf-ts/utils` | **Already ported.** Parity-verify + switchover + legacy deletion. |
| `bin/copy-ai-docs.sh` | In scope | `decaf utils copy-ai-docs` | `@decaf-ts/utils` | Parity baseline. |
| `bin/sync-codex.sh` (root) | In scope | `decaf utils sync-codex` | `@decaf-ts/utils` | Replaced by the single shared implementation with the per-package copies (AC-4). |
| `bin/tag-release.sh` (root) | In scope | `decaf utils tag-release` | `@decaf-ts/utils` | **Already ported** (`utils/src/cli/commands/tag-release.command.ts` + `utils/src/bin/tag-release.ts`: interactive version selection, SemVersion, `resolveSecret`). Port is parity-completion against the union of the 30 per-package `.sh` behaviors, switchover, and deletion of copies — not a new implementation. Release chain: §6 decision 5. |
| `bin/releases/` (bundle templates: `bundles.json`, `dist-*`, `package-template.json`) | In scope (command assets, not a script) | n/a — relocates to single-copy command assets | `@decaf-ts/utils` | Bundle-template **data directory**, not an executable script; single copy as command assets per §6 decision 5. |
| Per-package `bin/tag-release.sh` — **30 in-scope copies** (31 incl. the excluded mcp-server): the originally listed set (core, cli, crypto, utils, logging, for-\*, integrations, db-decorators, decoration, decorator-validation, injectable-decorators, transactional-decorators, ui-decorators, as-zod, as-infra, styles, ts-template, with-ai, mcp-server) **plus the nine missed packages** (`demo`, `web-page`, `for-couchdb`, `for-fabric`, `for-nano`, `for-nest`, `for-nextjs`, `for-react`, `for-react-native`) | In scope (mcp-server copy retires under DECAF-51) | One shared `decaf utils tag-release` | `@decaf-ts/utils` | All copies replaced by exactly one shared TypeScript implementation (AC-4); verified against the union of per-copy behaviors with documented per-copy deltas (AC-3). |
| Per-package `bin/sync-codex.sh` — **7 per-package copies** (`as-infra`, `crypto`, `for-nextjs`, `for-react`, `ts-template`, `web-page`, `with-ai`), not "same package set" as tag-release; plus root | In scope | One shared `decaf utils sync-codex` | `@decaf-ts/utils` | All copies replaced by exactly one shared TypeScript implementation (AC-4). |
| Per-package `tag-release.cjs` — **17 compiled copies** (bundled artifacts of `utils/src/bin/tag-release.ts` distributed by `update-scripts`) | In scope — retire | Retired with the `.sh` copies | n/a | Build artifacts to delete, not scripts to port (see "executable script" definition). |
| Per-package `update-scripts.cjs` — **15 copies** | In scope — retire/redistribute-stop | Covered by `decaf utils update-scripts` | `@decaf-ts/utils` | The root `update-scripts` stops redistributing per-package copies (explicit in-scope deliverable, §4). |
| Per-package `build-scripts.cjs` — **6 copies** | In scope — retire | Covered by `decaf utils build-scripts` | `@decaf-ts/utils` | Build artifacts to retire. |
| `for-angular/bin/build-schematics.js` | In scope | `decaf utils build-schematics` | `@decaf-ts/utils` | Parity baseline. (CTO inventory correction 5 — previously missing.) |
| `demo/bin/update-deps.js` | In scope | `decaf utils update-deps` | `@decaf-ts/utils` | Parity baseline. (Correction 5.) |
| `integrations/bin/boot-plugin.mjs` | In scope | `decaf utils boot-plugin` | `@decaf-ts/utils` | Parity baseline. (Correction 5.) |
| `integrations/bin/build-docs.cjs` | In scope | `decaf utils build-docs` | `@decaf-ts/utils` | Parity baseline. (Correction 5.) |
| `crypto/bin/prepare-cli-bin.mjs` | In scope | `decaf utils prepare-cli-bin` | `@decaf-ts/utils` | Parity baseline. (Correction 5.) |
| `styles/bin/build.js` | In scope | `decaf utils build-styles` | `@decaf-ts/utils` | Parity baseline. (Correction 5.) |
| `styles/bin/watch.js` | In scope | `decaf utils watch-styles` | `@decaf-ts/utils` | **The repo's actual long-running watcher** (chokidar + debounced rebuild) — §6 decision 4 lifecycle semantics. (Correction 5.) |
| `as-infra/infrastructure/argocd/deploy.sh` | In scope | `decaf utils argocd-deploy` | `@decaf-ts/utils` | Parity baseline. (Correction 5.) |
| `as-infra/infrastructure/argocd/render.sh` | In scope | `decaf utils argocd-render` | `@decaf-ts/utils` | Parity baseline. (Correction 5.) |
| `with-ai/bin/configure-jira-bindings.mjs` | In scope | `decaf with-ai configure-jira-bindings` | with-ai cli module | Credential-touching — §6 decision 3; keeps fail-closed Paperclip user-secret semantics. |
| `with-ai/bin/configure-ms365-bindings.mjs` | In scope | `decaf with-ai configure-ms365-bindings` | with-ai cli module | Credential-touching — §6 decision 3; fail-closed Paperclip user-secret semantics. |
| `with-ai/bin/configure-routines.mjs` | In scope | `decaf with-ai configure-routines` | with-ai cli module | Parity baseline. |
| `with-ai/bin/configure-tool-gateways.mjs` | In scope | `decaf with-ai configure-tool-gateways` | with-ai cli module | Parity baseline. |
| `with-ai/bin/generate-agent-mcp-config.mjs` | In scope | `decaf with-ai generate-agent-mcp-config` | with-ai cli module | Parity baseline. |
| `with-ai/bin/init.mjs` | In scope | `decaf with-ai init` | with-ai cli module | Parity baseline. |
| `with-ai/scripts/jira-mcp-smoke.ts` | In scope | `decaf with-ai jira-mcp-smoke` | with-ai cli module | Already TypeScript; becomes a CLI command module. |
| `with-ai/docker/**/*.sh` — **11 `.sh` files total** (entrypoints, bootstrap-company, backup/restore, harness-login, ensure-env-files, down, `mcp/ms365-wrapper.sh`, `scripts/install-pixel-agents.sh`) | In scope — **full port** to `decaf with-ai <command>` (backup, restore, ensure-env-files, harness-login, bootstrap-company, down, install-pixel-agents); a `.sh` remains only as a ≤ ~10-line zero-logic shim where the container requires shell (§6 decision 1) | `decaf with-ai <command>` | with-ai cli module | `mcp/ms365-wrapper.sh` (env-setup + exec of a third-party binary) is the canonical legitimate **permanent** shim; every remaining shim is an explicit AC-1 exclusion naming the container constraint that requires it (PID-1 entrypoint semantics, pre-Node steps, or wrapping a non-Node binary). |
| Root `package.json` orchestration entries (sync-branches, update-dependencies, docs/compile-spec/publish-docs, drawings/uml/banner pipelines, watchers) | In scope where they wrap executable scripts | Invoke `decaf <command> ...` (AC-6) | Root `package.json` | Entries that wrap ported scripts invoke the CLI instead of ad hoc node/shell files; invocation path per §4. `do-install`, `set-git-auth`, `set-dev` (inline raw token reads today) migrate onto `decaf utils credentials` / existing `git-helper` — PM scope ruling: in scope (§6 decision 3). |
| `mcp-server/bin` | **Excluded** | n/a | n/a | Retires under [DECAF-51](./DECAF_51.md); its `obfuscate-prompts.cjs` and `tag-release.sh` go with it; command sets are disjoint under §6 decision 2. |

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID           | Task Name                            | Priority | Status  | Dependencies |
|:-------------|:-------------------------------------|:---------|:--------|:-------------|
| DECAF-52-*   | Pending decomposition by the domain-root owner (Product Manager) into implementation children — the specification is approved (CTO review approved with conditions 2026-09-04, conditions folded under [SAA-659](/SAA/issues/SAA-659)); root/per-package/utils work has no DECAF-51 dependency and proceeds immediately, with-ai module ports are sequenced per the §6 DECAF-51 coordination guard | Medium | Pending | None (specification approved; §6 decisions recorded) |

## 6. Decisions / Risks

The five former open questions were decided by the CTO technical review on 2026-09-04 ([SAA-654](/SAA/issues/SAA-654), verdict: **APPROVED WITH CONDITIONS**; verbatim text remains there). Decisions are binding — none may be re-decided or weakened:

*   **Decision 1 — Docker entrypoints: full port by default; exec-only shims only where containers require.** Port each script's logic to `decaf with-ai <command>` (backup, restore, ensure-env-files, harness-login, bootstrap-company, down, install-pixel-agents). A `.sh` file may remain only as a thin shim of ≤ ~10 lines with zero business logic, and only where the container environment requires shell: PID-1 entrypoint semantics, steps that run before Node/the CLI exist in the container, or wrapping a non-Node binary. `with-ai/docker/mcp/ms365-wrapper.sh` (env-setup + exec of a third-party binary) is the canonical legitimate permanent shim. Every remaining shim is an explicit AC-1 exclusion naming the container constraint that requires it.
*   **Decision 2 — Hosting + naming: `@decaf-ts/utils` for all shared repo tooling; the with-ai module for with-ai/Paperclip ops; kebab-case names preserving legacy script base names.**
    *   Shared cross-package tooling (everything replacing root `bin/*` and the per-package copies) lives in `@decaf-ts/utils` (`utils/src/cli/commands/*.command.ts` + `utils/src/bin/*.ts`), registered in `@decaf-ts/cli`'s existing `utils` module: `decaf utils tag-release`, `sync-codex`, `run-all`, `npm-link`, `npm-token`, `modules`, `build-scripts`, `update-scripts`, `bundle`, `collect-slogans`, `copy-ai-docs`, plus the previously missed per-package scripts (`build-schematics`, `update-deps`, `boot-plugin`, `build-docs`, `prepare-cli-bin`, `build-styles`, `watch-styles`, `argocd-deploy`, `argocd-render`). One hosting home; no new package; no per-package command modules.
    *   with-ai-specific scripts port into with-ai's own auto-picked-up cli module as `decaf with-ai <command>`: `configure-jira-bindings`, `configure-ms365-bindings`, `configure-routines`, `configure-tool-gateways`, `generate-agent-mcp-config`, `init`, `jira-mcp-smoke`, and the docker command ports from decision 1. This is DECAF-51's own established layout (`with-ai/src/cli`).
    *   Naming scheme: `decaf <module> <command>`, kebab-case, command name = legacy script base name unless it collides with an existing decaf command. Greppability and muscle memory beat renaming.
*   **Decision 3 — Secret handling: the existing `decaf utils credentials` resolver is mandatory for every credential-touching port.** `resolveSecret`/`hasSecret` (env var → keychain → legacy `.token`/`.npmtoken` file) already backs `tag-release` and `npm-link`; all ports use it. Rules: (a) no raw `$(cat .token)`-style reads in ported code or new package.json entries — flags accept a secret *name* for resolution or an env var, never encourage inline values; (b) resolved token values are never logged, echoed, or included in parity evidence — `logCtx` output and AC-3 evidence must be redacted; (c) `configure-*-bindings` keep their current fail-closed Paperclip user-secret semantics (values live in Paperclip user secrets, never in the repo); (d) root `package.json` entries that inline raw token reads today (`do-install`, `set-git-auth`, `set-dev`) migrate onto `decaf utils credentials` (`git-helper` already exists for exactly the git-auth case). **PM scope ruling (2026-09-04, on the CTO's open call in (d)): this migration is IN SCOPE for DECAF-52**, as part of the package.json orchestration work (AC-6) — the secret-handling rules are binding on this specification, and leaving those entries inlining raw token reads would violate the spec's own rules within the same deliverable.
*   **Decision 4 — Watcher lifecycle: foreground command, signal-clean shutdown, no daemonization.** The only true long-running watcher script in the repo is `styles/bin/watch.js` (chokidar + debounced rebuild). Ported watcher/sync commands run in the foreground (parity with today's terminal usage), log startup config via `logCtx`, fail fast on invalid config, preserve debounce behavior, and install SIGINT/SIGTERM handlers that close the watcher and exit 0 with no orphaned child processes. Restart is manual (contributor re-runs) — no supervisor, no auto-restart, no background daemon in this specification. Container-internal long-running sync semantics, if ever needed, are a follow-up specification.
*   **Decision 5 — Release chain: one shared `decaf utils tag-release` + the already-existing `decaf release chain|dispatch`; no new chain mechanics.** `utils/src/cli/commands/tag-release.command.ts` + `utils/src/bin/tag-release.ts` already exist (interactive version selection, SemVersion, `resolveSecret`); the port is parity-completion against the union of the 30 per-package `.sh` behaviors, switchover, and deletion of copies — not a new implementation. `bin/releases/` bundle templates (bundles.json, dist-*, package-template.json) relocate to single-copy command assets in utils. The chain contract is unchanged: publish triggers `decaf release dispatch` (root `postpublish` switches from `node ./utils/lib/bin/release-chain-dispatch.cjs` — a build artifact of the already-ported TS source — to the CLI invocation). Interactive prompts are preserved via the existing UserInput module.

**DECAF-51 coordination guard (binding):** DECAF-52's with-ai module ports are **sequenced after or jointly planned with DECAF-51's with-ai foundation phase**, and both specifications keep a **disjoint command-name registry**. Root/per-package/utils work has **no DECAF-51 dependency and proceeds immediately**. The `mcp-server/bin` exclusion stands: the package retires under DECAF-51 (its `obfuscate-prompts.cjs` and `tag-release.sh` go with it).

Risks:

*   **Risk (CTO review): `update-scripts` redistribution regression — the single most likely silent failure mode of the whole specification.** If `update-scripts` keeps redistributing the retired per-package copies, AC-2 regresses the next time anyone runs it. Mitigated by the explicit in-scope deliverable (§4: update-scripts stops redistributing retired per-package copies) and per-command tests.
*   **Risk (CTO review): DECAF-51 collision on with-ai `src/cli` layout.** Both specifications reshape with-ai's package layout; uncoordinated parallel work would conflict. Mitigated by the DECAF-51 coordination guard above (sequencing + disjoint command-name registry).
*   **Risk:** 30 duplicated `tag-release.sh` copies (and 7 `sync-codex.sh` copies) have drifted; a single shared implementation must reproduce the union of behaviors actually relied on — mitigated by AC-3 union-of-behaviors parity verification with documented per-copy deltas (drift folded in or explicitly dropped with rationale).
*   **Risk:** porting credential-touching scripts could leak or weaken secret handling — mitigated by the binding §6 decision 3 rules (mandatory `decaf utils credentials` resolver, redacted evidence, fail-closed Paperclip user-secret semantics, PM in-scope ruling on `do-install`/`set-git-auth`/`set-dev`).
*   **Risk:** scope overlap with DECAF-51 could produce duplicate or conflicting CLI commands — mitigated by the explicit `mcp-server/bin` exclusion, the disjoint command-name registry, and the sequencing guard recorded above.
*   **Risk:** ported watchers without settled lifecycle semantics would regress contributor workflows — mitigated by §6 decision 4 (foreground, signal-clean SIGINT/SIGTERM shutdown, no daemonization, manual restart).

## 7. Results & Artifacts

*   Specification record: initialized 2026-09-04 for domain root [SAA-650](/SAA/issues/SAA-650); **approved 2026-09-04** — CTO technical review on [SAA-654](/SAA/issues/SAA-654) returned **APPROVED WITH CONDITIONS**, and all conditions (inventory corrections, "executable script" definition, §6 decisions, new risks, DECAF-51 coordination guard, AC-3 sharpening, secret-handling rules incl. the PM scope ruling) were folded into this record the same day by decision milestone [SAA-659](/SAA/issues/SAA-659). No implementation results yet. Target artifacts: decaf-cli command modules replacing every in-scope script, the single shared `tag-release`/`sync-codex` implementation, updated root `package.json` orchestration entries, per-port parity verification evidence (AC-3), per-command tests, and lint/review evidence of decaf-convention compliance (AC-5).
