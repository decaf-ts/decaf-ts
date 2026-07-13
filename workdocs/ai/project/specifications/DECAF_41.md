# DECAF-41: Kibana Index Pattern Builder

**Status:** Completed
**Priority:** High
**Owner:** AI Agent

## 1. Overview

Add a fluent **Builder pattern** class (`KibanaIndexBuilder`) to `@decaf-ts/integrations` that constructs Kibana index patterns (data view configurations) for pushing to the Kibana service. Today, `KibanaDataViewConfig` objects are assembled ad hoc in `helpers.ts` (`createDefaultKibanaDataViewConfigs`) and `KibanaDataViewService.normalizeDataViewConfig` — with no structured, validated, or extensible way to build them.

The builder must support three index-matching strategies:

1. **Exact match** — a single, fully-qualified index name (no wildcards).
2. **Prefix/glob** — a wildcard pattern such as `filebeat-pla-demo-*` that matches all indices sharing a prefix.
3. **Generated from logger custom properties** — derive index name segments from the `LogParameterRegistry` (DECAF-9), allowing the index pattern to incorporate runtime log context (e.g., `orgId`, `environment`, `correlationId`) that is already registered as custom `LogParameterDescriptor` entries.

**Compounding:** The logger-generated segments (mode 3) can be **compounded** with any base matching mode. That is, an EXACT or PREFIX index can have logger-generated segments appended to it, producing composite index patterns such as `filebeat-pla-demo-*` from a `filebeat` prefix + rendered `app` and `context` log parameters. This allows index patterns to dynamically incorporate runtime log context regardless of the base matching strategy.

**Pattern-based parsing:** When compounding with logger-generated segments, the builder MUST properly parse each attribute according to its `LogParameterDescriptor` definition (respecting `shouldInclude`, `render`, and `style`) and the **log pattern** string (from `LoggingConfig.pattern`). The builder uses `compileLogPattern(pattern)` to derive the ordered parameter keys from the pattern, then `logParameterRegistry.render(payload, keys)` to render each parameter's value. This ensures the generated index segments follow the same ordering, optionality, and inclusion rules as the logging output itself.

The builder follows the project's **Builder Pattern** convention (constitution §2): extends `Model`, uses `@decaf-ts/decorator-validation` decorators, fluent `setX(): this` methods, and a terminal `build()` that validates via `hasErrors()` and returns a `KibanaDataViewConfig`.

### Why this lives in `integrations/src/kibana/`

The existing `KibanaDataViewService` already consumes `KibanaDataViewConfig` to push data views to Kibana via the REST API. The builder sits alongside it as the structured construction path, replacing the ad hoc helpers.

## 2. Goals

*   [ ] Create `KibanaIndexBuilder` following the project Builder Pattern (extends `Model`, validation decorators, fluent setters, `build()`).
*   [ ] Support **exact match** index patterns (single index name, no wildcard).
*   [ ] Support **prefix/glob** index patterns (wildcard `*` suffix or arbitrary glob).
*   [ ] Support **generation from logger custom properties** — read registered `LogParameterDescriptor` keys from `@decaf-ts/logging` and use their rendered values to compose index name segments.
*   [ ] Produce `KibanaDataViewConfig` objects that are directly consumable by `KibanaDataViewService.createDataView()` / `createDataViews()`.
*   [ ] Add a `KibanaIndexBuilderCollection` helper for building multiple data views in one fluent chain.
*   [ ] Replace the ad hoc `createDefaultKibanaDataViewConfigs` helper with builder-based construction.
*   [ ] Add unit tests covering all three strategies, validation, collection building, and integration with `KibanaDataViewService`.
*   [ ] Update `integrations/src/kibana/` exports and README.

## 3. User Stories / Requirements

