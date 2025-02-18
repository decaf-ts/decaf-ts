const libs = require("./modules");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { rimraf } = require("rimraf");

const filesToLink = [".npmtoken", ".token", ".npmrc"];

const basePath = path.join(process.cwd(), "bin", "releases");

const bundles = JSON.parse(
  fs.readFileSync(path.join(basePath, "bundles.json")),
);

const template = JSON.parse(
  fs.readFileSync(path.join(basePath, "package-template.json")),
);

const decaf = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json")),
);

/**
 * checks if the release folder exists and deletes it if so
 * @param {string} name
 */
function resetReleaseFolder(name) {
  let result;
  const p = path.join(basePath, name);
  try {
    result = fs.statSync(p);
  } catch (e) {
    return;
  }
  fs.rmSync(p, { recursive: true });
}

/**
 * Retrieves the current version of a module
 * @param {string} dependency
 * @returns {string} the version of the module
 */
function getVersion(dependency) {
  dependency = dependency.includes("@decaf-ts/")
    ? dependency.split("@decaf-ts/")[1]
    : dependency;
  const pkg = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), dependency, "package.json")),
  );
  return pkg.version;
}

/**
 * builds the bundle folder for npm release
 *
 * @param {string} name
 * @param {string} version
 * @param {string[]} dependencies
 */
function createBundle(name, version, dependencies) {
  fs.mkdirSync(path.join(basePath, name));
  filesToLink.forEach((f) => {
    fs.symlinkSync(path.join(process.cwd(), f), path.join(basePath, name, f));
  });
  const pkg = Object.assign({}, template);
  pkg.name = `@decaf-ts/${name}`;
  pkg.version = version;
  pkg.description = `Decaf-ts' ${name} install`;
  dependencies.forEach((dependency) => {
    const version = getVersion(dependency);
    pkg.dependencies[dependency] = `^${version}`;
  });
  fs.writeFileSync(
    path.join(basePath, name, "package.json"),
    JSON.stringify(pkg, undefined, 2),
  );
  execSync("npm install", {
    cwd: path.join(basePath, name),
    stdio: "inherit",
    env: {
      ...process.env,
      TOKEN: fs.readFileSync(path.join(basePath, name, ".token")).toString(),
    },
  });
  execSync("npm publish --access public", {
    cwd: path.join(basePath, name),
    stdio: "inherit",
    env: {
      ...process.env,
      NPM_TOKEN: fs
        .readFileSync(path.join(basePath, name, ".npmtoken"))
        .toString(),
    },
  });
}

Object.entries(bundles).forEach(([bundle, dependencies]) => {
  resetReleaseFolder(bundle);
  createBundle(bundle, decaf.version, dependencies);
});
