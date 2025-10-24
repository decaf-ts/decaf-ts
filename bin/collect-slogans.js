#!/usr/bin/env node
/*
 Gathers slogans from inner repos listed by `bin/modules.js`.
 - If no <file_path> arg is provided, writes to `./all_slogans.json`.
 - For each repo name REPO, looks for `./<REPO>/slogans.json` or `./<REPO>/slogans.ts`.
 - Extracts JSON and builds an object { [REPO]: REPO_SLOGANS_JSON } only for repos that have slogans.
 */

const fs = require('fs');
const path = require('path');

const modules = require('./modules');

const outPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.resolve(process.cwd(), 'all_slogans.json');

function fileExists(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// Very lightweight extraction for common TS exports like `export default [...]` or `export const slogans = [...]`.
function extractJSONFromTS(tsText) {
  // Remove BOM and Windows newlines
  let t = tsText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  // Remove leading/trailing comments
  t = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\n)\s*\/\/.*$/gm, '');
  // Try to capture array/object literal following export patterns
  const exportDefaultMatch = t.match(/export\s+default\s+([\s\S]*);?\s*$/m);
  if (exportDefaultMatch) {
    const candidate = exportDefaultMatch[1].trim();
    const json = tryParseJSON(candidate);
    if (json !== undefined) return json;
  }
  const constMatch = t.match(/export\s+const\s+\w+\s*=\s*([\s\S]*?);?\s*$/m);
  if (constMatch) {
    const candidate = constMatch[1].trim();
    const json = tryParseJSON(candidate);
    if (json !== undefined) return json;
  }
  // Fallback: try to find first top-level array/object literal
  const firstArray = t.match(/\[\s*[\S\s]*\]/m);
  if (firstArray) {
    const json = tryParseJSON(firstArray[0]);
    if (json !== undefined) return json;
  }
  const firstObject = t.match(/\{[\s\S]*\}/m);
  if (firstObject) {
    const json = tryParseJSON(firstObject[0]);
    if (json !== undefined) return json;
  }
  return undefined;
}

(async () => {
  const result = {};

  for (const repo of modules || []) {
    const repoDir = path.resolve(process.cwd(), repo);
    const jsonPath = path.join(repoDir, 'slogans.json');
    const tsPath = path.join(repoDir, 'slogans.ts');

    try {
      if (fileExists(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        result[repo] = parsed;
        continue;
      }
      if (fileExists(tsPath)) {
        const raw = fs.readFileSync(tsPath, 'utf8');
        const parsed = extractJSONFromTS(raw);
        if (typeof parsed !== 'undefined') {
          result[repo] = parsed;
          continue;
        }
      }
    } catch (err) {
      // Log and continue; do not fail entirely
      console.error(`Warning: failed to parse slogans for ${repo}:`, err.message);
    }
  }

  // Ensure parent dir exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${Object.keys(result).length} repos to ${outPath}`);
})();

