# Research Brief 06 — HTTP & NestJS Backend Frameworks

> Read-only review of the decaf-ts monorepo (`/workspaces/decaf-ts`). Scope: `for-http` and `for-nest`.
> No tests or builds were run; no source/test files were modified. Every statement is grounded in
> the actual source/tests. `file:line` references are repo-relative. Prepared for the Architecture
> handbook / design specification.

---

### for-http (`@decaf-ts/for-http` v0.19.0)

1. **Identity**
   - Directory: `for-http` (`/workspaces/decaf-ts/for-http`)
   - Package name: `@decaf-ts/for-http` — `for-http/package.json:2`
   - Version: `0.19.0` — `for-http/package.json:3`
   - Description: `"http wrappers for decaf-ts"` — `for-http/package.json:4`
   - Type: ESM; license MIT; engines `node>=20`, `npm>=10` — `for-http/package.json:5,113,91-94`
   - Subpath exports (`.`, `./axios`, `./server`, `./hooks`) — `for-http/package.json:6-51`. There is
     **no** `./event` subpath export even though `src/index.ts:20` re-exports the event module.

2. **Purpose & role**
   `for-http` is the HTTP/REST integration layer of decaf-ts. It provides a client-agnostic
   `HttpAdapter` abstraction over `@decaf-ts/core`'s `Adapter` (mapping REST CRUD + bulk onto decaf
   repositories/services), a concrete `AxiosHttpAdapter`, the `RestService`/`RestRepository` pair,
   a server-side controller/route builder toolset plus auth base handler and request-context, a
   webhook pub/sub engine, and an SSE event bridge (`HttpDispatcher`/`ServerEventConnector`). It
   sits between core and the platform integrations (`for-nest`, `for-angular`, `for-nextjs`,
   `for-react`, `for-react-native`), all of which depend on it.

3. **Dependencies**
   - Runtime decaf modules (`for-http/package.json:124-136`): `@decaf-ts/core`, `db-decorators`,
     `decoration`, `decorator-validation`, `injectable-decorators`, `logging`,
     `transactional-decorators` (all `"latest"`).
   - External runtime: `axios ^1.15.2`, `event-source-plus ^0.1.15` (SSE client), `taffydb`,
     `better-docs` (jsdoc tooling).
   - devDependencies: `@decaf-ts/for-nano`, `@decaf-ts/utils`, `@types/jest`, `fastify ^5.6.1`
     (`for-http/package.json:118-123`). `fastify` is **not** a runtime dependency.
   - Modules that depend on `for-http`: `for-angular`, `for-nest` (dep + devDep), `for-nextjs`,
     `for-react`, `for-react-native`, `integrations`. The primary server-side consumer is `for-nest`.

4. **Architecture & structure**
   `src/` layout (every file):
   - `index.ts` — root barrel; re-exports axios/adapter/constants/HttpPaginator/HttpStatement/
     RestRepository/RestService/types/event; defines build placeholders + library registration.
   - `adapter.ts` — `HttpAdapter` abstract base: CRUD/bulk, URL building, error parsing, SSE-aware
     `observe`/`unObserve`, `@query` decoration.
   - `HttpDispatcher.ts` — `HttpDispatcher extends Dispatch`; opens `ServerEventConnector`, forwards
     SSE events to observers, syncs topic subscriptions via `subscribe`/`unsubscribe` POSTs.
   - `HttpPaginator.ts` — `HttpPaginator extends Paginator` (only `findBy`/`listBy`-derived paging).
   - `HttpStatement.ts` — `HttpStatement extends Statement`; `build()`/`parseCondition()` throw
     `UnsupportedError` (only prepared statements supported).
   - `RestRepository.ts` — statement-based find/page/listBy/findBy/findOneBy + aggregations
     (`countOf/maxOf/minOf/avgOf/sumOf/distinctOf/groupOf`); `allowRawStatements:false`.
   - `RestService.ts` — `extends RestRepository`; adds `ignoreValidation`/`ignoreHandlers` overrides.
   - `constants.ts` — `DecafHeaders` (`x-pending-task`, `x-correlation-id`), `KeepAliveOperation`.
   - `types.ts` — `HttpConfig`, `HttpMethod`, `HttpRequestTransform`, `HttpRequestOptions`,
     `HttpResponse`, `HttpFlags`, `ResponseParser`.
   - `axios/` — `axios.ts` (`AxiosHttpAdapter`), `constants.ts` (`AxiosFlavour`, `TaskResponseParser`),
     `types.ts` (`AxiosFlags`), `index.ts` (sub-barrel; calls `AxiosHttpAdapter.decoration()`).
   - `event/` — `ServerEventConnector.ts` (refcounted `EventSourcePlus` connections, heartbeat),
     `types.ts` (`ServerEventType`, `ServerEvent`, `SingleServerEvent`, `BulkServerEvent`, …),
     `index.ts`.
   - `server/` — barrel `index.ts` (re-exports controllers/transformers/constants/decorators/types/
     logging/auth; imports `./logging/params` for side-effect; **does NOT re-export `./hooks`**).
     - `constants.ts` (`ServerKeys`), `types.ts` (`HttpVerbs`, `ServerApiProperty`, `ServerModelRoute`,
       `ServerParamProps`, `ServerRouteDecOptions`), `decorators.ts` (`route`/`get`/`post`/`put`/
       `patch`/`del`).
     - `logging/params.ts` (registers `ip` log parameter), `logging/index.ts` (empty).
     - `auth/` — `AuthHandler.ts` (abstract base; `extractFromRequest`, `requestFromContext`,
       `isPublicRequest`, `authorize`, role/namespace checks), `constants.ts` (`AUTH_NAMESPACE_KEY`),
       `types.ts` (`AuthRequestLike`, `UserData`, `AuthData`), `index.ts`.
     - `controllers/` — `ControllerBuilder.ts` (`ServerControllerBuilder`), `ModelControllerBuilder.ts`
       (builds CRUD/bulk/statement/listBy/paginate/grouping/complex-query routes by reflecting model +
       persistence metadata; respects `isOperationBlocked`), `ModelControllerFactory.ts`
       (`ModelControllerFactory.create`), `RequestContex.ts` (`RequestContext`, `RequestFlags`,
       `RequestLogger`; IP from `x-forwarded-for`/`x-real-ip`), `RouteBuilder.ts` (`ServerMethodBuilder`),
       `controllers.ts` (`DecafController`, `DecafModelController`; persistence resolution),
       `models.ts` (`RouteParam`, `RouteResponse`, `ServerRoute`), `types.ts`, `index.ts`.
     - `transformers/` — `context.ts` (`RequestToContextTransformer` +
       `requestToContextTransformer(flavour)` decorator), `ram.ts` (`RamTransformer`), `index.ts`.
     - `hooks/` — webhook engine: `constants.ts`, `decorators.ts` (`@hook`), `middleware.ts`
       (`WebhookSignatureMiddleware`, HMAC-SHA256), `observers.ts` (`WebhookObserver`, `eventToTopic`,
       `getWebhookFilter`), `utils.ts` (`matchesTopic`, `signWebhookPayload`, `verifyWebhookSignature`,
       `computeNextAttempt`, `keyToTopic`, `collectPagedResults`), `DeliveryService.ts`
       (`WebhookDeliveryService`; polling + synchronous modes, batch claiming, replay, graceful
       shutdown), `PublisherService.ts` (`WebhookPublisherService`), `SubscriptionService.ts`
       (`WebhookSubscriptionService`), `WebhookWorkerService.ts` (**almost entirely commented out**;
       only `WebhookWorkerConfig` type exported), `types.ts`, `models/`
       (`WebhookSubscription`, `WebhookEventRecord`, `WebhookDelivery`), `overrides/`
       (`Model.hooks(...)` augmentation), `index.ts`.
   - Note: there is **no** `src/overrides/` directory, despite `package.json` `sideEffects`
     referencing `./lib/{esm,cjs}/overrides/*`.

