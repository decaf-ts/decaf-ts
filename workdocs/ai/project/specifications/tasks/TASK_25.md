# TASK-25: FsDispatch watch synchronization

**ID:** TASK-25  
**Specification:** [DECAF-3: Filesystem Adapter](../DECAF_3.md)  
**Priority:** High  
**Status:** In Progress — watcher scaffolding exists but the full dispatch/watcher integration and throttled refresh logic are still missing.

## 1. Description
Implement the `FsDispatch` subclass of the shared `Dispatch` infrastructure so every `FilesystemAdapter` instance subscribes to `fs.watch`/`fs.watchFile` events and refreshes its in-memory tables and indexes whenever another process mutates the same root.

## 2. Objectives
*   [ ] Add `FsDispatch` in `core/src/fs/FsDispatch.ts`, reuse the existing `Dispatch` interface so repositories using the filesystem adapter keep the same lifecycle hooks.
*   [ ] Install file watchers on every table/record/index folder during hydration and emit events to the hosting adapter when inserts/updates/deletes fire.
*   [ ] Debounce rapid watcher callbacks per table so simultaneous events (e.g., bulk deletes) only cause a single reload.

## 3. Implementation Plan
**Proposed Changes:**
*   Create `FsDispatch` that registers watchers via `fs.watch` and falls back to `fs.watchFile` where watchers are unavailable or event accuracy is poor.
*   When a watcher signals a change, the dispatch should notify its adapter to rehydrate the affected table/index by re-reading the relevant files (or skipping if the adapter already holds the latest timestamp).
*   Wire the `FilesystemAdapter` constructor to instantiate `FsDispatch`, passing it the same `fs` shim and root path so watchers operate from the same configuration as the adapter.
*   Ensure watcher cleanup happens during adapter disposal so stale listeners do not leak handles.

## 4. Verification Plan
**Automated Tests:**
*   Add unit/integration coverage in `core/tests/unit/filesystem-adapter.test.ts` that spins up two adapters pointing to the same root, writes via one, and asserts the other immediately sees the mutation via watchers.
*   Validate that watcher storms (a batch of writes/deletes) only trigger one reload per table/index within the configured debounce window.

**Manual Verification:**
*   Run the adapter against a shared directory while manually editing files to ensure the in-memory cache reflects the latest data without restarting.

## 5. Blockers & Clarifications
*   Need to decide whether to reuse `Repository`’s existing dispatch registration logic or instantiate `FsDispatch` directly when adapters are created.
*   Determine an appropriate default debounce window that balances promptness and avoiding repeated disk reads.

## 6. Execution Log
*   [2026-02-21] - Watcher helpers sketched in `FilesystemAdapter`, plan updated to include `FsDispatch` and watcher requirements.
