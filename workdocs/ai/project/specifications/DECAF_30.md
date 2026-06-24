# DECAF-30 — BlobStoreService API and Provider Implementations for @decaf-ts/integrations

**Status:** Planned
**Priority:** High
**Owner:** decaf-dev

## 1. Overview

Add a stable, provider-agnostic binary large object (blob) storage API to `@decaf-ts/integrations`.

The API must expose a consistent CRUD-like key/value surface — `put`, `get`, `has`, `stat`, `delete`, `copy`, `list`, and `url` (presigned/SAS) — while remaining independent from any single provider SDK. Self-hosted storage must be supported through a local filesystem implementation and an in-memory implementation for tests, and cloud/provider integrations must be isolated behind their own subpaths so consumers only install what they use.

This specification mirrors the proven pattern established by DECAF-26 (SecretService): the same `ClientBasedService` lifecycle, the same subpath export discipline, the same optional dependency policy, the same error translation contract, and the same `logCtx()` logging discipline. It deliberately reuses that shape so blob stores and secret stores are interchangeable, predictable, and cheap to learn.

### Lifecycle contract (non-negotiable)

Every blob store service follows the **actual** Decaf `ClientBasedService` lifecycle from `@decaf-ts/core` — the same one DECAF-26 uses:

- **No constructor arguments.** Services must not accept configuration or dependencies in their constructors.
- **`initialize(...args)` is the only setup surface.** Configuration arrives as the first initialize argument (`args[0]`). Each service creates its own native client **inside** `initialize()`.
- **`initialize` returns `{ config, client }`** (an object — not a tuple) and assigns `this._config` and `this._client` directly. The `config` and `client` getters are `@final()` on the base class and must not be redeclared.
- **`parseError(error: unknown): Error`** converts provider SDK failures into Decaf errors on every client-based service.
- **`...args: MaybeContextualArg<any>`** trails every operation, and logging goes through `logCtx()`.

## 2. Goals

* [ ] Add a stable `BlobStoreService` API with `put`, `get`, `has`, `stat`, `delete`, `copy`, `list`, and `url` operations.
* [ ] Provide a default local filesystem implementation and an in-memory implementation for tests/examples.
* [ ] Add provider-specific implementations for S3, MinIO, Cloudflare R2, Azure Blob Storage, Google Cloud Storage, and IPFS.
* [ ] Keep provider SDKs optional so the root `@decaf-ts/integrations` package remains installable without cloud dependencies.
* [ ] Isolate provider implementations behind subpath exports and keep the top-level root free of provider loads.
* [ ] Define provider-independent error, key normalization, metadata, and presigned-URL contracts.
* [ ] Ship Docker Compose files for every dockerizable provider so integration tests run locally without cloud accounts.
* [ ] Add contract tests, bundling tests, and documentation that describe the storage model honestly.

## 3. User Stories / Requirements

* **US-1:** As a developer, I want to store and retrieve binary blobs through a single API so that I can swap providers without rewriting application logic.
* **US-2:** As a developer, I want a local filesystem implementation so that I can self-host blob storage without introducing a cloud dependency.
* **US-3:** As a platform integrator, I want S3, MinIO, R2, Azure Blob, GCS, and IPFS backends to share the same semantics so that migration between providers is predictable.
* **US-4:** As a package consumer, I want provider SDKs to stay optional so that installing `@decaf-ts/integrations` does not pull every cloud client into my build.
* **US-5:** As a QA engineer, I want a Docker Compose stack per provider so I can run integration tests against real emulators locally.
* **Req-1:** `BlobStoreService` must extend the existing Decaf `ClientBasedService` abstraction from `@decaf-ts/core`.
* **Req-2:** Services must not accept configuration in their constructors; configuration is the first `initialize(...args)` argument.
* **Req-3:** `initialize(...args)` must return `{ config, client }` and assign `this._config` / `this._client` directly; the inherited `config` and `client` getters are final.
* **Req-4:** The core blob contracts must not leak provider SDK types.
* **Req-5:** Root exports must only expose core abstractions; provider implementations must be exported only through subpaths.
* **Req-6:** Key validation, physical-key prefixing, metadata normalization, and error translation must be consistent across implementations.
* **Req-7:** All errors must extend `InternalError` or `BaseError` from `@decaf-ts/db-decorators`.

