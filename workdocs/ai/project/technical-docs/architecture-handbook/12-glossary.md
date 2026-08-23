# 12 — Glossary

Terms and acronyms used across this handbook, alphabetical.

| Term | Definition |
|---|---|
| Adapter | `core` abstract class (`Adapter<CONF,CONN,QUERY,CONTEXT>`) that owns connection/config state and the contract each `for-*` storage package implements. |
| ADR | Architecture Decision Record. (Not used as a formal mechanism in this handbook; decisions are described inline.) |
| as-zod | The `@decaf-ts/as-zod` / `as-zod-model-bridge` packages that project decorated-model validation metadata onto Zod schemas. |
| Blob | Binary large object; the `integrations` blob store abstracts local/S3/Azure/GCP/IPFS/memory backends. |
| Context | Per-operation state holder (`Context<F>`) — flags, transactional lock, contextual logger — distinct from the long-lived `Adapter`. |
| ContextLock | `core`'s depth-aware transactional lock; default no-op (`maxConcurrentTransactions=-1`), `0` disabled, `>0` FIFO semaphore. `TypeORMContextLock` opts out in favour of Postgres `QueryRunner`. |
| CRUD | Create / Read / Update / Delete. |
| Decoration | The flavour-aware builder/registry in `@decaf-ts/decoration` that reads/writes the shared `Metadata` store. |
| Decorator | A TypeScript decorator (class/property/method/param) that attaches metadata read later by a layer. |
| DI | Dependency injection, provided by `injectable-decorators` (`@injectable`/`@singleton`/`@onDemand`/`@inject`). |
| Dispatch | `core`'s observer/notification layer (Proxy-trap based) that fires observers around CRUD operations. |
| Fabric | Hyperledger Fabric; `for-fabric` is the dual-sided (client off-ledger / contract in chaincode) adapter extending `CouchDBAdapter`. |
| Feature flag | A toggle persisted as a model and evaluated by `integrations/feature-flags`, with env-reader + persisted-flag merge and subject-scoped access. |
| Flavour | A string identifying an adapter/metadata variant; models declare `@uses(flavour)` and `Decoration.flavouredAs(flavour)` resolves overrides. |
| FS adapter | `FilesystemAdapter` — restart-safe local persistence on disk (subpath `@decaf-ts/core/fs`). |
| Graph | A node/port/workflow model; *metadata* lives in `ui-decorators`, *execution* in `integrations/graph`, *editor* in `for-angular`. |
| Hooks | `db-decorators` `@on`/`@after` operation hooks; also HTTP webhook hooks in `for-http`/`for-nest`. |
| Injectable | A class registered in the `Injectables` singleton/on-demand container. |
| Keycloak | The identity provider `integrations/keycloak` provisions (realms/clients/users/roles) and that `for-nest`/`integrations/nest` authenticate against. |
| Kibana | Observability UI `integrations/kibana` provisions (data views/dashboards/roles/users/spaces). |
| Loader | `integrations/loader` — dynamic `import()` discovery for models/adapters/repositories/services/controllers/environments/components/graph nodes. |
| MCP | Model Context Protocol; `@decaf-ts/mcp-server` exposes decaf-ts tooling (and Jira/Xray/agent integration) over stdio. |
| Metadata | The central reflection store in `@decaf-ts/decoration`, keyed by constructor symbols and backed by `reflect-metadata`. |
| Migration | A versioned, ordered, flavour-scoped schema change (`@migration`), executed by `MigrationService` with standard or semver versioning. |
| Model | The decorated `Model` base class (`decorator-validation`) — the single source of truth for validation/serialization/hashing/persistence/UI. |
| ModelBuilder | The staged builder (`for→define/extend→apply`) used to construct models at runtime. |
| Namespaces | `integrations/namespaces` — tenant/org-unit/role/permission/resource authorization scaffolding with effective-permission expansion. |
| Paginator | Abstract query pagination (`core`); adapters provide concrete paginators (CouchDB bookmark, TypeORM offset, etc.). |
| Plugin | `integrations/plugins` — dashboard-embed plugins (Kibana/Superset) with a contract + installer. |
| RamAdapter | In-memory adapter shipped with `core`; zero-infrastructure persistence. |
| Repository | The `core` CRUD abstraction over a model+adapter; `db-decorators` defines the abstract `Repository<M,C>`. |
| Sequence | `core`'s `Sequence<A>` over `SequenceModel` for generated/sequential ids; `TypeORMSequence` is Postgres-only. |
| Service | `core` service base (`Service`/`ClientBasedService`/`ModelService`/`PersistenceService`); `@service` registers it for DI. |
| SSE | Server-Sent Events; `for-http`'s `HttpDispatcher`/`ServerEventConnector` and `for-nest`'s `DecafStreamModule` deliver observer events to clients. |
| Statement | The fluent query builder (`select/where/orderBy/.../execute/paginate`); adapters compile it (Mango, SQL, Fabric contract). |
| Task Engine | `core`'s polling engine with leases/retries/backoff/composite steps/locks; `@task` handlers; worker-thread variant for atomic handlers. |
| Transactional | `@transactional` decorator; the `core` variant uses `ContextLock`, the `transactional-decorators` variant uses `SynchronousLock` — not interchangeable. |
| UI decorator | A `ui-decorators` decorator (`@uimodel`/`@renderedBy`/`@uielement`/`@node`/`@graph`/...) attaching rendering/graph metadata. |
| UserRequest | `ui-decorators/user-requests` — a `Service` that opens a modal via a `RenderingFacade` and awaits dismissal; the interaction-kind taxonomy lives in the for-angular/Paperclip layer. |
| Validator | A `decorator-validation` validator (`required`/`min`/`pattern`/...) registered in the `Validation` registry; `@validator` self-registers. |
| Webhook | `for-http`/`for-nest` outbound delivery: subscription + HMAC-SHA256-signed delivery engine (POLLING/SYNCHRONOUS). |
