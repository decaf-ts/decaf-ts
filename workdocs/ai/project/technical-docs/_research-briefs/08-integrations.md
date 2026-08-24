# Integrations — Research Brief (R8)

Scope: the `integrations` package in the decaf-ts monorepo (`/workspaces/decaf-ts/integrations`).
Subsystems reviewed: BlobStoreService providers, SecretService providers, Keycloak, Kibana + index builder, feature flags, namespaces, Nest auth, object loader, BI plugins (Kibana/Superset), graph engine, user-requests, plus the shared/docker helpers.

This is a read-only review. No tests or builds were run; no source/test files were modified. Every claim below is grounded in the actual source/tests; inaccuracies cite `file:line` evidence. Existing doc versions were ignored as instructed and judged against the code.

---

### integrations (`@decaf-ts/integrations` v0.7.0)

#### 1. Identity

- **Directory:** `/workspaces/decaf-ts/integrations`
- **Package name:** `@decaf-ts/integrations` (`package.json:2`)
- **Version:** `0.7.0` (`package.json:3`)
- **Type:** ESM (`"type": "module"`, `package.json:4`); `main` = `lib/index.js`, `types` = `lib/index.d.mts` (`package.json:5-6`)
- **Description:** `package.json` has **no** `description` field. The root barrel self-describes the package as "Package entry point for shared integration helpers" (`src/index.ts:4`); the README summary is "`@decaf-ts/integrations` centralizes reusable helpers for Keycloak, Kibana, Nest-style auth, and org-based authorization scaffolding" (`README.md:3`).
- **Subpath exports** (`package.json:7-316`): `.` (utils/namespaces/feature-flags), `./kibana`, `./docker`, `./keycloak`, `./nest`, `./nest/graph`, `./loader`, `./namespaces`, `./feature-flags`, `./user-requests`, `./secrets` + per-provider secret subpaths, `./blob` + per-provider blob subpaths, `./graph`, `./graph/shared`, `./plugins`, `./plugins/kibana`, `./plugins/superset`.

#### 2. Purpose & role

`@decaf-ts/integrations` is the cross-cutting "glue" package of the Decaf workspace: it bundles integration helpers that sit *above* the core persistence/transport layer and *below* application code. It provides provider-agnostic abstractions for binary blobs and secrets (with pluggable cloud/local backends), provisioning helpers for Keycloak (auth) and Kibana (BI), a NestJS-friendly auth handler that turns Keycloak JWTs into Decaf request contexts, an org-based multi-tenant authorization scaffold (namespaces) backed by Postgres + RLS, declarative feature flags, a dynamic object loader, a reference graph-workflow execution engine (with sandboxed code execution), and BI dashboard embed plugins (Kibana/Superset). Consumers import only the subpaths they need; cloud SDKs are optional dependencies so a consumer pays only for the providers it uses (`README.md:29`, `package.json:421-433`).

#### 3. Dependencies

- **Decaf runtime deps** (`package.json:358-376`): `@decaf-ts/core`, `@decaf-ts/crypto`, `@decaf-ts/db-decorators`, `@decaf-ts/decoration`, `@decaf-ts/decorator-validation`, `@decaf-ts/injectable-decorators`, `@decaf-ts/logging`, `@decaf-ts/transactional-decorators`, `@decaf-ts/ui-decorators`.
- **Key external deps:** `axios` (Keycloak/Kibana HTTP), `acorn`/`acorn-walk` + `typescript` (graph code-sandbox AST validation/transpilation), `isolated-vm` (graph sandboxed code execution), `node-fetch`, `uuid`, `tslib`.
- **Optional cloud SDKs** (`package.json:421-433`): `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/client-secrets-manager`, `@azure/identity`, `@azure/keyvault-secrets`, `@azure/storage-blob`, `@google-cloud/secret-manager`, `@google-cloud/storage`, `kubo-rpc-client` (IPFS), `keycloak-admin`, `hashicorp-vault`, `onelogin-node`.
- **Peer deps** (`package.json:396-412`): `@decaf-ts/as-zod`; optional peers `@decaf-ts/for-http`, `@decaf-ts/for-nest`, `jose`.
- **Modules that depend on it:** consumed from the Decaf workspace by Nest-based apps (`for-nest` peers), and indirectly by anything using the graph engine, namespaces scaffold, or BI plugins. (Within this read-only review of `integrations/` alone, no in-repo dependents were enumerated.)

#### 4. Architecture & structure

`src/` is organized by subsystem, each behind its own barrel and subpath export; the root `src/index.ts` re-exports only `./utils`, `./namespaces`, and `./feature-flags` (`src/index.ts:6-8`) plus build-time version placeholders (`src/index.ts:10-16`).

- **`src/blob/`** — `core/` (abstract `BlobStoreService`, `BlobStoreFactory`, `BlobKey`/`BlobValue`/`BlobTypes`/`BlobErrors`) and one folder per provider: `local`, `s3` (with `Minio`/`R2` marker subclasses), `azure`, `gcp`, `ipfs` (with a pluggable `IpfsKeyIndex` and memory/postgres/local-json backends), `memory`. Provider implementations are intentionally *not* re-exported from the core blob barrel (`src/blob/index.ts:4-7`).
- **`src/secrets/`** — `core/` (abstract `SecretService`, name/reference/serialization/errors), a `model/` provider (encrypted-at-rest via `@decaf-ts/crypto`), and cloud providers `aws`, `azure`, `gcp`, `vault`, `onepassword`. No factory/registry — each provider is constructed directly.
- **`src/keycloak/`** — `services/` (six `ClientBasedService` classes: realm, user, role, client, identity-provider, auth) plus an orchestrator `KeycloakService`, `broker.ts`, `types.ts`, and an internal `runtime.ts` production resolver.
- **`src/kibana/`** — `services/` (space, data-view, role, user, dashboard, auth + orchestrator `KibanaService`), `builders/` (`KibanaIndexBuilder` + `KibanaIndexBuilderCollection`), `helpers.ts`, `types.ts`, internal `runtime.ts`.
- **`src/feature-flags/`** — `models/` (`FeatureFlag`, `FeatureFlagAccess`), `readers/` (abstract `FeatureFlagReader` + `EnvironmeFlagReader`), `services/FeatureFlag.service.ts`, `decorators.ts`, `environment.ts`, `constants.ts`, `types.ts`, `utils.ts`.
- **`src/namespaces/`** — `models/` (21 authorization models), `services/` (24 repository-backed services incl. `AuthzService`, `BootstrapService`, `SystemManagementService`), `types.ts`, `utils.ts` (`BaseModelService` base), plus three legacy monolith files (`org-based-authorization-system*.ts`) that are not exported. SQL artifacts live in `sql/`.
- **`src/nest/`** — `keycloakAuthHandler.ts`, `keycloakModule.ts`, `decorators.ts` (`namespace()`), `utils.ts` (JWT extraction), `types.ts`, `logging.ts`, and `graph/` (NestJS graph execution backend: controller, module, services, models, registry factory, `main.ts` bootstrap).
- **`src/loader/`** — `ObjectLoader.ts`, `families.ts` (8 family loaders), `types.ts`.
- **`src/graph/`** — `engine/` (execution, planning, pinning, store, loops, registry, events, snapshots, validation, errors, constants, decorators, types) and `shared/` (frontend-safe node declarations + `GraphExecutionStateMapper`) and `log/` (`GraphRunLogger`).
- **`src/plugins/`** — `contract.ts` (DOM-free `DashboardEmbedPlugin`), `kibana/` and `superset/` (host/installer/manifest/templates/types per tool).
- **`src/docker/`** — `DockerComposeService.ts`. **`src/user-requests/`** — a one-line passthrough re-export of `@decaf-ts/ui-decorators/user-requests`. **`src/shared/runtime.ts`** — JSON body parsing helpers.

