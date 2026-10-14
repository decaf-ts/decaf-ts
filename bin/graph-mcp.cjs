#!/usr/bin/env node

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("fs");
const path = require("path");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const { mergeGraphs, queryContext, stableStringify } = require("./graph-tooling.cjs");

const root = path.resolve(__dirname, "..");
const defaultGraphs = {
  code: path.join(root, "workdocs", "graphs", "code.semantic.graph.json"),
  docs: path.join(root, "workdocs", "graphs", "docs.semantic.graph.json"),
};

function readGraph(file) {
  return JSON.parse(readFileSync(path.resolve(root, file), "utf8"));
}

function selectedGraphs(scope) {
  const files = scope === "code" ? [defaultGraphs.code] : scope === "docs" ? [defaultGraphs.docs] : [defaultGraphs.code, defaultGraphs.docs].filter(existsSync);
  if (!files.length || files.some((file) => !existsSync(file))) throw new Error(`No ${scope} graph is available.`);
  return files.map(readGraph);
}

function result(value) {
  return { content: [{ type: "text", text: stableStringify(value) }], structuredContent: value };
}

const server = new McpServer({ name: "decaf-graph-context", version: "1.0.0" });

server.registerTool("graph_context", {
  title: "Retrieve relevant graph context",
  description: "Returns the relevant code and/or documentation concepts, typed relations, and exact source extracts. It is deterministic for a pinned graph and identical parameters.",
  inputSchema: {
    query: z.string().min(1).max(500),
    scope: z.enum(["code", "docs", "both"]).default("both"),
    merge: z.boolean().default(false).describe("Allow cross-graph traversal using an in-memory deterministic union."),
    includeExtracts: z.boolean().default(true),
    relationTypes: z.array(z.string().min(1)).optional(),
    maxHops: z.number().int().min(0).max(6).default(2),
    tokenBudget: z.number().int().min(100).max(50000).default(12000),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async (args) => {
  const graphs = selectedGraphs(args.scope);
  if (args.scope === "both" && !args.merge) {
    const [code, docs] = graphs;
    return result({
      query: args.query,
      merged: false,
      code: queryContext(code, args),
      docs: queryContext(docs, args),
    });
  }
  const graph = mergeGraphs(graphs);
  return result({ ...queryContext(graph, args), merged: args.scope === "both" });
});

server.registerTool("graph_get_evidence", {
  title: "Get exact evidence for a graph edge",
  description: "Returns the verified path, source range, and excerpt for one typed relation.",
  inputSchema: { edgeId: z.string().min(1), scope: z.enum(["code", "docs", "both"]).default("both") },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ edgeId, scope }) => {
  const graph = mergeGraphs(selectedGraphs(scope));
  const edge = graph.edges.find((candidate) => candidate.id === edgeId);
  if (!edge) throw new Error(`Graph edge not found: ${edgeId}`);
  return result({ edgeId, type: edge.type, source: edge.source, target: edge.target, evidence: edge.metadata.evidence || [] });
});

server.registerTool("graph_merge", {
  title: "Deterministically merge canonical graphs",
  description: "Merges canonical graph JSON files with stable ordering and evidence-preserving conflict rules. Writing is optional.",
  inputSchema: {
    inputs: z.array(z.string().min(1)).min(1),
    outputPath: z.string().min(1).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ inputs, outputPath }) => {
  const graph = mergeGraphs([...inputs].sort().map(readGraph));
  if (outputPath) {
    const output = path.resolve(root, outputPath);
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, `${stableStringify(graph)}\n`);
  }
  return result({ contentHash: graph.contentHash, nodeCount: graph.nodes.length, edgeCount: graph.edges.length, outputPath: outputPath || null, graph: outputPath ? undefined : graph });
});

async function main() {
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
