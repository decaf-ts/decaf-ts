const { existsSync, readFileSync } = require("fs");
const { createHash } = require("crypto");
const Graph = require("graphology");

const SCHEMA_VERSION = 1;

function hash(value) {
  return createHash("sha256").update(typeof value === "string" ? value : stableStringify(value)).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableStringify(value) {
  return JSON.stringify(stable(value));
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null))].sort();
}

function mergeValue(left, right, field = "") {
  if (left === undefined) return right;
  if (right === undefined) return left;
  if (stableStringify(left) === stableStringify(right)) return left;
  if (Array.isArray(left) || Array.isArray(right)) {
    const values = [...(Array.isArray(left) ? left : [left]), ...(Array.isArray(right) ? right : [right])];
    return values
      .map(stable)
      .sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)))
      .filter((value, index, all) => !index || stableStringify(value) !== stableStringify(all[index - 1]));
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    return Object.fromEntries(unique([...Object.keys(left), ...Object.keys(right)]).map((key) => [key, mergeValue(left[key], right[key], key)]));
  }
  if (["kind", "type", "source", "target"].includes(field))
    throw new Error(`Conflicting graph identity field '${field}': ${JSON.stringify(left)} != ${JSON.stringify(right)}`);
  return [left, right].sort((a, b) => String(a).localeCompare(String(b)))[0];
}

function normaliseNode(node) {
  const attributes = node.attributes || node.metadata || {};
  const id = String(node.id || node.key || attributes.id || "");
  if (!id) throw new Error("Every graph node requires an id.");
  return {
    id,
    kind: String(node.kind || node.type || attributes.kind || attributes.type || attributes.file_type || "unknown"),
    label: String(node.label || node.name || attributes.label || attributes.name || id),
    metadata: stable(mergeValue(attributes, node.metadata || {})),
  };
}

function normaliseEdge(edge) {
  const attributes = edge.attributes || edge.metadata || {};
  const source = String(edge.source || attributes.source || "");
  const target = String(edge.target || attributes.target || "");
  const type = String(edge.type || edge.kind || edge.relation || attributes.type || attributes.kind || attributes.relation || "relatesTo");
  if (!source || !target) throw new Error("Every graph edge requires source and target ids.");
  const id = String(edge.id || edge.key || attributes.id || hash({ source, target, type, evidence: attributes.evidence || [] }));
  return { id, source, target, type, metadata: stable(mergeValue(attributes, edge.metadata || {})) };
}

function normaliseGraph(value) {
  const graph = value.graph && (Array.isArray(value.graph.nodes) || Array.isArray(value.graph.edges) || Array.isArray(value.graph.links)) ? value.graph : value;
  const nodes = (graph.nodes || []).map(normaliseNode).sort((a, b) => a.id.localeCompare(b.id));
  const edges = (graph.edges || graph.links || []).map(normaliseEdge).sort((a, b) => a.id.localeCompare(b.id));
  return { schemaVersion: SCHEMA_VERSION, nodes, edges };
}

function graphifyEvidence(record, basePath) {
  const sourceFile = record.source_file;
  const match = String(record.source_location || "").match(/L(\d+)/);
  if (!sourceFile || !match) return [];
  const path = require("path").resolve(basePath, sourceFile);
  if (!existsSync(path)) return [];
  const line = Number(match[1]);
  const excerpt = readFileSync(path, "utf8").split(/\r?\n/)[line - 1] || "";
  return [{ path, startLine: line, endLine: line, excerpt }];
}

function adaptGraphifyGraph(value, basePath) {
  const graph = normaliseGraph(value);
  const rawNodes = new Map((value.nodes || []).map((node) => [String(node.id || node.key), node]));
  const rawEdges = new Map((value.edges || value.links || []).map((edge) => [normaliseEdge(edge).id, edge]));
  graph.nodes = graph.nodes.map((node) => ({
    ...node,
    metadata: stable(mergeValue(node.metadata, { evidence: graphifyEvidence(rawNodes.get(node.id) || {}, basePath), provenance: "AST" })),
  }));
  graph.edges = graph.edges.map((edge, index) => ({
    ...edge,
    metadata: stable(mergeValue(edge.metadata, { evidence: graphifyEvidence(rawEdges.get(edge.id) || {}, basePath), provenance: "AST" })),
  }));
  return graph;
}

function mergeGraphs(values) {
  const graph = new Graph.MultiDirectedGraph({ allowSelfLoops: true });
  const nodeRecords = new Map();
  const edgeRecords = new Map();
  for (const value of values.map(normaliseGraph)) {
    for (const node of value.nodes) {
      const current = nodeRecords.get(node.id);
      const next = current ? {
        id: node.id,
        kind: mergeValue(current.kind, node.kind, "kind"),
        label: mergeValue(current.label, node.label, "label"),
        metadata: mergeValue(current.metadata, node.metadata),
      } : node;
      nodeRecords.set(node.id, next);
      graph.mergeNode(node.id, next);
    }
    for (const edge of value.edges) {
      const current = edgeRecords.get(edge.id);
      const next = current ? {
        id: edge.id,
        source: mergeValue(current.source, edge.source, "source"),
        target: mergeValue(current.target, edge.target, "target"),
        type: mergeValue(current.type, edge.type, "type"),
        metadata: mergeValue(current.metadata, edge.metadata),
      } : edge;
      edgeRecords.set(edge.id, next);
      graph.mergeDirectedEdgeWithKey(edge.id, edge.source, edge.target, next);
    }
  }
  const result = {
    schemaVersion: SCHEMA_VERSION,
    nodes: [...nodeRecords.values()].map(stable).sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...edgeRecords.values()].map(stable).sort((a, b) => a.id.localeCompare(b.id)),
  };
  return { ...result, contentHash: `sha256:${hash(result)}` };
}

