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
import { join, dirname, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";
import { chromium } from "playwright-core";
import { PDFDocument } from "pdf-lib";

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

// Usage: npm run build-pdf -- [--size print|letter] [output.pdf]
const argv = process.argv.slice(2);
let sizeName = "print";
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  const inline = arg.startsWith("--size=") ? arg.slice("--size=".length) : null;
  if (inline !== null) sizeName = inline;
  else if (arg === "--size") sizeName = argv[++i];
  else positional.push(arg);
}
if (!Object.hasOwn(PAGE_SIZES, sizeName)) {
  console.error(`Unknown --size ${JSON.stringify(sizeName)}; expected one of: ${Object.keys(PAGE_SIZES).join(", ")}`);
  process.exit(1);
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

// Advance review copies are stamped per reviewer: REVIEWER_NAME=... npm run build-pdf
const reviewerName = process.env.REVIEWER_NAME ?? "";
const buildDate = new Date().toISOString().slice(0, 10);
const advanceNote = reviewerName
  ? `Advance review copy for ${reviewerName}. Please don't redistribute. Built ${buildDate}.`
  : `Prerelease draft, built ${buildDate}.`;

// Chapter order comes from the reader-facing table of contents: every
// relative .md link, in document order.
const toc = readFileSync(join(repoRoot, "TABLE-OF-CONTENTS.md"), "utf8");
const chapterPaths = [...toc.matchAll(/\]\(((?!https?:)[^)#]+\.md)\)/g)]
  .map((match) => match[1])
  .filter((path, index, all) => all.indexOf(path) === index);

const idForPath = (path) => "ch-" + path.replace(/\.md$/, "").replace(/[^a-z0-9]+/gi, "-");

// Rewrite intra-book links to in-document anchors, and mark FIGURE
// placeholders so the stylesheet can box them.
function prepareMarkdown(markdown) {
  return markdown
    .replace(/\*\*\[FIGURE: ([^\]]+)\]\*\*/g, '<div class="figure-placeholder">FIGURE: $1</div>')
    .replace(/\]\(((?:\.\.\/)?(?!https?:)[^)#]+\.md)(#[^)]*)?\)/g, (whole, path) => "](#" + idForPath(path.replace(/^\.\.\//, "")) + ")");
}

const cleanTitle = (raw) => raw.replace(/[*_`]/g, "");

// Parts come from "## Part N: Title" headings in the table of contents, and a
// chapter belongs to the part heading above it. Any other H2 (Prelude, the
// Introduction, Appendices) closes the current part, so those chapters sit
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
const bareAddress = (href) => href.replace(/^https?:\/\//, "").replace(/\/$/, "");
const markUrls = (html) =>
  html.replace(/<a href="(https?:[^"]+)">([^<]+)<\/a>/g, (whole, href, text) =>
    bareAddress(href) === text.replace(/\/$/, "")
      ? `<a class="url" href="${href}">${breakableUrl(text)}</a>`
      // The separating space lives inside the span rather than between the two
      // elements: Paged.js drops a whitespace-only text node during layout, and
      // the address ends up jammed against the word before it.
      : `${whole}<span class="url"> (${breakableUrl(bareAddress(href))})</span>`,
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
    .parse(prepareMarkdown(markdown), { mangle: false, headerIds: false })
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


// The printed table of contents, in the style of TCP/IP Illustrated:
// "Chapter N  Title" rows in bold, "N.M  Section" rows beneath, page numbers
// right-aligned and filled in after Paged.js lays the pages out.
const tocEntries = [];
let chapterNumber = 0;
let appendixNumber = 0;
let tocPart = null;
for (const section of sections) {
  if (isPreludeItem(section.path)) continue;
  const part = partForPath.get(section.path) ?? null;
  if (part && part !== tocPart) {
    tocEntries.push(`<li class="toc-part"><span class="label">${part.label}</span><span class="t">${part.title}</span></li>`);
  }
  tocPart = part;
  const isAppendix = section.path.startsWith("appendices/");
  const label = isAppendix
    ? `Appendix ${String.fromCharCode(65 + appendixNumber++)}`
    : `Chapter ${++chapterNumber}`;
  const shortLabel = isAppendix ? String.fromCharCode(64 + appendixNumber) : String(chapterNumber);
  // The row already prints its own "Chapter N" label, and every chapter's H1
  // carries that prefix too (it is what the running header and the chapter
  // opening page print), so drop it here to avoid "Chapter 2  Chapter 2: ...".
  const tocTitle = section.title.replace(/^(?:Chapter \d+|Appendix [A-Z]):\s*/, "");
  tocEntries.push(`<li class="toc-chapter"><a href="#${section.id}"><span class="label">${label}</span><span class="t">${tocTitle}</span><span class="pg"></span></a></li>`);
  for (const [index, subsection] of section.subsections.entries()) {
    tocEntries.push(`<li class="toc-section"><a href="#${subsection.id}"><span class="label">${shortLabel}.${index + 1}</span><span class="t">${subsection.title}</span><span class="pg"></span></a></li>`);
  }
}
const printedToc = tocEntries.join("\n");

let bodyPart = null;
const body = sections
  .map((section) => {
    const html = section.html.replace("</h1>", "</h1><div class=\"cols\">") + "</div>";
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
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
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

@page {
  size: ${PAGE_WIDTH_IN}in ${PAGE_HEIGHT_IN}in;
  margin: ${TOP_MARGIN_IN}in ${SIDE_MARGIN_IN}in ${BOTTOM_MARGIN_IN}in ${SIDE_MARGIN_IN}in;
  @bottom-center { content: counter(page); font-family: Georgia, serif; font-size: 10pt; }
  /* The draft marker sits in the footer rather than the header: at this trim
     the measure fits two running heads, and a third box wraps both of them. */
  @bottom-left { content: "PRERELEASE DRAFT"; font-family: Georgia, serif; font-size: 8pt; letter-spacing: 0.08em; color: #999; }
  @top-left { content: "${TITLE}"; font-family: Georgia, serif; font-size: 9pt; font-style: italic; color: #444; }
  @top-right { content: string(chapter); font-family: Georgia, serif; font-size: 9pt; font-style: italic; color: #444; }
}
@page :first { @bottom-center { content: none; } @bottom-left { content: none; } @top-left { content: none; } @top-right { content: none; } }
/* Pages inserted to push a part title onto a right-hand page carry nothing. */
@page :blank { @bottom-center { content: none; } @bottom-left { content: none; } @top-left { content: none; } @top-right { content: none; } }
@page chapter-start { @top-left { content: none; } @top-right { content: none; } }
/* A part title page carries no running head: the chapter it interrupts is over
   and the one it announces has not started. */
@page part-start { @top-left { content: none; } @top-right { content: none; } }
@page cover { margin: 0; @bottom-center { content: none; } @bottom-left { content: none; } @top-left { content: none; } @top-right { content: none; } }
.cover { page: cover; break-after: page; }
.cover img { display: block; width: ${PAGE_WIDTH_IN}in; height: ${PAGE_HEIGHT_IN}in; }

html { font-size: 11pt; }
body {
  font-family: Charter, "Bitstream Charter", Georgia, "Times New Roman", serif;
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
.book-toc .label { flex: 0 0 5.4em; }
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
/* Paged.js resolves break rules in source order rather than by specificity,
   so the part opener's recto rule has to come after the plain chapter rule. */
section.chapter.part-opening { break-before: recto; }
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

code { font-family: "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace; font-size: 0.82em; }
/* An address printed as itself is a literal string the reader types, so it is
   set in the same face and size as program_id, and a URL and an identifier sit
   identically on the line. Never underlined: underlining is a screen
   convention, and in a serif face it collides with the descenders. */
.url { font-family: "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace; font-size: 0.82em; }
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

// Page one of the PDF is page one of the flow, so odd page numbers are
// right-hand pages whether or not the cover is included. A part title belongs
// on one, and so does the chapter that follows it across the blank reverse.
// The recto break rules re-resolve either way, so dropping the cover shifts
// where paged.js inserts its blanks rather than putting parts on the wrong side. A section that runs over several pages
// appears once per page it occupies, so keep the lowest number for each: that
// is the page it opens on.
const partPages = await page.evaluate(() => {
  const opening = new Map();
  for (const section of document.querySelectorAll("section.part-divider, section.chapter.part-opening")) {
    const number = Number(section.closest(".pagedjs_page")?.getAttribute("data-page-number"));
    const key = section.dataset.ref ?? section.id;
    const name = section.classList.contains("part-divider")
      ? `part title: ${section.querySelector("h1")?.textContent ?? "?"}`
      : `part opens with ${section.querySelector("h1")?.textContent ?? "?"}`;
    const seen = opening.get(key);
    if (!seen || number < seen.number) opening.set(key, { name, number });
  }
  return [...opening.values()].sort((a, b) => a.number - b.number);
});

writeFileSync(outputPath, await page.pdf({ preferCSSPageSize: true }));
await browser.close();

const pageCount = (await PDFDocument.load(readFileSync(outputPath))).getPageCount();
console.log(`Wrote ${outputPath} (${pageCount} pages)`);

for (const { name, number } of partPages) {
  const side = number % 2 === 1 ? "right" : "LEFT";
  console.log(`  page ${number} (${side}): ${name}`);
}
const strays = partPages.filter(({ number }) => !Number.isInteger(number) || number % 2 === 0);
if (strays.length > 0) {
  console.error(`\n${strays.length} part page(s) did not land on a right-hand page:`);
  for (const { name, number } of strays) console.error(`  page ${number}: ${name}`);
  process.exitCode = 1;
}
