# DECAF-26 — SecretService API and Provider Implementations for @decaf-ts/integrations

**Status:** Planned
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
Add a stable, provider-agnostic secret storage and retrieval API to `@decaf-ts/integrations`.

The API must expose a consistent surface for storing, retrieving, deleting, checking existence, and listing secrets while remaining independent from any single provider SDK. Local storage must be supported through a Decaf model-backed encrypted-at-rest implementation, and cloud/provider integrations must be isolated behind their own subpaths so consumers only install what they use.

The cryptographic boundary is strict:

- all crypto-related implementation code must live in `@decaf-ts/crypto`;
- `@decaf-ts/integrations` may import crypto helpers, types, and decorators from `@decaf-ts/crypto`;
- `@decaf-ts/integrations` must not reimplement encryption primitives, key derivation, or payload crypto helpers locally.
- CryptoService in `@decaf-ts/crypto` provides reusable crypto operations including `deriveKeyFromSecret()`, `encryptPayload()`, `decryptPayload()`, and `extractKeyFromDerivedKey()`.

This specification intentionally describes a secret storage mode, not the existing `@encrypt(...)` model-property decorator. The secret service layer is the higher-level API that coordinates storage semantics, provider abstraction, serialization, metadata, and provider portability.

## 2. Goals
*   [ ] Add a stable `SecretService` API with `store`, `retrieve`, `delete`, `exists`, `list`, and `metadata` operations.
*   [ ] Provide a default local implementation that stores encrypted secrets in Decaf persistence using existing model/repository/adapter facilities.
*   [ ] Add provider-specific implementations for HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, Google Cloud Secret Manager, and 1Password.
*   [ ] Keep provider SDKs optional so the root `@decaf-ts/integrations` package remains installable without cloud dependencies.
*   [ ] Isolate provider implementations behind subpath exports and keep the top-level root free of provider loads.
*   [ ] Define provider-independent error, serialization, naming, and metadata contracts.
*   [ ] Add tests, bundling checks, and documentation that describe the security model honestly.

## 3. User Stories / Requirements
*   **US-1:** As a developer, I want to store and retrieve secrets through a single API so that I can swap providers without rewriting application logic.
*   **US-2:** As a developer, I want a local encrypted-at-rest implementation so that I can self-host secrets without introducing a cloud dependency.
*   **US-3:** As a platform integrator, I want AWS, Azure, GCP, Vault, and 1Password backends to share the same semantics so that migration between providers is predictable.
*   **US-4:** As a package consumer, I want provider SDKs to stay optional so that installing `@decaf-ts/integrations` does not pull every cloud client into my build.
*   **US-5:** As a security reviewer, I want the documentation to be explicit that this is encrypted-at-rest storage, not confidential computing.
*   **Req-1:** `SecretService` must extend the existing Decaf `Service` abstraction.
*   **Req-2:** Provider implementations that own a concrete client must extend `ClientBasedService`.
*   **Req-3:** The core secret contracts must not leak provider SDK types.
*   **Req-4:** Root exports must only expose core abstractions; provider implementations must be exported only through subpaths.
*   **Req-5:** All crypto helpers used by the model-backed implementation must come from `@decaf-ts/crypto`.
*   **Req-6:** The local model-backed implementation must persist encrypted payloads, not plaintext secrets.
*   **Req-7:** Name validation, payload serialization, and error translation must be consistent across implementations.

## 4. Architecture & Design

### 4.1 Package layout
Add the following structure under `@decaf-ts/integrations`:

