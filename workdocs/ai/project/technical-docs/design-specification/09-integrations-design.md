# 09 — Integrations Design

**Scope:** the `@decaf-ts/integrations` package — provider-agnostic blob store, model-backed + cloud secrets, Keycloak provisioning + auth, Kibana provisioning, feature flags, namespaces authorization scaffold, dynamic object loader, BI dashboard embed plugins, Docker compose orchestration, namespaced credential management over encrypted-at-rest model secrets, a filesystem-backed infrastructure-credential secret store, the namespace RLS bootstrap, non-Environment node service variants, the nodemailer-backed SMTP client, and the SaaS vendor client services over `HttpApiService` (`./comms/{discord,whatsapp,outlook}`, `./io/{confluence,jira,google-docs,microsoft-excel,microsoft-sharepoint}`, `./calendar/google-calendar`, booted hermetically via `./shared/http`'s `bootWithoutEnvironment` — the service layer the Stage 5c `@decaf-ts/as-graph` vendor nodes are built on).

The architecture is detailed in the [Architecture Handbook](../architecture-handbook/07-integrations.md).

> This design is grounded in the read-only research brief `workdocs/ai/project/technical-docs/_research-briefs/08-integrations.md`. Where the brief is thin on a subsystem, this document says so explicitly rather than fabricating. The package is pre-1.0 (`0.14.0`); several subsystems carry stubs and divergent error models (consolidated in the handbook's inaccuracies section).

---

## 1. Design Principles

**Provider-agnostic abstractions over concrete SDKs.** Why: application code must not be coupled to a specific cloud vendor; blob and secret operations should be expressible against a single interface so backends can be swapped by configuration. Enforcing: blob exposes the abstract `BlobStoreService` and a `BlobStoreFactory.create(config)` dispatch; secrets expose the abstract `SecretService` (documentary only today — no provider extends it). Spec: every backend implements the same operation set; the root blob/secrets barrels re-export only the abstract + helpers, never concrete provider classes.

**Uniform `ClientBasedService` lifecycle.** Why: every infrastructure provider should boot identically — construct with no args, `await initialize(config)`, then use — so application bootstrap and tests treat all providers the same. Enforcing: blob, secret, Keycloak, and Kibana providers extend `ClientBasedService<TClient, TConfig>`. Spec: providers accept no constructor args; `initialize` assigns `_config`/`_client` and returns `{config, client}`.

**Optional dependencies, subpath-only provider exports.** Why: an application should pay the install cost only for the providers it uses; importing the root entry must not pull cloud SDKs. Enforcing: cloud SDKs are `optionalDependencies`; providers are exported only via dedicated subpaths. Spec: root entry is free of provider loads. *(Known violation: the blob core barrel re-exports `BlobStoreFactory`, which statically imports every provider — see handbook inaccuracies §blob-1.)*

**Repository-agnostic policy engines.** Why: authorization decisions and feature-flag resolution must be answerable against any backing store, not embedded in a specific repository. Enforcing: `AuthzService.canAccess` operates over `AuthzDataSources` and emits backend-specific contexts (`AccessContext`/`ArangoAuthContext`/`QdrantAuthFilter`); `FeatureFlagService.isEnabled` answers from a cached, reader-fed registry. Spec: policy engines never read fixtures; they consume repository-backed data sources.

**Encrypted-at-rest secrets, all crypto in `@decaf-ts/crypto`.** Why: secret material must never persist in plaintext, and crypto primitives must not drift into `integrations`. Enforcing: `ModelSecretService` encrypts `serialized.value` via `CryptoService` and persists `{encryptedPayload, encryption:{keyId,iv}}` on the `Secret` model. Spec: no symmetric/asymmetric primitive is implemented in `integrations`.

**Non-Environment node service variants for application embedding.** Why: node-style consumers (graph nodes, agents, CLIs) must construct services with explicit configuration and must never inherit infrastructure Environment configuration, while the original `@service(...)` singletons stay Environment-configurable for infrastructure boot. Enforcing: `src/shared/node-service.ts` derives subclasses via `serviceImplementation(...)` + `nonEnvironmentService(...)`; the subclasses carry no `@service()` decorator, override `configFromEnvironment()` to return `undefined`, and reject a no-argument or `Context`-only `boot()` with a `ValidationError`. Spec: node services are always booted `await new XxxNodeService().boot(config)` (see [§15](#15-node-usage-service-pattern-non-environment-boot)).

**DOM-free `integrations`; iframe/React code confined to plugin output.** Why: the package must stay usable from non-browser runtimes and must not ship iframe/React code in its published artifacts. Enforcing: `lib: ["es2022"]`; BI plugin host code is DOM-free; iframe/React plugin code lives under gitignored `integrations/plugins/*` and the Angular host in `for-angular`. Spec: no DOM access from `@decaf-ts/integrations`.

---

## 2. Blob Store Design

### 2.1 Backends

| Provider key | Class | Notes |
|:-------------|:------|:------|
| `memory` | `MemoryBlobStoreService` | In-process; tests/self-hosted default. |
| `local` | `LocalBlobStoreService` | Atomic write + path-traversal protection. |
| `s3` | `S3BlobStoreService` | AWS S3 / S3-compatible via `endpoint`. |
| `minio` | `MinioBlobStoreService` | Marker subclass of S3. |
| `r2` | `R2BlobStoreService` | Marker subclass of S3. |
| `azure-blob` | `AzureBlobStoreService` | Azure Blob Storage. |
| `gcs` | `GcsBlobStoreService` | Google Cloud Storage. |
| `ipfs` | `IpfsBlobStoreService` | Content-addressed; logical keys→CIDs via `IpfsKeyIndex` (`Memory` implemented; `Postgres`/`LocalJson` are stubs). |

### 2.2 Public API

- `BlobStoreService` (abstract): `initialize/put/get/has/stat/delete/copy/list/url`.
- `BlobStoreFactory.create(config)` dispatches on `config.provider`.
- `BlobKey` (`cleanKey`, `physicalKey` with prefix), `BlobValue` (`collectToBuffer`, `computeSha256`, `toAsyncIterable`), `BlobTypes` (configs/results/options + `BlobProvider` union), `BlobErrors` + `translateBlobError`.
- Provider subpaths export concrete services; the core barrel does **not** re-export providers.

### 2.3 Functional requirements

- **FR-B1:** `BlobStoreFactory.create({provider, ...})` returns a `BlobStoreService` for any `BlobProvider` literal; an unknown provider is rejected.
- **FR-B2:** `put(key, value, {ifNotExists, expectedSha256})` normalizes the key via `cleanKey`, optionally conflict-checks, collects the value to a buffer, optionally verifies sha256, and returns a `BlobPutResult` with a backend-specific `uri`.
- **FR-B3:** `get(key, {range, versionId})` returns a `BlobGetResult` whose `value` is an async iterable drained by `collectToBuffer`.
- **FR-B4:** `has`/`stat`/`delete`/`copy`/`list` behave as CRUD over the normalized key namespace.
- **FR-B5:** Provider errors are translated through `translateBlobError` to Decaf error types.
- **FR-B6:** The IPFS provider maps logical keys to CIDs via an `IpfsKeyIndex` and streams `client.cat(cid)`.

### 2.4 Blob upload/retrieve sequence (S3)

```mermaid
sequenceDiagram
    participant App
    participant Store as S3BlobStoreService
    participant S3
    App->>Store: put(key, value, {ifNotExists, expectedSha256})
    Store->>Store: physicalKey = cleanKey(key)
    alt ifNotExists
        Store->>S3: headObject (conflict check)
    end
    Store->>Store: collectToBuffer(value)
    alt expectedSha256
        Store->>Store: verify sha256
    end
    Store->>S3: PutObjectCommand
    S3-->>Store: ok
    Store-->>App: BlobPutResult { uri: "s3://..." }
    App->>Store: get(key, {range, versionId})
    Store->>S3: GetObjectCommand
    S3-->>Store: body stream
    Store-->>App: BlobGetResult { value: toAsyncIterable(body) }
```

### 2.5 Acceptance criteria

- **Given** a memory store initialized via the factory, **when** `put("k", Buffer.from("v"))` is called, **then** `has("k")` returns `true`.
- **Given** an S3-compatible backend initialized with `endpoint`/`credentials`, **when** `store("test-secret", payload)` (secret analog) succeeds and `get` is called, **then** the retrieved buffer equals the uploaded bytes.
- **Given** `expectedSha256` supplied to `put` and a value whose sha256 does not match, **then** `put` rejects with a validation error.
- **Given** the IPFS provider, **when** `get` is called with `range`/`versionId`, **then** the options are currently ignored (known limitation — handbook §blob-6); this is a documented gap, not a passing criterion.

### 2.6 Usage example

```ts
const factory = new BlobStoreFactory();
const store = factory.create({ provider: "memory", sourceId: "factory-test" });
await store.initialize({ provider: "memory", sourceId: "factory-test" });
await store.put("k", Buffer.from("v"));
expect(await store.has("k")).toBe(true);
```

---

## 3. Secrets Design

### 3.1 Providers

| Provider key | Class | Storage | Notes |
|:-------------|:------|:--------|:------|
| `model` | `ModelSecretService` | Decaf model row, encrypted at rest via `CryptoService` | Persists `{encryptedPayload, encryption:{keyId,iv,salt}}` plus `tenantId`/`orgUnitId`/`ownerPrincipalId` namespacing columns; enforces `(name, version)` uniqueness (`SECRET_ALREADY_EXISTS`). |
| `filesystem` | `FsSecretService` | Local filesystem: AES-encrypted `decaf.fs-secret.v1` JSON envelopes in a `0o700` root (`0o600` files, default `.decaf/secrets`) | Bootstrap sink for infrastructure credentials via `InfraCredentialBootstrap`; `list`/`metadata` intentionally unsupported (`SECRET_UNSUPPORTED_OPERATION`). |
| `aws-secrets-manager` | `AwsSecretService` | AWS Secrets Manager | LocalStack-compatible via `endpoint`. |
| `azure-key-vault` | `AzureKeyVaultSecretService` | Azure Key Vault | `exists` implemented. |
| `gcp-secret-manager` | `GcpSecretManagerService` | Google Secret Manager | |
| `hashicorp-vault` | `VaultSecretService` | Vault HTTP API (raw `fetch`) | `hashicorp-vault` npm dep unused. |
| `1password` | `OnePasswordSecretService` | 1Password | Export path misspelled `oneppassword` in `package.json`. |
| `memory` | — | — | Literal present, no implementation. |

There is **no secret factory**; each provider is constructed directly. No provider `extends SecretService` — the abstract is documentary only (handbook §secrets-11).

### 3.2 Public API

- `SecretService` (abstract): `store/retrieve/delete/exists/list/metadata` + optional `rotate`.
- `SecretName`/`SecretReference`/`SecretSerialization`, `SecretErrors`/`translateError`, `SecretTypes`.
- `model/` → `ModelSecretService`, `Secret` model, `ModelSecretServiceConfig`, `ModelSecretNodeService`.
- `fs/` → `FsSecretService`, `FsSecretServiceConfig` (+ `DEFAULT_FS_SECRET_ROOT`/`DEFAULT_FS_SECRET_KEY_ID`), `FsSecretEnvironment` (`secrets.fs` Environment slice), `FsSecretNodeService`.
- `InfraCredentialBootstrap` + `InfraCredentialSeed`/`InfraSecretStore` + `createInfraCredentialBootstrap()`.
- Per-cloud provider subpaths (`aws`/`azure`/`gcp`/`vault`/`onepassword`) export their services, config types, and `*SecretNodeService` node counterparts (see [§15](#15-node-usage-service-pattern-non-environment-boot)).

### 3.3 Secrets state, storage & access

Secrets are never persisted in plaintext. The envelope is `SecretSerialization = {encoding, value}`; providers JSON-stringify the full envelope into a `SecretString` for storage. For the model provider, `serialized.value` is encrypted via `CryptoService` and the `Secret` row stores `{encryptedPayload, encryption:{keyId, iv, salt}}` — the per-secret salt is fed back into `deriveKeyFromSecret(keySecret, salt)` on retrieve, so master `keySecret` material can rotate without re-encrypting stored secrets. The model provider also stamps the row with `tenantId`/`orgUnitId`/`ownerPrincipalId` namespacing columns (taken from `StoreSecretOptions`) so the namespace RLS policies can scope it, and forwards decaf `Context` arguments to every repository call. The filesystem provider stores each secret as an isolated `decaf.fs-secret.v1` envelope `{name, provider, createdAt, updatedAt, contentType?, tags?, version?, encryption:{keyId, iv, salt}, payload}` written temp-file-then-rename with mode `0o600` under a `0o700` root directory (default `.decaf/secrets`). Access is gated by the provider's own auth (cloud IAM / Vault token / 1Password credentials) supplied via the provider config object — never via `process.env` reads inside the integrations code; the model and filesystem providers resolve their Environment slices (`secrets.model`, `secrets.fs`) through the decaf `SecretEnvironment` accumulator. Names are validated/normalized through `validateSecretName`/`normalizeSecretName`. `SecretReference` carries `{provider, name}`; `parseSecretReference` parses `secrets/<provider>/<name>` strings. Model-backed rows additionally enforce **`(name, version)` uniqueness** (SAA-1132): `store`/`rotate` pre-check the combination and reject a duplicate with a `SecretError("SECRET_ALREADY_EXISTS")` before writing (`rotate` excludes the row being updated), the unique `uq_secrets_name_version (name, coalesce(version, ''))` database index backstops the same rule against concurrent writers — versions are optional, so `NULL` versions collapse to `''` and exactly one default (unversioned) row per name is enforced alongside explicitly versioned rows — and `sql/004_credentials.sql` fails closed on legacy duplicate `(name, version)` rows before that index can be created. Name-based operations (`retrieve`/`delete`/`metadata`/`rotate`) order matches by `updatedAt DESC`, so when several rows share a name (or a name/version pair) the most recently updated row resolves deterministically.

### 3.4 Functional requirements

- **FR-S1:** `store(name, payload)` validates the name, serializes the payload to `{encoding, value}`, JSON-stringifies the envelope, and persists via the provider; returns a `SecretReference`.
- **FR-S2:** `retrieve(name)` reads the stored envelope, JSON-parses, and deserializes back to the original payload type.
- **FR-S3:** `exists`/`list`/`metadata`/`delete` behave as CRUD over the secret namespace.
- **FR-S4:** The model provider encrypts `serialized.value` via `CryptoService` and persists `{encryptedPayload, encryption:{keyId,iv}}`.
- **FR-S5:** Names are validated via `validateSecretName` and normalized via `normalizeSecretName`.
- **FR-S6:** The filesystem provider (`FsSecretService`) requires a master `keySecret` (boot fails with a `ValidationError` when neither the `secrets.fs` Environment slice nor the explicit config supplies one), derives per-secret keys via `CryptoService.deriveKeyFromSecret(keySecret, salt)`, and refuses to expose `list`/`metadata` with a `SECRET_UNSUPPORTED_OPERATION` `SecretError` — infrastructure credentials are never enumerable.
- **FR-S7:** `InfraCredentialBootstrap.ensure(seeds)` is idempotent: it stores only seeds that do not exist yet (or that carry `overwrite: true`) and returns their `SecretReference`s; `createInfraCredentialBootstrap()` boots a default `FsSecretService` and wraps it.
- **FR-S8:** `ModelSecretService` persists `tenantId`/`orgUnitId`/`ownerPrincipalId` from `StoreSecretOptions` onto the `Secret` row and forwards decaf `Context` arguments to every repository call (`create`/`select`/`count`/`update`/`delete`).
- **FR-S9:** Model-backed `(name, version)` uniqueness (SAA-1132): `store` and `rotate` reject a combination already held by another row with a `SecretError("SECRET_ALREADY_EXISTS")` before writing (`rotate` excludes the row being updated); the `uq_secrets_name_version` unique index in `sql/004_credentials.sql` treats `NULL` versions as `''`, and a fail-closed `DO` guard aborts the script while legacy duplicate `(name, version)` rows exist. Name-based `retrieve`/`delete`/`metadata`/`rotate` resolve multiple matches deterministically by `updatedAt DESC`.

### 3.6 Secret resolution sequence (AWS)

```mermaid
sequenceDiagram
    participant App
    participant Sec as AwsSecretService
    participant SM
    App->>Sec: store("test-secret", {username,password})
    Sec->>Sec: validateSecretName / normalizeSecretName
    Sec->>Sec: serializeSecretPayload -> {encoding, value}
    Sec->>Sec: JSON.stringify envelope -> SecretString
    Sec->>SM: CreateSecretCommand
    alt exists
        Sec->>SM: PutSecretValueCommand (fallback)
    end
    SM-->>Sec: ok
    Sec-->>App: SecretReference
    App->>Sec: retrieve("test-secret")
    Sec->>SM: GetSecretValueCommand
    SM-->>Sec: SecretString
    Sec->>Sec: JSON.parse -> deserializeSecretPayload
    Sec-->>App: payload
```

### 3.7 Acceptance criteria

- **Given** an initialized `AwsSecretService` against LocalStack, **when** `store("test-secret", {username:"testuser", password:"password123"})` then `retrieve("test-secret")` is called, **then** the returned object's `username` equals `"testuser"`.
- **Given** a missing secret name, **when** `retrieve("does-not-exist")` is called, **then** the provider rejects with a not-found error.
- **Given** the model provider, **when** a secret is stored then retrieved, **then** the persisted row contains `encryptedPayload` (not plaintext) and `encryption.{keyId,iv,salt}`. *(The former encoding round-trip defect is fixed: `retrieve` now JSON-parses the decrypted envelope and deserializes it, preserving the original `{encoding, value}` shape.)*
- **Given** `FsSecretService` booted with a `keySecret`, **when** `store`/`retrieve` round-trip a payload, **then** the envelope file on disk contains only `{encryptedPayload, encryption:{keyId,iv,salt}}` (no plaintext), and `list`/`metadata` reject with `SECRET_UNSUPPORTED_OPERATION`.
- **Given** `InfraCredentialBootstrap.ensure` called twice with the same seed and no `overwrite`, **when** the second run executes, **then** no additional store happens and the reference list is unchanged.

### 3.8 Usage example

```ts
const secrets = new AwsSecretService();
await secrets.initialize({ provider: "aws-secrets-manager", region: "us-east-1",
  endpoint: "http://localhost:4566", credentials: { accessKeyId: "test", secretAccessKey: "test" } });
await secrets.store("test-secret", { username: "testuser", password: "password123" });
const data = await secrets.retrieve("test-secret") as Record<string, unknown>;
expect(data.username).toBe("testuser");
```

### 3.9 Filesystem secret provider (FsSecretService)

`FsSecretService` is a `@service("secret-fs")`-decorated `ClientBasedSecretService` that implements the **never-exposed, retrieve-to-use-immediately** infrastructure-credential semantics:

- Configuration resolves from the `secrets.fs` Environment slice (`rootPath`, `keySecret`, `keyId`) or an explicit boot config; a missing `keySecret` disables the Environment-derived path, and boot fails closed with a `ValidationError` when neither source supplies one.
- Each secret is one JSON envelope file (`<normalizedName>.json`) in the resolved root; the root is created with mode `0o700` and envelopes are written through a temp-file-then-rename cycle with mode `0o600`.
- `list` and `metadata` intentionally throw `SECRET_UNSUPPORTED_OPERATION` — the store is a minimal bootstrap sink, not a browsable vault.
- The non-Environment node counterpart is `FsSecretNodeService` (explicit `boot(config)` only).

### 3.10 Infrastructure credential bootstrap (InfraCredentialBootstrap)

`InfraCredentialBootstrap` wraps any `InfraSecretStore` (`store`/`retrieve`/`delete`/`exists`) and provides the initialization hook for deployment-time infrastructure credentials:

- `ensure(seeds)` checks `exists` per seed and stores only what is missing (or explicitly `overwrite: true`), returning the stored `SecretReference`s — safe to run on every boot.
- `retrieve(name)` reads a credential back immediately before use; the value is never cached, logged, or exposed through listings.
- `createInfraCredentialBootstrap(...)` is the convenience factory: it boots a default `FsSecretService` (Environment or explicit args) and wraps it.

```ts
const infra = await createInfraCredentialBootstrap({ keySecret: "infra-master-key" });
await infra.ensure([{ name: "smtp/relay", value: { host: "...", password: "..." } }]);
const creds = await infra.retrieve<{ host: string; password: string }>("smtp/relay");
```

### 3.11 Namespaced credentials (Credential model + CredentialService)

The `Credential` model (`@table("credentials")`, extends `AuthorizationModel`) is the namespaced credential **metadata** record: `tenant` (required, `RESTRICT`), `orgUnit` (optional, `NULLIFY`), `owner` principal (optional, `NULLIFY`), `name`, `credentialType`, `secretName`, `provider` (`CredentialProvider`: `model` | `filesystem`), `description`, `enabled`, `metadata`, `expiresAt`, `lastUsedAt`. It never carries the secret value itself.

`CredentialService` (extends `BaseModelService<Credential>`) manages the lifecycle:

- The secret store is always the model-backed `ModelSecretService` — a configured store with `provider !== "model"` is rejected with a `ValidationError` (filesystem secrets stay infra-only and are never exposed through the credentials API).
- `createCredential(input)` validates the name (`/^[A-Za-z0-9][A-Za-z0-9._-]*$/`, ≤255 chars), generates the secret name `credential-<uuid>`, **stores the secret first**, then creates the metadata row; if the row creation fails, the just-stored secret is force-deleted so no orphan remains.
- `rotateCredential` delegates to the store's `rotate` when available, otherwise re-stores under the same secret name with a version; `getCredential`/`listCredentials`/`markCredentialUsed`/`deleteCredential` cover the remaining CRUD (delete removes the row first, then force-deletes the secret).
- There is deliberately **no `resolveCredentialSecret`-style retrieval API** on the credentials surface: secret values are resolved through the RLS-restricted, context-bound `ModelSecretService` path (the as-graph node migration consumes this in Phase B).

`sql/004_credentials.sql` provisions the namespacing columns and indexes: `secrets.tenant_id/org_unit_id/owner_principal_id`, a unique `credentials (tenant_id, org_unit_id, lower(name))` index, and owner/secret-name/tenant lookup indexes. It also replaces the former non-unique `ix_secrets_name` with the unique `uq_secrets_name_version (name, coalesce(version, ''))` index (SAA-1132), and a fail-closed `DO` guard aborts the script with an exception while duplicate `(name, version)` rows remain.

```mermaid
sequenceDiagram
    autonumber
    participant App
    participant CS as CredentialService
    participant MSS as ModelSecretService
    participant Repo as Credential repository
    App->>CS: createCredential({name, secret, tenantId, ...})
    activate CS
    CS->>CS: validate name / normalize
    CS->>MSS: store("credential-<uuid>", secret, {tenantId, orgUnitId, ownerPrincipalId})
    activate MSS
    MSS->>MSS: serialize + deriveKey(keySecret, salt) + encrypt (CryptoService)
    MSS-->>CS: SecretReference
    deactivate MSS
    CS->>Repo: create(Credential metadata row)
    alt row creation fails
        CS->>MSS: delete(secretName, {force:true}) (no orphan secret)
    end
    CS-->>App: Credential
    deactivate CS
```

---

## 4. Keycloak Design

### 4.1 Public API

- `KeycloakService` orchestrator; `KeycloakAuthService`/`ClientService`/`IdentityProviderService`/`RealmService`/`RoleService`/`UserService`.
- `buildBrokerIdentityProviderPayload`; broker helpers `getBrokerExternalIdentityKey`, `isLocalKeycloakIssuer`.
- Config types `KeycloakSetupConfig`, `KeycloakBrokerSetupConfig`, etc.

### 4.2 Functional requirements

- **FR-K1:** `KeycloakService.setupOrganization(config)` creates a realm, waits for it to be ready (poll ≤ 15s), creates a realm user, assigns `realm-management` client roles, creates a client, and updates client-scope mappers.
- **FR-K2:** `setupKeycloak` adds the admin user and grants the `admin` realm role.
- **FR-K3:** Role grants resolve role UUIDs and POST to the user's role-mappings.
- **FR-K4:** Each request toggles `https.Agent.rejectUnauthorized` via the runtime resolver based on `isProduction()`.

### 4.3 Provisioning sequence

```mermaid
sequenceDiagram
    participant App
    participant Ks as KeycloakService
    participant KC
    App->>Ks: setupOrganization(config)
    Ks->>KC: get admin token
    Ks->>KC: createRealm
    Ks->>KC: waitForRealm (poll <= 15s)
    Ks->>KC: create realm user
    Ks->>KC: assign realm-management client roles
    Ks->>KC: createClient
    Ks->>KC: update client-scope mappers
    KC-->>Ks: ok
    Ks-->>App: organization ready
```

### 4.4 Acceptance criteria

- **Given** a reachable Keycloak admin endpoint and a type-valid `KeycloakSetupConfig`, **when** `setupOrganization` completes, **then** the realm exists, the realm user exists with `realm-management` client roles, and the client exists with updated scope mappers.
- **Given** `isProduction: () => false`, **then** TLS verification is relaxed for the configured endpoint.

> The `KeycloakSetupConfig` type does not declare `isProduction` even though tests supply it (handbook §keycloak-30). Config examples in prior docs are not type-valid (handbook §keycloak-29). HTTP 401/403 are mis-mapped to `NotFoundError` (handbook §keycloak-33).

---

## 5. Kibana Design

### 5.1 Public API

- `KibanaService` orchestrator; `KibanaSpaceService`/`DataViewService`/`RoleService`/`UserService`/`DashboardService`/`AuthService`.
- `KibanaIndexBuilder`/`KibanaIndexBuilderCollection`; `createDefaultKibana*` helpers; `KibanaIndexMatchMode` enum (`EXACT`/`PREFIX`/`LOGGER_GENERATED`).

### 5.2 Index pattern builder

- `KibanaIndexBuilder extends Model`: fluent `setX(): this` setters, terminal `build()`.
- Title composition: `EXACT` → `indexName` (no `*`); `PREFIX` → `prefix + sep + "*"` (exactly one trailing `*`); `LOGGER_GENERATED` → `segments.join(sep) + sep + "*"`. Optional compounding appends logger-rendered segments (uses `@decaf-ts/logging` `compileLogPattern` + `logParameterRegistry.render`).
- `KibanaIndexBuilderCollection.build()` validates and maps many builders → `KibanaDataViewConfig[]`.

### 5.3 Functional requirements

- **FR-Ki1:** `KibanaIndexBuilder.build()` validates the combination of mode + inputs and rejects `*` in `EXACT` and non-trailing `*` in `PREFIX`.
- **FR-Ki2:** `KibanaDataViewService.createDataView` POSTs `/s/{realm}/api/data_views/data_view`, falling back to `updateDataView` on 409/400.
- **FR-Ki3:** `setDefaultDataView` discovers the Kibana version via `/api/status` then sets `defaultIndex`.
- **FR-Ki4:** `KibanaSpaceService` creates, updates, and deletes spaces.

### 5.4 Data view sequence

```mermaid
sequenceDiagram
    participant App
    participant B as KibanaIndexBuilder
    participant Dv as KibanaDataViewService
    participant Kib
    App->>B: setX(...).build()
    B-->>App: KibanaDataViewConfig (title)
    App->>Dv: createDataView(config)
    Dv->>Kib: POST /s/{realm}/api/data_views/data_view
    alt 409/400
        Dv->>Kib: updateDataView (fallback)
    end
    App->>Dv: setDefaultDataView(id)
    Dv->>Kib: GET /api/status (discover version)
    Dv->>Kib: set defaultIndex
```

### 5.5 Acceptance criteria

- **Given** an `EXACT` builder with `indexName = "logs"`, **when** `build()` is called, **then** the title is `"logs"` and contains no `*`.
- **Given** a `PREFIX` builder with `prefix = "app"`, `sep = "-"`, **when** `build()` is called, **then** the title is `"app-*"`.
- **Given** a `LOGGER_GENERATED` builder with segments `["a","b"]`, `sep = "-"`, **then** the title is `"a-b-*"`.
- **Given** an `EXACT` builder whose `indexName` contains `*`, **then** `build()` rejects with a validation error.

> `KibanaSetupConfig` omits required `id` in doc examples (handbook §kibana-35) and does not declare `isProduction` (handbook §kibana-36). A doc-advertised `deleteDataView` does not exist (handbook §kibana-34).

---

## 6. Feature Flags Design

### 6.1 Public API

- `FeatureFlagService` + config; `FeatureFlag`/`FeatureFlagAccess` models.
- `FeatureFlagReader`/`EnvironmeFlagReader`; `FeatureFlagEnvironment` + env loaders.
- Decorators `featureFlags`/`featureAuth`/`blockFeatureOperations`/`renderIfFeature`/`hideOnFeature` + `getFeatureGateMetadata`/`shouldExposeForFeatures`/`shouldHideForFeatures`.
- Utils `normalizeFeatureRegistry`, `isFeatureFlagEnabledByName`.

### 6.2 Functional requirements

- **FR-F1:** `FeatureFlagService.initialize(config)` accepts a reader override (default `EnvironmeFlagReader`), reads the environment registry, loads persisted `FeatureFlag` rows, and builds a cached registry where persisted rows override environment defaults.
- **FR-F2:** `isEnabled(key)` synchronously answers from the cached registry via `normalizeFeatureName` → `isFeatureFlagEnabledByName`.
- **FR-F3:** `isEnabledForSubject(subject, key)` resolves subject-scoped flags via `resolveFeatureFlagsForSubject` (lists enabled `FeatureFlagAccess` rows, collects `featureKey`s, queries enabled `FeatureFlag` rows, returns `{key: config??true}`).
- **FR-F4:** Decorators store `FeatureFlagRule` metadata on model members.

### 6.3 Feature flag evaluation sequence

```mermaid
sequenceDiagram
    participant App
    participant Svc as FeatureFlagService
    participant Reader as FeatureFlagReader
    participant DB as FeatureFlag/FeatureFlagAccess
    App->>Svc: initialize(config)
    Svc->>Reader: read env -> env registry
    Svc->>DB: load persisted FeatureFlag rows
    Svc->>Svc: cachedRegistry = merge(env, persisted overrides)
    App->>Svc: isEnabled(key)
    Svc->>Svc: normalizeFeatureName(key)
    Svc->>Svc: isFeatureFlagEnabledByName(cachedRegistry, key)
    Svc-->>App: boolean
```

### 6.4 Acceptance criteria

- **Given** a flag `featureX` enabled in the environment registry and no persisted override, **when** `isEnabled("featureX")` is called, **then** it returns `true`.
- **Given** a flag `featureX` enabled in the environment but a persisted `FeatureFlag` row disabling it, **when** `isEnabled("featureX")` is called, **then** the persisted override wins and it returns `false`.
- **Given** `featureX` disabled (flag off), **when** a `featureFlags`/`renderIfFeature`-decorated member is evaluated, **then** the member is suppressed per the decorator's rule.
- **Given** a subject with a `FeatureFlagAccess` row enabling `featureY`, **when** `isEnabledForSubject(subject, "featureY")` is called, **then** it returns `true`.

> The reader class is misspelled `EnvironmeFlagReader` (handbook §feature-flags-40). `FEATURE_FLAG_ENV_PREFIX` is declared but never wired (handbook §feature-flags-41). `grantFeatureAccess`/`revokeFeatureAccess` ignore the feature key on lookup (handbook §feature-flags-42).

---

## 7. Namespaces (Authorization Scaffold) Design

### 7.1 Public API

- **Types:** enums `IsolationTier`/`MembershipStatus`/`PrincipalKind`/`ScopeKind`/`PermissionCategory`/`ResourceVisibility`/`StorageKind`/`StorageBindingKind`; DTOs; `AuthzDataSources`/`AccessContext`/`ArangoAuthContext`/`QdrantAuthFilter`.
- **Utils:** `BaseModelService`, `buildAccessContext`/`buildArangoContext`/`buildQdrantFilter`, `sameTenant`, relation policy constants.
- **Models:** 22 authorization models (tenants, org-unit closure, principals/memberships, roles/permissions, role-assignments, protected resources/resource-grants, effective permissions, inheritance blocks, credentials).
- **Services:** 25 repository-backed services incl. `AuthzService`, `BootstrapService`, `EffectivePermissionService`, `OrgUnitService`, `SystemManagementService`, `ResourceLifecycleService`, `CredentialService`.
- **RLS:** the `src/namespaces/rls/` module — SQL template (`rls.template.ts`/`rls.constants.ts`/`rls.types.ts`), `RlsBootstrapService`, `runAsPrincipal`, `principal-resolver` (`resolvePrincipalForSubject`), the session binding (`session-binding.ts`: `namespaceRlsSessionBinding`/`namespaceRlsTypeORMOptions`), and the `RLS_PERMISSION_KEYS`/`RLS_SETTINGS`/`RLS_ROLE_KEYS`/`RLS_PROTECTED_TABLES` constants (see §7.7).

### 7.2 Functional requirements

- **FR-N1:** `AuthzService.canAccess(input)` short-circuits on owner → explicit `ResourceGrant`s → visibility-driven effective-permission lookup, and emits a backend-specific context (`AccessContext`/`ArangoAuthContext`/`QdrantAuthFilter`).
- **FR-N2:** `EffectivePermissionService.rebuildForPrincipal(principal)` deletes existing rows, collects direct + group-derived `RoleAssignment`s, expands scopes (Tenant → tenant; Resource → resource; OrgUnit non-inheriting → single scope; inheriting → all closure descendants, skipping `InheritanceBlock` categories), and writes `EffectivePermission` rows.
- **FR-N3:** `BootstrapService.bootstrapTenantFromTemplate` templates a full tenant setup transactionally (tenant + root org unit + permissions + roles + owner user + owner role assignment).
- **FR-N4:** Postgres RLS (`sql/002_rls.sql`) enforces tenant isolation; `app.principal_id` scopes reads, bound transaction-locally (`set_config(..., true)`) per request transaction from the context — deny-by-default: an unresolvable principal leaves the setting unbound and RLS denies. The binding config lives in integrations/namespaces (`namespaceRlsSessionBinding`); the generic executor lives in `for-typeorm` (see [01-persistence-design §6](./01-persistence-design.md)).
- **FR-N5:** Multi-write services are `@transactional`.
- **FR-N6:** The namespace RLS template is generated from `src/namespaces/rls/rls.template.ts` into `sql/002_rls.sql` (24 `SECURITY DEFINER` helper functions, 88 `CREATE POLICY` statements, ENABLE/FORCE RLS on 22 tables) and is applied idempotently via `RlsBootstrapService.apply()` through any `RlsQueryExecutor` (`pg.Client`/`pg.Pool`-shaped, no runtime `pg` import).
- **FR-N7:** Session binding helpers validate principal/tenant UUIDs before binding: `setPrincipal`/`setTenant`/`clearPrincipal` use `set_config(..., is_local)` (transaction-local by default), `currentPrincipal` reads `app_rls_principal_id()`, and `runAsPrincipal(executor, principalId, run, {commit?})` wraps a callback in a transaction with the principal bound — rolling back by default so integration-test mutations stay isolated.
- **FR-N8:** `RlsBootstrapService.apply()` fails closed before any DDL (SAA-1132): `assertFunctionOwnerPrivileges()` reads the connected role's `rolsuper`/`rolbypassrls` flags from `pg_roles` and requires `SUPERUSER` or `BYPASSRLS`; otherwise — or when the privileges cannot be determined — it throws `RlsFunctionOwnerError` (extends `InternalError`), because a `SECURITY DEFINER` helper-function owner that does not bypass RLS would make every policy evaluation recurse under `FORCE ROW LEVEL SECURITY`.
- **FR-N9:** Subject→principal resolution is privileged and fail-closed: the template adds the `SECURITY DEFINER` helper `app_rls_principal_for_subject(text, uuid)` (`search_path` pinned to `public, pg_temp`, `REVOKE ALL ... FROM PUBLIC`, returns `NULL` unless exactly one principal matches the subject — optionally tenant-scoped), consumed by `resolvePrincipalForSubject(client, subject, tenantId?)`, which requires a privileged auth-prime/service-role client, uses fully parameterized SQL, UUID-validates inputs and results, and resolves to `undefined` (deny) on empty/ambiguous/non-UUID outcomes.
- **FR-N10:** Credential and secret reads run inside principal-bound transactions: `CredentialService.getCredential`/`markCredentialUsed` use an explicit `withinTransaction` boundary (read + use-stamp in one transaction; reuses an in-flight `ContextLock` or opens one via `resolveTransactionLock` + `begin`), and `ModelSecretService` wraps the secret SELECT in `withinPrincipalTransaction` — on TypeORM adapters `begin` binds the context principal to `app.principal_id` so namespace RLS applies, when the namespaced binding config is wired (`namespaceRlsTypeORMOptions()` spread into the adapter options).

### 7.3 Effective-permission rebuild sequence

```mermaid
sequenceDiagram
    participant App
    participant Eps as EffectivePermissionService
    participant Repo as RoleAssignment repository
    participant EP as EffectivePermission repository
    App->>Eps: rebuildForPrincipal(principal)
    Eps->>EP: delete existing rows for principal
    Eps->>Repo: collect direct + group-derived RoleAssignments
    loop each assignment
        Eps->>Eps: expand scope
        alt Tenant
            Eps->>Eps: -> tenant
        alt Resource
            Eps->>Eps: -> resource
        alt OrgUnit non-inheriting
            Eps->>Eps: -> single scope
        alt OrgUnit inheriting
            Eps->>Eps: -> all closure descendants (skip InheritanceBlock categories)
        end
    end
    Eps->>EP: write EffectivePermission rows
```

### 7.4 Acceptance criteria

- **Given** a principal with no direct or group-derived `RoleAssignment` for resource `R`, **when** `canAccess({principal, action:"read", resource:R, tenant:T})` is called, **then** it denies access.
- **Given** a principal who is the owner of resource `R`, **when** `canAccess` is called, **then** it short-circuits and permits.
- **Given** a `RoleAssignment` on an inheriting org unit granting `resource.read`, **when** `rebuildForPrincipal` runs, **then** `EffectivePermission` rows are written for all closure descendants except categories blocked by an `InheritanceBlock`.
- **Given** a request whose `tenantId` differs from the matched permission's `tenantId` on the resource branch, **then** access is denied. *(Known gap: the scope branch does not enforce tenant scoping — handbook §namespaces-48.)*
- **Given** an unregistered resource, **when** `ResourceLifecycleService.unregisterResource` runs, **then** grants and the resource are deleted. *(Known gap: this sequence is not `@transactional` — handbook §namespaces-49.)*

### 7.5 Provisioning prerequisites

Provision the Postgres schema plus `sql/001_constraints.sql`, `sql/004_credentials.sql` (credential/secret namespacing columns + indexes; its fail-closed guard aborts while legacy duplicate `(name, version)` secret rows exist, see [§3.11](#311-namespaced-credentials-credential-model--credentialservice)), `sql/002_rls.sql` (RLS — apply it through a `SUPERUSER` or `BYPASSRLS` executor role, see [§7.7](#77-namespace-rls-template-and-bootstrap)), and `sql/003_indexes.sql`; request-scoped `app.principal_id` is bound transaction-locally by the TypeORM adapter from the context when the host spreads `namespaceRlsTypeORMOptions()` into the adapter options (deny-by-default, see [§7.7](#77-namespace-rls-template-and-bootstrap)). `sql/003_indexes.sql` is currently an empty placeholder (handbook §namespaces-47). `AuthzService` must be fed by repository-backed data sources, never fixtures.

### 7.6 Usage example

```ts
const { tenantId } = await new BootstrapService().bootstrapTenantFromTemplate({
  tenant: { slug: "acme", name: "Acme" }, rootOrgUnit: { name: "Root" },
  permissions: [{ key: "resource.read", category: PermissionCategory.ContentRead }],
  roles: [{ key: "owner", name: "Owner", permissionKeys: ["resource.read"] }],
  ownerUser: { displayName: "Admin", email: "admin@acme.example" }, ownerRoleKey: "owner",
});
```

### 7.7 Namespace RLS template and bootstrap

`sql/002_rls.sql` is **generated** from `src/namespaces/rls/rls.template.ts` ("do not edit by hand") and applied through application bootstrap or a migration runner instead of hand-run SQL. The template is idempotent and covers the 22 tables in `RLS_PROTECTED_TABLES` — the authorization machinery, org profiles, protected resources, and the credential/secret records (`credentials`, `secrets`).

**Reader/writer/admin semantics.** Permission keys are `RLS_PERMISSION_KEYS` (`namespace.read`/`namespace.write`/`namespace.admin`) and the default role keys are `RLS_ROLE_KEYS` (`namespace-reader`/`namespace-writer`/`namespace-admin`):

- **Reader** — read-only: sees content tables; never administrative tables (`permissions`, `roles`, `role_permissions`, `role_assignments`, `inheritance_blocks`, `storage_bindings` are admin-only for all four operations).
- **Writer** — reader plus non-administrative writes (create/update/delete of content rows).
- **Admin** — everything in the namespace, including administrative tables (`app_rls_is_scope_admin` gates `role_assignments`/`effective_permissions`; `app_rls_is_admin()` gates global admin tables).

Enforcement is by scope kind (`tenant`, `org_unit`, `resource`) and principal identity: department/project/team structures map onto the org-unit closure hierarchy, and users always see their own identity rows (`users.id = app_rls_subject_id()`, own `principals`, own `tenant_memberships`) plus their own credentials/secrets (`owner_principal_id = app_rls_principal_id()`).

Session settings are `RLS_SETTINGS`: `app.principal_id` (the acting principal; the TypeORM adapter binds it transaction-locally per request transaction when the namespaced binding config is wired — see the binding bullet below) and `app.tenant_id` (diagnostic/multi-tenant checks). Credential/secret rows are readable by their owner or by a principal holding the credential-scope read permission (`app_rls_can_read_credential_scope(tenant_id, org_unit_id)`), and writable only via `app_rls_can_write_credential_scope`.

Consumer contract:

- Provision the namespace schema (`sql/001_constraints.sql`), then `sql/004_credentials.sql` (namespacing columns + indexes; its fail-closed `DO` guard aborts the script while legacy duplicate `(name, version)` secret rows exist), then apply `sql/002_rls.sql` — via `RlsBootstrapService.apply()` or a migration runner — before request-scoped traffic reaches the database.
- `RlsBootstrapService` is a `ClientBasedService` booted with a query executor (`pg.Client`, `pg.Pool`, or a compatible wrapper — the executor contract is structural, so `pg` stays an optional peer dependency): `boot(executor[, config])`, `apply()` → `{applied}`, `setPrincipal(id, {local?})`, `setTenant(id, {local?})`, `clearPrincipal({local?})`, `currentPrincipal()`, plus `assertFunctionOwnerPrivileges()` — called automatically by `apply()` before any DDL, it verifies through `pg_roles` that the connected role is `SUPERUSER` or `BYPASSRLS` and throws `RlsFunctionOwnerError` otherwise (or when the privileges cannot be determined), so connect the bootstrap executor as the database-owner/BYPASSRLS migration role.
- `runAsPrincipal(executor, principalId, run, {commit?})` binds the principal inside a transaction and rolls back by default (IT isolation); pass `{commit: true}` for real writes. The executor must be a single connection (`pg.Client`), not a pool, because the transaction and the session setting are connection-scoped.
- **Request-scoped principal binding (SAA-1158/SAA-1159).** Hosts do not set `app.principal_id` per request on a shared session: the binding config lives in integrations/namespaces — spread `namespaceRlsTypeORMOptions()` (which wraps `namespaceRlsSessionBinding` as `{ sessionBinding }`) into the `TypeORMAdapter` options — while the generic executor lives in for-typeorm: inside `TypeORMContextLock.begin(context)`, Postgres-only, one parameterized `SELECT set_config($1, $2, true)` is issued per resolved setting right after `startTransaction()`. The namespaced binding reads the context's `principalId` key (configurable) and UUID-validates it; deny-by-default: no resolvable principal ⇒ binding returns nothing ⇒ setting unbound ⇒ RLS denies. The binding is transaction-local only — discarded at commit/rollback, never session-wide on pooled connections (see [01-persistence-design §6](./01-persistence-design.md)).
- **Subject→principal resolution at auth-priming.** Because the helper is `REVOKE`d from `PUBLIC`, `resolvePrincipalForSubject` runs on a privileged connection (service role), never an RLS-restricted application session: it maps the authenticated subject (and optional tenant) to the single matching principal UUID or fails closed to `undefined`. Hosts resolve subject→principal once at auth-priming time and put the resulting `principalId` on the request context.

```mermaid
sequenceDiagram
    autonumber
    participant App
    participant Rbs as RlsBootstrapService
    participant PG as Postgres (pg.Client)
    App->>Rbs: boot(executor)
    activate Rbs
    App->>Rbs: apply()
    Rbs->>PG: SELECT rolsuper/rolbypassrls FROM pg_roles (current_user)
    PG-->>Rbs: role flags
    alt SUPERUSER or BYPASSRLS
        Rbs->>PG: CREATE OR REPLACE FUNCTION ... (24 helpers)
        Rbs->>PG: CREATE POLICY ... (88 policies, 22 tables)
        Rbs-->>App: { applied: <statements> }
    else neither (or undeterminable)
        Rbs-->>App: RlsFunctionOwnerError (fail closed, no DDL sent)
    end
    App->>Rbs: setPrincipal(principalId)
    Rbs->>PG: SELECT set_config('app.principal_id', id, true)
    App->>Rbs: runAsPrincipal(executor, id, cb)
    Rbs->>PG: BEGIN + set_config(...) + cb + COMMIT/ROLLBACK
    deactivate Rbs
```

---

## 8. Object Loader Design

### 8.1 Public API

- `ObjectLoader` + `createLoaderHookContext`.
- Family loaders: `ModelObjectLoader`/`AdapterObjectLoader`/`RepositoryObjectLoader`/`ServiceObjectLoader`/`ControllerObjectLoader`/`EnvironmentObjectLoader`/`AngularComponentObjectLoader` (the former `GraphNodeObjectLoader` was removed with the graph legacy cutover, SAA-503).
- `ObjectLoaderFamily`/`ObjectLoaderHook`/options types.

### 8.2 Functional requirements

- **FR-L1:** `ObjectLoader.load(source, selection?)` normalizes the source (paths → `file:` URLs; bare specifiers passed through), performs ESM dynamic `import()`, and selects the export (`default` by default; named on request; single-named-export fallback).
- **FR-L2:** `withHooks([...])` and `withOptions({...})` return a **new** immutable instance; the original loader is unaffected.
- **FR-L3:** Post-load hooks run in deterministic order and may transform the loaded value; decorator metadata is preserved.
- **FR-L4:** Family subclasses fix the `family` and expose a family-verb loader.

### 8.3 Loader discovery sequence

```mermaid
sequenceDiagram
    participant App
    participant L as ObjectLoader
    participant Mod
    App->>L: new ObjectLoader({family:"service"}) or family subclass
    App->>L: withHooks([...]) -> new immutable loader
    App->>L: withOptions({...}) -> new immutable loader
    App->>L: load(source, selection?)
    L->>L: normalize source (path -> file: URL; bare specifier passthrough)
    L->>Mod: import(normalized)
    Mod-->>L: module namespace
    L->>L: select export (default | named | single-named fallback)
    loop ordered hooks
        L->>L: hook(value, ctx)
    end
    L-->>App: loaded value (+ preserved metadata)
```

### 8.4 Acceptance criteria

- **Given** a module with a default export, **when** `load("./path")` is called without a selection, **then** the default export is returned.
- **Given** a module with a named export `Foo`, **when** `load("./path", {named:"Foo"})` is called, **then** `Foo` is returned.
- **Given** a loader `L1` and `L2 = L1.withHooks([h])`, **when** `L1.load(...)` is called, **then** `h` is **not** invoked (immutability).
- **Given** a source that cannot be resolved/imported, **when** `load(source)` is called, **then** the loader rejects with a not-found/error (loader not-found).

> `ObjectLoaderExportSelection` is exported twice from the loader barrel (handbook §loader-60). `withOptions`/`createLoaderHookContext` and URL/`data:` sources are untested (handbook §loader testing gaps).

---

## 9. Nest Auth Integration Design

### 9.1 Public API

- `KeycloakAuthHandler`/`KeycloakNamespaceAuthHandler`/`KeycloakAuthData`.
- `KeycloakModule`/`AuthModule` (plain classes, not Nest `@Module()`-decorated; `create()` returns a `KeycloakNamespaceAuthHandler`).
- `namespace()` decorator + `AUTH_NAMESPACE_KEY`.
- Utils `extractKeycloakRoles`/`extractKeycloakNamespaces`/`getRealmFromIssuer`/`getClientRoles`.
- The former `./nest/graph` NestJS graph module (`GraphExecutionController`, `GraphNodeCatalogueController`, run/workflow/result controllers and models, `GraphExecutorRegistryFactory`) was deleted with the graph legacy cutover (SAA-503/SAA-509). The graph backend lives in `@decaf-ts/as-graph` (standalone entry `bin.as-graph-server`; module options and the ownership model are specified in [08 — Graph Design](./08-graph-design.md)).

### 9.2 Functional requirements

- **FR-NA1:** `KeycloakAuthHandler` extends Decaf `AuthHandler`, injects `JwtService` via `@service("jwt")`, has a no-arg constructor.
- **FR-NA2:** On each request, `requestFromContext` adapts ctx→request; `/public` routes short-circuit via `isPublicRequest`.
- **FR-NA3:** `getToken` reads `x-auth-request-access-token`/`authorization` (strips `Bearer `); the payload is decoded via `jwt().decodePayload`.
- **FR-NA4:** `extractKeycloakRoles` derives roles; `organization = aud || azp || realm-from-issuer`; `user = email ?? preferred_username`; these are accumulated onto the Decaf `Context` along with `namespaces`.
- **FR-NA5:** `validateAuth(data, _request)` calls `this.jwt().decodeAuthToken(...)`.
- **FR-NA6:** Importing `./nest` registers logging side-effects adding `user`/`organization` log params.

### 9.3 Request → context sequence

```mermaid
sequenceDiagram
    participant Req as Nest Request
    participant H as KeycloakAuthHandler
    participant Jwt as JwtService (@service("jwt"))
    participant Ctx as Decaf Context
    Req->>H: requestFromContext(ctx) -> request
    H->>H: isPublicRequest? (/public short-circuit)
    H->>H: getToken (x-auth-request-access-token / authorization, strip Bearer)
    H->>Jwt: decodePayload(token)
    Jwt-->>H: claims
    H->>H: extractKeycloakRoles(claims)
    H->>H: organization = aud || azp || realm-from-issuer
    H->>H: user = email ?? preferred_username
    H->>Ctx: accumulate user/organization/roles/namespaces
```

### 9.4 Acceptance criteria

- **Given** a request with a valid Keycloak bearer token, **when** the handler runs, **then** the Decaf `Context` carries `user`, `organization`, `roles`, and `namespaces` derived from the token.
- **Given** a request to a `/public` route, **when** the handler runs, **then** it short-circuits without requiring a token.
- **Given** a request with no token on a non-public route requiring auth, **then** the handler rejects.
- **Given** a `namespace()`-decorated handler, **when** the request's namespaces do not include the required namespace, **then** the handler rejects.

> A doc-claimed `AuthService` does not exist (handbook §nest-50). `KeycloakModule`/`AuthModule` are plain wrappers, not Nest modules (handbook §nest-56). `getClientRoles` is redundantly re-exported (handbook §nest-58).

### 9.5 Serving error mapping (SAA-123) — surface removed

The integrations graph controllers this section described
(`GraphRunController`/`GraphWorkflowController`/`GraphExecutionController`
and their catch-all mappers `graphRunHttpErrorOf`/`graphWorkflowHttpErrorOf`/
`graphExecutionHttpErrorOf`, including the `servingErrors.ts` logging of
unmapped errors as a constant generic `500`) were **deleted with the graph
legacy cutover** (SAA-503/SAA-509) — there is no graph serving surface left
in `@decaf-ts/integrations`. The canonical graph serving-error treatment —
mapped Decaf errors keep their HTTP treatment (`422` structured boundary
rejection, `403` ownership, `404`, `400`, `HttpException` pass-through), any
unmapped error served as a constant generic `500` with server-side-only
correlation-id logging, correlation ids serialized directly into the log
message (SAA-134) and the log body guarded by a `try`/`catch` (SAA-135) — is
owned by `@decaf-ts/as-graph` and specified in
[08 — Graph Design](./08-graph-design.md) §"Serving error mapping
(SAA-116)".

---

## 10. Graph Engine Design — removed from integrations (SAA-503 cutover)

The integrations graph engine is **no longer part of this package**. In the graph legacy cutover (SAA-503/SAA-509) the whole surface was deleted outright — `src/graph/**` (engine, shared, log), `src/nest/graph/**` (NestJS execution module, controllers, workflow/run/result services and models, `GraphExecutorRegistryFactory`, standalone `main.ts`), the `./graph`, `./graph/shared`, and `./nest/graph` export subpaths, `GraphNodeObjectLoader`, and the legacy graph test suites — with no deprecation cycle, no shim, and zero `@deprecated` markers.

The graph backend/metadata layer now lives solely in **`@decaf-ts/as-graph`**:

- **Standalone server entry:** `bin.as-graph-server` → `lib/cjs/nest/graph/main.cjs` boots `GraphExecutionModule.forRoot(...)` (standalone RamAdapter via `initAdapter: true`, per-surface `auth: "optional"` + `allowAnonymousAccess` tolerances), binds `127.0.0.1` only with localhost-only CORS, and honors `GRAPH_BACKEND_PORT`/`argv[2]` (default `3000`). for-angular's `start:backend` script launches this entry.
- **Contract home:** `@decaf-ts/as-graph/shared` is the canonical frontend-safe contract surface (document model, manifests/catalogue schemas, run wire contracts, `GraphExecutionStateMapper`, visual-state styles).

Survivors in `integrations` (not legacy): feature flags (including `EngineCapabilityFeatureFlagService`, which reads a served as-graph engine-capability manifest), the namespaces scaffold plus the `nest` Keycloak/namespace auth handlers, and the loader core.

The full graph design — canonical documents & manifests, backend catalogue, nine-stage validation, planner & engine, run lifecycle, ownership model, NestJS API, and serving-error mapping — is specified in [08 — Graph Design](./08-graph-design.md). The former integrations-specific functional requirements (FR-G1…FR-G9), execution sequence, acceptance criteria, and usage example were removed with the subsystem they specified.

---

## 11. BI Dashboard Embed Plugins Design

### 11.1 Public API

- `./plugins`: `DashboardEmbedPlugin` contract (`descriptor`, `manifest(targetVersion?)`, `buildEmbedUrl(options)`, `createSwitchDashboardMessage(payload)`, `sendSwitchDashboardMessage(...)`, `install(options)`) + message helpers/guards.
- `./plugins/kibana`: `KibanaDashboardEmbedPlugin`, `buildKibanaEmbedUrl`, `sendKibanaSwitchDashboardMessage`, manifest builder, plugin files.
- `./plugins/superset`: `SupersetDashboardEmbedPlugin`, `buildSupersetEmbedUrl`, `sendSupersetSwitchDashboardMessage`, manifest, patch files, `SupersetInstallOptions`.

### 11.2 Functional requirements

- **FR-P1:** Both plugins are org-agnostic (no space switching); space comes from the backend proxy/session.
- **FR-P2:** Kibana uses a generated-source + installer strategy; `buildKibanaEmbedUrl` → `//<host>/<basePath>/app/org_dashboard_embed?dashboardId=...&parentOrigin=...`; switching via `postMessage`.
- **FR-P3:** Superset uses a patch-and-build strategy; `buildSupersetEmbedUrl` → `//<host>/<basePath>/embedded/<dashboardId>?parentOrigin=...`; switching via the SDK handle's `switchDashboard(dashboardId, guestToken)`.
- **FR-P4:** Runtime errors are Decaf types (`InternalError`, `UnsupportedError`).
- **FR-P5:** `integrations` stays DOM-free; iframe/React plugin code lives under gitignored `integrations/plugins/*`.

### 11.3 Acceptance criteria

- **Given** a Kibana host + dashboard id, **when** `buildKibanaEmbedUrl` is called, **then** the URL follows the `org_dashboard_embed` shape with `dashboardId` and `parentOrigin`.
- **Given** a Superset host + dashboard id, **when** `buildSupersetEmbedUrl` is called, **then** the URL follows the `/embedded/<id>` shape with `parentOrigin`.
- **Given** `install(options)` for either plugin, **then** plugin files are materialized without DOM access from `integrations`.

> Superset is pinned to `6.1.x` via a hard-named patch script; Kibana target is `8.14.3`. `boot:plugins:*` only materializes files; the real build happens inside `docker compose build` (handbook §plugins-78). The Superset manifest still carries stale "stub" wording (handbook §plugins-76).

---

## 12. Docker Compose Orchestration Design

### 12.1 Public API

`./docker`: `DockerComposeService` with `up`/`down`/`restart`/`waitForHealth`/`execInContainer`/`getLogs`/`isRunning`.

### 12.2 Functional requirements

- **FR-D1:** `initialize({composeFile})` validates the compose file exists.
- **FR-D2:** `up(-d)` runs `docker compose -f <file> up -d` in the file's directory.
- **FR-D3:** `waitForHealth(url, {requireOk, maxAttempts, interval})` polls `fetch(url)` until HTTP 2xx (or any response when `requireOk:false`), up to `maxAttempts×interval`.
- **FR-D4:** `down` runs `docker compose -f <file> down --volumes`.

### 12.3 Lifecycle sequence

```mermaid
sequenceDiagram
    participant App
    participant Dcs as DockerComposeService
    participant DC as docker compose
    App->>Dcs: initialize({composeFile}) (validates file exists)
    App->>Dcs: up(-d)
    Dcs->>DC: docker compose -f <file> up -d (in file's dir)
    App->>Dcs: waitForHealth(url, {requireOk, maxAttempts, interval})
    loop poll until 2xx (or any response if requireOk:false)
        Dcs->>App: fetch(url)
    end
    App->>Dcs: down --volumes
```

### 12.4 Acceptance criteria

- **Given** an existing compose file, **when** `initialize` is called, **then** it succeeds.
- **Given** a missing compose file, **when** `initialize` is called, **then** it rejects.
- **Given** `requireOk:false`, **when** `waitForHealth` receives any HTTP response, **then** it considers the service healthy (emulator use case).

> `DockerComposeServiceConfig`/`DockerHealthCheckOptions` are not exported (handbook §docker-65); `waitForHealth` options are undocumented (handbook §docker-66); no tests exist (handbook §docker-67).

---

## 13. Environment Variables

The integrations code reads `process.env` directly in only two places:

| Variable | Reader | Purpose |
|:---------|:-------|:--------|
| `NODE_ENV` | Keycloak/Kibana `isProduction()` default | Decides `https.Agent.rejectUnauthorized` when no explicit `isProduction` is supplied; production unless `NODE_ENV` is in `["development","local"]`. |

The integrations graph `main.ts` that used to read `GRAPH_BACKEND_PORT` (or `argv[2]`) was removed with the graph cutover; that variable is now honored by the standalone `@decaf-ts/as-graph` server entry (`lib/cjs/nest/graph/main.cjs`, default port `3000`).

Feature flags read environment through `FeatureFlagEnvironment.featureFlag` (env root `featureFlag`), **not** through direct `process.env` reads. The constant `FEATURE_FLAG_ENV_PREFIX = "FEATURE_FLAG"` is declared but never wired — no `process.env.FEATURE_FLAG_*` reading exists (handbook §feature-flags-41).

**Blob and secret code read no `process.env` directly.** Secret configuration flows through decaf `Environment` slices accumulated onto `SecretEnvironment`: `FsSecretEnvironment.secrets.fs` (`rootPath`, `keySecret`, `keyId`) and `ModelSecretEnvironment.secrets.model` (`keySecret`, `keyId`). An empty `keySecret` disables the Environment-derived path, so the service requires an explicit boot config — a missing slice never silently degrades to an unencrypted store. Cloud secret/blob providers still receive credentials via config objects or the cloud SDKs' default credential chains (e.g. AWS `credentials`, Azure `DefaultAzureCredential`, GCP ADC).

---

## 14. Secrets Handling

This section describes secret state, storage, and access — no literal secret values appear anywhere in this document.

- **State:** secrets are modeled as a `SecretSerialization` envelope `{encoding, value}`. On store, the full envelope is JSON-stringified into a `SecretString` and handed to the provider.
- **Storage (model provider):** the full serialized envelope is encrypted via `CryptoService` with a per-secret salt; the `Secret` row persists `{encryptedPayload, encryption:{keyId, iv, salt}}` plus the `tenantId`/`orgUnitId`/`ownerPrincipalId` namespacing columns. Plaintext is never written to the database.
- **Storage (filesystem provider):** the encrypted envelope is stored as a `decaf.fs-secret.v1` JSON file (`<name>.json`) under the configured root (default `.decaf/secrets`, mode `0o700`; files mode `0o600`). The store is a bootstrap sink for infrastructure credentials: `list`/`metadata` are unsupported by design, and values are retrieved immediately before use.
- **Storage (cloud providers):** the `SecretString` is stored in the cloud secret manager (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, Vault, 1Password) under the provider's own naming and access controls.
- **Access:** provider authentication is supplied via the provider config object (`credentials`, `endpoint`, tokens, etc.) at `initialize(config)` time, or — for the model and filesystem providers — via the `secrets.model`/`secrets.fs` Environment slices; access is governed by the provider's IAM/ACL model (and, for model-backed rows, by the namespace RLS policies). `integrations` never logs secret values; contextual logging uses `logCtx(...)` over operation metadata only.
- **Bootstrap:** `InfraCredentialBootstrap.ensure(seeds)` seeds infrastructure credentials idempotently at initialization time; consumers retrieve a credential immediately before use and never cache or expose it.
- **Reference:** `SecretReference {provider, name}` is the handle returned by `store` and accepted by `retrieve`/`delete`/`exists`/`metadata`.
- **Rotation:** `rotate` is an optional abstract method on `SecretService`; the filesystem provider implements it (re-stores under the same name with the new version), while the cloud providers and the model provider still do not (handbook §secrets-17).

---

## 15. Node-Usage Service Pattern (non-Environment boot)

Infrastructure services in `integrations` are registered as `@service(...)` singletons configured from Environment slices. Node-style consumers (graph nodes, agent tools, CLIs) need the same service implementations with **explicit configuration and no Environment fallback**. `src/shared/node-service.ts` provides the internal plumbing:

- `serviceImplementation(serviceKey, decorated)` resolves the undecorated original constructor from `Injectables.services()` — necessary because `@service(...)` replaces the exported constructor with an injectable factory, and extending the decorated export would extend the registered parent singleton.
- `nonEnvironmentService(Base, provider?)` returns a subclass that (a) overrides `configFromEnvironment()` to return `undefined`, (b) validates its arguments through `explicitNodeConfig` — rejecting a no-argument or `Context`-only boot with a `ValidationError`, because no Environment fallback exists — and (c) when a fixed `provider` is supplied, overrides any `provider` in the explicit config before delegating (used by the blob and secret node services, whose provider is fixed by the subclass).
- The generated `XxxNodeService` classes are **not** `@service()`-decorated: not registered in `Injectables`, not singletons, never auto-booted by static `Service.boot()`. Usage is always `await new XxxNodeService().boot(config)`; the original stays registered and Environment-configurable for infrastructure boot.

**21 node service variants** ship across the package families:

| Family | Node services |
|:-------|:--------------|
| comms | `SlackNodeService`, `TeamsNodeService`, `TelegramNodeService`, `GmailNodeService`, `EmailNodeService` |
| devops | `GithubNodeService`, `GitlabNodeService` |
| io | `AirtableNodeService`, `GoogleSheetsNodeService`, `GraphqlNodeService` |
| blob | `S3NodeService`, `GcsNodeService`, `AzureNodeService` |
| secrets | `FsSecretNodeService`, `ModelSecretNodeService`, `AwsSecretNodeService`, `AzureKeyVaultSecretNodeService`, `GcpSecretManagerNodeService`, `VaultSecretNodeService`, `OnePasswordSecretNodeService` |
| shared | `HttpNodeService` |

```mermaid
sequenceDiagram
    autonumber
    participant Caller
    participant Node as XxxNodeService
    participant Base as undecorated service implementation
    Caller->>Node: new XxxNodeService().boot(config)
    activate Node
    Node->>Node: explicitNodeConfig(args)
    alt no explicit config (missing or Context-only)
        Node--xCaller: ValidationError
    else explicit config found
        Node->>Node: fixed provider override (when applicable)
        Node->>Base: super.initialize(preparedConfig, ...rest)
        activate Base
        Base-->>Node: { config, client }
        deactivate Base
        Node-->>Caller: booted service (full original API)
    end
    deactivate Node
```

### 15.1 SMTP client (nodemailer) and EmailNodeService

`SmtpClient` delegates the SMTP wire protocol to the optional `nodemailer` peer (the same library n8n uses) instead of hand-rolling it over `node:net`/`node:tls`. The public surface is unchanged (`connect`/`send`/`close` over a pre-built raw MIME message):

- `secure: true` opens an implicit-TLS socket from the first byte (default port `465`); `secure: false` (default) connects in plaintext and upgrades via STARTTLS (default port `587`).
- **Fail-closed plaintext AUTH:** with credentials configured and no encrypted session, the transport sets `requireTLS` and verification fails unless the session is encrypted; `allowPlaintextAuth` is the explicit, documented opt-out for servers that cannot offer TLS.
- `nodemailer` is resolved with a dynamic import at `connect()` time — the file never statically imports the optional peer; a missing install fails with an `InternalError` telling the consumer to install it.
- Envelope addresses are validated through `assertEmailAddress` (decaf `BadRequestError`s) before they reach any SMTP command; `disableFileAccess`/`disableUrlAccess` are forced on the transport.

`EmailNodeService` is the non-Environment counterpart of `@service("email")` `EmailService` for `boot(config)`-based use; both are exported from the `@decaf-ts/integrations/comms/email` subpath (together with `SmtpClient`/`SmtpConfig`, also available via the `./smtp` subpath). `nodemailer` is an optional peer dependency (`>=7.0.0`) plus a dev dependency — only consumers of the SMTP surface install it.

### 15.2 Optional peers and IT infrastructure

`pg` (`>=8.0.0`) is likewise an additive optional peer + dev dependency: only the RLS/Credential/ModelSecret integration tests and RLS-consuming applications install it. The IT infrastructure is booted by one script:

```sh
npm run prepare-it-tests
```

which starts three compose stacks (`--wait` health-gated): the existing DragonflyDB stack, the new `docker/postgres-compose.yml` (`postgres:16`, host port `55435`, db `decaf_integration`, user `decaf`), and the new `docker/mailpit-compose.yml` (Mailpit SMTP sink on `1025`, HTTP API/UI on `8025`, accepting any AUTH incl. plaintext so the credential path is exercisable locally). The RLS matrix IT overrides the connection string via `DECAF_PG_URL` (default `postgresql://decaf:decaf-integration@localhost:55435/decaf_integration`).

---

## 16. Thin / Under-documented Areas

The brief is explicit about coverage limits. The following are under-documented relative to a full design and should not be treated as fully specified:

- **Azure / 1Password / model secret integration tests** do not exist; their runtime behavior beyond the unit-level `SecretServiceContract` is documented from source reading only (handbook §secrets testing gaps).
- **`KibanaAuthService`, dashboard clone/embed/`verifySpaceSetup`, `setDefaultDataView`, and `setupOrganization` end-to-end** have no tests; their behavior is described from source, not verified (handbook §kibana testing gaps).
- **Namespaces `BootstrapService`, `EffectivePermissionService.rebuildForPrincipal` (incl. inheritance-block + group expansion), `OrgUnitService` closure ops, `RoleAssignmentService`, `SystemManagementService`, `ResourceLifecycleService`** have no unit tests (handbook §namespaces testing gaps).
- **Loader URL/`data:` sources, single-named-export fallback, `withOptions`, `createLoaderHookContext`** are untested (handbook §loader testing gaps).
- **Superset `build:true` in-process path and `boot-plugin.mjs`** are unverified by automated tests (handbook §plugins testing gaps).

Where a requirement above depends on an untested path, the acceptance criteria are stated against the documented source behavior and flagged as a known gap rather than a verified guarantee.

---

## 17. Inaccuracies

The complete inaccuracies list (79 entries) is reproduced in the [Architecture Handbook — Integrations, §17 Inaccuracies Found](../architecture-handbook/07-integrations.md#17-inaccuracies-found). Representative entries per subsystem:

- **[blob]** core entry eagerly loads all provider SDKs despite documented intent — `src/blob/index.ts:4-5` claims the core entry "does not eagerly load optional provider SDKs", but `src/blob/core/BlobStoreFactory.ts:9-16` statically imports every provider implementation. | Evidence: src/blob/index.ts:4-5, src/blob/core/BlobStoreFactory.ts:9-16 | Suggested fix: make `BlobStoreFactory` lazy-load providers per case, or move the factory out of the core barrel.
- **[secrets]** `SecretService` abstract is never implemented by any provider — every provider extends `ClientBasedService`, not `SecretService`. | Evidence: AwsSecretService.ts:48, AzureKeyVaultSecretService.ts:30, GcpSecretManagerService.ts:26, VaultSecretService.ts:113, OnePasswordSecretService.ts:22, ModelSecretService.ts:36 | Suggested fix: have providers extend `SecretService` or drop the unused abstract.
- **[keycloak]** `KeycloakSetupConfig` does not declare `isProduction`, yet tests/users supply it. | Evidence: src/keycloak/types.ts:162-183, tests/integration/keycloak.test.ts:36 | Suggested fix: add optional `isProduction?: () => boolean`.
- **[kibana]** workdoc advertises a `deleteDataView` method that doesn't exist. | Evidence: workdocs/services/kibana.md:73, KibanaService.ts:178-228 | Suggested fix: remove it or implement it.
- **[feature-flags]** public API typo — the concrete reader class is named `EnvironmeFlagReader` (missing `nt`). | Evidence: src/feature-flags/readers/FeatureFlagReader.ts:29 | Suggested fix: rename to `EnvironmentFlagReader`.
- **[namespaces]** `AuthzService.canAccess` scope branch doesn't enforce tenant scoping. | Evidence: authz.service.ts:31-43, authz.service.ts:52 | Suggested fix: add the tenant predicate.
- **[nest]** workdocs claim `AuthService` exists in `src/nest` — it does not. | Evidence: workdocs/services/nest.md:7 | Suggested fix: document `JwtService` injection.
- **[loader]** `ObjectLoaderExportSelection` exported twice from the same barrel. | Evidence: src/loader/index.ts:8, src/loader/ObjectLoader.ts:193 | Suggested fix: drop line 193.
- **[graph]** removed with the graph legacy cutover (SAA-503/SAA-509) — all graph entries of the register (e.g. `GraphTopology.isBoundary` hard-coding `"$workflow"`) referenced `src/graph/**`/`src/nest/graph/**` files that no longer exist and were dropped from the [handbook register](../architecture-handbook/07-integrations.md#17-inaccuracies-found) along with the subsystem. Graph-engine inaccuracies are now owned by the `@decaf-ts/as-graph` documentation ([08 — Graph Design](./08-graph-design.md)).
- **[plugins]** Superset manifest doc/comment is stale — says "stub" but the plugin is fully implemented. | Evidence: src/plugins/superset/manifest.ts:3-7, src/plugins/superset/installer.ts:127-271 | Suggested fix: drop the stub wording and `status:"stub"` field.
- **[docker]** `DockerComposeServiceConfig` and `DockerHealthCheckOptions` are declared without `export`. | Evidence: src/docker/DockerComposeService.ts:13, src/docker/DockerComposeService.ts:18 | Suggested fix: add `export` to both interfaces.
- **[package]** `package.json` has no `description` field, so the npm registry description will be empty. | Evidence: package.json (no description) | Suggested fix: add a `description`.
