# Research Brief 05 — Fabric (`for-fabric`)

Consolidated read-only research brief for the **Architecture handbook** and **design
specification**. Scope: the Hyperledger Fabric integration module in the decaf-ts
monorepo — `for-fabric` (`@decaf-ts/for-fabric`), covering the client side (gateway
adapter, repositories, dispatch, identity/CA services, ERC20 wallet), the contracts side
(chaincode adapter, CRUD/serialized contracts, ERC20 contract, sequences, migrations,
auth, observables) and the shared subsystem (deterministic serializers, decorators,
mirroring/segregation, errors, events, crypto, base models). All statements are grounded
in the actual source, tests, README/workdocs as found in `/workspaces/decaf-ts/for-fabric`.
No tests or builds were run; nothing was modified.

---

### for-fabric (`@decaf-ts/for-fabric` v0.16.3)

1. **Identity**
   - Dir: `/workspaces/decaf-ts/for-fabric`
   - Package name: `@decaf-ts/for-fabric` (`for-fabric/package.json:2`)
   - Version: `0.16.3` (`for-fabric/package.json:3`)
   - Package description: `"Abstracts fabric logic"` (`for-fabric/package.json:4`)
   - Author: Tiago Venceslau; license MIT; `type: module`; engines node >=20, npm >=10.
   - Exports (`for-fabric/package.json` `exports`): `.` → `./dist/index.js`,
     `./client` → `./dist/client/index.js`, `./contracts` → `./dist/contracts/index.js`,
     `./contracts/bootstrap` → `./dist/contracts/bootstrap.js`, `./shared` →
     `./dist/shared/index.js`. The root barrel (`src/index.ts`) re-exports `client` and
     `shared` only; the `contracts` export is intentionally a separate entry point
     (`export * from "./contracts"` is commented out in `src/index.ts:6`) because contracts
     run inside chaincode while client/shared run off-ledger.

2. **Purpose & role**
   - `for-fabric` adapts Hyperledger Fabric (both the modern `@hyperledger/fabric-gateway`
     SDK and the legacy `fabric-network` SDK) to the decaf-ts persistence layering. It lets
     a decaf model be stored, queried and observed against a Fabric ledger exactly like any
     other decaf adapter, while also providing the chaincode-side building blocks
     (`ContractAdapter`, `FabricCrudContract`, repositories, sequences) so the same models
     can serve as smart-contract state.
   - It builds on `@decaf-ts/for-couchdb`: both the client and contract adapters extend
     `CouchDBAdapter`, queries are Mango queries, and pagination/statements reuse the
     CouchDB statement/paginator implementations. This is because Fabric chaincode state is
     typically backed by CouchDB, so the query model is shared.
   - It adds Fabric-specific concerns on top: deterministic serialization (so all endorsing
     peers produce identical ledger bytes), private data collections with segregation and
     mirroring, MSP-aware ownership (`createdBy`/`updatedBy`), CA-based identity enrollment,
     chaincode event dispatch, and an ERC20 token reference implementation.

3. **Dependencies**
   - Decaf runtime deps (`for-fabric/package.json` `dependencies`):
     `@decaf-ts/core`, `@decaf-ts/db-decorators`, `@decaf-ts/decorator-validation`,
     `@decaf-ts/for-couchdb`, `@decaf-ts/decoration`, `@decaf-ts/logging`.
   - Key external deps: `@hyperledger/fabric-gateway` (modern gateway client),
     `fabric-network` (legacy gateway), `fabric-contract-api` + `fabric-shim-api`
     (chaincode runtime), `fabric-ca-client` (Certificate Authority), `@grpc/grpc-js`
     (gRPC transport), `@peculiar/x509` + `@peculiar/webcrypto` (certificate/key parsing),
     `json-stringify-deterministic` (deterministic JSON), `uuid`.
   - Depended on by: nothing in the monorepo imports `for-fabric` at the library level; it
     is a leaf integration module. Downstream consumers are applications/deployed
     chaincodes (the `bin/releases/dist-hlf-fabric` distribution bundles it).