*   **US-1:** As a platform engineer, I want to build a Kibana data view for a single exact-match index so that dashboards query one specific index.
*   **US-2:** As a platform engineer, I want to build a Kibana data view with a prefix/glob pattern so that all indices sharing a prefix are covered (e.g., `filebeat-pla-demo-*`).
*   **US-3:** As a platform engineer, I want to generate index name segments from the logging context's custom properties (e.g., `orgId`, `environment`) so that index patterns are dynamically derived from runtime log metadata.
*   **US-4:** As a platform engineer, I want to build multiple data views in a single fluent chain so that I can provision all required data views for an org at once.
*   **US-5:** As a maintainer, I want the builder to validate its inputs (required fields, non-empty strings, valid glob syntax) so that invalid configurations are caught before pushing to Kibana.
*   **US-6:** As a platform engineer, I want to compound logger-generated segments onto an EXACT or PREFIX base index so that the index pattern reflects both a static base name and dynamic runtime log context (e.g., `filebeat-pla-demo-*`).
*   **US-7:** As a platform engineer, I want the builder to parse the log pattern string (from `LoggingConfig.pattern`) so that the generated segments follow the same ordering, optionality, and inclusion rules as the logging output.
*   **Req-1:** The builder MUST follow the project's Builder Pattern (constitution §2): extends `Model`, not `@model()` decorated, constructor calls `Model.fromModel(this, arg)`, properties use `@decaf-ts/decorator-validation` decorators, fluent `setX(): this` methods, `build()` calls `hasErrors()` → throws `ValidationError` on failure.
*   **Req-2:** The builder MUST support three matching modes via an enum: `KibanaIndexMatchMode.EXACT`, `KibanaIndexMatchMode.PREFIX`, `KibanaIndexMatchMode.LOGGER_GENERATED`.
*   **Req-3:** For `LOGGER_GENERATED` mode, the builder MUST accept a log pattern string (from `LoggingConfig.pattern`) and a `LogParameterPayload`-compatible context object. It MUST compile the pattern via `compileLogPattern(pattern)` to derive the ordered parameter keys, render each key via `logParameterRegistry.render(payload, keys)` (respecting `LogParameterDescriptor.shouldInclude`), and use the rendered values as index name segments.
*   **Req-3a:** The builder MUST support **compounding** — logger-generated segments can be appended to ANY matching mode (EXACT, PREFIX, LOGGER_GENERATED). When a log pattern and payload are provided alongside a base mode, the rendered segments are appended to the base index name.
*   **Req-3b:** The builder MUST properly parse each log attribute according to its `LogParameterDescriptor` definition (the `shouldInclude`, `render`, and `style` functions) and the log pattern (which defines key ordering, literal segments, and optional `[...]` groups). Parameters that are `shouldInclude === false` for the given payload MUST be omitted from the index segments.
*   **Req-4:** The builder MUST produce `KibanaDataViewConfig` objects (the existing type from `integrations/src/kibana/types.ts`).
*   **Req-5:** The builder MUST allow setting all `KibanaDataViewConfig` fields: `id`, `name`, `title`, `timeFieldName`, `namespaces`, `sourceFilters`, `runtimeFieldMap`, `fieldAttrs`, `allowNoIndex`.
*   **Req-6:** Runtime code must throw only Decaf error types (`ValidationError`, `InternalError`). Never throw a native `Error`.
*   **Req-7:** The builder MUST NOT contain hardcoded index names or real data in its default state.

## 4. Architecture & Design

### 4.1 Matching Modes

```ts
export enum KibanaIndexMatchMode {
  /** Single, fully-qualified index name — no wildcards. */
  EXACT = "exact",
  /** Wildcard pattern matching all indices with a shared prefix (e.g. "filebeat-*"). */
  PREFIX = "prefix",
  /** Index name segments derived from registered LogParameterDescriptor keys. */
  LOGGER_GENERATED = "logger-generated",
}
```

### 4.2 Index Name Composition

The builder composes the `title` field (the index pattern string) as segments joined by a configurable separator (default `-`):

