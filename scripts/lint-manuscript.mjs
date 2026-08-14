#!/usr/bin/env node
// Lint the manuscript for the banned phrases and style rules in
// WRITING-PLAN.md, and the figures for the mechanically checkable parts
// of the Visual Language conventions. Exits nonzero if any rule matches.
//
// Usage: node scripts/lint-manuscript.mjs

import { readFileSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const manuscriptGlobs = [
  "prelude/*.md",
  "solana-building-blocks/*.md",
  "financial-programming-concepts-in-solana/*.md",
  "building-financial-products-in-solana/*.md",
  "conclusion/*.md",
  "appendices/*.md",
  "postlude/*.md",
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
  // Same category as the em-dash rule above: phrases a reader clocks as
  // machine-written before they have finished the sentence. Each one also
  // stands in for a mechanism rather than stating it, so the fix is the same
  // fix every time: name the thing and say what it does.
  [/\bload.bearing\b/i, 'say what depends on the thing and what breaks without it'],
  [/\b(delve|tapestry|intricate|multifaceted|holistic|myriad|seamlessly|seamless|robust|pivotal|crucial|elevate|testament to|deep dive|paradigm shift|game.chang(er|ing)|unlock the power|realm of|landscape of|in today's)\b/i,
    "reads as machine-written; name the specific thing instead"],
  [/it(?:'s| is) worth noting/i, "cut it: if the point is worth making, make it"],
  // Announcing that a point exists instead of making it. Each of these was
  // written in this manuscript and each was replaced by the content it was
  // standing in front of: "what matters here is the unit" became "the index
  // advances by slots, not seconds". Delete the announcement, keep what
  // followed it.
  [/\bwhat matters\b/i, 'say the thing that matters instead of announcing that something does'],
  [/\bthe point (?:here )?is\b/i, 'state the point rather than pointing at it'],
  [/\bthat is the whole reason\b/i, 'give the reason without announcing it: "they count slots because ..."'],
  [/\bdoes the work of\b/i, "describe what the code stores and computes, not how clever the result is"],
  [/\bunderscor(es|ing) (the|that|how|why|its)\b/i, 'say what it shows (the underscore character in identifiers is fine)'],
  [/can(?:not|'t) verify the price/i, "negative offchain-truth framing"],
  [/\bBONK\b/, "no meme tokens; use USDC and RWA stocks (NVDAx, TSLAx, SPCXx)"],
  [/\bmemecoin|meme token/i, "no meme tokens"],
  [/\bsmart contracts?\b/i, 'say "program" (the only allowed uses are the contrastive mentions in the Introduction and the glossary)'],
  [/Quicknode Press|QuickNode|QuikNode|Quiknode(?! Inc\.)/, 'the company is "Quicknode"; the legal entity, used only on the copyright and licence lines, is "Quiknode Inc."; there is no Quicknode Press'],
  [/\bgas fees?\b|\bgas costs?\b/i, 'say "transaction fees"'],
  [/\bmempool/i, "Solana has no mempool"],
  [/\bToken 2022\b/i, 'say "Token Extensions Program"'],
  [/\bbase units?\b/i, 'say "minor unit"'],
  [/\bworked (example|scenario)\b/i, 'just "example", "scenario", or "walkthrough"'],
  [/(?<!`)\bids?\b(?!`|\.json)/, 'write "ID"/"IDs" in capitals in prose (code identifiers like `program_id` and the `id.json` filename keep lowercase)'],
  [/\bSolend\b/, "renamed: say Save"],
  [/\bSerum\b/, "collapsed project: cite OpenBook or Phoenix"],
  [/\bfavour|behaviour|\bcancelled\b|\bapologise\b|\blabelled\b/, "American spelling in prose (identifiers like the Cancelled enum are exempt: write them capitalized)"],
  // An address is only set as an address in the PDF if the build can find it,
  // and the build finds links. A host written as loose prose prints as prose.
  [/(?<![([\/`\w.])[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|io|dev|net|xyz)\b(?!\w)/,
    "write an address as a markdown link, [host.tld](https://host.tld), so the build sets it as an address"],
];

// Allowed exceptions, matched against the full line.
const exceptions = [
  /Called a "smart contract" on other chains/, // the glossary's contrastive definition
  /other blockchains call the same thing a smart contract/, // the Introduction's contrastive mention
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

// Heading check: a heading states the general mechanism and the characters
// stay in the prose beneath, in every part of the book. Walkthrough chapters
// keep the story's order and the specific mechanism; only the names go.
const characterHeading = /^#{2,6} .*\b(Alice|Bob|Carol|Dave|Maria)\b/;

for (const file of [...new Set(files)]) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      if (!characterHeading.test(line)) return;
      failures += 1;
      console.error(
        `${file}:${index + 1}: headings state the general mechanism, not a specific actor (WRITING-PLAN.md)\n    ${line.trim().slice(0, 160)}`,
      );
    });
}

// Cross-reference check: a pointer to another chapter says so, and sets the
// chapter's title in italics, so a reader can tell "the *Offchain Truth*
// chapter" from a passing mention of offchain truth the concept. A leading
// "The" is dropped inside the italics, because "the *The Adversary* chapter"
// reads badly: write "the *Adversary* chapter".
//
// Only the distinctive multi-word titles are checked. Time, Tokens, PDAs and
// Escrow are ordinary words far too often to match mechanically, so the
// convention covers them and this check does not.
const chapterTitles = [
  "Core Building Blocks of Solana",
  "Arithmetic of Money",
  "Offchain Truth",
  "Adversary",
  "Operating Financial Software",
  "Token Fundraiser",
  "Betting Market",
  "Order Book Exchange",
  "Constant-Product AMM",
  "Prop AMM",
  "Lending and Borrowing",
  "Vault Strategy",
  "Perpetual Futures",
  "Where to Go From Here",
];

for (const file of [...new Set(files)]) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      // Headings carry chapter titles as their own name, not as references.
      if (/^#/.test(line)) return;
      for (const title of chapterTitles) {
        // The correct form puts the title between asterisks. Flag any other
        // occurrence, including one still carrying its leading "The".
        const bare = new RegExp(`(?<!\\*)\\b(?:The )?${title}\\b`);
        if (!bare.test(line)) continue;
        failures += 1;
        console.error(
          `${file}:${index + 1}: a chapter reference reads "the *${title}* chapter" (WRITING-PLAN.md)\n    ${line.trim().slice(0, 160)}`,
        );
        break;
      }
    });
}

// Sentence length. Not a style preference: past about forty-five words a
// reader has to hold too many clauses open to reach the verb, and every one
// of the sentences this rule first caught was a list that had been glued into
// a paragraph, or two claims joined by a colon. The fix is almost always to
// split at the colon or semicolon that is already there, so the ceiling is
// deliberately loose. This is the one ASD-STE100 rule the book adopts whole;
// its sentence-per-idea and approved-dictionary rules are written for aircraft
// maintenance procedures and would flatten a book that teaches with a story.
//
// The limit counts words after markdown is reduced to prose, so a link counts
// as its text and a code span as one word.
const sentenceWordLimit = 45;

// Words with a plain equivalent and no meaning of their own in this domain.
// Deliberately short: "execute", "yield", "provide", "present" and "operate"
// all read as bureaucratic in a generic style guide and are exact here (a
// transaction executes, a supplier earns yield, a maker provides liquidity, a
// program signs by presenting seeds), so they are not on the list.
const wordinessRules = [
  [/\butili[sz]e[sd]?\b/i, 'say "use"'],
  [/\bcommence[sd]?\b/i, 'say "start"'],
  [/\bprior to\b/i, 'say "before"'],
  [/\bsubsequent to\b/i, 'say "after"'],
  [/\bin order to\b/i, 'just "to"'],
  [/\bin the event that\b/i, 'say "if"'],
  [/\bdue to the fact that\b/i, 'say "because"'],
  [/\b(?:whilst|amongst)\b/i, 'say "while" and "among"'],
  [/\b(?:thus|hence|therefore)\b/i, 'say "so", or start the sentence with the consequence'],
  [/\bapproximately\b/i, 'say "about"'],
  [/\bnumerous\b/i, 'say "many"'],
  [/\bsufficient(?:ly)?\b/i, 'say "enough"'],
  // "confirmed" is one of Solana's three commitment levels, alongside
  // processed and finalized. Using "confirm" loosely for "check" puts a
  // reserved word on an unrelated idea, in a book that teaches the levels.
  [/\bconfirms?\b(?! that a supermajority)/i,
    'say "check": "confirmed" is a commitment level in this book, not a synonym for checking'],
];

// Reduce a manuscript line to the prose a reader reads, so both checks above
// count what is on the page rather than the markup around it.
function toProse(line) {
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // figures carry their own captions
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`[^`]*`/g, "CODE")
    .replace(/[*_]{1,2}/g, "");
}

// Split prose into sentences without breaking on the abbreviations and
// decimals this manuscript is full of: 0.3, $165.50, 25 slots (about 10s),
// e.g., i.e.
function toSentences(text) {
  const dot = "\u0000"; // stands in for a period that does not end a sentence
  const masked = text
    .replace(/\b(e\.g|i\.e|etc|vs|Mr|Mrs|Dr|Inc|St|No|Fig)\./gi, `$1${dot}`)
    .replace(/(\d)\.(\d)/g, `$1${dot}$2`);
  return masked
    .split(/(?<=[.!?])["')\]]*\s+(?=["'(“]?[A-Z0-9])/)
    .map((sentence) => sentence.split(dot).join(".").trim())
    .filter(Boolean);
}

for (const file of [...new Set(files)]) {
  let inFence = false;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;

      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("|")) return;

      // Blockquote and list markers are not part of the sentence.
      const body = toProse(trimmed)
        .replace(/^>\s*/, "")
        .replace(/^(?:[-*]|\d+\.)\s+/, "");
      if (!body || body.startsWith("#")) return;

      for (const [pattern, reason] of wordinessRules) {
        if (pattern.test(body)) {
          failures += 1;
          console.error(`${file}:${index + 1}: ${reason}\n    ${trimmed.slice(0, 160)}`);
        }
      }

      for (const sentence of toSentences(body)) {
        const words = sentence.split(/\s+/).length;
        if (words <= sentenceWordLimit) continue;
        failures += 1;
        console.error(
          `${file}:${index + 1}: ${words}-word sentence (limit ${sentenceWordLimit}); split it at the colon or semicolon already in it\n    ${sentence.slice(0, 160)}`,
        );
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
  "financial-programming-concepts-in-solana/figures",
  "building-financial-products-in-solana/figures",
];

const svgRules = [
  [/<rect(?![^>]*class="marker")[^>]*\brx="(?!6")[^"]*"/, 'account corner radius is rx="6", one radius book-wide'],
  [/<rect[^>]*\bry="/, "set rx only on rects; ry duplicates it (ellipse glyphs are exempt)"],
  [/\bopacity="(?!0\.3")[^"]*"/, 'the only fade level is opacity="0.3"'],
  // The cluster curve is the heaviest line in every figure: 3.5, no other
  // weight. The M/Q arc against ink #111 is the curve's one shape.
  [/<path d="M 40,[\d.]+ Q 320,[\d.]+ 600,[\d.]+" fill="none" stroke="#111" stroke-width="(?!3\.5")/,
    'the cluster curve is stroke-width="3.5", the heaviest line in the figure'],
  // The five account glyphs come from Iconify and are pasted verbatim from
  // DIAGRAMS.md. These are the signatures of the hand-drawn set they replaced,
  // which a figure copied from an older one brings back.
  [/M 1\.5,13 Q 1\.5,8\.4 7,8\.4|<ellipse cx="8" cy="7" rx="5\.4"|<circle cx="7" cy="7" r="3\.4"|<rect x="1" y="2" width="12" height="10"|M 1,5 L 7,1 L 13,5 Z/,
    'retired hand-drawn account glyph: use the Iconify mark for the account kind (DIAGRAMS.md)'],
  // A seed list names seeds, and the deriving program stays implied (the
  // escrow's offer PDA is labeled "OFFER" + MAKER'S ADDRESS + ID, with no
  // escrow program in it). An ATA's three seeds are the owner's address, the
  // token program, and the mint; the Associated Token Program derived it and
  // does not belong in the label.
  [/>ATA PROGRAM/,
    'seed lists name seeds, not the deriving program: an ATA is OWNER\'S ADDRESS + TOKEN PROGRAM + MINT'],
  // The coin mark is three rings. Two rings read as a pair of address dots at
  // print size, where the accent colour is gone and the mark is about 2mm.
  [/<circle cx="4" cy="2" r="6"[^>]*stroke="#1e7a3c"/,
    'the coin mark is three rings (cx 5/0/-5, r=4.5), not two'],
  // No currency symbol inside the mark: arrows carry ACME, NVDAx, SPCXx, LP
  // tokens and SOL as often as USDC, and the adjacent label names the asset.
  [/class="coin"[^>]*>.*(?:[$€£¥]|<text)/,
    'the coin mark carries no currency symbol; the amount label names the asset'],
];

// A figure is reproduced at the text width, so its printed height follows from
// its aspect ratio: h/w beyond about 1.22 cannot fit the text block once the
// caption is counted, and Paged.js then breaks the page inside the figure -
// which cost this book roughly 75 pages of blank and fragmented pages before
// the figures were reflowed. Nothing is exempt: the lending figures were the
// last three over, and splitting them by handler brought them under.
const MAX_ASPECT = 1.22;
const aspectExceptions = new Set();  // every figure fits; keep it that way

const svgFiles = [];
for (const dir of figureDirs) {
  for (const name of readdirSync(join(repoRoot, dir))) {
    if (name.endsWith(".svg")) svgFiles.push(join(repoRoot, dir, name));
  }
}

for (const file of svgFiles) {
  const source = readFileSync(file, "utf8");
  const viewBox = source.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (viewBox && !aspectExceptions.has(basename(file))) {
    const [w, h] = [Number(viewBox[1]), Number(viewBox[2])];
    if (h / w > MAX_ASPECT) {
      failures += 1;
      console.error(`${file}: ${w}x${h} is ${(h / w).toFixed(2)} times as tall as it is wide, ` +
        `over the ${MAX_ASPECT} that fits the text block (prints ${(5.74 * h / w).toFixed(2)}in against 8.04in)`);
    }
  }
  // Anything after </svg> is not in the drawing. The browser lays it out as
  // loose text after the figure, so a footnote added below the canvas renders
  // outside the SVG, breaks to the next page on its own, and lands above the
  // caption. A footnote at the foot of a figure goes inside the root element.
  const trailing = source.split(/<\/svg>/).pop().trim();
  if (trailing) {
    failures += 1;
    console.error(`${file}: markup after </svg> is not part of the figure; move it inside the root element\n    ${trailing.slice(0, 160)}`);
  }
  const lines = source.split("\n");
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