5. **Public API surface** (grouped from barrels)
   - **Client REST** (`.`): `HttpAdapter` (abstract REST adapter base), `RestRepository`
     (statement-based queries/aggregations), `RestService` (default repo; skips validation/handlers),
     `HttpStatement`, `HttpPaginator`, `HttpDispatcher` (SSE `Dispatch` bridge), `HttpConfig`/
     `HttpFlags`/`HttpMethod`/`HttpRequestOptions`/`HttpResponse`/`HttpRequestTransform`/
     `ResponseParser`, `DecafHeaders`/`KeepAliveOperation`, `ServerEventConnector` + event types
     (`ServerEvent`, `SingleServerEvent`, `BulkServerEvent`, `ServerEventType`, `EventHandlers`),
     `VERSION`/`COMMIT`/`FULL_VERSION`/`PACKAGE_NAME`.
   - **Axios adapter** (`./axios`): `AxiosHttpAdapter` (concrete adapter; `getClient` builds
     `new Axios({baseURL})`, `toRequest` overloads, `request`, `parseResponse`, `parseError`),
     `AxiosFlavour = "axios"`, `TaskResponseParser` (parses `x-pending-task` header), `AxiosFlags`.
   - **Server controllers** (`./server`): `ServerControllerBuilder`, `ModelControllerBuilder`,
     `ModelControllerFactory`, `ServerMethodBuilder`, `DecafController`, `DecafModelController`,
     `RequestContext`/`RequestFlags`/`RequestLogger`, `ServerRoute`/`RouteParam`/`RouteResponse`,
     `GroupingQueryFlags`/`BulkStatementFlags`/`AuthConfig`/`ModelControllerFactoryConfig`,
     `route`/`get`/`post`/`put`/`patch`/`del` decorators, `RequestToContextTransformer`/
     `requestToContextTransformer`, `RamTransformer`, `ServerKeys`/`HttpVerbs`/`ServerApiProperty`/
     `ServerModelRoute`/`ServerParamProps`/`ServerRouteDecOptions`, auth: `AuthHandler`/`AuthData`/
     `UserData`/`AuthRequestLike`/`AUTH_NAMESPACE_KEY`.
   - **Server hooks** (`./hooks`): `WebhookDeliveryService`, `WebhookPublisherService`/`PublishDto`,
     `WebhookSubscriptionService`, `WebhookSignatureMiddleware`, `WebhookObserver`/`eventToTopic`/
     `getWebhookFilter`, `hook` decorator, `matchesTopic`/`signWebhookPayload`/
     `verifyWebhookSignature`/`computeNextAttempt`/`keyToTopic`/`collectPagedResults`,
     `WebhookStatus`/`WebhookDeliveryMode`/`HookKey`/`DefaultHookTopics`, `WebhookAction`/
     `WebhookTopic`/`WebhookEnvelope`/`DeliveryServiceConfig`/`WebhookSignatureMiddlewareConfig`,
     models `WebhookSubscription`/`WebhookEventRecord`/`WebhookDelivery`, `WebhookWorkerConfig`
     (type only — the service class is commented out and not exported).

6. **Key patterns & concepts**
   - **Adapter / Repository / Service**: `HttpAdapter extends Adapter<CONF,CON,REQ,Q,C>`
     (`adapter.ts:116`) overrides `repository()` to return `RestService` as default. `RestRepository
     extends Repository<M,A,Q>` and `RestService extends RestRepository` both force prepared
     statements; `RestService` sets `ignoreValidation`/`ignoreHandlers`.
   - **Dispatchers**: `HttpAdapter.Dispatch()` returns `new HttpDispatcher()`, which bridges adapter
     observer events over SSE via `ServerEventConnector`; `observe`/`unObserve` trigger
     `syncSubscriptions()`.
   - **Statements / Paginators**: `HttpStatement.build()`/`parseCondition()` throw `UnsupportedError`
     — only prepared statements are supported. `RestRepository.statement()` builds a `PreparedStatement`
     routed through `adapter.toRequest`.
   - **Contexts / Flags**: `HttpFlags extends AdapterFlags` (optional `headers`). `toHeaders(ctx)`
     maps `correlationId`→`x-correlation-id`. Server-side `RequestContext extends Context` and
     `DecafController` binds a request-IP-enriched logger.
   - **Registries / Decorators**: `Decoration.for(...).define().apply()` powers `@query`
     (`PersistenceKeys.QUERY`), `@route`/`get`/…, `@hook` (topics under `HookKey`), and
     `requestToContextTransformer(flavour)` (transformers registry; `RamTransformer` registered for
     `"ram"`). Core `@service`/`@repository` wire the webhook services.
   - **Observer pattern**: `WebhookObserver implements PersistenceObserver`; delivery has two modes
     (`POLLING`/`SYNCHRONOUS`); `getWebhookFilter` requires the `observeFullResult` context flag.

7. **Lifecycle / configuration / environment**
   - Construction: `AxiosHttpAdapter(config, alias?)` → `super(config, AxiosFlavour, alias)`; base
     constructor defaults `headers` and `events` to `true` when undefined (`adapter.ts:123-131`).
   - Client: `AxiosHttpAdapter.getClient()` returns `new Axios({ baseURL: `${protocol}://${host}` })`
     (`axios/axios.ts:80-84`) — uses the `Axios` class, not the shared default instance.
   - No adapter-level `build()` config method exists; `build()` exists only on builders and
     `HttpStatement.build()` (which throws).
   - `HttpConfig` (`types.ts:19-31`): required `protocol`/`host`; optional `parsers`,
     `eventsListenerPath`, `headers`, `events`, `eventsSubscription`, `eventHeaderResolver`,
     `idInUrl` (default `true`).
   - Flavours: `AxiosFlavour = "axios"`; custom adapters pass their own flavour string.
   - Env vars: **none** — no `process.env` usage anywhere in `src/`.
   - SSE lifecycle: `HttpDispatcher.initialize()`→`startListening()` requires `eventsListenerPath`
     (else throws `InternalError`); `events:false` disables SSE; `eventsSubscription` gates
     subscription mode; `close()` unsubscribes + closes the connector.

8. **Data & control flow**
   - **Client REST request**: `RestService`/`RestRepository` CRUD → `adapter.prepare(model)` →
     `HttpAdapter.create()` builds the write URL (`writeUrl`, honors `idInUrl`, splits composed PKs
     via `extractIdArgs`) → `this.post(url, JSON.stringify(model), {headers:{'Content-Type':
     'application/json'}}, ...args)` (`adapter.ts:579-593`). `post()` resolves context via `logCtx`,
     calls `this.toRequest(...)` then `this.request(req, ctx)`, wraps with `parseResponse` +
     `toHttpResponse`. `AxiosHttpAdapter.request()` merges context headers into the AxiosRequestConfig
     and calls `this.client.request(...)`. `parseResponse()` normalizes the body (`res.body`/
     `res.data`/raw, JSON-string parsing), throws on `status>=400` via `parseError`, and for prepared
     statements hydrates models/pages.
   - **Server controller/hook flow**: `ModelControllerFactory.create(Model, persistence, config)`
     chains `ModelControllerBuilder` route-adders; each route's `implementation` calls
     `resolvePersistenceTarget(...)` then `invokeDirectPersistenceMethod(...)`, using `this.ctx` from
     the platform `DecafModelController`/`RequestContext`. `DecafModelController.persistence(ctx)`
     resolves `ModelService`/`Repository.forModel` and applies ctx overrides. For webhooks: an adapter
     change → `WebhookObserver.refresh` → `WebhookPublisherService.publish` (creates event + delivery
     rows) → `WebhookDeliveryService` (polling/synchronous) claims due deliveries, `processOne` POSTs
     to `targetUrl` with `x-webhook-*` headers signed HMAC-SHA256, updates status. Inbound:
     `WebhookSignatureMiddleware.verify` looks up subscription by URL and verifies the signature
     (constant-time).

