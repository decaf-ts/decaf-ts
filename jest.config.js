const modules = require("./bin/modules");
const fs = require("fs");
const path = require("path");

const jestConfigs = modules.map(m => fs.readdirSync(path.join(process.cwd(), m))
    .filter(f => f.match(/jest\.config.*?\.[jt]s$/))
    .reduce((accum, f) => {
      accum.push(`<rootDir>${m}/${f}`)
      return accum
    }, [])).reduce((accum, e) => {
  accum.push(...e)
  return accum
}, [])


module.exports = {
  projects: jestConfigs,

  displayName: 'Decaf Multi Module Typescript template',
  // testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    '**/src/**/*.[jt]s',
    '!**/src/**/*.spec.[jt]s',
    '!**/src/**/*.mock.[jt]s',
    '!**/src/**/*.e2e.[jt]s',
    '!**/tests/**/*.test.[jt]s',
  ],
  coverageThreshold: {
      global: {
          statements: 90,
          branches: 75,
          functions: 85,
          lines: 90,
      },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: "./workdocs/coverage",
  reporters: [
    "default",
    ["jest-junit", {outputDirectory: './workdocs/coverage', outputName: "junit-report.xml"}]
  ]
}


module.exports = {
  verbose: true,
  transform: {'^.+\\.ts?$': 'ts-jest'},
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.(test|spec|integration)\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: "./workdocs/coverage",
  collectCoverageFrom: ['src/**/*.{ts,jsx}'],
  coveragePathIgnorePatterns: [
    "*cli.ts"
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 100,
      lines: 80,
      statements: 90
    }
  },
  coverageReporters: [
    "json-summary",
    "text-summary",
    "text",
    "html"
  ],
  reporters: [
    "default",
    ["jest-junit", {outputDirectory: './workdocs/coverage', outputName: "junit-report.xml"}]
  ]
};