# DECAF-13 — HttpAdapter Simple REST Methods & Typed Request Options

- **Status:** COMPLETED
- **Priority:** High
- **Goal:** Extend `for-http` `HttpAdapter` with simple `get/post/put/delete` helper methods and a first-class `for-http` request-options type aligned with Axios request config semantics.

---

## 1. Overview
`HttpAdapter` currently requires consumers to compose lower-level request mechanics for common REST calls. This specification introduces simple helper methods for standard HTTP verbs and formalizes a typed options contract in `for-http` that mirrors Axios-style configuration while preserving framework-level type ownership.

## 2. Goals
*   [x] Add simple `get`, `post`, `put`, and `delete` methods in `HttpAdapter`.
*   [x] Define a `for-http` request options type compatible with Axios configuration semantics.
*   [x] Ensure options include the required surface (`timeout`, `headers`, `transformResponse`, `validateStatus`, `includeCredentials`) plus useful defaults/extensions for practical API usage.
*   [x] Cover behavior with unit/integration tests and update module documentation.

## 3. User Stories / Requirements
*   **US-1:** As a `for-http` consumer, I want `HttpAdapter.get(url, options)` so I can perform simple reads without boilerplate.
*   **US-2:** As a `for-http` consumer, I want `HttpAdapter.post(url, data, options)` and `HttpAdapter.put(url, data, options)` so I can send payloads through a stable helper API.
*   **US-3:** As a `for-http` consumer, I want `HttpAdapter.delete(url, options)` for straightforward delete flows.
*   **Req-1:** Public methods must support this shape:
  - `get(url, options?)`
  - `post(url, data, options?)`
  - `put(url, data, options?)`
  - `delete(url, options?)`
*   **Req-2:** `for-http` must expose a typed options interface (e.g., `HttpRequestOptions`) modeled after Axios request config.
*   **Req-3:** Options support must include at least:
  - `timeout`
  - `headers`
  - `transformResponse`
  - `validateStatus`
  - `includeCredentials`
*   **Req-4:** Additional useful options should be supported where feasible (e.g., `params`, `responseType`, `baseURL`, `signal`, `auth`, `transformRequest`), while preserving backward compatibility.
*   **Req-5:** `includeCredentials` semantics must map clearly to runtime request behavior (including Axios `withCredentials` parity when applicable).

## 4. Architecture & Design
Primary module: `for-http`.

Design direction:
*   Keep `HttpAdapter` simple methods as thin wrappers over the existing request execution path.
*   Centralize options typing/mapping in `for-http` types so callers do not import Axios internals directly.
*   Preserve existing adapter behavior and return contracts; new methods should be additive.
*   Normalize option-field naming where needed (`includeCredentials` vs runtime transport names) through explicit adapter mapping.

## 5. Tasks Breakdown
| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:--------|:-------------|
| TASK-111 | [Implement HttpAdapter simple methods and typed request options](./tasks/TASK_111.md) | High | Completed | - |

## 6. Open Questions / Risks
*   Decide whether `delete` should remain payload-free (`delete(url, options?)`) or optionally support request bodies for APIs that accept them.
*   Confirm exact generic typing strategy for response payloads on each helper method.
*   Verify browser/node parity for `includeCredentials` and `signal` handling across all supported runtime targets.

## 7. Results & Artifacts
*   `HttpAdapter` now exposes simple helpers `get(url, options?)`, `post(url, data, options?)`, `put(url, data, options?)`, plus `delete(url, options?)` overload support.
*   Added `HttpMethod`, `HttpRequestTransform`, and `HttpRequestOptions` in `for-http/src/types.ts`.
*   `AxiosHttpAdapter.toRequest(...)` now supports mapping simple helper inputs and maps `includeCredentials` to `withCredentials` when not explicitly provided.
*   Added/updated tests in:
  - `for-http/tests/unit/adapter.test.ts`
  - `for-http/tests/integration/http.adapter.integration.test.ts`
  - `for-http/tests/integration/axios.adapter.integration.test.ts`
*   Updated docs:
  - `for-http/README.md`
  - `for-http/workdocs/5-HowToUse.md`
*   Verification (2026-04-24, `for-http`):
  - `npm run lint` passed.
  - `npm run build` passed.
  - `npm run test -- --watchman=false` passed (11 suites, 82 tests).
