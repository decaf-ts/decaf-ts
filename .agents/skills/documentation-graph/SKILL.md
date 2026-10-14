---
name: documentation-graph
description: Build or update the semantic documentation knowledge graph when a user asks to relate project documentation concepts or improve LLM documentation retrieval. Do not use for file-link graphs or ordinary documentation edits.
---

# Documentation Graph

Build semantic relations, not links between files. Use the requested documentation scope and propose only concepts and typed relations supported by exact source evidence.

1. Read the relevant sections and identify stable concepts, specifications, decisions, capabilities, and constraints.
2. Emit a proposal JSON with canonical nodes and typed edges. Every edge must include `metadata.evidence` entries with a repository-relative `path`, `startLine`, `endLine`, and an exact `excerpt` from that range. Set `metadata.provenance` to `LLM` and include a confidence value.
3. Apply the proposal with `npm run graphs:docs:apply -- <proposal.json>`. The command rejects missing, stale, or mismatched evidence.
4. Query the result through `npm run graphs:context -- --query "..." --scope docs` before reporting the result.

Do not create generic `link` edges. Use a precise relation such as `defines`, `constrains`, `supersedes`, `dependsOn`, `explains`, or `references`.