9. **Testing**
   - `tests/unit/`: `adapter.test.ts`, `aggregation.test.ts`, `auth-primitives.test.ts`,
     `composed-model.test.ts`, `debug-metadata.test.ts`, `http-dispatcher.start-listening.test.ts`,
     `model-controller-factory.test.ts`, `repository.test.ts`, `rest.test.ts`,
     `server-controller-builder.test.ts`, `server-decorators.test.ts`,
     `server-model-controller-builder.test.ts`, `server-ram-transformer.test.ts`,
     `webhook-signature-middleware.test.ts` (+ model fixtures).
   - `tests/integration/`: `axios.adapter.integration.test.ts`,
     `axios.adapter-prepared.integration.test.ts`, `http-query.test.ts`,
     `http.adapter.integration.test.ts`, `rest.service.integration.test.ts`,
     `rest.service2.integration.test.ts`, `webhook-engine.test.ts`, `webhook-index.test.ts`,
     `webhook-signature-middleware.test.ts` (+ `FastifyAdapter.ts`/`FastifyRepo.ts` helpers using the
     `fastify` devDep).
   - Coverage thresholds are deliberately low (branches 20, functions 30, lines 42, statements 41).
   - Notable gaps: `HttpDispatcher` has only one unit test (start-listening); no tests for
     `syncSubscriptions`, subscription POSTs, `close` cleanup, or event-forwarding errors;
     `ServerEventConnector` has no dedicated test; `WebhookWorkerService` is commented out (untested,
     non-functional); `DecafController`/`DecafModelController.logCtx` overrides have no direct tests;
     all integration tests use mocked clients (no real-server tests).

10. **Usage example** (real, from tests)
    ```ts
    // tests/integration/axios.adapter.integration.test.ts:9-30 (abridged)
    class TestAxiosAdapter extends AxiosHttpAdapter {
      private impl: any;
      constructor(config: HttpConfig, impl: any, alias?: string) {
        super(config, alias);
        this.impl = impl;
      }
      protected override getClient(): any { return this.impl; } // stub the axios client
    }
    const config: HttpConfig = { protocol: "https", host: "example.com" };
    const adapter = new TestAxiosAdapter(
      config,
      { request: async (d: any) => ({ ok: true, d }) },
      `axios-${Math.random()}`
    );
    const ctx = new Context().accumulate({ logger: Logging.get() });
    const res = await adapter.request<any>({ url: "https://example.com" } as any, ctx);
    expect(res.ok).toBe(true);
    ```
    ```ts
    // tests/unit/adapter.test.ts:18-51 (abridged) — AxiosHttpAdapter with a mocked client
    adapter = new AxiosHttpAdapter({ protocol: "http", host: "localhost:8080" });
    requestMock = jest.spyOn(adapter.client as Axios, "request");
    requestMock.mockImplementation(async (details: any) => ({
      status: 200,
      body: { method: details.method, url: details.url, data: details.data },
    }));
    ```

11. **Relationships**
   - `core`: foundational — `HttpAdapter extends Adapter`, `RestRepository extends Repository`,
     `HttpDispatcher extends Dispatch`, `HttpStatement extends Statement`, `HttpPaginator extends
     Paginator`; uses `Context`, `PreparedStatement`, `Observer`/`ObserverFilter`, `ModelService`,
     `Service`, `ClientBasedService`, `Repository.forModel`, `isOperationBlocked`, `Lock`.
   - `db-decorators`: error classes (`NotFoundError`, `ConflictError`, `BadRequestError`,
     `ValidationError`, `InternalError`, …), `OperationKeys`/`BulkCrudOperationKeys`,
     `PrimaryKeyType`, `DBKeys.COMPOSED`, `Contextual`, `wrapMethodWithContext`.
   - `decoration`: `Metadata`, `Decoration.for(...).define().apply()`, `methodMetadata`,
     `Constructor`, `uses` — powers `@query`/`@route`/`@hook`, `Model.hooks` override,
     `requestToContextTransformer`.
   - `decorator-validation`: `Model`, `ModelConstructor`, `ModelArg`, validation decorators,
     `Serialization` (used in `ServerEventConnector`).
   - `injectable-decorators`, `logging` (`Logger`/`Logging`/`logParameterRegistry`/`toKebabCase`),
     `transactional-decorators` (`Lock` for `ServerEventConnector` and `WebhookDeliveryService`).
   - `for-nano` (devDep): used in webhook tests/examples as the persistence adapter.
   - `for-nest`: the primary server-side consumer (uses `AuthHandler`, `ModelControllerFactory`/
     builders, `RequestContext`, `DecafController`, the webhook engine, and the SSE bridge).
   - `for-angular`/`for-nextjs`/`for-react`/`for-react-native`: depend on the client REST stack.

12. **Consumer notes**
   - Defaults: `idInUrl` defaults `true`; `config.headers`/`config.events` default `true`; webhook
     `maxAttempts` default 12; `pollIntervalMs` 5000, `batchSize` 50, `gracefulShutdownMsTimeout`
     30000.
   - `RestService` sets `ignoreValidation:true`/`ignoreHandlers:true` — server-side validation/
     decoration is skipped by default; use `RestRepository` when you need decoration logic.
   - `Sequence()`, `parseCondition()`, `HttpStatement.build()` throw `UnsupportedError` — HTTP
     adapters only support prepared statements natively.
   - SSE requires `eventsListenerPath` (else `startListening` throws); subscription mode requires
     server `subscribe`/`unsubscribe` endpoints.
   - `WebhookDeliveryService.refresh` requires the `observeFullResult` context flag.
   - `WebhookWorkerService` is commented out / non-functional (only a type is exported).
   - `RequestContext`/`DecafController` are abstract; platform integrations must subclass them.
   - Maturity signals: ~22 suites/133 passing tests (green); coverage thresholds intentionally low;
     many `as any` casts and `eslint-disable` markers; `0.19.0` but stale release reports reference
     `v0.3.2`/`0.3.37` (see inaccuracies). All `@decaf-ts/*` deps pinned to `"latest"` (drift risk).

