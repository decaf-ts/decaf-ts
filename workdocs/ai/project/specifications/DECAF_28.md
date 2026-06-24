# DECAF-28: GitHub Actions Inventory, Normalization, and Rule Replication

**Status:** Planned
**Priority:** High
**Owner:** decaf-dev

## 1. Overview
The reusable-actions repository now exists, but the workspace still contains a mix of duplicated GitHub Actions, partially shared workflows, and repository-specific overrides. This specification formalizes the next pass: inventory every workflow in the workspace, determine which actions are truly reusable, migrate reusable logic into `reusable-actions`, and normalize the caller repositories so trigger rules and guard conditions stay consistent.

The focus of this specification is not just extracting common steps. It also requires an action-by-action review of the conditions that trigger each workflow, the repository-specific exceptions, and the inputs needed to make shared workflows more versatile without baking in assumptions from a single repository.

This specification covers the existing workflow matrix across the workspace, including:

* Shared candidates such as build, coverage, release, security, and pages workflows.
* Repository-specific workflows such as Docker-oriented `for-couchdb` jobs, `for-angular` Playwright execution, `integrations` alpha releases, and other repo-only pipelines.
* Trigger and rule normalization across all repositories that consume GitHub Actions.

## 2. Goals
*   [ ] Inventory every GitHub Actions workflow in the workspace and classify it as shared, repo-local, or hybrid.
*   [ ] Verify whether repo-specific-looking workflows are actually reusable and move them into `reusable-actions` when they are.
*   [ ] Make shared workflows more versatile by parameterizing inputs, secrets, permissions, node versions, commands, and cache/build behavior where appropriate.
*   [ ] Review each workflow trigger and condition on a per-action basis and replicate equivalent rules across the repositories that consume them.
*   [ ] Preserve existing CI behavior while eliminating duplicated workflow implementations.
*   [ ] Document the action-by-action rule matrix so future repositories can adopt the same automation patterns consistently.

## 3. User Stories / Requirements
*   **US-1:** As a maintainer, I want to know which workflows are truly reusable so I can centralize them once instead of updating copies in many repositories.
*   **US-2:** As a repository owner, I want the shared workflows to expose enough inputs and guards so they can fit different package layouts and release rules.
*   **US-3:** As a contributor, I want the consumer repositories to keep the same trigger behavior, branch filters, and skip conditions during the migration.
*   **US-4:** As a future maintainer, I want a documented rule matrix for every workflow so I can reason about trigger changes before editing them.
*   **Req-1:** Every GitHub Actions workflow in the workspace must be inventoried and categorized.
*   **Req-2:** Workflows moved to `reusable-actions` must remain callable from the consuming repositories through a stable interface.
*   **Req-3:** Trigger logic, branch/tag filters, path filters, and skip conditions must be preserved unless the spec explicitly approves a behavior change.
*   **Req-4:** Shared workflows must favor configurable inputs over repository-specific assumptions whenever practical.

## 4. Architecture & Design

### 4.1 Inventory scope
The inventory must cover the root workspace workflows and each repository that contains `.github/workflows` files. The current matrix includes shared workflow patterns for:

* Build and test: `nodejs-build-prod`, `jest-coverage`
* Release flows: `release-on-tag`, `release-on-merge-pr`, `publish-on-release`
* Security and policy: `codeql-analysis`, `snyk-analysis`, `trivy-scan`
* Release automation helpers: `auto-merge-renovate`, `bug-in-progress-workflow`, `bug-pull-request-workflow`
* Pages/static publishing: `pages`, plus repo-specific variants such as `static`
* Repository-specific pipelines: `docker-couchdb`, `docker-couchdb-boot`, `release-alpha-on-tag`, `playwright`, and `jest-test`

Each workflow must be recorded with:

* Repository name
* Workflow file path
* Event triggers
* Branch, tag, and path filters
* Skip conditions such as `[skip ci]`
* Job-level `if` conditions
* Permissions
* Required secrets and environment dependencies
* Build/test/release commands
* Cache and artifact behavior
* Any repo-specific step that prevents direct reuse

### 4.2 Reuse model
Reusable workflows should live under `reusable-actions/.github/workflows` and remain generic enough to support multiple repositories. The workflows should be parameterized around:

* Package manager and install command
* Build command and test command
* Node version matrix
* Coverage thresholds or reporting flags
* Release branch or tag conventions
* Secret names or tokens used by the caller
* Optional pre/post steps when a repository needs small customizations

When a workflow is shared, consumer repositories should call it instead of duplicating the workflow body. If a repository still needs a local wrapper, that wrapper should only contain repo-specific trigger wiring and call the reusable workflow for the common behavior.

### 4.3 Trigger and condition replication
This specification treats workflow rules as first-class behavior, not incidental YAML details. For each workflow, the following must be reviewed and replicated where applicable:

* `push`, `pull_request`, `release`, `workflow_dispatch`, `workflow_call`, and `workflow_run` semantics
* Branch and tag filters
* Path filters
* Skip markers such as `[skip ci]`
* Merge-only or tag-only release rules
* Security scan gating and repository visibility requirements
* Permissions differences between analysis, release, and automation workflows

The reusable repo should expose the shared rule inputs where possible. If a workflow is intentionally repository-specific, the spec must document why the rule cannot be generalized.

### 4.4 Action-by-action rule matrix
The migration must result in a rule matrix for every workflow that records:

* What triggers the workflow
* What conditions prevent the workflow from running
* What inputs are required by the reusable version
* What remains repository-local
* What behavior is replicated across all consumers

This matrix is the acceptance gate for the migration. If a workflow cannot be generalized, the exception must be explicit rather than implicit.

## 5. Tasks Breakdown
This specification is broken down into the following workstreams. The individual task files can be created from these workstreams when execution begins.

| ID | Task Name | Priority | Status | Dependencies |
|:---|:----------|:---------|:-------|:-------------|
| TASK-185 | [Inventory all workflow files and classify them by reuse potential](./tasks/TASK_185.md) | High | Pending | - |
| TASK-186 | [Extract or parameterize shared workflows in `reusable-actions`](./tasks/TASK_186.md) | High | Pending | TASK-185 |
| TASK-187 | [Update consumer repositories to call the shared workflows and replicate the trigger rules](./tasks/TASK_187.md) | High | Pending | TASK-186 |
| TASK-188 | [Document the action-by-action trigger and condition matrix](./tasks/TASK_188.md) | Medium | Pending | TASK-185 |
| TASK-189 | [Validate the final workflow behavior across representative repositories](./tasks/TASK_189.md) | Medium | Pending | TASK-187 |

## 6. Open Questions / Risks
*   Which workflows should remain repository-local because their trigger conditions are intentionally tied to a single repo?
*   Can the shared workflows cover all current package-manager and release conventions without requiring one-off forks?
*   Risk: normalizing triggers too aggressively could change CI behavior in a consumer repository if branch, tag, or path filters are not preserved exactly.
*   Risk: some workflows may appear reusable but depend on secrets, permissions, or repository metadata that cannot be safely generalized.

## 7. Results & Artifacts
*   `workdocs/ai/project/specifications/DECAF_28.md`
*   `workdocs/ai/project/plan.md` updated with the new specification entry
*   `workdocs/ai/project/specifications/tasks/TASK_185.md`
*   `workdocs/ai/project/specifications/tasks/TASK_186.md`
*   `workdocs/ai/project/specifications/tasks/TASK_187.md`
*   `workdocs/ai/project/specifications/tasks/TASK_188.md`
*   `workdocs/ai/project/specifications/tasks/TASK_189.md`
*   Action-by-action inventory and rule matrix for workspace GitHub Actions
*   Updated reusable workflows and consumer call sites, if execution follows this specification
