---
recordSchemaVersion: 1
taskType: "specification"
paperclipIssue: "SAA-12"
paperclipIssueId: "5dace09a-a5e1-4365-8cc4-701dcc5a51f3"
paperclipIssueUrl: "/SAA/issues/SAA-12"
project: "decaf-ts"
specification: "DECAF-45"
specificationKey: "DECAF"
specificationRef: "45"
specificationPath: "workdocs/ai/project/specifications/DECAF_45.md"
planPath: "workdocs/ai/project/plan.md"
constitutionPath: "AGENTS.md"
jiraIssue: "none"
jiraIssueId: "none"
jiraUpdatedAt: "none"
jiraSyncState: "disabled"
createdAt: "2026-08-17T20:00:40Z"
updatedAt: "2026-08-17T20:06:30Z"
---

# DECAF-45: User Request Handling Engine

## Paperclip Snapshot

| Field | Value |
| --- | --- |
| Task type | `specification` |
| Status | in_progress |
| Priority | medium |
| Assignee | CEO (parent SAA-12) |
| Parent | none (domain root) |
| Blocked by | SAA-13 (documentation milestone), SAA-14 (implementation child) |
| Observed at | 2026-08-17T20:06:30Z |

Paperclip is authoritative for all lifecycle fields in this snapshot. The snapshot
was derived from Paperclip issue [SAA-12](/SAA/issues/SAA-12) and its child
[SAA-13](/SAA/issues/SAA-13) at the observed timestamp. Documentation milestone
[SAA-13](/SAA/issues/SAA-13) recorded both required approvals (Product Manager
scope via [SAA-17](/SAA/issues/SAA-17); CTO technical governance via
[SAA-18](/SAA/issues/SAA-18)) and the CEO-applied `delivery-docs` mapping via
courier [SAA-15](/SAA/issues/SAA-15); SAA-13 is closing as `done`. The parent
remains `blocked` on the implementation child [SAA-14](/SAA/issues/SAA-14).

## Overview

A backend/frontend-compatible **User Request Resolution Engine** for
`@decaf-ts/integrations`, exposed as new package exports `user-requests` and
`user-requests/shared`. In the backend, user input can be easily mocked and
embedded in backend operations/tests. In the frontend, a user request resolves
through arbitrary UI operations (screens/pages/popups, multi-step forms) until
final submission, returning the user's selection to the caller as a Promise. The
design supersedes the old glass-toolkit `core/requests` engine.

## Problem Statement

The legacy glass-toolkit engine coupled request dispatch to OpenDSU/db-decorators
`@injectable`, used callback-style handlers, registered UI handlers imperatively
in the wallet bootstrap (`registerInputHandlers`), and had no first-class
decorator for handler registration. It was hard to mock in pure backend Jest
tests and hard to test the UI path. A clean, framework-agnostic, decorator-driven
engine is needed in decaf-ts that is symmetric across backend (mocked) and
frontend (real UI) execution.

Affected users: application developers building on decaf-ts who need to drive
user interaction from backend operations/tests and from frontend UI flows with a
single, mockable contract. Evidence: the legacy glass-toolkit `core/requests`
module and glass-wallet `registerInputHandlers` bootstrap (see References).

## Stakeholders And Ownership

| Role | Owner | Responsibility |
| --- | --- | --- |
| Product | Product Manager | Scope and acceptance |
| Technical | CTO | Feasibility and architecture |
| Verification | QA Specialist | Independent validation (tests) |
| Documentation | Delivery Documentation Specialist | This domain record |

## Business Value And Success Measures

| Measure | Baseline | Target | Measurement method |
| --- | --- | --- | --- |
| Backend testability of user input | Not mockable in pure Node Jest | Mockable per request type under Node Jest with no DOM | integrations Jest suite |
| UI-driven resolution | Callback handlers registered imperatively; hard to test | Promise-based resolution driven through SteppedForm UI in a Jest harness | for-angular Jest suite |
| Framework symmetry | Backend and frontend paths diverge | Same handler code path executes in both backend (mocked) and frontend (UI) tests | Both test suites pass |

## Scope

### In Scope

