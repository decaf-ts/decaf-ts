const path = require("path");
let conf;
try {
  conf = require(path.join(__dirname, "../../jest.config"));
} catch (e) {
  conf = require(path.join(__dirname, "../../../jest.config"));
}

const config = {
  ...conf,
  collectCoverage: true,
  coverageDirectory: path.join(__dirname, "coverage"),
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: path.join(__dirname, "junit"),
        outputName: "junit-report.xml",
      },
    ],
    [
      "jest-html-reporters",
      {
        publicPath: path.join(__dirname, "/html"),
        filename: "test-report.html",
        openReport: true,
        expand: true,
        pageTitle: "Decaf-ts (is almost a) Framework Test Report",
        stripSkippedTest: true,
        darkTheme: true,
        enableMergeData: true,
        dataMergeLevel: 2,
      },
    ],
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 100,
      lines: 80,
      statements: 90,
    },
  },
};

module.exports = config;