function sourceLines(evidence) {
  if (!evidence || !evidence.path || !Number.isInteger(evidence.startLine) || !Number.isInteger(evidence.endLine))
    throw new Error("Evidence requires path, startLine, and endLine.");
  if (evidence.startLine < 1 || evidence.endLine < evidence.startLine) throw new Error(`Invalid evidence range in ${evidence.path}.`);
  if (!existsSync(evidence.path)) throw new Error(`Evidence file does not exist: ${evidence.path}`);
  const lines = readFileSync(evidence.path, "utf8").split(/\r?\n/);
  if (evidence.endLine > lines.length) throw new Error(`Evidence range exceeds ${evidence.path}.`);
  const text = lines.slice(evidence.startLine - 1, evidence.endLine).join("\n");
  if (evidence.excerpt && !text.includes(evidence.excerpt)) throw new Error(`Evidence excerpt does not match ${evidence.path}:${evidence.startLine}-${evidence.endLine}.`);
  return { ...evidence, excerpt: evidence.excerpt || text };
}

function validateDocumentationGraph(value) {
  const graph = normaliseGraph(value);
  for (const edge of graph.edges) {
    const evidence = edge.metadata.evidence;
    if (!Array.isArray(evidence) || !evidence.length) throw new Error(`Documentation edge ${edge.id} requires evidence.`);
    edge.metadata.evidence = evidence.map(sourceLines).sort((a, b) => stableStringify(a).localeCompare(stableStringify(b)));
    edge.metadata.provenance = edge.metadata.provenance || "LLM";
  }
  return graph;
}

function textOf(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(textOf).join(" ");
  return "";
}

function queryContext(value, options = {}) {
  const graph = normaliseGraph(value);
  const query = String(options.query || "").trim();
  if (!query) throw new Error("A query is required.");
  const tokens = unique(query.toLowerCase().match(/[a-z0-9_/-]{2,}/g) || []);
  const maxHops = Number.isInteger(options.maxHops) ? options.maxHops : 2;
  const tokenBudget = Number.isInteger(options.tokenBudget) ? options.tokenBudget : 12000;
  const relationTypes = options.relationTypes ? new Set(options.relationTypes) : undefined;
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = graph.edges.filter((edge) => !relationTypes || relationTypes.has(edge.type));
  const direct = new Map();
  for (const node of graph.nodes) {
    const haystack = `${node.id} ${node.label} ${textOf(node.metadata)}`.toLowerCase();
    const score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
    if (score) direct.set(node.id, score);
  }
  const distance = new Map([...direct.keys()].map((id) => [id, 0]));
  let frontier = [...direct.keys()].sort();
  for (let hop = 1; hop <= maxHops && frontier.length; hop += 1) {
    const next = new Set();
    for (const id of frontier) for (const edge of edges) {
      const neighbor = edge.source === id ? edge.target : edge.target === id ? edge.source : undefined;
      if (neighbor && !distance.has(neighbor)) { distance.set(neighbor, hop); next.add(neighbor); }
    }
    frontier = [...next].sort();
  }
  const candidates = [...distance.entries()].map(([id, hops]) => ({
    node: nodes.get(id),
    hops,
    score: (direct.get(id) || 0) * 100 - hops,
  })).filter((entry) => entry.node).sort((a, b) => b.score - a.score || a.hops - b.hops || a.node.id.localeCompare(b.node.id));
  const results = [];
  let usedTokens = 0;
  for (const candidate of candidates) {
    const relatedEdges = edges.filter((edge) => edge.source === candidate.node.id || edge.target === candidate.node.id).sort((a, b) => a.id.localeCompare(b.id));
    const evidence = relatedEdges.flatMap((edge) => edge.metadata.evidence || []).map(stable);
    const extracts = options.includeExtracts === false ? [] : evidence.map((item) => ({ path: item.path, startLine: item.startLine, endLine: item.endLine, text: item.excerpt || "" }));
    const result = { node: candidate.node, score: candidate.score, hops: candidate.hops, relations: relatedEdges, extracts };
    const resultTokens = Math.ceil(stableStringify(result).length / 4);
    if (results.length && usedTokens + resultTokens > tokenBudget) break;
    results.push(result);
    usedTokens += resultTokens;
  }
  return {
    query,
    graphVersion: graph.contentHash || `sha256:${hash(graph)}`,
    resultCount: results.length,
    truncated: results.length < candidates.length,
    omittedCount: candidates.length - results.length,
    results,
  };
}

module.exports = { SCHEMA_VERSION, hash, stableStringify, normaliseGraph, adaptGraphifyGraph, mergeGraphs, validateDocumentationGraph, queryContext };