## 4. Architecture & Design

### 4.1 Package layout

Add the following structure under `@decaf-ts/integrations`:

```text
src/
  blob/
    index.ts

    core/
      index.ts
      BlobStoreService.ts
      BlobTypes.ts
      BlobErrors.ts
      BlobKey.ts

    s3/
      index.ts
      S3BlobStoreService.ts
      S3BlobStoreServiceConfig.ts
      MinioBlobStoreService.ts
      R2BlobStoreService.ts

    azure/
      index.ts
      AzureBlobStoreService.ts
      AzureBlobStoreServiceConfig.ts

    gcp/
      index.ts
      GcsBlobStoreService.ts
      GcsBlobStoreServiceConfig.ts

    local/
      index.ts
      LocalBlobStoreService.ts
      LocalBlobStoreServiceConfig.ts

    ipfs/
      index.ts
      IpfsBlobStoreService.ts
      IpfsBlobStoreServiceConfig.ts
      IpfsKeyIndex.ts
      MemoryIpfsKeyIndex.ts

    memory/
      index.ts
      MemoryBlobStoreService.ts
```

`src/blob/index.ts` exports only the core contracts:

```ts
export * from "./core";
```

Provider implementations are exported only through their own subpaths:

- `@decaf-ts/integrations/blob/s3`
- `@decaf-ts/integrations/blob/azure`
- `@decaf-ts/integrations/blob/gcp`
- `@decaf-ts/integrations/blob/local`
- `@decaf-ts/integrations/blob/ipfs`
- `@decaf-ts/integrations/blob/memory`

The top-level `@decaf-ts/integrations` must not eagerly import provider implementations.

### 4.2 Service lifecycle

All blob services extend `ClientBasedService<CLIENT, CONFIG>` and follow the same lifecycle as DECAF-26:

```typescript
export class S3BlobStoreService extends ClientBasedService<
  S3Client,
  S3BlobStoreServiceConfig
> {
  get provider(): BlobProvider {
    return this.config.provider;
  }

  get sourceId(): string {
    return this.config.sourceId;
  }

  async initialize(
    ...args: ContextualArgs<any>
  ): Promise<{ config: S3BlobStoreServiceConfig; client: S3Client }> {
    const { log, ctxArgs } = (
      await this.logCtx(args, PersistenceKeys.INITIALIZATION, true)
    ).for(this.initialize);
    const config = ctxArgs[0] as S3BlobStoreServiceConfig;
    if (!config) {
      throw new InternalError("Missing configuration for S3BlobStoreService");
    }
    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: resolveCredentials(config.credentialsRef),
    });
    this._config = config;
    this._client = client;
    log.verbose(`Initialized S3 blob store ${config.sourceId}`);
    return { config, client };
  }

  async put(
    key: BlobKey,
    value: BlobValue,
    options: BlobPutOptions = {},
    ...args: MaybeContextualArg<any>
  ): Promise<BlobPutResult> {
    const { log } = (await this.logCtx(args, "put", true)).for(this.put);
    log.verbose(`Putting blob ${key}`);
    // ... implementation using this.client and this.config
  }

  protected parseError(error: unknown): Error {
    // Convert provider errors to BlobError
  }
}
```

- `provider` and `sourceId` are getters reading from `this.config` (the final inherited getter).
- `config` and `client` getters are inherited from `ClientBasedService` and must not be redeclared.
- Each operation accepts `...args: MaybeContextualArg<any>` and obtains its logger via `logCtx()`.

### 4.3 Core API shape