4. **Architecture & structure**
   - `src/index.ts` — root barrel; re-exports `./client` and `./shared`. The
     `./contracts` export is commented out so chaincode code is not pulled into client
     bundles (`src/index.ts:6`).
   - `src/version.ts` — `VERSION`/`COMMIT`/`FULL_VERSION`/`PACKAGE_NAME` placeholders and
     library self-registration via `Metadata`.
   - `src/shared/` — code shared between client and chaincode:
     - `constants.ts` — `FabricModelKeys` enum, `IdentityType` enum,
       `FabricFlavour = "hlf-fabric"`.
     - `types.ts` — `HSMOptions`, `MspDetails`, `PeerConfig`, `FabricFlags`,
       `SegregatedModel`, etc.
     - `ClientSerializer.ts` — extends `JSONSerializer`, embeds a class anchor so the
       off-ledger client can reconstruct model instances.
     - `DeterministicSerializer.ts` — `sortKeysOnlyRecursive()` + deterministic
       `JSON.stringify` so all endorsing peers serialize identically.
     - `SimpleDeterministicSerializer.ts` — lighter deserializer that returns parsed JSON
       directly and uses `json-stringify-deterministic` for serialization.
     - `decorators.ts` — `DefaultContractResolver`, `ChaincodeResolver`, `@mirror()`,
       `@Owner()`, `applyMirrorFlags`, `applySegregationFlags`, `extractMspId`, etc.
     - `overrides/overrides.ts` — monkey-patches `Model.prototype.isShared`/`isPrivate`/
       `segregate` and static `Model.segregate` to be collection-aware.
     - `errors.ts` — `OverflowError`, `BalanceError`, `AllowanceError`,
       `RegistrationError`, `QueryResultTooLargeError`, `MissingContextError`,
       `NotInitializedError`, plus gateway-error wrappers
       (`EndorsementError`, `EndorsementPolicyError`, `MvccReadConflictError`,
       `PhantomReadConflictError`, `TransactionTimeoutError`).
     - `events.ts` — `generateFabricEventName()` / `parseEventName()` for the
       `table~event~owner` event-naming convention.
     - `math.ts` — overflow-safe `add`/`sub` and `safeParseInt` for ERC20 arithmetic.
     - `fabric-types.ts` — CA response types
       (`GetCertificatesRequest`, `CertificateResponse`, `FabricIdentity`,
       `IdentityResponse`).
     - `interfaces/Checkable.ts` — `Checkable` healthcheck interface + `healthcheck` type.
     - `model/` — `FabricBaseModel` (`createdAt`/`updatedAt`/`version`, flavoured
       `hlf-fabric`), `FabricIdentifiedBaseModel` (adds `createdBy`/`updatedBy`),
       `Identity` (wallet identity with `oneToOne` → `IdentityCredentials`).
     - `erc20/` — ERC20 shared constants.
   - `src/client/` — off-ledger client that talks to a Fabric network via the gateway SDK:
     - `FabricClientAdapter.ts` (~2050 lines) — the central adapter; extends
       `CouchDBAdapter`; manages gRPC `Client`/`Gateway`/`Network`/`Contract` connections
       (modern and legacy), builds identities/signers from files or PEM content, submits
       transactions, runs rich (Mango) queries via chaincode, supports transient maps,
       mirroring and segregation, and exposes `view()` for CouchDB design-doc views. Wires
       `FabricClientStatement`, `FabricClientPaginator`, `FabricClientRepository`,
       `FabricClientDispatch`.
     - `FabricClientContext.ts` — extends `Context` with a constrained override surface
       (`allowGenerationOverride`, `allowMirroring`).
     - `FabricClientDispatch.ts` — chaincode event listener/dispatcher (observer pattern).
     - `FabricClientRepository.ts` — extends `Repository`; forces prepared statements
       (`forcePrepareSimpleQueries`/`forcePrepareComplexQueries`), disables raw statements
       and generation override for the client side.
     - `FabricClientStatement.ts` — extends `Statement`; builds Mango queries, supports
       `STARTS_WITH`/`ENDS_WITH`/`BETWEEN`, view-based aggregates (count/sum/min/max/
       distinct/avg), and prepared-statement squashing.
     - `FabricClientPaginator.ts` — extends `Paginator`; raw-query paging throws
       `UnsupportedError` (only prepared statements are natively available).
     - `fabric-fs.ts` / `utils.ts` — filesystem + crypto helpers: `readFile`,
       `getIdentity`, `getSigner`, `getCAUser`, `getFirstDirFileNameContent`,
       `extractPrivateKey`, `getAkiAndSerialFromCert`, `CoreUtils` (HSM-aware enrollment,
       certificate SKI extraction). `utils.ts` is the richer HSM-capable variant.
     - `crypto.ts` — `CryptoUtils` (X.509 identity string, base58 `BaseEncoder`,
       ECDSA sign/verify, PBKDF2/AES-GCM PIN encryption) and `BASE_ALPHABET`/`CRYPTO` enums.
     - `fabric-hsm.ts` — HSM signer factory support.
     - `services/` — `FabricIdentityService` (CA-based identity lifecycle: enroll,
       register, get certs) and `FabricEnrollmentService`, plus
       `RegistrationRequestBuilder`.
     - `erc20/FabricERC20ClientRepository.ts` — client-side ERC20 wallet repository
       extending `FabricClientRepository`.
     - `collections/generation.ts`, `ids/id-extraction.ts`, `indexes/generation.ts` —
       generate CouchDB indexes/design-docs and META-INF state-db artifacts for chaincode
       deployment; resolve collection names; extract IDs from keys.
     - `logging.ts` — client-side logging setup.
     - `constants.ts` / `types.ts` — `DefaultFabricClientFlags`
       (timeouts, legacy gateway, mirroring, synthetic events) and `FabricClientFlags`.
   - `src/contracts/` — chaincode-side building blocks that run inside the peer:
     - `ContractAdapter.ts` — `FabricContractAdapter` extends `CouchDBAdapter`; uses the
       `ChaincodeStub` as the state store, supports private data collections, transient
       maps, and segregation/mirroring-aware reads/writes.
     - `ContractContext.ts` — `FabricContractContext` extends `Context` with `stub`,
       `clientIdentity`, `logger`, `timestamp` (from `stub.getDateTimestamp()`).
     - `FabricContractRepository.ts` — extends `Repository` for chaincode models; applies
       segregation + mirror flags per operation; uses
       `FabricContractRepositoryObservableHandler`.
     - `FabricContractRepositoryObservableHandler.ts` — extends `ObserverHandler`; emits
       Fabric events via `stub.setEvent()` for CREATE/UPDATE/DELETE and bulk variants,
       using `generateFabricEventName()`; short-circuits when fully segregated.
     - `FabricContractStatement.ts` — `FabricStatement` extends `CouchDBStatement`;
       applies segregation/mirror flags before execution; builds Mango queries with table
       filter and aggregation support.
     - `FabricContractPaginator.ts` — extends `CouchDBPaginator`; bookmark-based paging with
       segregation/mirror flag application and a private pagination tie-breaker.
     - `FabricContractSequence.ts` — world-state backed sequence generation for chaincode.
     - `PrivateSequence.ts` — `CustomizableSequence` model used for private sequences.
     - `MigrationContract.ts` — contract for managing data migrations.
     - `crud/crud-contract.ts` — `FabricCrudContract<M>` extends fabric-contract-api
       `Contract`; standard CRUD transactions (create/read/update/delete/createAll/
       readAll/updateAll/deleteAll/listBy/paginateBy/page/findOneBy/query/countOf/maxOf/
       minOf/avgOf/sumOf/distinctOf/groupOf/healthcheck/init).
     - `crud/serialized-crud-contract.ts` — `SerializedCrudContract<M>` overrides all
       transactions to accept/return JSON strings (for simple clients).
     - `erc20/erc20contract.ts` — `FabricERC20Contract` implementing ERC20-like token logic
       (Initialize, TokenName, Symbol, Decimals, TotalSupply, BalanceOf, Transfer,
       Approve, Allowance, TransferFrom, etc.) using overflow-safe `math.add`/`math.sub`.
     - `erc20/models.ts` — `ERC20Token`, `ERC20Wallet`, `Allowance` models.
     - `auth/decorators.ts` — `hlfAllowIf`, `mspHandler` authorization decorators for
       MSP/role-based access control inside contracts.
     - `bootstrap.ts` — imports all decaf-ts core modules + shared + overrides so a
       chaincode bundle pulls in everything needed (separate `./contracts/bootstrap` export).
     - `overrides.ts` — overrides `UUID.prototype.generate` with `uuidFromSeed` for
       deterministic UUIDs across peers.
     - `fabric-overrides.ts` — flavour-based decoration overrides for `createdBy`,
       `updatedBy`, `COLUMN`, `DATE`, `OBJECT` bound to `FabricFlavour`.
     - `uuid.ts` — `uuidFromSeed()` using SHA-256 + UUID-v5-style formatting.
     - `logging.ts` — `ContractLogger` extends `MiniLogger`; routes logs to the Fabric
       `ctx.logging` sink; sets itself as the default `Logging` factory for chaincode.
     - `FabricContractDispatch.ts` — contract-side dispatch helper.
     - `types.ts` — `FabricContractFlags` (stub, identity, roles, cert, segregation maps,
       logger).
   - `src/contract/` — example domain models (Product, Batch, Audit, Market, User, etc.)
     used by tests; **not** exported by the package barrels. These are sample/test contracts
     rather than part of the public API.