#### 5. Public API surface

Major exported symbol groups, by subpath (summarized; not exhaustive):

- **`.` (root)** — `utils` helpers; `namespaces` (types/utils/models/services); `feature-flags`; `VERSION`/`COMMIT`/`FULL_VERSION`/`PACKAGE_NAME` build placeholders (`src/index.ts:6-16`).
- **`./blob` (core)** — `BlobStoreService` (abstract: `initialize/put/get/has/stat/delete/copy/list/url`), `BlobStoreFactory`, `BlobKey`/`BlobValue` helpers, `BlobTypes` (configs/results/options + `BlobProvider` union), `BlobErrors` + `translateBlobError` (`src/blob/core/index.ts:6-11`). Per-provider subpaths export the concrete services: `./blob/s3` (`S3BlobStoreService`/`MinioBlobStoreService`/`R2BlobStoreService`), `./blob/azure`, `./blob/gcp`, `./blob/local`, `./blob/ipfs` (+ `IpfsKeyIndex` interface and `Memory/Postgres/LocalJson` index impls + `createIpfsKeyIndex`), `./blob/memory`.
- **`./secrets` (core + model)** — `SecretService` (abstract: `store/retrieve/delete/exists/list/metadata` + optional `rotate`), `SecretName`/`SecretReference`/`SecretSerialization`, `SecretErrors`/`translateError`, `SecretTypes`; `model/` → `ModelSecretService`, `Secret` model, `ModelSecretServiceConfig` (`src/secrets/index.ts:6-7`). Per-provider subpaths (`./secrets/aws|azure|gcp|vault|oneppassword`) export the cloud services + their config types.
- **`./keycloak`** — `KeycloakService` orchestrator; `KeycloakAuthService/ClientService/IdentityProviderService/RealmService/RoleService/UserService`; `buildBrokerIdentityProviderPayload`; broker helpers (`getBrokerExternalIdentityKey`, `isLocalKeycloakIssuer`); config types (`KeycloakSetupConfig`, `KeycloakBrokerSetupConfig`, etc.) (`src/keycloak/index.ts:1-3`, `src/keycloak/services/index.ts:6-11`).
- **`./kibana`** — `KibanaService` orchestrator; `KibanaSpaceService/DataViewService/RoleService/UserService/DashboardService/AuthService`; `KibanaIndexBuilder`/`KibanaIndexBuilderCollection`; `createDefaultKibana*` helpers; `KibanaIndexMatchMode` enum; config types (`src/kibana/index.ts:1-4`, `src/kibana/services/index.ts:6-12`).
- **`./feature-flags`** — `FeatureFlagService` + config; `FeatureFlag`/`FeatureFlagAccess` models; `FeatureFlagReader`/`EnvironmeFlagReader`; decorators `featureFlags`/`featureAuth`/`blockFeatureOperations`/`renderIfFeature`/`hideOnFeature` + `getFeatureGateMetadata`/`shouldExposeForFeatures`/`shouldHideForFeatures`; `FeatureFlagEnvironment` + env loaders; utils (`normalizeFeatureRegistry`, `isFeatureFlagEnabledByName`, etc.) (`src/feature-flags/index.ts:6-14`).
- **`./namespaces`** — `types` (enums `IsolationTier`/`MembershipStatus`/`PrincipalKind`/`ScopeKind`/`PermissionCategory`/`ResourceVisibility`/`StorageKind`/`StorageBindingKind` + DTOs + `AuthzDataSources`/`AccessContext`/`ArangoAuthContext`/`QdrantAuthFilter`); `utils` (`BaseModelService`, `buildAccessContext`/`buildArangoContext`/`buildQdrantFilter`, `sameTenant`, relation policy constants); `models` (21 models); `services` (24 services incl. `AuthzService`, `BootstrapService`, `EffectivePermissionService`, `OrgUnitService`, `SystemManagementService`, `ResourceLifecycleService`) (`src/namespaces/index.ts:6-9`).
- **`./nest`** — `KeycloakAuthHandler`/`KeycloakNamespaceAuthHandler`/`KeycloakAuthData`; `KeycloakModule`/`AuthModule`; `namespace()` decorator + `AUTH_NAMESPACE_KEY`; utils `extractKeycloakRoles`/`extractKeycloakNamespaces`/`getRealmFromIssuer`/`getClientRoles`; types (`src/nest/index.ts:1-7`). **`./nest/graph`** — `GraphExecutionController`/`GraphExecutionModule`, `GraphResultService`/`GraphWorkflowService`, `GraphExecutionResultModel`/`GraphWorkflowModel`, `GraphExecutorRegistryFactory` (`createGraphExecutorRegistry`, `createDemoEngineConfig`) (`src/nest/graph/index.ts:1-7`).
- **`./loader`** — `ObjectLoader` + `createLoaderHookContext`; family loaders `ModelObjectLoader`/`AdapterObjectLoader`/`RepositoryObjectLoader`/`ServiceObjectLoader`/`ControllerObjectLoader`/`EnvironmentObjectLoader`/`AngularComponentObjectLoader`/`GraphNodeObjectLoader`; `ObjectLoaderFamily`/`ObjectLoaderHook`/options types (`src/loader/index.ts`).
- **`./graph`** — `GraphExecutionEngine` + config; planning (`GraphExecutionPlanner`/`GraphExecutionPlan`/`GraphTopology`/`GraphRelationResolver`); pinning (`GraphPinningService`/`GraphPinningPolicy`/`GraphPinningDependencyResolver`); store (`GraphValueStore`/`GraphValueStoreAdapter`/`InMemoryGraphValueStoreAdapter`); loops (`Foreach/While/UntilGraphNodeExecutor`, `GraphConditionEvaluator`/`ConditionExpressionEvaluator`); executors (`CodeGraphNodeExecutor`/`SwitchGraphNodeExecutor`/`LogGraphNodeExecutor`/`BreakGraphNodeExecutor`, `CodeSandboxEvaluator`/`IsolatedVmCodeSandboxEvaluator`); registry (`GraphNodeExecutorRegistry`/`GraphNodeExecutorResolver`); events (`GraphExecutionEventEmitter`/`GraphExecutionEventFactory`/`GraphExecutionObserver`); snapshots (`GraphExecutionSnapshotMapper`); validation (`GraphDefinitionValidator`/`GraphPortSchemaResolver`/`GraphValueValidator`); errors; engine constants (`src/graph/engine/index.ts:13-83`). **`./graph/shared`** — frontend-safe node declarations, `GraphExecutionStateMapper`, visual-state styles.
- **`./plugins`** — `DashboardEmbedPlugin` contract + message helpers (`createSwitchDashboardMessage`/`sendSwitchDashboardMessage`/guards); **`./plugins/kibana`** (`KibanaDashboardEmbedPlugin`, `buildKibanaEmbedUrl`, `sendKibanaSwitchDashboardMessage`, manifest builder, plugin files); **`./plugins/superset`** (`SupersetDashboardEmbedPlugin`, `buildSupersetEmbedUrl`, `sendSupersetSwitchDashboardMessage`, manifest, patch files, `SupersetInstallOptions`).
- **`./docker`** — `DockerComposeService` (`up/down/restart/waitForHealth/execInContainer/getLogs/isRunning`). **`./user-requests`** — passthrough re-export of `@decaf-ts/ui-decorators/user-requests`.

#### 6. Key patterns & concepts