13. **Inaccuracies found**
   1. **[for-http] HttpAdapter generic signature wrong in docs** — README/Description list
      `HttpAdapter<Y, CON, Q, F, C>`. Actual is `<CONF extends HttpConfig, CON, REQ, Q extends
      PreparedStatement, C extends Context<HttpFlags>>` (`adapter.ts:116-122`); docs omit `REQ`,
      mislabel `Q`, and invent a standalone `F`. | Evidence: `README.md:48`; `workdocs/4-Description.md:14`;
      `src/adapter.ts:116-122` | Suggested fix: document generics as `<CONF, CON, REQ, Q, C>`, drop `F`.
   2. **[for-http] RestService/RestRepository generic signature wrong in docs** — README lists
      `RestService<M, Q, A, F, C>` / `RestRepository<M, Q, A, F, C>`. Actual is `<M, A, Q>` only.
      | Evidence: `README.md:55,59`; `src/RestService.ts:54-58`; `src/RestRepository.ts:51-55` |
      Suggested fix: update to `<M, A, Q>`.
   3. **[for-http] "Declares abstract request(), create(), read(), update(), delete()" is false** —
      only `request`/`toRequest` are abstract; CRUD + bulk are implemented in `HttpAdapter`.
      | Evidence: `README.md:52`; `src/adapter.ts:403-417,579-770` | Suggested fix: state only
      `request`/`toRequest` are abstract; CRUD is implemented/overridable.
   4. **[for-http] "parseError() currently returns the error unchanged" is false** — `parseError`
      maps messages to typed errors (404→`NotFoundError`, 409→`ConflictError`, 400→`BadRequestError`,
      422→`ValidationError`, plus `QueryError`/`PagingError`/`UnsupportedError`/`AuthorizationError`/
      `ForbiddenError`/`ConnectionError`/`SerializationError`, fallback `InternalError`).
      | Evidence: `README.md:79`; `src/adapter.ts:853-886` | Suggested fix: describe the actual
      mapping.
   5. **[for-http] HttpFlags base class wrong in docs** — docs say "Extends RepositoryFlags".
      Actual `HttpFlags extends AdapterFlags`. | Evidence: `README.md:47`;
      `src/types.ts:86` | Suggested fix: replace `RepositoryFlags` with `AdapterFlags`.
   6. **[for-http] AuthHandler example uses non-existent method `extractFromAuth`** — the abstract
      method is `extractFromRequest(request: AuthRequestLike)`; the example also omits required
      abstracts `requestFromContext` and `isPublicRequest`, so it would not compile.
      | Evidence: `README.md:289`; `src/server/auth/AuthHandler.ts:45,57,115` | Suggested fix: rename
      to `extractFromRequest`, add the missing abstracts.
   7. **[for-http] README subclassing example passes wrong generics/signatures** — declares `extends
      HttpAdapter<HttpConfig, MyClient, MyRequestConfig, MyFlags, MyContext>` (4th generic is `Q`,
      not flags) and overrides `create(table: string, …)` with `string` tables, but real signatures
      use `Constructor<M>`. | Evidence: `README.md:327`; `src/adapter.ts:116-122,579-701` |
      Suggested fix: use correct generics and `Constructor<M>` table param.
   8. **[for-http] "RestService manages observers" overstates RestService** — `RestService` adds no
      observer logic; those are inherited from core `Repository`/`Adapter` + `HttpDispatcher`.
      | Evidence: `README.md:58`; `src/RestService.ts` | Suggested fix: clarify observers are
      inherited, not implemented by `RestService`.
   9. **[for-http] "Bulk ops delegate to base Adapter (expected to exist)" is misleading** — bulk
      methods are concretely implemented on `HttpAdapter` (`createAll`/`readAll`/`updateAll`/
      `deleteAll`) using `/bulk` segments. | Evidence: `README.md:82`; `src/adapter.ts:595-758` |
      Suggested fix: state bulk ops are implemented on `HttpAdapter`.
   10. **[for-http] `fastify` is a keyword but only a devDependency** — there is no runtime Fastify
       adapter; `fastify` appears only in devDependencies and test helpers. | Evidence:
       `package.json:103,122`; `tests/integration/FastifyAdapter.ts` | Suggested fix: remove
       `"fastify"` from keywords (or add a runtime adapter + dependency).
   11. **[for-http] Duplicated "## Constants and Types (axios)" header** — same heading twice.
       | Evidence: `README.md:842-843` | Suggested fix: remove the duplicate line.
   12. **[for-http] Unreplaced build placeholder in README** — `Minimal size: ##PACKAGE_SIZE## kb
       gzipped`. | Evidence: `README.md:32` | Suggested fix: substitute at build time or remove.
   13. **[for-http] `package.json` `sideEffects` references non-existent `overrides` paths** —
       `./lib/{esm,cjs}/overrides/*` are listed but no `src/overrides/` exists and nothing builds
       there. | Evidence: `package.json:146-149`; no `src/overrides/` dir | Suggested fix: remove the
       four stale `overrides` `sideEffects` entries.
   14. **[for-http] Stale coverage HTML references files that no longer exist in `src/`** —
       `workdocs/reports/coverage/lcov-report/` contains `src/ResponseParser.ts.html`,
       `src/context-utils.ts.html`, `src/server/overrides/Model.ts.html`, etc., none of which exist.
       | Evidence: `workdocs/reports/coverage/lcov-report/` HTML files | Suggested fix: regenerate
       coverage or remove stale HTML.
   15. **[for-http] Stale release reports inconsistent with version 0.19.0** — `RELEASE_NOTES.md`
       "Last tag: v0.3.2", `CHANGELOG.md` "v0.3.2 → next", `DEPENDENCIES.md`
       "@decaf-ts/for-http@0.3.37", all contradict `package.json:3` (`0.19.0`). | Evidence:
       `workdocs/reports/RELEASE_NOTES.md:3`, `workdocs/reports/CHANGELOG.md:3`,
       `workdocs/reports/DEPENDENCIES.md:7` | Suggested fix: regenerate release reports at publish.
   16. **[for-http] `WebhookWorkerService` is dead code but still re-exported** — the file is ~95%
       commented out (only `WebhookWorkerConfig` type exported) yet `src/server/hooks/index.ts:21`
       re-exports it. | Evidence: `src/server/hooks/WebhookWorkerService.ts`; `src/server/hooks/index.ts:21`
       | Suggested fix: finish the worker or remove the file + barrel export.
   17. **[for-http] `HttpStatement` error-message typo** — "This method is only called is prepared
       statements are not used." should be "…if prepared statements are not used." | Evidence:
       `src/HttpStatement.ts:20,31` | Suggested fix: correct the typo.
   18. **[for-http] `url()` query-param encoding claim is wrong** — README says spaces encoded as
       `%20`; implementation uses `URLSearchParams` which encodes spaces as `+`. | Evidence:
       `README.md:78`; `src/adapter.ts:386-398` | Suggested fix: drop the `%20` claim or switch to
       explicit `%20` encoding.
   19. **[for-http] SSE/Dispatcher machinery is undocumented** — `HttpDispatcher`,
       `ServerEventConnector`, `DecafHeaders.CORRELATION_ID`, `eventsListenerPath`/
       `eventsSubscription`/`eventHeaderResolver`, and the `./event` module are not mentioned
       anywhere in README/workdocs. | Evidence: absence in `README.md` vs `src/HttpDispatcher.ts`,
       `src/event/*` | Suggested fix: add an SSE event-bridge section.
   20. **[for-http] `./event` has no subpath export** — `src/index.ts:20` re-exports `./event` but
       `package.json` `exports` defines only `.`, `./axios`, `./server`, `./hooks`. | Evidence:
       `src/index.ts:20`; `package.json:6-51` | Suggested fix: add an `./event` subpath export or
       document that event symbols are reachable only via the root barrel.

---

### for-nest (`@decaf-ts/for-nest` v0.14.1)

1. **Identity**
   - Directory: `for-nest` (`/workspaces/decaf-ts/for-nest`)
   - Package name: `@decaf-ts/for-nest` — `for-nest/package.json:2`
   - Version: `0.14.1` — `for-nest/package.json:3`
   - Description: `"NestJS decaf integration"` — `for-nest/package.json:4`
   - Type: ESM; license MIT; engines `node>=20`, `npm>=10` — `for-nest/package.json:5,120,101-104`
   - Subpath exports (`.`, `./cli`, `./webhooks`); bin `for-nest` → `lib/cjs/bin/cli.cjs` —
     `for-nest/package.json:6-43`.

2. **Purpose & role**
   `for-nest` is the NestJS integration layer of decaf-ts. It adapts decaf's persistence/observer/
   auth stack onto the NestJS runtime: a DecafModel→NestJS controller factory (turning decorated decaf
   `Model`s into fully wired `@Controller` classes with CRUD/bulk/statement/aggregation/query routes
   and Swagger metadata), module wiring (`DecafModule`/`DecafCoreModule`), auth guards/interceptors,
   a request-context pipeline, an SSE events module, a webhooks module, OpenAPI/Swagger tooling, an
   exception filter, a fluent bootstrap helper, and a CLI (`boot`/`migrate`/`export-api`). It sits on
   top of `core`/`db-decorators`/`decorator-validation`/`decoration`/`injectable-decorators`/
   `logging`/`transactional-decorators` and especially `for-http`, whose server abstractions it
   binds to Nest.

3. **Dependencies**
   - Runtime decaf modules (`for-nest/package.json:148-161`): `core`, `db-decorators`, `decoration`,
     `decorator-validation`, `for-http`, `injectable-decorators`, `logging`,
     `transactional-decorators` (all `"latest"`).
   - External runtime: `@nestjs/common ^11.1.14`, `better-docs`, `taffydb`, `yaml ^2.8.3`.
   - devDependencies (`for-nest/package.json:125-147`): `@decaf-ts/cli`, `for-fabric`, `for-http`
     (also runtime), `for-nano`, `for-typeorm`, `utils`; `@nestjs/cli`/`platform-express`/`schematics`/
     `swagger ^11.2.6`/`testing`; `commander`, `eventsource`, `supertest`, `typed-array-buffer`,
     `typescript`, `@rollup/plugin-replace`.
   - `overrides` pin `jsrsasign`, `ajv`, `multer`, `test-exclude`, `js-yaml`, `brace-expansion`.
   - Monorepo consumers of `for-nest`: only `integrations` (`integrations/package.json:382,399,406`,
     which adds a `nest` subpackage with `namespace` decorator, `keycloakAuthHandler`,
     `keycloakModule`).

