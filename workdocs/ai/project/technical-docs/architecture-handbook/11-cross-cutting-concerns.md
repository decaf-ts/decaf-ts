# 11 — Cross-cutting Concerns

Several concerns cut across the layer stack rather than belonging to one layer.
This chapter describes how each is realized in decaf-ts and where it lives.

## Logging

Logging is provided by `@decaf-ts/logging` (documented in the `03-libs` brief),
which sits just above foundation.

- **`LoggedClass`** is the base for classes that need a context logger; `core`
  extends it as `ContextualLoggedClass` and adds **`logCtx`** — a per-operation
  logger binding (`logCtx(...).for(this.someMethod)`) so each operation logs
  under the correct method name and context.
- **`Logging`** is a configurable facade with swappable factories. The default
  is the decaf console logger; `PinoFactory`/`WinstonFactory` (arrow-function
  `const`s, *not* the `PinoLogFactory`/`WinstonLogFactory` classes some docs
  mention) are available as subpath providers.
- **`LoggedEnvironment`** is a pre-accumulated singleton instance of
  `Environment` (not a class, despite some docs), seeded from `NODE_ENV`.
- The **MCP server** swaps the logging factory to stderr-only under stdio
  transport so stdout stays protocol-clean; the **CLI** defaults to
  `LogLevel.info` with a `--logLevel` override.
- `db-decorators` obtains context loggers via `Logging.get()`; the foundation
  packages themselves do not provide a logging API.

Recorded inaccuracy: `Logging.theme` is gated on the *global* `style` flag, so
per-logger `style: true` overrides never take effect; and `DefaultLoggingConfig.
timestampFormat` is declared but never used.

## Crypto

Crypto is provided by `@decaf-ts/crypto` (documented in the `03-libs` brief).

- The headline integration is the **`@encrypt`** decorator, which composes
  `db-decorators` lifecycle hooks (`@on`/`@after`) to encrypt fields on
  create/update and decrypt on read. It always re-encrypts with a fresh IV on
  update (the "skip if unchanged" block in some docs is empty comments — a
  recorded inaccuracy).
- **`CryptoService`** wraps the WebCrypto `SubtleCrypto` API (`getSubtle`/
  `getCrypto`); `@decaf-ts/crypto/common` requires `@decaf-ts/core` and
  `db-decorators` at runtime (so the "optional integration" framing is
  optimistic — recorded inaccuracy).
- Foundation also provides primitive hashing (`hashObj`/`hashCode`/`Hashing` +
  `@hashedBy`) in `decorator-validation`; `JSONSerializer` is explicitly
  unsuitable for hashing. `db-decorators` builds `@hash`/`@id`/`@generated` on
  top.
- The **integrations secrets** subsystem uses `CryptoService` for the
  model-backed secret provider (encrypted-at-rest rows with `{encryptedPayload,
  encryption:{keyId, iv}}`).

Env: `ENCRYPTION_KEY` is referenced by `Obfuscation.getKeyMaterial` but that
path is dead (recorded inaccuracy); it is vestigial/unused in the runtime path.
The MCP server uses `ENCRYPTION_KEY` for its obfuscated `.enc` assets.

## as-zod (model → Zod bridge)

`@decaf-ts/as-zod` and `@decaf-ts/as-zod-model-bridge` (documented in the
`03-libs` brief) convert decorated models into Zod schemas by reading the same
`Metadata` validation metadata (`validatableProperties`, `getPropDesignTypes`,
`ValidationKeys`, `Validation.get`/`decoratorFromKey`, `Model.getAttributes`).

- It consumes foundation's reflection surface; it does **not** add new
  validation semantics — it projects the existing decorator validators onto
  Zod.
- `package.json` declares `"sideEffects": false` but importing the package has
  global side effects, so that declaration is inaccurate (recorded inaccuracy).
  The mechanism is `z`-namespace patching plus library self-registration, not
  `ModelBuilder.prototype` patching: `as-zod/src/overrides.ts` monkey-patches
  the Zod `z` namespace — installing `z.from`/`z.toModel` via
  `Object.defineProperty(z, "from"|"toModel", ...)` (`overrides.ts:908-931`) —
  and `as-zod/src/index.ts` calls `Metadata.registerLibrary("@decaf-ts/as-zod",
  VERSION)` at import (`index.ts:31`). `ZodModelBuilder extends ModelBuilder`
  is a subclass; no `.prototype` assignment exists.