```ts
export abstract class BlobStoreService<
  TClient = unknown,
  TConfig extends BlobStoreServiceConfig = BlobStoreServiceConfig
> extends ClientBasedService<TClient, TConfig> {
  abstract get provider(): BlobProvider;
  abstract get sourceId(): string;

  abstract put(
    key: BlobKey,
    value: BlobValue,
    options?: BlobPutOptions,
    ...args: MaybeContextualArg<any>
  ): Promise<BlobPutResult>;

  abstract get(
    key: BlobKey,
    options?: BlobGetOptions,
    ...args: MaybeContextualArg<any>
  ): Promise<BlobGetResult>;

  abstract has(key: BlobKey, ...args: MaybeContextualArg<any>): Promise<boolean>;

  abstract stat(
    key: BlobKey,
    ...args: MaybeContextualArg<any>
  ): Promise<BlobMetadata>;

  abstract delete(
    key: BlobKey,
    ...args: MaybeContextualArg<any>
  ): Promise<void>;

  abstract copy(
    fromKey: BlobKey,
    toKey: BlobKey,
    options?: BlobPutOptions,
    ...args: MaybeContextualArg<any>
  ): Promise<BlobPutResult>;

  abstract list(
    options?: BlobListOptions,
    ...args: MaybeContextualArg<any>
  ): Promise<BlobListResult>;

  abstract url(
    key: BlobKey,
    options?: BlobUrlOptions,
    ...args: MaybeContextualArg<any>
  ): Promise<BlobUrlResult>;
}
```

### 4.4 Core types

```ts
export type BlobProvider =
  | "s3"
  | "minio"
  | "r2"
  | "azure-blob"
  | "gcs"
  | "local"
  | "ipfs"
  | "memory";

export type BlobKey = string;

export type BlobValue =
  | Uint8Array
  | Buffer
  | AsyncIterable<Uint8Array>
  | ReadableStream;

export interface BlobMetadata {
  contentType?: string;
  contentLength?: number;
  sha256?: string;
  etag?: string;
  versionId?: string;
  cid?: string;
  custom?: Record<string, string>;
}

export interface BlobPutOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  ifNotExists?: boolean;
  expectedSha256?: string;
}

export interface BlobGetOptions {
  range?: { start: number; end?: number };
  versionId?: string;
}

export interface BlobListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface BlobEntry {
  key: BlobKey;
  metadata?: BlobMetadata;
}

export interface BlobListResult {
  items: BlobEntry[];
  cursor?: string;
}

export interface BlobPutResult {
  key: BlobKey;
  uri: string;
  provider: BlobProvider;
  sourceId: string;
  metadata: BlobMetadata;
}

export interface BlobGetResult {
  key: BlobKey;
  value: AsyncIterable<Uint8Array>;
  uri: string;
  provider: BlobProvider;
  sourceId: string;
  metadata: BlobMetadata;
}

export interface BlobUrlOptions {
  operation?: "get" | "put";
  expiresInSeconds?: number;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface BlobUrlResult {
  url: string;
  method: "GET" | "PUT";
  expiresAt: Date;
  headers?: Record<string, string>;
}
```

### 4.5 Configuration types

```ts
export interface BlobStoreServiceConfig {
  provider: BlobProvider;
  sourceId: string;
  prefix?: string;
  credentialsRef?: string;
  endpoint?: string;
  region?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface S3BlobStoreServiceConfig extends BlobStoreServiceConfig {
  provider: "s3" | "minio" | "r2";
  bucket: string;
  forcePathStyle?: boolean;
}

export interface AzureBlobStoreServiceConfig extends BlobStoreServiceConfig {
  provider: "azure-blob";
  container: string;
  accountName?: string;
}

export interface GcsBlobStoreServiceConfig extends BlobStoreServiceConfig {
  provider: "gcs";
  bucket: string;
  projectId?: string;
}

export interface LocalBlobStoreServiceConfig extends BlobStoreServiceConfig {
  provider: "local";
  rootPath: string;
}

export interface IpfsBlobStoreServiceConfig extends BlobStoreServiceConfig {
  provider: "ipfs";
  apiUrl?: string;
  gatewayUrl?: string;
  pinByDefault?: boolean;
  encryptedOnly?: boolean;
  keyIndex: IpfsKeyIndexConfig;
}

export interface IpfsKeyIndexConfig {
  provider: "memory" | "postgres" | "local-json";
  connectionRef?: string;
  path?: string;
}
```

### 4.6 Key normalization

- Key validation is centralized in `core/BlobKey.ts`.
- `physicalKey(key)` applies the configured `prefix` (trimmed of leading/trailing slashes) to the cleaned key.
- `cleanKey(key)` strips leading slashes and rejects empty, `.`, `..`, and any path containing `../` segments.
- Provider adapters may transform the physical key further (e.g. IPFS uses it only as an index key, not as a path).

