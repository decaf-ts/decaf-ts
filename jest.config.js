const modules = require("./bin/modules");
const fs = require("fs");
const path = require("path");

const jestConfigs = modules
  .map((m) =>
    fs
      .readdirSync(path.join(__dirname, m))
      .filter((f) => f.match(/jest\.config.*?\.[jt]s$/))
      .reduce((accum, f) => {
        accum.push(`<rootDir>/${m}/${f}`);
        return accum;
      }, []),
  )
  .reduce((accum, e) => {
    accum.push(...e);
    return accum;
  }, []);

module.exports = {
  projects: jestConfigs,
  rootDir: __dirname,
  displayName: "Decaf Workspace",
  verbose: true,
  transform: { "^.+\\.ts?$": "ts-jest" },
  testEnvironment: "node",
  testRegex: "/tests/.*\\.(test|spec)\\.(ts|tsx)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: false,
  coverageDirectory: "./workdocs/reports/coverage",
  collectCoverageFrom: [
    "**/src/**/*.{js,jsx,ts,tsx}",
    "!src/bin/**/*",
    "!**/src/**/*.spec.{js,jsx,ts,tsx}",
    "!**/src/**/*.mock.{js,jsx,ts,tsx}",
    "!**/src/**/*.e2e.{js,jsx,ts,tsx}",
    "!**/tests/**/*.test.{js,jsx,ts,tsx}",
  ],
  reporters: ["default"],
};
