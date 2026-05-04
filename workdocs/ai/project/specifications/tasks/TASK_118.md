# TASK-118: for-nest CLI migration command (headless boot, no route exposure)

**ID:** TASK-118
**Specification:** [Link to Specification](../DECAF_14.md)
**Priority:** High
**Status:** Completed

## 1. Description
Implement a `for-nest` CLI command compatible with `npx decaf migrate ...` that boots server context headlessly, executes migrations, and exits without exposing HTTP routes, mirroring the existing operational style used in other modules' `cli-module.ts`.

## 2. Objectives
*   [x] Create a CLI-accessible migration command for Nest server applications.
*   [x] Ensure command boots application context without opening network listeners/routes.
*   [x] Reuse migration orchestration to support multi-adapter migrations (Nano + TypeORM baseline case).
*   [x] Accept command arguments but default migration target version to `package.json` when not explicitly provided.
*   [x] When migration runs via task mode, use `TaskTracker` to wait for task resolution before process exit.
*   [x] Ensure all CLI flags take precedence over `package.json` defaults.
*   [x] Keep `--dry-run` parsing and precedence compatibility in CLI/config resolution without changing runtime persistence behavior.
*   [x] Provide tests/documentation for command usage and safety behavior.

## 3. Implementation Plan
**Proposed Changes:**
*   Add/update `for-nest/src/cli-module.ts` to integrate with `@decaf-ts/cli` and expose migration command.
*   Reuse the explicit pre-listen migration trigger function created for boot-time migration execution (no lifecycle hooks).
*   Implement headless Nest bootstrap path dedicated to migrations (`Service.boot()` without exposing endpoints).
*   Add support for command arguments with default target version resolution from `package.json`.
*   Preserve `--dry-run` option parsing/precedence in command input resolution as a compatibility flag only.
*   Document usage in `for-nest` docs and project planning artifacts.

**Technical Details:**
*   Guarantee no route exposure/listener startup in migration command path.
*   Return non-zero exit code when migration execution fails.
*   Ensure command path aligns with `@decaf-ts/cli` conventions and existing `cli-module.ts` patterns from non-utils modules.
*   Stop on first failure during multi-adapter migration execution.

## 4. Verification Plan
**Automated Tests:**
*   [x] Unit Test: `for-nest/tests/unit/cli-migrate.command.test.ts`
*   [x] Integration Test: `for-nest/tests/integration/cli-migrate.multi-adapter.integration.test.ts`

**Manual Verification:**
*   Execute `npx decaf migrate ...` locally against dual-adapter test fixture and confirm migrations run with no HTTP bind.

## 5. Blockers & Clarifications
*   No blockers currently.

## 6. Execution Log
*   [2026-04-25] - Task created.
*   [2026-04-25] - Added CLI `migrate` command in `for-nest/src/cli-module.ts` with package-default precedence and headless boot behavior; targeted tests passed.
*   [2026-04-25] - Kept `--dry-run` flag parsing/shape for compatibility, but removed runtime dry-run persistence-skipping behavior from migration execution paths.
*   [2026-04-25] - Verification milestone: `for-nest` build passed; full suite passed (`20 passed / 4 skipped`); migration-targeted suite passed (`2 passed`).
*   [2026-04-25] - Updated CLI task-mode migration flow to call `MigrationService.track(...)` on returned migration service instances so command waits for task resolution through explicit tracking.
*   [2026-04-25] - Updated CLI task-mode migration flow to attach the active CLI logger to queued migration task trackers before waiting (`tracker.attach(log)`), so migration task progress/status logs are emitted through the current command logger; verified by `tests/integration/cli-migrate.multi-adapter.integration.test.ts`.
*   [2026-04-25] - Reworked CLI migrate integration test to run live Nano/Postgres migrations via the headless command while using a RamAdapter task engine and verifying schema changes/backfills against the real databases.
-   [2026-04-25] - Ran the CLI migrate integration test against live CouchDB/Postgres fixtures; the command completed, queue tracked, and migrations finished up to version `1.1.0-nest-live`.
