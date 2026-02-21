# DECAF-3: Filesystem Adapter

**Status:** In Progress — core filesystem adapter shipped, but the FsDispatch watch syncer and cross-process lock coordination remain in flight.  
**Priority:** High  
**Owner:** decaf-dev

## 1. Overview
Introduce a new persistence path under `core/src/fs` that mirrors the public API and runtime behaviour of the existing `RamAdapter`, but persists every dataset onto the local filesystem. Each logical database corresponds to a root directory, each table/model maps to a nested directory, and every record is materialised as a JSON file. Secondary indexes/views must also be backed by dedicated JSON blobs so queries remain efficient without scanning every record file.

## 2. Goals
*   [x] Add a `FilesystemAdapter` whose CRUD/bulk/query semantics are functionally identical to `RamAdapter`.
*   [x] Persist adapter state under `core/src/fs`, using the hierarchy `{db}/{table}/{recordId}.json` plus `{db}/{table}/indexes/{indexName}.json`.
*   [x] Maintain full feature parity with `RamAdapter` hooks (observers, populate, bulk operations, prepared statements, etc.).
*   [x] Provide configuration knobs for the root directory, fs promises shim, and optional JSON formatting.
*   [ ] Build `FsDispatch` so multiple adapter instances watch the underlying directories/files and refresh their in-memory cache whenever any process mutates storage.
*   [ ] Replace the in-process locking layer with a filesystem-backed `FilesystemLock` so every adapter/process sharing a root respects the same mutual exclusions.

## 3. User Stories / Requirements
*   **US-1:** As an operator, I want an on-disk drop-in replacement for `RamAdapter` so I can reboot processes without losing state.
*   **US-2:** As a developer, I expect repositories/services that already work with `RamAdapter` to function unchanged when swapped to `FilesystemAdapter`.
*   **US-3:** As an operator running multiple processes against the same storage root, I expect them to observe each other’s writes in near-real time so caches never diverge.
*   **Req-1:** Every write must be flushed atomically (write temp file + rename) to avoid corruption.
*   **Req-2:** Index/view metadata must live in separate JSON files whose structure enables fast lookups without scanning every record file.
*   **Req-3:** Adapter instances watching the same filesystem root must refresh their in-memory collections automatically when any process mutates data or indexes.
*   **Req-4:** Locking must be implemented on the filesystem itself (e.g., via lockfiles) so any adapter process cannot write while another holds the table-level lock.

## 4. Architecture & Design
- **Directory Layout**
  - Root folder = adapter "database".
  - Each model/table = subdirectory named after the table.
  - Records stored as `{root}/{table}/{primaryKey}.json`.
  - Indexes/views stored under `{root}/{table}/indexes/{indexName}.json` where each JSON file keeps the index map to speed up queries.
- **Adapter Structure**
  - Lives under `core/src/fs`, exports via `core/src/index.ts`.
  - Extends the same base classes/interfaces as `RamAdapter`.
  - Uses Node `fs/promises` with configurable root path; default to OS temp dir plus alias.
  - Shared helpers for serialising/deserialising models, applying decorators, and cleaning directories.
- **Dispatch & Watchers**
  - Provide an `FsDispatch` implementation that installs `fs.watch`/`fs.watchFile` listeners on every table and index directory once the adapter hydrates data. When events fire, the dispatch notifies the adapter so it reloads only the affected collection and indexes.
  - Watchers should coalesce rapid event bursts per table to avoid repeated hydration and must clean up when the adapter disposes.
- **Filesystem Locking**
  - Implement table-level `FilesystemLock`/`FilesystemMultiLock` under `core/src/fs/locks` using lockfiles so multiple adapters/processes respect the same exclusion rules.
  - Acquire the lock before mutating records/index files and release it in `finally` blocks, ensuring watchers observe lockfile deletion.
- **Performance Considerations**
  - Cache file descriptors where safe; batch writes for bulk operations.
  - Use the filesystem locks to prevent watcher-triggered reloads from seeing partial writes.
- **Error Handling**
  - Surface the same error types as `RamAdapter`.
  - Detect and heal orphaned index files when records are missing.

## 5. Tasks Breakdown
| ID     | Task Name                          | Priority | Status     | Dependencies |
|:-------|:-----------------------------------|:---------|:-----------|:-------------|
| TASK-5 | FilesystemAdapter implementation   | High     | Completed  | -            |
| TASK-6 | FilesystemAdapter tests & tooling  | High     | Completed  | TASK-5       |
| TASK-25 | FsDispatch watch synchronization   | High     | In Progress | TASK-5       |
| TASK-26 | Filesystem locking & multi-process consistency | High | Pending | TASK-25 |

## 6. Open Questions / Risks
*   How should large bulk deletes be handled to avoid expensive recursive directory scans?
*   Do we need pluggable serializers (e.g., msgpack) for future performance upgrades?
*   What is the expected behaviour if the filesystem root becomes unavailable (permissions, disk full)?
*   Will `fs.watch` fire reliably on every supported platform, or do we need to fall back to `fs.watchFile` polling when watchers drop events?

## 7. Results & Artifacts
*   `core/src/fs` module exporting `FilesystemAdapter`, `helpers.ts`, `indexStore.ts`, and strongly-typed config in `types.ts` (re-exported via `src/index.ts`).
*   Jest coverage through `tests/unit/filesystem-adapter.test.ts` plus `tests/unit/fs/helpers.test.ts` with reusable fixtures in `tests/fs/**`.
*   Repository utilities updated to consume filesystem-aware models, ensuring existing resolvers understand the new flavour metadata.
*   Documentation updates across `core/README.md`, `core/workdocs/4-Description.md`, and `core/workdocs/5-HowToUse.md` describing configuration knobs, directory layouts, and shutdown best practices.
*   (Upcoming) `FsDispatch` watch synchronization and filesystem locking to keep multiple adapter instances coherent.