- New `integrations/src/user-requests/` module + `user-requests/shared` subpath, wired into `integrations/package.json` `exports` (mirroring `./feature-flags` and `./graph/shared`).
- Core abstractions: `UserRequest<T>` model (id/type/payload), `UserRequestHandler<T>` interface (`handle`/`handleAsync` Promise-based), `UserRequestRegistry` (lookup + dispatch, multi-handler chaining), and a resolution context.
- `@userRequest('user-request-id')` decorator (analog to core's `@task(...)` / `@migration(...)`), built on `@decaf-ts/decoration` (`Decoration.for(...).define(...).apply()` and `metadata(...)`), registering handlers by keyed metadata.
- Backend adapter: a mockable resolver where the user response is preconfigured per request type (improves on `getBackendInputHandler`).
- Frontend adapter contract: a resolver that maps a request to UI code wrapped in a Promise (stepped forms/popups) and resolves with the user's submission.
- Unit tests (Jest, integrations) for the full backend layer including mocking the user's response.
- A new Angular test (in `for-angular`) executing the same code path but driving the real UI with the `SteppedFormComponent` (clicking/filling across steps until the handler closes).

### Out Of Scope

- Migrating the glass-wallet app to the new engine.
- OpenDSU / dsu-blueprint integration.
- New UI components beyond reusing the existing `SteppedFormComponent`.

## Functional Requirements

| ID | Requirement | Priority | Acceptance evidence |
| --- | --- | --- | --- |
| FR-1 | `@userRequest('id')` registers a handler class retrievable by id via metadata | Must | Unit test asserts registry lookup |
| FR-2 | `UserRequestRegistry.handleAsync(request)` resolves to the handler result | Must | Unit test |
| FR-3 | Backend resolver returns a preconfigured (mocked) response per request type | Must | Unit test with mocked response |
| FR-4 | Frontend resolver wraps UI execution in a Promise and resolves with submitted data | Must | Angular test fills SteppedForm and asserts resolved value |
| FR-5 | Same handler code path executes in both backend (mocked) and frontend (UI) tests | Must | Both tests pass |
| FR-6 | Package exports `user-requests` and `user-requests/shared` resolve | Must | Build/exports config + import test |

Acceptance evidence is the planned verification for each criterion. Actual
command output is recorded under Verification Evidence when the implementation
child ([SAA-14](/SAA/issues/SAA-14)) completes.

## Non-Functional Requirements

| ID | Area | Requirement | Verification |
| --- | --- | --- | --- |
| NFR-1 | Compatibility | Engine is UI-framework-agnostic; Angular is one frontend binding | Shared module has no Angular imports |
| NFR-2 | Testability | Backend path runs under Node Jest with no DOM | integrations jest passes |
| NFR-3 | Conventions | Follows decaf decoration patterns + integrations export layout | Review against feature-flags/graph |

## Architecture And Interfaces

- `user-requests/shared` (framework-agnostic): `UserRequest` model, `UserRequestHandler` / `IGlassRequestHandler`-style interface (Promise-first), `UserRequestRegistry`, `@userRequest` decorator + constants/types. No Angular.
- `user-requests` (backend + binding surface): backend `MockUserRequestResolver` / `getBackendInputHandler` successor; re-exports shared.
- Frontend binding lives in `for-angular` (or an angular-facing resolver) and uses `SteppedFormComponent` to render a multi-step form whose submit resolves the request Promise (mirrors glass-wallet `registerInputHandlers` -> `getWalletInputHandler`).
- Decorator modeled on `core/src/migrations/decorators.ts` (`Decoration.for(KEY).define({decorator,args}).apply()` + `Metadata.set`).

Compatibility constraints: the `shared` subpath must remain Angular-free (NFR-1).
Frontend binding location is decided: keep the frontend resolver + Angular spec in
`for-angular` importing `@decaf-ts/integrations/user-requests/shared`; do **not**
create a `user-requests/angular` subpath (CTO decision on [SAA-18](/SAA/issues/SAA-18)).
This keeps `integrations` Angular-free and buildable in pure-Node CI, and keeps
Angular concerns in `for-angular`, which already owns `SteppedFormComponent` and the
Jest/i18n harness. `user-requests/shared` is consumed by both the backend resolver in
`integrations/src/user-requests/` and the frontend resolver in `for-angular`.

## Data, Security, And Privacy

- Data model or migration: none. New module only; no persistence schema changes.
- Authorization and threat considerations: none. User requests are in-process
  resolution contracts; no new trust boundary introduced.
- Sensitive-data handling and retention: none specific to this engine. Handlers
  receive request payloads and return user selections in memory.

## Dependencies And Blockers

- [SAA-14](/SAA/issues/SAA-14) — implementation child (CTO-owned). Blocked by this documentation milestone [SAA-13](/SAA/issues/SAA-13). Provides acceptance evidence on completion. **Open** — parent SAA-12 remains blocked on this.
- [SAA-15](/SAA/issues/SAA-15) — courier to CEO to apply the parent `delivery-docs` mapping. **Done** — `delivery-docs` document applied on parent [SAA-12](/SAA/issues/SAA-12); paths resolve to real files.
- [SAA-17](/SAA/issues/SAA-17) — courier to Product Manager for product scope approval. **Done** — APPROVED (see Decisions and Verification Evidence).
- [SAA-18](/SAA/issues/SAA-18) — courier to CTO for technical governance / architecture sign-off. **Done** — APPROVED (see Decisions and Verification Evidence); also resolved the frontend-binding open question.

## Delivery And Rollback

1. Implement `user-requests/shared` abstractions + `@userRequest` decorator (T-1).
2. Implement backend mockable resolver (T-2) and integrations unit tests (T-3).
3. Wire `user-requests` and `user-requests/shared` into `integrations/package.json` `exports` (T-4).
4. Add the `for-angular` SteppedForm UI test driving real UI to resolution (T-5).
5. Rollback: remove the `user-requests` module and the two `exports` entries; the rest of integrations is unaffected because the module is additive.

## Observability And Operations

- Telemetry and logs: none required by this engine beyond standard decaf logging.
- Alerting and thresholds: none.
- Operational documentation: this domain record plus inline JSDoc on the public abstractions.

## Acceptance Criteria

- [ ] FR-1: `@userRequest('id')` registers a handler retrievable by id via metadata (unit test asserts registry lookup).
- [ ] FR-2: `UserRequestRegistry.handleAsync(request)` resolves to the handler result (unit test).
- [ ] FR-3: Backend resolver returns a preconfigured (mocked) response per request type (unit test with mocked response).
- [ ] FR-4: Frontend resolver wraps UI execution in a Promise and resolves with submitted data (Angular test fills SteppedForm and asserts resolved value).
- [ ] FR-5: Same handler code path executes in both backend (mocked) and frontend (UI) tests (both tests pass).
- [ ] FR-6: Package exports `user-requests` and `user-requests/shared` resolve (build/exports config + import test).
- [ ] NFR-1: `user-requests/shared` has no Angular imports.
- [ ] NFR-2: Backend path runs under Node Jest with no DOM (integrations jest passes).
- [ ] NFR-3: Follows decaf decoration patterns + integrations export layout (review against feature-flags/graph).
- [x] Product scope approval recorded from Product Manager (APPROVED on [SAA-17](/SAA/issues/SAA-17), 2026-08-17T20:05:15Z).
- [x] Technical governance approval recorded from CTO (APPROVED on [SAA-18](/SAA/issues/SAA-18), 2026-08-17T20:05:51Z); CTO also decided frontend binding stays in `for-angular`.

Acceptance criteria for FR-1..FR-6 and NFR-1..NFR-3 remain unchecked pending
implementation ([SAA-14](/SAA/issues/SAA-14)); their outcomes are recorded under
Verification Evidence when that child completes. The two documentation-gate
approvals are now recorded as outcomes.

## Verification Plan

| Check | Command or method | Expected result | Owner |
| --- | --- | --- | --- |
| Backend unit tests | `cd integrations && npm test` (jest, new user-requests suite) | Pass; FR-1, FR-2, FR-3, FR-5 (backend) green | CTO / executor |
| Frontend UI test | `cd for-angular && npm test` (jest, new SteppedForm spec) | Pass; FR-4, FR-5 (frontend) green | CTO / executor |
| Exports resolve | import `@decaf-ts/integrations/user-requests` and `/shared` | Both resolve (FR-6) | CTO / executor |
| Shared has no Angular | grep `@angular` in `integrations/src/user-requests/shared` | No matches (NFR-1) | CTO / executor |
| Domain record valid | `node <skill-root>/scripts/validate-domain-record.mjs workdocs/ai/project/specifications/DECAF_45.md` | Pass | Delivery Documentation Specialist |
| delivery-docs mapping resolves | parent SAA-12 `delivery-docs` document paths point to real files | Resolves | Delivery Documentation Specialist |

## Risks And Open Questions

| Item | Impact | Owner | Mitigation or resolution condition |
| --- | --- | --- | --- |
| Frontend binding location (`for-angular` vs new `user-requests/angular` subpath) | Affects package layout and import paths | CTO | **Resolved 2026-08-17** — CTO ([SAA-18](/SAA/issues/SAA-18)): keep the frontend binding in `for-angular`; do not create a `user-requests/angular` subpath. Keeps `integrations` Angular-free. |
| SteppedForm requires Ionic/Translate/i18n test harness (FakeLoader) | Angular test setup complexity | CTO / executor | Follow existing `crud-form.component.spec.ts` pattern |
| Acceptance evidence depends on implementation child SAA-14 | Cannot record outcomes until implementation completes | CTO | Record outcomes when SAA-14 completes via a verification milestone |

## Paperclip Work Breakdown

Internal children are tracked only in Paperclip and do not own separate domain
records.

| Paperclip child | Work item | Priority | Status snapshot | Blocked by |
| --- | --- | --- | --- | --- |
| [SAA-13](/SAA/issues/SAA-13) | Write SAA-12 specification (this domain record) | high | in_progress | PM scope approval, CTO tech approval |
| [SAA-14](/SAA/issues/SAA-14) | Implement user-requests engine + tests | high | blocked | SAA-13 |

## Decisions

| Date | Owner | Decision | Rationale |
| --- | --- | --- | --- |
| 2026-08-17 | CEO | Author specification DECAF-45 for the User Request Handling engine; supersede glass-toolkit `core/requests` | Supplied facts from codebase + reference research |
| 2026-08-17 | Delivery Documentation Specialist | Allocate local spec ref DECAF-45 (next after DECAF-44); SPECIFICATION_KEY=DECAF; Jira disabled | maintain-domain-docs disabled-mode local sequence allocation |
| 2026-08-17 | Product Manager (via [SAA-17](/SAA/issues/SAA-17)) | **Product scope APPROVED.** Tight additive scope; correct out-of-scope cuts; measurable success measures; acceptance criteria map to evidence; frontend-binding open question correctly deferred to CTO. | PM scope verdict recorded 2026-08-17T20:05:15Z |
| 2026-08-17 | CTO (via [SAA-18](/SAA/issues/SAA-18)) | **Technical governance / architecture APPROVED.** Decoration model, exports layout (`lib/types`/`lib/esm`/`lib/cjs` triple from `./feature-flags`), `SteppedFormComponent` target, no-collision additivity, backend/frontend symmetry, and security posture all verified against the codebase. | CTO governance verdict recorded 2026-08-17T20:05:51Z |
| 2026-08-17 | CTO (via [SAA-18](/SAA/issues/SAA-18)) | Frontend binding stays in `for-angular`; do **not** create a `user-requests/angular` subpath. `user-requests/shared` stays Angular-free and is consumed by the backend resolver in `integrations/src/user-requests/` and the frontend resolver in `for-angular`. | Keeps `integrations` Angular-free and buildable in pure-Node CI; matches existing core-vs-Angular split; consumers already import Angular bindings from `for-angular`. |

Implementation note for [SAA-14](/SAA/issues/SAA-14) (from CTO): frontend resolver + Angular spec live in `for-angular` importing `@decaf-ts/integrations/user-requests/shared`; backend resolver + unit tests live in `integrations/src/user-requests/` (re-exports shared); wire `./user-requests` and `./user-requests/shared` into `integrations/package.json` `exports`; keep `shared` free of any `@angular` import (NFR-1).

## Execution Log

### 2026-08-17T20:00:40Z - Delivery Documentation Specialist

- Checked out milestone [SAA-13](/SAA/issues/SAA-13); confirmed parent [SAA-12](/SAA/issues/SAA-12) `task-metadata` carries `taskType: specification` with Jira disabled.
- Resolved docs root to `workdocs/ai/project` in the decaf-ts project workspace (`/workspaces/decaf-ts`); SPECIFICATION_KEY=DECAF; allocated next local ref DECAF-45 (existing specs end at DECAF_44).
- Created this domain record from `assets/specification-template.md`, mirroring `taskType: specification` in frontmatter.
- Recorded CEO-supplied facts: overview, problem statement, stakeholders, scope, FR/NFR tables, architecture, task breakdown, references, and acceptance evidence plan.
- Defined acceptance criteria (unchecked, pending implementation and approvals) and the verification plan.
- Note: `scripts/validate-domain-record.mjs` is not present in the installed `maintain-domain-docs` skill directory in this environment, so the validator could not be executed; the record was validated manually against the template frontmatter and section contract.
- Next: create/update the parent `delivery-docs` issue document, then route Product Manager (scope) and CTO (technical governance) approvals via courier issues and block this milestone on them.
- Parent [SAA-12](/SAA/issues/SAA-12) is assigned to CEO, so the Documentation Specialist cannot PUT the `delivery-docs` document directly. Routed courier [SAA-15](/SAA/issues/SAA-15) to CEO with the exact document payload (content authored by the Documentation Specialist; CEO acts only as the permissions bridge).
- Routed approval couriers: [SAA-17](/SAA/issues/SAA-17) (Product Manager, scope) and [SAA-18](/SAA/issues/SAA-18) (CTO, technical governance). Blocked SAA-13 on SAA-15, SAA-17, and SAA-18.
- `delivery-docs` mapping content authored and attached to courier SAA-15; pending CEO application.

### 2026-08-17T20:06:30Z - Delivery Documentation Specialist

- Wake `issue_children_completed` (children empty; `blockedBy` couriers all `done`): [SAA-15](/SAA/issues/SAA-15) (CEO mapping), [SAA-17](/SAA/issues/SAA-17) (PM scope), [SAA-18](/SAA/issues/SAA-18) (CTO governance) all resolved `done`.
- Confirmed parent [SAA-12](/SAA/issues/SAA-12) `delivery-docs` document now exists (applied via courier SAA-15); body resolves to `AGENTS.md`, `workdocs/ai/project/plan.md`, and this record `workdocs/ai/project/specifications/DECAF_45.md` — all real files. Mapping notes record disabled-mode local allocation; no Jira fields referenced.
- Read and recorded both approval verdicts:
  - Product Manager (SAA-17, 2026-08-17T20:05:15Z): product scope **APPROVED**. Added a Decisions row and checked the Product-scope acceptance criterion.
  - CTO (SAA-18, 2026-08-17T20:05:51Z): technical governance / architecture **APPROVED** against the codebase (decoration model, exports triple, SteppedFormComponent target, no collision, symmetry, security). Added a Decisions row and checked the Technical-governance acceptance criterion.
- CTO also resolved the open question on [SAA-18](/SAA/issues/SAA-18): frontend binding stays in `for-angular`; no `user-requests/angular` subpath. Updated Architecture And Interfaces, the Risks And Open Questions table, and added a Decisions row plus an implementation note for [SAA-14](/SAA/issues/SAA-14).
- `validate-domain-record.mjs` remains absent from the installed `maintain-domain-docs` skill directory in this environment (no `scripts/` directory shipped); validation stays manual against the template frontmatter and section contract. Recorded in Verification Evidence.
- Jira gate: `JIRA_ENABLED` is not `true` → no Jira discovery, mention, handoff, or call. `jiraSyncState` stays `disabled`.
- Closing documentation milestone [SAA-13](/SAA/issues/SAA-13) as `done`: domain record complete, both approvals recorded, `delivery-docs` mapping resolves. Parent [SAA-12](/SAA/issues/SAA-12) remains `blocked` on implementation child [SAA-14](/SAA/issues/SAA-14); acceptance evidence for FR/NFR will be recorded by a future verification milestone when SAA-14 completes.

## Changed Artifacts

| Path | Purpose |
| --- | --- |
| `workdocs/ai/project/specifications/DECAF_45.md` | New specification domain record for the User Request Handling engine |

## Verification Evidence

| Time | Executor | Check | Result | Evidence |
| --- | --- | --- | --- | --- |
| 2026-08-17T20:00:40Z | Delivery Documentation Specialist | Manual validation of frontmatter + section contract against `specification-template.md` | Pass | Record created from template; `taskType: specification` mirrored; required paths and IDs populated |
| 2026-08-17T20:00:40Z | Delivery Documentation Specialist | `validate-domain-record.mjs` | Not run | Validator script absent from installed skill directory in this environment |
| 2026-08-17T20:05:15Z | Product Manager (courier [SAA-17](/SAA/issues/SAA-17)) | Product scope review of DECAF-45 | **APPROVED** | PM verdict: tight additive scope; correct out-of-scope cuts; measurable success measures; acceptance criteria map to evidence; open question deferred to CTO |
| 2026-08-17T20:05:51Z | CTO (courier [SAA-18](/SAA/issues/SAA-18)) | Technical governance / architecture review of DECAF-45 against decaf-ts codebase | **APPROVED** | CTO verdict: decoration model, exports layout (`./feature-flags` triple), `SteppedFormComponent` target, no collision, backend/frontend symmetry, security posture all verified; frontend-binding open question resolved (stay in `for-angular`) |
| 2026-08-17T20:06:30Z | Delivery Documentation Specialist | Parent `delivery-docs` mapping resolves to real files | Pass | [SAA-15](/SAA/issues/SAA-15) applied the mapping on parent [SAA-12](/SAA/issues/SAA-12); body lists `AGENTS.md`, `workdocs/ai/project/plan.md`, `workdocs/ai/project/specifications/DECAF_45.md` — all present |
| 2026-08-17T20:06:30Z | Delivery Documentation Specialist | `task-metadata` vs domain-record `taskType` agreement | Pass | Both `specification`; canonical `task-metadata` on parent SAA-12 |
| 2026-08-17T20:06:30Z | Delivery Documentation Specialist | `validate-domain-record.mjs` (completion gate) | Not run | Validator script still absent from installed skill directory in this environment; manual validation re-confirmed against template contract |

Acceptance evidence (integrations jest, for-angular jest, exports/import) is
recorded here when [SAA-14](/SAA/issues/SAA-14) completes.

## Result

Documentation milestone [SAA-13](/SAA/issues/SAA-13) complete. DECAF-45 is the
approved specification for the User Request Handling engine:

- Both required approvals recorded: Product Manager scope **APPROVED**
  ([SAA-17](/SAA/issues/SAA-17)); CTO technical governance / architecture
  **APPROVED** ([SAA-18](/SAA/issues/SAA-18)).
- CTO resolved the frontend-binding open question: keep the frontend resolver +
  Angular spec in `for-angular`; no `user-requests/angular` subpath.
- Parent `delivery-docs` mapping applied on [SAA-12](/SAA/issues/SAA-12) via
  courier [SAA-15](/SAA/issues/SAA-15) and resolves to real files.
- Domain record `workdocs/ai/project/specifications/DECAF_45.md` mirrors
  `taskType: specification` and agrees with the parent `task-metadata`.
- `validate-domain-record.mjs` is not shipped in the installed skill directory in
  this environment, so validation is manual against the template contract (noted).

Remaining (out of scope for this milestone): acceptance evidence for FR-1..FR-6
and NFR-1..NFR-3 is pending implementation child [SAA-14](/SAA/issues/SAA-14);
parent [SAA-12](/SAA/issues/SAA-12) stays `blocked` on SAA-14 and will be advanced
by a future verification milestone when SAA-14 completes.
