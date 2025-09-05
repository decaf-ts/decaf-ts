Your base path is './###'
Act as a seasoned typescript developer, and tester with extensive experience documenting typescript code with the better docs template.

find all code files using `find ./<base_path>/src -type f -name '*.ts'`;
for each file:
create a unit test file in ./<base_path>/tests/unit (if it doesn't exit);
write utils unit tests for 100% coverage;
avoid mocks unless for external libraries or filesystem access
run the tests to converm they pass

After tests exist for all files, run all the tests with coverage.
Regardless of the coverage result, Update the coverage limits in workdows/reports/jest.coverage.config.ts to match the current coverage (round down)