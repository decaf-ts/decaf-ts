#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
for (const script of ["graphs:architecture-handbook", "graphs:modules:code"]) {
  const result = spawnSync("npm", ["run", script, "--", ...process.argv.slice(2)], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