- **EXACT:** `title = indexName` (single segment, no wildcard).
- **PREFIX:** `title = prefix + "*"` (or `prefix + "-" + "*"` if the prefix doesn't already end with the separator).
- **LOGGER_GENERATED:** `title = segments.join(separator) + separator + "*"`, where each segment is the rendered value of a log parameter key derived from the compiled log pattern.

**Compounding:** When a log pattern + payload are provided alongside EXACT or PREFIX mode, the base title is composed first, then the logger-generated segments are appended:

- **EXACT + compound:** `title = indexName + separator + segments.join(separator) + separator + "*"`
- **PREFIX + compound:** `title = prefix + separator + segments.join(separator) + separator + "*"` (the trailing `*` from the base PREFIX is replaced by the compounded segments + `*`)

### 4.3 Logger Custom Property Generation

For `LOGGER_GENERATED` mode (and compounding with any mode), the builder:

1. Accepts `logPattern: string` — the log pattern string from `LoggingConfig.pattern` (e.g., `"{timestamp}-{level}-{app}-{context}"`). This pattern defines the ordering, literal segments, and optional `[...]` groups for the log parameters.
2. Accepts `logPayload: Partial<LogParameterPayload>` — the runtime log context (same shape used by `MiniLogger#createLog`). The builder fills missing fields with sensible defaults.
3. Compiles the pattern via `compileLogPattern(pattern)` to produce a `LogPatternDefinition` containing the ordered `keys` array.
4. Calls `logParameterRegistry.render(payload, definition.keys)` to get a `Record<string, string | undefined>` of rendered values. Each key's `LogParameterDescriptor.shouldInclude` is checked by the registry; parameters where `shouldInclude === false` are omitted from the rendered output.
5. Filters out `undefined`/empty values from the rendered result.
6. Joins the remaining values with the separator.
7. Appends `*` for wildcard matching.

This ensures the generated index segments follow the same ordering, optionality, and inclusion rules as the logging output itself. For example, a log pattern `"{app}-{context}"` with a payload `{ app: "pla", context: ["demo"] }` produces segments `["pla", "demo"]`, which when combined with a `filebeat` prefix yields `filebeat-pla-demo-*`.

**Compounding:** When `logPattern` + `logPayload` are provided alongside EXACT or PREFIX mode, the logger-generated segments are appended to the base index name. The builder first composes the base title (exact name or prefix), then appends the rendered log parameter segments and the trailing `*`.

### 4.4 Class Structure

```
integrations/src/kibana/
  builders/
    KibanaIndexBuilder.ts          // The builder class
    KibanaIndexBuilderCollection.ts // Multi-builder chain helper
    index.ts                        // Re-exports
  types.ts                          // Add KibanaIndexMatchMode enum + builder option types
  ...
```

### 4.5 `KibanaIndexBuilder` Sketch

```ts
import { Model } from "@decaf-ts/decorator-validation";
import { ValidationError } from "@decaf-ts/db-decorators";
import { logParameterRegistry, compileLogPattern, type LogParameterPayload } from "@decaf-ts/logging";
import {
  @required, @string, @list, @prop, @minlength, @option,
} from "@decaf-ts/decorator-validation";

import { KibanaDataViewConfig } from "../types";
import { KibanaIndexMatchMode } from "./KibanaIndexBuilder"; // or types

export class KibanaIndexBuilder extends Model {
  // ── Matching strategy ──
  @required()
  @option(KibanaIndexMatchMode)
  matchMode: KibanaIndexMatchMode = KibanaIndexMatchMode.PREFIX;

  // ── Index name segments ──
  @string()
  @minlength(1)
  prefix?: string;              // base prefix (e.g. "filebeat")

  @string()
  exactIndexName?: string;       // for EXACT mode

  // ── Logger-generated compounding ──
  @string()
  logPattern?: string;           // log pattern string from LoggingConfig.pattern

  @prop()
  logPayload?: Partial<LogParameterPayload>; // runtime context for rendering

  // ── Separator ──
  @string()
  separator: string = "-";

  // ── Data View fields (map to KibanaDataViewConfig) ──
  @required()
  @string()
  @minlength(1)
  id: string = "";

  @required()
  @string()
  @minlength(1)
  name: string = "";

  @string()
  timeFieldName?: string;

  @list(() => String)
  namespaces?: string[];

  @prop()
  sourceFilters?: Array<{ value: string }>;

  @prop()
  runtimeFieldMap?: Record<string, unknown>;

  @prop()
  fieldAttrs?: Record<string, unknown>;

  @prop()
  allowNoIndex?: boolean;

  // ── Fluent setters ──
  setMatchMode(mode: KibanaIndexMatchMode): this { this.matchMode = mode; return this; }
  setPrefix(prefix: string): this { this.prefix = prefix; return this; }
  setExactIndexName(name: string): this { this.exactIndexName = name; return this; }
  setLogPattern(pattern: string): this { this.logPattern = pattern; return this; }
  setLogPayload(payload: Partial<LogParameterPayload>): this { this.logPayload = payload; return this; }
  setSeparator(sep: string): this { this.separator = sep; return this; }
  setId(id: string): this { this.id = id; return this; }
  setName(name: string): this { this.name = name; return this; }
  setTimeFieldName(field: string): this { this.timeFieldName = field; return this; }
  setNamespaces(ns: string[]): this { this.namespaces = ns; return this; }
  setSourceFilters(filters: Array<{ value: string }>): this { this.sourceFilters = filters; return this; }
  setRuntimeFieldMap(map: Record<string, unknown>): this { this.runtimeFieldMap = map; return this; }
  setFieldAttrs(attrs: Record<string, unknown>): this { this.fieldAttrs = attrs; return this; }
  setAllowNoIndex(allow: boolean): this { this.allowNoIndex = allow; return this; }

  // ── Build ──
  build(...args: MaybeContextualArgs): KibanaDataViewConfig {
    if (this.hasErrors()) {
      throw new ValidationError(this.getErrors());
    }
    const title = this.composeTitle();
    return {
      id: this.id,
      name: this.name,
      title,
      timeFieldName: this.timeFieldName,
      namespaces: this.namespaces,
      sourceFilters: this.sourceFilters,
      runtimeFieldMap: this.runtimeFieldMap,
      fieldAttrs: this.fieldAttrs,
      allowNoIndex: this.allowNoIndex,
    };
  }

  // ── Title composition ──
  protected composeTitle(): string {
    const baseSegments = this.composeBaseSegments();
    const loggerSegments = this.composeLoggerGeneratedSegments();
    const allSegments = [...baseSegments, ...loggerSegments];

    if (loggerSegments.length > 0) {
      // When logger-generated segments are present, append wildcard
      return allSegments.join(this.separator) + this.separator + "*";
    }

    // No compounding — use mode-specific wildcard logic
    switch (this.matchMode) {
      case KibanaIndexMatchMode.EXACT:
        return baseSegments[0]; // no wildcard
      case KibanaIndexMatchMode.PREFIX:
        return baseSegments[0] + this.separator + "*";
      case KibanaIndexMatchMode.LOGGER_GENERATED:
        return baseSegments.join(this.separator) + this.separator + "*";
      default:
        throw new InternalError(`Unsupported match mode: ${this.matchMode}`);
    }
  }

  protected composeBaseSegments(): string[] {
    switch (this.matchMode) {
      case KibanaIndexMatchMode.EXACT:
        if (!this.exactIndexName || this.exactIndexName.trim().length === 0)
          throw new ValidationError([{ property: "exactIndexName", message: "exactIndexName is required for EXACT mode" }]);
        if (this.exactIndexName.includes("*"))
          throw new ValidationError([{ property: "exactIndexName", message: "exactIndexName must not contain wildcards (*) in EXACT mode" }]);
        return [this.exactIndexName.trim()];
      case KibanaIndexMatchMode.PREFIX:
        if (!this.prefix || this.prefix.trim().length === 0)
          throw new ValidationError([{ property: "prefix", message: "prefix is required for PREFIX mode" }]);
        return [this.prefix.trim()];
      case KibanaIndexMatchMode.LOGGER_GENERATED:
        // LOGGER_GENERATED base is just the optional prefix; segments come from logger
        return this.prefix && this.prefix.trim().length > 0 ? [this.prefix.trim()] : [];
      default:
        throw new InternalError(`Unsupported match mode: ${this.matchMode}`);
    }
  }

  protected composeLoggerGeneratedSegments(): string[] {
    if (!this.logPattern) return [];
    if (!this.logPayload)
      throw new ValidationError([{ property: "logPayload", message: "logPayload is required when logPattern is set" }]);

    const definition = compileLogPattern(this.logPattern);
    const fullPayload = this.buildFullPayload(this.logPayload);
    const rendered = logParameterRegistry.render(fullPayload, definition.keys);

    const segments: string[] = [];
    for (const key of definition.keys) {
      const value = rendered[key];
      if (value && value.trim().length > 0) {
        segments.push(value.trim());
      }
    }
    return segments;
  }
}
```

### 4.6 `KibanaIndexBuilderCollection` Sketch

A helper for building multiple data views in one chain:

```ts
export class KibanaIndexBuilderCollection extends Model {
  @list(() => KibanaIndexBuilder)
  builders: KibanaIndexBuilder[] = [];

  static for(...builders: KibanaIndexBuilder[]): KibanaIndexBuilderCollection {
    const collection = new KibanaIndexBuilderCollection();
    collection.builders = builders;
    return collection;
  }

  add(builder: KibanaIndexBuilder): this {
    this.builders.push(builder);
    return this;
  }

  build(...args: MaybeContextualArgs): KibanaDataViewConfig[] {
    if (this.hasErrors()) {
      throw new ValidationError(this.getErrors());
    }
    return this.builders.map(b => b.build(...args));
  }
}
```

### 4.7 Usage Examples

```ts
// Exact match
const exact = new KibanaIndexBuilder()
  .setMatchMode(KibanaIndexMatchMode.EXACT)
  .setExactIndexName("my-index-2024")
  .setId("my-index-dv")
  .setName("My Index")
  .setTimeFieldName("@timestamp")
  .build();

// Prefix/glob
const prefix = new KibanaIndexBuilder()
  .setMatchMode(KibanaIndexMatchMode.PREFIX)
  .setPrefix("filebeat-pla-demo")
  .setId("filebeat-demo-dv")
  .setName("Filebeat Demo")
  .setTimeFieldName("@timestamp")
  .build();
// => title: "filebeat-pla-demo-*"

// Logger-generated (pure — no base index, segments from pattern)
const logPayload: Partial<LogParameterPayload> = {
  config: { pattern: "{app}-{context}" } as any,
  level: LogLevel.info,
  context: ["demo"],
  app: "pla",
  timestamp: new Date().toISOString(),
  // ...other fields
};
const generated = new KibanaIndexBuilder()
  .setMatchMode(KibanaIndexMatchMode.LOGGER_GENERATED)
  .setPrefix("filebeat")
  .setLogPattern("{app}-{context}")
  .setLogPayload(logPayload)
  .setId("filebeat-generated-dv")
  .setName("Filebeat Generated")
  .setTimeFieldName("@timestamp")
  .build();
// => title: "filebeat-pla-demo-*"

// Compounded: PREFIX + logger-generated segments
const compounded = new KibanaIndexBuilder()
  .setMatchMode(KibanaIndexMatchMode.PREFIX)
  .setPrefix("filebeat")
  .setLogPattern("{app}-{context}")
  .setLogPayload(logPayload)
  .setId("filebeat-compound-dv")
  .setName("Filebeat Compounded")
  .setTimeFieldName("@timestamp")
  .build();
// => title: "filebeat-pla-demo-*"

// Compounded: EXACT + logger-generated segments
const exactCompounded = new KibanaIndexBuilder()
  .setMatchMode(KibanaIndexMatchMode.EXACT)
  .setExactIndexName("my-index")
  .setLogPattern("{app}")
  .setLogPayload({ app: "pla" } as any)
  .setId("my-index-compound-dv")
  .setName("My Index Compounded")
  .setTimeFieldName("@timestamp")
  .build();
// => title: "my-index-pla-*"

// Collection
const collection = KibanaIndexBuilderCollection.for(exact, prefix)
  .add(generated);
const dataViews = collection.build();
// Push to Kibana
await kibanaDataViewService.createDataViews(dataViews);
```

### 4.8 Integration with `KibanaDataViewService`

The `build()` output (`KibanaDataViewConfig[]`) is directly consumable by:

- `KibanaDataViewService.createDataView(config)` — single data view
- `KibanaDataViewService.createDataViews(configs)` — batch creation

The existing `createDefaultKibanaDataViewConfigs(realm)` helper in `helpers.ts` will be refactored to use the builder internally, preserving its return signature.

### 4.9 Package Export Surface

New exports added to `integrations/src/kibana/index.ts`:

- `KibanaIndexBuilder`
- `KibanaIndexMatchMode`
- `KibanaIndexBuilderCollection`

And re-exported from `integrations/src/index.ts` under the kibana namespace (subpath export `./kibana` already exists).

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:---|:---|:---|:---|
| DECAF-41-1 | Define `KibanaIndexMatchMode` enum, builder option types, and add `KibanaIndexBuilder` class with all three matching strategies | High | Pending | - |
| DECAF-41-2 | Add `KibanaIndexBuilderCollection` for multi-builder chains and refactor `createDefaultKibanaDataViewConfigs` to use the builder | High | Pending | DECAF-41-1 |
| DECAF-41-3 | Wire exports, update README, add unit tests (all three modes, validation, collection, service integration) | High | Pending | DECAF-41-1, DECAF-41-2 |

## 6. Open Questions / Risks

*   **LogParameterPayload shape:** The `LogParameterPayload` from `@decaf-ts/logging` is a rich object with `config`, `level`, `context[]`, `timestamp`, `app`, `separator`, `correlationId`, `rawMessage`, `filteredMessage`, `meta`, `metaString`, `stack`, `stackLabel`, and `applyTheme`. The builder only needs a subset (e.g., `app`, `context`). Should we accept a partial payload and fill defaults, or require the full shape? **Decision:** Accept a partial payload — the builder fills missing fields with sensible defaults before passing to `logParameterRegistry.render()`.
*   **Pattern vs. explicit keys:** The builder uses `logPattern` (a pattern string from `LoggingConfig.pattern`) compiled via `compileLogPattern()` to derive the ordered parameter keys, rather than accepting an explicit `logParameterKeys: string[]` list. This ensures the generated index segments follow the same ordering, optionality, and inclusion rules as the logging output. The `shouldInclude` check in each `LogParameterDescriptor` is respected by `logParameterRegistry.render()`, so parameters that should not be included for the given payload are automatically omitted.
*   **Compounding design:** Logger-generated segments can be compounded with ANY matching mode (EXACT, PREFIX), not just LOGGER_GENERATED. When `logPattern` + `logPayload` are provided alongside a base mode, the rendered segments are appended to the base index name and a trailing `*` is added. This allows composite patterns like `filebeat-pla-demo-*` from a `filebeat` prefix + rendered `app` and `context` parameters.
*   **Cross-package dependency:** The builder lives in `integrations` but depends on `@decaf-ts/logging` for `logParameterRegistry` and `LogParameterPayload`. The `integrations` package already depends on `@decaf-ts/logging` (confirmed in `package.json`), so this is safe.
*   **Glob syntax validation:** Kibana index patterns support only `*` wildcards (no `?` or character classes). The builder should validate that EXACT mode does not contain `*` and that PREFIX mode produces exactly one trailing `*`.
*   **Separator conflicts:** If a log parameter value contains the separator character, the resulting index pattern may be ambiguous. The builder should document this risk but not attempt to escape (Kibana doesn't support escaping in index patterns).

## 7. Results & Artifacts

*   `integrations/src/kibana/builders/KibanaIndexBuilder.ts` — builder class with three matching strategies.
*   `integrations/src/kibana/builders/KibanaIndexBuilderCollection.ts` — multi-builder collection helper.
*   `integrations/src/kibana/builders/index.ts` — re-exports.
*   `integrations/src/kibana/types.ts` — updated with `KibanaIndexMatchMode` enum and builder option types.
*   `integrations/src/kibana/helpers.ts` — `createDefaultKibanaDataViewConfigs` refactored to use the builder.
*   `integrations/src/kibana/index.ts` — updated exports.
*   `integrations/tests/unit/kibana/builders/` — unit tests.
*   Updated `integrations/README.md`.
