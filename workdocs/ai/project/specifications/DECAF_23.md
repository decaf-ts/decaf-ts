# DECAF-23 — @throttle() Decorator Formalization

- **Status:** COMPLETED
- **Priority:** High
- **Goal:** Formalize the `@throttle()` decorator in `core` with a clean enum-driven API, exported splitter factory functions, and full test coverage.

---

## 1. Overview

A `throttle` function already exists in `core/src/utils/throttling.ts` but its API is awkward (raw config objects, no enum, no exported splitter helpers) and has only 2 unit tests. This spec:

1. Introduces `ThrottleMode` enum (`BY_COUNT` / `BY_SIZE`).
2. Exports two splitter factory functions — `splitByCount(n)` and `splitBySize(bytes)` — each returning a `ThrottleSplitter<T>` (`(items: T[]) => T[][]`).
3. Rewrites the decorator signature with readable overloads:
   - `@throttle(5)` — chunk by count of 5 (default `BY_COUNT`)
   - `@throttle(500, ThrottleMode.BY_SIZE)` — chunk by ≤500-byte payload
   - `@throttle(myFn)` — arbitrary splitter function
   - All forms accept an optional `ThrottleOptions` bag (`delayMs`, `argIndex`, `breakOnSingleFailure`).
4. Keeps the existing Proxy-based wrapping and multi-arg-index support.
5. Adds comprehensive tests covering all modes, the splitter factories, custom splitters, error aggregation, and the delay option.

---

## 2. Goals

- [x] Define `ThrottleMode` enum with `BY_COUNT` and `BY_SIZE` values.
- [x] Export `splitByCount<T>(count: number): ThrottleSplitter<T>`.
- [x] Export `splitBySize<T>(maxBytes: number): ThrottleSplitter<T>`.
- [x] Define `ThrottleSplitter<T> = (items: T[]) => T[][]`.
- [x] Define `ThrottleOptions` (`delayMs?`, `argIndex?`, `breakOnSingleFailure?`).
- [x] Provide typed decorator overloads for number + optional mode, number + mode + options, and splitter + options.
- [x] Preserve Proxy-based method wrapping.
- [x] Preserve `argIndex` multi-index support (default `0`).
- [x] `breakOnSingleFailure` resolves from `ThrottleOptions` first, then `ctx.get("breakOnSingleFailureInBulk")`, defaulting to `true`.
- [x] Tests cover: count mode, size mode, custom splitter, delay, failure aggregation, multi-index.

---

## 3. API Design

### 3.1 Types

```typescript
export enum ThrottleMode {
  BY_COUNT = "count",
  BY_SIZE  = "size",
}

export type ThrottleSplitter<T = any> = (items: T[]) => T[][];

export interface ThrottleOptions {
  delayMs?: number;
  argIndex?: number | number[];
  breakOnSingleFailure?: boolean;
}
```

### 3.2 Splitter factories

```typescript
// Returns a splitter that partitions an array into chunks of at most `count` items.
export function splitByCount<T>(count: number): ThrottleSplitter<T>;

// Returns a splitter that partitions an array so each chunk's JSON byte size ≤ maxBytes.
export function splitBySize<T>(maxBytes: number): ThrottleSplitter<T>;
```

### 3.3 Decorator overloads

```typescript
// Throttle by count (default BY_COUNT).
export function throttle(count: number, options?: ThrottleOptions): MethodDecorator;

// Throttle by numeric limit + explicit mode.
export function throttle(value: number, mode: ThrottleMode, options?: ThrottleOptions): MethodDecorator;

// Throttle with a custom splitter function.
export function throttle(splitter: ThrottleSplitter, options?: ThrottleOptions): MethodDecorator;
```

### 3.4 Usage examples

```typescript
class MyService {
  // Split [items] into chunks of 10; 50 ms delay between calls.
  @throttle(10, { delayMs: 50 })
  async createBulk(items: Item[]) { ... }

  // Split [items] into ≤512-byte chunks.
  @throttle(512, ThrottleMode.BY_SIZE)
  async writeBulk(items: Item[]) { ... }

  // Custom splitter.
  @throttle((items) => chunkEveryOther(items))
  async processBulk(items: Item[]) { ... }

  // Two co-chunked args (argIndex [0, 1]), by count 5.
  @throttle(5, { argIndex: [0, 1] })
  async updateBulk(ids: string[], payloads: Payload[]) { ... }
}
```

---

## 4. Implementation Notes

- Remove `BseThrottlingConfig`, `ThrottlingConfig`. Replace with the types above.
- `splitByCount` and `splitBySize` are pure functions; they are also the helpers used internally when the decorator receives a numeric value.
- Internal helper `buildChunkBounds` is replaced by delegating directly to the resolved splitter.
- `estimateEntrySize` / `safeByteLength` remain as internal utilities used by `splitBySize`.
- `mergeResult` remains as an internal helper.
- The decorator resolves the splitter once at call-time (inside the Proxy `apply`) so that function-form configs still get fresh resolution per invocation.
- Metadata key stays `PersistenceKeys.THROTTLE`.

---

## 5. Tasks Breakdown

| ID       | Task Name                                              | Priority | Status  | Dependencies |
|:---------|:-------------------------------------------------------|:---------|:--------|:-------------|
| TASK-152 | [Redesign and implement @throttle() API](./tasks/TASK_152.md) | High | Pending | -     |
| TASK-153 | [Add comprehensive @throttle() tests](./tasks/TASK_153.md)    | High | Pending | TASK-152 |

---

## 6. Results & Artifacts

- Modified: `core/src/utils/throttling.ts`
- Tests: `core/tests/unit/throttle.test.ts`
