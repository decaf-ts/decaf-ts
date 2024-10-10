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

  displayName: 'Decaf Workspace',
  // testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    '**/src/**/*.[jt]s',
    '!**/src/**/*.spec.[jt]s',
    '!**/src/**/*.mock.[jt]s',
    '!**/src/**/*.e2e.[jt]s',
    '!**/tests/**/*.test.[jt]s',
  ],
  // coverageThreshold: {
  //     global: {
  //         statements: 90,
  //         branches: 75,
  //         functions: 85,
  //         lines: 90,
  //     },
  // },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: "./workdocs/coverage",
  reporters: [
    "default",
    ["jest-junit", {outputDirectory: './workdocs/coverage', outputName: "junit-report.xml"}]
  ]
}