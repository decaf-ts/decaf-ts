# Research Brief — Cross-cutting libs (`logging`, `crypto`, `as-zod`)

Scope: three foundational/cross-cutting libraries in the decaf-ts monorepo:
`@decaf-ts/logging` (`/workspaces/decaf-ts/logging`),
`@decaf-ts/crypto` (`/workspaces/decaf-ts/crypto`), and
`@decaf-ts/as-zod` (`/workspaces/decaf-ts/as-zod`). The brief was produced by a
read-only review of each module's `src/`, `tests/`, `README`, `docs/`,
`workdocs/`, and `package.json` — no tests or builds were executed. Every
statement is grounded in the actual code; file:line references cite the `src/`
source tree (line numbers refer to the reviewed working copy).

Total inaccuracies found: **39** (logging: 13, crypto: 13, as-zod: 13).

---

### logging (`@decaf-ts/logging` v0.23.7)

#### 1. Identity
- **Directory:** `/workspaces/decaf-ts/logging`
- **Package name:** `@decaf-ts/logging` (`package.json:2`)
- **Version:** `0.23.7` (`package.json:3`)
- **Description:** `"simple winston inspired wrapper for cross lib logging"`
  (`package.json:4`)
- **License:** MIT (`package.json:103`); author `"Tiago Venceslau and
  Contributors"` (`package.json:102`)
- **Type:** `"module"` (`package.json:5`); `sideEffects: false`
  (`package.json:126`)
- **Engines:** `node >=20.0.0`, `npm >=10.0.0` (`package.json:81-84`)

#### 2. Purpose & role
A lightweight, cross-runtime (browser + Node) logging toolkit that keeps one
minimal default logger (`MiniLogger`) at its core while exposing a static
facade (`Logging`) for global config, context-scoped child loggers,
decorators, filters, and pluggable backends (Winston, Pino). In the decaf-ts
layering it sits near the bottom of the dependency stack: it has **no runtime
decaf dependencies** (`@decaf-ts/utils` is only a `devDependency`,
`package.json:108-111`) and is consumed by foundational modules (`utils`,
`core`, `db-decorators`, `transactional-decorators`, `ui-decorators`, every
`for-*` adapter, `cli`, `integrations`, `mcp-server`) as the standard
observability layer.

#### 3. Dependencies
- **Runtime dependencies** (`package.json:112-119`):
  - `styled-string-builder` (`latest`) — ANSI color/style theming via
    `style(...)` (`src/logging.ts:13`, `src/types.ts:1`).
  - `typed-object-accumulator` (`latest`) — base class for the `Environment`
    env accumulator (`src/environment.ts:1`).
- **Optional dependencies** (`package.json:116-119`):
  - `pino` `^10.1.0` — only required for `@decaf-ts/logging/pino`.
  - `winston` `^3.17.0` — only required for `@decaf-ts/logging/winston`.
- **Dev dependencies** (`package.json:108-111`): `@decaf-ts/utils` (`latest`,
  not a runtime dependency), `@types/jest ^30.0.0`.
- **No decaf-ts module is a runtime dependency of `logging`** — it is a leaf
  in the runtime graph.
- **Modules that depend on `@decaf-ts/logging`** (monorepo scan of other
  `package.json` files):
  - Runtime (`dependencies`): `for-nextjs`, `for-nano`, `db-decorators`,
    `for-typeorm`, `for-nest`, `cli`, `for-fabric`, `utils`,
    `for-react-native`, `integrations`, `mcp-server`, `for-react`,
    `for-http`, `for-pouch`, `demo`, `web-page`.
  - Dev (`devDependencies`): `crypto`, `transactional-decorators`, `core`,
    `ui-decorators`.
  - Peer (`peerDependencies`): `for-angular`, `for-couchdb`.

#### 4. Architecture & structure
`src/` layout (20 files):
- `src/index.ts` — root barrel; re-exports all subsystems plus
  `styled-string-builder`; defines `VERSION`/`COMMIT`/`FULL_VERSION`/
  `PACKAGE_NAME` build placeholders (`src/index.ts:6-53`).
- `src/types.ts` — contracts: `Logger`, `LoggingConfig`, `LoggerFactory`,
  `LoggingFilter`, `Theme`/`ThemeOption`/`ThemeOptionByLogLevel`,
  `Impersonatable`, `StringLike`, `LogMeta`, `Class`, `LoggingContext`,
  `AnyFunction`.
- `src/constants.ts` — `LogLevel` enum (10 levels), `NumericLogLevels`,
  `LoggingMode` (`RAW`/`JSON`), `DefaultTheme`, `DefaultLoggingConfig`,
  `BrowserEnvKey`, `ENV_PATH_DELIMITER`, `DefaultPlaceholderWrappers`.
- `src/logging.ts` — the heart: `MiniLogger` (reference `Logger` impl) and
  the `Logging` static facade; exports `ROOT_CONTEXT_SYMBOL`.
- `src/logParameters.ts` — pluggable log-pattern engine:
  `LogParameterRegistry`, `LogParameterDescriptor`, pattern parser/compiler
  (`compileLogPattern`, `renderPattern`), nine default parameters (`level`,
  `timestamp`, `app`, `context`, `separator`, `message`, `stack`, `meta`,
  `correlationId`); singleton `logParameterRegistry`.
- `src/decorators.ts` — method decorators `log`, `benchmark`, `debug`,
  `info`, `silly`, `trace`, `verbose`, `final` (+ `ArgFormatFunction`,
  `ReturnFormatFunction`).
- `src/LoggedClass.ts` — `LoggedClass` abstract base with lazy `this.log`
  getter.
- `src/environment.ts` — `Environment<T>` (extends `ObjectAccumulator`),
  env-var resolution proxy, `orThrow()`, `Environment.accumulate(...)`;
  exports singleton `LoggedEnvironment`.
- `src/errors.ts` — `BaseError` abstract error base.
- `src/text.ts` — string utilities (`padEnd`, `patchPlaceholders`,
  `patchString`, case converters, `escapeRegExp`, `sf`, deprecated
  `stringFormat`).
- `src/time.ts` — `now()`, `StopWatch` (laps/pause/resume), `formatMs`,
  `Lap`.
- `src/utils.ts` — reflection helpers (`isClass`, `isFunction`, `isMethod`,
  `isInstance`, `getObjectName`).
- `src/web.ts` — `isBrowser()` runtime check.
- `src/filters/LogFilter.ts` — abstract `LogFilter extends LoggedClass
  implements LoggingFilter`.
- `src/filters/PatternFilter.ts` — `PatternFilter` (regex-based redaction) +
  `ReplacementFunction`.
- `src/winston/index.ts` + `src/winston/winston.ts` — `WinstonLogger extends
  MiniLogger` + `WinstonFactory`.
- `src/pino/index.ts` + `src/pino/pino.ts` — `PinoLogger extends MiniLogger`
  + `PinoFactory`.

**Subpath exports** (`package.json:6-40`): `"."` → root barrel; `"./winston"`
→ `WinstonLogger`/`WinstonFactory`; `"./pino"` → `PinoLogger`/`PinoFactory`.
Each subpath ships dual ESM/CJS with `.d.mts`/`.d.cts` types. `main` →
`./lib/cjs/index.cjs`, `module` → `./lib/esm/index.js`
(`package.json:124-125`).

#### 5. Public API surface
From `src/index.ts`:
- **Facade / classes:** `Logging` (static: `setFactory`, `setConfig`,
  `getConfig`, `get`, `for`, `because`, `theme`, `register`/`unregister`,
  per-level static log methods); `MiniLogger` (reference `Logger`, per-level
  methods, `for`, `clear`, `setConfig`, `root`); `LoggedClass` (abstract
  base, `protected get log()`); `Environment` (env accumulator); `BaseError`;
  `StopWatch`; `LogParameterRegistry`.
- **Filters:** `LogFilter` (abstract base), `PatternFilter`
  (regex redaction).
- **Backends (subpath barrels only):** `WinstonLogger` + `WinstonFactory`
  (`./winston`); `PinoLogger` + `PinoFactory` (`./pino`) — `PinoLogger` also
  exposes `child`, `flush`, `level` getter/setter.
- **Decorators:** `log(level?, verbosity?, entryMessage?, exitMessage?)`,
  `benchmark()`, `debug()`, `info()`, `silly()`, `trace()`,
  `verbose(verbosity?)`, `final()` (+ types `ArgFormatFunction`,
  `ReturnFormatFunction`).
- **Enums / constants:** `LogLevel` (benchmark, fatal, critical, error, warn,
  info, verbose, debug, trace, silly), `NumericLogLevels` (0…21),
  `LoggingMode` (`RAW`/`JSON`), `DefaultTheme`, `DefaultLoggingConfig`.
- **Types:** `Logger`, `LoggingConfig`, `LoggerFactory`, `LoggingFilter`,
  `Theme`, `ThemeOption`, `ThemeOptionByLogLevel`, `StringLike`, `LogMeta`,
  `AnyFunction`, `Class`, `LoggingContext`, `LogParameterPayload`,
  `LogParameterDescriptor`, `Lap`, `ReplacementFunction`.
- **Log-pattern helpers:** `compileLogPattern`, `renderPattern`,
  `logParameterRegistry` singleton.
- **Text utils:** `padEnd`, `patchPlaceholders`, `patchString`,
  `toCamelCase`, `toENVFormat`, `toSnakeCase`, `toKebabCase`, `toPascalCase`,
  `escapeRegExp`, `sf`, `stringFormat` (deprecated).
- **Time utils:** `now`, `formatMs`, `StopWatch`, `Lap`.
- **Reflection utils:** `isClass`, `isFunction`, `isMethod`, `isInstance`,
  `getObjectName`.
- **Runtime:** `isBrowser`.
- **Build metadata:** `VERSION`, `COMMIT`, `FULL_VERSION`, `PACKAGE_NAME`
  (placeholders replaced at publish).

`Logging.register`/`Logging.unregister` (`src/logging.ts:1085-1090`) delegate
to `logParameterRegistry`, letting consumers add custom pattern parameters.

#### 6. Key patterns & concepts
- **Logger hierarchy / impersonation.** `MiniLogger.for(...)` returns a
  `Proxy` over the same target that overlays a `childConfig` and rewrites the
  `context` array — child overrides compose across chains without instance
  allocation (`src/logging.ts:97-220`). The immutable root context is stored
  via `ROOT_CONTEXT_SYMBOL` (`src/logging.ts:25, 62`). `Logging.for` reuses a
  single global logger and delegates to `root.for(...)`
  (`src/logging.ts:896-904`).
- **Factory / strategy.** `Logging._factory` defaults to building `MiniLogger`
  seeded with the `LoggedEnvironment.app` base context
  (`src/logging.ts:697-706`). `Logging.setFactory` swaps the implementation
  and clears the cached global; `WinstonFactory`/`PinoFactory` are drop-in
  replacements that extend `MiniLogger` and override only `log(...)`.
- **Decorator pattern.** `log` wraps `descriptor.value` in a `Proxy` with an
  `apply` trap emitting entry/exit messages (and `logger.error` on failure)
  (`src/decorators.ts:42-84`). On a `LoggedClass` target it reuses
  `target["log"].for(method)`. `benchmark` measures with `now()` and emits
  `logger.benchmark`.