```text
src/
  secrets/
    index.ts

    core/
      index.ts
      SecretService.ts
      SecretTypes.ts
      SecretErrors.ts
      SecretReference.ts
      SecretSerialization.ts
      SecretName.ts

    model/
      index.ts
      Secret.ts
      ModelSecretService.ts
      ModelSecretServiceConfig.ts
      ModelSecretCrypto.ts

    vault/
      index.ts
      VaultSecretService.ts
      VaultSecretServiceConfig.ts
      VaultKvV2Client.ts

    aws/
      index.ts
      AwsSecretService.ts
      AwsSecretServiceConfig.ts

    azure/
      index.ts
      AzureKeyVaultSecretService.ts
      AzureKeyVaultSecretServiceConfig.ts

    gcp/
      index.ts
      GcpSecretManagerService.ts
      GcpSecretManagerServiceConfig.ts

    onepassword/
      index.ts
      OnePasswordSecretService.ts
      OnePasswordSecretServiceConfig.ts

    memory/
      index.ts
      MemorySecretService.ts
```

### 4.2 Service lifecycle

All secret services must follow the `ClientBasedService` pattern:

- **No constructor arguments:** Services must not accept configuration or dependencies in their constructors.
- **Initialize method:** All services must implement `async initialize(...args: ContextualArgs<any>): Promise<{ config: Config; client: Client }>` to set up their client and configuration.
- **Provider property:** Each service must expose `readonly provider: SecretProvider` identifying the provider type.
- **Parse error method:** Client-based services must implement `protected parseError(unknown): Error` to convert provider errors to Decaf errors.
- **Contextual logging:** All operations must accept `...args: MaybeContextualArg<any>` and use `logCtx()` for logging.

Example:
```typescript
export class MySecretService extends ClientBasedService<Client, Config> {
  readonly provider: SecretProvider = "my-provider";

  async initialize(...args: ContextualArgs<any>): Promise<{ config: Config; client: Client }> {
    const config = args[0] as Config;
    if (!config) throw new InternalError("Missing configuration");
    const client = new Client(config);
    return { config, client };
  }

  protected parseError(error: unknown): Error {
    // Convert provider errors to SecretError
  }

  async store(name: SecretName, value: SecretPayload, options?: StoreSecretOptions, ...args: MaybeContextualArg<any>): Promise<SecretReference> {
    const { log, ctxArgs } = (await this.logCtx(args, "store", true)).for(this.store);
    log.verbose(`Storing secret ${name}`);
    // ... implementation using this.client and this.config
  }
}
```

- `src/secrets/index.ts` must export only the core contracts:

```ts
export * from "./core";
```

- provider implementations must be exported only through their own subpaths:
  - `@decaf-ts/integrations/secrets/model`
  - `@decaf-ts/integrations/secrets/aws`
  - `@decaf-ts/integrations/secrets/azure`
  - `@decaf-ts/integrations/secrets/gcp`
  - `@decaf-ts/integrations/secrets/vault`
  - `@decaf-ts/integrations/secrets/onepassword`
  - `@decaf-ts/integrations/secrets/memory`

- top-level `@decaf-ts/integrations` must not eagerly import provider implementations.

### 4.3 Core API shape

The secret contract should follow a provider-agnostic service abstraction:

```ts
export abstract class SecretService<
  TClient = unknown,
  TConfig extends SecretServiceConfig = SecretServiceConfig
> extends Service {
  readonly provider: SecretProvider;
  readonly config: Readonly<TConfig>;

  abstract store<T extends SecretPayload = SecretPayload>(
    name: SecretName,
    value: T,
    options?: StoreSecretOptions
  ): Promise<SecretReference>;

  abstract retrieve<T extends SecretPayload = SecretPayload>(
    nameOrRef: SecretName | SecretReference,
    options?: RetrieveSecretOptions
  ): Promise<T>;

  abstract delete(
    nameOrRef: SecretName | SecretReference,
    options?: DeleteSecretOptions
  ): Promise<void>;

  abstract exists(
    nameOrRef: SecretName | SecretReference,
    options?: ExistsSecretOptions
  ): Promise<boolean>;

  abstract list(
    options?: ListSecretsOptions
  ): Promise<SecretMetadata[]>;

  abstract metadata(
    nameOrRef: SecretName | SecretReference,
    options?: SecretMetadataOptions
  ): Promise<SecretMetadata | undefined>;

  abstract rotate?(
    nameOrRef: SecretName | SecretReference,
    value: SecretPayload,
    options?: RotateSecretOptions
  ): Promise<SecretReference>;
}
```

