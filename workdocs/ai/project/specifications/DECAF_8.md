# DECAF-8 — Universal E2E Test Coverage

- **Status:** Proposed
- **Priority:** High
- **Goal:** Implement comprehensive end-to-end tests for every module that test against src, lib, and dist builds without mocking anything.

---

## 1. Description

Create a standardized E2E test architecture that runs for every module in the decaf-ts monorepo. The tests must:

- **Never mock** any dependencies - always import from the import proxy configured via `e2e.config.ts`
- Test against **three build stages**: source TypeScript (`src`), compiled CommonJS (`lib`), and bundled/minified distribution (`dist`)
- Verify that all exported methods work correctly in all three environments
- Use a unified configuration system that proxies imports to allow switching between build targets
- Run `npm run build` in each module before testing against its compiled outputs

---

## 2. Objectives

*   [ ] Create generic E2E test infrastructure that works across all modules
*   [ ] Implement `e2e.config.ts` pattern that proxies imports from src/lib/dist
*   [ ] Create `e2e.test.ts` template that tests ALL exported methods without mocking
*   [ ] Add E2E tests to every module (decoration, core, utils, logging, crypto, etc.)
*   [ ] Ensure imports use only the proxy configuration, never direct module paths
*   [ ] Set up Jest configuration to run tests against all three build stages

---

## 3. Implementation Plan

### 3.1 E2E Configuration Template (`e2e.config.ts`)

```typescript
import { getPackage } from "@decaf-ts/utils";

/**
 * @description Test root directory configuration
 * - "src": Test against source TypeScript files (default)
 * - "lib": Test against CommonJS transpiled output
 * - "dist": Test against bundled distribution
 */
export const TEST_ROOT: "src" | "lib" | "dist" = (process.env.TEST_ROOT ||
  "src") as "src" | "lib" | "dist";

const pkg = getPackage();

/**
 * @description Computes the export path based on TEST_ROOT
 */
function getExportPath(): string {
  const basePath = `../../${TEST_ROOT}`;

  switch (TEST_ROOT) {
    case "dist":
      return basePath + `/${pkg["name"].split("/")[1]}.cjs`;
    case "lib":
      return basePath + `/index.cjs`;
    default:
      return basePath + `/index`;
  }
}

/**
 * @description The computed export path for the library
 */
export const EXPORT_PATH = getExportPath();

/**
 * @description Configuration for E2E tests
 */
export interface E2eConfig {
  testRoot: "src" | "lib" | "dist";
  exportPath: string;
  packageName: string;
  packageVersion: string;
}

/**
 * @description E2E test configuration object
 */
export const e2eConfig: E2eConfig = {
  testRoot: TEST_ROOT,
  exportPath: EXPORT_PATH,
  packageName: pkg["name"],
  packageVersion: pkg["version"],
};

/**
 * @description Dynamically loads the library from the configured path
 * @returns Promise resolving to the library module
 */
export async function getLibrary(): Promise<
  typeof import("../../src/index")
> {
  return await import(EXPORT_PATH);
}

// Re-export all types from source for TypeScript type checking
export type * from "../../src/index";

// Static re-exports for TypeScript transpilation
// The actual runtime behavior comes from getLibrary()
export {
  // All exported members from source
} from "../../src/index";
```

### 3.2 E2E Test Template (`e2e.test.ts`)

```typescript
/**
 * @description E2E tests for MODULE_NAME package
 * Tests all exported methods against src/lib/dist builds
 * 
 * ALL IMPORTS must come from e2e.config.ts only
 * NEVER mock dependencies - always use dynamic imports
 */
import { getLibrary, TEST_ROOT } from "./e2e.config";
import type {
  // All types from source
} from "./e2e.config";

describe(`E2E Tests for MODULE_NAME [${TEST_ROOT}]`, () => {
  let lib: Awaited<ReturnType<typeof getLibrary>>;

  beforeAll(async () => {
    lib = await getLibrary();
  });

  describe("Exported Methods", () => {
    it("should export and execute all public methods", async () => {
      // Test each exported function/class/method
      // Example:
      expect(lib.someFunction).toBeInstanceOf(Function);
      expect(lib.SomeClass).toBeInstanceOf(Function);
    });

    // Add tests for each exported member
  });

  // Add more describe blocks as needed
});
```

### 3.3 Module Steps

For **each module** in the monorepo:

1. Create `tests/e2e/` directory if it doesn't exist
2. Add `e2e.config.ts` (adapted for module's exports)
3. Add `e2e.test.ts` with tests for ALL exported members
4. Update Jest config to run with `TEST_ROOT=src`, `TEST_ROOT=lib`, `TEST_ROOT=dist`
5. Run `npm run build` before tests execute against lib/dist

---

## 4. Verification Plan

**Automated Tests:**
*   Each module's E2E tests must pass against all three `TEST_ROOT` values
*   Tests must fail if any exported member is missing or broken in any build stage
*   No mocks allowed - tests must use real implementation code

**Manual Verification:**
*   Verify `TEST_ROOT=src` tests against source TypeScript
*   Verify `TEST_ROOT=lib` tests after `npm run build` (compilation)
*   Verify `TEST_ROOT=dist` tests after bundling/minification

---

## 5. Blockers & Clarifications

*   **Blocking issue:** Some modules may need custom `e2e.config.ts` due to unique export structures
*   **Clarification needed:** Should E2E tests be part of the main test suite or separate?
*   **Clarification needed:** How to handle modules with side-effect-only exports (e.g., decorator modules)?

---

## 6. Future Enhancements

*   Add E2E test coverage reporting to track which modules have tests
*   Create CI workflow that auto-generates E2E tests based on module exports
*   Add performance benchmarks for each build stage (src vs lib vs dist)
*   Create test fixtures for common patterns (e.g., class decorators, functions, classes)