5. **Public API surface**
   - Root barrel (`@decaf-ts/for-fabric`) re-exports `client` + `shared`:
     - **Client adapter/core**: `FabricClientAdapter` (gateway connection + CRUD + queries +
       views), `FabricClientContext`, `FabricClientDispatch`, `FabricClientRepository`,
       `FabricClientStatement`, `FabricClientPaginator`.
     - **Client services**: `FabricIdentityService`, `FabricEnrollmentService`,
       `RegistrationRequestBuilder`.
     - **Client fs/crypto**: `getIdentity`, `getSigner`, `readFile`, `getCAUser`,
       `getFirstDirFileName`, `getFirstDirFileNameContent`, `extractPrivateKey`, `CoreUtils`
       (HSM-aware), `CryptoUtils`, `BaseEncoder`, `BASE_ALPHABET`, `getAkiAndSerialFromCert`.
     - **Client ERC20**: `FabricERC20ClientRepository`.
     - **Client index/collection generation**: `generateModelIndexes`,
       `generateModelDesignDocs`, `readModelFolders`, `writeIndexes`, `writeDesignDocs`,
       `extractIds`.
     - **Shared serializers**: `ClientSerializer`, `DeterministicSerializer`,
       `SimpleDeterministicSerializer`.
     - **Shared decorators/helpers**: `@mirror()`, `@Owner()`, `DefaultContractResolver`,
       `ChaincodeResolver`, `applyMirrorFlags`, `applySegregationFlags`, `extractMspId`.
     - **Shared models**: `FabricBaseModel`, `FabricIdentifiedBaseModel`, `Identity`,
       `IdentityCredentials`.
     - **Shared constants/types**: `FabricFlavour`, `FabricModelKeys`, `IdentityType`,
       `FabricFlags`, `PeerConfig`, `MspDetails`, `HSMOptions`, `SegregatedModel`.
     - **Shared errors**: `OverflowError`, `BalanceError`, `AllowanceError`,
       `RegistrationError`, `QueryResultTooLargeError`, `MissingContextError`,
       `NotInitializedError`, gateway error wrappers.
     - **Shared events**: `generateFabricEventName`, `parseEventName`.
     - **Shared math**: `add`, `sub`, `safeParseInt`.
     - **Shared interfaces/types**: `Checkable`, `healthcheck`, CA fabric-types.
     - **Shared overrides**: `Model.isShared`/`isPrivate`/`segregate` patches.
   - Contracts barrel (`@decaf-ts/for-fabric/contracts`):
     - `FabricContractAdapter`, `FabricContractContext`, `FabricContractRepository`,
       `FabricContractRepositoryObservableHandler`, `FabricStatement`,
       `FabricContractPaginator`, `FabricContractDBSequence` (sequence),
       `MigrationContract`.
     - `FabricCrudContract`, `SerializedCrudContract`.
     - `FabricERC20Contract`, `ERC20Token`, `ERC20Wallet`, `Allowance`.
     - `ContractLogger`.
     - Auth: `hlfAllowIf`, `mspHandler`.
     - Re-exports `shared` overrides.
   - Bootstrap (`@decaf-ts/for-fabric/contracts/bootstrap`): side-effect import that loads
     all decaf-ts core modules + shared + overrides for a chaincode bundle.

