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
  [/the oracle problem/i, "teach the positive mechanism instead: checking a fact's provenance, freshness, and confidence against a source the program trusts"],
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

// Heading check: the foundation parts teach general mechanisms, so their
// headings state the general rule and the characters stay in the prose
// beneath. The program chapters are walkthroughs whose headings are the
// story's beats, so they name characters by design and are not scanned.
const foundationDirs = [
  "prelude",
  "solana-building-blocks",
  "financial-programming-concepts-in-solana",
];
const characterHeading = /^#{2,6} .*\b(Alice|Bob|Carol|Dave|Maria)\b/;

for (const file of [...new Set(files)]) {
  if (!foundationDirs.some((dir) => file.includes(join(repoRoot, dir) + "/"))) continue;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      if (!characterHeading.test(line)) return;
      failures += 1;
      console.error(
        `${file}:${index + 1}: foundation-part headings state the general mechanism, not a specific actor (WRITING-PLAN.md)\n    ${line.trim().slice(0, 160)}`,
      );
    });
}

// Figure checks: the mechanically checkable Visual Language conventions.
// Rounded corners are reserved for accounts and drawn at one radius, the
// only fade level is 0.3, address dots have white centers, and seed labels
// carry the SEEDS prefix. Which rects are accounts is a judgement call the
// linter cannot make; WRITING-PLAN.md carries the rest of the conventions.
const figureDirs = [
  "solana-building-blocks/figures",
  "financial-programming-concepts-in-solana/figures",
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
  // The table icon's divider sits left of center: the key column is narrower
  // than the value column.
  [/<line x1="7" y1="5\.4" x2="7" y2="12"/,
    'table-icon divider sits at x=5.5 (key column narrower than value column)'],
  // The coin mark is three rings. Two rings read as a pair of address dots at
  // print size, where the accent colour is gone and the mark is about 2mm.
  [/<circle cx="4" cy="2" r="6"[^>]*stroke="#1e7a3c"/,
    'the coin mark is three rings (cx 5/0/-5, r=4.5), not two'],
  // No currency symbol inside the mark: arrows carry ACME, NVDAx, SPCXx, LP
  // tokens and SOL as often as USDC, and the adjacent label names the asset.
  [/class="coin"[^>]*>.*(?:[$€£¥]|<text)/,
    'the coin mark carries no currency symbol; the amount label names the asset'],
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
    // Address dots have white centers. Anchor on the dot's own geometry (an
    // r=5.5/6 circle stroked at 2) rather than on neighbouring label text —
    // on-curve dots carry no label at all now, so there is nothing to key off.
    if (/<circle[^>]*\br="(?:5\.5|6)"[^>]*stroke-width="2"/.test(line) && !/fill="#fff"/.test(line)) {
      failures += 1;
      console.error(`${file}:${index + 1}: address dots have white centers: fill="#fff" stroke="#111"\n    ${line.trim().slice(0, 160)}`);
    }
    // A dot on the curve is itself the signal that the address is a public
    // key, and a seed list is self-evidently a seed list. Neither label is
    // drawn any more; the book teaches the convention once, in prose.
    if (/>PUBLIC KEY<|>SEEDS[: ]/.test(line)) {
      failures += 1;
      console.error(`${file}:${index + 1}: address labels are gone: a curve dot needs no "PUBLIC KEY", a seed list no "SEEDS:" prefix\n    ${line.trim().slice(0, 160)}`);
    }
    // The cluster curve is the part of the ball-shaped Ed25519 curve near
    // X=0: flat at the top-left, monotonically descending to the right. A
    // curve that droops down OR raises up in the middle is a regression, so
    // the control point's y must sit between the endpoints', and the right
    // end must be lower than the left.
    const arc = line.match(/d="M [\d.]+,([\d.]+) Q [\d.]+,([\d.]+) [\d.]+,([\d.]+)"[^>]*stroke-width="3\.5"/);
    if (arc) {
      const [y0, yc, y1] = [Number(arc[1]), Number(arc[2]), Number(arc[3])];
      if (!(y1 > y0 && yc >= y0 && yc <= y1)) {
        failures += 1;
        console.error(`${file}:${index + 1}: the cluster curve descends monotonically to the right (no droop, no dome)\n    ${line.trim().slice(0, 160)}`);
      }
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