- Known gaps carried from the brief: `@encrypt`-style decorator metadata is not
  threaded into Zod schemas; `enum` conversion uses `z.nativeEnum` even for
  string-literal unions; `Date` fields convert to `z.date()` while `@date`
  validators emit `z.string().datetime()`; circular model references throw
  `RangeError` instead of using `z.lazy`; nested `@list`/`@option` arrays drop
  the inner `@required` constraint.

These are reported, not fixed.

## Versioning

decaf-ts distinguishes two unrelated "versioning" concerns:

### Package / build-placeholder versioning
Every package exports build placeholders — `VERSION`, `COMMIT`, `FULL_VERSION`,
`PACKAGE_NAME` — that `build-scripts` substitutes at publish time. Each package
calls `Metadata.registerLibrary(PACKAGE_NAME, VERSION)` at import so the loaded
set is introspectable via `Metadata.libraries`. Committed `lib/` artifacts can
lag `package.json` versions (recorded inaccuracy in foundation), and several
packages ship unreplaced `##PACKAGE_SIZE##` placeholders.

### Release-chain and semver derivation
`utils` provides `ReleaseChainRunner`/`runReleaseChain`/`dispatchReleaseChain
Workflow`, and `bin/tag-release.sh` derives the semver bump from the commit
message suffix (`-breaking` → major, `-bug|fix` → patch, `-prerelease` →
prerelease, else minor), runs `npm version`, and pushes with token auth. The
`reusable-actions` release/publish workflows are the CI twin of this script.
`with-ai` devDependencies float `latest` and `managed-mcp.json` invokes
`@decaf-ts/mcp-server@latest`, which is a drift risk (recorded inaccuracy).

### Migration versioning (distinct from package versioning)
`core` migrations use a `MigrationVersioning` strategy: `StandardMigration
Versioning` (lexical comparison) by default, or `SemverMigrationVersioning`
(optional `semver` dependency, falls back to lexical). This is about *migration
ordering*, not package versioning — see [Persistence core](./03-persistence-core.md)
and the [migrations design](../design-specification/04-migrations-design.md).

## Metadata self-registration

The defining cross-cutting mechanism. On import, each package:

1. Calls `Metadata.registerLibrary(PACKAGE_NAME, VERSION)` to record itself.
2. Augments `Metadata`, `Model`, and/or `ModelBuilder` via TypeScript
   `declare module` overrides **plus** a runtime monkey-patch in an
   `overrides/` file (not subclassing). This is why `package.json` `sideEffects`
   is load-bearing.
3. Registers its flavour and decorators with the `Decoration` builder.

Per-package registration points:

| Package | Registers |
|---|---|
| `decorator-validation` | `@validator` self-registers; `Validation.registerDecorator` maps key→decorator |
| `injectable-decorators` | `Injectables.register` (singleton/on-demand container keyed by `Symbol.for`) |
| `db-decorators` | operation hooks (`@on`/`@after`), `Repository`/`Context` augmentation |
| `core` | replaces the global `Injectables` registry; monkey-patches `Decoration.flavourResolver`; model/identity decorators |
| `for-*` adapters | `Adapter.setCurrent(flavour)` as an import side effect; adapter-specific decorator overrides |
| `ui-decorators` | `UIKeys`/`GraphKeys` metadata namespaces; `RenderingEngine` flavour registry |
| `integrations` | `@service`-bound services; `Metadata.nodes()`/`workflows()` augmentations for graph |

There is **no unified introspection API**: consumers must know each package's
reflect-key namespaces (`ValidationKeys.REFLECT`, `ModelKeys`, `DBKeys`,
`TransactionalKeys`, `InjectablesKeys`, `UIKeys`, `GraphKeys`). This is a
known friction point, recorded but not fixed.

## Error hierarchy

decaf-ts mandates a structured error hierarchy (the `errors` skill: never throw
raw `Error`). `db-decorators` defines the persistence error base
(`BaseError`/`ValidationError`/`NotFoundError`/`ConflictError`/…); adapters
implement `parseError` to map native errors into this hierarchy (e.g. `for-http`
maps 404→`NotFoundError`, 409→`ConflictError`, 422→`ValidationError`). The task
engine has its own control-error taxonomy (`TaskControlError` →
`TaskFailError`/`TaskRetryError`/`TaskCancelError`/`TaskRescheduleError`). This
cross-cuts every layer that produces or translates errors.

