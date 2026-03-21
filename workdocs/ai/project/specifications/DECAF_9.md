# DECAF-9: MiniLogger LogParameter Engine

**Status:** Completed — MiniLogger now renders through the LogParameter engine, optional segments honor `logPattern`, and new documentation/tests demonstrate how to add tokens.
**Priority:** High
**Owner:** Logging Team

## 1. Overview
The current `MiniLogger#createLog` method hardcodes the assembled log line, which makes it hard to introduce new fields, rearrange the message, or opt out of contextual data without ripping apart the implementation. This specification proposes a lightweight `LogParameter` engine that turns each accepted param (context, correlationId, timestamp, message, stack, level, etc.) into a registered formatter/styling pair, consults a declarative `logPattern`, and produces the final log string by walking the pattern order. All known fields are registered by default, and teams can register additional parameters (IP, tenant, feature flag, etc.) without touching `MiniLogger`. The declarative pattern already exposed as the `pattern` property on `LoggingConfig` (see `DefaultLoggingConfig.pattern`), so we simply reinterpret that string into ordered tokens and optional segments instead of introducing a new configuration entry.

## 2. Goals
*   [x] Replace the hardcoded `createLog` formatting with a composable `LogParameter` pipeline that is easy to extend.
*   [x] Keep the runtime path as lightweight as possible: the engine resolves parameters once per log call and avoids complex dependency graphs.
*   [x] Provide a declarative `logPattern` mechanism that defines which parameters appear and in what order.

## 3. User Stories / Requirements
*   **US-1:** As a developer, I want the log output to include the exact parameters I care about (context, message, correlation ID, etc.) without editing `MiniLogger#createLog`.
*   **US-2:** As an operator, I want to reorder or hide fields by changing `logPattern`, so production formats can differ from local development.
*   **US-3:** As a platform engineer, I want to register new parameters (e.g., `ip`, `tenant`, `elapsed`) that participate in formatting/styling like the existing ones.
*   **Req-1:** The `LogParameter` engine must ship with default descriptors for the existing fields (level, timestamp, correlationId, context, message, stack, additional metadata) and apply styling/formatting (e.g., colors, quoting) for each out of the box.
*   **Req-2:** The `logPattern` string must define the sequence of tokens, allow tokens to be marked optional (e.g., `[context]`), and fall back to defaults when a token is missing from the current log payload.
*   **Req-3:** Registering a new parameter should be as simple as calling `LogParameterRegistry.register('ip', descriptor)` so it is automatically considered during pattern evaluation.

## 4. Architecture & Design
1.  **LogParameterDescriptor:** Define an interface that exposes `key`, `render(payload)`, `style(rendered)`, and `actions` (optional hooks). Each descriptor declares whether the parameter is always rendered or optional, and how to format/stylize its value. Existing fields are factories wired through descriptors, so the engine just iterates the descriptor list instead of hardcoding logic.
2.  **LogParameterRegistry:** Single shared registry that holds descriptors keyed by parameter name. `MiniLogger` acquires the registry once at startup; the registry exposes `register`, `get(key)`, and `getOrdered(pattern)` helpers. Default descriptors for `timestamp`, `level`, `correlationId`, `context`, `message`, and `stack` are registered at module initialization, as well as a `metadata` catch-all that serializes extra fields.
3.  **LogPattern parsing:** The existing `LoggingConfig.pattern` (defaulted by `DefaultLoggingConfig.pattern` to `"{level} [{timestamp}] {app} {context} {separator} {message} {stack}"`) already represents the declarative pattern we want to honor. The engine will treat this entry (and any overrides provided through config or context) as the canonical `logPattern`. The parser reuses the `pattern` string, interprets `[ ... ]` blocks as optional segments (including their literal brackets in the emitted text), and resolves each `{key}` token (or nested optional groups) via the registry. The resulting ordered descriptor list is cached per unique pattern string to avoid re-parsing on every log call.
4.  **MiniLogger wiring:** The refactor updates `MiniLogger#createLog` to accept the assembled payload (level, message, context, etc.) and iterate the descriptor list produced by `LogPattern`. For each descriptor, it calls `render` → `style`, collects non-empty results, and joins them with a configurable separator (space by default). Because `MiniLogger` no longer hardcodes field logic, new parameters simply register a descriptor and appear when `logPattern` references their key.
5.  **Logging.register:** Surface the shared `LogParameterRegistry` via a `Logging.register(descriptor)` helper so every logger consumes a single, globally cached registry and external modules can add tokens without delving into the internal cache. The registry remains unique and concurrency-safe, preventing duplicate descriptor lists.
6.  **Nest injector:** Consumer modules such as `for-nest` can register platform-specific descriptors (e.g., `{ip}`) that read values from `payload.config` and call `log.for({ ip })` whenever a request is present. This keeps the core logging engine agnostic while still allowing adapters to expose request-aware fields in a declarative pattern.
7.  **Extensibility hooks:** Provide a `LogParameterDescriptor` signal (optional `shouldInclude`) so descriptors can skip themselves based on the payload. For example, the `stack` descriptor can skip when no stack is provided. This keeps the engine lightweight by avoiding `if/else` blocks sprinkled across `MiniLogger`.

## 5. Tasks Breakdown
| ID           | Task Name                                         | Priority | Status     | Dependencies |
|:-------------|:--------------------------------------------------|:---------|:-----------|:-------------|
| DECAF-9-1    | Define LogParameter descriptor/registry contracts | High     | Completed  | -            |
| DECAF-9-2    | Refactor MiniLogger to use the LogParameter engine | High     | Completed  | DECAF-9-1     |
| DECAF-9-3    | Document logPattern usage and add regression tests | Medium   | Completed  | DECAF-9-2     |

## 6. Open Questions / Risks
*   **Question:** Should `logPattern` live in `MiniLoggerOptions`, the shared config, or both? Decide where the most natural override surface resides.
*   **Risk:** The new engine must avoid extra allocations on the hot path. Caching descriptor lists and limiting formatting to active tokens will mitigate this.

## 7. Results & Artifacts
*   **Expected artifacts:** `LogParameterDescriptor`/`LogParameterRegistry` modules, `MiniLogger` refactors, pattern parser utility, and docs/samples showing how to add new parameters.

## 8. Completed Work
*   Added `logParameters.ts` with a cached parser for `logPattern`, optional segments, and descriptor/state tracking so each `{token}` is rendered only when needed (`LogParameterPayload`, `LogParameterDescriptor`, optional `shouldInclude`, etc.).
*   Refactored `MiniLogger#createLog` to build a payload, call `compileLogPattern`, render using `logParameterRegistry`, and normalize spacing while still supporting JSON/raw formats and meta fallback.
*   Documented the registry in `README.md` and exported the registry/pattern helpers via `src/index.ts` so other modules can register custom tokens (e.g., `ip`, `tenant`).
*   Added a regression test suite for the pattern renderer and a `logParameterRegistry` test that proves custom descriptors show up automatically.
*   Added the `Logging.register` helper so every logger shares the singleton registry and new descriptors can be wired in once.
*   Documented how `for-nest` registers a request-aware `{ip}` descriptor and updates its controller `logCtx` overrides to attach the remote address via `log.for({ ip })`.

## 9. Testing
*   `npm run test:unit` (logging module) — all 245 unit tests pass, including new `logParameters` renderer tests and MiniLogger regression suites.