4. **Architecture & structure**
   `src/` layout (every file):
   - `index.ts` — main barrel; side-effect-imports `./decoration`; aggregates all sub-barrels;
     registers the library (`Metadata.allowReregistration` toggle); exports build placeholders. **Note
     `// export * from "./webhooks";` is commented out (`index.ts:41`)** — webhooks are subpath-only.
   - `constants.ts` — DI tokens (`DECAF_MODULE_OPTIONS`, `DECAF_ADAPTER_ID`, `DECAF_TASK_SERVICE_ID`,
     `DECAF_HANDLERS`, `DECAF_EXPOSE`, `DECAF_CONTROLLER_CONFIG`, `DECAF_ROUTE`, `DECAF_CONTEXT_KEY`)
     + `DecafServerFlags`/`DecafServerCtx`.
   - `types.ts` — `DecafRequestHandler`, `ObserverEventsOptions` (incl. `subscriptionMode`),
     `DecafModuleOptions`, `AuthHandler` alias.
   - `controllers.ts` — abstract `DecafController` and `DecafModelController<M>` (persistence
     resolution).
   - `module.ts` — `DecafModule` (static `forRootAsync`); empty `runMigrations()` stub.
   - `core-module.ts` — `@Global()` `DecafCoreModule`; `forRoot`, `bootPersistence`
     (`PersistenceService` + transformer registration), `APP_INTERCEPTOR` registration,
     `OnApplicationShutdown`.
   - `cli-module.ts` — Commander `nest` CLI (`boot`/`migrate`/`export-api`) + helpers
     (`resolveInputPath`, `buildOutputFilePath`, `resolveMigrateCommandConfig`,
     `buildFileVersionHandlers`).
   - `decorators.ts` — `@Service(key?)`/`@Repository(model, flavour?)` parameter decorators +
     `getRegisteredDecafProviders()` (wires decaf services/repos into Nest DI).
   - `decoration.ts` — side-effect module: `Decoration.for(...).extend(...)` for Injectables/Inject +
     validation keys → `ApiProperty`; `PersistenceKeys.AUTH` → `Auth`.
   - `swagger-types.ts` — local Swagger type interfaces.
   - `utils.ts` — `repoForModel(modelName)`.
   - `decaf-model/` — `index.ts` (sub-barrel), `DecafModelModule.ts` (`getModuleFor(flavour)` →
     per-flavour `@Module` with `forRoot` generating controllers), `FromModelController.ts` (core
     builder: `create(model,…)` produces a Nest `@Controller` with CRUD/bulk/statement/aggregation/
     query routes + Swagger; `matchRoute` routing table; complex-query handlers), `types.ts`,
     `utils.ts`, `decorators/` (`ApiOperationFromModel`/`BulkApiOperationFromModel`,
     `ApiParamsFromModel`, `DecafBody`, `DecafParams`/`DecafQuery`/`OrderedParams`,
     `controllerConfig`, `expose`, `Auth`, `utils`, `types`).
   - `auth/` — `AuthInterceptor.ts` (request-scoped; `authorize` + `applyTransformers`),
     `AuthMiddleware.ts` (request-scoped; contextualize + `prime`), `DecafAuthHandler.ts`
     (`DecafAuthHandler` Bearer-as-role + `DecafRoleAuthHandler` alias), `DecafAuthModule.ts`
     (`forRoot`; registers interceptor/middleware; global `APP_INTERCEPTOR` when `global`),
     `decorators.ts` (`Auth`/`Public`/`RequireRoles`/`RequireNamespaces`), `constants.ts`,
     `index.ts`.
   - `request/` — `DecafRequestContext.ts` (request-scoped, extends for-http `RequestContext`),
     `DecafHandlerExecutor.ts` (runs `DecafRequestHandler[]`), `DecafResponseInterceptor.ts`,
     `contextualize.ts` (`contextualizeRequestContext`; `extractIp`),
     `DecafAuthHandler.ts` (re-export shim), `index.ts`.
   - `interceptors/` — `DecafRequestHandlerInterceptor.ts` (global contextualize+exec interceptor),
     `index.ts` (re-exports it + `AuthInterceptor`).
   - `overrides/` — `overrides.ts` (monkey-patches `Adapter.transformerFor`/
     `flavoursToTransform` and `Context.prototype.toResponse`), `Adapter.ts` (module augmentation),
     `ModelBuilderExtensions.ts` (`ModelBuilder.Auth(model)` + class-decorator-aware `build()`),
     `decoration.ts`/`constants.ts`/`helpers.ts` (Swagger metadata writers), `logging.ts`
     (side-effect: `import "@decaf-ts/for-http/server"`), `index.ts`.
   - `events-module/` — `DecafStreamModule.ts` (`forFlavours(flavours, path, options)`),
     `EventsController.ts` (`@Sse() listen()` + `@Sse("/:model") listenForModel(model)`; observer
     registration, heartbeat, fingerprint claim/release, subscription filtering),
     `EventsSubscriptionController.ts` (`POST subscribe`/`unsubscribe`), `ObserverSubscriptionRegistry.ts`
     (in-memory topic/connection registry), `constant.ts` (`LISTENING_ADAPTERS_FLAVOURS`,
     `OBSERVER_EVENTS_OPTIONS`), `utils.ts` (`resolveRequesterFingerprint`, `eventTopicFor`, …),
     `index.ts`.
   - `webhooks/` — `DecafWebhookModule.ts` (`forRoot`/`forRootAsync`; boots own persistence;
     generates `FromModelController` CRUD for the three webhook models + action controllers; alias
     `DecafWebhooksModule`; empty `runWebhooksMigrations` stub), `controllers.ts`
     (`WebhookSubscriptionActionsController` deactivate/reactivate, `WebhookEventActionsController`
     replay), `types.ts` (`DecafWebhookModuleOptions`), `index.ts`.
   - `factory/` — `NestBootstraper.ts` (fluent static bootstrapper), `errors/cors.ts` (`CorsError`),
     `errors/throttling.ts` (`ToManyRequestsError` — **not re-exported** via `errors/index.ts`),
     `exceptions/DecafErrorFilter.ts` (`DecafExceptionFilter` maps `HttpException`→`BaseError`),
     `exceptions/decorators.ts` (`UseDecafFilter`/`UseDecafHeaders`), `openapi/SwaggerBuilder.ts`,
     `openapi/DtoBuilder.ts` (`DtoFor(op, model)`), `openapi/SwaggerCustomUI.ts`,
     `openapi/constants.ts`, barrels.
   - `bin/cli.ts` — entry: imports the default `nest()` and `parseAsync(process.argv)`.

5. **Public API surface** (grouped from barrels; webhooks subpath-only)
   - **DecafModel controllers/factory**: `FromModelController`, `getModuleFor(flavour)`, `expose`,
     `controllerConfig`, `Auth`, `ApiOperationFromModel`/`BulkApiOperationFromModel`,
     `ApiParamsFromModel`, `DecafBody`, `DecafParams`/`DecafQuery`/`OrderedParams`,
     `DecafParamProps`, route/decorator helpers (`applyApiDecorators`, `createRouteHandler`,
     `defineRouteMethod`, `getApiDecorators`, `resolvePersistenceMethod`).
   - **Auth**: `DecafAuthHandler`/`DecafRoleAuthHandler`, `AuthInterceptor`, `AuthMiddleware`,
     `DecafAuthModule`, decorators `Auth`/`Public`/`RequireRoles`/`RequireNamespaces`, tokens
     (`AUTH_HANDLER`, `AUTH_META_KEY`, `IS_PUBLIC_KEY`, `REQUIRED_ROLES_KEY`,
     `REQUIRED_NAMESPACES_KEY`, `SKIP_MODEL_ROLES_KEY`, `SKIP_MODEL_NAMESPACES_KEY`), re-exported
     for-http types (`AuthHandler as AuthHandlerBase`, `AuthData`, `UserData`, `AuthRequestLike`).
   - **Events/SSE**: `DecafStreamModule`, `EventsController`, `EventsSubscriptionController`,
     `ObserverSubscriptionRegistry`, tokens `LISTENING_ADAPTERS_FLAVOURS`/`OBSERVER_EVENTS_OPTIONS`.
   - **Webhooks** (`./webhooks` subpath only): `DecafWebhookModule` (+ alias `DecafWebhooksModule`),
     `WebhookSubscriptionActionsController`, `WebhookEventActionsController`,
     `DecafWebhookModuleOptions`.
   - **Interceptors/request pipeline**: `DecafRequestHandlerInterceptor`, `AuthInterceptor`,
     `DecafRequestContext`, `DecafHandlerExecutor`, `DecafResponseInterceptor`,
     `contextualizeRequestContext`.
   - **Decorators (DI bridge)**: `Service`, `Repository`, `getRegisteredDecafProviders`.
   - **Core/module**: `DecafModule.forRootAsync`, `DecafCoreModule`, `runMigrations` (empty stub),
     `DecafModuleOptions`/`ObserverEventsOptions`/`DecafRequestHandler`, `DecafController`/
     `DecafModelController`, DI tokens.
   - **Factory/bootstrap/OpenAPI/exceptions**: `NestBootstraper` + `SwaggerSetupOptions`,
     `SwaggerBuilder`, `DtoFor`, `SwaggerCustomUI`, `SwaggerOptions`/`SWAGGER_UI_CONSTANTS`,
     `DecafExceptionFilter`, `UseDecafFilter`/`UseDecafHeaders`, `CorsError`.
   - **CLI** (`./cli` subpath): default `nest()` program + `migrateCommand`/`bootCommand` + helpers.
   - **Overrides**: `Adapter` augmentation, `DECORATORS`/`DECORATORS_PREFIX`, `ApiProperty`/
     `createApiPropertyDecorator`/`createPropertyDecorator`/`getEnumValues`, `ModelBuilder` extensions
     (side-effect).
   - **Swagger types**: `SecuritySchemeObject`, `SchemaObject`, `ReferenceObject`, `EnumAllowedTypes`,
     `EnumSchemaAttributes`, `SchemaObjectMetadata`, `SwaggerEnumType`. **`ToManyRequestsError` is
     not re-exported** through `factory/errors/index.ts` (only `cors` is).