6. **Key patterns & concepts**
   - **Dual-sided adapter architecture**: one module, two execution contexts. The *client*
     adapter (`FabricClientAdapter`) talks to a running Fabric network via the gateway SDK;
     the *contract* adapter (`FabricContractAdapter`) runs *inside* chaincode and uses the
     `ChaincodeStub`. Both extend `CouchDBAdapter`, so queries/pagination/statements are
     shared CouchDB-style logic, but each adds Fabric-specific context and flag handling.
   - **Deterministic serialization**: because Fabric requires all endorsing peers to produce
     identical ledger bytes, `DeterministicSerializer` sorts keys recursively and uses a
     stable `JSON.stringify`. `uuidFromSeed` (SHA-256 based) replaces `UUID.generate` inside
     chaincode (`contracts/overrides.ts`) so generated IDs are reproducible. The client side
     uses `ClientSerializer` which embeds a class anchor for off-ledger reconstruction.
   - **Flavour binding**: `FabricFlavour = "hlf-fabric"` is bound to models via `@uses()`
     on `FabricBaseModel`/`FabricIdentifiedBaseModel`, and `fabric-overrides.ts` provides
     flavour-specific implementations of `createdBy`, `updatedBy`, `COLUMN`, `DATE`,
     `OBJECT` decorators. This is the decaf decoration/metadata flavour mechanism applied to
     Fabric ownership semantics.
   - **Segregation (private data collections)**: `Model.segregate` (patched in
     `shared/overrides`) and `applySegregationFlags` split a model into public + private
     collection parts. `FabricContractFlags` carries `segregateWrite`/`segregateRead`/
     `fullySegregated`/`segregatedData`/`sequenceSegregation` maps. Collections can be
     static strings or resolver functions `(model, msp, ctx) => string`.
   - **Mirroring**: `@mirror(collection, msp?, anchor?, allow?)` lets a model maintain a
     mirrored copy of private data in a shared/public collection. `applyMirrorFlags`
     configures the adapter to read/write the mirror. The `allow` predicate (4th arg)
     conditionally disables mirroring per context. Mirroring is skipped entirely when
     `allow(ctx)` returns false.
   - **MSP-aware ownership**: `@Owner()` and the flavour-bound `createdBy`/`updatedBy`
     populate the submitting identity's MSP/id. `extractMspId(ctx.identity)` resolves the
     MSP used for collection resolution.
   - **Chaincode events**: contracts emit events via
     `FabricContractRepositoryObservableHandler` → `stub.setEvent(eventName, payload)`,
     where `eventName = generateFabricEventName(table, event, owner)` (a
     `table~event~owner` string). The client `FabricClientDispatch` listens for these events
     and dispatches to registered observers; `parseEventName` decodes them client-side.
     Synthetic events can be generated client-side when the flag is set.
   - **Prepared statements / no raw statements on client**: `FabricClientRepository`
     forces `forcePrepareSimpleQueries`/`forcePrepareComplexQueries` and disables
     `allowRawStatements` — client queries are squashed into prepared statement invocations
     against chaincode rather than ad-hoc Mango queries. `FabricClientPaginator.raw` paging
     throws `UnsupportedError` by design.
   - **Sequences**: `FabricContractDBSequence` provides world-state-backed incremental
     sequences (for auto-increment IDs) inside chaincode; `CustomizableSequence`
     (`PrivateSequence.ts`) is the backing model.
   - **ERC20 reference implementation**: full ERC20-like token contract
     (`FabricERC20Contract`) plus client wallet repository
     (`FabricERC20ClientRepository`) and token/wallet/allowance models, using overflow-safe
     `math.add`/`math.sub`.
   - **Identity / CA services**: `FabricIdentityService` and `FabricEnrollmentService`
     wrap `fabric-ca-client` for enrollment, registration, and certificate retrieval;
     `RegistrationRequestBuilder` constructs CA registration requests. HSM enrollment is
     supported via `CoreUtils.getHSMEnrollmentKey` and `getCertificateSKI`.

7. **Lifecycle / configuration / environment**
   - **Bootstrap (chaincode)**: importing `@decaf-ts/for-fabric/contracts/bootstrap` loads
     all core decaf modules, shared serializers/overrides, and sets the
     `ContractLogger` factory as the default `Logging` factory (`contracts/logging.ts:163`).
     `contracts/overrides.ts` replaces `UUID.prototype.generate` with `uuidFromSeed`. A
     chaincode contract class extends `FabricCrudContract<M>` (or `Contract`) and is
     exported as the chaincode entrypoint.
   - **Client init**: `new FabricClientAdapter(config, alias?)` with a `PeerConfig`
     (`mspId`, `peerEndpoint`, `channelName`, `chaincodeName`, `contractName`, TLS/cert/key
     paths, CA config). The adapter lazily builds a gRPC `Client`, connects a `Gateway`,
     gets the `Network`/`Contract`, and caches them. Legacy gateway (`fabric-network`) is
     supported behind a flag (`DefaultFabricClientFlags` legacy option).
   - **Flags / defaults** (`client/constants.ts` `DefaultFabricClientFlags`): default
     timeouts, legacy-gateway toggle, mirroring enable, synthetic-events toggle.
     `FabricClientRepository` further constrains overrides (`ignoreValidation`,
     `ignoreHandlers`, `allowRawStatements: false`, `forcePrepareSimpleQueries: true`,
     `forcePrepareComplexQueries: true`, `allowGenerationOverride: false`).
   - **Environment**: no required env vars for the library itself; connection details come
     from the `PeerConfig`. `isBrowser()` (`@decaf-ts/logging`) switches the private-key
     extraction path between WebCrypto (`globalThis.crypto.subtle`) and Node `crypto`.
     `PAPERCLIP_*`-style env vars are irrelevant here (this is a library, not an agent).
   - **Index/design-doc generation**: `generateModelIndexes`/`generateModelDesignDocs` +
     `writeIndexes`/`writeDesignDocs` emit `META-INF/statedb/couchdb/...` artifacts (with
     optional `collections/<name>/` prefix) that Fabric's peer uses to provision CouchDB
     indexes and design docs at chaincode install time.