- **Style/colour builder.** `Logging.theme(text, type, loggerLevel,
  template=DefaultTheme)` reads a `ThemeOption` and applies `fg`/`bg`
  (number, 256-color, or RGB) and named `style` via `style(...)`
  (`src/logging.ts:982-1083`); failures are caught and logged to
  `console.error` rather than thrown.
- **Accumulator pattern.** `Environment<T>` extends `ObjectAccumulator<T>`
  (`src/environment.ts:70`). `Environment.accumulate(value)` returns a
  proxied singleton whose properties resolve lazily from
  `process.env`/`globalThis.ENV` (`__`-delimited upper-snake keys) and fall
  back to the seeded model. `orThrow()` returns a stricter proxy that throws
  for absent/empty values. `LoggedEnvironment` is the pre-accumulated
  singleton seeded with `DefaultLoggingConfig`.
- **Log levels & verbosity.** `LogLevel` (10 string values) maps to
  `NumericLogLevels` (0…21) (`src/constants.ts:34-91`). `MiniLogger.log`
  skips when below the configured threshold, then dispatches to the matching
  console method (`src/logging.ts:409-440`). `silly`/`verbose` additionally
  gate on `config("verbose") >= verbosity`.
- **Context propagation.** Context is an explicit `string[]` joined by
  `config.contextSeparator` (default `"."`); the `app` name (if set) is the
  leading segment (`src/logging.ts:920-923`). `correlationId` is rendered
  through its own pattern parameter (`src/logParameters.ts:348-358`).
- **Flavours / backends.** Winston adapter maps `LogLevel`→numeric via
  `WinstonLevels` and uses a pass-through `printf` that emits the
  pre-formatted `createLog` string (`src/winston/winston.ts:13-74`). Pino
  adapter defines custom `PinoCustomLevels` (benchmark=100…silly=10),
  optional `multistream`, and a `child()` delegating to `pino.child`
  (`src/pino/pino.ts:19-30, 46-81, 151-179`).
- **Registries.** `LogParameterRegistry` maps pattern keys to
  `LogParameterDescriptor`s (`render`, optional `style`, `shouldInclude`);
  the singleton is pre-populated with nine defaults and extended via
  `Logging.register`/`unregister`.

#### 7. Lifecycle / configuration / environment
- **Initialisation.** No explicit `init()`; logging is usable on import. On
  first access `Logging.ensureRoot()` calls the factory and attaches the root
  context (`src/logging.ts:941-947`). The default factory seeds the base
  context with `[LoggedEnvironment.app]` when set
  (`src/logging.ts:697-706`).
- **Configuration.** Global config lives in `Logging._config`, the
  `LoggedEnvironment` singleton (`src/logging.ts:708`). `Logging.setConfig`
  merges top-level keys by assignment (not a deep merge)
  (`src/logging.ts:729-733`). `Logging.getConfig()` returns the live
  singleton, not a copy (`src/logging.ts:740-742`). `MiniLogger.config(key)`
  prefers the logger's own `conf` then falls back to global
  (`src/logging.ts:65-69`).
- **Environment variables.** `Environment` reads from
  `globalThis.process.env` (Node) or `globalThis.ENV` (browser, key
  `BrowserEnvKey="ENV"`) (`src/environment.ts:112-126, 426-436, 606-616`).
  Keys join the access path with `ENV_PATH_DELIMITER="__"` and convert
  camelCase to UPPER_SNAKE via `toENVFormat`. `LoggedEnvironment` seeds `env`
  from `NODE_ENV` (default `"development"`) at module load
  (`src/environment.ts:639-643`). String env values are parsed to
  booleans/numbers.
- **Defaults** (`src/constants.ts:176-193`): `level: info`, `verbose: 0`,
  `logLevel: true`, `style: false`, `contextSeparator: "."`, `separator:
  "-"`, `timestamp: true`, `timestampFormat: "HH:mm:ss.SSS"` (declared but
  unused — see §13), `context: true`, `meta: true`, `format: RAW`,
  `pattern: "{level} [{timestamp}] {app} {context} {separator} {message}
  {stack}"`, `theme: DefaultTheme`.
- **Backend selection.** No auto-detection; default is `MiniLogger` to
  console. Swapping is explicit via `Logging.setFactory(WinstonFactory)` or
  `Logging.setFactory(PinoFactory)`.

#### 8. Data & control flow
A `logger.info("hello", { requestId: "abc" })` call:
1. `MiniLogger.info(msg, meta)` → `this.log(LogLevel.info, msg, undefined,
   meta)` (`src/logging.ts:541-543`).
2. `MiniLogger.log` reads the configured level, compares `NumericLogLevels`
   (`src/logging.ts:409-410`); if below threshold returns. Otherwise selects
   the console method (info→`console.log`) and calls
   `method(this.createLog(...))` (`src/logging.ts:411-440`).
3. `MiniLogger.createLog` (`src/logging.ts:271-380`): reads `style`,
   `separator`, `app`, `timestamp` (always `new Date().toISOString()`,
   `:280-282`), builds context segments, coerces the message, runs
   `applyFilters` (`:246-261`), stringifies `meta` via `formatMeta`
   (`:382-389`) and filters it, optionally builds the error/stack block,
   assembles a `LogParameterPayload` (with an `applyTheme` closure), compiles
   the configured `pattern` via `compileLogPattern`, and renders it via
   `logParameterRegistry.render` / `renderPattern`
   (`src/logParameters.ts:74-123`). For `format:"json"` it embeds `meta` as
   an object and `JSON.stringify`s; for `"raw"` it concatenates rendered
   segments, normalises whitespace, and appends the filtered meta string
   only when the pattern lacks a `{meta}` segment (`:366-376`).
4. The formatted string is passed to the chosen console method.

For `WinstonLogger`, `log` builds a `LogEntry` with `message: createLog(...)`
and calls `this.winston.log(...)`; Winston's format is a pass-through `printf`
(`src/winston/winston.ts:58-97`). For `PinoLogger`, `log` calls
`this.createLog(...)` and dispatches to `this.pino[level](formatted)`
(`src/pino/pino.ts:128-149`).

#### 9. Testing
Jest config (`jest.config.cjs`): `ts-jest`, `testEnvironment: node`, regex
`tests/.*\.(test|spec)\.ts`. Scripts split unit vs integration
(`package.json:52-55`).
- **Unit tests** (`tests/unit/`, 18 files): `logging.test.ts` (1198 lines —
  `MiniLogger`/`Logging`: constructor, config fallback, `for` variants,
  `createLog` timestamp/errors/stack/meta in raw/json, custom pattern
  parameters, `PatternFilter` integration, level dispatch, verbosity gating,
  `setConfig` merge, factory, static log methods, `Logging.theme`);
  `decorators.test.ts`; `environment.test.ts` (564 lines) +
  `environment.fromModel.test.ts` + `accumulate.orThrow.test.ts`;
  `output.test.ts`; `levels.unit.test.ts`; `logParameters.test.ts`;
  `text.test.ts`; `time.test.ts` + `time.branches.test.ts`; `utils.test.ts`;
  `silly.test.ts`; `logged-class-decorators.test.ts`;
  `winston.logger.test.ts` (139 lines, winston mocked);
  `pino.logger.test.ts` (643 lines, pino mocked);
  `adapter.exports.test.ts`; `test-reporter.integration.test.ts` (under
  `unit/` despite its name).
- **Integration tests** (`tests/integration/`, 8 files): `winston` (real
  winston + `MemoryTransport`), `pino` (real pino + `MemoryStream`),
  `decorators`, `environment`, `filters`, `loggedclass`, `logging`, `utils`.
  A stray `tests/integration/.gitlock` exists.
- **Gaps:** `Logging.theme` is never exercised with `style: true` against the
  real `styled-string-builder` (mock returns `"styled-text"` but tests set
  `style: false`, so the early-return path always wins — theming correctness
  against the real lib is unverified); `output.test.ts` themed debug/error
  assertions are commented out; `errors.ts` (`BaseError`) has no dedicated
  unit test; `web.ts` (`isBrowser`) covered only via mocks; `LoggedClass`
  covered indirectly; no `tests/bundling` directory despite `AGENTS.md`
  mentioning it.

#### 10. Usage example
Minimal configuration + child logger (from `tests/unit/logging.test.ts`):
```ts
const prev = LoggedEnvironment.app;
(LoggedEnvironment as any).app = "SvcApp";
const logString = (logger as any).createLog(LogLevel.info, "message with app");
expect(logString).toContain("SvcApp");
```
`LoggedClass`/facade consumption (from `tests/unit/output.test.ts:14-55`):
```ts
const logger = Logging.for("testing");
Logging.setConfig({ level: LogLevel.debug });
it("logs an info message properly", () => {
  const consoleMock = jest.spyOn(console, "log");
  logger.info("This is a test message");
  expect(consoleMock).toHaveBeenCalledWith(
    expect.stringMatching(/INFO.*?\s-\sThis\sis\sa\stest\smessage$/g)
  );
});
```

#### 11. Relationships
- **No runtime decaf deps.** `@decaf-ts/utils` is dev-only; `logging` is a
  leaf in the runtime graph.
- **Consumers** (see §3): `utils`, `core`, `db-decorators`,
  `transactional-decorators`, `ui-decorators`, `crypto`, `cli`,
  `integrations`, `mcp-server`, all `for-*` adapters; `for-angular` and
  `for-couchdb` declare it as a peer.
- **External integration:** `styled-string-builder` (theming),
  `typed-object-accumulator` (env base), optional `winston`/`pino`. The
  `Logging.setFactory`/`LoggerFactory` contract is the extension point other
  modules use to plug in their own logger without changing call sites.
- The `Environment`/`LoggedEnvironment` accumulator is the shared
  configuration sink readable via `Logging.getConfig()`.

#### 12. Consumer notes
- **Dual ESM/CJS.** `type: module` with per-subpath `import`/`require`/
  `default` conditions; types via `.d.mts`/`.d.cts`.
- **`sideEffects: false`** — safe for tree-shaking; however importing
  `/pino` or `/winston` pulls `pino`/`winston` (declared
  `optionalDependencies`). Consumers must install the backend themselves or
  face missing-module errors.
- **Config is live, not a copy.** `Logging.getConfig()` returns the
  `LoggedEnvironment` singleton; mutating it affects all loggers. `setConfig`
  does not deep-merge nested objects.
- **Default level is `info`**, `style: false`, `timestamp: true`,
  `format: RAW`, `meta: true`.
- **`timestampFormat` is declared but unused** — `createLog` always emits
  `new Date().toISOString()`; the `HH:mm:ss.SSS` default is decorative.
- **Verbosity gating** only affects `silly` and `verbose`; all other levels
  are gated purely by `NumericLogLevels`.
- **`pattern` is configurable** and supports literal `{key}` parameters plus
  `[optional]` groups; custom parameters via `Logging.register({ key, render,
  style?, shouldInclude? })`.
- **Maturity:** comprehensive unit + integration tests, dual build (`lib` +
  `dist`), generated `docs/`, coverage reports in `workdocs/reports/coverage/`.
- **Versioning caveat:** `0.23.7` (pre-1.0); decaf packages pin `"latest"` for
  cross-module deps, so expect breaking changes between minor releases.
- **`overrides`** force `test-exclude ^7.0.2` and `brace-expansion ^5.0.8`
  (dev toolchain only).

