# TASK-26: Filesystem locking & multi-process consistency

**ID:** TASK-26  
**Specification:** [DECAF-3: Filesystem Adapter](../DECAF_3.md)  
**Priority:** High  
**Status:** Pending — locking currently relies on in-process multlock; must be replaced by filesystem-based locking that every adapter can share.

## 1. Description
Replace the existing `MultiLock`/in-memory locking used by `FilesystemAdapter` with a `FilesystemLock` that uses marker files so any number of adapter instances (and processes) coordinating on the same root respect each other.

## 2. Objectives
*   [ ] Implement a `FilesystemLock` (and an optional `FilesystemMultiLock` helper) under `core/src/fs/locks` that acquires/releases locks by creating/deleting lockfiles on disk.
*   [ ] Ensure `FilesystemAdapter` uses the filesystem lock before mutating table or index files, and releases it even when errors occur.
*   [ ] Update tests to assert lock contention works across adapters (e.g., one adapter cannot start a conflicting write while another holds the lock).

## 3. Implementation Plan
**Proposed Changes:**
*   Keep the existing lock API (acquire/release per namespace) but implement it via `fs.open` with the `wx` flag so only one process can create the lockfile at a time.
*   Add a helper to backoff/retry when lockfiles exist, exposing a configurable timeout so long-running tasks do not block forever.
*   Integrate the new lock into `FilesystemAdapter`’s CRUD/bulk hooks, ensuring watchers detect each lock’s release via file deletions.

## 4. Verification Plan
**Automated Tests:**
*   Extend `core/tests/unit/filesystem-adapter.test.ts` to run concurrent writes from two adapters and assert the lock prevents simultaneous mutation (the second adapter must wait until the first completes).
*   Confirm the lockfiles are cleaned up even if the adapter throws before finishing the write.

**Manual Verification:**
*   Run two Node processes against the same directory and manually inspect lockfiles appearing/disappearing as adapters mutate data.

## 5. Blockers & Clarifications
*   Need to determine whether lockfiles should include metadata (PID, timestamp) to aid debugging.
*   Clarify how long retries/backoffs should last before throwing `TimeoutError`.

## 6. Execution Log
*   [2026-02-21] - Lock requirements captured; implementation pending.