8. **Data & control flow**
   - **Client create**: `repo.create(model)` → `FabricClientRepository` prepares context
     (forces prepared statements) → `FabricClientAdapter` serializes the model with
     `ClientSerializer`, builds the chaincode transaction (with transient map / segregation
     / mirror flags as needed), submits via `Contract.submitTransaction(name, ...args)` →
     the chaincode contract's `create` transaction runs on peers → result is returned and
     deserialized back to a model via `adapter.revert`.
   - **Client query**: `repo.find()` / `repo.raw()` → `FabricClientStatement.build()`
     produces a Mango query → because raw statements are disabled on the client, the query
     is squashed into a prepared-statement call (`squash`/`prepare`) → submitted to
     chaincode as a transaction → chaincode runs the equivalent statement and returns
     matching docs → `processRecord` extracts the id from the CouchDB key separator and
     `revert`s each doc to a model. Aggregates (count/sum/min/max/distinct/avg) go through
     adapter `view()` against design docs.
   - **Contract create**: contract `create(ctx, model)` → `FabricContractRepository`
     resolves collections (`Model.collectionsFor`), applies segregation + mirror flags
     (`applySegregationFlags`, `applyMirrorFlags`) → `FabricContractAdapter.create` uses
     `DeterministicSerializer` to serialize, then `stub.putState(key, bytes)` for the public
     part and `stub.putPrivateData(collection, key, bytes)` for private collection parts →
     `FabricContractRepositoryObservableHandler.updateObservers` emits a Fabric event via
     `stub.setEvent` → returns the model.
   - **Contract query**: `FabricContractStatement.execute` → resolves collections, applies
     segregation/mirror flags, builds the Mango query, calls `adapter.raw(query, true, ctx)`
     which uses `stub.getQueryResult` / `stub.getPrivateDataQueryResult` → maps rows through
     `processRecord` and after-handlers.
   - **Events**: contract emits → client `FabricClientDispatch` (started via `dispatch.start()`)
     registers a chaincode event listener (`contract.addEventListener`) → incoming events
     are parsed (`parseEventName`) and dispatched to registered observers keyed by
     table/event. Synthetic events can be emitted client-side when the flag is enabled.

9. **Testing**
   - Test layout (`for-fabric/tests/`):
     - `unit/` — ~60+ unit tests covering: client adapter/context/dispatch (events,
       segregated, synthetic), client repository (crud, mirroring, observables), client
       statement/query serialization, client fs, client logging, client ERC20 repository,
       client services (enrollment, logged), contract adapter, contract repository,
       contract observables, contract statement, contract sequence, contract mirror,
       contract history/audit, contract product-owner crud isolation, contract range-list,
       contract segregated data, contract logging, shared serializers (client, deterministic,
       simple), shared constants, shared crypto, shared decorators, shared errors, shared
       events, shared fabric-types, shared math, shared mirrors data (client + contract),
       shared model, shared utils, decoration, impersonation, index-generation (incl. folder
       resolution), migrations, model segregation, other-leaflet (mirror relations, models
       version), other-product (audit mirror, shared persistent counter, shared version),
       product-contract, version.
     - `integration/` — `Address-contract`, `Global-Contract`, `IdentityService`,
       `Serialized-Contract-Private-Model`, `Serialized-Contract-Public-Model`, `enrollment`,
       `test-ERC20-Contract`.
     - `integration2/` — `compatibility.test.ts` + `environment.ts`.
     - `e2e/` — `contextualization`, `mirror.other-product`, `private-shared-mirror`,
       `repository.batch.crud`, `repository.crud`, `repository.query`, `segregated.data`.
     - `infrastructure/` — `boot-contract.test.ts`.
     - `assets/` — fixture contracts used by tests: `contract/product-contract/` (Product,
       Audit, Market, etc.), `contract/erc-20-contract/`, `contract/serialized-contract-
       public-model/`, `contract/test/UserModelContract.ts`, `contract/e2e/UserModel.ts`;
       `assets/ca-config.ts`; `ChaincodeManager.ts`; `bootstrap.ts`; `utils.ts`;
       `contract.deployer.script.ts`.
   - **Coverage**: broad unit coverage of both client and contract subsystems, shared
     serializers/decorators/errors/events/math, and ERC20. E2E tests exercise real
     chaincode deployment (`ChaincodeManager`, `contract.deployer.script.ts`) for CRUD,
     queries, mirroring, segregation and contextualization.
   - **Notable gaps**: `tests/unit/contracts-contract-private-data-adapter.testtt.ts` has a
     `.testtt.ts` extension (likely excluded from the test runner — see Inaccuracies).
     `tests/integration/.gitlock` and `tests/unit/.gitlock` are placeholder lock files. No
     dedicated client-paginator unit test (paging is exercised via e2e/prepared statements).