#### 13. Inaccuracies found
1. **[logging]** README/docs — Pino/Winston adapter example imports and instantiates non-existent factory classes. | Evidence: `README.md:193,196` `import { PinoLogFactory } ...; Logging.setFactory(new PinoLogFactory(pinoInstance));` and `README.md:207,212` for `WinstonLogFactory`; actual exports are `PinoFactory` (`src/pino/pino.ts:205`) and `WinstonFactory` (`src/winston/winston.ts:110`), both arrow-function `const`s (not constructable). `workdocs/5-HowToUse.md:66,69,80,85` repeats the same. | Suggested fix: replace with `import { PinoFactory } from '@decaf-ts/logging/pino'; Logging.setFactory(PinoFactory);` (pass the driver as the third factory arg).
2. **[logging]** README/docs — `LoggedEnvironment` is described as "A class". | Evidence: `README.md:16` and `README.md:220` call it a class; actual declaration `export const LoggedEnvironment = Environment.accumulate(...)` (`src/environment.ts:632`). | Suggested fix: state it is a pre-accumulated singleton instance of `Environment`, not a class.
3. **[logging]** README/workdocs — `log` decorator signature is wrong. | Evidence: `README.md:91` and `workdocs/4-Description.md:39` say `log(level=info, benchmark=false, verbosity=0)`; actual signature is `log(level=LogLevel.info, verbosity=0, entryMessage, exitMessage?)` (`src/decorators.ts:42-47`) with no `benchmark` parameter. | Suggested fix: update to `log(level=LogLevel.info, verbosity=0, entryMessage?, exitMessage?)`.
4. **[logging]** README/workdocs — Public API surface omits real decorators. | Evidence: `README.md:60,116` and `workdocs/4-Description.md:8,64` list only `log, debug, info, verbose, silly`; actual exports also include `benchmark`, `trace`, `final` (`src/decorators.ts:109,198,224`). | Suggested fix: add `benchmark`, `trace`, `final`.
5. **[logging]** README/workdocs — `LogLevel` description understates the enum. | Evidence: `workdocs/4-Description.md:21` "LogLevel: error | info | verbose | debug | silly"; actual `LogLevel` has 10 members (`src/constants.ts:34-55`). | Suggested fix: list all levels or say "10 levels from benchmark to silly".
6. **[logging]** README/workdocs — Logger contract description omits methods. | Evidence: `workdocs/4-Description.md:14` lists "silly, verbose, info, debug, error, for, setConfig"; actual `Logger` also declares `benchmark`, `fatal`, `critical`, `trace`, `warn`, `clear`, `root` (`src/types.ts:85-214`). | Suggested fix: include the full method set.
7. **[logging]** README/workdocs — Public API surface omits `PinoLogger`. | Evidence: `README.md:115` and `workdocs/4-Description.md:63` list "MiniLogger, Logging, LoggedClass; WinstonLogger (optional)"; `PinoLogger` is exported from `/pino` (`src/pino/pino.ts:91`) and asserted in `tests/unit/adapter.exports.test.ts`. | Suggested fix: add `PinoLogger`.
8. **[logging]** Code/doc mismatch — `Logging.theme` is gated on the *global* `style` flag, not the per-logger `style` config, so per-logger `style: true` overrides never take effect. | Evidence: `src/logging.ts:988` `if (!this._config.style) return text;` reads the global `LoggedEnvironment.style`, while `MiniLogger.createLog` decides whether to call `applyTheme` via the per-logger `this.config("style")` (`src/logging.ts:277`). | Suggested fix: have `Logging.theme` accept an explicit `styleEnabled` argument (or read the caller's config).
9. **[logging]** Docstring inaccuracy — `Logging.getConfig()` is documented as returning a copy. | Evidence: `src/logging.ts:737-738` "@return {LoggingConfig} A copy of the current configuration."; implementation returns the live `LoggedEnvironment` singleton (`src/logging.ts:740-742`) and tests mutate it directly (`tests/unit/logging.test.ts:801-812`). | Suggested fix: document that it returns the live singleton.
10. **[logging]** Stale config — `DefaultLoggingConfig.timestampFormat` is documented and defaulted but never used. | Evidence: `src/constants.ts:186` `timestampFormat: "HH:mm:ss.SSS"`; `createLog` always uses `new Date().toISOString()` (`src/logging.ts:280-282`) and no parameter renderer reads `timestampFormat`. | Suggested fix: honour `timestampFormat` in the `timestamp` renderer or remove the field.
11. **[logging]** Decorator docstring inaccuracy — `verbose` JSDoc claims the boolean argument is "a flag to enable benchmarking". | Evidence: `src/decorators.ts:205-206`; implementation (`:210-215`) only coerces the boolean to `0` and never enables benchmarking. | Suggested fix: remove the "enable benchmarking" claim.
12. **[logging]** README phrasing — duplicate unit text. | Evidence: `README.md:50` "Minimal size: 8.1 KB kb gzipped" (double "KB kb"). | Suggested fix: "Minimal size: 8.1 KB gzipped".
13. **[logging]** AGENTS.md vs repo mismatch — claims a `tests/bundling` directory. | Evidence: `AGENTS.md:8` "Tests stay in `tests/unit`, `tests/integration`, and `tests/bundling`"; no `tests/bundling` exists. | Suggested fix: drop the `tests/bundling` reference or add the directory.

---

### crypto (`@decaf-ts/crypto` v0.14.3)

#### 1. Identity
- **Directory:** `/workspaces/decaf-ts/crypto`
- **Package name:** `@decaf-ts/crypto` (`package.json:2`)
- **Version:** `0.14.3` (`package.json:3`)
- **Description:** `"decaf-ts crypto wrappers"` (`package.json:4`)
- **License:** MIT (`package.json:135`); author `"Tiago Venceslau and
  contributors"` (`package.json:134`)
- **Type:** `"module"` (`package.json:5`)
- **Engines:** `node >=20.0.0`, `npm >=10.0.0` (`package.json:122-125`)
- **Keywords:** `crypto`, `jwt` (`package.json:130-133`)
- **CLI bin:** `decaf-crypto` → `lib/cjs/bin/cli.cjs` (`package.json:87-89`)

#### 2. Purpose & role
`@decaf-ts/crypto` provides browser-resilient wrappers around the Web
`Crypto`/`SubtleCrypto` APIs, exposing a unified, environment-agnostic surface
that dynamically loads a browser or Node.js implementation at runtime
(`src/common/subtle-crypto.ts:34-48`). It adds a `@encrypt` property decorator
that transparently encrypts/decrypts model fields during decaf-ts repository
lifecycle hooks, JWT sign/verify helpers built on `jose`, and a `decaf-crypto`
CLI for encrypting/obfuscating files. In the framework layering it sits on top
of `@decaf-ts/core`, `db-decorators`, `decoration`, and `decorator-validation`
(declared optional), and is consumed by `@decaf-ts/integrations`.

#### 3. Dependencies
- **decaf modules — `optionalDependencies`** (`package.json:149-154`):
  - `@decaf-ts/core` (latest) — `normalizeImport`, `AuthorizationError`,
    `ContextualArgs`, `Repo`, `ClientBasedService`, `PersistenceKeys`,
    `MaybeContextualArg`.
  - `@decaf-ts/db-decorators` (latest) — `InternalError` and lifecycle
    decorators `onCreate`, `onUpdate`, `afterRead` + handler types.
  - `@decaf-ts/decoration` (latest) — `apply`, `propMetadata`, `Metadata`,
    `Decoration`, `description`.
  - `@decaf-ts/decorator-validation` (latest) — `Model`, `ModelBuilder`
    (overrides patch).
- **decaf modules — `devDependencies`** (`package.json:140-145`):
  `@decaf-ts/logging` (latest, CLI logging), `@decaf-ts/utils` (latest,
  declared but no direct import found in `src/`).
- **Key external runtime dependency** (`package.json:146-148`): `jose ^6.1.3`
  — the only hard runtime dep; powers `sign`/`verify`/JWKS and is even
  imported for the `CryptoKey` type in `src/common/ec-types.ts:2`.
- **Other devDependencies** (`package.json:143-144`): `commander ^14.0.3`
  (CLI), `fast-check ^4.5.3` (fuzz harness configured but no `*.fuzz.ts`
  files exist).
- **`overrides`** (`package.json:160-163`): `test-exclude ^7.0.2`,
  `brace-expansion ^5.0.8` (transitive npm overrides, unrelated to the
  `overrides/` source dir).
- **Modules that depend on `@decaf-ts/crypto`** (monorepo scan): only
  `@decaf-ts/integrations` (`/workspaces/decaf-ts/integrations/package.json:360`).
  Actual imports observed: `integrations/src/blob/core/BlobValue.ts:6`
  (`getCrypto` from `/common`), `integrations/src/blob/local/LocalBlobStoreService.ts:13`
  (`getCrypto`), `integrations/src/secrets/model/ModelSecretCrypto.ts:2`
  (`getCrypto, getSubtle` from `/integration`), `integrations/src/secrets/model/ModelSecretService.ts:31`
  (`CryptoService`), `integrations/src/nest/keycloakAuthHandler.ts:13`
  (`JwtService`).

#### 4. Architecture & structure
`src/` layout:
- `src/index.ts` — root barrel; imports `./overrides` for side effects,
  re-exports `./overrides`, `./common`, `./version` (`src/index.ts:14-16`).
- `src/version.ts` — build placeholders `VERSION`, `COMMIT`, `FULL_VERSION`,
  `PACKAGE_NAME` (replaced at publish).
- `src/common/` — environment-agnostic types + dynamic loaders. Type modules
  (`aes-types.ts`, `hmac-types.ts`, `rsa-types.ts`, `ec-types.ts`,
  `pbkdf2-types.ts`, `util-types.ts`, `crypto-types.ts`) mirror WebCrypto;
  `Subtle.ts` (the `SubtleCrypto` interface); `crypto.ts` (`getCrypto`
  dynamic loader); `subtle-crypto.ts` (`getSubtle` dynamic loader);
  `utils.ts` (hex/ArrayBuffer converters + `getDerivedKey`/`encryptContent`/
  `decryptContent` — CLI-oriented, **not** re-exported from the barrel);
  `index.ts` barrel.
- `src/browser/` — browser implementation; `Crypto.ts` =
  `window.crypto`, `Subtle.ts` = `window.crypto.subtle`, `index.ts` barrel.
- `src/node/` — Node implementation; `Crypto.ts` = Node `crypto` module,
  `Subtle.ts` = `crypto.subtle`, `Obfuscation.ts` (`Obfuscation` static
  class: `aes-256-gcm` + `scrypt` + `zlib`, magic header `DECAF1`),
  `pbkdf2.ts` (`pbkdf2Hash`, `verifyPbkdf2`, `genSalt`, `Pbkdf2Hash` type),
  `index.ts` barrel.
- `src/jwt/` — `types.ts` (`JwtOptions`, `JwtClaims`), `sign.ts` (`sign`
  using `jose.SignJWT`, HS256, default expiry `"5m"`), `verify.ts`
  (`verify`/`verifyJwt`, `decodeJwtPayload`, `getTokenPayload`, `getUser`,
  JWKS cache), `index.ts` barrel.
- `src/integration/` — framework-integration layer. `constants.ts`
  (`CryptoKeys` enum, `ENCRYPTED = "encrypted"`), `errors.ts` (`CryptoError
  extends InternalError`, code 505), `decorators.ts` (`@encrypt` decorator +
  `encryptOnCreate`/`encryptOnRead`/`encryptOnUpdate` handlers, `CryptoMeta`,
  `SecretFunction`), `services/CryptoService.ts` (`ClientBasedService`,
  AES-GCM encrypt/decrypt, PBKDF2 key derivation), `services/JwtService.ts`
  (`ClientBasedService`, wraps `sign`/`verify`), `services/index.ts`,
  `index.ts` (barrel — re-exports only `constants`, `decorators`, `errors`;
  **not** `services`).
- `src/overrides/` — side-effect module patching `ModelBuilder.prototype`:
  `ModelBuilderExtensions.ts` (module-augments `ModelBuilder` with
  `encrypt(...)`/`decorateClass(...)`, installs on prototype at import),
  `index.ts` barrel.
- `src/bin/cli.ts` — CLI entrypoint shim: `crypto().parse(process.argv)`.
- `src/cli-module.ts` — builds the `commander` program with `encrypt`,
  `decrypt`, `obfuscate`, `deobfuscate` commands; helpers `walk`,
  `findAssetDirs`, `shouldRemoveOriginalFile`, `processSingleFile`,
  `processTargets`, `createCliProgram`.
- `src/cli-utils.ts` — **duplicate** set of the same helpers, exported but
  never imported anywhere (dead/duplicate code — see §13).

**Subpath exports** (`package.json:6-84`): `./browser`, `./node`, `./common`,
`./jwt`, `./integration`, `./integration/services/crypto`,
`./integration/services/jwt` — each dual ESM/CJS with `.d.mts`/`.d.cts`.
Root `main` → `./lib/cjs/index.cjs`, `module` → `./lib/esm/index.js`,
`browser` → `./lib/esm/browser/index.js`. There is **no** `./common/crypto`
subpath. The `decaf-crypto` bin is built via `postbuild:prod`
(`bin/prepare-cli-bin.mjs`) which prepends a shebang and `chmod 755`s the CLI
output.

#### 5. Public API surface
- **From `./common`** (`src/common/index.ts`): all WebCrypto type modules
  (`AesKeyAlgorithm`, `HmacKeyGenParams`, `RsaHashedImportParams`,
  `EcKeyGenParams`, `EcdsaParams`, `NamedCurve`, `Algorithm`,
  `KeyFormat`, `KeyType`, `KeyUsage`, `Pbkdf2Params`, `HkdfParams`,
  `CryptoKey`, `CryptoKeyPair`, `JsonWebKey`), the `SubtleCrypto` interface,
  `getCrypto(isBrowser?)`, `getSubtle()`, version constants. (Internal and
  not barrel-exported: `arrayBufferToHex`, `hexToArrayBuffer`,
  `getDerivedKey`, `encryptContent`, `decryptContent`.)
- **From `./browser`**: `Subtle` (`window.crypto.subtle`), `Crypto`
  (`window.crypto`), version constants.
- **From `./node`**: `Subtle` (`crypto.subtle`), `Crypto` (Node `crypto`),
  `Obfuscation` class, `Pbkdf2Hash` type, `pbkdf2Hash`, `verifyPbkdf2`
  (`genSalt` is module-private — not `export`-prefixed in `pbkdf2.ts:28`,
  despite the `export *`), version constants.
- **From `./jwt`**: `sign(obj, option)`, `verify<OBJ>(token, option)`/
  `verifyJwt`, `decodeJwtPayload`, `getTokenPayload`, `getUser`, `JwtOptions`,
  `JwtClaims`, version constants.
- **From `./integration`**: `CryptoKeys` enum, `CryptoError`, `encrypt`
  decorator, `encryptOnCreate`, `encryptOnRead`, `encryptOnUpdate`,
  `CryptoMeta`, `SecretFunction`. (Services are **not** re-exported here.)
- **From `./integration/services/crypto`**: `CryptoService` class,
  `CryptoServiceConfig` interface.
- **From `./integration/services/jwt`**: `JwtService` class; re-exports
  `decodeJwtPayload`, `getTokenPayload`, `getUser`.
- **From the root (`@decaf-ts/crypto`)**: `./overrides` (no named runtime
  exports — patches the prototype) + `./common` + version.
- **CLI** (not programmatic): `decaf-crypto` with `encrypt`, `decrypt`,
  `obfuscate`, `deobfuscate` subcommands (`src/cli-module.ts:637-647`).

#### 6. Key patterns & concepts
- **SubtleCrypto wrappers / browser-vs-node split.** The `SubtleCrypto`
  interface (`src/common/Subtle.ts:43`) is a hand-written mirror of WebCrypto.
  Two concrete singletons: browser aliases `window.crypto.subtle`, node
  aliases `crypto.subtle`. `getSubtle()` picks one via
  `!!(globalThis as any).window` and dynamically `import()`s the matching
  barrel through `normalizeImport` from `@decaf-ts/core`. Same for
  `getCrypto()`. This is a registry-free runtime environment probe, not a
  registered lookup.
- **Encryption decorators.** `@encrypt(secret, algorithm)`
  (`src/integration/decorators.ts:349`) is built with the
  `Decoration.for(...).define(...).apply()` fluent registry from
  `@decaf-ts/decoration`. It composes three `@decaf-ts/db-decorators`
  lifecycle hooks: `onCreate(encryptOnCreate, ...)`, `afterRead(encryptOnRead,
  ...)`, `onUpdate(encryptOnUpdate, ...)` (`decorators.ts:366-371`).
  `CryptoMeta` carries a static secret string or a `SecretFunction` resolved
  per-operation. Ciphertext is stored as a hex string = IV(12 bytes) ‖
  ciphertext+tag (`decorators.ts:181-184`).
- **CryptoService.** A `ClientBasedService<typeof Crypto,
  CryptoServiceConfig>` whose underlying client is the Node `Crypto` module.
  `initialize()` boots by calling `getCrypto()` and storing config
  (`CryptoService.ts:36-48`). Defaults: `aesGcm = {length:256}`,
  `ivLength = 12`. Provides a "simple API" (`encrypt`/`decrypt` deriving a
  key from a secret via PBKDF2 100k iterations, returning
  `{encryptedData, iv, salt}` base64) and a "low-level API"
  (`encryptPayload`/`decryptPayload` with a pre-derived key). It is Node-only
  (imports `../../node/Crypto` and `../../node/pbkdf2` directly).
- **JwtService.** `ClientBasedService<void, JwtOptions>` — no underlying
  client. Exposes `fromHeader`, `decodePayload`, `getTokenPayload`,
  `getUser`, `createJwt`/`createAuthJwt`, `decodeJwt`/`decodeAuthToken`.
  Verification can use a remote JWKS endpoint (`verifyUrl`) with an in-memory
  cache, fall back to HS256 symmetric, or decode-only when no verification
  config is supplied (`verify.ts:59-94`).
- **Overrides / sideEffects.** `src/overrides/ModelBuilderExtensions.ts` uses
  `declare module` augmentation to add `encrypt`/`decorateClass` to
  `ModelBuilder<M>`, then mutates `ModelBuilder.prototype` at import time.
  `package.json:156-159` declares `sideEffects` for the override output files
  and `src/index.ts:14` imports `./overrides` first so bundlers preserve it.
- **CLI (`decaf-crypto`).** `createCliProgram()` builds a `commander` program
  named `"crypto"` with four subcommands. `encrypt`/`decrypt` use
  `CryptoService`; `obfuscate`/`deobfuscate` use `Obfuscation` and can
  auto-discover `assets` directories under `lib`/`dist`/`src` roots.
- **No class registry; the only "factory" is the environment probe in
  `getSubtle`/`getCrypto`. The decorator registry is `Decoration` from
  `@decaf-ts/decoration` keyed by `CryptoKeys.ENCRYPTED`. Services are
  `ClientBasedService` subclasses, not a local registry.

#### 7. Lifecycle / configuration / environment
- **Initialization.** No global init required for the low-level API:
  `getSubtle()`/`getCrypto()` lazily dynamic-import the environment impl on
  first call (`subtle-crypto.ts:38-41`). `CryptoService`/`JwtService` require
  explicit `boot(config)` (inherited from `ClientBasedService`); their
  `initialize()` methods validate config and, for `CryptoService`, call
  `getCrypto()`.
- **Environment selection.** Detection is `!!(globalThis as any).window`
  (`crypto.ts:17`, `subtle-crypto.ts:35`). `getCrypto<BROWSER>(isBrowser)`
  accepts an override argument; `getSubtle()` does not.
- **Algorithm / key defaults.** JWT sign: HS256, `typ: "JWT"`,
  `setIssuedAt()`, `setExpirationTime(option.expiry || "5m")` (`sign.ts:41-45`).
  JWT verify: HS256 with `algorithms: ["HS256"]` for secret mode; JWKS mode
  passes optional `clockTolerance`. `@encrypt`: AES-GCM with a 12-byte random
  IV; key imported raw from the UTF-8 secret. `CryptoService`:
  `DEFAULT_AES_GCM = {length:256}`, `DEFAULT_IV_LENGTH = 12`;
  `deriveKeyFromSecret` uses `pbkdf2Sync` 100k iterations, 32-byte key,
  sha256, 16-byte salt. `pbkdf2Hash`: 150k iterations, 32-byte key. `Obfuscation`:
  `aes-256-gcm`, `scrypt` to 32 bytes, 16-byte salt, 12-byte IV, 16-byte tag,
  gzip level 9, magic `DECAF1`.
- **Environment variables.** Only one `process.env` reference in `src/`:
  `Obfuscation.getKeyMaterial()` reads `process.env.ENCRYPTION_KEY || ""`
  (`node/Obfuscation.ts:31-33`) — but it is never called by
  `obfuscate`/`deobfuscate` (which take an explicit `secret`) and appears
  vestigial.
- **Key management.** No key store; secrets passed per-call. `CryptoService`
  derives keys per-operation from a secret+salt and returns the salt so
  callers persist it. JWKS cached per-URL in a module-level `Map`
  (`verify.ts:6,25-32`).
- **Overrides mechanism.** Side-effect import of `src/overrides/index.ts`
  (triggered by `src/index.ts:14`) patches `ModelBuilder.prototype`;
  `package.json:156-159` marks those output files as having side effects.

#### 8. Data & control flow
**Encrypt via `@encrypt` on create** (`src/integration/decorators.ts:156-185`):
1. Repository `create()` triggers `onCreate` → `encryptOnCreate`.
2. If `model[key]` undefined, return. Resolve secret via `getCryptoSecret`,
   `getSubtle()`, `getDerivedKey` → `subtle.importKey("raw",
   TextEncoder.encode(secret), algorithm, true, ["encrypt","decrypt"])`.
3. `dataToEncrypt = TextEncoder.encode(JSON.stringify(model[key]))` — value
   is JSON-stringified.
4. `getCrypto()` → `crypto.getRandomValues(new Uint8Array(12))` for IV.
5. `subtle.encrypt({name: algName, iv}, derivedKey, dataToEncrypt)`.
6. Combine `IV ‖ ciphertext`, `arrayBufferToHex` → store hex string on
   `model[key]`.

**Decrypt on read** (`decorators.ts:193-220`): `hexToArrayBuffer` → split
first 12 bytes as IV, rest as ciphertext → `subtle.decrypt(...)` →
`JSON.parse(TextDecoder.decode(...))` written back.

**JWT sign/verify**: `sign` requires `option.secret`; `key =
TextEncoder().encode(secret)`; `new SignJWT({...obj})
.setProtectedHeader({alg:"HS256",typ:"JWT"}).setIssuedAt()
.setExpirationTime(option.expiry||"5m").sign(key)`. `verify`: if
`option.verifyUrl` → `jwtVerify(token, jwksFor(url), {clockTolerance?})`
throwing `AuthorizationError`; else if `option.secret` →
`jwtVerify(token, secretKey, {algorithms:["HS256"]})`; else decode-only.

**CLI encrypt** (`cli-module.ts:226-308`): validates `--secret` and exactly
one of `--file`/`--data`; `new CryptoService()` + `boot(...)`; `cryptoService.encrypt(content, secret)`
→ JSON `{encryptedData, iv, salt}` to `--out` or stdout.

#### 9. Testing
- `tests/unit/crypto.test.ts` — SubtleCrypto basic AES-GCM encrypt/decrypt,
  key generate/export/import, tamper-failure; `encryptOnCreate`/
  `encryptOnRead`/`encryptOnUpdate` decorator logic with mock `Repo`/context;
  JWT sign/verify/tamper/expiry/wrong-secret.
- `tests/unit/cli.test.ts` — full CLI coverage: `encrypt`, `decrypt`,
  `obfuscate`, `deobfuscate`, error/exit-code paths, `--remove-original`
  variants, assets-dir auto-discovery; mocks `fs` and `process.exit`.
- `tests/unit/crypto-service.test.ts` — `CryptoService` key derivation,
  simple/low-level encrypt/decrypt, error handling, custom vs default config,
  `.for()` config-switching.
- `tests/unit/model-builder.extensions.test.ts` — verifies
  `ModelBuilder.encrypt(...)` sets `CryptoKeys.ENCRYPTED` metadata.
- `tests/integration/encrypt.test.ts` — end-to-end `@encrypt` with
  `RamAdapter` (`@decaf-ts/core/ram`): create/read/update/
  unchanged-update/undefined-field/`mergeForUpdate:false`, and manual
  SubtleCrypto verification of stored hex.
- **Fuzz tests:** `test:fuzz` script + `fast-check` devDep configured, but
  **no `*.fuzz.ts` files exist** — the harness is configured but unwritten.
- **`test:dist`** (`package.json:104`): re-runs the suite against built `lib`
  and `dist` via `TEST_TARGET`. `jest.config.cjs` maps `@decaf-ts/core/ram`
  to CJS and special-cases `jose` transform.
- **Coverage gaps:** no tests for `src/common/utils.ts` (unexported
  helpers), `Obfuscation` (only indirectly via CLI), `pbkdf2Hash`/
  `verifyPbkdf2`, `JwtService` (only `sign`/`verify` functions tested),
  `getCrypto`, or the `verifyUrl`/JWKS path of `verify`.

#### 10. Usage example
Minimal `@encrypt` decorator end-to-end with a repository (from
`tests/integration/encrypt.test.ts:9-57`):
```typescript
import { model, Model, required } from "@decaf-ts/decorator-validation";
import { pk, table, Repository } from "@decaf-ts/core";
import { RamAdapter } from "@decaf-ts/core/ram";
import { encrypt } from "../../src/integration/decorators";
import { uses } from "@decaf-ts/decoration";

const SECRET = "integration-test-secret-32bytes!"; // 32 bytes for AES-256 raw key
const ALGORITHM = { name: "AES-GCM", length: 256 };

@uses("ram")
@table("secret_notes")
@model()
class SecretNote extends Model {
  @pk() noteId!: number;
  @required() title!: string;
  @encrypt(SECRET, ALGORITHM) secret?: string;
  constructor(data?: Partial<SecretNote>) { super(data); }
}

adapter = new RamAdapter({ UUID: "test" });
repo = Repository.forModel(SecretNote);
const note = new SecretNote({ title: "my note", secret: "top-secret-value" });
const created = await repo.create(note);          // secret stored as hex
const fetched = await repo.read(created.noteId);  // secret decrypted back
expect(fetched.secret).toBe("top-secret-value");
```
Minimal JWT sign/verify (from `tests/unit/crypto.test.ts:331-349`):
```typescript
import { sign, verify } from "../../src/jwt/index";
const secret = "your-jwt-super-secret-key-of-atleast-32-chars";
const payload = { userId: "user123", role: "admin" };
const token = await sign(payload, { secret, expiry: "1h" });
const verifiedPayload = await verify(token, { secret });
expect(verifiedPayload).toEqual(expect.objectContaining(payload));
```

#### 11. Relationships
- **`@decaf-ts/core`** (optional): `normalizeImport` (dual CJS/ESM dynamic
  imports), error classes (`AuthorizationError`), and the
  `ClientBasedService`/`Repo`/`ContextualArgs`/`PersistenceKeys`/
  `MaybeContextualArg` infrastructure. `@decaf-ts/core/ram` used in
  integration tests.
- **`@decaf-ts/db-decorators`** (optional): `InternalError` (base for
  `CryptoError`) and the lifecycle decorators `onCreate`/`onUpdate`/
  `afterRead` that `@encrypt` composes.
- **`@decaf-ts/decoration`** (optional): the `Decoration.for(...).define()
  .apply()` registry and `propMetadata`/`Metadata`/`apply` used to define and
  attach `@encrypt`; `description` for services.
- **`@decaf-ts/decorator-validation`** (optional): `Model`/`ModelBuilder`
  base classes; the `overrides` module augments `ModelBuilder` with an
  `encrypt(...)` fluent builder method.
- **`@decaf-ts/logging`** (dev): CLI logging only.
- **`@decaf-ts/utils`** (dev): declared but no import found in `src/`.
- **`jose`** (runtime): sole hard dependency; powers all JWT operations and
  supplies the `CryptoKey` type.
- **Consumer (`@decaf-ts/integrations`)**: blob storage uses
  `getCrypto`/`getSubtle`; secrets module uses `CryptoService`; Nest/keycloak
  handler uses `JwtService`.

#### 12. Consumer notes
- **Optional dependencies are not truly optional for most entry points.**
  Despite `package.json` listing `@decaf-ts/core`,
  `db-decorators`, `decoration`, `decorator-validation` as
  `optionalDependencies`, the core `./common` loaders `getSubtle`/`getCrypto`
  `import { normalizeImport } from "@decaf-ts/core"` and `InternalError` from
  `@decaf-ts/db-decorators`. So even the "common" subpath requires those
  packages at runtime; the "optional integration" wording in the README is
  misleading.
- **Dual ESM/CJS** with per-subpath `import`/`require` conditions. Jest maps
  `@decaf-ts/core/ram` to CJS and special-cases `jose` transformation.
- **`sideEffects` overrides.** Importing the root triggers
  `import "./overrides"` which mutates `ModelBuilder.prototype`, preserved by
  the `sideEffects` declaration. Importing only `./jwt` or `./node` avoids
  the side effect.
- **Browser vs node selection is runtime, not build-time.**
  `getSubtle()`/`getCrypto()` decide via `globalThis.window`. The `browser`
  field points bundlers to `./lib/esm/browser/index.js`.
- **`./integration` barrel does not include services.** Use
  `@decaf-ts/crypto/integration/services/crypto` and `.../services/jwt` for
  `CryptoService`/`JwtService`.
- **`CryptoService` is Node-only** — it directly imports Node `Crypto`/
  `pbkdf2`; do not use it in a browser bundle.
- **Version pinning.** All decaf optional/dev deps pinned to `"latest"` —
  installs are non-reproducible across decaf versions; `package-lock.json` is
  the only stabilization.
- **CLI bin path.** `decaf-crypto` → `lib/cjs/bin/cli.cjs`; `postbuild:prod`
  adds the shebang.
- **Maturity.** Version `0.14.3` (pre-1.0); `workdocs/reports/DEPENDENCIES.md`
  shows a stale `@decaf-ts/crypto@0.0.1` header. README references a `docs/`
  directory but no `docs/` exists in the working tree.

#### 13. Inaccuracies found
1. **[crypto]** README import path — `@decaf-ts/crypto/common/crypto` subpath does not exist. | Evidence: `README.md:141` `import { getSubtle } from '@decaf-ts/crypto/common/crypto'; // Assuming this path`; `package.json:73-83` exports only `./common` (no `./common/crypto`). | Suggested fix: change to `import { getSubtle } from '@decaf-ts/crypto/common';` and remove the hedge.
2. **[crypto]** README `@encrypt` sequence diagram contradicts implementation. | Evidence: `README.md:108-129` describes `onUpdate` decrypting the old value, comparing plaintexts, and skipping re-encryption when "Data is the same"; actual `encryptOnUpdate` always re-encrypts — the `if (hasOldModel)` block at `src/integration/decorators.ts:262-273` is empty with only comments, and execution falls through to encryption at `:276-292`. | Suggested fix: update the diagram to reflect the value is always re-encrypted with a fresh IV.
3. **[crypto]** `src/cli-utils.ts` is duplicate/dead code. | Evidence: `src/cli-utils.ts:14-234` exports `walk`, `findAssetDirs`, `shouldRemoveOriginalFile`, `processSingleFile`, `processTargets`, but `src/cli-module.ts` defines its own local copies (`cli-module.ts:20-218`) and never imports `cli-utils`; no file in `src/` or `tests/` imports it. The two `processSingleFile` implementations also diverge. | Suggested fix: delete `src/cli-utils.ts` or have `cli-module.ts` import from it.
4. **[crypto]** `./integration` barrel does not export `getCrypto`/`getSubtle`, but a consumer imports them from there. | Evidence: `src/integration/index.ts:1-3` only re-exports `./constants`, `./decorators`, `./errors`; consumer `integrations/src/secrets/model/ModelSecretCrypto.ts:2` does `import { getCrypto, getSubtle } from "@decaf-ts/crypto/integration";`. | Suggested fix: add `export { getCrypto } from "../common/crypto"; export { getSubtle } from "../common/subtle-crypto";` to `src/integration/index.ts` (or change the consumer import).
5. **[crypto]** Dockerfile copies a non-existent `.mpmrc` and uses a wrong ENTRYPOINT path. | Evidence: `Dockerfile:14` `COPY ./.mpmrc $WORKDIR/` (typo; file is `.npmrc`); `Dockerfile:42` `ENTRYPOINT ["node", "lib/cli.cjs"]` but the built CLI is at `lib/cjs/bin/cli.cjs` (`package.json:88`). | Suggested fix: `.mpmrc` → `.npmrc`; entrypoint → `["node", "lib/cjs/bin/cli.cjs"]`.
6. **[crypto]** `CryptoService.initialize` has dead validation. | Evidence: `src/integration/services/CryptoService.ts:42-44` does `const cfg = (args[0] ...) || {}; if (!cfg) throw ...` — since `cfg` defaults to `{}`, `!cfg` is never true. | Suggested fix: validate required fields inside `cfg` or remove the dead `if (!cfg)` block.
7. **[crypto]** README `@encrypt` example secret is the wrong length for AES-256 raw import. | Evidence: `README.md:71` uses a 36-byte secret with `{name:"AES-GCM", length:256}`; `getDerivedKey` imports it as a raw AES-GCM key (`decorators.ts:108-117`), and WebCrypto AES-GCM raw import only accepts 16/24/32-byte material. Tests use 32-byte secrets. | Suggested fix: replace the README secret with a 32-byte string.
8. **[crypto]** README example uses decorators not present in the documented import. | Evidence: `README.md:56` imports `Model, prop` from `@decaf-ts/decorator-validation` and applies `@Model()`; the integration test uses `model, Model, required` and `@model()`/`@pk()`/`@required()`. | Suggested fix: align the README with the tested decorators.
9. **[crypto]** `node/pbkdf2.ts` `genSalt` is not actually exported despite `export *`. | Evidence: `src/node/pbkdf2.ts:28` declares `function genSalt(...)` without `export`, so `export * from "./pbkdf2"` cannot re-export it; JSDoc/barrel imply it is public. | Suggested fix: add `export` to `genSalt` or remove it from the documented surface.
10. **[crypto]** `Obfuscation.getKeyMaterial` reads an env var that is never used. | Evidence: `src/node/Obfuscation.ts:31-33` defines `static getKeyMaterial()` returning `process.env.ENCRYPTION_KEY || ""`, but `obfuscate`/`deobfuscate` take an explicit `secret` and never call it. | Suggested fix: remove `getKeyMaterial` or wire it as a default when `secret` is omitted.
11. **[crypto]** Stale generated DEPENDENCIES report version. | Evidence: `workdocs/reports/DEPENDENCIES.md` header reads `@decaf-ts/crypto@0.0.1` while `package.json:3` is `0.14.3`. | Suggested fix: regenerate the dependencies report during `prepare-release`.
12. **[crypto]** README/docs do not document the `decaf-crypto` CLI. | Evidence: `package.json:87-89` ships a `decaf-crypto` bin with four commands, but `README.md`/`workdocs/5-HowToUse.md` only cover the `@encrypt` decorator, raw `SubtleCrypto`, and JWT — no CLI usage. | Suggested fix: add a CLI section documenting the subcommands and flags.
13. **[crypto]** `README.md:142` comment "Assuming CryptoKey is exported here" is unverified. | Evidence: `README.md:142` `import { CryptoKey } from '@decaf-ts/crypto/common'; // Assuming CryptoKey is exported here` — `CryptoKey` is in fact exported (`common/crypto-types.ts:21` re-exported via `common/index.ts:15`); the hedge is unnecessary and the adjacent `./common/crypto` path (finding #1) is wrong. | Suggested fix: remove the "Assuming" comment; keep the `./common` import.

---

### as-zod (`@decaf-ts/as-zod` v1.14.1)

#### 1. Identity
- **Directory:** `/workspaces/decaf-ts/as-zod` (a git submodule)
- **Package name:** `@decaf-ts/as-zod` (`package.json:2`)
- **Version:** `1.14.1` (`package.json:3`; git tag `v1.14.1` confirmed)
- **Description:** `"Zod compatibility library"` (`package.json:4`)
- **License:** MIT (`package.json:98`); author `Tiago Venceslau and
  Contributors` (`package.json:84`)
- **Module type:** `"type": "module"` (`package.json:5`); dual ESM/CJS export
  map; `sideEffects: false` (`package.json:101`)
- **Engines:** `node >=20.0.0`, `npm >=10.0.0` (`package.json:63-66`)

#### 2. Purpose & role
`@decaf-ts/as-zod` is a small addon that provides two-way conversion between
decaf decorated `Model` classes (defined via `@decaf-ts/decoration` +
`@decaf-ts/decorator-validation` metadata) and Zod schemas. It sits as a peer
of the validation layer: it reads decorator/validation metadata already
produced by `decorator-validation` and reflects it into Zod v4 schemas (and
back), so any decaf `Model` can be validated/parsed with Zod and any Zod
`ZodObject` can be materialized into a decaf `Model` constructor. Per
`README.md:39`, `^0.0.1` targets Zod 3.x and `^1.0.0` targets Zod 4.x.

#### 3. Dependencies
- **peerDependencies** (`package.json:93-97`):
  - `@decaf-ts/decoration`: `latest`
  - `@decaf-ts/decorator-validation`: `latest`
  - `zod`: `^4.4.3`
- **devDependencies** (`package.json:89-92`): `@decaf-ts/utils` (`latest`),
  `@types/jest ^30.0.0`.
- **Runtime imports observed in `src/`:**
  - `@decaf-ts/decoration` — `Metadata`, `Constructor` (`src/overrides.ts:19`,
    `src/zod.ts:2`, `src/index.ts:1`).
  - `@decaf-ts/decorator-validation` — `Model`, `ModelBuilder`,
    `AttributeBuilder`, `ModelKeys`, `TypeMetadata`, `Primitives`,
    `DEFAULT_ERROR_MESSAGES`, many `*ValidatorOptions`, `ListMetadata`,
    `ExtendedMetadata`, `ValidationKeys` (`src/overrides.ts:1-43`).
  - `zod` — numerous Zod schema classes and the `z` namespace
    (`src/overrides.ts:20-42`, `src/zod.ts:3-15`).
- **Installed resolved versions:** `@decaf-ts/decoration@0.18.3`,
  `@decaf-ts/decorator-validation@1.22.2`, `zod@4.4.3`.
- **`@decaf-ts/utils`** is a devDependency only — not imported by `src/`.
- **Modules that depend on `@decaf-ts/as-zod`** (monorepo scan): only
  `@decaf-ts/integrations` (`/workspaces/decaf-ts/integrations/package.json:378`
  devDependency, `:397` peerDependency). However, `integrations` declares the
  dependency but does **not** actually `import` it — the only references are
  JSDoc comments in `integrations/src/graph/engine/validation/GraphPortSchemaResolver.ts:4,14`
  ("Prefers `@decaf-ts/as-zod`…", "should use `modelToZod` from
  `@decaf-ts/as-zod`"). No `from "@decaf-ts/as-zod"` import exists anywhere in
  the monorepo outside `as-zod` itself.

#### 4. Architecture & structure
The package is intentionally minimal — a single barrel export `.` and only
three source files:
- `src/index.ts` — Barrel: re-exports `zod.ts` + `overrides.ts`, defines
  `VERSION`/`COMMIT`/`FULL_VERSION` placeholders, registers the library with
  `Metadata.registerLibrary`.
- `src/zod.ts` — Type-level layer: conditional types mapping TS/Model
  property types to Zod schema types; module augmentation declaring
  `z.from()` / `z.toModel()` on the `z` namespace.
- `src/overrides.ts` — Runtime engine: `ZodModelBuilder`/`ZodAttributeBuilder`,
  `zodify()`, `zodifyValidation()`, `modelToZod()`, `zodToModel()`,
  `z.from`/`z.toModel` monkey-patch onto the `z` namespace.

Subsystems within `overrides.ts`:
- **Reserved-key filtering / helpers** (`:45-238`): `ReservedKeys`,
  `isReservedKey`, `sanitizeClassName`, schema-name tagging
  (`AS_ZOD_MODEL_NAME`), `unwrapSchema` (peels `ZodOptional`/`ZodNullable`/
  `ZodLazy`/`ZodUnion` of null|undefined).
- **Model→Zod builders** (`:240-433`): `ZodAttributeBuilder` (per-attribute
  schema construction from decorator data) and `ZodModelBuilder` (assembles
  `z.object(...)` from all attributes).
- **Type→Zod primitives** (`:435-490`): `zodify()` switch over
  primitive/container/model names; resolves nested models via `Model.get`/
  `z.from`.
- **Validation→Zod refinements** (`:492-542`): `zodifyValidation()` maps
  `ValidationKeys` (MIN/MAX/MIN_LENGTH/MAX_LENGTH/STEP/ENUM/PATTERN/URL/
  EMAIL/PASSWORD/DATE) to Zod chain calls.
- **Top-level model→Zod** (`:544-557`): `modelToZod()`.
- **Zod→Model engine** (`:559-894`): `applyStringChecks`/`applyNumberChecks`/
  `applyDateChecks`/`applyArrayChecks`/`applySetChecks`, `resolveTypeRefs`,
  `applySchemaToAttribute`, `buildModelFromSchema`, `zodToModel()`; recursive
  build state via `ZodToModelContext` (WeakMap states + in-progress WeakSet).
- **z-namespace patching** (`:896-932`): `zFrom`, `zToModel`, and guarded
  `Object.defineProperty(z, "from"|"toModel", ...)` because Zod v4's `z`
  export may be sealed/non-extensible.

#### 5. Public API surface
From the barrel `src/index.ts` (re-exports `./zod` and `./overrides`, plus
three build placeholders):
- **Type-only exports (from `zod.ts`):**
  - `ZodSchemaFor<T>` (`zod.ts:43`) — maps a TS property type to a Zod schema
    type, wrapping in `ZodOptional`/`ZodNullable` as needed.
  - `ZodShapeFor<M>` (`zod.ts:50`) — derives a Zod object shape from a Model
    instance type, dropping function members.
  - `ZodFrom<M>` (`zod.ts:58`) — `ZodObject<ZodShapeFor<M>>`, the inferred Zod
    object for a Model constructor.
  - `ModelFromZod<S, M>` (`zod.ts:62`) — `Constructor<M>` returned when
    translating a Zod schema back to a Model.
  - `ListOf<T>`, `SetOf<T>` (`zod.ts:69-70`) — helpers to explicitly specify
    collection element types.
  - Module augmentation `declare module "zod"` adding `z.from`/`z.toModel`
    to the `z` namespace (`zod.ts:72-81`).
- **Runtime exports (from `overrides.ts`):**
  - `zodify(type, zz?)` (`:435`) — convert a type name (or array of names →
    union) into a Zod schema; resolves registered Models recursively.
  - `zodifyValidation(zod, type, values)` (`:492`) — apply a single decorator
    validation (min/max/length/step/enum/pattern/url/email/password) to a Zod
    schema.
  - `modelToZod<M, META>(model)` (`:544`) — accept a Model instance or
    constructor and return a `ZodObject`.
  - `zodToModel<M>(schema, name?)` (`:878`) — accept a `ZodObject` and return
    a generated `Constructor<M>`.
  - `zFrom<M>(model)` / `zToModel<M>(schema, name?)` (`:897,901`) —
    convenience wrappers attached to the `z` namespace.
- **Build metadata constants (from `index.ts`):** `VERSION`, `COMMIT`,
  `FULL_VERSION` (placeholders replaced at publish).
- **Side effect on import:** `Metadata.registerLibrary("@decaf-ts/as-zod",
  VERSION)` (`index.ts:31`); patching `z.from`/`z.toModel` onto `z`
  (`overrides.ts:908-931`).
- The generated JSDoc site only documents `COMMIT` and `FULL_VERSION` as
  Global members — the converter/mapper functions are not represented in the
  rendered docs.

#### 6. Key patterns & concepts
- **Metadata source.** Conversion is driven entirely by reflection metadata
  produced by `@decaf-ts/decoration` (`Metadata.get`) and
  `@decaf-ts/decorator-validation` (`ExtendedMetadata`, `validation`,
  `properties`, `description`). `ZodModelBuilder.decoratorDataFor`
  (`overrides.ts:358-386`) reads `metadata.validation[prop]` and, if no
  explicit `ValidationKeys.TYPE` is present, falls back to the TS design-time
  type stored under `metadata.properties[prop]`, synthesizing a `TypeMetadata`
  with `customTypes: [typeName]`.
- **Model→Zod pipeline.** `modelToZod` → `new ZodModelBuilder` →
  `toZodObject()` (`:388`): enumerate attributes via
  `Model.getAttributes(this.target)`, skip non-string/`constructor`/
  underscore-prefixed/function-valued props, skip props with no decorator
  data; for each remaining prop build a `ZodAttributeBuilder`, call
  `buildSchema()` (require `ValidationKeys.TYPE` else throw "Missing type
  information"), call `zodify(customTypes, ...)` for the base schema,
  iterate remaining non-reserved decorator keys calling `zodifyValidation`,
  wrap `.optional()` when not `@required`, attach `.describe(description)`;
  assemble `z.object(result)` and tag with the class name.
- **Type→Zod mapping** (`zodify`, `:435-490`), keyed on lowercased type
  names: `string`→`z.string()`, `number`→`z.number()`, `bigint`→`z.bigint()`,
  `boolean`→`z.boolean()`, `date`→`z.date()`, `object`/`any`→`z.any()`,
  `unknown`→`z.unknown()`, `array`→`z.array(elementSchema)` (from `@list`
  types), `set`→`z.set(elementSchema)` plus a synthetic non-enumerable
  `valueSchema` getter (Zod v4 `ZodSet` lacks a public one); default → look up
  a registered Model via `Model.get(type)` and recurse via `z.from(m)`,
  throw `"Unzodifiable type"` if unregistered; multiple types →
  `zod.or(...)` union.
- **Validation→Zod refinements** (`zodifyValidation`, `:492-542`):
  `MIN`/`MAX`/`MIN_LENGTH`/`MAX_LENGTH`→`.min`/`.max`; `STEP`→`.multipleOf`;
  `ENUM`→`z.enum`/`z.literal`/`z.union` of literals; `PATTERN`/`URL`/`EMAIL`/
  `PASSWORD`→`.regex(new RegExp(pattern, "g"))`; `DATE` throws `TypeError`
  because the date decorator is handled through `@type(Date)`. Reserved keys
  (`REQUIRED`, `TYPE`, `DATE`, `ModelKeys.TYPE`) are skipped.
- **Zod→Model pipeline.** `zodToModel` (`:878`) requires a `ZodObject` at
  root. It creates a `ZodToModelContext` (`:71-83`) holding
  `WeakMap<schema, BuildState>`, an `inProgress` `WeakSet`, and a `sequence`
  counter. `buildModelFromSchema` (`:840`) uses `ModelBuilder.builder()`, sets
  a sanitized class name, applies the schema description, then iterates
  `schema.shape` calling `applySchemaToAttribute`. `resolveTypeRefs` (`:684`)
  maps Zod schema classes to decaf constructor refs (`String`, `Number`,
  `Boolean`, `BigInt`, `Date`, `Object`, nested `ZodObject`→recursively built
  model, `ZodEnum`/`ZodLiteral`→enum values, `ZodUnion`→flattened refs).
  `unwrapSchema` (`:154-208`) peels `ZodOptional`/`ZodNullable`/`ZodLazy` and
  unwraps unions of `null`/`undefined`. `applySchemaToAttribute` (`:786`)
  chooses the right `AttributeBuilder` method and applies `apply*Checks` to
  translate Zod checks back into decaf decorators, marking `required()` when
  not optional. Recursive schemas are supported via `BuildState.ref` (a lazy
  getter that throws `"Recursive Zod schema referenced before model build"`
  if used too early) and the `inProgress` WeakSet.
- **Registries/factories.** No dedicated registry/factory class; relies on
  `Model.get(type)` (the `decorator-validation` global model registry) and
  `ModelBuilder.builder()`/`AttributeBuilder`. The only registry interaction
  is `Metadata.registerLibrary` at import time.

#### 7. Lifecycle / configuration / environment
- **Invocation.** Conversion is purely functional — call `z.from(ModelClass)`
  / `modelToZod(instanceOrCtor)` / `zodToModel(zodObject, name?)` /
  `zodify(...)` directly. No setup object, no DI, no configuration step
  beyond importing the package (side-effect import registers the library and
  patches `z.from`/`z.toModel`).
- **Environment variables.** No `process.env` references in `src/`. The
  package reads no environment variables at runtime. (Scripts in
  `package.json` use shell env vars like `NPM_TOKEN`/`VERSION`/`TOKEN` but
  those are build/CI concerns.)
- **Defaults.** Non-`@required` attributes become `.optional()`; undecorated/
  private (`_`-prefixed)/function properties are omitted; generated class
  names default to `GeneratedModel<n>` and are sanitized via
  `sanitizeClassName`; nested model names are derived from the property path.
- **Zod version handling.** Peer dep `zod ^4.4.3`. The code is Zod-v4-aware:
  (a) reading `_zod.def` via `checkDef(check)` to handle Zod v4's check shape;
  (b) the synthetic `valueSchema` getter added to `ZodSet` because Zod v4
  does not expose it; (c) the guarded `Object.defineProperty` patching of
  `z.from`/`z.toModel` with a comment noting "In zod v4+ the `z` export is
  sealed (non-extensible)". The README/versioning contract states `^1.0.0`
  ⇒ Zod 4.x.
- **Type-level augmentation.** `declare module "zod"` (`zod.ts:72-81`) adds
  `z.from`/`z.toModel` to the `z` namespace types, matching the runtime patch.

#### 8. Data & control flow
Trace for a decorated model (e.g. `PasswordTestModel` in
`tests/unit/zod.test.ts:34-45`):
1. `import "../../src"` — triggers `index.ts` (registers library) and
   `overrides.ts` (patches `z.from`/`z.toModel` onto `z`).
2. `z.from(PasswordTestModel)` → `zFrom` → `modelToZod(PasswordTestModel)`
   (`overrides.ts:544`).
3. `modelToZod` resolves the constructor, reads full metadata via
   `Metadata.get(ctor)`, constructs `ZodModelBuilder(ctor, metadata)`, calls
   `toZodObject()`.
4. `toZodObject()`: `Model.getAttributes` returns `["password"]`;
   `decoratorDataFor` gathers `{TYPE, REQUIRED, PASSWORD, MIN_LENGTH}` (and
   description); `ZodAttributeBuilder.buildSchema()` is invoked.
5. `buildSchema`: `typeData.customTypes = ["String"]` → `zodify(["String"])`
   → `z.string()`. `PASSWORD`/`MIN_LENGTH` → `zodifyValidation` maps
   `MIN_LENGTH`→`.min(8)` and `PASSWORD`→`.regex(new RegExp(pattern, "g"))`.
   `REQUIRED` is reserved (skipped) but its presence prevents `.optional()`.
   `.describe("the password attribute")` applied.
6. `z.object({ password })` built; class description `"A simple password
   model"` applied via `.describe()`; schema tagged with `"PasswordTestModel"`.
7. Caller validates: `asZod.safeParse("short")` returns failure, and the
   resulting string checks contain `min_length:8` and
   `string_format: "regex"`.

Reverse flow (Zod → Model): `z.object({...}).describe("Round trip model")` →
`z.toModel(source, "RoundTripModel")` → `zodToModel` → `buildModelFromSchema`
→ `applySchemaToAttribute` per field → `ModelBuilder.build()`; then
`z.from(RoundTripModel)` round-trips back and `safeParse` enforces the same
constraints.

#### 9. Testing
- **Structure.** Only `tests/unit/` exists (`tests/` contains a single
  `unit` subdirectory; there is no `tests/integration/` despite the
  `test:integration` npm script). Jest config: `jest.config.cjs` (ts-jest,
  `testRegex: /tests/.*\.(test|spec)\.(ts|tsx)$/`, coverage from `src/**`).
- **Test files:**
  - `tests/unit/index.test.ts` (14 lines) — verifies the barrel re-exports
    `VERSION`/`zodify`/`zodToModel` and that re-registering the library
    throws.
  - `tests/unit/zod.test.ts` (140 lines) — Model→Zod via `z.from`: empty
    model, password model (min length + regex), list model with `@list`/
    `@maxlength`/`@minlength`/`@required`, nested optional model, class-method
    attachment, round-trip sourcing.
  - `tests/unit/overrides.test.ts` (385 lines) — `zodify` (primitives, date,
    bigint, boolean, array, set, union, registered models, error on unknown,
    no constructor invocation), `zodifyValidation` (min/max/length/step/
    pattern/email/delegated, date-throws-TypeError, unknown-key passthrough),
    `modelToZod` (complex decorated model with `@list`/nested children,
    undecorated-property skipping, internal `_hidden` omission, missing-type
    error), `zodToModel` (round-trip with enum/nullable/int/array/nested
    object + name preservation).
  - `tests/unit/complex-models.test.ts` (259 lines) — full decorator-driven
    validation matrix: pattern/min/max/step/date-range/email/url/password,
    and a container model exercising union types, nested model, `@list`,
    `@set`, multi-type list, optional boolean.
- **Coverage:** `workdocs/reports/RELEASE_NOTES.md` reports Lines 93.44%,
  Statements 92.74%, Functions 100%, Branches 85.00% (figures tagged against
  `v1.4.1` — stale relative to current `1.14.1`).
- **Gaps:** no integration tests; no tests directly exercise the
  `z.from`/`z.toModel` monkey-patch guards on a non-extensible `z`,
  `ZodDefault`/`ZodCatch`/`ZodReadonly`/`ZodBranded` rejection,
  `ZodLazy` unwrapping, the `ZodSet.valueSchema` synthetic getter, the
  recursive-schema `BuildState.ref` lazy throw, `ZodUnion` of only
  null/undefined error, or empty-union error. No test covers `ListOf`/
  `SetOf`/`ZodSchemaFor`/`ZodShapeFor` type helpers. All tests import
  `"../../src"` first to ensure the `z` patching side effect runs.

#### 10. Usage example
**Model → Zod** (`tests/unit/zod.test.ts:34-45, 67-73`):
```ts
@model()
@description("A simple password model")
class PasswordTestModel extends Model {
  @description("the password attribute")
  @required()
  @password()
  @minlength(8)
  password!: string;

  constructor(arg?: ModelArg<PasswordTestModel>) { super(arg); }
}

const asZod = z.from(PasswordTestModel);
expect(asZod.shape.password).toBeInstanceOf(z.ZodString);
expect(asZod.shape.password.description).toBe("the password attribute");
expect(asZod.shape.password.safeParse("short").success).toBe(false);
```
**Zod → Model (round-trip)** (`tests/unit/overrides.test.ts:326-355`):
```ts
const source = z.object({
  name: z.string().min(2).max(6),
  role: z.enum(["admin", "user"]),
  maybe: z.string().nullable(),
  count: z.number().int(),
  tags: z.array(z.string()).min(1).max(2),
  child: z.object({ id: z.string() }),
}).describe("Round trip model");

const RoundTripModel = z.toModel(source, "RoundTripModel");
expect(RoundTripModel.name).toBe("RoundTripModel");

const roundTrip = z.from(RoundTripModel);
expect(roundTrip.description).toBe("Round trip model");
expect(roundTrip.shape.role).toBeInstanceOf(z.ZodEnum);
```
(Both require a preceding side-effect import of the package, e.g.
`import "../../src";`, so `z.from`/`z.toModel` are patched onto `z`.)

#### 11. Relationships
- **`@decaf-ts/decoration`** (peer): supplies `Metadata` (reflection store:
  `Metadata.get`/`Metadata.set`/`Metadata.description`/
  `Metadata.registerLibrary`) and the `Constructor` type. as-zod reads
  property/class descriptions and registers itself as a library.
- **`@decaf-ts/decorator-validation`** (peer): the foundational layer.
  Provides `Model` (with `Model.get` registry, `Model.getAttributes`),
  `ModelBuilder`/`AttributeBuilder` (used to synthesize Model classes from
  Zod schemas), the decorator vocabulary (`@model`, `@type`, `@required`,
  `@list`, `@set`, `@min`, `@max`, `@minlength`, `@maxlength`, `@step`,
  `@pattern`, `@email`, `@url`, `@password`, `@date`), `ValidationKeys`,
  `Primitives`, `DEFAULT_ERROR_MESSAGES`, `*ValidatorOptions`, `ListMetadata`,
  `TypeMetadata`, `ExtendedMetadata`. as-zod is a peer of this layer, not a
  subtype — it reads its metadata and mirrors it into Zod.
- **`@decaf-ts/utils`** (devDependency only): not imported by `src/`; used
  for build/tooling.
- **`zod`** (peer, v4): the target schema library. as-zod both consumes Zod's
  runtime API and augments its `z` namespace (type augmentation + runtime
  monkey-patch).
- **Downstream:** `@decaf-ts/integrations` declares `@decaf-ts/as-zod` as
  both a dev and peer dependency and references it (in JSDoc) as the intended
  builder for model-backed graph port schemas, but does not currently import
  it.

#### 12. Consumer notes
- **Maturity:** Latest tag `v1.14.1`; release reports (`RELEASE_NOTES.md`,
  `CHANGELOG.md`, `DEPENDENCIES.md`) are dated 2025-11-26 and reference
  `v1.4.1`, i.e. they lag the actual package version. Coverage ~93% lines /
  85% branches per the (stale) report.
- **PeerDependencies are `latest`-pinned** for `@decaf-ts/decoration` and
  `@decaf-ts/decorator-validation` — consumers must keep these in lockstep
  with the rest of the decaf-ts monorepo; there is no semver range, so npm
  resolution depends on whatever `latest` publishes at install time. `zod` is
  pinned to `^4.4.3` (Zod v4 only; the `^0.0.1` line for Zod 3.x is no longer
  maintained per `README.md:39`).
- **Zod v4 requirement.** The code targets Zod v4 internals (`_zod.def`,
  `_def.options`, `_def.checks`, `_def.element`, `_def.valueType`,
  `_def.entries`, `_def.values`, `_def.innerType`, `_def.getter`) and
  compensates for v4's sealed `z` export and missing `ZodSet.valueSchema`. It
  will not work on Zod 3.x.
- **Side effects.** `sideEffects: false` is slightly misleading — importing
  the package has two observable side effects:
  `Metadata.registerLibrary("@decaf-ts/as-zod", VERSION)` and mutation of the
  global `z` object via `Object.defineProperty(z, "from"|"toModel", ...)`.
  Bundlers may need to preserve this import.
- **`z.from`/`z.toModel` may be absent.** On a non-extensible/non-configurable
  `z` the `Object.defineProperty` guards silently skip the patch. Consumers
  should prefer the directly-exported `modelToZod`/`zodToModel`/`zFrom`/
  `zToModel` functions rather than relying solely on `z.from`/`z.toModel`.
- **Dual ESM/CJS.** `exports` map serves ESM from `./lib/esm/index.js` and
  CJS from `./lib/cjs/index.cjs` with per-condition `.d.mts`/`.d.cts` types.
- **Docker setup.** Scripts reference `docker:build`/`docker:publish` for a
  base image `ghcr.io/decaf-ts/as-zod` and `.dockerignore` exists, but there
  is **no `Dockerfile`** in the working tree (`docker:build-base` references
  `./Dockerfile` which is absent; `.npmignore` still lists `Dockerfile`).
  `docker:build` will fail until a `Dockerfile` is added.
- **Gotchas:** (1) Undecorated, `@required`-without-`@type`, private
  (`_`-prefixed), and function properties are silently dropped from the Zod
  shape; missing `@type` on an otherwise-decorated property throws
  `Missing type information`. (2) `@email`/`@url`/`@password` are flattened
  to a generic `.regex(...)` rather than `z.email()`/`z.url()`. (3) The
  `DATE` validation key cannot be applied as a refinement and throws
  `TypeError` if encountered in `zodifyValidation`. (4)
  `ZodDefault`/`ZodCatch`/`ZodReadonly`/`ZodBranded` are explicitly
  unsupported in Zod→Model and throw.
- **Node:** Targets Node 20+ (`engines`), though a developer tutorial claims
  it "will work at least with 16".

#### 13. Inaccuracies found
1. **[as-zod]** versioning — `workdocs/reports/RELEASE_NOTES.md:3`, `workdocs/reports/CHANGELOG.md:3`, and `workdocs/reports/DEPENDENCIES.md:7` all state version `1.4.1` while `package.json:3` is `1.14.1` and the git tag is `v1.14.1`. | Evidence: `package.json:3` `"version": "1.14.1"` vs `workdocs/reports/RELEASE_NOTES.md:3` `Last tag: v1.4.1`. | Suggested fix: regenerate the release reports/CHANGELOG/DEPENDENCIES against `v1.14.1`.
2. **[as-zod]** dependencies report — `workdocs/reports/DEPENDENCIES.md:12-14` lists `@decaf-ts/reflection@0.7.1` as a transitive production dependency and `zod@4.1.12`, but `package.json` has no `@decaf-ts/reflection` dependency and the installed `zod` is `4.4.3`. | Evidence: `workdocs/reports/DEPENDENCIES.md:8-14` vs `package.json:93-97` and `node_modules/zod/package.json` (`zod@4.4.3`). | Suggested fix: regenerate `DEPENDENCIES.md` from the current install.
3. **[as-zod]** README size badge — `README.md:32` reads `Minimal size: 3.6 KB kb gzipped` (duplicated unit "KB kb") while the source template `workdocs/2-Badges.md:24` uses the placeholder `Minimal size: ##PACKAGE_SIZE## kb gzipped`. | Evidence: `README.md:32` vs `workdocs/2-Badges.md:24`. | Suggested fix: render the value as `3.6 KB` (no trailing `kb`) or fix the template to avoid emitting both `KB` and `kb`.
4. **[as-zod]** generated docs size badge — `docs/index.html:188` still contains the unreplaced placeholder `Minimal size: ##PACKAGE_SIZE## kb gzipped`, inconsistent with the published `README.md` (`3.6 KB`). | Evidence: `docs/index.html:188` vs `README.md:32`. | Suggested fix: rebuild docs after substituting the package size so `docs/` matches the README.
5. **[as-zod]** README typo — `README.md:5` and `workdocs/1-Header.md:5` say `two-way convertion` (misspelling) while `workdocs/4-Description.md:3` correctly says `conversion`. | Evidence: `README.md:5` `Small addon to enable two-way convertion between Models and Zod`. | Suggested fix: change `convertion` → `conversion`.
6. **[as-zod]** package description mismatch — `package.json:4` `"description": "Zod compatibility library"` does not match the README/workdocs tagline `Easy two-way conversion from Models to Zod` (`README.md:37`, `workdocs/4-Description.md:3`). | Evidence: `package.json:4` vs `README.md:37`. | Suggested fix: align the `package.json` description with the documented two-way-conversion purpose, or vice versa.
7. **[as-zod]** Docker build is broken/undocumented — `package.json:48` `docker:build-base` runs `docker build ... -f ./Dockerfile .` but no `Dockerfile` exists in the package directory; `.npmignore:20` still references `Dockerfile`. | Evidence: `ls /workspaces/decaf-ts/as-zod/Dockerfile` → absent; `package.json:48` references `./Dockerfile`. | Suggested fix: add a `Dockerfile` or remove the `docker:build*`/`docker:publish*` scripts and the `.npmignore` `Dockerfile` entry.
8. **[as-zod]** documentation of public API is incomplete — the generated JSDoc site only documents `COMMIT` and `FULL_VERSION` as Global members (`docs/global.html:131`) and omits all runtime exports (`zodify`, `zodifyValidation`, `modelToZod`, `zodToModel`, `zFrom`, `zToModel`) and all type exports from `zod.ts`. | Evidence: `docs/global.html:131` sidebar lists only `COMMIT`, `FULL_VERSION` despite `src/overrides.ts:435,492,544,878,897,901` exports. | Suggested fix: add JSDoc `@public`/export annotations to the converter functions and regenerate docs.
9. **[as-zod]** `sideEffects: false` is technically inaccurate — importing the package has two global side effects: `Metadata.registerLibrary("@decaf-ts/as-zod", VERSION)` (`src/index.ts:31`) and mutation of the shared `z` object via `Object.defineProperty(z, "from"|"toModel", ...)` (`src/overrides.ts:908-931`). | Evidence: `package.json:101` `"sideEffects": false` vs `src/index.ts:31` and `src/overrides.ts:911-916, 926-931`. | Suggested fix: set `sideEffects` to the side-effectful entry files (e.g. `"./src/index.ts"`) or document that the side effects are intentional and idempotent.
10. **[as-zod]** tutorial script list is stale relative to `package.json` — `workdocs/tutorials/For Developers.md:50` documents a `postinstall` script ("will self-delete") and `:94-95` documents `test:bundling`/`tests/bundling`, but `package.json:20-57` defines neither a `postinstall` script nor a `test:bundling` script, and no `tests/bundling` or `tests/integration` directory exists. | Evidence: `workdocs/tutorials/For Developers.md:50,94-95` vs `package.json:20-57` and `tests/` (only `unit/`). | Suggested fix: update the tutorial's script inventory and test-structure section to match the actual `package.json` and `tests/` layout.
11. **[as-zod]** `test:integration` script targets a non-existent directory — `package.json:32` defines `test:integration` matching `/tests/(integration)` but there is no `tests/integration/` directory; it silently passes via `--passWithNoTests`. | Evidence: `package.json:32` vs `tests/` contents (only `tests/unit/`). | Suggested fix: add integration tests or remove/clearly-mark the `test:integration` script as a no-op.
12. **[as-zod]** integrations "consumer" does not actually consume the package — `@decaf-ts/integrations` declares `@decaf-ts/as-zod` as a peer/devDependency and its docs claim to use `modelToZod` (`integrations/src/graph/engine/validation/GraphPortSchemaResolver.ts:14`), but no `import ... from "@decaf-ts/as-zod"` exists anywhere in `integrations/src` (or anywhere else in the monorepo outside `as-zod` itself). | Evidence: grep for `from "@decaf-ts/as-zod"` across the monorepo (excluding `as-zod` and `node_modules`) returns nothing; only JSDoc references at `integrations/src/graph/engine/validation/GraphPortSchemaResolver.ts:4,14`. | Suggested fix: implement the documented `modelToZod` usage in `GraphPortSchemaResolver` or remove the unused peer/devDependency and the misleading JSDoc.
13. **[as-zod]** Node engine floor disagreement — `package.json:64` requires `node >=20.0.0` but `workdocs/tutorials/For Developers.md:322` states "Setup for node 20, but will work at least with 16". | Evidence: `package.json:64` vs `workdocs/tutorials/For Developers.md:322`. | Suggested fix: update the tutorial to reflect the enforced `>=20.0.0` floor (Node 16 is not supported per `engines`).
