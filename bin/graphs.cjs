#!/usr/bin/env node

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");
const { adaptGraphifyGraph, mergeGraphs, queryContext, stableStringify, validateDocumentationGraph } = require("./graph-tooling.cjs");

const root = path.resolve(__dirname, "..");
const codeGraph = path.join(root, "workdocs", "graphs", "code.semantic.graph.json");
const docsGraph = path.join(root, "workdocs", "graphs", "docs.semantic.graph.json");
const mergedGraph = path.join(root, "workdocs", "graphs", "knowledge.graph.json");

function readGraph(file) { return JSON.parse(readFileSync(path.resolve(process.cwd(), file), "utf8")); }
function writeGraph(file, value) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, `${stableStringify(value)}\n`); }
function parseJson(value, name) { try { return JSON.parse(value); } catch { throw new Error(`${name} must be valid JSON.`); } }
function option(args, name, fallback) { const index = args.indexOf(name); return index < 0 ? fallback : args[index + 1]; }

function code(args) {
  const graphify = process.platform === "win32" ? "graphify.exe" : "graphify";
  const sourceRoot = path.resolve(process.cwd(), option(args, "--root", root));
  const output = path.resolve(process.cwd(), option(args, "--output", codeGraph));
  const graphifyOutput = path.join(root, "workdocs", "reports", "graphify-code");
  const result = spawnSync(graphify, ["extract", sourceRoot, "--code-only"], {
    cwd: root,
    env: { ...process.env, GRAPHIFY_OUT: graphifyOutput },
    stdio: "inherit",
  });
  if (result.error && result.error.code === "ENOENT") throw new Error("Graphify is required. Install it with: uv tool install graphifyy");
  if (result.status !== 0) process.exit(result.status || 1);
  const source = path.join(graphifyOutput, "graph.json");
  if (!existsSync(source)) throw new Error(`Graphify completed but did not create ${source}.`);
  const graph = adaptGraphifyGraph(readGraph(source), sourceRoot);
  if (!graph.nodes.length) throw new Error("Graphify produced no code nodes; refusing to replace the canonical code graph.");
  writeGraph(output, graph);
  process.stdout.write(`${path.relative(root, output)}\n`);
}

function merge(args) {
  const inputs = args.length ? args : [codeGraph, docsGraph].filter(existsSync);
  if (!inputs.length) throw new Error("Provide graph files or generate a code/documentation graph first.");
  const output = option(args, "--output", mergedGraph);
  const files = inputs.filter((item) => item !== "--output" && item !== output).sort();
  const graph = mergeGraphs(files.map(readGraph));
  writeGraph(path.resolve(process.cwd(), output), graph);
  process.stdout.write(`${graph.contentHash}\n`);
}

function docsApply(args) {
  const proposalPath = args.find((arg) => arg !== "--output" && arg !== option(args, "--output"));
  if (!proposalPath) throw new Error("Usage: graphs docs:apply <proposal.json> [--output <graph.json>]");
  const output = path.resolve(process.cwd(), option(args, "--output", docsGraph));
  const proposal = validateDocumentationGraph(readGraph(proposalPath));
  const graph = mergeGraphs([...(existsSync(output) ? [readGraph(output)] : []), proposal]);
  writeGraph(output, graph);
  process.stdout.write(`${graph.contentHash}\n`);
}

function context(args) {
  const query = option(args, "--query");
  const scope = option(args, "--scope", "both");
  const mergeRequested = args.includes("--merge");
  const includeExtracts = !args.includes("--no-extracts");
  const maxHops = Number(option(args, "--max-hops", "2"));
  const tokenBudget = Number(option(args, "--token-budget", "12000"));
  if (!query) throw new Error("Usage: graphs context --query <question> [--scope code|docs|both] [--merge]");
  const files = scope === "code" ? [codeGraph] : scope === "docs" ? [docsGraph] : [codeGraph, docsGraph].filter(existsSync);
  if (!files.length || files.some((file) => !existsSync(file))) throw new Error(`No ${scope} graph is available.`);
  const graph = mergeRequested || files.length === 1 ? mergeGraphs(files.map(readGraph)) : mergeGraphs(files.map(readGraph));
  process.stdout.write(`${stableStringify(queryContext(graph, { query, maxHops, tokenBudget, includeExtracts }))}\n`);
}

const [command, ...args] = process.argv.slice(2);
if (command === "code") code(args);
else if (command === "merge") merge(args);
else if (command === "docs:apply") docsApply(args);
else if (command === "context") context(args);
else throw new Error("Usage: graphs <code|merge|docs:apply|context>");
