#!/usr/bin/env node
// Build a technical-book style PDF of the manuscript.
//
// Reads TABLE-OF-CONTENTS.md to get the chapters in order, converts each
// markdown file to HTML, lays the result out as 6x9in book pages (serif
// type, running headers, page numbers, chapters on fresh pages, a table of
// contents with page numbers) using Paged.js, and prints to PDF with the
// system Chromium via playwright-core.
//
// Usage: node scripts/build-pdf.mjs [output.pdf]

import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";
import { chromium } from "playwright-core";
import { PDFArray, PDFDocument, PDFName } from "pdf-lib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const TITLE = "Building Financial Software on Solana";
const AUTHOR = "Mike MacCana";

// Page sizes, in inches. "print" is what the book is printed at: 7.44 x 9.69
// is the KDP standard trim closest in proportion to the 7 x 9.19 technical
// books are usually printed at, which KDP does not offer. Its side margins
// clear KDP's 0.75in gutter minimum for books up to 500 pages and leave a
// 5.74in measure, about 75 characters.
//
// "letter" is US Letter, for reading on screen and for printing a draft on an
// office printer. It is not a book size, and its wider margins only bring the
// measure down to 6.3in, about 82 characters, which is longer than a reader
// tracks comfortably. Every page dimension is derived from the chosen size.
const PAGE_SIZES = {
  print: { widthIn: 7.44, heightIn: 9.69, sideMarginIn: 0.85, topMarginIn: 0.8, bottomMarginIn: 0.85 },
  letter: { widthIn: 8.5, heightIn: 11, sideMarginIn: 1.1, topMarginIn: 0.9, bottomMarginIn: 0.95 },
};

const USAGE = `Usage: npm run build-pdf -- [--size ${Object.keys(PAGE_SIZES).join("|")}] [output.pdf]

  --size <name>   Page size; defaults to "print". See PRINT-SPECIFICATION.md.
  --help          Print this and exit.

Environment:
  NO_COVER=1      Build the interior without the cover page.
  REVIEWER_NAME   Stamp as an advance copy for that reviewer: named on the
                  title page, and in the footer of every page carrying a folio.
                  The commit the copy was built from is stamped beside the
                  name, so feedback can be matched to the text it was about.`;

const die = (message) => {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(1);
};

// npm passes everything after its own "--" through, but which npm versions
// forward the separator itself has changed over the years, so a bare "--" is
// dropped rather than taken for an output path.
const argv = process.argv.slice(2).filter((arg) => arg !== "--");
let sizeName = "print";
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--help" || arg === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else if (arg.startsWith("--size=")) {
    sizeName = arg.slice("--size=".length);
  } else if (arg === "--size") {
    if (i + 1 >= argv.length) die("--size needs a value.");
    sizeName = argv[++i];
  } else if (arg.startsWith("-")) {
    // Without this an unrecognized flag becomes the output path, and the build
    // succeeds having written a file named "--size".
    die(`Unknown option ${JSON.stringify(arg)}.`);
  } else {
    positional.push(arg);
  }
}
if (positional.length > 1) die(`Expected one output path, got ${positional.length}: ${positional.join(", ")}`);
if (!Object.hasOwn(PAGE_SIZES, sizeName)) {
  die(`Unknown --size ${JSON.stringify(sizeName)}; expected one of: ${Object.keys(PAGE_SIZES).join(", ")}`);
}
const PAGE_WIDTH_IN = PAGE_SIZES[sizeName].widthIn;
const PAGE_HEIGHT_IN = PAGE_SIZES[sizeName].heightIn;
const SIDE_MARGIN_IN = PAGE_SIZES[sizeName].sideMarginIn;
const TOP_MARGIN_IN = PAGE_SIZES[sizeName].topMarginIn;
const BOTTOM_MARGIN_IN = PAGE_SIZES[sizeName].bottomMarginIn;
const TEXT_WIDTH_IN = +(PAGE_WIDTH_IN - 2 * SIDE_MARGIN_IN).toFixed(2);

// A size the book is not printed at is labelled in the filename, so two builds
// can sit in build/ without one quietly overwriting the other.
const defaultName = sizeName === "print" ? `${TITLE}.pdf` : `${TITLE} (${sizeName}).pdf`;
const outputPath = resolve(positional[0] ?? join(repoRoot, "build", defaultName));
mkdirSync(dirname(outputPath), { recursive: true });

// A reviewer's name is the one build input that does not come from the
// repository, and it lands in an HTML element and a CSS content string, so it
// is escaped for each. A name carrying a quote would otherwise end the CSS
// string and take the rest of the footer rule with it.
const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeCssString = (text) =>
  text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ");

// Advance review copies are stamped per reviewer: REVIEWER_NAME=... npm run build-pdf
const reviewerName = (process.env.REVIEWER_NAME ?? "").trim();
const buildDate = new Date().toISOString().slice(0, 10);

// A reviewer's copy also carries the commit it was built from. The manuscript
// changes daily, and a build date does not say which of that day's commits a
// piece of feedback was written against; the hash does. A build from a
// working tree with uncommitted changes is marked as such, because its text
// matches no commit exactly. Missing git is a warning rather than a failure:
// the copy is still usable, it just cannot be traced.
const git = (...args) =>
  execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
function describeCommit() {
  try {
    const hash = git("rev-parse", "--short", "HEAD");
    const dirty = git("status", "--porcelain", "--untracked-files=no") !== "";
    return dirty ? `${hash}-dirty` : hash;
  } catch {
    console.warn("Could not read the git commit; the review copy will not name one.");
    return "";
  }
}
const commit = reviewerName ? describeCommit() : "";

