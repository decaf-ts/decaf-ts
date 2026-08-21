# 11 — Overlaps & Contradictions

This section consolidates the **cross-spec overlaps** (features/contracts appearing in more than one spec) and **contradictions/tensions** (disagreements on naming, ownership, responsibility, lifecycle, or approach) found while digesting the 47 in-scope specifications. Each item is tagged with the DECAF ids involved and where it is discussed in the workbook.

> These are **observations from the specs**, not verified against the live repo. Several are already acknowledged inside the specs themselves; others are latent and flagged for reconciliation.

---

## A. Cross-Spec Overlaps

### A1. `TypeORMAdapter.ts` shared modification site — DECAF-6 ⇄ DECAF-7
Both modify `for-typeorm/src/TypeORMAdapter.ts`: DECAF-6 (driver-specific `createDatabase`/`createNotifyFunction` switches, `TypeORMStatement` query builder) and DECAF-7 (`transactionLock()` override, `getRepository(m, ctx)` helper, CRUD routing through the transactional `EntityManager`). DECAF-7's CRUD routing interacts with DECAF-6's multi-driver query paths since both touch `create`/`read`/`update`/`delete` and the query builder. See [02](./02-core-persistence.md).

### A2. Filesystem coordination — DECAF-1 ⇄ DECAF-3
DECAF-1 reuses DECAF-3's `FilesystemAdapter`/`FsDispatch`/`FilesystemMultiLock` for cross-thread persistence coordination. DECAF-1's worker TASK-FS is built directly on DECAF-3's surface. See [02](./02-core-persistence.md), [05](./05-task-engine.md).

### A3. Task engine reuse — DECAF-14 ⇄ (DECAF-1/12/22)
DECAF-14's task-mode migration (`MigrationTaskBuilder` wrapping `CompositeTaskBuilder`, per-version chaining, `track`/`retry`) depends on the TaskEngine that DECAF-1/12/22 harden, though none quotes the others' DECAF id. See [02](./02-core-persistence.md), [05](./05-task-engine.md).

### A4. `KeycloakAuthHandler` in two places — DECAF-33 ⇄ DECAF-43
Same conceptual class extended by two specs: DECAF-43 (`integrations/src/nest/keycloakAuthHandler.ts`, local token verification) and DECAF-33 (`nest/keycloakAuthHandler.ts`, extended to recognize namespace-scoped roles). See [04](./04-authorization.md).

### A5. `for-nest` auth wiring — DECAF-10 ⇄ DECAF-33 ⇄ DECAF-43
DECAF-10 creates `for-nest/src/auth/` (`DecafAuthModule.forRoot`, `AuthInterceptor`, `DecafAuthHandler`, `@Auth()`). DECAF-33 requires `KeycloakAuthHandler` to understand namespace roles and `for-nest` to consume namespace metadata. DECAF-43 validates tokens in the Nest integration layer. Three specs touch `for-nest` auth without citing each other. See [03](./03-http-server-nest.md), [04](./04-authorization.md).

### A6. `AxiosHttpAdapter`/`HttpAdapter` shared client — DECAF-10 ⇄ DECAF-13 ⇄ DECAF-42
DECAF-13 ships the REST helpers; DECAF-10 uses `AxiosHttpAdapter` for live integration coverage (TASK-180/TASK-185, `/sse`); DECAF-42 uses 5+ `HttpAdapter` observers for SSE fan-out correctness. See [03](./03-http-server-nest.md).

### A7. SSE `/events`/`/sse` — DECAF-42 ⇄ DECAF-10 ⇄ DECAF-48
DECAF-42 adds subscription mode; DECAF-10 TASK-180/TASK-185 exercise server-emitted events per model operation; DECAF-48 reuses DECAF-42 subscription mode keyed by `{runId, ownerUser}`. See [03](./03-http-server-nest.md), [06](./06-graph.md).

