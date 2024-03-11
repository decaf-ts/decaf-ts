### Scripts

The following npm scripts are available for development:

- `inital-setup` - will run only on the first install to trigger the dep update. will self delete;
- `preinstall` - initializes the git modules;
- `do-install` - sets a `TOKEN` environment variable to the contents of `.token` and runs npm install (useful when you
  have private dependencies);
- `postinstall` - checkout master on all modules, pulls and install dependencies;
- `flash-forward` - updates all dependencies. Take care, This may not be desirable is some cases;
- `reset` - updates all dependencies. Take care, This may not be desirable is some cases;
- `reset-build` - resets and then builds;
- `link-token` - creates symlinks in all modules to the `.token`;
- `set-dev` - checout out master on all modules and symlinks the relative dependencies according to the modules;
- `test` - runs unit tests;
- `test:unit` - runs it tests;
- `test:all` - runs all tests;
- `coverage` - runs all test, calculates coverage and generates badges for readme;
- `build-all` - builds the code (via gulp `gulpfile.js`) in development mode (generates `lib` and `dist` folder);
- `build-all:prod` - builds the code (via gulp `gulpfile.js`) in production mode (generates `lib` and `dist` folder);
- `npm-link` - symlinks relative dependencies;
- `npm-unlink` - reverses the dependency symlink process;
- `set-to-latest` - checkout all modules to master;
- `git-checkout` - checkout all modules to master;
- `git-pull` - pull all modules;
- `git-all` - runs git command in all modules;
- `run-all` - runs command in all modules;
- `prepare-release` - defines the commands to run prior to a new tag (defaults to linting, building production code,
  running tests and documentation generation);
- `release` - triggers a new tag being pushed to master (via `./bin/tag_release.sh`);
- `clean-publish` - cleans the package.json for publishing;
- `drawings` - compiles all DrawIO `*.drawio` files in the `workdocs/drawings` folder to png and moves them to
  the `workdocs/resources` folder;
- `uml` - compiles all PlantUML `*.puml` files in the `workdocs/uml` folder to png and moves them to
  the `workdocs/resources` folder;
- `docs` - compiles all the coverage, drawings, uml, jsdocs and md docs into a readable web page under `./docs`;
