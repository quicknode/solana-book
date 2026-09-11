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
  // The em-dash rule above, enforced on the punctuation the manuscript
  // reached for once the em-dash was banned. A spaced hyphen between clauses
  // is the same rhythm crutch in a different character, and sixteen of them
  // had accumulated: use a comma, a colon, parentheses, or a full stop.
  [/\w - \w/, "no spaced hyphen between clauses; use a comma, parentheses, or a full stop"],
  // Announcing that a point exists instead of making it, second group: these
  // point the reader at the sentence that follows rather than letting it land.
  [/\bnote (what|that|how)\b/i, "state the fact; do not tell the reader to notice it"],
  [/(?:^|[.!?]\s+|\band )here(?:'s| is) (?:the|what|why) \w/i, "cut the setup and make the claim stand on its own"],
  [/\bfits in one sentence\b/i, "just write the sentence"],
  // Ranking the book's own passages against each other. Two of these awarded
  // the same superlative to different passages, which a reader who notices
  // both stops trusting.
  [/\bthe (?:single )?most [\w-]+(?: [\w-]+)? (?:section|part|pages?|idea|chapter|thing) in (?:the|this) (?:book|chapter)\b/i,
    "cut the ranking and keep the claim"],
  // Filler that delays the point, on the same grounds as "in today's" above.
  [/\bin the (?:age|world) of\b|\bat its core\b|\bat the end of the day\b|\bwhen it comes to\b/i,
    "cut the phrase and start at the point"],
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
  // The same announcement, wearing a pronoun. Each of these was written here
  // after the plain forms above were banned, and each was cut without losing a
  // word of content: "which is exactly the point" and "that is the point" both
  // sat after the sentence that already made the point.
  [/\b(?:that|this|which|it)(?:'s| is) (?:exactly )?the (?:whole )?point\b/i,
    'the sentence before it already made the point; delete the announcement'],
  [/\bis the one that matters\b|\bmatters more than it (?:looks|sounds)\b/i,
    'say why: "the path an attacker will drive", not "the one that matters"'],
  [/\bit is worth being\b/i, "cut it: if the point is worth making, make it"],
  // Words that rate the writing instead of doing it. "Honest" appeared twenty
  // times in this manuscript and never once meant honesty ("the honest way to
  // make it", "an honest limitation, stated as one"); "quietly" dressed up a
  // value that changed; "the discipline" and "hygiene" named a category where
  // the rule itself was shorter; "worth stealing" and "by now you know" told
  // the reader how to feel about the next sentence. The paragraph-closing
  // maxim is the same tell with no regex, so the companion AI plugin
  // describes it and this file cannot catch it.
  [/\bhonest(?:ly)?\b/i, 'say what the sentence means without the word: accurate, stated, plain, or nothing'],
  [/\bquietly\b/i, "the value changed, so say it changed; the adverb adds only tone"],
  [/\bthe discipline\b|\bhygiene\b/i, 'name the rule instead of its category: "the rules below", "the staleness check"'],
  [/\bworth (?:stealing|copying|noticing|printing|studying|memorizing)\b|\bby now you\b/i,
    "do not rate the next sentence; cut the rating and keep the content"],
  // Mannered prose: an idiom, a slang word, or a metaphor standing where the
  // literal phrase is the same length, each one found in a single audit of
  // the manuscript. "A single whale" was "a single large backer", "config
  // foot-guns" was "dangerous configurations", "the LPs eat the drift" was
  // "the LPs absorb the loss", and "the ladder has three rungs" was "there
  // are three levels of assurance". A metaphor drags in connotations the
  // writer did not choose; the fix is to say the thing.
  [/\bwhales?\b|\bfoot-?guns?\b|\bzombie\b|\brugged\b|\bfat-finger|\bbabysit|\bgriefing\b|\bafter the whistle\b|\bmid-flight\b|\bhot path\b|\bhand-rolled\b|\bcomes? off the top\b|\bpays? for itself\b|\bcomes? home\b|\bripped off\b|\bdunk on\b|\bsliver\b|\byou do you\b|\bcomes? in hot\b|\bdouble duty\b|\brungs?\b|\bup the ladder\b/i,
    'say the plain thing: "a large backer", "a dangerous configuration", "absorb the loss", "the third level"'],
  // "Fail open" means "stop working" to an electrician (an open circuit) and
  // "let everything through" to everyone else (an open door), and "fail
  // closed" flips the same way, so half the readers take each one backwards.
  [/\bfail(?:s|ed|ing)?[ -](?:open|closed)\b/i,
    'say what happens: "refuses the transaction", "rejects the price", "lets every request through"'],
  // Pointing the reader at the page instead of telling them what is on it.
  // "Note what is pledged: shares" is one word longer than "what he pledges is
  // shares". Watching a real market, or looking away from the chain, is the
  // reader doing something in the world, and stays.
  [/\bNote (?:what|who|where|the order)\b|\bNotice (?:what|who|how)\b|\bWatch \w+ in the (?:story|chapter|section|table|figure)\b/,
    'state what the reader would see, rather than telling them to look at it'],
  // "Treats" for "discusses" ("the Lending chapter treats it fully", "admin
  // power is treated in the Operating chapter") is academic register the
  // author has ruled out. "Treats X as Y", the runtime treating a byte string
  // as an address, is a different verb and is not matched.
  [/\b(?:chapter|section|book|appendix) treats\b|\btreat(?:s|ed)? (?:it|them|this|that) (?:fully|in full|at length|below|later|here)\b|\bis treated (?:in|by) the\b/i,
    'say "explains" or "covers"'],
  // American spelling, second batch: the doubled-l forms and the noun/verb
  // pairs British English splits. Identifiers keep whatever the code shipped.
  [/\b(?:cancelling|modelling|labelling|signalling|travelling)\b/i,
    "American spelling doubles the l only when the stress falls on the last syllable: canceling, modeling"],
  [/\bcancellable\b|\bcentre\b|\bcentrepiece\b|\blicence(?:s|d)?\b/i,
    'American spelling in prose: cancelable, center, centerpiece, license'],
  // One apostrophe and one set of quotes in the source, both straight. The
  // build sets them typographically (’ and “ ”) in prose and leaves code
  // alone, so nothing is gained by typing the curly forms and something is
  // lost: a curly apostrophe reached six figure captions by way of a word
  // processor once, and the two forms then read differently to grep.
  [/[\u2018\u2019\u201c\u201d]/,
    "use a straight apostrophe (') and straight quotes (\"); the build sets them typographically"],
  // The build sets every single quote as an apostrophe, because a quotation
  // inside a quotation does not occur in the manuscript. A single quote that
  // opens a word would print as an apostrophe hanging off its front.
  [/(?:^|[\s(\[])'(?=[A-Za-z0-9])/,
    "a single quote is always an apostrophe here; set a quotation in double quotes"],
  // One italic marker. Underscores also blind the chapter-reference check
  // below, because an underscore is a word character, so `\b` never fires
  // against the start of _Arithmetic of Money_ and the reference reads clean.
  [/(?<![\w`*_])_[^_`\n]{1,80}_(?![\w`*_])/,
    'italics are *asterisks* book-wide; underscores also hide chapter references from the check below'],
  [/can(?:not|'t) verify the price/i, "negative offchain-truth framing"],
  [/\bBONK\b/, "no meme tokens; use USDC and RWA stocks (NVDAx, TSLAx, SPCXx)"],
  [/\bmemecoin|meme token/i, "no meme tokens"],
  [/\bsmart contracts?\b/i, 'say "program" (the only allowed uses are the contrastive mentions in the Introduction and the glossary)'],
  // "protocol" names the network and the programs on it, so it tells a reader
  // neither. Identifiers that ship with the word keep it: the lookarounds skip
  // anything backticked or joined by an underscore.
  [/(?<![`\w])protocols?\b(?![\w`])/i,
    'say "network" for Solana and the rules it enforces, "program" for onchain code; "protocol" names both (identifiers like `accumulated_protocol_fees` are exempt)'],
  [/Quicknode Press|QuickNode|QuikNode|Quiknode(?! Inc\.)/, 'the company is "Quicknode"; the legal entity, used only on the copyright and licence lines, is "Quiknode Inc."; there is no Quicknode Press'],
  [/\bgas fees?\b|\bgas costs?\b/i, 'say "transaction fees"'],
  [/\bmempool/i, "Solana has no mempool"],
  [/\bToken 2022\b/i, 'say "Token Extensions Program"'],
  [/\bbase units?\b/i, 'say "minor unit"'],
  [/\bworked (example|scenario)\b/i, 'just "example", "scenario", or "walkthrough"'],
  // "Property" also names an account's fields, so "property test" reads two
  // ways in a book about accounts. The book's word for what a test or proof
  // pins is "invariant", which the program chapters already use for their
  // invariants sections. The one allowed mention names the testing libraries'
  // own term so a reader can find them.
  [/\bpropert(?:y|ies)(?:-based)? tests?\b|\bproperty-based\b/i, 'say "invariant test": "property" also names an account\'s fields'],
  // The trailing "=" exempts a URL query parameter (?id=43495 in a footnote's
  // link), which is part of an address rather than prose.
  [/(?<!`)\bids?\b(?!`|\.json|=)/, 'write "ID"/"IDs" in capitals in prose (code identifiers like `program_id` and the `id.json` filename keep lowercase)'],
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
  /other blockchains call the same thing a "smart contract"/, // the Introduction's contrastive mention, which also names "protocol"
  /says minor unit, not "base unit\."/, // the glossary teaching the rule itself
  /call this property-based testing/, // the one pointer to the testing libraries' own term
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
const characterHeading = /^#{2,6} .*\b(Alice|Bob|Carol|Dave|Maria|Victor)\b/;

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

// "Financial Programming Concepts in Solana" heads a section of five chapters,
// and is also chapter 6's title. A reference to it lands the reader on a
// section rather than a subject: thirteen of them meant the *Adversary* or
// *Arithmetic of Money* chapter. It is not in the title list above because the
// message there would tell an author to call a five-chapter section a chapter.
const sectionName = "Financial Programming Concepts in Solana";
// No lookbehind here: italicizing the section name is the commonest way to
// write it as though it were a chapter, which is the mistake being caught.
const sectionMention = new RegExp(`\\b${sectionName}\\b`);
const sectionLink = new RegExp(`\\[${sectionName}\\]\\(`);

for (const file of [...new Set(files)]) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      // The heading naming the section, and the Introduction's reading path,
      // which links the section's landing page rather than referring to it.
      if (/^#/.test(line) || sectionLink.test(line)) return;
      if (!sectionMention.test(line)) return;
      failures += 1;
      console.error(
        `${file}:${index + 1}: name the chapter that holds the material; ` +
          `"${sectionName}" is a section of five chapters (WRITING-PLAN.md)\n    ${line.trim().slice(0, 160)}`,
      );
    });
}

// Footnote check: every [^label] call in a chapter has a [^label]: definition
// at the foot of the same file, and every definition is called. The PDF build
// splices a note into the text at its call, so a call with nothing behind it
// prints as literal brackets and a note nobody calls never prints at all.
// Labels are file-scoped, because the number a reader sees is assigned at
// layout and the label is only how the two halves find each other.
for (const file of [...new Set(files)]) {
  const source = readFileSync(file, "utf8");
  const defined = new Map();
  for (const match of source.matchAll(/^\[\^([^\]\s]+)\]:/gm)) {
    if (defined.has(match[1])) {
      failures += 1;
      console.error(`${file}: footnote [^${match[1]}] is defined twice`);
    }
    defined.set(match[1], false);
  }
  // A definition line carries the label in the same shape as a call, so count
  // calls in the prose that is left once the definitions are taken out.
  const prose = source.replace(/^\[\^[^\]\s]+\]:.*$/gm, "");
  for (const match of prose.matchAll(/\[\^([^\]\s]+)\]/g)) {
    if (!defined.has(match[1])) {
      failures += 1;
      console.error(`${file}: footnote [^${match[1]}] is called but never defined`);
      continue;
    }
    defined.set(match[1], true);
  }
  for (const [label, called] of defined) {
    if (called) continue;
    failures += 1;
    console.error(`${file}: footnote [^${label}] is defined but never called`);
  }
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
// A paragraph that opens by asserting something about an unnamed antecedent
// makes the reader carry it across the break: "This is the only stable policy"
// was "keeping the dust in the pool is the only stable policy". Mid-paragraph
// the antecedent is a clause away and reads fine, so only the opener is
// checked. "That is why ..." is a connective, not an assertion, and passes.
const openerRules = [
  [/^(?:This|That|It) (?:is|was) (?:the|a|an) /,
    "name what the sentence is about: a paragraph cannot open by pointing back"],
  [/(?:^|\. )Look (?:at|again|once)\b/,
    "state what the reader would see: \"a round trip costs 1.65 USDC\", not \"look at the two numbers\""],
];

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
  // "Pin" in both of the manuscript's senses: what a test does ("pinned by
  // test_x", "the test pins it") and a value fixed when an account is made
  // ("pinned at creation"). The author ruled both out.
  // "Capstone" rates a chapter's place in the book instead of saying what
  // the chapter does; "this chapter", or the chapter's name, says it.
  [/\bcapstone\b/i, 'say "this chapter" or name the chapter'],
  [/\bpin(?:s|ned|ning)?\b/i, 'a test enforces, checks, or asserts; a value is fixed or recorded at creation'],
  [/\bconfirms?\b(?! that a supermajority)/i,
    'say "check": "confirmed" is a commitment level in this book, not a synonym for checking'],
  // "Walks" with a chapter, book, or suite as its subject is tour-guide
  // framing: a chapter explains or builds, and a suite follows or runs a
  // path. A loop that walks a tree or the states of a machine is mechanism,
  // and stays.
  [/\b(?:chapters?|book|suites?|tests?|guide|section) walks?\b/i,
    'a chapter explains or builds; a suite follows or runs a path'],
  [/\bwalks? through\b/i, 'say what the prose does: explains, builds, follows'],
  // "Works" meaning succeeds or functions stays ("flips which handler
  // works"). Working an example is tour-guide framing: the chapter shows
  // or builds the example instead.
  [/\bwork(?:s|ed|ing)? (?:an|the|a) examples?\b/i, 'the chapter shows or builds the example'],
  [/\bworked examples?\b/i, 'the chapter shows or builds the example'],
];

// Reduce a manuscript line to the prose a reader reads, so both checks above
// count what is on the page rather than the markup around it.
function toProse(line) {
  return line
    .replace(/^\[\^[^\]\s]+\]:\s*/, "") // a note is linted as the prose it is
    .replace(/\[\^[^\]\s]+\]/g, "") // a footnote call is a number on the page
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

      for (const [pattern, reason] of [...openerRules, ...wordinessRules]) {
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
  // Figure text is typed with the same straight apostrophe and straight
  // quotes as the chapters, and the build sets both typographically when it
  // inlines the figure. Seventy figures once carried the curly forms as
  // numeric entities and nine as literal characters, so the same label read
  // three ways to grep.
  [/&#821[67];|&#822[01];|&#x201[89a-d];|&(?:[lr]squo|[lr]dquo);|[\u2018\u2019\u201c\u201d]/,
    "use a straight apostrophe (') and straight quotes (\") in figure text; the build sets them typographically"],
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
        `over the ${MAX_ASPECT} that fits the text block (prints ${(5.44 * h / w).toFixed(2)}in against 7.89in)`);
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
