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

import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";
import { chromium } from "playwright-core";
import { PDFDocument } from "pdf-lib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const TITLE = "Building Financial Software on Solana";
const AUTHOR = "Mike MacCana";

const outputPath = resolve(process.argv[2] ?? join(repoRoot, "build", `${TITLE}.pdf`));

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
const sections = chapterPaths.map((path) => {
  const markdown = readFileSync(join(repoRoot, path), "utf8");
  const id = idForPath(path);
  const subsections = [...markdown.matchAll(/^## (.+)$/gm)].map((match, index) => ({
    id: `${id}-s${index + 1}`,
    title: cleanTitle(match[1]),
  }));
  let htmlSubIndex = 0;
  const html = marked
    .parse(prepareMarkdown(markdown), { mangle: false, headerIds: false })
    .replace(/<h2>/g, () => `<h2 id="${id}-s${++htmlSubIndex}">`)
    // Inline SVG figures so the single-file HTML needs no external assets;
    // the image's alt text becomes the printed caption.
    .replace(/<img src="([^"]+\.svg)" alt="([^"]*)"[^>]*>/g, (whole, src, alt) => {
      const svg = readFileSync(join(repoRoot, dirname(path), src), "utf8");
      return `<figure>${svg}<figcaption>${alt}</figcaption></figure>`;
    });
  const title = cleanTitle((markdown.match(/^# (.+)$/m) ?? [null, basename(path, ".md")])[1]);
  return { id, title, html, path, subsections };
});

const isPreludeItem = (path) => path.startsWith("prelude/") && !path.endsWith("introduction.md");

// The printed table of contents, in the style of TCP/IP Illustrated:
// "Chapter N  Title" rows in bold, "N.M  Section" rows beneath, page numbers
// right-aligned and filled in after Paged.js lays the pages out.
const tocEntries = [];
let chapterNumber = 0;
let appendixNumber = 0;
for (const section of sections) {
  if (isPreludeItem(section.path)) continue;
  const isAppendix = section.path.startsWith("appendices/");
  const label = isAppendix
    ? `Appendix ${String.fromCharCode(65 + appendixNumber++)}`
    : `Chapter ${++chapterNumber}`;
  const shortLabel = isAppendix ? String.fromCharCode(64 + appendixNumber) : String(chapterNumber);
  tocEntries.push(`<li class="toc-chapter"><a href="#${section.id}"><span class="label">${label}</span><span class="t">${section.title}</span><span class="pg"></span></a></li>`);
  for (const [index, subsection] of section.subsections.entries()) {
    tocEntries.push(`<li class="toc-section"><a href="#${subsection.id}"><span class="label">${shortLabel}.${index + 1}</span><span class="t">${subsection.title}</span><span class="pg"></span></a></li>`);
  }
}
const printedToc = tocEntries.join("\n");

const body = sections
  .map((section) => {
    const html = section.html.replace("</h1>", "</h1><div class=\"cols\">") + "</div>";
    const classes = isPreludeItem(section.path) ? "chapter prelude-item" : "chapter";
    return `<section class="${classes}" id="${section.id}">\n${html}\n</section>`;
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
      targetWidth: 8.5 * 300,
    },
  );
  await page.close();
  return dataUrl;
}

const coverPdfPath = join(repoRoot, "assets", "cover.pdf");
let coverContent = "&nbsp;";
if (existsSync(coverPdfPath)) {
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
  size: 8.5in 11in;
  margin: 0.9in 1.1in 0.95in 1.1in;
  @bottom-center { content: counter(page); font-family: Georgia, serif; font-size: 10pt; }
  @top-left { content: "${TITLE}"; font-family: Georgia, serif; font-size: 9.5pt; font-style: italic; color: #444; }
  @top-center { content: "PRERELEASE DRAFT"; font-family: Georgia, serif; font-size: 9.5pt; letter-spacing: 0.08em; color: #999; }
  @top-right { content: string(chapter); font-family: Georgia, serif; font-size: 9.5pt; font-style: italic; color: #444; }
}
@page :first { @bottom-center { content: none; } @top-left { content: none; } @top-center { content: none; } @top-right { content: none; } }
@page chapter-start { @top-left { content: none; } @top-right { content: none; } }
@page cover { margin: 0; @bottom-center { content: none; } @top-left { content: none; } @top-center { content: none; } @top-right { content: none; } }
.cover { page: cover; break-after: page; }
.cover img { display: block; width: 8.5in; height: 11in; }

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

section.chapter { break-before: page; }
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
pre { font-size: 0.82em; background: #f4f4f2; padding: 0.5em 0.7em; overflow-x: hidden; white-space: pre-wrap; }
blockquote { margin: 0.55em 0; padding: 0.4em 0.6em; background: #f4f4f2; border-left: 2.5pt solid #888; font-size: 0.95em; break-inside: avoid; }
blockquote p { text-align: left; }
ul, ol { margin: 0.3em 0 0.6em 0; padding-left: 1.4em; }
li { margin: 0.18em 0; }
figure { margin: 1em auto; break-inside: avoid; text-align: center; max-width: 4.9in; }
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
<div class="cover">${coverContent}</div>
<div class="title-page">
  <h1>${TITLE}</h1>
  <div class="author">${AUTHOR}</div>
  <div class="note">Manuscript draft. Figures are placeholders awaiting the visual pass.</div>
</div>
<nav class="book-toc">
  <h1>Contents</h1>
  <ol>${printedToc}</ol>
</nav>
${body}
<script>${pagedPolyfill}</script>
</body>
</html>`;

const htmlPath = join(workDir, "book.html");
writeFileSync(htmlPath, html);

const page = await browser.newPage();
page.on("pageerror", (error) => console.error("page error:", error.message));
await page.goto(pathToFileURL(htmlPath).href);
// Paged.js re-lays-out the document into pages; wait for it to finish.
await page.waitForSelector(".pagedjs_pages", { timeout: 120000 });
await page.waitForFunction(() => window.PagedPolyfill !== undefined, { timeout: 120000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(2000);

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

writeFileSync(outputPath, await page.pdf({ preferCSSPageSize: true }));
await browser.close();

const pageCount = (await PDFDocument.load(readFileSync(outputPath))).getPageCount();
console.log(`Wrote ${outputPath} (${pageCount} pages)`);