- **`ClientBasedService` lifecycle.** Blob, secret, keycloak, and kibana providers all extend `ClientBasedService<TClient, TConfig>` from `@decaf-ts/core`: constructed with no args, then `await service.initialize(config)` builds the SDK client and stores config/client. Contextual logging via `logCtx(...)`.
- **Provider factories vs. direct construction.** Blob uses a `BlobStoreFactory.create(config)` that switches on `config.provider` (`BlobStoreFactory.ts:23-50`); secrets intentionally have *no* factory — each provider is imported from its subpath and constructed directly. Both designs rely on optional SDK deps so unused providers never need to be installed.
- **Runtime production resolvers.** Keycloak and Kibana inner services share a `runtime.ts` pattern: a module-level resolver set by the orchestrator's `initialize`, queried on every HTTP request to toggle `https.Agent.rejectUnauthorized` based on `NODE_ENV` (`src/keycloak/services/runtime.ts`, `src/kibana/services/runtime.ts`).
- **Builder pattern.** `KibanaIndexBuilder` (a `@decaf-ts/decorator-validation` `Model` with fluent `setX(): this` setters) composes index-pattern titles in three match modes — `EXACT`, `PREFIX`, `LOGGER_GENERATED` — with optional compounding; `KibanaIndexBuilderCollection.build()` validates and maps many builders (`KibanaIndexBuilder.ts:175-229`).
- **Org-based authorization.** Namespaces model tenants → org-unit closure tables → principals/memberships → roles/permissions/role-assignments → protected resources/resource-grants → materialized effective permissions, with inheritance blocks and RLS (`sql/002_rls.sql`). `AuthzService` is a repository-agnostic policy engine (`canAccess`, `requireAccess`, `buildAccessContext`/`buildArangoContext`/`buildQdrantFilter`); `BaseModelService<M>` is the shared CRUD base; `BootstrapService` templates a full tenant setup transactionally; `@transactional` guards multi-write services.
- **Feature flags.** Decorator-gated model members (`featureFlags`/`featureAuth`/`blockFeatureOperations`/`renderIfFeature`/`hideOnFeature`) store `FeatureFlagRule` metadata; a swappable `FeatureFlagReader` (default `EnvironmeFlagReader`) feeds a cached registry that merges environment defaults with persisted `FeatureFlag`/`FeatureFlagAccess` overrides; `FeatureFlagService.isEnabled`/`isEnabledForSubject` answer sync queries.
- **Nest auth handler.** `KeycloakAuthHandler` extends Decaf's `AuthHandler`, injects `JwtService` via `@service("jwt")`, decodes the token, and accumulates `user`/`organization`/`roles`/`namespaces` onto the request context; `KeycloakNamespaceAuthHandler` adds namespace-scope extraction; `KeycloakModule.create()` wraps the handler (it is *not* a Nest `@Module`).
- **Graph engine.** `GraphExecutionEngine` plans a workflow into topological layers (Kahn cycle detection), seeds inputs into a `GraphValueStore`, executes layer-by-layer with concurrency, routes values along edges, and emits structured events. Executors are registered imperatively in a `GraphNodeExecutorRegistry` (no `@executor` decorator). Pinning is all-or-nothing across upstream pin sets with TTL'd cached values. Loops re-enter the engine via `engine.execute(bodyWorkflow, ...)` with `parentRunId` propagation. Code/Switch nodes run through a pluggable `CodeSandboxEvaluator`; `IsolatedVmCodeSandboxEvaluator` transpiles TS, validates the AST (blocking `eval`/`new Function`/imports/exports/blocked identifiers), and runs in an `isolated-vm` isolate with timeout/memory limits.
- **BI embed plugins.** A single DOM-free `DashboardEmbedPlugin` contract; Kibana uses a generated-source + installer strategy (writes a versioned Kibana plugin + `postMessage` switching), Superset uses a patch-and-build strategy (Python/Bash patches that add `switchDashboard` to Superset's Switchboard channel + embedded SDK, then build SDK/frontend or a Docker image). Both are org-agnostic (no space switching).
- **Object loader.** ESM dynamic `import()` of normalized sources (paths → `file:` URLs, bare specifiers passed through), with ordered post-load hooks; `withHooks`/`withOptions` return a *new* immutable instance; family subclasses fix the `family` and expose a family-verb loader.

#### 7. Lifecycle / configuration / environment

- **Boot/init:** Nest auth is pure import (logging side-effect registers `user`/`organization` log params, `src/nest/logging.ts:14-38`); graph `main.ts` honors `GRAPH_BACKEND_PORT`/`argv[2]`/default `3000` (`src/nest/graph/main.ts:15`). Blob/secret/keycloak/kibana services boot via `new X()` + `await initialize(config)`.
- **Flavours:** Blob `BlobStoreFactory` keys = `s3|minio|r2|azure-blob|gcs|local|ipfs|memory` (`BlobTypes.ts:6-14`); secret providers = `model|aws-secrets-manager|azure-key-vault|gcp-secret-manager|hashicorp-vault|1password` (+ an unused `"memory"` literal). Each provider config carries a `provider` discriminator.
- **Env vars:** No blob/secret code reads `process.env` directly (credentials come via config objects / SDK default chains). Feature flags read from `FeatureFlagEnvironment.featureFlag` (env root `featureFlag`); a `FEATURE_FLAG_ENV_PREFIX` constant is declared but never wired. Keycloak/Kibana `isProduction()` defaults to `NODE_ENV` not in `["development","local"]`. Graph isolated-vm is opt-in (consumer must pass `codeSandboxEvaluator`).
- **Defaults:** Graph run options default `concurrency=4`, `failFast=true`, `usePinnedValues=true`, `validateInputs/Outputs=true` (`GraphExecutionEngine.ts:726-741`). IPFS API defaults to `http://localhost:5001` (`IpfsBlobStoreService.ts:55`). BI plugin boot targets Kibana `8.14.3` / Superset `6.1.0` (`package.json:327-328`).

#### 8. Data & control flow

- **Blob write→read (S3):** `put` → `physicalKey` (prefix via `cleanKey`) → optional `ifNotExists` conflict check → `collectToBuffer(value)` → optional `expectedSha256` verification → `PutObjectCommand` → `BlobPutResult` with `s3://` uri; `get` → `GetObjectCommand` (optional `range`/`versionId`) → `BlobGetResult` whose `value` is `toAsyncIterable(body)` (drained by `collectToBuffer`). IPFS instead maps logical keys→CIDs via an `IpfsKeyIndex` and streams `client.cat(cid)`.
- **Secret write→read (AWS):** `store` → `validateSecretName`/`normalizeSecretName` → `serializeSecretPayload` → `JSON.stringify` the full `{encoding,value}` envelope into `SecretString` → `CreateSecretCommand` (fallback `PutSecretValueCommand` on exists) → `SecretReference`; `retrieve` → `GetSecretValueCommand` → `JSON.parse` → `deserializeSecretPayload`. The model provider encrypts `serialized.value` via `CryptoService` and persists `{encryptedPayload, encryption:{keyId,iv}}` on the `Secret` model.
- **Keycloak provisioning:** `KeycloakService.setupOrganization` → get admin token → `createRealm` → `waitForRealm` (poll ≤15s) → create realm user → assign `realm-management` client roles → `createClient` → update client-scope mappers. Role grant → `grantRealmRolesToUser` resolves role UUIDs and POSTs to the user's role-mappings.
- **Kibana data view:** `KibanaIndexBuilder.build()` validates and composes a title (e.g. PREFIX → `prefix-*`); `KibanaDataViewService.createDataView` POSTs `/s/{realm}/api/data_views/data_view` (falling back to `updateDataView` on 409/400); `setDefaultDataView` discovers the Kibana version via `/api/status` then sets `defaultIndex`.
- **Nest auth:** request → `requestFromContext` → `isPublicRequest` short-circuits `/public` routes → `getToken` reads `x-auth-request-access-token`/`authorization` (strips `Bearer `) → `jwt().decodePayload` → `extractKeycloakRoles` → `organization = aud||azp||realm-from-issuer`, `user = email??preferred_username` → accumulated onto the Decaf `Context`.
- **Feature flag resolution:** `isEnabled(key)` → `normalizeFeatureName` → `isFeatureFlagEnabledByName(cachedRegistry, key)`; the cached registry merges the env registry then overrides with persisted `FeatureFlag` rows. Subject-scoped: `resolveFeatureFlagsForSubject` lists enabled `FeatureFlagAccess` rows for the subject, collects `featureKey`s, queries enabled `FeatureFlag` rows, returns a `{key: config??true}` registry.
- **Namespaces effective-permission rebuild:** `EffectivePermissionService.rebuildForPrincipal` deletes existing rows, collects direct + group-derived `RoleAssignment`s, expands scopes (Tenant → tenant; Resource → resource; OrgUnit non-inheriting → single scope; inheriting → all closure descendants, skipping categories blocked by `InheritanceBlock`), writes `EffectivePermission` rows. `AuthzService.canAccess` short-circuits on owner → explicit `ResourceGrant`s → visibility-driven effective-permission lookup.
- **Graph execution:** `execute` → `planner.plan` → `valueStore.seedWorkflowInputs` → per layer `executeLayer` (concurrency batch) → per node emit `NODE_STARTED`, resolve inputs, optional pinned `NODE_CACHE_HIT`, resolve executor, run, `routeOutgoingEdges` (→ `EDGE_VALUE_ROUTED`), emit `NODE_COMPLETED`/state changes → `buildGraphExecutionResult`; failures emit `NODE_FAILED` and abort on `failFast`.
- **BI embed:** Kibana `buildKibanaEmbedUrl` → `//<host>/<basePath>/app/org_dashboard_embed?dashboardId=...&parentOrigin=...`; switching via `postMessage`. Superset `buildSupersetEmbedUrl` → `//<host>/<basePath>/embedded/<dashboardId>?parentOrigin=...`; switching via the SDK handle's `switchDashboard(dashboardId, guestToken)`.
- **Docker compose:** `initialize({composeFile})` (validates file exists) → `up(-d)` runs `docker compose -f <file> up -d` in the file's dir → `waitForHealth(url)` polls `fetch` up to `maxAttempts×interval` (HTTP 2xx, or any response when `requireOk:false`) → `down --volumes`.

#### 9. Testing

Test layout mirrors `src/`: `tests/unit/<subsystem>/`, `tests/integration/`, `tests/e2e/` (plus Playwright for plugins). Jest with `--experimental-vm-modules`; `test` script builds then runs all with coverage (`package.json:330`).

- **blob:** unit `BlobServiceContract.test.ts` (key/value helpers, `translateBlobError`, shared CRUD contract for memory+local, factory) and `BlobBundling.test.ts` (symbol-boundary assertions); integration `minio-s3`/`azure-blob`/`gcs`/`ipfs` against Dockerized backends. Gaps: no R2 test, no live `url()` test for Azure/GCS, postgres/local-json IPFS indexes are stubs (throw on every call).
- **secrets:** unit `SecretServiceContract.test.ts` (name validation, serialization round-trips, `SecretError`) — covers core utilities only, not the abstract or any provider; integration `aws-secrets-manager`/`gcp-secret-manager`/`vault` (LocalStack/emulator/Vault). Gaps: no Azure/1Password/model integration tests; no provider extends the `SecretService` abstract so the contract is unenforced.
- **keycloak:** unit `keycloak-broker-config.test.ts` (broker payload + helpers); integration `keycloak.test.ts` + `keycloak-broker-compose.test.ts` (static); e2e broker/auth/model-suite/role-permissions (live Keycloak + Traefik/oauth2-proxy, and fake-JWT handler tests). Gaps: no unit tests for orchestration/inner-service methods, `setupOrganization`/legacy IdP path, or `parseError` status mapping.
- **kibana:** unit `kibana.test.ts` (default helpers) and `kibana/builders.test.ts` (thorough EXACT/PREFIX/LOGGER_GENERATED + compounding + collection); integration `kibana.test.ts` (space/role/user/data-view). Gaps: no tests for `KibanaAuthService`, dashboard clone/embed/`verifySpaceSetup`, `setDefaultDataView`, or `setupOrganization` end-to-end.
- **feature-flags:** unit `feature-flags.test.ts` (env normalization, decorator placement, rule evaluation, swappable reader + cached `isEnabled`/`resolveFeatureFlags`, subject access resolution). Gaps: `syncFromEnvironment`/grant/revoke/find/list access and `blockFeatureOperations`/`getFeatureGateMetadata` untested.
- **namespaces:** unit `org-based-authorization-system.test.ts` (pure helpers + `canAccess` visibility decision) and `.services.test.ts` (tenant default tier, storage binding, group principal resolution). Gaps: `BootstrapService`, `EffectivePermissionService.rebuildForPrincipal` (incl. inheritance-block + group expansion), `OrgUnitService` closure ops, `RoleAssignmentService`, `SystemManagementService`, `ResourceLifecycleService` have no unit tests.
- **nest:** unit `nest.test.ts` (JWT extraction, handler happy/missing-token/public/required-roles/invalid, `namespace()` enforcement) and `nest/graph-execution-module.test.ts` (Nest-testing bootstrap, execute/SSE/results/workflow); e2e `sse-auth-extraction`, `graph/full-stack`, `graph/graph-execution`. Gaps: `logging.ts`, `KeycloakModule.create()`, `getClientRoles`, `main.ts` untested.
- **loader:** unit `object-loader.test.ts` (default/named export loading, identity, hook ordering/chaining, all 8 family loaders). Gaps: URL/`data:` sources, single-named-export fallback, `withOptions`, `createLoaderHookContext`.
- **graph:** extensive unit coverage (`GraphExecutionEngine`, planner, topology, pinning, value store, registry, code/switch/foreach/condition executors, isolated-vm sandbox, event emitter/factory, state mapper, run logger, errors). Gaps: `While/UntilGraphNodeExecutor`, validators, snapshot mapper, `LogGraphNodeExecutor`, `GraphNodeExecutorResolver`, pinned cache-hit path, `validateInputs/Outputs` options.
- **plugins:** unit `contract`/`kibana`/`superset` (constants, manifest, file generation, embed URL, interface parity, install write/overwrite); e2e Playwright `kibana`/`superset` (+ visual). Gaps: Superset `build:true` in-process path and `boot-plugin.mjs` are unverified by automated tests.
- **docker/shared/user-requests:** `shared/runtime.test.ts` (basic parse/serialize); `DockerComposeService` has no tests; `user-requests` barrel has no tests.

#### 10. Usage example

**Blob factory + memory backend** (`tests/unit/blob/BlobServiceContract.test.ts:209-219`):
```ts
const factory = new BlobStoreFactory();
const store = factory.create({ provider: "memory", sourceId: "factory-test" });
await store.initialize({ provider: "memory", sourceId: "factory-test" });
await store.put("k", Buffer.from("v"));
expect(await store.has("k")).toBe(true);
```

**AWS secret store/retrieve** (`tests/integration/aws-secrets-manager.test.ts:31-59`):
```ts
const secrets = new AwsSecretService();
await secrets.initialize({ provider: "aws-secrets-manager", region: "us-east-1",
  endpoint: "http://localhost:4566", credentials: { accessKeyId: "test", secretAccessKey: "test" } });
await secrets.store("test-secret", { username: "testuser", password: "password123" });
const data = await secrets.retrieve("test-secret") as Record<string, unknown>;
expect(data.username).toBe("testuser");
```

**Graph engine run** (`tests/unit/graph/GraphExecutionEngine.test.ts:14-44`):
```ts
const registry = new GraphNodeExecutorRegistry();
registry.register("math.add", { execute: (i) => ({ sum: Number(i.a) + Number(i.b) }) });
registry.register("math.multiply", { execute: (i) => ({ product: Number(i.x) * 2 }) });
const engine = new GraphExecutionEngine({ registry });
const result = await engine.execute(linearWorkflow(), { a: 2, b: 3 }); // outputs.result === 10
```

**Namespaces bootstrap** (`workdocs/5-HowToUse.md:48-77`):
```ts
const { tenantId } = await new BootstrapService().bootstrapTenantFromTemplate({
  tenant: { slug: "acme", name: "Acme" }, rootOrgUnit: { name: "Root" },
  permissions: [{ key: "resource.read", category: PermissionCategory.ContentRead }],
  roles: [{ key: "owner", name: "Owner", permissionKeys: ["resource.read"] }],
  ownerUser: { displayName: "Admin", email: "admin@acme.example" }, ownerRoleKey: "owner",
});
```

#### 11. Relationships

The package is a consumer of (and sits above) `@decaf-ts/core` (`ClientBasedService`, `Service`, `ModelService`, `Repository`, `Context`, `Observable`/`Observer`), `@decaf-ts/crypto` (`CryptoService`/`JwtService` via `@decaf-ts/crypto/integration`), `@decaf-ts/db-decorators` (`@repository`, repository hooks), `@decaf-ts/decorator-validation` (`Model` base for builders), `@decaf-ts/ui-decorators` (graph `@node`/`@pinnable`/port decorators, and the `user-requests` passthrough), and `@decaf-ts/transactional-decorators` (`@transactional` in namespaces). It peers with `@decaf-ts/for-nest`/`for-http` (Nest graph backend + SSE) and `@decaf-ts/as-zod`. Downstream, app code consumes the auth handler, namespaces scaffold, graph engine, blob/secret providers, and BI plugins.

#### 12. Consumer notes

- Import only the subpath you need; cloud SDKs are `optionalDependencies` — install the ones for your providers. The blob core barrel re-exports `BlobStoreFactory`, which statically imports *all* provider modules (see inaccuracies), so importing `./blob` pulls every SDK transitively today.
- There is no secret factory: import the provider's subpath and call `new X()` then `await initialize(config)`. No provider `extends SecretService`, so the abstract contract is documentary only.
- `BlobStoreFactory.create` returns the abstract base; cast or hold the concrete subclass if you need provider-specific members.
- For namespaces, you must provision the Postgres schema + `sql/001_constraints.sql`/`002_rls.sql`/`003_indexes.sql` and set `app.principal_id` for RLS-scoped reads; `AuthzService` must be fed by repository-backed data sources, never fixtures.
- The graph engine does **not** wire `IsolatedVmCodeSandboxEvaluator` by default — pass `codeSandboxEvaluator` in config or Code/Switch nodes throw `GRAPH_CODE_SANDBOX_NOT_CONFIGURED`. `isolated-vm` is a native addon (needs a build toolchain).
- Keycloak/Kibana services require `initialize(config)` and an `isProduction()`-aware TLS setting; supply `isProduction: () => false` in tests (the config type omits this field today — see inaccuracies).
- BI plugins are org-agnostic (no space switching); Superset is pinned to 6.1.x via a hard-named patch script. `boot:plugins:*` only materializes files; the real build happens inside `docker compose build`.
- Maturity/versioning: package is `0.7.0` (pre-1.0); several subsystems have stubs (IPFS postgres/local-json indexes, Superset manifest "stub" wording) and divergent error models (cloud secret providers throw Decaf errors while 1Password/model throw `SecretError`).

#### 13. Inaccuracies found

Findings are grouped by subsystem and tagged accordingly. Nothing was modified.

**blob**

1. **[blob]** core entry eagerly loads all provider SDKs despite documented intent — `src/blob/index.ts:4-5` claims the core entry "does not eagerly load optional provider SDKs", but `src/blob/core/BlobStoreFactory.ts:9-16` statically imports every provider implementation, so importing `@decaf-ts/integrations/blob` transitively loads `@aws-sdk/*`, `@azure/*`, `@google-cloud/storage`, and `kubo-rpc-client`. | Suggested fix: make `BlobStoreFactory` lazy-load providers per case, or move the factory out of the core barrel.
2. **[blob]** bundling test is misleading — `tests/unit/blob/BlobBundling.test.ts:17-31` only asserts provider class symbols are absent from the core namespace, not that SDK modules aren't loaded (which they are, per #1). | Suggested fix: assert no provider module side effects, or fix the factory to lazy-load.
3. **[blob]** SKILL presents stub IPFS key indexes as usable — `SKILL.md:55,80` lists `LocalJsonIpfsKeyIndex`/`PostgresIpfsKeyIndex` alongside `MemoryIpfsKeyIndex`; both are stubs whose every method throws `InternalError("Implement ...")` (`src/blob/ipfs/LocalJsonIpfsKeyIndex.ts:17-53`, `PostgresIpfsKeyIndex.ts:19-49`). | Suggested fix: mark them unimplemented in the SKILL or implement them.
4. **[blob]** package README omits the blob subsystem entirely — `README.md:5-15`/`17-24` never mention the `./blob*` subpaths despite `package.json:184-260`. | Suggested fix: add blob subpaths + descriptions to the README.
5. **[blob]** `LocalBlobStoreService` duplicates value-collection/sha256 logic — `src/blob/local/LocalBlobStoreService.ts:329-350` re-implements `collectToBuffer`/sha256 instead of using the shared `collectToBuffer`/`computeSha256` (`src/blob/core/BlobValue.ts:58-78`); the local copy doesn't handle sync iterables. | Suggested fix: import and use the shared helpers.
6. **[blob]** IPFS `get` silently ignores `BlobGetOptions` — `src/blob/ipfs/IpfsBlobStoreService.ts:144` does `void options;`, so `range`/`versionId` are accepted by type but never honored. | Suggested fix: implement or throw `UnsupportedError` when supplied.
7. **[blob]** IPFS `put` reports `sha256: undefined` in metadata — `src/blob/ipfs/IpfsBlobStoreService.ts:109` sets `sha256: undefined` even though bytes are buffered and `computeSha256` is available; other providers populate it. | Suggested fix: compute and store sha256 in the index metadata.
8. **[blob]** `MemoryIpfsKeyIndex.stat` throws a plain `Error`, not `NotFoundError` — `src/blob/ipfs/MemoryIpfsKeyIndex.ts:60` vs the subsystem's `NotFoundError` standard. | Suggested fix: throw `NotFoundError`.
9. **[blob]** `LocalBlobStoreService.parseError` pass-through guard is incomplete — `src/blob/local/LocalBlobStoreService.ts:257-264` only checks `NotFoundError`/`ConflictError`/`ValidationError`/`InternalError`, so a `ForbiddenError`/`ConnectionError` would be reclassified as `InternalError`; other providers check the full set (e.g. `S3BlobStoreService.ts:361-372`). | Suggested fix: add the missing DECAF error classes or use `translateBlobError`.
10. **[blob]** `BlobStoreFactory.create` return type erases the concrete service type — `src/blob/core/BlobStoreFactory.ts:19-21` always returns `BlobStoreService`. | Suggested fix: overload `create` per `provider` literal.

**secrets**

11. **[secrets]** `SecretService` abstract is never implemented by any provider — every provider extends `ClientBasedService`, not `SecretService` (`AwsSecretService.ts:48`, `AzureKeyVaultSecretService.ts:30`, `GcpSecretManagerService.ts:26`, `VaultSecretService.ts:113`, `OnePasswordSecretService.ts:22`, `ModelSecretService.ts:36`); `extends SecretService` returns zero class matches. | Suggested fix: have providers extend `SecretService` (aligning signatures incl. `options`/`rotate`) or drop the unused abstract.
12. **[secrets]** package.json export path typo — `package.json:162` declares `./secrets/oneppassword` (extra `p`) but the source directory is `src/secrets/onepassword/`; there is no `./secrets/onepassword` export entry. | Suggested fix: rename the export key to `./secrets/onepassword` and fix the `lib/...` paths.
13. **[secrets]** SKILL imports 1Password from the broken typo path — `integrations-secrets SKILL.md:43` uses `@decaf-ts/integrations/secrets/oneppassword`. | Suggested fix: change to `.../onepassword`.
14. **[secrets]** `ModelSecretService.retrieve` hardcodes `encoding: "utf8"`, dropping the original serialization encoding — only `serialized.value` is encrypted/persisted (`ModelSecretService.ts:71,82-94`); retrieve rebuilds `{encoding:"utf8", value}` unconditionally (`:178-183`), so JSON/binary secrets come back as strings. | Suggested fix: persist `encoding` on the `Secret` model and restore it on retrieve.
15. **[secrets]** docs say to pass config to the constructor, but no provider accepts constructor args — `SKILL.md:48,53-57` and `workdocs/services/secrets.md:72-77` show `new AwsSecretService({...})`; actual path is `new AwsSecretService()` + `await initialize(config)` (`aws-secrets-manager.test.ts:31-32`). | Suggested fix: update docs.
16. **[secrets]** workdocs use invalid `provider` value `"aws"` — `workdocs/services/secrets.md:75` writes `provider:"aws"`; `SecretProvider`/`AwsSecretServiceConfig` require `"aws-secrets-manager"` (`SecretTypes.ts:10`, `AwsSecretServiceConfig.ts:9`). | Suggested fix: change to `"aws-secrets-manager"`.
17. **[secrets]** `rotate(...)` is recommended but never implemented — `SKILL.md:31,69`; the only `rotate` occurrence is the optional abstract at `SecretService.ts:61-65`; no provider implements it. | Suggested fix: implement for versioned backends or remove the recommendation.
18. **[secrets]** `@grpc/grpc-js` imported but not declared — `GcpSecretManagerService.ts:2,49` imports `@grpc/grpc-js`, which is absent from `package.json` deps (resolves only transitively). | Suggested fix: add to `optionalDependencies` or drop the direct import.
19. **[secrets]** dead optional dependency `hashicorp-vault` — `package.json:430` lists it, but `VaultSecretService.ts` uses raw `fetch` and never imports it. | Suggested fix: remove the dependency.
20. **[secrets]** dead code `ModelSecretCrypto.ts` — defines `encryptPayload`/`decryptPayload`/`deriveKeyFromSecret` (`ModelSecretCrypto.ts:9-122`) but is neither exported from `src/secrets/model/index.ts:6-8` nor used by `ModelSecretService` (which uses `CryptoService`); `workdocs/services/secrets.md:31` points readers at it as the crypto provider. | Suggested fix: wire it in and export it, or delete it.
21. **[secrets]** `parseSecretReference` regex cannot match the `1password` provider — `SecretReference.ts:9-10` uses provider class `[a-z-]+` (excludes digits), so `secrets/1password/foo` is unparseable/invalid even though `isValidProvider` allow-lists `"1password"` (`SecretReference.ts:62-70`). | Suggested fix: widen the capture group to `[a-z0-9-]+`.
22. **[secrets]** unused `SecretProvider` literal `"memory"` — `SecretTypes.ts:8`/`SecretReference.ts:63` include `"memory"` but no `MemorySecretService` exists. | Suggested fix: add a memory provider or remove the literal.
23. **[secrets]** AWS `list` no-op ternary — `AwsSecretService.ts:288` writes `version: secret.LastChangedDate ? undefined : undefined`. | Suggested fix: populate `version` meaningfully or drop the field.
24. **[secrets]** Azure `delete` ignores `force` — both branches of `if (options.force)` call `beginDeleteSecret` (`AzureKeyVaultSecretService.ts:150-156`). | Suggested fix: purge the deleted secret when `force`, or document soft-delete semantics.
25. **[secrets]** 1Password `retrieve` loses original payload encoding — `OnePasswordSecretService.ts:69,186-189` stores only `serialized.value` and reconstructs `{encoding:"utf8", value}` on read. | Suggested fix: store `encoding` alongside the value.
26. **[secrets]** error model inconsistency — core `translateError`/`translateNameError`/`translateSerializationError`/`translateCryptoError` (`SecretErrors.ts:38-146`) are never called; cloud providers return Decaf errors while 1Password/model return `SecretError`. | Suggested fix: standardize on `SecretError` (or `translateError`) across providers.
27. **[secrets]** workdocs understate Azure — `workdocs/services/secrets.md:44-45` omits `exists`, which is implemented (`AzureKeyVaultSecretService.ts:162-199`). | Suggested fix: add `exists` to the Azure blurb.

**keycloak**

28. **[keycloak]** unused optional dependency `keycloak-admin` — `package.json:431`; never imported in `src/`/`tests/` (all Admin REST calls are raw Axios). | Suggested fix: remove or document as reserved.
29. **[keycloak]** workdoc/SKILL config example is not type-valid — `workdocs/services/keycloak.md:25-39` and `integrations-keycloak SKILL.md:22-38` show `realm:"acme"` (not a `KeycloakSetupConfig` field), omit required `id`/`client`, and `KeycloakUser` objects omit required `apiClientId` (`src/keycloak/types.ts:162-183,6-9`). | Suggested fix: provide a type-valid `KeycloakSetupConfig`.
30. **[keycloak]** `KeycloakSetupConfig` does not declare `isProduction`, yet tests/users supply it — `src/keycloak/types.ts:162-183` (no `isProduction`) vs `tests/integration/keycloak.test.ts:36`, `tests/e2e/keycloak-model-suite.e2e.test.ts:152`, `keycloak-role-permissions.e2e.test.ts:201` all set `isProduction: () => false`. | Suggested fix: add optional `isProduction?: () => boolean`.
31. **[keycloak]** doc misdescribes `setupOrganization` — `workdocs/services/keycloak.md:63`/`SKILL.md:43` claim it creates roles/IdPs/dashboards together; actual `KeycloakService.setupOrganization` (`KeycloakService.ts:277-332`) creates realm + realm user + realm-management client roles + client + scope mappers — no roles/IdPs/dashboards. | Suggested fix: correct the description.
32. **[keycloak]** doc misdescribes `setupKeycloak` — `workdocs/services/keycloak.md:19`/`SKILL.md:42` call it the "full bootstrap"; `setupKeycloak` (`KeycloakService.ts:100-121`) only adds the admin user and grants the `admin` realm role. | Suggested fix: reword.
33. **[keycloak]** error-mapping smell — HTTP 401/403 map to `NotFoundError` in every service's `handleHttpResponse`/`parseError` (e.g. `KeycloakAuthService.ts:210-212,232-238` and identical blocks across the other services). | Suggested fix: map 401→`UnauthorizedError`/403→`ForbiddenError`.

**kibana**

34. **[kibana]** workdoc advertises a `deleteDataView` method that doesn't exist — `workdocs/services/kibana.md:73`; `grep deleteDataView src/kibana` → no matches; `KibanaService` exposes only create/update/createDataViews/setDefaultDataView (`KibanaService.ts:178-228`). | Suggested fix: remove it or implement it.
35. **[kibana]** workdoc/SKILL `initialize` example omits required `id` — `workdocs/services/kibana.md:25-34`/`integrations-kibana SKILL.md:19-29` vs `KibanaSetupConfig.id` (`src/kibana/types.ts:75-90`). | Suggested fix: add `id`.
36. **[kibana]** `KibanaSetupConfig` does not declare `isProduction`, yet the integration test supplies it — `src/kibana/types.ts:75-90` vs `tests/integration/kibana.test.ts:36` (`isProduction: () => false`). | Suggested fix: add optional `isProduction?: () => boolean`.
37. **[kibana]** dead `@service() authService` injection — `KibanaAuthService` is `@service()`-injected as `protected authService` in `KibanaDashboardService.ts:26-27`, `KibanaDataViewService.ts:24-25`, `KibanaRoleService.ts:19-20`, `KibanaSpaceService.ts:23-24`, `KibanaUserService.ts:19-20` but is never referenced (all use `this.config.adminApiUser` directly). | Suggested fix: remove the injection or route auth through `KibanaAuthService`.
38. **[kibana]** error-mapping smell — HTTP 401/403 → `NotFoundError` in every kibana service's `parseError` (e.g. `KibanaAuthService.ts:118-124` and parallels). | Suggested fix: map 401/403 to unauthorized/forbidden errors.
39. **[kibana]** workdoc understates `KibanaSpaceService` — `workdocs/services/kibana.md:39` says "create and update spaces", but it also implements `deleteSpace` (`KibanaSpaceService.ts:94-114`, exposed via `KibanaService.ts:168-176`). | Suggested fix: mention deletion.

**feature-flags**

40. **[feature-flags]** public API typo — the concrete reader class is named `EnvironmeFlagReader` (missing `nt`) (`src/feature-flags/readers/FeatureFlagReader.ts:29`; consumed at `FeatureFlag.service.ts:14,44,61` and `tests/unit/feature-flags.test.ts:4,172`). | Suggested fix: rename to `EnvironmentFlagReader`.
41. **[feature-flags]** dead/misleading constant — `FEATURE_FLAG_ENV_PREFIX = "FEATURE_FLAG"` (`constants.ts:7`) is only re-exported; nothing reads `process.env.FEATURE_FLAG_*`, implying an env-var parsing capability that doesn't exist. | Suggested fix: implement prefix-based loading or remove the constant.
42. **[feature-flags]** `grantFeatureAccess`/`revokeFeatureAccess` ignore the feature key when looking up existing access — both call `findFeatureAccess(input)` carrying `featureKey` (singular), but `buildAccessCondition` only filters on `query.featureKeys` (plural array), so the lookup may match/update/revoke the wrong feature's row (`FeatureFlag.service.ts:215-216,232-235,154-160`). | Suggested fix: map `featureKey`→`featureKeys:[featureKey]` or add a `featureKey` branch.
43. **[feature-flags]** README "Exports" omits `./feature-flags` — `README.md:7-15` vs `package.json:96-106`. | Suggested fix: add it.
44. **[feature-flags]** stale empty directory `src/feature-flags/repositories/` (no files, unreferenced). | Suggested fix: remove or populate it.

**namespaces**

45. **[namespaces]** SQL closure-table unique index column names don't match the model's FK columns — `sql/001_constraints.sql:8` indexes `(tenant_id, ancestor_org_unit_id, descendant_org_unit_id)`, but `OrgUnitClosure` declares `ancestor`/`descendant` `@manyToOne` (generated FK columns `ancestor_id`/`descendant_id`) (`src/namespaces/models/org-unit-closure.model.ts:19-24`). | Suggested fix: rename model props to `ancestorOrgUnit`/`descendantOrgUnit` or update the SQL index columns.
46. **[namespaces]** three legacy monolith files are dead, divergent duplicates — `src/namespaces/org-based-authorization-system.ts`/`.models.ts`/`.services.ts` are only imported by each other, absent from the public barrel (`src/namespaces/index.ts:6-9`), and disagree with the modular code (e.g. monolith `AuthorizationModel` is non-abstract vs exported `abstract`; monolith `BaseModelService` lacks `create()`; monolith `OrgUnitService.renameOrgUnit` is buggy — both branches call `this.orgUnitPath(undefined, name)`, `org-based-authorization-system.ts:525-541`, vs the correct modular version `services/org-unit.service.ts:120-127`). | Suggested fix: delete the monolith files.
47. **[namespaces]** `sql/003_indexes.sql` is a placeholder with no indexes, despite being listed as a prerequisite artifact (`workdocs/5-HowToUse.md:7`). | Suggested fix: implement the indexes or drop the file/requirement.
48. **[namespaces]** `AuthzService.canAccess` scope branch doesn't enforce tenant scoping — when `scopeKind`+`scopeId` are provided, it matches only on `permissionKey` + time window without verifying `permission.tenantId === input.tenantId` (`authz.service.ts:31-43`), unlike the resource branch (`:52`). | Suggested fix: add the tenant predicate.
49. **[namespaces]** `ResourceLifecycleService.unregisterResource` (and others) are not `@transactional` despite multi-step destructive sequences — deletes grants then the resource without a transactional boundary (`resource-lifecycle.service.ts:6-10`), vs `OrgUnitService.deleteOrgUnitTree` which is `@transactional` (`org-unit.service.ts:179-189`). | Suggested fix: annotate with `@transactional()`.

**nest**

50. **[nest]** workdocs claim `AuthService` exists in `src/nest` — it does not (`grep "class AuthService"` over `src` returns nothing); `workdocs/services/nest.md:7` links `../../src/nest/authService.ts` (file missing) and `nest.md:30`/`workdocs/Readme.md:38` show `import { AuthService } from "@decaf-ts/integrations/nest"` which won't compile. The actual verification is `JwtService` injected via `@service("jwt")`. | Suggested fix: remove the `AuthService`/`AuthServiceOptions`/verify/decode-mode section; document `JwtService` injection.
51. **[nest]** stale coverage HTML references a removed file — `workdocs/coverage/src/nest/authService.ts.html` exists while the source does not; the coverage dir also lacks `decorators.ts.html`/`logging.ts.html`/`types.ts.html`/`graph/` (predates the current tree). | Suggested fix: regenerate coverage.
52. **[nest]** `KeycloakAuthData` field table in `nest.md` is wrong — doc lists `user`/`email`/`preferred_username`/`token`/`isPublic`/`namespaces`; the interface only adds `token`/`isPublic` (`src/nest/keycloakAuthHandler.ts:29-34`); `user`/`organization`/`roles`/`namespaces` come from base `AuthData`, and `email`/`preferred_username` are collapsed into `user` (`:79`). | Suggested fix: correct the table.
53. **[nest]** `KeycloakAuthHandler` constructor signature in `nest.md` is fabricated — doc says `new KeycloakAuthHandler(authService?, authServiceOptions?)`; actual is `constructor() { super(); }` (`src/nest/keycloakAuthHandler.ts:41-43`). | Suggested fix: document the no-arg constructor + `@service("jwt")` requirement.
54. **[nest]** `nest.md` describes a `validate(...)` override calling `AuthService.assertValidToken`; the actual override is `validateAuth(data, _request)` calling `this.jwt().decodeAuthToken(...)` (`src/nest/keycloakAuthHandler.ts:88-96`); no `assertValidToken`/`verifyToken`/`JWKS` symbol exists. | Suggested fix: replace with the actual `validateAuth` behavior.
55. **[nest]** `nest.md` names the extension point `extractFromAuth(ctx)`; actual is `extractFromRequest(request)` with `requestFromContext` doing ctx→request adaptation (`src/nest/keycloakAuthHandler.ts:57-59,84-86`). | Suggested fix: rename.
56. **[nest]** `nest.md:10` lists export as `keycloakModule` (lowercase) and implies a Nest `@Module`; actual exports are classes `KeycloakModule`/`AuthModule` (`src/nest/keycloakModule.ts:8,19`), neither decorated `@Module()` (plain wrappers whose `create()` returns a `KeycloakNamespaceAuthHandler`). | Suggested fix: rename to `KeycloakModule`/`AuthModule` and clarify.
57. **[nest]** `nest.md` omits `KeycloakNamespaceAuthHandler`, which is what `KeycloakModule.create()` actually instantiates (`src/nest/keycloakModule.ts:13-16`). | Suggested fix: document it.
58. **[nest]** `getClientRoles` is re-exported twice from the nest barrel — via `export * from "./utils"` (`src/nest/index.ts:2`) and an explicit `export { getClientRoles } from "./utils"` at `src/nest/keycloakAuthHandler.ts:129` (redundant). | Suggested fix: drop line 129.
59. **[nest]** `GraphWorkflowModel` only declares `workflowId`/`snapshot` but `GraphWorkflowService` sets/constructs an `updatedAt` field relying on an undeclared inherited `BaseModel` field (`src/nest/graph/GraphWorkflowModel.ts:6-15` vs `GraphWorkflowService.ts:27,31-36`). | Suggested fix: explicitly declare `@column() updatedAt`.

**loader**

60. **[loader]** `ObjectLoaderExportSelection` exported twice from the same barrel — via `export * from "./types"` (`src/loader/index.ts:8`) and `export type { ObjectLoaderExportSelection }` at `src/loader/ObjectLoader.ts:193` (redundant). | Suggested fix: drop line 193.
61. **[loader]** SKILL example omits non-obvious behaviors — `new ObjectLoader({ family: "service" })` works, but the skill doesn't note that `withHooks`/`withOptions` return a *new* immutable instance or that `load()` defaults to the `default` export (`ObjectLoader.ts:113-118,160-175`). | Suggested fix: add an immutability note.

**user-requests**

62. **[user-requests]** barrel undocumented in root README and workdocs `Readme.md` export lists (`README.md:5-15`; `package.json:107-117`). | Suggested fix: add `@decaf-ts/integrations/user-requests`.
63. **[user-requests]** no tests exercise the barrel (e.g. asserting it re-exports the expected symbols). | Suggested fix: add a smoke test.

**shared**

64. **[shared]** `src/shared/runtime.ts` has no public import path — `package.json` `exports` defines no `./shared` subpath, and `src/index.ts:6-8` doesn't re-export `./shared`; the test imports `../../../src/shared/runtime` directly (`tests/unit/shared/runtime.test.ts:4`). | Suggested fix: add a `./shared` subpath + barrel, or re-export from the root.

**docker**

65. **[docker]** `DockerComposeServiceConfig` and `DockerHealthCheckOptions` are declared without `export` — `src/docker/DockerComposeService.ts:13,18`, so the barrel `export *` doesn't surface them; consumers can't type the `initialize`/`waitForHealth` args. | Suggested fix: add `export` to both interfaces.
66. **[docker]** workdoc omits `waitForHealth` options — `workdocs/services/docker-compose.md:38,46` says health checks rely on HTTP status only, but the impl supports `requireOk`/`maxAttempts`/`interval` (`DockerComposeService.ts:18-27,116-144`); `requireOk:false` (any HTTP response = healthy) is undocumented. | Suggested fix: document the options and the emulator use case.
67. **[docker]** no tests exist for `DockerComposeService`, yet `workdocs/coverage/src/docker/` is present (stale coverage). | Suggested fix: add tests and regenerate coverage.
68. **[docker]** root README "Exports" omits `@decaf-ts/integrations/docker` (`README.md:5-15` vs `package.json:30-40`, `workdocs/Readme.md:27`). | Suggested fix: add it.
69. **[docker]** unclear "double assignment" comment — `this._config = config; // double assignment but allows tests to be cleaner` (`DockerComposeService.ts:61`). | Suggested fix: remove the redundant assignment or document precisely why both are needed.

**graph**

70. **[graph]** validation options silently ignored — `mergeOptions` defaults `validateInputs:true`/`validateOutputs:true` (`GraphExecutionEngine.ts:732-733`) but `execute()` never invokes `GraphValueValidator`/`GraphDefinitionValidator`/`GraphPortSchemaResolver`. | Suggested fix: wire validation in or remove the unused options.
71. **[graph]** event `nodeId` inconsistency — engine node events use `planNode.id` (`GraphExecutionEngine.ts:352,390,...`) but executor-emitted events go through `GraphExecutionContext.emit` which hard-codes `nodeId: this.node.name` (`GraphExecutionContext.ts:55,83`); when a node id differs from its definition's `name`, `NODE_STARTED`/`NODE_COMPLETED` carry a different `nodeId` than `LOOP_*`/`NODE_OUTPUT` events. | Suggested fix: pass `planNode.id` into the context and use it in `emit()`.
72. **[graph]** `IsolatedVmCodeSandboxEvaluator` described as "the default" but isn't wired by default — `src/graph/shared/nodes/flow-control.ts:380-382` says it's the default, but `GraphExecutionEngine` leaves `codeSandboxEvaluator` `undefined` unless supplied (`GraphExecutionEngine.ts:93-101`); Code/Switch nodes throw `GRAPH_CODE_SANDBOX_NOT_CONFIGURED` out of the box. | Suggested fix: document explicit registration or default to it when `isolated-vm` is available.
73. **[graph]** `GraphTopology.isBoundary` hard-codes `"$workflow"` instead of `GRAPH_WORKFLOW_BOUNDARY` (`GraphTopology.ts:63-65` vs `constants.ts:13`). | Suggested fix: import and compare against the constant.
74. **[graph]** dead import — `GraphPinningService` imports `GRAPH_PINNING_METADATA_KEY` only to `void` it at module end (`GraphPinningService.ts:6,242`). | Suggested fix: remove the unused import.
75. **[graph]** README omits `./graph`/`./graph/shared` and never mentions the graph engine in "Included Modules" (`README.md` vs `package.json:261-282`). | Suggested fix: add the subpaths and a graph bullet.

**plugins**

76. **[plugins]** Superset manifest doc/comment is stale — `src/plugins/superset/manifest.ts:3-7,22` says "stub"/"deferred"/"to be ignored for now" and carries `status:"stub"`, but the plugin is fully implemented (`installer.ts:127-271`, `templates.ts:840-850`, e2e coverage). | Suggested fix: drop the stub wording and `status:"stub"` field; describe the patch-and-build strategy.
77. **[plugins]** `SupersetDashboardEmbedPlugin.install` narrows the parameter to `SupersetInstallOptions` while the contract declares `install(options: PluginInstallOptions)` (`contract.ts:191` vs `superset/installer.ts:127-129`); tests work around it with `as SupersetInstallOptions` casts. | Suggested fix: keep the public signature as `PluginInstallOptions` or add a typed `installSuperset` method.
78. **[plugins]** `boot-plugin.mjs` never passes `build:true` to `plugin.install` (`bin/boot-plugin.mjs:52-56`), so the Superset installer's entire in-process `build:true` branch (`installer.ts:168-296`) is dead relative to the documented boot script (building happens inside `docker compose build`). | Suggested fix: document that `boot:plugins:*` only materializes files, or add an opt-in env var for the in-process build path.

**package-wide**

79. **[package]** `package.json` has no `description` field, so the npm registry description will be empty. | Suggested fix: add a `description`.

---

*Total inaccuracies found: 79.*