Concrete provider services should follow the same shape and, where they wrap an SDK client, extend a `ClientBasedSecretService` helper that owns the client and freezes the config.

### 4.4 Core types

The shared types should remain provider-independent:

```ts
export type SecretProvider =
  | "model"
  | "memory"
  | "hashicorp-vault"
  | "aws-secrets-manager"
  | "azure-key-vault"
  | "gcp-secret-manager"
  | "onepassword";

export type SecretName = string;

export type SecretPayload =
  | string
  | Record<string, unknown>
  | Uint8Array;

export interface SecretReference {
  provider: SecretProvider;
  name: string;
  version?: string;
  path?: string;
  uri?: string;
  tenantId?: string;
  namespace?: string;
  metadata?: Record<string, string>;
}

export interface SecretMetadata {
  provider: SecretProvider;
  name: string;
  version?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  enabled?: boolean;
  contentType?: string;
  tags?: Record<string, string>;
  externalId?: string;
  uri?: string;
}
```

### 4.5 Naming and serialization

- Secret name validation must be centralized.
- Names must be normalized before provider mapping.
- The default policy should trim input, reject empty or control-character names, reject `..`, reject raw whitespace, allow a safe character set, and cap length before provider-specific mapping.
- Provider adapters may transform names into provider-safe identifiers.
- The API must serialize `string`, `Record<string, unknown>`, and `Uint8Array` through a canonical envelope:

```ts
export interface SerializedSecretPayload {
  encoding: "utf8" | "json" | "base64";
  value: string;
}
```

### 4.6 Error model

All errors MUST extend from `InternalError` or `BaseError` from `@decaf-ts/db-decorators`. The `SecretError` class extends `InternalError` and includes HTTP status code mapping based on the error code.

Define provider-independent error codes and translate provider SDK failures into them:

```ts
export type SecretErrorCode =
  | "SECRET_NOT_FOUND"
  | "SECRET_ALREADY_EXISTS"
  | "SECRET_DISABLED"
  | "SECRET_INVALID_NAME"
  | "SECRET_INVALID_PAYLOAD"
  | "SECRET_SERIALIZATION_FAILED"
  | "SECRET_DESERIALIZATION_FAILED"
  | "SECRET_ENCRYPTION_FAILED"
  | "SECRET_DECRYPTION_FAILED"
  | "SECRET_PROVIDER_UNAVAILABLE"
  | "SECRET_PROVIDER_AUTH_FAILED"
  | "SECRET_PROVIDER_PERMISSION_DENIED"
  | "SECRET_PROVIDER_RATE_LIMITED"
  | "SECRET_PROVIDER_CONFLICT"
  | "SECRET_UNSUPPORTED_OPERATION";

export class SecretError extends InternalError {
  readonly secretCode: SecretErrorCode;

  constructor(secretCode: SecretErrorCode, message: string, cause?: Error) {
    super(message);
    this.secretCode = secretCode;
    this.name = "SecretError";
    if (cause) {
      (this as any).cause = cause;
    }
  }
}
```

Each provider implementation MUST have a `parseError(unknown): Error` protected method that converts client library errors to Decaf errors. Error translation must be consistent across all providers.

### 4.7 Model-backed secret storage

The default self-hosted implementation should store secrets in the Decaf persistence layer using a `Secret` model and encrypted-at-rest payload storage.

Key requirements:

- the stored record must never contain plaintext secret data;
- the encryption metadata must support key identification, IV tracking, and AAD;
- the implementation should be explicit about encryption rather than hiding all behavior behind property decorators;
- the implementation may use crypto helpers from `@decaf-ts/crypto`, but those helpers must remain in the crypto package.

