const libs = require("./modules");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

let operation = process.argv.find((a) => a.startsWith("--"));
operation = operation ? operation.substring(2, operation.length) : "link";

const outerPkg = require(path.join(process.cwd(), "package.json"));

const scope = outerPkg["name"].split("/")[0];

if (operation === "link") {
  libs.forEach((l) => {
    const pkg = require(path.join(process.cwd(), l, "package.json"));
    const dependencies = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ].filter((d) => d.startsWith(scope));
    dependencies.forEach((d) => {
      try {
        let pathToRemove = `node_modules/${d}/lib`;
        let linkRel = `../../../../`;
        let name = d.split("/")[1];
        let linkPath = name;
        let linkName = name;
        let cwd = path.join(process.cwd(), l, `node_modules/${scope}`);

        console.log(`${operation}ing ${d} as a dependency of ${l}`);
        execSync(`rm -rf ${pathToRemove}`, {
          cwd: path.join(process.cwd(), l),
          env: process.env,
        });
        execSync(`ln -s ${linkRel}${linkPath}/lib ./lib`, {
          cwd: path.join(cwd, linkName),
          env: process.env,
        });
      } catch (e) {
        console.log(`Failed to link ${d} as a dependency of ${l}: ${e}`);
        process.exit(1);
      }
    });
  });
} else if (operation === "unlink") {
  libs.forEach((l) => {
    const pkg = require(path.join(process.cwd(), l, "package.json"));
    const dependencies = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ].filter((d) => d.startsWith(scope));
    dependencies.forEach((d) => {
      console.log(`${operation}ing ${d} as a dependency of ${l}`);
      try {
        execSync(`rm -rf  node_modules/${d}`, {
          cwd: path.join(process.cwd(), l),
          env: process.env,
        });
      } catch (e) {
        process.exit(1);
      }
    });
    try {
      execSync(`npm run do-install`, {
        cwd: path.join(process.cwd(), l),
        env: process.env,
      });
    } catch (e) {
      process.exit(1);
    }
  });
} else {
  libs.forEach((l) => {
    console.log(`${operation}ing ${l}`);
    try {
      execSync(`npm ${operation}`, {
        cwd: path.join(process.cwd(), l),
        env: process.env,
      });
    } catch (e) {
      process.exit(1);
    }
  });
}
