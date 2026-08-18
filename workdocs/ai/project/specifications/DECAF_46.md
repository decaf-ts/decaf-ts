# DECAF-46: Jest Xray Teardown Utility Port

**Status:** Completed
**Priority:** Medium
**Owner:** utils / Testing

## 1. Overview

Port the teardown logic from `/home/tvenceslau/local-workspace/pharmaledger/PTP-Workspace/e2e-tests/tests/jest-xray-teardown.cjs` into `@decaf-ts/utils` so the functionality is exposed through the package's `tests` export. The shared helper must be transpilation-friendly and usable directly from Jest `globalTeardown` after build output is produced.

The implementation must preserve the current behavior exactly:

* same environment variables
* same skip behavior when Xray reporting is disabled
* same auth/import/GraphQL flow
* same payload parsing and attachment handling
* same console output and failure semantics

## 2. Goals

*   [x] Export the teardown helper from `utils/src/tests/index.ts`.
*   [x] Preserve the exact environment variable contract: `ENABLE_XRAY_REPORT`, `XRAY_CLIENT_ID`, and `XRAY_CLIENT_SECRET`.
*   [x] Keep the existing Xray endpoints, XML parsing rules, and payload upload flow unchanged.
*   [x] Make any newly required non-built-in dependency available as an optional peer dependency with `peerDependenciesMeta.optional = true`.
*   [x] Provide an export shape that works from transpiled ESM and CJS test builds.

## 3. User Stories / Requirements

*   **US-1:** As a maintainer, I want the teardown logic to live in `@decaf-ts/utils/tests` so that other repos can reuse it without copying the script.
*   **US-2:** As a test runner, I want the teardown helper to respect the same env var gate so I can disable Xray uploads without changing config shape.
*   **US-3:** As a consumer, I want a transpiled export that Jest can call from `globalTeardown` so the teardown path does not depend on a raw source file.
*   **Req-1:** The helper must use the same env vars and skip semantics as the current `jest-xray-teardown.cjs` file.
*   **Req-2:** The helper must preserve the current Xray auth URL, import URL, GraphQL URL, and result processing behavior.
*   **Req-3:** The helper must remain compatible with the `utils` package build pipeline and the `./tests` package export.
*   **Req-4:** Any added external dependency used only by this helper must be optional in package metadata.

## 4. Architecture & Design

Implement the teardown as a shared test utility under `utils/src/tests/`, with a dedicated module that can be exported from `utils/src/tests/index.ts` and consumed after transpilation.

The new helper should preserve the existing script structure:

* parse the junit XML results with `fast-xml-parser`
* map test outcomes to Xray status codes
* collect evidence files and payload metadata from the same on-disk locations
* authenticate with Xray using the same credentials flow
* upload the execution payload to the same import endpoint
* keep the same GraphQL helper behavior and response truncation logic

The build output should expose a stable entry point for Jest `globalTeardown`. The consuming Jest config should reference the transpiled helper rather than the original `.cjs` file.

If `fast-xml-parser` is not already available as a direct dependency in the consuming context, add it as an optional peer dependency so the teardown helper stays explicit without forcing unnecessary installation for users who do not enable Xray teardown.

## 5. Tasks Breakdown

This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID | Task Name | Priority | Status | Dependencies |
|:--|:--|:--|:--|:--|
| [TASK-257](./tasks/TASK_257.md) | Port the Xray teardown script into `utils/src/tests/` and re-export it from the tests entry point | High | Pending | - |
| [TASK-258](./tasks/TASK_258.md) | Add optional peer dependency metadata for any new teardown-only package imports | Medium | Pending | TASK-257 |
| [TASK-259](./tasks/TASK_259.md) | Update Jest `globalTeardown` usage to the transpiled `@decaf-ts/utils/tests` export and document the contract | Medium | Pending | TASK-257, TASK-258 |

## 6. Open Questions / Risks

*   Resolved: the helper exports both a named `runJestXrayTeardown` function and a default export for CJS/ESM compatibility.
*   Resolved: downstream consumers can point Jest `globalTeardown` at the transpiled `@decaf-ts/utils/tests` export.
*   Resolved: `fast-xml-parser` is declared as an optional peer dependency so the helper remains explicit without forcing installation.

## 7. Results & Artifacts

*   `utils/src/tests/jestXrayTeardown.ts`
*   `utils/src/tests/index.ts`
*   `utils/package.json`
*   `utils/tsconfig.jest.json`
*   `utils/jest.config.cjs`
*   `utils/tests/unit/jest-xray-teardown.test.ts`