6. **Key patterns & concepts**
   - **DecafModel controller factory**: `DecafModelModule.forRoot(flavour, options)` filters
     `Adapter.models(flavour)` by exposure (`isExposed`, honoring `controllerExposure` overrides or
     `@expose`), warms `ModelService.forModel`, optionally creates `${ModelName}Service` providers,
     then maps each model through `FromModelController.create(model, controllerConfig,
     globalDefaults)`. `create` resolves persistence (`getPersistence`: `Service.get` →
     `ModelService.getService` → `Repository.forModel`), merges config (module defaults ⊕
     `@controllerConfig` ⊕ per-model), delegates CRUD route generation to `ModelControllerFactory`
     (from `for-http/server`), then attaches Nest verb decorators + Swagger + param decorators via
     `matchRoute`. Class-level auth is applied via `applyClassAuth`. Complex `@query`/`@route`
     methods become routes via `createQueryRoutesFromRepository`/`createComplexQueryHandler`. The
     result extends `DecafModelController<T>` whose `persistence(ctx?)` lazily resolves and applies
     ctx overrides.
   - **Auth guards/interceptors**: `AuthInterceptor` is request-scoped; reads reflector metadata,
     calls `authHandler.authorize(...)`, then `applyTransformers()` (iterating
     `Adapter.flavoursToTransform()` accumulating `transformer.from(requestContext)`).
     `AuthMiddleware` contextualizes the request context and best-effort `authHandler.prime`.
     `DecafAuthModule.forRoot` registers the interceptor/middleware and (when `global`) a global
     `APP_INTERCEPTOR`.
   - **NestJS module wiring**: `DecafModule.forRootAsync` first `await DecafCoreModule.bootPersistence`
     (creates `PersistenceService`, boots adapters, registers `RequestToContextTransformer`s, runs
     `options.initialization()`), then builds imports — optionally per-flavour `DecafModelModule`s
     (when `autoControllers`) and `DecafStreamModule` (when `observerOptions.enableObserverEvents`).
     `DecafCoreModule` is `@Global()`, provides the request-context pipeline, registers the global
     `DecafRequestHandlerInterceptor`, drains `getRegisteredDecafProviders()`, and implements
     `OnApplicationShutdown`.
   - **Request-context pipeline**: `DecafRequestContext` is request-scoped (`@Inject(REQUEST)`).
     `contextualizeRequestContext` accumulates `DefaultAdapterFlags`, `headers`, `logger` (IP-scoped),
     `timestamp`, `operation`, guarded by `__decafRequestContextContextualized` (runs once).
     `DecafRequestHandlerInterceptor` contextualizes then `executor.exec` runs the handler chain.
   - **SSE events module**: `DecafStreamModule.forFlavours` registers `EventsController` (+ subscription
     controller in subscription mode) under a `RouterModule` prefix. `EventsController.listen()`
     resolves a requester fingerprint (`resolveRequesterFingerprint`), claims a single connection per
     fingerprint via the registry (else `ConflictError`), registers an `Observer` per adapter (with a
     topic `ObserverFilter` in subscription mode), merges a 15s heartbeat, and tears down
     `unObserve`+`releaseConnection`.
   - **Webhooks**: `DecafWebhookModule` boots its own `PersistenceService` (separate from
     `DecafModule`), mutates `Adapter._cache` with webhook keys, registers transformers, and builds
     controllers for the three webhook models plus action controllers, mounted under `webhookApiPath`.
   - **Decorators/DI bridge**: `@Service`/`@Repository` register Nest factory providers under
     `${ModelName}Service`/`${ModelName}Repository` then apply `@Inject(token)`.
     `decoration.ts` makes decaf validation decorators also emit Swagger metadata via local
     `ApiProperty`. `overrides/overrides.ts` monkey-patches `Adapter`/`Context`.

7. **Lifecycle / configuration / environment**
   - Bootstrap: `DecafModule.forRootAsync(options)` (returns `Promise<DynamicModule>`) →
     `DecafCoreModule.bootPersistence` (PersistenceService + transformers + `initialization()`) →
     `DecafCoreModule.forRoot` (global interceptor + providers) → per-flavour controller modules →
     shutdown via `OnApplicationShutdown` (adapter + `Service.shutdown()`).
   - `forRoot`/`forRootAsync` patterns: `DecafModule.forRootAsync`, `DecafCoreModule.forRoot`/
     `bootPersistence`, `DecafAuthModule.forRoot`, `DecafStreamModule.forFlavours`,
     `DecafWebhookModule.forRoot`/`forRootAsync`, `getModuleFor(flavour).forRoot(...)`.
   - Flavours drive controller generation (`Adapter.models(flavour)`), SSE listeners
     (`LISTENING_ADAPTERS_FLAVOURS`), transformer registration, and `controllerExposure` arrays.
   - Env/`process.env`: `NestBootstraper.start` reads `process.env.PORT` (default 3000);
     `DecafExceptionFilter` reads `LoggedEnvironment.env === "production"` (via decaf logging env);
     CLI migrate reads `package.json` `decaf.migration` config; `test:manual` uses
     `MANUAL_INSPECT`/`MANUAL_INSPECT_TIMEOUT`. No other `process.env` reads in `src/`.
   - OpenAPI: `NestBootstraper.setupSwagger` → `SwaggerBuilder` → `SwaggerModule.setup` + optional
     JSON/YAML raw routes. CLI `export-api` boots a headless Nest context and writes OpenAPI JSON.
   - CLI: `nest` program (`boot`/`migrate`/`export-api`) published as bin `for-nest` and `./cli`
     subpath.

8. **Data & control flow**
   - Request → controller → repository → adapter → persistence (auto-generated controller):
     1. HTTP request hits a `FromModelController.create`-generated `@Controller(routePath)` (path is
        `toKebabCase(tableName)`).
     2. `AuthMiddleware.use` first contextualizes the request context and `authHandler.prime`; then
        `AuthInterceptor` (skips on `@Public()`) calls `authHandler.authorize(...)` and
        `applyTransformers()`.
     3. `DecafRequestHandlerInterceptor` `contextualize(req)` then `executor.exec(req, res)` runs the
        `DecafRequestHandler[]`.
     4. The route handler (bound by `matchRoute`) executes — `ModelControllerFactory`-supplied
        `route.implementation` for standard CRUD, or `createComplexQueryHandler` for `@query` methods
        (dispatching to `persistence.repo[methodName]`/`persistence[methodName]`/`persistence.query`/
        `persistence.statement`). Param decorators supply body (`DecafBody` instantiates
        `new ModelConstr(body)`), ordered path params (`DecafParams`/`OrderedParams`), and parsed
        query (`DecafQuery`).
     5. `DecafModelController.persistence(ctx?)` resolves the backing `ModelService`/`Repository`
        (cached; fallback `Service.get` → `ModelService.getService` → `Repository.forModel`) and
        applies `ctx.toOverrides()`.
     6. The repository/ModelService delegates to the underlying `Adapter` (Ram/Nano/TypeORM/Fabric)
        which performs persistence.
     7. `DecafResponseInterceptor` taps the response and calls `ctx.toResponse(response)`
        (monkey-patched `Context.prototype.toResponse` adds `x-pending-task` when pending). On error,
        `DecafExceptionFilter` maps/logs.

