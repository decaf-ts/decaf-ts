# TASK-111: Implement HttpAdapter simple methods and typed request options

**ID:** TASK-111
**Specification:** [DECAF-13](../DECAF_13.md)
**Priority:** High
**Status:** Completed

## 1. Description
Implement additive `HttpAdapter` helper methods (`get`, `post`, `put`, `delete`) and introduce a `for-http` owned options type aligned with Axios request-config semantics, including required support for timeout/headers/transform/validation/credentials behavior.

## 2. Objectives
*   [x] Add `HttpAdapter` methods for simple REST operations with the requested argument shapes.
*   [x] Define/export a typed `for-http` options contract following Axios schema semantics.
*   [x] Map `includeCredentials` and other selected options to runtime transport behavior safely.
*   [x] Add tests and documentation updates for the new API surface.

## 3. Implementation Plan
**Proposed Changes:**
*   Update `for-http` `HttpAdapter` public API with simple verb helpers.
*   Add a new request options type in `for-http` types/contracts.
*   Wire options mapping into the existing request execution path.
*   Update docs and examples.

**Technical Details:**
*   Keep methods additive and backward compatible.
*   Use adapter-level type ownership so callers depend on `for-http` exports, not Axios internals.
*   Ensure `includeCredentials` parity with Axios-style `withCredentials` behavior.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit tests for helper method argument forwarding and transport invocation.
*   [x] Unit tests for options mapping (`timeout`, `headers`, `transformResponse`, `validateStatus`, `includeCredentials`, and selected extras).
*   [x] Integration tests for at least one success and one error/validation-status flow.

**Manual Verification:**
*   Confirmed helper-method usage compiles in `for-http` after `npm run build`.
*   Confirmed docs reflect method signatures and supported options.

## 5. Blockers & Clarifications
*   Clarify whether `delete` must support request body payloads.
*   Clarify expected default behavior when `validateStatus` is omitted.

## 6. Execution Log
*   2026-04-24 - Task created from DECAF-13 specification.
*   2026-04-24 - Implemented `HttpRequestOptions` and simple helper methods in `HttpAdapter`/`AxiosHttpAdapter`.
*   2026-04-24 - Added/updated tests for helper methods and options mapping (unit + integration).
*   2026-04-24 - Updated `for-http` docs and validated with `npm run lint`, `npm run build`, and `npm run test -- --watchman=false`.
