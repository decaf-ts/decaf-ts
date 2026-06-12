# TASK-153: Add comprehensive @throttle() tests

**ID:** TASK-153
**Specification:** [Link to Specification](../DECAF_23.md)
**Priority:** High
**Status:** Completed

## 1. Description
Replace and extend `core/tests/unit/throttle.test.ts` to cover every mode and edge case of the redesigned `@throttle()` decorator. The previous 2 tests covered only the count-chunk split and a simple failure case. New coverage must exercise `ThrottleMode.BY_COUNT`, `ThrottleMode.BY_SIZE`, a custom `ThrottleSplitter`, the `delayMs` option, multi-arg-index chunking, and error-aggregation behaviour.

## 2. Objectives

*   [ ] `@throttle(N)` — splits array into count-N chunks and merges results.
*   [ ] `@throttle(N, ThrottleMode.BY_COUNT)` — explicit mode; same as above.
*   [ ] `@throttle(N, ThrottleMode.BY_SIZE)` — chunks respect byte limit; verify via `safeByteLength` estimate.
*   [ ] `@throttle(splitterFn)` — custom splitter function is called with the full array; its returned sub-arrays drive the calls.
*   [ ] `delayMs` option — verify that a delay is inserted between chunk calls (use fake timers / spy on `setTimeout`).
*   [ ] `breakOnSingleFailure: false` — all chunks called; failures aggregated into `AggregateError`; `.results` carries successful chunk outputs.
*   [ ] `breakOnSingleFailure: true` (default) — first failing chunk aborts immediately.
*   [ ] Multi-index (`argIndex: [0, 1]`) — two co-chunked arrays sliced at the same boundaries.
*   [ ] Empty array — single call with `[]` (no split, no error).
*   [ ] `splitByCount` exported function — unit-tests the factory independently.
*   [ ] `splitBySize` exported function — unit-tests the factory independently.

## 3. Implementation Plan

**Proposed Changes:**

*   Rewrite `core/tests/unit/throttle.test.ts`:
    - Shared `makeHandler(decorator)` factory that wires a minimal `logCtx` stub and returns a class instance ready for decorator use.
    - One `describe` per scenario group: count mode, size mode, custom splitter, delay, failure modes, multi-index, edge cases.
    - Isolated `describe("splitByCount")` and `describe("splitBySize")` sections that test the factory functions directly without the decorator.

**Test helpers:**

```typescript
function makeHandler(opts?: ThrottleOptions) {
  class Handler {
    ctx = new Context();
    calls: any[][] = [];
    logCtx = async (args: unknown[]) => {
      const r: any = { log: Logging.get(), ctx: this.ctx, ctxArgs: args };
      r.for = () => r;
      return r;
    };
    @throttle(/* injected per test */)
    async process(items: any[]) {
      this.calls.push([...items]);
      return items;
    }
  }
  return new Handler();
}
```

*   Use `jest.useFakeTimers()` + `jest.runAllTimersAsync()` for the `delayMs` test to avoid real waits.

## 4. Verification Plan

**Automated Tests:**
*   [ ] Unit Test: `core/tests/unit/throttle.test.ts` — all scenarios listed in §2 pass.
*   [ ] `npx jest throttle` from `core/` directory passes with no failures.

**Manual Verification:**
*   N/A — fully automated.

## 5. Blockers & Clarifications
*   Depends on TASK-152 (new API must be in place before tests can be written).

## 6. Execution Log
*   [2026-06-09] - Task created.
*   [2026-06-09] - Wrote 20 tests covering splitByCount/splitBySize factories, BY_COUNT, BY_SIZE, custom splitter, delayMs, breakOnSingleFailure (option + ctx fallback), multi-index, and empty-array edge case. All 20 pass.