10. **Usage example**
    - Client-side CRUD + event listening (derived from `workdocs/5-HowToUse.md` and tests):
      ```typescript
      import { FabricClientAdapter, FabricClientDispatch, PeerConfig } from '@decaf-ts/for-fabric';

      const config: PeerConfig = {
        mspId: 'Org1MSP', peerEndpoint: 'localhost:7051',
        channelName: 'mychannel', chaincodeName: 'mycc', contractName: 'mycontract',
        tlsCertPath: '/path/to/tls/cert',
        certDirectoryPath: '/path/to/cert/dir', keyDirectoryPath: '/path/to/key/dir',
      };
      const adapter = new FabricClientAdapter(config, 'org1-adapter');

      // Listen for chaincode events
      const client = await FabricClientAdapter.getClient(config);
      const dispatch = new FabricClientDispatch(client);
      dispatch.configure(config);
      dispatch.observe('assets', 'create', (id) => console.log('Asset created:', id));
      await dispatch.start();
      ```
    - Chaincode CRUD contract (derived from `workdocs/5-HowToUse.md` and
      `src/contracts/crud/crud-contract.ts`):
      ```typescript
      import { Context, Info, Transaction } from 'fabric-contract-api';
      import { FabricCrudContract } from '@decaf-ts/for-fabric/contracts';
      import { model, ModelArg, required } from '@decaf-ts/decorator-validation';
      import { BaseModel, pk } from '@decaf-ts/core';

      @model()
      class Person extends BaseModel {
        @pk({ type: 'Number' }) id!: number;
        @required() name!: string;
        constructor(arg?: ModelArg<Person>) { super(arg); }
      }

      @Info({ title: 'PersonContract', description: 'Person CRUD contract' })
      export class PersonContract extends FabricCrudContract<Person> {
        constructor() { super('PersonContract', Person); }

        @Transaction(false)
        async ping(ctx: Context): Promise<string> { this.logFor(ctx).info('ping'); return 'pong'; }
      }
      ```
    - Serialized contract for simple JSON-string clients (`SerializedCrudContract`):
      ```typescript
      import { SerializedCrudContract } from '@decaf-ts/for-fabric/contracts';
      export class TestModelContract extends SerializedCrudContract<TestModel> {
        constructor() { super('TestModelContract', TestModel); }
      }
      // Client submits JSON string: const res = await contract.create(ctx, model.serialize());
      ```

11. **Relationships**
   - **Builds on `@decaf-ts/for-couchdb`**: both adapters extend `CouchDBAdapter`,
     statements/paginators extend `CouchDBStatement`/`CouchDBPaginator`, queries are Mango,
     and index/design-doc generation reuses `for-couchdb` helpers (`generateIndexes`,
     `generateViews`, `prefixRange`, `translateOperators`, `findViewMetadata`).
   - **Core decaf layering**: depends on `@decaf-ts/core` (Adapter, Repository, Statement,
     Paginator, Context, Sequence, ObserverHandler, Condition, migrations), `@decaf-ts/db-
     decorators` (OperationKeys, errors, validation, hooks), `@decaf-ts/decorator-
     validation` (Model, serializers), `@decaf-ts/decoration` (Metadata, flavours,
     `@uses`, `@description`), `@decaf-ts/logging` (MiniLogger, LoggerFactory).
   - **Flavour integration**: `FabricFlavour` participates in the decoration flavour system
     alongside `RamFlavour`, `CouchDbFlavour`, etc.; flavour-bound decorators
     (`createdBy`, `updatedBy`, `COLUMN`, `DATE`, `OBJECT`) are defined in
     `contracts/fabric-overrides.ts`.
   - **Migration system**: `MigrationContract` integrates with the decaf core migration
     framework for chaincode data migrations.
   - **HTTP/Nest**: not directly imported by `for-fabric`, but the client adapter/context
     can be wrapped by `for-http`/`for-nest` adapters in application code (out of scope of
     this module).

12. **Consumer notes**
   - **Two entry points matter**: import client/shared from `@decaf-ts/for-fabric`; import
     chaincode classes from `@decaf-ts/for-fabric/contracts`. Pulling the contracts barrel
     into a client bundle would drag in `fabric-contract-api`/`fabric-shim-api`. The root
     barrel intentionally omits the contracts re-export.
   - **Determinism is mandatory on-chain**: always use `DeterministicSerializer` (the
     contract adapter does by default) and never `JSON.stringify` with insertion-order keys
     inside chaincode, or endorsements will mismatch. `uuidFromSeed` replaces random UUIDs
     for the same reason.
   - **Client queries are prepared-statement-only**: `FabricClientRepository` disables raw
     statements and forces preparation; `FabricClientPaginator` raw paging throws
     `UnsupportedError`. Custom query/paging must be implemented as chaincode transactions
     invoked via prepared statements.
   - **Private data requires collection setup**: segregation/mirroring needs the
     `collections` configuration in the chaincode deployment and matching `META-INF`
     collection definitions; `writeIndexes`/`writeDesignDocs` accept a `collection` argument
     for collection-scoped artifacts.
   - **Mirroring is conditional**: `@mirror`'s 4th argument (`allow`) gates whether mirror
     reads/writes/flags occur per context; when it returns false, mirroring is fully
     skipped (not just no-oped).
   - **Legacy vs modern gateway**: the adapter supports both `@hyperledger/fabric-gateway`
     (modern, default) and `fabric-network` (legacy, behind a flag). Legacy support adds
     bundle weight; new consumers should use the modern path.
   - **HSM**: HSM-backed identities are supported via `CoreUtils` (not the simpler
     `fabric-fs.ts` helpers); requires `HSMOptions` (library, slot, tokenLabel, pin, keyIdHex).
   - **Maturity / versioning**: at `0.16.3` — pre-1.0; the API is feature-rich but may
     evolve. The `.testtt.ts` typo and commented-out `raw` method in
     `SerializedCrudContract` suggest active development.
   - **Browser support**: `crypto.ts` and `utils.ts` branch on `isBrowser()` for
     SubtleCrypto access, so the client side can run in a browser context (with appropriate
     Fabric gateway proxying).