This implementation protects against database dumps, backups, and accidental plaintext persistence. It does not protect against a runtime that can legitimately decrypt the secret.

### 4.8 Provider implementations

Each provider implementation must live in its own folder and only load the dependencies it needs.

- `model`: Decaf-backed encrypted-at-rest storage using the local repository/adapter stack.
- `memory`: in-memory implementation for tests and examples.
- `hashicorp-vault`: KV v2 HTTP/API wrapper or a clearly documented community client, with support status called out honestly.
- `aws-secrets-manager`: AWS SDK v3 Secrets Manager integration.
- `azure-key-vault`: Azure Key Vault `SecretClient` integration with `@azure/identity`.
- `gcp-secret-manager`: Google Cloud Secret Manager integration using the official Node.js client.
- `onepassword`: 1Password SDK integration with reference-first support and clearly documented store limitations if item management is not available.

### 4.9 Dependency policy

- Provider libraries must be declared as optional peer dependencies.
- The root package must remain installable without cloud SDKs.
- Root imports must not force provider code or optional SDK resolution.
- Provider subpaths may import their SDKs directly if the subpath is the explicit opt-in surface.
- If build/runtime behavior requires it, provider loading may fall back to dynamic import with explicit missing-dependency errors.

### 4.10 Logging

All client-based services MUST retrieve loggers via `logCtx()` when available. Each operation should log at appropriate levels (verbose for operations, error for failures). Log entries must include correlation context when available.

### 4.11 Testing and documentation boundaries

- Shared contract tests should exercise all implementations through the same behavior suite.
- Bundling tests must prove that importing `@decaf-ts/integrations/secrets` does not load provider SDKs.
- Documentation must explicitly describe the security model and provider-specific limitations.
- The crypto module remains the home for crypto primitives, encryption helpers, and any future secret-encryption utility code; integrations only orchestrates and consumes those exports.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:--|:--|:--|:--|:--|
| DECAF-26-1 | Define the secret core contracts, name policy, serializer, and error model | High | Pending | - |
| DECAF-26-2 | Implement the memory service and the model-backed encrypted-at-rest service, including proper error handling with InternalError and logging via logCtx | High | Pending | DECAF-26-1 |
| DECAF-26-3 | Add provider subpaths for AWS, Azure, GCP, and HashiCorp Vault with parseError() methods, Decaf error handling, and logging via logCtx | High | Pending | DECAF-26-1 |
| DECAF-26-4 | Add the 1Password provider implementation and document its support limits | High | Pending | DECAF-26-1 |
| DECAF-26-5 | Update package exports, dependency metadata, and root import safety | High | Pending | DECAF-26-1 |
| DECAF-26-6 | Add contract tests, encryption tests, bundling tests, and docs | High | Pending | DECAF-26-2 |
| DECAF-26-7 | Add unit tests for error parsing in each provider, verify all errors extend from InternalError/BaseError, and test logging behavior | High | Pending | DECAF-26-3 |

## 6. Open Questions / Risks
*   Should the local model-backed implementation expose a dedicated `Secret` model export for consumers, or keep it internal and only expose the service?
*   Should `rotate()` be required for v1, or remain optional until provider semantics are fully aligned?
*   Should 1Password v1 be reference-first only, with item creation handled in a later `OnePasswordConnectSecretService`?
*   Risk: provider SDK type leakage could pollute the core API if implementation boundaries are not kept strict.
*   Risk: optional dependency handling may break bundling if provider imports are pulled into the root entrypoint.
*   Risk: the model-backed implementation could accidentally drift into generic crypto code if crypto helpers are duplicated in `integrations` instead of imported from `crypto`.

## 7. Results & Artifacts
*   New specification entry for `@decaf-ts/integrations` secret storage and retrieval support.
*   Planned package layout for `src/secrets/*` with core, model, memory, and provider subpaths.
*   Defined dependency, security, serialization, and testing boundaries for the secret service work.
