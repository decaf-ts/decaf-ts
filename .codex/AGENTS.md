# Repository Guidelines

## Project Structure & Module Organization
Source TypeScript lives in `src/` with public exports consolidated in `src/index.ts`. Tests stay in `tests/unit`, `tests/integration`, and `tests/bundling` for packaging checks. Build artefacts are emitted to `lib/` (CJS + ESM + typings) and `dist/` (CJS + ESM bundled). Generated documentation resides in `docs/`, while editable assets and scripts live in `workdocs/`; refresh diagrams there before copying outputs.

## Build, Test, and Development Commands
### Scripts

The following npm scripts are available for development:

- `do-install` - sets a `TOKEN` environment variable to the contents of `.token` and runs npm install (useful when you
  have private dependencies);
- `update-scripts`: will pull the GitHub actions, templates, and style configs from the [ts-workspace](https://github.com/decaf-ts/ts-workspace) repository, overwriting the existing.
- `on-first-run`: will run the initial setup script,
- `set-git-auth` - change git config to include the token (no longer requires manual auth);
- `postinstall` - will run only on the first installation to trigger the dep update. Will self-delete;
- `flash-forward` - updates all dependencies. Take care, This may not be desirable is some cases;
- `reset` - updates all dependencies. Take care, This may not be desirable is some cases;
- `build` - builds the code (via gulp `gulpfile.js`) in development mode (generates `lib` and `dist` folder);
- `build:prod` - builds the code (via gulp `gulpfile.js`) in production mode (generates `lib` and `dist` folder);
- `test` - default project test script, defaults to `test:unit`;
- `test:unit` - runs unit tests;
- `test:integration` - runs it tests;
- `test:all` - runs all tests;
- `test:circular` - tests for circular dependencies;
- `coverage` - runs all tests, calculates coverage (html/csv), generates a test report (HTML and junit) and generates badges for readme;
- `prepare-pr`: same as prepare-release,
- `lint` - runs es lint on the code folder;
- `lint-fix` - tries to auto-fix the code folder;
- `prepare-release` - defines the commands to run prior to a new tag (defaults to linting, building production code,
  running tests and documentation generation);
- `release` - triggers a new tag being pushed to master (via `./bin/tag_release.sh`);
- `clean-publish` - cleans the package.json for publishing;
- `drawings` - compiles all DrawIO `*.drawio` files in the `workdocs/drawings` folder to png and moves them to
  the `workdocs/resources` folder;
- `uml` - compiles all PlantUML `*.puml` files in the `workdocs/uml` folder to png and moves them to
  the `workdocs/resources` folder;
- `docs` - compiles all the coverage, drawings, uml, jsdocs, and md docs into a readable web page under `./docs`. Will be made available at [GitHub Pages](https://decaf-ts.github.io/ts-workspace);
- `publish-docs` - publishes the content of `./workdocs/confluence` to confluence according to the config at `./workdocs/confluence/.markdown-confluence.json`.

## Coding Style & Naming Conventions
ESLint (`eslint.config.js`) and Prettier enforce two-space indentation, trailing commas where ES5 allows, and semicolons. The project compiles with strict TypeScript settings (`strict`, `noImplicitAny`, `noImplicitOverride`), so resolve warnings instead of suppressing them. Use PascalCase for classes, camelCase for functions and variables, and SCREAMING_SNAKE_CASE for shared constants. Keep module entry points lean and re-export public APIs through `src/index.ts`.

## Testing Guidelines
- `npm run test` - default repository test script. defaults to `test:unit`;
- `npm run test:unit` - unit tests under the `tests/unit` folder without coverage;
- `npm run test:all` - include a dist/bundle test under `tests/bundling` (helps with circular dependencies dist test);
- `npm run test:bundling` - integration tests under the `tests/integration` folder;
- `npm run test:circular` - stores coverage results under `workdocs/coverage`;
- `npm run coverage` - stores coverage & test reports under `workdocs/reports`;
- Coverage and test results will become part of exported docs;
- ignores `cli.ts` from coverage since that is an executable file;
- uses `jest.config.ts` as its base config;
- uses `workdocs/reports/jest.coverage.config.ts` as its base config;
- defines the coverage threshold in `workdocs/reports/jest.coverage.config.ts`;
- 
- Name specs with `*.test.ts`. Isolate logic in unit suites never mock. It a mock is required, write an integration test instead; move cross-module workflows to `tests/integration`. Update `tests/bundling` whenever new build-time dependencies or entry points are introduced. Run `npm run coverage` before merging and confirm the generated reports in `workdocs/reports/data/`.

## Commit & Pull Request Guidelines
Mirror existing history by prefixing commit subjects with the tracker key or branch name (e.g., `DECAF-123 short summary`) or semantic version when cutting a release. Keep subjects under 72 characters and include rationale in the body when behaviour changes. Pull requests should link issues, list validation commands (`lint`, `test`, `coverage`), and attach screenshots for visual updates. Run `npm run prepare-pr` and mention any skipped steps.

## Documentation & Assets
Use Node 22+ and npm 10+. Rebuild documentation with `npm run docs`; regenerate diagrams via `npm run drawings` or `npm run uml` (requires Docker). Keep sensitive tokens (`.npmtoken`, `.confluence-token`) out of commits and refresh them only through the existing automation.