9. **Testing**
   - `tests/unit/`: `DecafExceptionFilter.test.ts`, `DtoFor.test.ts`, `DtoFor.swagger.test.ts`,
     `auth-module.test.ts`, `cli-boot.command.test.ts`, `cli-exported-swagger.test.ts`,
     `cli-migrate.command.test.ts`, `cli-module.test.ts`, `controller-find-page.test.ts`,
     `controller-persistence-binding.test.ts`, `model-builder.extensions.test.ts`,
     `model-controller-builder-parity.test.ts`, `observer-subscription-registry.test.ts`,
     `request-contextualize.test.ts`, `webhooks-module.test.ts` (+ model fixtures).
   - `tests/integration/`: multi-adapter/task/migration tests
     (`cli-migrate.multi-adapter.integration.test.ts`, `decaf-model-exposure.integration.test.ts`,
     `migration.*.integration.test.ts`, `service-repository-decorators.integration.test.ts`,
     `task-events.integration.test.ts`, `task-model-observables.integration.test.ts`,
     `webhooks-module.integration.test.ts`) + `helpers/`/`fixtures/`.
   - `tests/e2e/`: supertest/eventsource end-to-end (`AuthExecutionOrder`, `AuthHandler`,
     `DecafExceptionFilter-logging`, `DecafModelModule(-byAdapter)/(-openApi)`,
     `DecafRequestHandlerInterceptor`, `NestBootstraper`, `request-logger-propagation`,
     `sse-concurrency-regression`, `swagger`, `task-events`, `events-subscriptions`,
     `listen-server-events`, `listen-service-events(-multi-adapter)`), plus the headline
     `decaf-model-controller-builder.e2e.test.ts` (2189 lines; gated by `MANUAL_INSPECT` for manual
     Swagger inspection) and `fakes/` fixtures.
   - `test:manual` runs the controller-builder e2e with `MANUAL_INSPECT=true`.
   - Notable gaps: e2e file name references `DecafModelControllerBuilder` (no such class — builder is
     `FromModelController`); no dedicated unit tests for `SwaggerBuilder`/`SwaggerCustomUI`/
     `NestBootstraper`/`DecafResponseInterceptor`/`WebhookEventActionsController.replay`; stale
     coverage HTML references files no longer in `src/`.

10. **Usage example** (real, from tests)
    ```ts
    // tests/app.ts:18-32 (abridged) — minimal bootstrap (auto controllers + Swagger)
    const app = await NestFactory.create(
      DecafModule.forRootAsync({
        conf: [[RamAdapter, {}, new RamTransformer()]],
        autoControllers: true,
        autoServices: false,
      })
    );
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, documentFactory);
    app.useGlobalFilters(new DecafExceptionFilter(app.get(ModuleRef, { strict: false })));
    await app.init();
    ```
    ```ts
    // tests/e2e/NestBootstraper.e2e.test.ts:27-41 (abridged) — fluent bootstrap
    const nest = await NestBootstraper.initialize(app)
      .enableLogger().enableCors("*").useHelmet()
      .setupSwagger({ title: "Test API", description: "Test Swagger setup", version: "1.0.0",
                      path: "api", openApiJsonPath: "api-json", openApiYamlPath: "/api-yaml" })
      .useGlobalFilters();
    nest.start(3000, "0.0.0.0");
    ```
    ```ts
    // tests/e2e/decaf-model-controller-builder.e2e.test.ts:178-222 (abridged) — exposed model
    @uses(RamFlavour) @table("cfg_order") @model() @expose("ram")
    @controllerConfig({
      allowBulkStatement: { create: true, read: true, update: false, delete: false },
      allowGroupingQueries: { count: true, sum: true, avg: true, max: false, min: false, distinct: false, group: false },
    })
    class ConfigOrder extends Model {
      @pk({ type: String, generated: false }) @composed(["orderCode", "customerId"], ":", true) id!: string;
      @defaultQueryAttr() @column() @required() orderCode!: string;
      @defaultQueryAttr() @column() @required() customerId!: string;
      @defaultQueryAttr() @column() @required() amount!: number;
      @manyToOne(() => ConfigCustomer, { update: Cascade.CASCADE, delete: Cascade.CASCADE }, false) customer?: string | ConfigCustomer;
      constructor(arg?: ModelArg<ConfigOrder>) { super(arg); }
    }
    ```

11. **Relationships**
   - `core`: `Adapter`, `PersistenceService`, `ModelService`, `Repository`, `Service`, `Context`,
     `UUID`, `Observer`/`ObserverFilter`, `PersistenceKeys`/`PreparedStatementKeys`,
     `DefaultAdapterFlags`, `TaskModel`, `isOperationBlocked`, migrations
     (`SemverMigrationVersioning`, `MigrationService`), `RamAdapter` (in tests).
   - `db-decorators`: error classes, `OperationKeys`/`BulkCrudOperationKeys`, `DBKeys`,
     `BlockOperations` (error mapping, DTO building, operation-blocking).
   - `for-http` (closest sibling): `DecafController` (HTTP base), `RequestContext`,
     `AuthHandler`/`AuthData`/`UserData`/`AuthRequestLike`, `RequestToContextTransformer`/
     `requestToContextTransformer`, `ModelControllerFactory`/`ModelControllerFactoryConfig`/
     `AuthConfig`/`ServerRoute`/`ServerApiProperty`/`ServerParamProps`/`HttpVerbs`, `RamTransformer`,
     `matchesTopic`, webhook models `WebhookSubscription`/`WebhookEventRecord`/`WebhookDelivery`/
     `WebhookStatus`/`collectPagedResults`. for-nest is essentially the Nest-binding of for-http's
     server abstractions.
   - `decoration` (`Metadata`, `Decoration.for(...).extend(...).apply()`), `decorator-validation`
     (`Model`, `ModelBuilder` extended in `ModelBuilderExtensions`), `injectable-decorators`
     (mapped onto Nest `@Injectable`/`@Inject`), `logging` (context-bound loggers),
     `transactional-decorators` (transactional wiring via core).
   - NestJS: `@nestjs/common`/`core`/`swagger` — modules, DI, interceptors/middleware/filters,
     `RouterModule`, `NestFactory`, route/param decorators, `Sse`/`MessageEvent`,
     `DocumentBuilder`/`SwaggerModule`/`Api*`. External: `commander` (CLI), `yaml` (OpenAPI YAML),
     `lodash` (overrides helpers), `helmet` (optional, dynamically required).
   - Consumer: `integrations` (`integrations/src/nest/`) adds `namespace`, `keycloakAuthHandler`,
     `keycloakModule`.

12. **Consumer notes**
   - **Webhooks are not in the main barrel.** `src/index.ts:41` has `// export * from "./webhooks";`
     commented out — import from `@decaf-ts/for-nest/webhooks`. (The README's webhook example imports
     from `@decaf-ts/for-nest` — see inaccuracies.)
   - `DecafModule.forRootAsync` returns `Promise<DynamicModule>`; Nest tolerates a `Promise` in
     `imports`, but be aware the call is async.
   - `DecafWebhookModule` boots its own persistence (separate from `DecafModule`) and mutates
     `Adapter._cache` with webhook keys — do not share adapter aliases blindly.
   - `DecafAuthModule` does not re-register the request-handler interceptor (`DecafCoreModule` does
     that globally); it only adds `AuthInterceptor` as a global `APP_INTERCEPTOR` when `global:true`.
   - Auth default: when `AuthConfig` is omitted on a model, `@Auth(Model)` is applied by default
     (auth + model-level role checks required).
   - Defaults: `autoServices` false; `aggregations` behaviourally true (only `false` disables);
     `observerApiPath` `/events`; `webhookApiPath` `/webhooks`; `NestBootstraper.start` port
     `process.env.PORT || 3000`.
   - `ToManyRequestsError` is not re-exported through `factory/errors` (only `cors`); it is internal
     to `DecafErrorFilter`.
   - Empty stubs: `runMigrations()` and `runWebhooksMigrations()` are no-ops exported in the public
     surface — likely placeholders.
   - `sideEffects`: `decoration.js`, `overrides/index.js`, `overrides/overrides.js` are marked
     side-effectful (they install `Decoration.for(...).extend` and `Adapter`/`Context` patches) —
     tree-shakers must not drop them.
   - Maturity signals: 0.14.x (pre-1.0); broad e2e/integration coverage; CI badges; release notes
     dated 2025-11-26; migration/task CLI present but `DecafCoreModule.migrate` documented in README
     does not exist in code (see inaccuracies).

