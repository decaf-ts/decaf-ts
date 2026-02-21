# TASK-5: FilesystemAdapter implementation

**ID:** TASK-5  
**Specification:** [Link to Specification](../DECAF_3.md)  
**Priority:** High  
**Status:** Completed

## 1. Description
Create a new `FilesystemAdapter` under `core/src/fs` that mirrors the behaviour and public API of `RamAdapter`, but persists data as directories and JSON files on disk. Each database maps to a root folder, each table to a nested folder, each record to `{pk}.json`, and indexes/views to dedicated JSON files that accelerate lookups.

## 2. Objectives
*   [x] Scaffold `core/src/fs` with shared helpers plus the concrete adapter class.
*   [x] Support all CRUD/bulk/query hooks currently handled by `RamAdapter`, including observers, populate, and prepared statements.
*   [x] Implement safe file IO (tmp files + renames) to avoid corruption, and provide per-table locking to keep operations atomic.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `core/src/fs/helpers.ts` with reusable utilities for resolving table/record/index paths, ensuring directories exist, serialising IDs, and performing atomic JSON reads/writes (temp file + rename).
*   Create `core/src/fs/indexStore.ts` to encapsulate `{table}/{index}` JSON management (in-memory cache + disk persistence) built from `Model.indexes` metadata so create/update/delete hooks only call a single helper.
*   Expand `core/src/fs/types.ts` to accept optional `jsonSpacing`, `fsImpl`, and `onHydrated` callbacks so the adapter can be tuned without subclassing.
*   Refactor `core/src/fs/FilesystemAdapter.ts` to:
    - Hydrate maps and indexes at startup using the new helpers (per-table lock + directory scan).
    - Wrap `create/update/delete`/bulk mutations so disk files and index blobs stay in sync with the inherited `RamAdapter` maps.
    - Expose small helpers (`persistRecord`, `removeRecord`, `persistIndexes`) that reuse the shared helpers and honour the configured JSON formatting.
*   Export the helper/IndexStore types from `core/src/fs/index.ts` for downstream adapters/tests.

**Technical Details:**
*   Every record is stored as `{db}/{table}/{encodedPk}.json` with payload `{ id: {type,value}, record }`, matching the existing deserialisation logic used by `RamAdapter`.
*   Index JSON files live at `{db}/{table}/indexes/{indexName}.json` and map `serializedKey -> PrimaryKeyType[]`; keys are derived by concatenating indexed property values (plus compositions) so range queries simply load a single JSON file rather than scanning record folders.
*   Leverage the `MultiLock` that already exists in `RamConfig` to ensure one table writes at a time (wrap disk IO with the same acquire/release cycle used by the inherited in-memory maps).
*   Ensure filesystem errors propagate as `InternalError`/`ConflictError` by reusing the base adapter’s `parseError`, and fall back to lazy directory creation whenever hydration finds partially-written folders.

## 4. Verification Plan
**Automated Tests:**
*   [x] Add `tests/unit/fs/helpers.test.ts` covering the new helper utilities (atomic writes, encoding).
*   [x] Extend `tests/unit/filesystem-adapter.test.ts` to exercise create/update/delete/restart with index JSON assertions.

**Manual Verification:**
*   Start a demo repository using `FilesystemAdapter`, perform CRUD, restart the process, and confirm records plus indexes remain on disk while `Repository#raw` queries behave like Ram.

## 5. Blockers & Clarifications
*   Confirm whether adapters should clean up old index files automatically or expose CLI tooling.
*   Determine expected behaviour on permission errors / disk full events.

## 6. Execution Log
*   [2026-02-21] - Finalised adapter scaffolding plan for `core/src/fs`.
*   [2026-02-21] - Implemented `FilesystemAdapter`, helper utilities, and `FsIndexStore`, exporting everything via `src/index.ts`.
*   [2026-02-21] - Validated behaviour through `npm run lint`, `npm run build`, and `npm run test` (see TASK-6 for detailed coverage).
