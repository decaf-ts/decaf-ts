#!/usr/bin/env node

const { mkdirSync } = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
let format = "json";
let exclude;
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index] === "--format") format = process.argv[++index];
  else if (process.argv[index] === "--exclude") exclude = process.argv[++index];
  else throw new Error(`Unsupported graph option: ${process.argv[index]}`);
}
if (!["json", "mermaid"].includes(format)) throw new Error("--format must be json or mermaid.");
if (exclude === "") throw new Error("--exclude must not be empty.");

const output = format === "mermaid"
  ? path.join(root, "workdocs", "reports", "graphs", "architecture-handbook.mmd")
  : path.join(root, "workdocs", "graphs", "architecture-handbook.graph.json");
mkdirSync(path.dirname(output), { recursive: true });
const result = spawnSync(
  path.join(root, "with-ai", "node_modules", ".bin", "decaf"),
  ["with-ai", "graph", "documentation", "workdocs/ai/project/technical-docs/architecture-handbook", "--format", format, "--output", output, ...(exclude ? ["--exclude", exclude] : [])],
  { cwd: root, env: { ...process.env, BANNER: "false" }, stdio: "inherit" }
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