13. **Inaccuracies found**
   1. **[for-nest] README "Description" section is generic template boilerplate** — `## Typescript
      Template` / "This repository is meant to provide an enterprise template…", contradicting
      `package.json:4` "NestJS decaf integration". | Evidence: `README.md:2,4-5`;
      `workdocs/4-Description.md:3-5` | Suggested fix: replace with the actual module purpose.
   2. **[for-nest] `DecafWebhookModule` documented as importable from the main barrel, but webhooks
      are commented out of `src/index.ts`** — README example `import { DecafWebhookModule } from
      "@decaf-ts/for-nest";`, but `src/index.ts:41` is `// export * from "./webhooks";` (the
      `./webhooks` subpath exists). | Evidence: `README.md:330`; `src/index.ts:41`;
      `package.json:29-39` | Suggested fix: change the import to `@decaf-ts/for-nest/webhooks`.
   3. **[for-nest] `DecafCoreModule.migrate` is documented but does not exist in source** — README
      documents `DecafCoreModule.migrate(...)` in multiple places; `src/core-module.ts` defines only
      `forRoot`/`bootPersistence`/`onApplicationShutdown`. Migration actually lives in the CLI
      (`cli-module.ts` `migrateCommand` calling `MigrationService.migrateAdapters`). | Evidence:
      `README.md:357,360,392,407`; `src/core-module.ts:55,90,143` | Suggested fix: replace with the
      CLI `migrate` command / `MigrationService.migrateAdapters`, or implement the static.
   4. **[for-nest] README claims the CLI migrate "creates a `RamAdapter` task engine
      (`decaf-cli-task-engine`)"** — `cli-module.ts` only does `Service.get(TaskModel)` and throws if
      none is registered; it creates no `RamAdapter`/`decaf-cli-task-engine`. | Evidence:
      `README.md:405`; `src/cli-module.ts:293-304` | Suggested fix: correct to state the CLI resolves
      an already-registered `TaskService` via `Service.get(TaskModel)`.
   5. **[for-nest] README Auth Handler method `extractFromAuth(ctx: EC)` does not match the actual
      abstract method `extractFromRequest(request)`** — the for-http base defines `extractFromRequest`
      plus `requestFromContext(ctx)`; for-nest's `DecafAuthHandler` overrides those, not
      `extractFromAuth`. | Evidence: `README.md:255,266-271`;
      `for-http/src/server/auth/AuthHandler.ts:45,57`; `src/auth/DecafAuthHandler.ts:23-36` |
      Suggested fix: rename to `extractFromRequest(request)` and show `requestFromContext(ctx)`.
   6. **[for-nest] README attributes logger enrichment to `AuthInterceptor`, but it does no logger
      enrichment** — `AuthInterceptor` only calls `authHandler.authorize(...)` and
      `applyTransformers()`; logger binding occurs inside the for-http base `AuthHandler.authorize`.
      | Evidence: `README.md:314-315`; `src/auth/AuthInterceptor.ts:38-98` | Suggested fix: move the
      logger-enrichment note to the auth-handler flow.
   7. **[for-nest] README `ObserverEventsOptions` table omits `subscriptionMode`** — table lists only
      `enableObserverEvents`/`observerFlavours`/`observerApiPath`; `subscriptionMode?: boolean`
      exists and gates the subscription controller + per-subscriber filtering. | Evidence:
      `README.md:138-142`; `src/types.ts:26-28`; `src/events-module/DecafStreamModule.ts:52-54` |
      Suggested fix: add a `subscriptionMode` row.
   8. **[for-nest] README "Minimal size" placeholder is unreplaced** — `Minimal size: ##PACKAGE_SIZE##
      kb gzipped`. | Evidence: `README.md:31` | Suggested fix: substitute at build time or remove.
   9. **[for-nest] Stale coverage report references files that no longer exist in `src/`** — lcov
      HTML references `src/decaf-model/DecafModelControllerBuilder.ts`, `src/decaf-model/decorators/
      route.ts`, `src/decaf-model/query-routes.ts`, `src/events-module/events.controller.ts`,
      `src/hooks/*`, `src/migrations/*`, `src/ram/RamRequestTransformer.ts`, `src/nest-decorators.ts`,
      `src/nest-service.ts`, `src/overrides/Model.ts`, `src/request/RamRequestTransformer.ts`, etc.
      — none of which exist. | Evidence: `workdocs/reports/coverage/lcov-report/` HTML | Suggested
      fix: regenerate coverage to match the current source layout; delete stale HTML.
   10. **[for-nest] E2E test file name references a class that no longer exists** — file is
       `decaf-model-controller-builder.e2e.test.ts` but the builder class is `FromModelController`
       (no `DecafModelControllerBuilder` symbol exists). | Evidence:
       `tests/e2e/decaf-model-controller-builder.e2e.test.ts` (filename); `src/decaf-model/FromModelController.ts:73`
       | Suggested fix: rename the test file (and update `package.json:69` `test:manual` path).
   11. **[for-nest] `ToManyRequestsError` is not re-exported through `factory/errors`** —
       `src/factory/errors/index.ts` only re-exports `./cors`; `throttling.ts` defines
       `ToManyRequestsError` used internally by `DecafErrorFilter`. | Evidence:
       `src/factory/errors/index.ts:1`; `src/factory/errors/throttling.ts:3`;
       `src/factory/exceptions/DecafErrorFilter.ts:26` | Suggested fix: add
       `export * from "./throttling";` or document it as internal.
   12. **[for-nest] README CLI invocation `npx decaf nest migrate` does not match this package's
       published bin** — this package's bin is `for-nest` (`package.json:42`) running the `nest`
       program; `decaf` is a separate package (`@decaf-ts/cli`). The `extract:api` script uses
       `node ./lib/bin/cli.cjs export-api`. | Evidence: `README.md:373,389,407`;
       `package.json:42,63` | Suggested fix: document `npx for-nest migrate …` /
       `for-nest export-api …`; clarify the relationship to the `decaf` CLI only if it proxies it.
   13. **[for-nest] `runMigrations` / `runWebhooksMigrations` are exported empty stubs** — both are
       no-op functions yet appear in the public surface. | Evidence: `src/module.ts:61`;
       `src/webhooks/DecafWebhookModule.ts:149` | Suggested fix: implement (delegating to
       `MigrationService`) or remove to avoid misleading consumers.
   14. **[for-nest] README "Auth Interceptor Flow" diagram omits `AuthMiddleware`** — README shows
       `Request → AuthInterceptor → DecafRequestHandlerInterceptor → Controller`, but `AuthMiddleware`
       runs first (bound to all routes). | Evidence: `README.md:306`;
       `src/auth/DecafAuthModule.ts:47-49`; `src/auth/AuthMiddleware.ts:22-32` | Suggested fix: update
       to `Request → AuthMiddleware → AuthInterceptor → DecafRequestHandlerInterceptor → Controller`.

---

## Summary

- Modules reviewed: `for-http` (`@decaf-ts/for-http` v0.19.0), `for-nest` (`@decaf-ts/for-nest`
  v0.14.1).
- Review method: read-only source/tests/docs review; no tests or builds run; no files modified.
- Inaccuracies found: **20 in `for-http`** + **14 in `for-nest`** = **34 total** (detailed above with
  evidence and suggested fixes; nothing was fixed, per instructions).
- Brief written to: `workdocs/ai/project/technical-docs/_research-briefs/06-http-nest.md` and posted
  as issue document key `brief`.
