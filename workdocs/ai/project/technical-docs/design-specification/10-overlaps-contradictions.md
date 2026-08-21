# 10 — Overlaps & Contradictions

This section consolidates the cross-spec overlaps and contradictions/tensions found across the source specifications. Each item is tagged with the DECAF ids involved and cross-linked to the Architecture Workbook's fuller treatment. The numbering mirrors [Architecture Workbook §11](../architecture-workbook/11-overlaps-contradictions.md) (B-codes) for traceability.

> These are observations from the specs, not verified against the live repo. Several are already acknowledged inside the specs; others are latent and flagged for reconciliation.

## A. Overlaps (cross-spec feature/contract duplication)

| ID | Overlap | Specs | Detail |
|:---|:--------|:------|:-------|
| A1 | `TypeORMAdapter.ts` shared modification site | DECAF-6 ⇄ DECAF-7 | Both touch driver switches + transactional CRUD routing. [WB §02](../architecture-workbook/02-core-persistence.md) |
| A2 | Filesystem coordination | DECAF-1 ⇄ DECAF-3 | Worker TASK-FS built on FilesystemAdapter/FsDispatch/FilesystemMultiLock. [WB §02](../architecture-workbook/02-core-persistence.md) |
| A3 | Task engine reuse | DECAF-14 ⇄ DECAF-1/12/22 | Migration task mode depends on TaskEngine; not cross-referenced. [WB §02](../architecture-workbook/02-core-persistence.md) |
| A4 | `KeycloakAuthHandler` two locations | DECAF-33 ⇄ DECAF-43 | Same class extended by two specs. [WB §04](../architecture-workbook/04-authorization.md) |
| A5 | `for-nest` auth wiring | DECAF-10 ⇄ DECAF-33 ⇄ DECAF-43 | Three specs touch `for-nest` auth without citing each other. [WB §03](../architecture-workbook/03-http-server-nest.md) |
| A6 | Shared `AxiosHttpAdapter`/`HttpAdapter` | DECAF-10 ⇄ DECAF-13 ⇄ DECAF-42 | One client used for live coverage, SSE fan-out. [WB §03](../architecture-workbook/03-http-server-nest.md) |
| A7 | SSE `/events`/`/sse` | DECAF-42 ⇄ DECAF-10 ⇄ DECAF-48 | Subscription mode reused by graph run feedback. [WB §03](../architecture-workbook/03-http-server-nest.md) |
| A8 | Graph subsystem division | DECAF-24/32/34/35/36/48 | Metadata/engine/catalogue/split/canvas/feedback with shared snapshot/rendering/backend contracts. [WB §06](../architecture-workbook/06-graph.md) |
| A9 | Mirror gating | DECAF-37 ⇄ DECAF-47 | Global flag + per-decorator predicate on same files/points. [WB §07](../architecture-workbook/07-fabric.md) |
| A10 | Provider model | DECAF-26 ⇄ DECAF-30 | Identical `ClientBasedService` lifecycle; DECAF-30 quotes DECAF-26. [WB §08](../architecture-workbook/08-platform-services.md) |
| A11 | MiniLogger ⇄ Context | DECAF-9 ⇄ DECAF-18 | Context supplies log tokens; `logCtx` contract both invoke. [WB §08](../architecture-workbook/08-platform-services.md) |
| A12 | Decorator parity & loading | DECAF-4 ⇄ DECAF-38 ⇄ DECAF-39 | Builders/loaders must accommodate feature-aware decorators. [WB §08](../architecture-workbook/08-platform-services.md) |
| A13 | Agent orchestration cluster | DECAF-17 ⇄ DECAF-19 ⇄ DECAF-20 ⇄ DECAF-45 | DECAF-20 merged into DECAF-17; DECAF-45 is the unmentioned user-input primitive. [WB §09](../architecture-workbook/09-agent-orchestration.md) |
| A14 | CI cluster | DECAF-27 ⇄ DECAF-29 | Same `reusable-actions` repo. [WB §10](../architecture-workbook/10-integrations-extras.md) |
| A15 | BI cluster | DECAF-40 ⇄ DECAF-41 | Same Kibana neighbourhood; Decaf-only error types; DECAF-41 depends on DECAF-9. [WB §10](../architecture-workbook/10-integrations-extras.md) |
| A16 | for-angular UI cluster | DECAF-25 ⇄ DECAF-44 ⇄ DECAF-45-frontend | Same Ionic/Angular + `for-angular` conventions/layout. [WB §10](../architecture-workbook/10-integrations-extras.md) |

## B. Contradictions & Tensions

