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
  // Normalize scoped decaf name to local folder name
  const name = dependency.includes("@decaf-ts/")
    ? dependency.split("@decaf-ts/")[1]
    : dependency;

  // If there's a local package folder matching the name, use its package.json
  const localPkgPath = path.join(process.cwd(), name, "package.json");
  if (fs.existsSync(localPkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(localPkgPath));
      return pkg.version;
    } catch (err) {
      throw new Error(`Unable to read version from ${localPkgPath}: ${err.message}`);
    }
  }

  // If the dependency corresponds to another bundle entry, use the root release version
  if (bundles && bundles[name]) {
    return decaf.version;
  }

  // As a last resort, try to read using the original dependency string as a path
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), dependency, "package.json")),
    );
    return pkg.version;
  } catch (err) {
    throw new Error(
      `Cannot resolve version for dependency '${dependency}'. Ensure the package exists in the workspace or the bundles.json entry references a known bundle. Original error: ${err.message}`,
    );
  }
}

/**
 * builds the bundle folder for npm release
 *
 * @param {string} name
 * @param {string} version
 * @param {object} entry - bundle entry object from bundles.json
 */
function createBundle(name, version, entry) {
  const pPath = path.join(basePath, name);
  fs.mkdirSync(pPath, { recursive: true });
  filesToLink.forEach((f) => {
    const target = path.join(process.cwd(), f);
    const link = path.join(pPath, f);
    try {
      if (fs.existsSync(link)) fs.unlinkSync(link);
      fs.symlinkSync(target, link);
    } catch (err) {
      console.warn(`Warning: could not create symlink ${link} -> ${target}: ${err.message}`);
    }
  });

  const pkg = Object.assign({}, template);
  pkg.name = `@decaf-ts/${name}`;
  pkg.version = version;
  pkg.description = `Decaf-ts' ${name} install`;

  // Set license: prefer entry.license, then template, then root
  if (entry && entry.license) {
    pkg.license = entry.license;
  } else if (!pkg.license && decaf && decaf.license) {
    pkg.license = decaf.license;
  }

  // Merge keywords: entry.keywords overrides/extends template
  if (Array.isArray(pkg.keywords) && Array.isArray(entry && entry.keywords)) {
    const merged = Array.from(new Set([...pkg.keywords, ...entry.keywords]));
    pkg.keywords = merged;
  } else if (Array.isArray(entry && entry.keywords)) {
    pkg.keywords = entry.keywords;
  }

  // ensure dependencies and devDependencies objects exist
  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};

  const dependencies = Array.isArray(entry && entry.dependencies)
    ? entry.dependencies
    : [];
  const devs = Array.isArray(entry && entry.devDependencies)
    ? entry.devDependencies
    : [];

  // populate dependencies
  dependencies.forEach((dependency) => {
    try {
      const version = getVersion(dependency);
      pkg.dependencies[dependency] = `^${version}`;
    } catch (err) {
      console.error(`Error resolving dependency ${dependency} for bundle ${name}: ${err.message}`);
      throw err;
    }
  });

  // populate devDependencies
  devs.forEach((dependency) => {
    try {
      const version = getVersion(dependency);
      pkg.devDependencies[dependency] = `^${version}`;
    } catch (err) {
      console.error(`Error resolving devDependency ${dependency} for bundle ${name}: ${err.message}`);
      throw err;
    }
  });

  fs.writeFileSync(
    path.join(pPath, "package.json"),
    JSON.stringify(pkg, undefined, 2),
  );

  // Respect DRY_RUN for safe testing
  if (process.env.DRY_RUN === "1") {
    console.log(`[DRY_RUN] Created package.json for ${name} at ${pPath}. Skipping npm install/publish.`);
    return;
  }

  try {
    execSync("npm install", {
      cwd: pPath,
      stdio: "inherit",
      env: {
        ...process.env,
        TOKEN: fs.existsSync(path.join(pPath, ".token"))
          ? fs.readFileSync(path.join(pPath, ".token")).toString()
          : process.env.TOKEN || "",
      },
    });
  } catch (err) {
    console.error(`npm install failed for bundle ${name}: ${err.message}`);
    throw err;
  }

  try {
    execSync("npm publish --access public", {
      cwd: pPath,
      stdio: "inherit",
      env: {
        ...process.env,
        NPM_TOKEN: fs.existsSync(path.join(pPath, ".npmtoken"))
          ? fs.readFileSync(path.join(pPath, ".npmtoken")).toString()
          : process.env.NPM_TOKEN || "",
      },
    });
  } catch (err) {
    console.error(`npm publish failed for bundle ${name}: ${err.message}`);
    throw err;
  }
}

Object.entries(bundles).forEach(([bundle, rawEntry]) => {
  // Backwards compatibility: allow array-style entries (legacy format)
  const entry = Array.isArray(rawEntry) ? { dependencies: rawEntry } : rawEntry || {};
  resetReleaseFolder(bundle);
  createBundle(bundle, decaf.version, entry);
});
