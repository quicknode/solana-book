#!/usr/bin/env node
// Lint the manuscript for the banned phrases and style rules in
// WRITING-PLAN.md, and the figures for the mechanically checkable parts
// of the Visual Language conventions. Exits nonzero if any rule matches.
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

// Figure checks: the mechanically checkable Visual Language conventions.
// Rounded corners are reserved for accounts and drawn at one radius, the
// only fade level is 0.3, address dots have white centers, and seed labels
// carry the SEEDS prefix. Which rects are accounts is a judgement call the
// linter cannot make; WRITING-PLAN.md carries the rest of the conventions.
const figureDirs = [
  "solana-building-blocks/figures",
  "building-financial-products-in-solana/figures",
];

const svgRules = [
  [/<rect[^>]*\brx="(?!6")[^"]*"/, 'account corner radius is rx="6", one radius book-wide'],
  [/<rect[^>]*\bry="/, "set rx only on rects; ry duplicates it (ellipse glyphs are exempt)"],
  [/\bopacity="(?!0\.3")[^"]*"/, 'the only fade level is opacity="0.3"'],
  // The cluster curve is the heaviest line in every figure: 3.5, no other
  // weight. The M/Q arc against ink #111 is the curve's one shape.
  [/<path d="M 40,[\d.]+ Q 320,[\d.]+ 600,[\d.]+" fill="none" stroke="#111" stroke-width="(?!3\.5")/,
    'the cluster curve is stroke-width="3.5", the heaviest line in the figure'],
  // The piggy-bank snout is an opaque ellipse (fill="#fff") with nostrils,
  // drawn after the body; the old transparent-circle snout is a regression.
  [/<circle cx="12\.6" cy="6\.4" r="1\.7"/,
    'old piggy snout: use the opaque snout ellipse with nostrils from DIAGRAMS.md'],
  [/<ellipse cx="12\.9" cy="6\.4"[^>]*fill="none"/,
    'the piggy snout is opaque: fill="#fff" so the body edge never shows through'],
];

const svgFiles = [];
for (const dir of figureDirs) {
  for (const name of readdirSync(join(repoRoot, dir))) {
    if (name.endsWith(".svg")) svgFiles.push(join(repoRoot, dir, name));
  }
}

for (const file of svgFiles) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const [pattern, reason] of svgRules) {
      if (pattern.test(line)) {
        failures += 1;
        console.error(`${file}:${index + 1}: ${reason}\n    ${line.trim().slice(0, 160)}`);
      }
    }
    // An ink-filled circle next to an address label is a filled address
    // dot; address dots have white centers (fill="#fff").
    const neighbors = `${lines[index - 1] ?? ""}\n${line}\n${lines[index + 1] ?? ""}`;
    if (
      /<circle[^>]*fill="#111"/.test(line) &&
      /PUBLIC KEY|SEEDS/.test(neighbors)
    ) {
      failures += 1;
      console.error(`${file}:${index + 1}: address dots have white centers: fill="#fff" stroke="#111"\n    ${line.trim().slice(0, 160)}`);
    }
    // A seed list beside an address dot starts with the word SEEDS.
    if (/&#8221; \+/.test(line) && !/SEEDS/.test(line)) {
      failures += 1;
      console.error(`${file}:${index + 1}: seed labels start with "SEEDS: "\n    ${line.trim().slice(0, 160)}`);
    }
    // Handler lines (monospace runs of bare snake_case identifiers) carry
    // parens: place_bet(), never place_bet.
    const menlo = line.match(/font-family="Menlo[^>]*>([^<]+)<\/text>/);
    if (
      menlo &&
      /^[a-z_]{3,}(\s+[a-z_]{3,})*(\s*&#215;\d+)?$/.test(menlo[1].trim()) &&
      !menlo[1].includes("()")
    ) {
      failures += 1;
      console.error(`${file}:${index + 1}: handler names carry parens: ${menlo[1].trim().split(/\s/)[0]}()\n    ${line.trim().slice(0, 160)}`);
    }
  });
}

if (failures > 0) {
  console.error(`\n${failures} lint failure(s).`);
  process.exit(1);
}
console.log("Manuscript and figure lint clean.");
