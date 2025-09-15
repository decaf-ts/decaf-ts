Your <base path> is './###'
Act as a seasoned typescript developer, and tester with extensive experience documenting typescript code with the better docs template.

under `workdocs/reports/coverage/clover.xml` you'll find the test coverage report for the repository.

create tests under `./tests/unit` folder to cover any untested lines, functions, statements and branches.

group related tests in the same file

ONLY mock non @decaf-ts external dependencies when extremely necessary.

use the npm command `npm run coverage` to run the tests and update the coverage file

repeat the above process until a minimum of 95% test coverage is reached.

when concluded, Update the coverage limits in workdows/reports/jest.coverage.config.ts to match the current coverage (round down)