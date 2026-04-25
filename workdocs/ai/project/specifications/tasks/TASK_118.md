# TASK-118: for-nest CLI migration command (headless boot, no route exposure)

**ID:** TASK-118
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Pending

## 1. Description
Implement a `for-nest` CLI command compatible with `npx decaf migrate ...` that boots server context headlessly, executes migrations, and exits without exposing HTTP routes, mirroring the existing operational style used in other modules' `cli-module.ts`.

## 2. Objectives
*   [ ] Create a CLI-accessible migration command for Nest server applications.
*   [ ] Ensure command boots application context without opening network listeners/routes.
*   [ ] Reuse migration orchestration to support multi-adapter migrations (Nano + TypeORM baseline case).
*   [ ] Accept command arguments but default migration target version to `package.json` when not explicitly provided.
*   [ ] When migration runs via task mode, use `TaskTracker` to wait for task resolution before process exit.
*   [ ] Ensure all CLI flags take precedence over `package.json` defaults.
*   [ ] Implement `--dry-run` by setting analog context via `repository.override(...)`; ensure adapters skip persistence in analog mode.
*   [ ] Provide tests/documentation for command usage and safety behavior.

## 3. Implementation Plan
**Proposed Changes:**
*   Add/update `for-nest/src/cli-module.ts` to integrate with `@decaf-ts/cli` and expose migration command.
*   Reuse the explicit pre-listen migration trigger function created for boot-time migration execution (no lifecycle hooks).
*   Implement headless Nest bootstrap path dedicated to migrations (`Service.boot()` without exposing endpoints).
*   Add support for command arguments with default target version resolution from `package.json`.
*   Route `--dry-run` into adapter context analog mode via `repository.override(...)`; refactor adapters as needed to make analog mode non-persistent.
*   Document usage in `for-nest` docs and project planning artifacts.

**Technical Details:**
*   Guarantee no route exposure/listener startup in migration command path.
*   Return non-zero exit code when migration execution fails.
*   Ensure command path aligns with `@decaf-ts/cli` conventions and existing `cli-module.ts` patterns from non-utils modules.
*   Stop on first failure during multi-adapter migration execution.

## 4. Verification Plan
**Automated Tests:**
*   [ ] Unit Test: `for-nest/tests/unit/cli-migrate.command.test.ts`
*   [ ] Integration Test: `for-nest/tests/integration/cli-migrate.multi-adapter.integration.test.ts`

**Manual Verification:**
*   Execute `npx decaf migrate ...` locally against dual-adapter test fixture and confirm migrations run with no HTTP bind.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