### 4.7 Error model

All errors MUST extend `InternalError` or `BaseError` from `@decaf-ts/db-decorators`. `BlobError` extends `InternalError` and carries a `blobCode`.

```ts
export type BlobErrorCode =
  | "BLOB_NOT_FOUND"
  | "BLOB_ALREADY_EXISTS"
  | "BLOB_INVALID_KEY"
  | "BLOB_INVALID_VALUE"
  | "BLOB_PROVIDER_UNAVAILABLE"
  | "BLOB_PROVIDER_AUTH_FAILED"
  | "BLOB_PROVIDER_PERMISSION_DENIED"
  | "BLOB_PROVIDER_RATE_LIMITED"
  | "BLOB_UNSUPPORTED_OPERATION"
  | "BLOB_CHECKSUM_MISMATCH";

export class BlobError extends InternalError {
  readonly blobCode: BlobErrorCode;
  constructor(blobCode: BlobErrorCode, message: string, cause?: Error) {
    super(message);
    this.blobCode = blobCode;
    this.name = "BlobError";
    if (cause) {
      (this as any).cause = cause;
    }
  }
}
```

Each provider implementation MUST implement `protected parseError(error: unknown): Error` that converts client library errors to Decaf errors. Error translation must be consistent across all providers and reuse the patterns established by DECAF-26.

### 4.8 Provider implementations

Each provider implementation lives in its own folder and only loads the dependencies it needs.

- `memory`: in-process `Map`-backed implementation for tests and examples; no SDK.
- `local`: filesystem implementation wrapping `node:fs/promises` and streams with atomic write (temp file → fsync → rename) and path-traversal protection rooted at `rootPath`; no SDK.
- `s3`: AWS SDK v3 `S3Client` for S3, MinIO, and Cloudflare R2 (S3-compatible). `MinioBlobStoreService` and `R2BlobStoreService` extend `S3BlobStoreService`.
- `azure-blob`: `@azure/storage-blob` `BlobServiceClient` integration with `@azure/identity`.
- `gcs`: `@google-cloud/storage` `Storage` integration.
- `ipfs`: Kubo/Helia client integration. Because the public API is key/value CRUD-like and IPFS is content-addressed, an `IpfsKeyIndex` maps `physicalKey → CID`. A `MemoryIpfsKeyIndex` ships for tests; `postgres` and `local-json` index providers are stubbed with honest "implement" errors. `get` returns `ipfs://${cid}` URIs; `url` builds gateway URLs.

### 4.9 Factory

`BlobStoreFactory.create(config)` returns an uninitialized `BlobStoreService` selected by `config.provider`. The caller then calls `await service.initialize(config, ...optionalContext)`. Construction never takes arguments; initialization always happens later — exactly the DECAF-26 boundary.

```ts
export class BlobStoreFactory {
  create(config: BlobStoreServiceConfig): BlobStoreService {
    switch (config.provider) {
      case "s3": return new S3BlobStoreService();
      case "minio": return new MinioBlobStoreService();
      case "r2": return new R2BlobStoreService();
      case "azure-blob": return new AzureBlobStoreService();
      case "gcs": return new GcsBlobStoreService();
      case "local": return new LocalBlobStoreService();
      case "ipfs": return new IpfsBlobStoreService();
      case "memory": return new MemoryBlobStoreService();
      default: return assertNever(config);
    }
  }
}
```

Usage:

```ts
const config: S3BlobStoreServiceConfig = {
  provider: "minio",
  sourceId: "minio-prod",
  endpoint: "http://localhost:9000",
  region: "us-east-1",
  credentialsRef: "minio-prod",
  bucket: "platform-prod",
  prefix: "tenants/acme",
  forcePathStyle: true,
};

const blobs = new MinioBlobStoreService();
await blobs.initialize(config);
await blobs.put("objects/o1/v1/original.pdf", pdfBytes, {
  contentType: "application/pdf",
  ifNotExists: true,
});
```

### 4.10 Dependency policy