13. **Inaccuracies found**
   1. **[for-fabric]** README title vs package — The `README.md` is titled
      "Hyperledger Fabric Contracts for DECAF", but the package covers both the client and
      contracts sides (and the root barrel primarily exports client + shared). The README
      scope is narrower than the module.
      | Evidence: `for-fabric/README.md` title line vs `for-fabric/package.json` exports
      (`./client`, `./shared`, `./contracts`) | Suggested fix: rename/broaden the README to
      cover the full client+contracts+shared module, or split docs.
   2. **[for-fabric]** `5-HowToUse.md` references non-existent export `FabricAdapter` — the
      client-side example imports `{ FabricAdapter, PeerConfig }` and uses
      `FabricAdapter.getClient`, `new FabricAdapter(...)`, but the actual exported class is
      `FabricClientAdapter`. `FabricAdapter` does not exist in `src/client/index.ts`.
      | Evidence: `for-fabric/workdocs/5-HowToUse.md:14,36,71,75` vs
      `src/client/index.ts` (exports `FabricClientAdapter`) | Suggested fix: replace
      `FabricAdapter` with `FabricClientAdapter` throughout the how-to.
   3. **[for-fabric]** `5-HowToUse.md` references non-existent export `FabricDispatch` —
      the event example imports `{ FabricAdapter, FabricDispatch }` and uses
      `new FabricDispatch(client)`. The actual exported class is `FabricClientDispatch`.
      | Evidence: `for-fabric/workdocs/5-HowToUse.md:71` vs `src/client/index.ts` (exports
      `FabricClientDispatch`) | Suggested fix: replace `FabricDispatch` with
      `FabricClientDispatch`.
   4. **[for-fabric]** `5-HowToUse.md` client adapter CRUD signature mismatch — the example
      calls `adapter.create('assets', 'asset1', asset, {}, mySerializer)` /
      `adapter.read('assets', id, mySerializer)` / `adapter.delete('assets', id,
      mySerializer)`, implying direct low-level adapter CRUD with a serializer argument.
      `FabricClientAdapter` is meant to be used through `FabricClientRepository` (which
      prepares statements and forces prepared queries); direct adapter CRUD signatures and
      the serializer-last-argument pattern do not match the repository-based flow shown
      elsewhere in the same doc and in tests.
      | Evidence: `for-fabric/workdocs/5-HowToUse.md:41-65` vs
      `src/client/FabricClientRepository.ts` (prepared-statement flow) | Suggested fix:
      rewrite the client example to use `FabricClientRepository` and the standard decaf
      repository API.
   5. **[for-fabric]** `5-HowToUse.md` `FabricContractRepository` example uses
      `require('@decaf-ts/for-fabric').contracts.FabricContractAdapter` — the
      `contracts` namespace is not exported from the root barrel (`src/index.ts` comments
      out `export * from "./contracts"`), so `.contracts.FabricContractAdapter` would be
      `undefined`. The correct import is `from '@decaf-ts/for-fabric/contracts'`.
      | Evidence: `for-fabric/workdocs/5-HowToUse.md:421` vs `src/index.ts:6` (commented
      out) and `package.json` exports (`./contracts`) | Suggested fix: change the import to
      `from '@decaf-ts/for-fabric/contracts'`.
   6. **[for-fabric]** `5-HowToUse.md` `FabricStatement` constructor signature mismatch —
      the example does `new FabricStatement<MyModel, MyModel[]>(adapter, ctx)`, passing the
      context `ctx` as the 2nd constructor arg. The actual constructor is
      `constructor(adapter, overrides?: Partial<AdapterFlags>)` (`FabricContractStatement.ts:56`);
      context is passed to `raw(...)`/`execute(...)`, not the constructor.
      | Evidence: `for-fabric/workdocs/5-HowToUse.md:491` vs
      `src/contracts/FabricContractStatement.ts:56-64` | Suggested fix: change to
      `new FabricStatement(adapter)` and pass `ctx` to `stmt.raw(query, ctx)`.
   7. **[for-fabric]** `5-HowToUse.md` `FabricContractRepositoryObservableHandler.
      updateObservers` signature mismatch — the example calls
      `handler.updateObservers(log, 'assets', OperationKeys.CREATE, 'asset1', ctx)`, passing
      a logger as the first arg. The actual signature is
      `updateObservers(clazz, event, id, ...args)` where `log`/`ctx` come from
      `Adapter.logCtx(...)` inside the method (no logger argument); `clazz` (table/ctor) is
      first.
      | Evidence: `for-fabric/workdocs/5-HowToUse.md:530` vs
      `src/contracts/FabricContractRepositoryObservableHandler.ts:83-88` | Suggested fix:
      drop the leading `log` argument; call `handler.updateObservers('assets',
      OperationKeys.CREATE, 'asset1', ctx)`.
   8. **[for-fabric]** Test file with `.testtt.ts` extension —
      `tests/unit/contracts-contract-private-data-adapter.testtt.ts` has a triple-`t`
      extension (`.testtt.ts`) which most test runners (mocha/jest globbing `*.test.ts` or
      `*.spec.ts`) will not pick up, so this private-data-adapter test is effectively dead.
      | Evidence: `for-fabric/tests/unit/contracts-contract-private-data-adapter.testtt.ts`
      filename | Suggested fix: rename to `*.test.ts` (or confirm it is intentionally
      disabled and mark it `.skip`/move to a `disabled/` dir).
   9. **[for-fabric]** `SerializedCrudContract.raw` is commented out —
       `src/contracts/crud/serialized-crud-contract.ts:159-169` has the `raw` override
       fully commented out, so `SerializedCrudContract` does not expose a `raw` transaction.
       The base `FabricCrudContract` may still declare `raw`, but the serialized variant
       silently drops it, which could surprise consumers expecting JSON-string raw queries.
       | Evidence: `for-fabric/src/contracts/crud/serialized-crud-contract.ts:159-169` |
       Suggested fix: either implement the serialized `raw` or document that it is
       unavailable on `SerializedCrudContract`.
   10. **[for-fabric]** `SerializedCrudContract.healthcheck` TODO —
       `serialized-crud-contract.ts:178` has `//TODO: TRIM NOT WORKING CHECK LATER` above
       the `healthcheck` override, indicating a known unverified behavior left in the
       shipped code.
       | Evidence: `for-fabric/src/contracts/crud/serialized-crud-contract.ts:178` |
       Suggested fix: resolve the trim issue or document the limitation.
   11. **[for-fabric]** `erc20/models.ts` `ERC20Token` constructor param type —
       `ERC20Token`'s constructor is `constructor(m?: ModelArg<ERC20Wallet>)` (note
       `ERC20Wallet`, not `ERC20Token`). This is a copy-paste type error: the token model's
       constructor accepts a `ModelArg<ERC20Wallet>`.
       | Evidence: `for-fabric/src/contracts/erc20/models.ts:55` | Suggested fix: change to
       `ModelArg<ERC20Token>`.
   12. **[for-fabric]** `Allowance` model primary key is ambiguous/stacked — the `@pk({ type:
       String })` decorator (line 130) is immediately followed by a JSDoc describing an
       "Allowance unique identifier / Primary key", then `@column()`/`@required()` and a
       second JSDoc describing "Owner wallet identifier", then `owner!: string` (line 141).
       Both `@pk` and `@column` therefore stack onto `owner`, making `owner` both the
       primary key and a regular column. The first JSDoc block (lines 131-134) describes an
       intended separate `id` field that was never declared. This is almost certainly a
       copy-paste/missing-field bug: an allowance approval keyed only by `owner` cannot
       represent multiple distinct spender approvals for the same owner.
       | Evidence: `for-fabric/src/contracts/erc20/models.ts:130-141` | Suggested fix: add
       an explicit `id!: string` field decorated with `@pk()` (composite of owner+spender is
       typical for ERC20 allowances), or move `@pk` onto the intended field and drop it from
       `owner`.
   13. **[for-fabric]** `Checkable` interface return type references undeclared `healthcheck`
       type before its declaration — `Checkable.healthcheck` returns
       `Promise<string | healthcheck>` where `healthcheck` is a type declared *after* the
       interface (line 21). TypeScript hoists types so this compiles, but it is confusing
       and the interface/type share a name with the method, reducing readability.
       | Evidence: `for-fabric/src/shared/interfaces/Checkable.ts:18` (uses `healthcheck`)
       vs `:21` (declares `export type healthcheck`) | Suggested fix: rename the type (e.g.
       `HealthcheckResult`) to avoid the name clash with the method.
   14. **[for-fabric]** `extractPrivateKey` in `fabric-fs.ts` has dead commented code and
       hardcoded browser path — the function has commented-out `isBrowser()` branching
       (`// if (isBrowser()) { ...`) and always uses `globalThis.crypto.subtle`, with a
       leading `let subtle` that the commented block never reassigns. The richer
       `utils.ts`/`CoreUtils.extractPrivateKey` handles both browser and Node correctly.
       | Evidence: `for-fabric/src/client/fabric-fs.ts:196-206` | Suggested fix: remove the
       dead commented block or restore the proper branching, and prefer `CoreUtils` for new
       code.
   15. **[for-fabric]** `CryptoUtils.encrypt`/`decrypt` use `ECDSA` as the encrypt/decrypt
       algorithm name — ECDSA is a signature algorithm, not an encryption algorithm;
       `subtle.encrypt({ name: "ECDSA" }, ...)` will throw in standard WebCrypto. The
       `encryptPin`/`decryptPin` methods correctly use `AES-GCM`, but the public
       `encrypt`/`decrypt` are effectively broken.
       | Evidence: `for-fabric/src/client/crypto.ts:299,321` (`name: "ECDSA"` in
       encrypt/decrypt) | Suggested fix: use `AES-GCM` (or RSA-OAEP) for
       `encrypt`/`decrypt`, or remove these methods if unused.

   **Count: 15 inaccuracies found.**
