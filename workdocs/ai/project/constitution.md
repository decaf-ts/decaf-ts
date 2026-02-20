# CONSTITUTION

This document outlines the structure, conventions, and architecture of the project to ensure a Large Language Model (LLM) can effectively assist in its development.

## 00. Modules (roots)

-   `./decoration` eg `@decaf-ts/decoration`: decoration library, allowing for overridable and extensible decorators and a Metadata store.
-   `./utils` eg `@decaf-ts/utils`: development/testing utils library.
-   `./logging` eg `@decaf-ts/logging`: logging wrappers library.
-   `./decorator-validation` eg `@decaf-ts/decorator-validation`: model management mechanisms, base decorators, validation, hashing, serialization
-   `./db-decorators` eg `@decaf-ts/db-decorators`: expands decorators-validation with a Repository implementation and decorators/handlers to attached to CRUD hooks on the repository.
-   `./transcational-decorators` eg `@decaf-ts/transactional-decorators`: exposes basic locking and transaction decorators.
-   `./injectable-decorators` eg `@decaf-ts/injectable-decorators`: dependency injection decorators.
-   `./core` eg `@decaf-ts/core`: core module of the framework. Exposes extensible Adapter implementation and expands Repository to allow for persistence layer agnostic CRUD/Bulk/query
-   `./ui-decorators` eg `@decaf-ts/ui-decorators`: exposes UI decorators and base Rendering Engine.
-   `./crypto` eg `@decaf-ts/crypto`: browser/node crypo wrappers and encryption decoration.
-   `./cli` eg `@decaf-ts/cli`: cli wrapper decaf global implementation.
-   `./as-zod` eg `@decaf-ts/as-zod`: zod format converter.
-   `./for-couchdb` eg `@decaf-ts/for-couchdb`: CouchDB abstract implementation of core.
-   `./for-nano` eg `@decaf-ts/for-nano`: nano based concrete implementation for CouchDB.
-   `./for-pouch` eg `@decaf-ts/for-pouch`: pouchdb concrete implementation for CouchDB.
-   `./for-typeorm` eg `@decaf-ts/for-typeorm`: TypeORM concrete implementation for SQL based persistence.
-   `./for-http` eg `@decaf-ts/for-http`: Client HTTP concrete implementation (REST client).
-   `./for-nest` eg `@decaf-ts/for-nest`: Server (NestJS) HTTP concrete implementation (REST server).
-   `./for-fabric` eg `@decaf-ts/for-fabric`: Hyperledger Fabric concrete implementation (Client and Server).
-   `./styles` eg `@decaf-ts/styles`: (S)CSS for the decaf framework.
-   `./for-angular` eg `@decaf-ts/for-angular`: concrete Angular implementation of the Rendering engine.
-   `./mcp-server` eg `@decaf-ts/mcp-server`: mcp-server for decaf coding.

## 0. Development Workflow - NON NEGOTIABLE

After every code change, you **must** run the following commands to ensure code quality and prevent regressions:

1.  **Lint:** `npm run lint`
2.  **Build:** `npm run build`
3.  **Test:** `npm run test` (Use targeted tests for specific changes).

(These must be run in the appropriate module root)

#### multi-module changes

1.  **link:** `npm run npm-link` if necessary, you can run this command to link all decaf modules (eg building the code in one, makes it immediatly available to all other that dependen on it);
2.  **unlink:** `npm run npm-unlink` reverts npm-link. this is a long running verbose command. be patient and forward output to dev/null. only exit code matters;

when link is on, if you do a change in a dependency, building that dependency makes it immedeatly available to all that depende on it

## 1. Core Philosophy

The project aims to [Insert Project Goal Here].

### 1.1. CORE DESIGN INVARIANTS

These rules are **non-negotiable**.

1.  [Insert Hard Business Logic Rule 1]

## 2. Core Decaf Architectural Patterns

(Follow `@decaf-ts/core` patterns for Services, Repositories, Models, and Builders as detailed in the framework documentation.)

## 3. Testing Philosophy
*   **Unit Tests:** All functionality MUST have corresponding unit tests.
*   **Integration Tests:** Scenarios involving external dependencies MUST be covered.
*   **Test Coverage:** New features or bug fixes must be accompanied by tests.

## 4. Git Workflow

This section defines the Git workflow for the agent.

*   **Mode:** `commit`
    *   **Description:** Defines the git strategy.
    *   **Options:**
        *   `commit`: All changes are committed directly to the main branch after a task is successfully completed.
        *   `branch`: Create a new branch for each task, and create a Pull Request when the task is complete.
*   **Main Branch:** `master`
    *   **Description:** The primary branch for commits and for opening pull requests against.
*   **Commit Keys:**
    *   **Task:** `TASK`
    *   **Specification:** `SPECIFICATION`

## 5. How to Fulfill a Request: A Checklist

1.  **Identify Goal & Service:** Determine the responsible service/class.
2.  **Create/Modify Object:** Ensure it's properly decorated (if applicable).
3.  **Implement Method:** Use descriptive names and pass `context`.
4.  **Write Tests:** Unit and Integration tests are mandatory.
5.  **Follow Git Workflow:** Adhere to the configured git `Mode` for branching and committing.