### A8. Graph subsystem division — DECAF-24/32/34/35/36/48
The graph subsystem is split: DECAF-24 (metadata + Angular adapter), DECAF-32 (engine + rendering contract + node-edit modal + snapshot extensions + NestJS backend + ALFRED §22), DECAF-34 (node catalogue — documentation), DECAF-35 (package split of DECAF-32's code into `shared`/`engine`), DECAF-36 (canvas save/undo + backend services), DECAF-48 (logging/visual feedback/inspection). Shared artefacts: snapshot model (DECAF-32 §20.4 reused by 36/48), rendering contract (DECAF-32 §21 re-stated by 34/48), node-edit modal (DECAF-32 §20 vs DECAF-48 §4.7), NestJS backend (DECAF-32 TASK-224 refactored by DECAF-36), frontend/backend boundary (DECAF-35 enforced; DECAF-36 NFR-5/DECAF-48 require it). See [06](./06-graph.md).

### A9. Mirror gating — DECAF-37 ⇄ DECAF-47
Global `allowMirroring` flag (DECAF-37) + per-decorator `allow(context)` predicate (DECAF-47) touch the same files and execution points. DECAF-47 complements DECAF-37; bypass order is "predicate first." See [07](./07-fabric.md).

### A10. Provider model — DECAF-26 ⇄ DECAF-30
Identical `ClientBasedService` lifecycle; DECAF-30 explicitly quotes DECAF-26 as the template. See [08](./08-platform-services.md).

### A11. MiniLogger ⇄ Context transition — DECAF-9 ⇄ DECAF-18
DECAF-9 renders `{context}`/`{correlationId}` tokens; DECAF-18 formalizes the `Context` that supplies them and the `logCtx` contract both DECAF-26/30 invoke. See [08](./08-platform-services.md).

### A12. Decorator parity & loading — DECAF-4 ⇄ DECAF-38 ⇄ DECAF-39
DECAF-4 makes decorators expressible via builders; DECAF-38 dynamically loads decorated classes preserving metadata; DECAF-39 adds feature-aware decorators that builders/loaders must accommodate. See [08](./08-platform-services.md).

### A13. Agent orchestration cluster — DECAF-17 ⇄ DECAF-19 ⇄ DECAF-20 ⇄ DECAF-45
DECAF-20 merged into DECAF-17; DECAF-19 refines DECAF-17's `--goap` path; DECAF-45's User Request Engine is the natural primitive for DECAF-17's manager user-interaction relay (not cross-referenced). See [09](./09-agent-orchestration.md).

### A14. CI cluster — DECAF-27 ⇄ DECAF-29
Same `reusable-actions` repo; DECAF-27 inventories/extracts, DECAF-29 normalizes triggers and produces the rule matrix. See [10](./10-integrations-extras.md).

### A15. BI cluster — DECAF-40 ⇄ DECAF-41
Same `integrations/src/kibana` neighbourhood; shared constraint that runtime code throws only Decaf error types and uses the `integrations` subpath convention. DECAF-41 also depends on DECAF-9's `LogParameterRegistry`. See [10](./10-integrations-extras.md).

### A16. for-angular UI cluster — DECAF-25 ⇄ DECAF-44 ⇄ DECAF-45-frontend
All depend on the same Ionic/Angular + `for-angular` conventions and `src/lib` vs `src/app` layout. See [10](./10-integrations-extras.md).

---

## B. Contradictions & Tensions

### B1. `maxConcurrentTransactions` no-op for for-typeorm — DECAF-7
`maxConcurrentTransactions` is a no-op for `for-typeorm` because `TypeORMContextLock` overrides `begin`/`commit`/`rollback` without calling `super` — concurrency delegated to Postgres. Tension with the expectation that the flag universally caps concurrency; resolved by documentation only. See [02](./02-core-persistence.md).

### B2. `--dry-run` semantics — DECAF-14
`--dry-run` survives CLI/config parsing precedence but no longer bypasses runtime persistence. Deliberate contradiction of the intuitive meaning of "dry run"; must be documented. See [02](./02-core-persistence.md).

### B3. Migration logic ownership — DECAF-14
Migration orchestration logic moved **out of** `PersistenceService` into `MigrationService` (`migrateAdapters`/`migrateNormally`/`migrateViaTasks`), contradicting any prior assumption that `PersistenceService` owns migrations. See [02](./02-core-persistence.md).

### B4. `@pk` vs `@sequence` identity — DECAF-11
`@pk` conceptually becomes a wrapper around `@sequence` while preserving exact legacy behaviour. Adapters must consistently prefer the property-scoped lookup only when present. See [02](./02-core-persistence.md).

### B5. DECAF-6 "Completed" vs pending tasks
DECAF-6 marked Completed yet lists pending TRIGGER mode (TASK-34), multi-instance listener (TASK-35), driver tests (TASK-38), docs (TASK-39), and partial unified query building (TASK-37). The multi-driver *refactor* is complete; the *event-dispatch* and *test/doc* surface is not. See [02](./02-core-persistence.md).

### B6. DECAF-3 locking task status
DECAF-3 marked Completed but TASK-26 (filesystem locking & multi-process consistency) listed In Progress, while DECAF-1 references `FilesystemMultiLock` as already providing that locking. Minor status inconsistency. See [02](./02-core-persistence.md).

### B7. `delete` naming — DECAF-10 vs DECAF-13
DECAF-13 ships `HttpAdapter.delete(...)` (method). DECAF-10 ships `@del` (decorator, because `@delete` mis-parses TS1359). Same concept name, two packages, two conventions. See [03](./03-http-server-nest.md).

### B8. `for-nest` auth module vs namespace handler — DECAF-10 vs DECAF-33
Two parallel auth-module stories (structural `DecafAuthModule` from DECAF-10; Keycloak+namespace handler extension from DECAF-33) need merging into a single ownership boundary. Neither spec cites the other. See [03](./03-http-server-nest.md), [04](./04-authorization.md).

### B9. `KeycloakAuthHandler` ownership — DECAF-33 vs DECAF-43
Two `keycloakAuthHandler.ts` locations (`integrations/src/nest/` vs DECAF-33's `src/nest/`) must be reconciled (DECAF-33's is the consumer/extension) to avoid a duplicate-handler situation like DECAF-10's audit finding #2. See [04](./04-authorization.md).

### B10. `allowIf`/`@blockIf` semantic identity & relationship to AuthzService — DECAF-10 ⇄ DECAF-33
The two decorators are byte-for-byte identical (TASK-169 open: intentional vs latent bug; zero callers in repo). DECAF-33's `AuthzService.canAccess`/`requireAccess` does not reference them; the relationship (deprecation vs coexistence) is unstated. See [03](./03-http-server-nest.md), [04](./04-authorization.md).

### B11. TaskEngine vs Graph Execution Engine — DECAF-12/22 vs DECAF-32
Layered, not competing, but the relationship is implicit. Both share orchestration primitives (dependency gating, locks, concurrency, retry) at different abstraction layers; no spec declares how (or whether) the graph engine reuses TaskEngine's machinery. DECAF-32 §3 lists "retry/backoff engine" as a V1 non-goal. See [05](./05-task-engine.md), [06](./06-graph.md).

### B12. Graph metadata/engine split rationale — DECAF-24 vs DECAF-32 vs DECAF-35
DECAF-24 put canonical metadata in `ui-decorators/graph`; DECAF-32 put the engine in `integrations/graph` but initially shipped metadata + engine in one bundle (letting the for-angular demo import the engine into the browser); DECAF-35 exists to fix that leak via `./shared` vs `./graph`. See [06](./06-graph.md).

### B13. `@pinnable()` home — DECAF-32 vs DECAF-35
DECAF-32 says preferred home `ui-decorators/graph`, temporary in `integrations/graph`. DECAF-35 §4.1 moves it to `engine/decorators.ts` (backend-only). Long-term correct home unresolved. See [06](./06-graph.md).

### B14. Graph colour semantics — DECAF-32 §21.9 vs DECAF-48
DECAF-32 §21.9: running=amber, succeeded=green, failed=red, cached=indigo, pinned=purple. DECAF-48 brief: running=green, blocked=yellow, errored=red for the live overlay. Direct contradiction on the `running` colour; flagged for CTO reconciliation (revise §21.9 vs layer the overlay); `cached`/`pinned` preserved. See [06](./06-graph.md).

### B15. Graph execution-state enum — DECAF-32 vs DECAF-48
DECAF-32 `GraphExecutionStatus` has no `BLOCKED`; DECAF-48 introduces `BLOCKED`/`IDLE`/`DISABLED` and moves the enum into `shared/constants.ts`. Tension over whether this extends or redefines DECAF-32's enum. See [06](./06-graph.md).

### B16. Graph double-click semantics — DECAF-32 vs DECAF-48
DECAF-32 §20/§21.11: double-click opens the edit modal. DECAF-48 §4.7: double-click is run-state-dependent (already-ran → I/O inspection; not-ran → edit modal). DECAF-48 resolves the conflict but overlaps the DECAF-32 gesture. See [06](./06-graph.md).

### B17. Loop node declaration location — DECAF-34 vs DECAF-35
Loop nodes live in the for-angular demo layer, not `integrations/src/graph/nodes/`; both recommend promoting to `shared/nodes/` — unresolved. `core.flow.break` is a Decaf addition with no ALFRED-5 alias (catalogue extension). See [06](./06-graph.md).

### B18. Mirror suppression ordering — DECAF-37 vs DECAF-47
Two parallel mirror-suppression mechanisms (global flag vs per-decorator predicate) create an ordering/ownership question. Only fixed rule is "predicate first"; `allow(context)` is synchronous (async guard would need a broader contract change). See [07](./07-fabric.md).

### B19. Legacy promotion gate ownership — DECAF-2 vs DECAF-37
DECAF-2 ties legacy submission promotion to mirror/`allowGatewayOverride`; DECAF-37 keeps `allowGatewayOverride` independent of `allowMirroring`. Ambiguity over which gate owns legacy promotion when mirroring is disabled. See [07](./07-fabric.md).

### B20. `SecretService` base class — DECAF-26 vs DECAF-30
DECAF-26 oscillates between `Service` and `ClientBasedService` as the base; DECAF-30 resolves unambiguously (`BlobStoreService extends ClientBasedService`). The abstract provider-agnostic service should extend `ClientBasedService`. Also `config`/`client` getter redeclaration divergence (abstract readonly property vs inherited final getter). See [08](./08-platform-services.md).

### B21. Context lifecycle assumed before locked — DECAF-18 vs DECAF-26/30
DECAF-18 (context transition) is still Planned, yet DECAF-26/30 services already rely on a stable `logCtx` contract that DECAF-18 has not finalized. See [08](./08-platform-services.md).

### B22. DECAF-4 status inconsistency
§5 marks TASK-14 (ui), TASK-15 (crypto), TASK-23 (for-nest) Pending yet §7/§8 claim completion. See [08](./08-platform-services.md).

### B23. Agent execution-model ownership — DECAF-17 vs DECAF-19
DECAF-17: `orchestrator` owns per-task orchestration, `manager` owns concurrent coordination; `--goap` is a CLI flag. DECAF-19: `manager` is sole user-facing component, solvers return results *to the manager*; execution mode is a canonical-config flag. Mild tension over dispatch ownership and config source. See [09](./09-agent-orchestration.md).

### B24. Agent result contracts not unified — DECAF-17 vs DECAF-19
DECAF-17 has a `confidence` field (threshold default 50); DECAF-19's structured result (`executionMode`, `terminalStatus`, `failureDetails`, …) has none. The two result contracts are not unified. See [09](./09-agent-orchestration.md).

### B25. User-interaction ownership implicit/duplicated — DECAF-17 vs DECAF-45
DECAF-17's manager surfaces blockers/questions and routes user replies; DECAF-45 provides the general `UserRequestRegistry`/`SteppedFormUserRequestResolver` for exactly that pattern but is not referenced by DECAF-17. See [09](./09-agent-orchestration.md).

### B26. Webhook vs agent-progress delivery — DECAF-15 vs DECAF-17
Webhook delivery (event→HTTP, persistent records, retry) vs agent progress (tool→MCP-notification, streaming) are conceptually parallel progress/delivery mechanisms never reconciled. See [10](./10-integrations-extras.md).

### B27. Webhook model naming — DECAF-15
`for-http` uses `WebhookEventRecord.ts`; the `for-nest` mirror file is `WebHookEventRecord.ts` (camel-cased differently). See [10](./10-integrations-extras.md).

### B28. CI normalization aggressiveness — DECAF-27 vs DECAF-29
DECAF-27 keeps the reuse boundary conservative; DECAF-29 normalizes triggers/conditions action-by-action. Tension between conservative migration and full rule replication (acknowledged in DECAF-29 risks). See [10](./10-integrations-extras.md).

### B29. Package-boundary rule rediscovered — DECAF-40 vs DECAF-45
`integrations` is simultaneously "DOM-free Node package that hosts browser-plugin installers" (DECAF-40) and "backend-only, forbidden as a `for-angular` dependency" (DECAF-45). A consistent but sharp package-boundary rule both specs independently rediscover (DECAF-45's canonical user-requests source moved to `ui-decorators` because of it). See [08](./08-platform-services.md), [09](./09-agent-orchestration.md), [10](./10-integrations-extras.md).

---

Continue to [Appendix A — Specification Index](./appendix-spec-index.md).