const advanceNote = reviewerName
  ? `Advance review copy for ${escapeHtml(reviewerName)}. Please don't redistribute. Built ${buildDate}${commit ? ` from commit ${escapeHtml(commit)}` : ""}.`
  : `Prerelease draft, built ${buildDate}.`;
// The title page names the reviewer once; the footer names them on every page,
// so a single printed or photographed leaf still says whose copy it came from,
// and which revision of the text it was.
const reviewerStamp = commit ? `${reviewerName} (${commit})` : reviewerName;
const reviewerFooter = reviewerName
  ? `@bottom-right { content: "${escapeCssString(reviewerStamp)}"; font-family: Gelasio, Georgia, serif; font-size: 8pt; letter-spacing: 0.02em; color: #999; }`
  : "";
const suppressReviewerFooter = reviewerName ? " @bottom-right { content: none; }" : "";

// Chapter order comes from the reader-facing table of contents: every
// relative .md link, in document order.
const toc = readFileSync(join(repoRoot, "TABLE-OF-CONTENTS.md"), "utf8");
const chapterPaths = [...toc.matchAll(/\]\(((?!https?:)[^)#]+\.md)\)/g)]
  .map((match) => match[1])
  .filter((path, index, all) => all.indexOf(path) === index);

const idForPath = (path) => "ch-" + path.replace(/\.md$/, "").replace(/[^a-z0-9]+/gi, "-");

// Footnotes are written in the syntax GitHub renders: a [^label] call in the
// prose, and a [^label]: line at the foot of the chapter carrying the note.
// Paged.js sets a note at the bottom of whatever page its call lands on, and
// it finds the note by looking where the call is, so the note's text is
// spliced back in at the call site as a span the stylesheet floats. The
// definition line itself is dropped: it is a place to write the note, not a
// place it is printed.
const footnoteCall = /\[\^([^\]\s]+)\]/g;
const footnoteDefinition = /^\[\^([^\]\s]+)\]:[ \t]*(.*)$\n?/gm;

function inlineFootnotes(markdown, path) {
  const notes = new Map();
  const prose = markdown.replace(footnoteDefinition, (whole, label, text) => {
    if (notes.has(label)) throw new Error(`${path}: footnote [^${label}] is defined twice`);
    notes.set(label, text.trim());
    return "";
  });
  const used = new Set();
  const withNotes = prose.replace(footnoteCall, (whole, label) => {
    if (!notes.has(label)) throw new Error(`${path}: footnote [^${label}] has no definition`);
    used.add(label);
    return `<span class="footnote">${notes.get(label)}</span>`;
  });
  for (const label of notes.keys()) {
    if (!used.has(label)) throw new Error(`${path}: footnote [^${label}] is defined but never called`);
  }
  return withNotes;
}

// Rewrite intra-book links to in-document anchors, and mark FIGURE
// placeholders so the stylesheet can box them.
function prepareMarkdown(markdown, path) {
  return inlineFootnotes(markdown, path)
    .replace(/\*\*\[FIGURE: ([^\]]+)\]\*\*/g, '<div class="figure-placeholder">FIGURE: $1</div>')
    .replace(/\]\(((?:\.\.\/)?(?!https?:)[^)#]+\.md)(#[^)]*)?\)/g, (whole, link) => "](#" + idForPath(link.replace(/^\.\.\//, "")) + ")");
}

const cleanTitle = (raw) => raw.replace(/[*_`]/g, "");

// Parts come from "## Part N: Title" headings in the table of contents, and a
// chapter belongs to the part heading above it. Any other H2 (Prelude, the
// Introduction, the Glossary) closes the current part, so those chapters sit
// outside the numbered parts and get no divider page.
const partForPath = new Map();
{
  let current = null;
  for (const line of toc.split("\n")) {
    const partHeading = line.match(/^##\s+(Part\s+[IVXL]+):\s*(.+?)\s*$/);
    if (partHeading) {
      current = { label: partHeading[1], title: cleanTitle(partHeading[2]) };
      continue;
    }
    if (/^##\s/.test(line)) current = null;
    if (!current) continue;
    for (const link of line.matchAll(/\]\(((?!https?:)[^)#]+\.md)\)/g)) {
      if (!partForPath.has(link[1])) partForPath.set(link[1], current);
    }
  }
}

// Justified text has to absorb a long unbreakable identifier somewhere, and it
// goes into the word spaces of the line before, which is why a paragraph naming
// proof_cancel_offer_returns_all_to_maker comes out visibly loose. Snake_case
// already tells the reader where the seams are, so offer a break opportunity
// after each underscore and let the line break there. <wbr> is a break
// opportunity rather than a character, so the identifier a reader copies out of
// the PDF is still whole, and no hyphen appears to be mistaken for part of the
// name. Nothing else in an identifier is a legible place to break, so nothing
// else gets one: a name with no underscores stays atomic.
//
// Not every underscore is worth breaking at. Breaking at the first one in
// test_something strands "test_" at the end of a line, which reads as noise and
// saves almost nothing, so a break has to leave a substantial fragment behind
// and carry a substantial one over. These two limits are the idea behind CSS
// hyphenate-limit-chars, applied by hand because <wbr> has no such knob.
const BREAK_MIN_BEFORE = 8;
const BREAK_MIN_AFTER = 5;
const breakableIdentifier = (text) =>
  text
    .split(/(\s+)/)
    .map((token) => {
      if (!token.includes("_")) return token;
      let out = "";
      for (let i = 0; i < token.length; i++) {
        out += token[i];
        const kept = i + 1;
        const carried = token.length - kept;
        if (token[i] === "_" && kept >= BREAK_MIN_BEFORE && carried >= BREAK_MIN_AFTER) out += "<wbr>";
      }
      return out;
    })
    .join("");

// A URL has the same problem for the same reason, and a slash is its legible
// seam, so it gets the same treatment under the same two limits.
const breakableUrl = (text) => {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    out += text[i];
    const kept = i + 1;
    const carried = text.length - kept;
    if (text[i] === "/" && kept >= BREAK_MIN_BEFORE && carried >= BREAK_MIN_AFTER) out += "<wbr>";
  }
  return out;
};

// External links, in the two shapes the manuscript writes them. A link whose
// text is its own address is set as an address; a link whose text is words
// keeps the words and has its address printed after it, because a reader
// holding the paper edition cannot click anything. Book-internal
// cross-references were rewritten to #anchors by prepareMarkdown, so they do
// not match here and stay plain prose.
// What a reader sees. The scheme is printed, because it is part of the address
// and because technical publishing prints it: O'Reilly sets a link as "words
// (https://host/path)". A leading www is not, being a subdomain nobody types
// and every browser supplies. So the printed form and the link can differ, and
// the link is the one a click follows: it keeps the www it was written with.
const printedAddress = (href) => href.replace(/^(https?:\/\/)www\./, "$1").replace(/\/$/, "");

// The manuscript writes a link's text as the host and path alone, so that is
// what the shape test below compares against. Keeping it derived from the
// printed form means the two cannot drift apart.
const bareAddress = (href) => printedAddress(href).replace(/^https?:\/\//, "");
const markUrls = (html) =>
  html.replace(/<a href="(https?:[^"]+)">([^<]+)<\/a>/g, (whole, href, text) =>
    bareAddress(href) === text.replace(/\/$/, "")
      ? `<a class="url" href="${href}">${breakableUrl(printedAddress(href))}</a>`
      // The parentheses belong to the sentence, not to the address, so they
      // stay outside .url and set roman around the italic. They also keep the
      // separating space company: Paged.js drops a whitespace-only text node
      // during layout, which would jam the address against the word before it,
      // and " (" is not whitespace-only.
      : `${whole} (<span class="url">${breakableUrl(printedAddress(href))}</span>)`,
  );

const sections = chapterPaths.map((path) => {
  const markdown = readFileSync(join(repoRoot, path), "utf8");
  const id = idForPath(path);
  const subsections = [...markdown.matchAll(/^## (.+)$/gm)].map((match, index) => ({
    id: `${id}-s${index + 1}`,
    title: cleanTitle(match[1]),
  }));
  let htmlSubIndex = 0;
  const htmlWithCode = marked
    .parse(prepareMarkdown(markdown, path), { mangle: false, headerIds: false })
    .replace(/<h2>/g, () => `<h2 id="${id}-s${++htmlSubIndex}">`)
    // Inline SVG figures so the single-file HTML needs no external assets;
    // the image's alt text becomes the printed caption.
    .replace(/<img src="([^"]+\.svg)" alt="([^"]*)"[^>]*>/g, (whole, src, alt) => {
      const svg = readFileSync(join(repoRoot, dirname(path), src), "utf8");
      return `<figure>${svg}<figcaption>${alt}</figcaption></figure>`;
    })
    .replace(/<code>([^<]+)<\/code>/g, (whole, text) => `<code>${breakableIdentifier(text)}</code>`);
  const html = markUrls(htmlWithCode);
  const title = cleanTitle((markdown.match(/^# (.+)$/m) ?? [null, basename(path, ".md")])[1]);
  return { id, title, html, path, subsections };
});

// Front and back matter: unnumbered, no table-of-contents row, sharing one
// page flow. Acknowledgements sit at the back because that list grows with
// every edition and is for the people named, not for the reader.
const isPreludeItem = (path) =>
  (path.startsWith("prelude/") && !path.endsWith("introduction.md")) || path.startsWith("postlude/");


// The end mark. Magazines close every article with a small device so that a
// reader who reaches it knows the piece is over rather than continued on
// another page: The New Yorker's diamond, Time's red square, and very often the
// publication's own logo in miniature. A book chapter can end mid-page too, and
// the mark says so. Ours is a square with the QuickNode Q knocked out of it,
// the Q taken from the cover wordmark; the file is assets/end-mark.svg.
//
// It is set on the chapter's last line, a word space after the final word, the
// way the magazine marks are. It is bound to that word in a no-wrap span:
// Chromium will break a line before an inline image whatever character
// precedes it, a no-break space included, and a mark alone on a line of its
// own reads as a misprint. A chapter that ends in a list gets the mark in its
// last item; one that ends in anything else (a table, a code block, a figure)
// gets it on a line of its own, flush right.
const endMarkSvg = readFileSync(join(repoRoot, "assets", "end-mark.svg"), "utf8")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<\?xml[^>]*>/, "")
  .replace("<svg ", '<svg class="end-mark" ')
  .trim();

// Splits inline HTML on whitespace without splitting inside a tag, then takes
// the shortest trailing run of tokens whose tags balance: the last word,
// together with any inline element it closes, so the no-wrap span never cuts
// across an <a>, <em> or footnote.
function bindEndMark(inner) {
  const tokens = [];
  let current = "";
  let inTag = false;
  for (const ch of inner) {
    if (ch === "<") inTag = true;
    else if (ch === ">") inTag = false;
    if (!inTag && /\s/.test(ch)) {
      if (current) tokens.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  const balanced = (text) => {
    let depth = 0;
    for (const tag of text.matchAll(/<(\/?)(\w+)[^>]*?(\/?)>/g)) {
      if (tag[3] === "/" || tag[2] === "wbr" || tag[2] === "br") continue;
      depth += tag[1] === "/" ? -1 : 1;
      if (depth < 0) return false;
    }
    return depth === 0;
  };
  let start = tokens.length - 1;
  while (start > 0 && !balanced(tokens.slice(start).join(" "))) start--;
  const head = tokens.slice(0, start).join(" ");
  const tail = tokens.slice(start).join(" ");
  return `${head}${head ? " " : ""}<span class="end-mark-hold">${tail}&nbsp;${endMarkSvg}</span>`;
}

// Puts the mark inside the last paragraph of a fragment, or after the fragment
// if it does not end in one.
function withEndMark(html) {
  const trimmed = html.trimEnd();
  if (trimmed.endsWith("</p>")) {
    const open = trimmed.lastIndexOf("<p>");
    return `${trimmed.slice(0, open)}<p>${bindEndMark(trimmed.slice(open + 3, -4))}</p>`;
  }
  const listEnd = trimmed.match(/<\/li>\s*<\/(ul|ol)>$/);
  if (listEnd) {
    const open = trimmed.lastIndexOf("<li>");
    const inner = trimmed.slice(open + 4, trimmed.length - listEnd[0].length);
    // A loose list's item wraps its text in a paragraph; a tight list's does not.
    const marked = inner.trimEnd().endsWith("</p>") ? withEndMark(inner) : bindEndMark(inner.trimEnd());
    return `${trimmed.slice(0, open)}<li>${marked}</li>\n</${listEnd[1]}>`;
  }
  return `${trimmed}\n<p class="end-mark-line">${endMarkSvg}</p>`;
}

// The printed table of contents, in the style of TCP/IP Illustrated:
// "Chapter N  Title" rows in bold, "N.M  Section" rows beneath, page numbers
// right-aligned and filled in after Paged.js lays the pages out.
const tocEntries = [];
let chapterNumber = 0;
let tocPart = null;
for (const section of sections) {
  if (isPreludeItem(section.path)) continue;
  const part = partForPath.get(section.path) ?? null;
  if (part && part !== tocPart) {
    tocEntries.push(`<li class="toc-part"><span class="label">${part.label}</span><span class="t">${part.title}</span></li>`);
  }
  tocPart = part;
  // Back matter is unnumbered: the Glossary is called the Glossary, not
  // "Appendix A". With no label to print, its row has no label column at
  // all, so the title sits at the left margin where "Chapter N" sits above
  // it rather than indented to the chapter-title column.
  const isBackMatter = section.path.startsWith("appendices/");
  const label = isBackMatter ? "" : `Chapter ${++chapterNumber}`;
  const shortLabel = isBackMatter ? "" : String(chapterNumber);
  const labelCell = label ? `<span class="label">${label}</span>` : "";
  // The row already prints its own "Chapter N" label, and every chapter's H1
  // carries that prefix too (it is what the running header and the chapter
  // opening page print), so drop it here to avoid "Chapter 2  Chapter 2: ...".
  const tocTitle = section.title.replace(/^Chapter \d+:\s*/, "");
  tocEntries.push(`<li class="toc-chapter"><a href="#${section.id}">${labelCell}<span class="t">${tocTitle}</span><span class="pg"></span></a></li>`);
  for (const [index, subsection] of section.subsections.entries()) {
    const sectionLabel = shortLabel ? `${shortLabel}.${index + 1}` : "";
    tocEntries.push(`<li class="toc-section"><a href="#${subsection.id}"><span class="label">${sectionLabel}</span><span class="t">${subsection.title}</span><span class="pg"></span></a></li>`);
  }
}
const printedToc = tocEntries.join("\n");

let bodyPart = null;
const body = sections
  .map((section) => {
    // Front and back matter share a flow and are not chapters a reader finishes,
    // so they carry no end mark.
    const marked = isPreludeItem(section.path) ? section.html : withEndMark(section.html);
    const html = marked.replace("</h1>", "</h1><div class=\"cols\">") + "</div>";
    let classes = isPreludeItem(section.path) ? "chapter prelude-item" : "chapter";
    const part = partForPath.get(section.path) ?? null;
    // A part opens with its own page, carrying the label and the part's name.
    const opensPart = part && part !== bodyPart;
    const divider = opensPart
      ? `<section class="part-divider"><p class="part-label">${part.label}</p><h1>${part.title}</h1></section>\n`
      : "";
    // The divider page is a right-hand page with a blank reverse, so the
    // part's first chapter is pushed to the next right-hand page too.
    if (opensPart) classes += " part-opening";
    bodyPart = part;
    return `${divider}<section class="${classes}" id="${section.id}">\n${html}\n</section>`;
  })
  .join("\n");

const pagedPolyfill = readFileSync(join(repoRoot, "node_modules", "pagedjs", "dist", "paged.polyfill.js"), "utf8");
const fontUrl = (file) => pathToFileURL(join(repoRoot, "assets", "fonts", file)).href;

const workDir = mkdtempSync(join(tmpdir(), "solana-book-pdf-"));
const defaultChromiumPath = existsSync("/opt/pw-browsers/chromium")
  ? "/opt/pw-browsers/chromium"
  : "/opt/homebrew/bin/chromium";
const resolvedChromiumPath = process.env.CHROMIUM_PATH ?? defaultChromiumPath;
if (!existsSync(resolvedChromiumPath) && process.platform === "darwin") {
  console.error(`Chromium not found at ${resolvedChromiumPath}. Run:\n  brew install chromium\n  xattr -cr /Applications/Chromium.app`);
  process.exit(1);
}
const browser = await chromium.launch({
  executablePath: resolvedChromiumPath,
  args: ["--allow-file-access-from-files"],
});

// The cover is authored as a print-ready PDF. Vector PDF covers proved
// fragile: both pdf-lib merge strategies produced files whose transparency
// masks and gradients render incorrectly in Quartz viewers (macOS Preview).
// So the cover is rasterized at print resolution (300dpi) with pdf.js and
// printed as page one of the book itself: a flat image renders identically
// in every viewer, and no PDF post-processing is needed at all.
async function rasterizeCover(coverPdfPath) {
  const stagePath = join(workDir, "cover-stage.html");
  writeFileSync(stagePath, "<!doctype html><title>cover</title>");
  const page = await browser.newPage();
  await page.goto(pathToFileURL(stagePath).href);
  const dataUrl = await page.evaluate(
    async ({ pdfjsUrl, workerUrl, pdfB64, targetWidth }) => {
      const pdfjs = await import(pdfjsUrl);
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const bytes = Uint8Array.from(atob(pdfB64), (c) => c.charCodeAt(0));
      const doc = await pdfjs.getDocument({ data: bytes }).promise;
      const first = await doc.getPage(1);
      const viewport = first.getViewport({ scale: targetWidth / first.getViewport({ scale: 1 }).width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await first.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      return canvas.toDataURL("image/png");
    },
    {
      pdfjsUrl: pathToFileURL(join(repoRoot, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href,
      workerUrl: pathToFileURL(join(repoRoot, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")).href,
      pdfB64: readFileSync(coverPdfPath).toString("base64"),
      targetWidth: PAGE_WIDTH_IN * 300,
    },
  );
  await page.close();
  return dataUrl;
}

// Reading and review copies leave the cover off: the art is not what is being
// read, and the interior's page count is what a printer quotes against.
// NO_COVER=1 npm run build-pdf
const includeCover = process.env.NO_COVER !== "1";
const coverPdfPath = join(repoRoot, "assets", "cover.pdf");
let coverContent = "&nbsp;";
if (!includeCover) {
  coverContent = "";
} else if (existsSync(coverPdfPath)) {
  coverContent = `<img src="${await rasterizeCover(coverPdfPath)}" alt="">`;
} else {
  console.warn("assets/cover.pdf not found; the cover page is blank");
}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${TITLE}</title>
<style>
@font-face { font-family: "Denim INK"; src: url("${fontUrl("DenimINK-Regular.ttf")}"); font-weight: normal; font-style: normal; }
@font-face { font-family: "Denim INK"; src: url("${fontUrl("DenimINK-RegularItalic.ttf")}"); font-weight: normal; font-style: italic; }
@font-face { font-family: "Denim INK"; src: url("${fontUrl("DenimINK-Bold.ttf")}"); font-weight: bold; font-style: normal; }
@font-face { font-family: "Denim INK"; src: url("${fontUrl("DenimINK-BoldItalic.ttf")}"); font-weight: bold; font-style: italic; }

/* Gelasio is metric-compatible with Georgia, which is what the figures were
   drawn against, and it is bundled so every machine sets the same widths.
   Static instances, not the variable build: Chromium's print-to-PDF
   silently drops a variable font and falls back. */
@font-face { font-family: "Gelasio"; src: url("${fontUrl("Gelasio-Regular.ttf")}"); font-weight: normal; font-style: normal; }
@font-face { font-family: "Gelasio"; src: url("${fontUrl("Gelasio-Italic.ttf")}"); font-weight: normal; font-style: italic; }
@font-face { font-family: "Gelasio"; src: url("${fontUrl("Gelasio-Bold.ttf")}"); font-weight: bold; font-style: normal; }
@font-face { font-family: "Gelasio"; src: url("${fontUrl("Gelasio-BoldItalic.ttf")}"); font-weight: bold; font-style: italic; }
@font-face { font-family: "DejaVu Sans Mono"; src: url("${fontUrl("DejaVuSansMono.ttf")}"); font-weight: normal; font-style: normal; }
@font-face { font-family: "DejaVu Sans Mono"; src: url("${fontUrl("DejaVuSansMono-Bold.ttf")}"); font-weight: bold; font-style: normal; }
@font-face { font-family: "DejaVu Sans Mono"; src: url("${fontUrl("DejaVuSansMono-Oblique.ttf")}"); font-weight: normal; font-style: italic; }
@font-face { font-family: "DejaVu Sans Mono"; src: url("${fontUrl("DejaVuSansMono-BoldOblique.ttf")}"); font-weight: bold; font-style: italic; }

@page {
  size: ${PAGE_WIDTH_IN}in ${PAGE_HEIGHT_IN}in;
  margin: ${TOP_MARGIN_IN}in ${SIDE_MARGIN_IN}in ${BOTTOM_MARGIN_IN}in ${SIDE_MARGIN_IN}in;
  @bottom-center { content: counter(page); font-family: Gelasio, Georgia, serif; font-size: 10pt; }
  /* The draft marker sits in the footer rather than the header: at this trim
     the measure fits two running heads, and a third box wraps both of them. */
  @bottom-left { content: "PRERELEASE DRAFT (${buildDate}) - NOT FOR DISTRIBUTION"; font-family: Gelasio, Georgia, serif; font-size: 8pt; letter-spacing: 0.02em; color: #999; }
  ${reviewerFooter}
  @top-left { content: "${TITLE}"; font-family: Gelasio, Georgia, serif; font-size: 9pt; font-style: italic; color: #444; }
  @top-right { content: string(chapter); font-family: Gelasio, Georgia, serif; font-size: 9pt; font-style: italic; color: #444; }
}
@page :first { @bottom-center { content: none; } @bottom-left { content: none; }${suppressReviewerFooter} @top-left { content: none; } @top-right { content: none; } }
/* Pages inserted to push a part title onto a right-hand page carry nothing. */
@page :blank { @bottom-center { content: none; } @bottom-left { content: none; }${suppressReviewerFooter} @top-left { content: none; } @top-right { content: none; } }
@page chapter-start { @top-left { content: none; } @top-right { content: none; } }
/* A part title page carries no running head: the chapter it interrupts is over
   and the one it announces has not started. */
@page part-start { @top-left { content: none; } @top-right { content: none; } }
@page cover { margin: 0; @bottom-center { content: none; } @bottom-left { content: none; }${suppressReviewerFooter} @top-left { content: none; } @top-right { content: none; } }
.cover { page: cover; break-after: page; }
/* The cover art is drawn a point past the trim, so that rounding in Chromium's
   paint of the image cannot leave a white hairline along an edge; the crop
   after printing establishes where the edge actually falls. The sheet paged.js
   clips the art to is widened to match, because Chromium rounds that clip's
   right edge down by a fraction of a point and reinstates the hairline there.
   Only the width is widened: a taller sheet spills the art past the bottom of
   the cover and onto the top of the title page. */
.cover img { display: block; width: calc(${PAGE_WIDTH_IN}in + 1pt); height: calc(${PAGE_HEIGHT_IN}in + 1pt); }
.pagedjs_cover_page .pagedjs_sheet { width: calc(${PAGE_WIDTH_IN}in + 1pt); }

html { font-size: 11pt; }
body {
  font-family: Gelasio, Georgia, "Times New Roman", serif;
  line-height: 1.38;
  color: #111;
  text-rendering: optimizeLegibility;
  hyphens: auto;
}
p { margin: 0 0 0.6em 0; text-align: justify; }
a { color: #111 !important; text-decoration: none; }

.title-page { page: chapter-start; text-align: center; break-after: page; }
.title-page h1 { font-size: 26pt; margin-top: 3.2in; line-height: 1.2; border: none; }
.title-page .author { margin-top: 0.6in; font-size: 13pt; }
.title-page .note { margin-top: 2.2in; font-size: 9pt; color: #555; }

.book-toc { page: chapter-start; break-after: page; }
.book-toc h1 { font-size: 17pt; }
.book-toc ol { list-style: none; padding: 0; }
.book-toc li { font-size: 10.5pt; }
.book-toc li a { display: flex; align-items: baseline; }
/* "Chapter 20" sets the width: at 5.4em the two-digit labels wrapped, so the
   number printed on a line of its own under the word. Never wrap a label, and
   let one wider than the column push its own title rather than folding. */
.book-toc .label { flex: 0 0 auto; min-width: 6.4em; white-space: nowrap; }
.book-toc .t { flex: 1; padding-right: 1em; }
.book-toc .pg { flex: 0 0 auto; }
.book-toc li.toc-chapter { margin: 0.55em 0 0.1em 0; font-weight: bold; }
.book-toc li.toc-section { margin: 0.08em 0 0.08em 1.6em; }
.book-toc li.toc-part {
  display: flex;
  align-items: baseline;
  margin: 1.5em 0 0.35em 0;
  font-size: 11.5pt;
  font-weight: bold;
  letter-spacing: 0.02em;
  padding-bottom: 0.18em;
  border-bottom: 0.5pt solid #999;
}

/* A part opens on a right-hand page, its title alone in the upper third, and
   the reverse of that page is left blank so the first chapter of the part
   opens on a right-hand page as well. */
section.part-divider { break-before: recto; page: part-start; text-align: center; }
section.part-divider .part-label {
  margin: 2.6in 0 0.3in 0;
  font-size: 11pt;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #555;
}
section.part-divider h1 {
  font-size: 22pt;
  line-height: 1.25;
  border: none;
  margin: 0;
  padding: 0;
}

section.chapter { break-before: page; }
/* Every chapter opens on a right-hand page, which is how a reader flipping
   through finds where one ends and the next starts. Paged.js fills the verso
   it skips with a blank page, so this costs pages: roughly one for every two
   chapters. Front-matter placeholders are exempt, because they share one flow
   until they have real content. Paged.js resolves break rules in source order
   rather than by specificity, so this has to come after the rule it overrides. */
section.chapter:not(.prelude-item) { break-before: recto; }
/* Paged.js keeps the running headers on the pages it inserts; @page :blank is
   the standard suppression, and this is the belt-and-braces version of it. */
.pagedjs_blank_page .pagedjs_margin-content { display: none; }
/* Front-matter placeholder pages share one flow until they have real content. */
section.prelude-item + section.prelude-item { break-before: auto; }
section.prelude-item h1 { font-size: 12pt; border-bottom: none; margin: 0.18in 0 0.08in 0; padding-bottom: 0; }
section.prelude-item .cols { column-count: 1; }
section.chapter .cols { column-count: 1; }
section.chapter h1 {
  string-set: chapter content(text);
  font-size: 17pt;
  line-height: 1.25;
  margin: 0.15in 0 0.28in 0;
  padding-bottom: 0.1in;
  border-bottom: 0.5pt solid #999;
}
h2 { font-size: 13pt; margin: 1.1em 0 0.45em 0; }
h3 { font-size: 11pt; margin: 0.9em 0 0.3em 0; font-style: italic; }
h1, h2, h3 { break-after: avoid; text-align: left; hyphens: none; font-family: "Denim INK", Helvetica, Arial, sans-serif; font-weight: normal; }

code { font-family: "DejaVu Sans Mono", "SF Mono", Menlo, Consolas, monospace; font-size: 0.82em; }
/* An address sets in italic, which is what technical publishing does with one:
   it is O'Reilly's house style and No Starch's, and a reader needs no machine
   face to tell them an address is copied exactly. The monospace face stays
   with program_id, where it distinguishes code from the prose around it; an
   address is not code. Never underlined: underlining is a screen convention,
   and in a serif face it collides with the descenders. No size of its own
   either, because the italic is doing the work the smaller mono size was there
   to compensate for. Hyphenation is off: body text hyphenates, and a soft
   hyphen dropped into an address is a character the reader would retype. */
.url { font-style: italic; hyphens: none; }
pre { font-size: 0.82em; background: #f4f4f2; padding: 0.5em 0.7em; overflow-x: hidden; white-space: pre-wrap; }
blockquote { margin: 0.55em 0; padding: 0.4em 0.6em; background: #f4f4f2; border-left: 2.5pt solid #888; font-size: 0.95em; break-inside: avoid; }
blockquote p { text-align: left; }
ul, ol { margin: 0.3em 0 0.6em 0; padding-left: 1.4em; }
li { margin: 0.18em 0; }
table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.9em 0;
  font-size: 0.9em;
  break-inside: avoid;
}
th, td {
  border: 0.5pt solid #999;
  padding: 0.35em 0.55em;
  text-align: left;
  vertical-align: top;
}
th { background: #ececea; font-weight: bold; border-bottom: 1pt solid #666; }
table p { margin: 0; text-align: left; }
figure { margin: 1em auto; break-inside: avoid; text-align: center; max-width: ${TEXT_WIDTH_IN}in; }
figure svg { width: 100%; height: auto; }
figcaption { font-size: 9.5pt; font-style: italic; color: #444; text-align: left; margin-top: 0.3em; }
/* Footnotes. A note is an aside a reader can take or leave, so it is set at
   the foot of the page its call sits on, under a short rule and two points
   smaller than the text: small enough that the eye passes over it while
   reading the measure, large enough to read when the eye goes looking. Paged.js
   moves the span out of the flow and into the page's footnote area. Numbering
   runs from 1 through the whole book rather than restarting each chapter. */
.footnote {
  float: footnote;
  font-size: 9pt;
  line-height: 1.3;
  /* The measure a note is set to is short and its text is small, so justifying
     it would open rivers of white space between the words. */
  text-align: left;
  hyphens: none;
  margin-bottom: 0.2em;
}
/* The rule above the notes is painted as a background rather than drawn as a
   border, so it can be a third of the measure rather than all of it. The
   footnote module sizes the area from this element's margins, padding and
   borders; a background costs no height, and anything the module cannot
   measure gets clipped off the bottom of the page. */
.pagedjs_footnote_content {
  margin-top: 0.16in;
  padding-top: 0.1in;
  background-image: linear-gradient(#999, #999);
  background-size: 1.2in 0.5pt;
  background-repeat: no-repeat;
  background-position: left top;
}
/* The call is the superscript number in the text, the marker is the number in
   front of the note itself. Paged.js will set the call with
   font-variant-position where the browser claims to support it, which leaves
   the number full size in a face with no superscript figures, so the size and
   the raise are set here instead. */
::footnote-call {
  content: counter(footnote);
  font-variant-position: normal;
  vertical-align: super;
  font-size: 0.62em;
  line-height: 0;
}
::footnote-marker {
  content: counter(footnote-marker) ". ";
}
/* The end mark (see withEndMark): a square a little over cap height, on the baseline,
   a word space after the chapter's last word. It inherits the text's ink. */
svg.end-mark { width: 0.8em; height: 0.8em; vertical-align: baseline; margin-left: 0.1em; }
.end-mark-hold { white-space: nowrap; }
.end-mark-line { text-align: right; margin-top: 0.4em; }
.figure-placeholder {
  border: 0.75pt dashed #888;
  padding: 0.45em 0.6em;
  margin: 0.6em 0;
  font-style: italic;
  font-size: 0.9em;
  color: #444;
  text-align: left;
  break-inside: avoid;
}
</style>
</head>
<body>
${includeCover ? `<div class="cover">${coverContent}</div>` : ""}
<div class="title-page">
  <h1>${TITLE}</h1>
  <div class="author">${AUTHOR}</div>
  <div class="note">${advanceNote}</div>
</div>
<nav class="book-toc">
  <h1>Contents</h1>
  <ol>${printedToc}</ol>
</nav>
${body}
<script>window.PagedConfig = { auto: false };</script>
<script>${pagedPolyfill}</script>
<script>
// Pagination must not start until the embedded fonts have loaded: text
// measured against fallback fonts paginates differently, which made page
// counts vary from build to build.
document.fonts.ready
  .then(() => window.PagedPolyfill.preview())
  .then(() => { window.__pagedRendered = true; });
</script>
</body>
</html>`;

const htmlPath = join(workDir, "book.html");
writeFileSync(htmlPath, html);

const page = await browser.newPage();
page.on("pageerror", (error) => console.error("page error:", error.message));
await page.goto(pathToFileURL(htmlPath).href);
// Paged.js re-lays-out the document into pages; wait for it to finish.
await page.waitForFunction(() => window.__pagedRendered === true, { timeout: 180000 });

// Fill the printed table of contents with real page numbers, read from the
// laid-out pages.
await page.evaluate(() => {
  for (const link of document.querySelectorAll(".book-toc a")) {
    const target = document.getElementById(link.getAttribute("href").slice(1));
    const pageEl = target?.closest(".pagedjs_page");
    const pg = link.querySelector(".pg");
    if (pageEl && pg) pg.textContent = pageEl.getAttribute("data-page-number");
  }
});

// An address may break across lines; where it points may not. A wrapped link
// is printed as an annotation per line, and the whole href belongs on every
// one of them, so that a reader clicking the second line of an address arrives
// where a reader clicking the first line arrives. Count the lines here, while
// the layout still exists; the annotations the print actually produced are
// checked against the count below.
//
// A break opportunity splits the text into several boxes on one line, so the
// lines are the distinct tops among those boxes, not the boxes themselves.
// Paged.js also leaves the source content in the document, unrendered, beside
// the pages it laid out: those copies have no boxes at all and were not
// printed, so they are not lines either.
const linkLines = await page.evaluate(() => {
  const counts = {};
  for (const link of document.querySelectorAll('a[href^="http"]')) {
    const tops = new Set([...link.getClientRects()].map((rect) => Math.round(rect.top)));
    if (tops.size === 0) continue;
    counts[link.href] = (counts[link.href] ?? 0) + tops.size;
  }
  return counts;
});

// Page one of the PDF is page one of the flow, so odd page numbers are
// right-hand pages whether or not the cover is included. A part title belongs
// on one, and so does every chapter.
// The recto break rules re-resolve either way, so dropping the cover shifts
// where paged.js inserts its blanks rather than putting parts on the wrong side. A section that runs over several pages
// appears once per page it occupies, so keep the lowest number for each: that
// is the page it opens on.
const openingPages = await page.evaluate(() => {
  const opening = new Map();
  for (const section of document.querySelectorAll("section.part-divider, section.chapter:not(.prelude-item)")) {
    const number = Number(section.closest(".pagedjs_page")?.getAttribute("data-page-number"));
    const key = section.dataset.ref ?? section.id;
    const name = section.classList.contains("part-divider")
      ? `part title: ${section.querySelector("h1")?.textContent ?? "?"}`
      : `chapter: ${section.querySelector("h1")?.textContent ?? "?"}`;
    const seen = opening.get(key);
    if (!seen || number < seen.number) opening.set(key, { name, number });
  }
  return [...opening.values()].sort((a, b) => a.number - b.number);
});

const printed = await page.pdf({ preferCSSPageSize: true });
await browser.close();

// Chromium's print pipeline rounds the sheet up to the next 1/300in dot, so a
// 7.44 x 9.69in page comes out 0.24pt wider and taller than asked for, whatever
// units the size is written in and whether it comes from the CSS or from pdf()'s
// own width and height. It anchors the content at the top left, so the slack
// lands on the right and at the bottom, where it shows on the cover as a white
// band down two edges of the art. Cropping every page back to the trim removes
// it and makes the file's page size the one PRINT-SPECIFICATION.md documents.
const pdf = await PDFDocument.load(printed);
const trimWidth = PAGE_WIDTH_IN * 72;
const trimHeight = PAGE_HEIGHT_IN * 72;
let croppedPages = 0;
for (const sheet of pdf.getPages()) {
  const { width, height } = sheet.getSize();
  if (width < trimWidth - 0.001 || height < trimHeight - 0.001) {
    console.error(`Sheet is ${width.toFixed(2)} x ${height.toFixed(2)}pt, smaller than the ${trimWidth.toFixed(2)} x ${trimHeight.toFixed(2)}pt trim; not cropping.`);
    process.exit(1);
  }
  if (width - trimWidth < 0.001 && height - trimHeight < 0.001) continue;
  // Keep the top-left corner: PDF y counts up from the bottom, so the origin
  // moves up by whatever slack was added below the content.
  sheet.setMediaBox(0, height - trimHeight, trimWidth, trimHeight);
  sheet.setCropBox(0, height - trimHeight, trimWidth, trimHeight);
  croppedPages++;
}
writeFileSync(outputPath, await pdf.save());

const pageCount = pdf.getPageCount();
console.log(`Wrote ${outputPath} (${pageCount} pages)`);
if (croppedPages > 0) console.log(`Cropped ${croppedPages} page(s) to the ${PAGE_WIDTH_IN} x ${PAGE_HEIGHT_IN}in trim.`);

// Every URI action in the finished PDF, with the number of annotations
// carrying it. A viewer follows these, not the printed characters.
const printedDestinations = new Map();
for (const pdfPage of (await PDFDocument.load(readFileSync(outputPath))).getPages()) {
  const annotations = pdfPage.node.get(PDFName.of("Annots"));
  if (!annotations) continue;
  for (const entry of pdfPage.node.context.lookup(annotations, PDFArray).asArray()) {
    const action = pdfPage.node.context.lookup(entry).get(PDFName.of("A"));
    const uri = action && pdfPage.node.context.lookup(action).get(PDFName.of("URI"));
    if (!uri) continue; // an internal cross-reference, which names a page rather than an address
    const destination = uri.decodeText();
    printedDestinations.set(destination, (printedDestinations.get(destination) ?? 0) + 1);
  }
}

// A destination the book does not contain is a destination something split:
// the address broke over two lines and one of the pieces was written as if it
// were the whole thing.
const splitDestinations = [...printedDestinations.keys()].filter((destination) => !(destination in linkLines));
if (splitDestinations.length > 0) {
  console.error(`\n${splitDestinations.length} link(s) point somewhere the book does not:`);
  for (const destination of splitDestinations) console.error(`  ${destination}`);
  process.exitCode = 1;
}

// And a line box with no annotation on it is a line of an address that is not
// clickable at all, which sends a reader to whatever their viewer makes of the
// characters it can see.
const unlinkedLines = Object.entries(linkLines)
  .map(([href, lines]) => ({ href, lines, annotations: printedDestinations.get(href) ?? 0 }))
  .filter(({ lines, annotations }) => annotations < lines);
if (unlinkedLines.length > 0) {
  console.error(`\n${unlinkedLines.length} link(s) are not clickable on every line they occupy:`);
  for (const { href, lines, annotations } of unlinkedLines) {
    console.error(`  ${href}: ${lines} line(s), ${annotations} annotation(s)`);
  }
  process.exitCode = 1;
}

const strays = openingPages.filter(({ number }) => !Number.isInteger(number) || number % 2 === 0);
if (strays.length > 0) {
  console.error(`\n${strays.length} opening page(s) did not land on a right-hand page:`);
  for (const { name, number } of strays) console.error(`  page ${number}: ${name}`);
  process.exitCode = 1;
} else {
  // Printed rather than kept silent, because a selector that stops matching
  // would otherwise turn this check into a no-op that still reports success.
  console.log(`${openingPages.length} part and chapter openings, all on right-hand pages.`);
}
