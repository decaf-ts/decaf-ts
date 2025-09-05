const Sequencer = require("@jest/test-sequencer").default;
const { Logging } = require("@decaf-ts/logging");
const modules = require("../../bin/modules").reduce((acc, m, i) => {
  acc[m] = i;
  return acc;
}, {});

class DecafTestSequencer extends Sequencer {
  log = Logging.for(DecafTestSequencer);
  /**
   * Sort test to determine order of execution
   * Sorting is applied after sharding
   */
  sort(tests) {
    const sorted = tests
      .map((t) => ({
        test: t,
        path: t.path,
        config: t.context.config,
      }))
      .sort((testA, testB) => {
        const regexp = new RegExp("decaf\-ts\/([\\w-]+)\/tests", "g");
        let m = regexp.exec(testA.path);
        if (!m)
          throw new Error("Not part of the decaf-ts suite: " + testA.path + "");
        const module1 = m[1];
        regexp.lastIndex = 0;
        m = regexp.exec(testB.path);
        if (!m)
          throw new Error("Not part of the decaf-ts suite: " + testB.path + "");
        const module2 = m[1];
        const numberA = parseInt(modules[module1]);
        const numberB = parseInt(modules[module2]);
        return numberA > numberB ? 1 : -1;
      })
      .map((t) => t.test);

    this.log.info("Sorted tests: ", sorted);
    return sorted;
  }
}

module.exports = DecafTestSequencer;
