#!/usr/bin/env node
// Lint the manuscript for the banned phrases and style rules in
// WRITING-PLAN.md. Exits nonzero if any rule matches.
//
// Usage: node scripts/lint-manuscript.mjs

import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const manuscriptGlobs = [
  "prelude/*.md",
  "solana-building-blocks/*.md",
  "financial-programming-concepts-in-solana/*.md",
  "building-financial-products-in-solana/*.md",
  "appendices/*.md",
];

// Each rule: a regex and the reason it is banned. Case-insensitive unless
// the pattern says otherwise.
const rules = [
  [/\binstrument(s|ation)?\b/i, 'say "financial software" or "program", never "instrument"'],
  [/the oracle problem/i, "teach the positive mechanism instead: verifying a signature from a trusted source"],
  [/\bon-chain\b/i, 'write "onchain", unhyphenated'],
  [/\boff-chain\b/i, 'write "offchain", unhyphenated'],
  [/\bcross-chain\b/i, 'write "crosschain", unhyphenated'],
  [/—/, "no em-dashes; use a regular dash or rewrite"],
  [/can(?:not|'t) verify the price/i, "negative offchain-truth framing"],
  [/\bBONK\b/, "no meme tokens; use USDC and RWA stocks (NVDAx, TSLAx, SPCXx)"],
  [/\bmemecoin|meme token/i, "no meme tokens"],
  [/\bsmart contracts?\b/i, 'say "program" (a contrastive mention in the glossary is the one allowed use)'],
  [/\bgas fees?\b|\bgas costs?\b/i, 'say "transaction fees"'],
  [/\bmempool/i, "Solana has no mempool"],
  [/\bToken 2022\b/i, 'say "Token Extensions Program"'],
  [/\bbase units?\b/i, 'say "minor unit"'],
  [/\bworked (example|scenario)\b/i, 'just "example", "scenario", or "walkthrough"'],
  [/(?<!`)\bids?\b(?!`|\.json)/, 'write "ID"/"IDs" in capitals in prose (code identifiers like `program_id` and the `id.json` filename keep lowercase)'],
  [/\bSolend\b/, "renamed: say Save"],
  [/\bSerum\b/, "collapsed project: cite OpenBook or Phoenix"],
  [/\bfavour|behaviour|\bcancelled\b|\bapologise\b|\blabelled\b/, "American spelling in prose (identifiers like the Cancelled enum are exempt: write them capitalized)"],
];

// Allowed exceptions, matched against the full line.
const exceptions = [
  /Called a "smart contract" on other chains/, // the glossary's contrastive definition
  /says minor unit, not "base unit\."/, // the glossary teaching the rule itself
  /stamped Cancelled|already-Cancelled|Cancelled order|out to Cancelled|to Filled, or Cancelled|Open, Settled, Cancelled|Settled or Cancelled|status.*Cancelled/, // enum variant names from the programs
];

import { readdirSync } from "node:fs";
const files = [];
for (const pattern of manuscriptGlobs) {
  const dir = join(repoRoot, dirname(pattern));
  for (const name of readdirSync(dir)) {
    if (name.endsWith(".md")) files.push(join(dir, name));
  }
}

let failures = 0;
for (const file of [...new Set(files)]) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const [pattern, reason] of rules) {
      if (pattern.test(line) && !exceptions.some((ok) => ok.test(line))) {
        failures += 1;
        console.error(`${file}:${index + 1}: ${reason}\n    ${line.trim().slice(0, 160)}`);
      }
    }
  });
}

if (failures > 0) {
  console.error(`\n${failures} lint failure(s).`);
  process.exit(1);
}
console.log("Manuscript lint clean.");
