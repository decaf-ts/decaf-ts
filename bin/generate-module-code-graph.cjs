#!/usr/bin/env node

const { mkdirSync } = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const moduleRoot = process.cwd();
const modulePath = path.relative(root, moduleRoot);

function graphOptions(args) {
  let format = "json";
  let exclude;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--format") format = args[++index];
    else if (args[index] === "--exclude") exclude = args[++index];
    else throw new Error(`Unsupported graph option: ${args[index]}`);
  }
  if (!['json', 'mermaid'].includes(format)) throw new Error('--format must be json or mermaid.');
  if (exclude === "") throw new Error('--exclude must not be empty.');
  return { format, exclude };
}

if (!modulePath || modulePath.startsWith("..") || path.isAbsolute(modulePath)) {
  throw new Error(`Expected a module below ${root}; received ${moduleRoot}.`);
}

const { format, exclude } = graphOptions(process.argv.slice(2));
const output = format === "mermaid"
  ? path.join(moduleRoot, "workdocs", "reports", "graphs", "code.mmd")
  : path.join(moduleRoot, "workdocs", "graphs", "code.graph.json");
mkdirSync(path.dirname(output), { recursive: true });

const result = spawnSync(
  path.join(root, "with-ai", "node_modules", ".bin", "decaf"),
  ["with-ai", "graph", "code", modulePath, "--format", format, "--output", output, ...(exclude ? ["--exclude", exclude] : [])],
  {
    cwd: root,
    env: { ...process.env, BANNER: "false" },
    stdio: "inherit",
  }
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