| ID | Tension | Specs | Resolution status |
|:---|:--------|:------|:------------------|
| B1 | `maxConcurrentTransactions` no-op for for-typeorm | DECAF-7 | Documentation only. [§01](./01-persistence-design.md) |
| B2 | `--dry-run` compatibility-only (no persistence bypass) | DECAF-14 | Deliberate; document. [§01](./01-persistence-design.md) |
| B3 | Migration logic ownership moved out of `PersistenceService` | DECAF-14 | Done; contradicts prior assumption. [§01](./01-persistence-design.md) |
| B4 | `@pk` vs `@sequence` identity consistency | DECAF-11 | Adapters must prefer property-scoped only when present. [§01](./01-persistence-design.md) |
| B5 | DECAF-6 "Completed" vs pending TRIGGER/tests/docs | DECAF-6 | Status/wording tension. [§01](./01-persistence-design.md) |
| B6 | DECAF-3 TASK-26 status vs DECAF-1 reference | DECAF-3 ⇄ DECAF-1 | Minor inconsistency. [§01](./01-persistence-design.md) |
| B7 | `delete` naming: client method vs `@del` decorator | DECAF-10 vs DECAF-13 | Two conventions, two packages. [§02](./02-http-server-design.md) |
| B8 | Two parallel `for-nest` auth stories | DECAF-10 vs DECAF-33 | Need to merge ownership boundary. [§02](./02-http-server-design.md) |
| B9 | Two `keycloakAuthHandler.ts` locations | DECAF-33 vs DECAF-43 | Must reconcile (consumer/extension). [§03](./03-authorization-design.md) |
| B10 | `@allowIf`/`@blockIf` identical; relationship to `AuthzService` unstated | DECAF-10 ⇄ DECAF-33 | Unresolved. [§02](./02-http-server-design.md) |
| B11 | TaskEngine vs Graph Engine relationship implicit | DECAF-12/22 vs DECAF-32 | Layered, not composed; retry is a V1 non-goal for graph. [§04](./04-task-engine-design.md) |
| B12 | Graph metadata/engine split rationale | DECAF-24 vs DECAF-32 vs DECAF-35 | DECAF-35 fixes DECAF-32's bundle leak. [§05](./05-graph-design.md) |
| B13 | `@pinnable()` home | DECAF-32 vs DECAF-35 | Unresolved (ui-decorators vs engine/decorators). [§05](./05-graph-design.md) |
| B14 | Graph running colour: amber (§21.9) vs green (DECAF-48) | DECAF-32 vs DECAF-48 | CTO reconciliation needed. [§05](./05-graph-design.md) |
| B15 | Execution-state enum `BLOCKED`/`IDLE`/`DISABLED` | DECAF-32 vs DECAF-48 | Extend vs redefine tension. [§05](./05-graph-design.md) |
| B16 | Double-click semantics overlap | DECAF-32 vs DECAF-48 | DECAF-48 resolves (run-state dependent) but overlaps. [§05](./05-graph-design.md) |
| B17 | Loop node declarations in demo layer | DECAF-34 vs DECAF-35 | Recommend promote to `shared/nodes/`; unresolved. [§05](./05-graph-design.md) |
| B18 | Mirror suppression ordering/ownership | DECAF-37 vs DECAF-47 | Only "predicate first" fixed. [§06](./06-fabric-design.md) |
| B19 | Legacy promotion gate ownership | DECAF-2 vs DECAF-37 | `allowGatewayOverride` independent of `allowMirroring`; ambiguous. [§06](./06-fabric-design.md) |
| B20 | `SecretService` base class | DECAF-26 vs DECAF-30 | Should extend `ClientBasedService` (DECAF-30 resolves). [§07](./07-platform-services-design.md) |
| B21 | `logCtx` contract assumed before DECAF-18 locked | DECAF-18 vs DECAF-26/30 | DECAF-18 still Planned. [§07](./07-platform-services-design.md) |
| B22 | DECAF-4 status inconsistency | DECAF-4 | §5 Pending vs §7/§8 completion. [§07](./07-platform-services-design.md) |
| B23 | Agent dispatch ownership & config source | DECAF-17 vs DECAF-19 | Reconcile orchestrator vs manager; CLI vs canonical config. [§08](./08-agent-orchestration-design.md) |
| B24 | Agent result contracts not unified | DECAF-17 vs DECAF-19 | DECAF-17 has `confidence`; DECAF-19 does not. [§08](./08-agent-orchestration-design.md) |
| B25 | User-interaction ownership implicit/duplicated | DECAF-17 vs DECAF-45 | DECAF-45 not referenced by DECAF-17. [§08](./08-agent-orchestration-design.md) |
| B26 | Webhook vs agent-progress delivery | DECAF-15 vs DECAF-17 | Parallel mechanisms, never reconciled. [§09](./09-integrations-design.md) |
| B27 | Webhook model naming | DECAF-15 | `WebhookEventRecord` vs `WebHookEventRecord`. [§09](./09-integrations-design.md) |
| B28 | CI normalization aggressiveness | DECAF-27 vs DECAF-29 | Conservative vs full rule replication. [§09](./09-integrations-design.md) |
| B29 | Package-boundary rule rediscovered | DECAF-40 vs DECAF-45 | `integrations` DOM-free + backend-only; both rediscover. [§07](./07-platform-services-design.md) |

Back to [README](./README.md).
