const test = require("node:test");
const assert = require("node:assert/strict");
const { adaptGraphifyGraph, mergeGraphs, queryContext } = require("./graph-tooling.cjs");

const code = { nodes: [{ id: "code:run", kind: "codeSymbol", label: "run", metadata: { path: "src/run.ts" } }], edges: [] };
const docs = { nodes: [{ id: "doc:execution", kind: "docConcept", label: "Execution", metadata: {} }], edges: [{ id: "edge:explains", source: "doc:execution", target: "code:run", type: "explains", metadata: { evidence: [{ path: "README.md", startLine: 1, endLine: 1, excerpt: "execution" }] } }] };

test("merge is commutative and preserves evidence", () => {
  assert.deepEqual(mergeGraphs([code, docs]), mergeGraphs([docs, code]));
});

test("context returns evidence-bearing related graph results", () => {
  const result = queryContext(mergeGraphs([code, docs]), { query: "execution", maxHops: 1 });
  assert.equal(result.truncated, false);
  assert.deepEqual(result.results.map((entry) => entry.node.id), ["doc:execution", "code:run"]);
  assert.equal(result.results[0].extracts[0].path, "README.md");
});

test("Graphify links retain their semantic relation", () => {
  const graph = adaptGraphifyGraph({
    nodes: [{ id: "one", label: "One", source_file: "missing.ts", source_location: "L1" }],
    links: [{ source: "one", target: "two", relation: "calls", source_file: "missing.ts", source_location: "L2" }],
  }, process.cwd());
  assert.equal(graph.nodes[0].kind, "unknown");
  assert.equal(graph.edges[0].type, "calls");
});