- Provider libraries are declared as `optionalDependencies` in `integrations/package.json` (matching the DECAF-26 approach): `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@azure/storage-blob`, `@google-cloud/storage`, and `kubo-rpc-client`. `@azure/identity` is already optional.
- The root package must remain installable without cloud SDKs.
- Root imports must not force provider code or optional SDK resolution.
- Provider subpaths may import their SDKs directly if the subpath is the explicit opt-in surface.
- If runtime behavior requires it, provider loading may fall back to dynamic import with explicit missing-dependency errors.

### 4.11 Docker Compose for integration tests

Mirror the DECAF-26 per-provider Compose files under `integrations/docker/`. Each file stands alone so a single provider's tests can run in isolation:

- `minio-compose.yml` — MinIO (S3-compatible) covering `s3`, `minio`, and `r2` services. API on `9100`, console on `9101` (offset from the legacy Azurite/localstack ports to avoid collisions).
- `azure-blob-compose.yml` — Azurite blob service on `10000`.
- `gcs-blob-compose.yml` — `fsouza/fake-gcs-server` on `4443`.
- `ipfs-compose.yml` — Kubo IPFS node; API on `5001`, gateway on `8080`.
- `local` and `memory` need no container.

Integration tests live under `integrations/tests/integration/blob/` and use the existing `DockerComposeService` (`up` / `waitForHealth` / `down`) exactly like the secret integration tests.

### 4.12 Logging

All client-based services MUST retrieve loggers via `logCtx()` when available. Each operation should log at appropriate levels (verbose for operations, error for failures). Log entries must include correlation context when available.

### 4.13 Testing and documentation boundaries

- Shared contract tests under `tests/unit/blob/` exercise `memory` and `local` through the same behavior suite.
- Integration tests under `tests/integration/blob/` run against the Docker emulators without mocking.
- Bundling tests must prove that importing `@decaf-ts/integrations/blob` does not load provider SDKs.
- Documentation must explicitly describe the storage model, provider-specific limitations, and the IPFS content-addressed/key-index tradeoff.

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:--|:--|:--|:--|:--|
| DECAF-30-1 | Define the blob core contracts, key normalization, factory, and error model | High | Pending | - |
| DECAF-30-2 | Implement the memory and local filesystem services with ClientBasedService pattern, parseError(), Decaf error handling, and logCtx logging | High | Pending | DECAF-30-1 |
| DECAF-30-3 | Add provider subpaths for S3/MinIO/R2, Azure Blob, and GCS with parseError() methods, Decaf error handling, and logCtx logging | High | Pending | DECAF-30-1 |
| DECAF-30-4 | Add the IPFS provider with key-index abstraction and document its content-addressed limitations | High | Pending | DECAF-30-1 |
| DECAF-30-5 | Update package exports, optional dependency metadata, and root import safety | High | Pending | DECAF-30-1 |
| DECAF-30-6 | Add Docker Compose files (MinIO, Azurite, fake-gcs-server, Kubo) and integration tests under tests/integration/blob/ | High | Pending | DECAF-30-3 |
| DECAF-30-7 | Add contract tests, bundling tests, error-parsing unit tests, and docs | High | Pending | DECAF-30-2 |

## 6. Open Questions / Risks

* Should `url()` be required for `local` (e.g. `file://` URIs) or remain unsupported with an honest error, as in the draft?
* Should the IPFS key index ship a `postgres` implementation in v1, or only `memory` and `local-json`?
* Should R2 get a dedicated subpath or always ride on `@decaf-ts/integrations/blob/s3`?
* Risk: provider SDK type leakage could pollute the core API if implementation boundaries are not kept strict.
* Risk: optional dependency handling may break bundling if provider imports are pulled into the root entrypoint.
* Risk: IPFS content-addressed semantics (CID per payload) complicate `ifNotExists`, `copy`, and overwrite behavior versus the simpler key/value providers.

## 7. Results & Artifacts

* New specification entry for `@decaf-ts/integrations` blob storage and retrieval support.
* Planned package layout for `src/blob/*` with core, memory, local, and provider subpaths.
* Optional dependencies added to `integrations/package.json`: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@azure/storage-blob`, `@google-cloud/storage`, `kubo-rpc-client`.
* Docker Compose files added under `integrations/docker/`: `minio-compose.yml`, `azure-blob-compose.yml`, `gcs-blob-compose.yml`, `ipfs-compose.yml`.
* Defined dependency, key normalization, error, and testing boundaries for the blob store work.