## Internationalization (i18n)

i18n is cross-cutting across the frontend engines. The model is consistent at
the contract level even where implementations differ:

- **Angular / React**: `I18nLoader` HTTP-fetches `{prefix}{lang}{suffix}`,
  deep-merges app keys over a bundled baseline (per-language cache), with a
  custom `I18nParser` (Angular). Missing keys resolve to the key itself.
- **React Native**: synchronous `i18next` with bundled `en`/`pt`, a
  `TranslateService` singleton and `useTranslate` hook.
- Validation messages resolve via the `errors.*` namespace through the
  `Validator.getMessage` override surface (which `ui-decorators` wires via
  `UIValidator`/`translateService` — currently dead/commented, a recorded
  inaccuracy).

See [Frontend engines](./08-frontend-engines.md) for per-engine detail.

## Inaccuracies

The inline inaccuracies recorded above for logging, crypto, and as-zod are
consolidated here in the mandated format. These three packages are covered
**only** in this cross-cutting chapter (their full per-module brief
inaccuracies live in `_research-briefs/03-libs.md`); the entries below are the
subset recorded inline in the chapter, so there is no duplication or
contradiction with the per-module chapters (02–10). **Nothing is fixed here;
this is documentation only.**

Format: `**[<module>]** <area> — <what> | Evidence: <file:line> | Suggested
fix: <short>`.

- **[logging]** `Logging.theme` — gated on the *global* `style` flag, not the per-logger `style` config, so per-logger `style: true` overrides never take effect. | Evidence: `src/logging.ts:988` reads the global `LoggedEnvironment.style`, while `MiniLogger.createLog` decides whether to call `applyTheme` via the per-logger `this.config("style")` (`src/logging.ts:277`). | Suggested fix: have `Logging.theme` accept an explicit `styleEnabled` argument (or read the caller's config).
- **[logging]** `DefaultLoggingConfig.timestampFormat` — declared and defaulted but never used. | Evidence: `src/constants.ts:186` `timestampFormat: "HH:mm:ss.SSS"`; `createLog` always uses `new Date().toISOString()` (`src/logging.ts:280-282`) and no parameter renderer reads `timestampFormat`. | Suggested fix: honour `timestampFormat` in the `timestamp` renderer or remove the field.
- **[crypto]** `@encrypt` "skip if unchanged" — the `onUpdate` skip block is empty comments; the value is always re-encrypted with a fresh IV. | Evidence: `src/integration/decorators.ts:262-273` (`if (hasOldModel)` block is empty) falls through to encryption at `:276-292`. | Suggested fix: update the README sequence diagram to reflect unconditional re-encryption, or implement the skip.
- **[crypto]** `@decaf-ts/crypto/common` "optional integration" framing is optimistic — the `./common` loaders `getSubtle`/`getCrypto` import `normalizeImport` from `@decaf-ts/core` and `InternalError` from `@decaf-ts/db-decorators`, so even the "common" subpath requires those packages at runtime. | Evidence: `package.json:149-154` lists `core`/`db-decorators`/`decoration`/`decorator-validation` as `optionalDependencies`; `src/common` imports from `@decaf-ts/core`/`@decaf-ts/db-decorators` (brief `03-libs.md` §12). | Suggested fix: drop the "optional integration" wording or move `core`/`db-decorators` to `dependencies`.
- **[crypto]** `ENCRYPTION_KEY` dead path — `Obfuscation.getKeyMaterial` reads `process.env.ENCRYPTION_KEY`, but `obfuscate`/`deobfuscate` take an explicit `secret` and never call it. | Evidence: `src/node/Obfuscation.ts:31-33`. | Suggested fix: remove `getKeyMaterial` or wire it as a default when `secret` is omitted.
- **[as-zod]** `sideEffects: false` is inaccurate — importing the package has global side effects. | Evidence: `as-zod/src/overrides.ts:908-931` installs `z.from`/`z.toModel` via `Object.defineProperty(z, ...)` and `as-zod/src/index.ts:31` calls `Metadata.registerLibrary("@decaf-ts/as-zod", VERSION)` at import; `package.json:101` declares `"sideEffects": false`. | Suggested fix: set `sideEffects` to the side-effectful entry files, or document that the side effects are intentional and idempotent.
