# DECAF-27: Reusable GitHub Actions Repository

**Status:** Planned
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
Create a new `reusable-actions` repository in the `decaf-ts` workspace that centralizes GitHub Actions assets for reuse across the other repositories.

The target structure must provide a shared `.github/workflows` area under `reusable-actions/` where reusable workflows and related action definitions can live. Existing repositories should be migrated away from duplicated workflow logic and updated to consume the shared automation from this repository wherever practical.

The end state is a workspace-level automation repo that can be versioned independently and reused by the other Decaf repositories without copying workflow implementations around.

This specification is scoped to reusable GitHub Actions workflows under `.github/workflows`. It does not introduce composite actions unless a later inventory task finds a concrete need for them.

## 2. Goals
*   [ ] Create a new `reusable-actions` repository folder in the workspace with a GitHub Actions-compatible layout.
*   [ ] Centralize reusable workflow definitions under `reusable-actions/.github/workflows`.
*   [ ] Inventory the current repositories and identify duplicated GitHub Actions logic that should move into the shared repo.
*   [ ] Migrate repository-specific workflows to call the shared reusable workflows where possible.
*   [ ] Keep the migration incremental so existing CI behavior remains stable while repositories are updated one by one.
*   [ ] Document the reuse model so future repositories can adopt the shared automation consistently.

## 3. User Stories / Requirements
*   **US-1:** As a maintainer, I want shared workflow logic in one repository so I do not have to copy changes into every repo.
*   **US-2:** As a contributor, I want existing repositories to continue building and testing during the migration so the change is low risk.
*   **US-3:** As a future repository owner, I want a clear reusable-actions layout so I can adopt the shared workflows without guessing the structure.
*   **Req-1:** The `reusable-actions` repository must contain its reusable GitHub Actions assets under `.github/workflows`.
*   **Req-2:** Existing repositories must be migrated toward referencing the shared automation instead of duplicating workflow definitions.
*   **Req-3:** The migration must preserve the current CI behavior unless a workflow change is intentionally introduced.
*   **Req-4:** The final structure must be documented so other repositories can reuse it consistently.

## 4. Architecture & Design

### 4.1 Repository layout
The new workspace repository should be structured around a reusable GitHub Actions root:

```text
reusable-actions/
  .github/
    workflows/
      <shared-workflow>.yml
      <shared-workflow>.yml
```

The exact workflow list is expected to emerge from the inventory step, but the repository should be shaped so reusable workflows are the primary product, not repo-specific CI jobs.

### 4.2 Migration model

- First, inventory all existing GitHub Actions usage across the workspace repositories.
- Next, classify workflows into:
  - reusable candidates that should move into `reusable-actions/.github/workflows`
  - repo-local workflows that should remain in place
  - workflows that should become thin callers to the shared repo
- Then, migrate consumers in small batches so each repository keeps a working CI path during the transition.
- Finally, document the canonical calling pattern for future repositories.

### 4.3 Reuse boundaries

- Shared workflows should contain generic build/test/release behavior, not repo-specific business logic.
- Repository-specific inputs, secrets, and path settings should stay configurable at call time.
- The shared repo should avoid hard-coding assumptions about any single package or module unless the workflow is intentionally specific to that package.

## 5. Tasks Breakdown
This specification is broken down into the following tasks. Each task should be small enough to be planned and executed separately.

| ID           | Task Name                                                    | Priority | Status  | Dependencies |
|:-------------|:-------------------------------------------------------------|:---------|:--------|:-------------|
| TASK-181    | [Inventory existing GitHub Actions usage](./tasks/TASK_181.md) | High     | Completed | -            |
| TASK-182    | [Create the reusable-actions repository layout](./tasks/TASK_182.md) | High | Completed | TASK-181 |
| TASK-183    | [Extract shared workflows and migrate consumers](./tasks/TASK_183.md) | High | Completed | TASK-182 |
| TASK-184    | [Document reuse patterns and validation steps](./tasks/TASK_184.md) | Medium | Completed | TASK-183 |

## 6. Open Questions / Risks
*   Which workflows should remain repository-local because they are intentionally repo-specific?
*   Risk: migrating too aggressively could break individual repository CI if caller inputs or secrets are not aligned first.
*   Risk: the workspace may contain different GitHub Actions conventions across repositories, so the reuse boundary may need to stay conservative initially.

## 7. Results & Artifacts
*   `workdocs/ai/project/specifications/DECAF_27.md`
*   `workdocs/ai/project/plan.md` updated with the new specification entry
*   `workdocs/ai/project/specifications/tasks/TASK_181.md`
*   `workdocs/ai/project/specifications/tasks/TASK_182.md`
*   `workdocs/ai/project/specifications/tasks/TASK_183.md`
*   `workdocs/ai/project/specifications/tasks/TASK_184.md`
*   `reusable-actions/README.md`
