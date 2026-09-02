# DECAF-51: with-ai MCP/CLI — mcp-server Redesign and Port

**Status:** Planned
**Priority:** Medium
**Owner:** CTO / Engineering (decaf-ts `with-ai`)

> **Approval provenance.** Product scope was approved by the Product Manager on 2026-09-02 (the verbatim user brief on the domain root is the approved scope statement; goals, non-goals, and user stories confirmed as summarized below; legacy non-Jira module disposition assumed dropped from the MCP surface pending the user's answer, with capability-level coverage validation required; product ruling: "no functionality lost" is measured at the **capability level**, not the MCP tool level — dropped tools are acceptable only where with-ai's catalog + orchestration demonstrably cover the capability; four assumptions flagged as unresolved questions pending the user's interaction answers). Technical governance / architecture was approved by the CTO on 2026-09-02 (architecture direction for the CLI/MCP split and per-module self-registration; stderr-only MCP logging under stdio transport; latest MCP SDK with new transports evaluated; multi-project Jira access; `@decaf-ts/crypto`-based build-time encryption replacing raw node crypto; skill installation via symlinks to decrypted md files; feasibility confirmed against a direct repo scan of `mcp-server/` v1.15.2 (~187 TS files, ~431 asset files) and `with-ai/` v3.10.17 (minimal TS surface, authoritative markdown catalog); binding security and testing constraints; three conditions recorded in §4). The verbatim approved statements remain on their source approval issues; implementation is delegated by the domain-root owner under separate children, each carrying specification `DECAF-51`. A user hard requirement added 2026-09-02 is recorded as first-class: **the MCP tooling must boot clients per request, so credentials are lazily loaded and never break boot.**

## 1. Overview

This specification retires decaf's `./mcp-server` package and redesigns its entire capability surface into the `./with-ai` decaf module, which is already the authoritative source for decaf skills, agents, and markdown content. The TypeScript functionality of mcp-server becomes decaf-cli commands (`decaf <command> ...`); the MCP server boot becomes its own fully detached CLI command exposing only jira/xray tooling plus common tooling not already replaced by existing skills and orchestration. Nothing user-facing is lost in the port — only improved — and loss is measured at the capability level: where a legacy tool is dropped from the MCP surface, with-ai's catalog plus orchestration must demonstrably cover the capability, validated as part of the port.

## 2. Goals

*   [ ] Retire `./mcp-server`; all its user-facing capability lives on in `./with-ai` — nothing lost, only improved.
*   [ ] `with-ai` remains the single authoritative source for skills/agents/markdown; its coverage of everything mcp-server had is **validated**, not assumed.
*   [ ] All with-ai TypeScript functionality becomes decaf-cli commands (auto-picked-up cli modules, invoked as `decaf <command> ...`).
*   [ ] MCP boot is its own detached CLI command; MCP code fully separated from the rest of the CLI (no shared process-lifecycle state; MCP code must not import CLI command modules).
*   [ ] MCP exposes only jira/xray tooling plus common tooling not already replaced by skills/orchestration, under the strict layout `src/mcp/{jira,xray,common}` with per-module self-registration.
*   [ ] **Hard requirement (user, 2026-09-02):** the MCP tooling boots clients **per request** — Jira/Xray clients are constructed per tool request with lazily-loaded credentials; missing or invalid credentials must never break MCP server boot.
*   [ ] Upgrade to the latest MCP SDK core dependencies; evaluate and include newly available transports/features (e.g. Streamable HTTP).
*   [ ] Remove the `JIRA__PROJECT_KEY` single-project restriction so one server can operate across projects/spaces of a Jira instance.
*   [ ] Implement industry-standard MCP policy with clearly displayed destructive tools (SDK tool annotations plus server-level policy enforcement).
*   [ ] CLI installs skills for the various harnesses via symlinks to md files decrypted at install time inside the installed `@decaf-ts/with-ai` package (decryption mechanism ported from `./mcp-server`).
*   [ ] New encryption uses decaf-ts crypto libraries (`@decaf-ts/crypto` `CryptoService.encrypt/decrypt`), replacing raw node crypto.
*   [ ] Production build publishes a valid public npm package with ALL AI-value content (prompts/agents/skills) encrypted; only decryption-key holders can use the CLI and decrypt/link skills.
*   [ ] Repo-access users can boot and see/edit skills in cleartext; encrypted artifacts are never committed (gitignored).
*   [ ] Testing: TypeScript suites against the code plus inspector verification against the production-grade artifact (same mechanism as mcp-server); Xray live tests created but run separately (user injects credentials manually); all live Jira/Xray tests idempotent and self-reverting with a loud user-facing warning on cleanup failure; complete variant coverage against as few live issues as possible.

## 3. User Stories / Requirements

*   **US-1:** As a **decaf developer**, I run one detached CLI command to boot an MCP server exposing jira/xray tools for my AI harness, and clients are created per request so missing credentials never break boot.
*   **US-2:** As a **decaf developer**, I use `decaf <command>` for all other with-ai functionality without the MCP server in the picture.
*   **US-3:** As an **AI harness user**, I install decaf skills into my harness via a CLI command that symlinks decrypted markdown from the installed package, gated on holding the decryption key.
*   **US-4:** As a **multi-project Jira user**, I work across projects/spaces in one Jira instance without a single-project env restriction.
*   **US-5:** As an **operator**, I see destructive tools clearly flagged and policy-gated per the MCP industry standard before an AI client can invoke them.
*   **US-6:** As a **package consumer without repo access**, I install the public npm package and use the CLI/MCP with encrypted AI content only key holders can decrypt.
*   **US-7:** As a **repo contributor**, I see and edit skills in cleartext locally; encrypted artifacts are never committed.
*   **US-8:** As a **maintainer**, I add a new MCP domain block (tools/templates/prompts) that self-registers against the MCP instance without touching core wiring.
*   **Req-1:** The system must organize all new code under `src/cli` (cli modules automatically picked up by the decaf cli) and `src/mcp/{jira,xray,common}` (tools/templates/prompts per module).
*   **Req-2:** Each MCP module (jira, xray, common) must self-register its tools/templates/prompts against the MCP server instance — adding a new module must require no core changes.
*   **Req-3:** No content can be duplicated — e.g. jira tooling must read decrypted templates from the installed package, not from copies.
*   **Req-4:** The decaf logger must be configured stderr-only at MCP boot under stdio transport; stdout is reserved for MCP JSON-RPC communication.
*   **Req-5:** All decaf conventions apply throughout: `@service()` services, `logCtx(args, method, true)` contextual logging, contextual args, decaf errors only, zero `console.*`, async/await.
*   **Req-6:** Encrypted artifacts are never committed — gitignore must cover generated encrypted outputs in `with-ai` (mirroring the legacy `/src/**/*.enc` policy); plaintext markdown stays committed in the repo.
*   **Req-7:** Secrets (Jira/Xray credentials, `ENCRYPTION_KEY`) remain out-of-band; never logged, never committed.
*   **Req-8:** A legacy-functionality inventory is an explicit deliverable: every legacy tool/prompt/resource/module mapped to its new home or an explicitly justified replacement.

## 4. Architecture & Design

Approved technical governance direction (CTO, 2026-09-02), grounded in a direct scan of both modules:

- **Package shape:** `with-ai` becomes a decaf-cli module package: `src/cli/*` commands auto-picked-up by `@decaf-ts/cli`, plus the detached MCP surface at `src/mcp/{jira,xray,common}`. Modular registration is preserved and formalized from the legacy `modules/jira/register.ts` pattern.
- **MCP runtime:** boot is its own CLI command; the MCP runtime is completely detached from the remaining CLI — no shared process-lifecycle state; MCP code must not import CLI command modules. Clients (Jira/Xray) are constructed **per tool request** with lazily-loaded credentials (user hard requirement); boot must never fail on missing/invalid credentials.
- **Jira surface:** preserve auth-providers, rate-limiting, and the ADF<->markdown conversion pipeline from the legacy `jira` module (~17 zod tool-input schemas, XrayClient, ticket-create flow); remove the `JIRA__PROJECT_KEY` restriction for multi-project access (exact config shape pending the user's answer).
- **Encryption:** replace the legacy `bin/obfuscate-prompts.cjs` (raw node crypto: `scryptSync` + AES-256-GCM with an out-of-band `ENCRYPTION_KEY`) with `@decaf-ts/crypto` `CryptoService.encrypt/decrypt`. Build-time encryption of all AI-value content for the public artifact; `.enc` outputs gitignored and never committed.
- **Skill installation:** the CLI installs skills for the various harnesses by symlinking to md files decrypted at install time inside the installed `@decaf-ts/with-ai` package.
- **MCP policy:** SDK tool annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) with server-level policy enforcement; destructive tools clearly displayed.
- **Testing strategy:** TS-level suites against the code; MCP inspector testing against the production-grade artifact (same mechanism as legacy `test:dist-assets` / `server:inspect*`); live Jira/Xray tests idempotent and self-reverting (create → verify → delete) with loud user-facing cleanup-failure warnings; maximum variant coverage against as few live issues as possible; Xray live tests created but run separately (user introduces credentials manually).
- **Feasibility:** the port is substantial but bounded (legacy `@decaf-ts/mcp-server` v1.15.2: ~187 TS files + ~431 asset files across `jira`, `agent` (GOAP + mistreevous behavior-tree runtime), `summarization`, `template-module` modules, tools, resources, prompts; target `@decaf-ts/with-ai` v3.10.17: minimal TS surface `src/bin/cli.ts` + `src/namespace/*` plus the authoritative markdown catalog). Recommended phased decomposition: foundation (CLI + crypto + build), jira module, xray module, common + registration, tests + inspector.

**Governance conditions (binding):**

1. The four open user questions (§6) remain unresolved questions until the user answers; record the answers as decisions when they land — do not bake in assumptions before then.
2. Every implementation child created under the domain root must carry specification `DECAF-51`.
3. TS-level tests plus inspector tests against the production artifact are acceptance criteria, not nice-to-haves.

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID           | Task Name                            | Priority | Status  | Dependencies |
|:-------------|:-------------------------------------|:---------|:--------|:-------------|
| DECAF-51-*   | Pending decomposition by the domain-root owner (CTO) after the user's scoping answers land; recommended phases per §4 (foundation: CLI+crypto+build; jira module; xray module; common+registration; tests+inspector) | Medium | Pending | User answers to §6 |

## 6. Open Questions / Risks

*   **Module disposition (unresolved — user):** disposition of legacy non-Jira MCP modules (agent GOAP runtime, summarization, decoration tools, server-info/repo-metadata, jsdoc/sprint/code prompts). Assumed dropped from the MCP surface with AI-valuable markdown ported into with-ai's authoritative catalog and GOAP orchestration replaced by with-ai skills + Paperclip orchestration — pending the user's answer; the record must carry the coverage validation that proves nothing user-facing is lost.
*   **Jira multi-project config shape (unresolved — user, technical decision to follow):** product intent is one Jira-instance credential set plus project selection at the tool/config level after `JIRA__PROJECT_KEY` removal; exact env/config schema is open.
*   **Package identity / deprecation (unresolved — user):** `@decaf-ts/with-ai` assumed to continue as the publishing identity with legacy `@decaf-ts/mcp-server` formally deprecated (final publish + deprecation notice), not silently dropped.
*   **Decryption-key distribution (unresolved — user):** the key is required for CLI skill decrypt/install; the distribution model (out-of-band vs. mechanism) is a launch-blocking operational decision still open.
*   **Risk:** the port is large (~187 TS files, ~431 assets); scope discipline requires the legacy-functionality inventory (Req-8) so "no functionality lost" is provable at the capability level.
*   **Risk:** live-instance test noise and cleanup failures — mitigated by the idempotent self-reverting test bar and loud cleanup-failure warnings (Req-4/§4 testing strategy).
*   **Risk:** stdout pollution would break stdio MCP transport — mitigated by the stderr-only logger constraint (Req-4).

## 7. Results & Artifacts

*   None yet (specification initialized 2026-09-02). Target artifacts: `with-ai/src/cli` command modules, `with-ai/src/mcp/{jira,xray,common}` with per-module self-registration, `@decaf-ts/crypto`-based build-time encryption, public encrypted npm artifact, symlinking skill installer, TS + inspector test suites, and the legacy-functionality inventory.
