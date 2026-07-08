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

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";
import { chromium } from "playwright-core";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(process.argv[2] ?? join(repoRoot, "build", "building-financial-software-on-solana.pdf"));

const TITLE = "Building Financial Software on Solana";
const AUTHOR = "Mike MacCana";

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

const sections = chapterPaths.map((path) => {
  const markdown = readFileSync(join(repoRoot, path), "utf8");
  const html = marked.parse(prepareMarkdown(markdown), { mangle: false, headerIds: false });
  const title = (markdown.match(/^# (.+)$/m) ?? [null, basename(path, ".md")])[1];
  return { id: idForPath(path), title, html, path };
});

// The printed table of contents: one line per chapter, page number filled in
// by Paged.js at layout time.
const printedToc = sections
  .filter((section) => !section.path.startsWith("prelude/") || section.path.endsWith("introduction.md"))
  .map((section) => `<li><a href="#${section.id}"><span class="t">${section.title}</span><span class="dots"></span><span class="pg"></span></a></li>`)
  .join("\n");

const body = sections
  .map((section) => {
    const html = section.html.replace("</h1>", "</h1><div class=\"cols\">") + "</div>";
    return `<section class="chapter" id="${section.id}">\n${html}\n</section>`;
  })
  .join("\n");

const pagedPolyfill = readFileSync(join(repoRoot, "node_modules", "pagedjs", "dist", "paged.polyfill.js"), "utf8");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${TITLE}</title>
<style>
@page {
  size: 8.5in 11in;
  margin: 0.6in 0.55in 0.7in 0.55in;
  @bottom-center { content: counter(page); font-family: Georgia, serif; font-size: 9pt; }
  @top-center { content: string(chapter); font-family: Georgia, serif; font-size: 8.5pt; font-style: italic; color: #444; }
}
@page :first { @bottom-center { content: none; } @top-center { content: none; } }
@page chapter-start { @top-center { content: none; } }

html { font-size: 9pt; }
body {
  font-family: Charter, "Bitstream Charter", Georgia, "Times New Roman", serif;
  line-height: 1.32;
  color: #111;
  text-rendering: optimizeLegibility;
  hyphens: auto;
}
p { margin: 0 0 0.45em 0; text-align: justify; }
a { color: #111 !important; text-decoration: none; }

.title-page { page: chapter-start; text-align: center; break-after: page; }
.title-page h1 { font-size: 26pt; margin-top: 3.2in; line-height: 1.2; border: none; }
.title-page .author { margin-top: 0.6in; font-size: 13pt; }
.title-page .note { margin-top: 2.2in; font-size: 9pt; color: #555; }

.book-toc { page: chapter-start; break-after: page; }
.book-toc h1 { font-size: 17pt; }
.book-toc ol { list-style: none; padding: 0; }
.book-toc li { margin: 0.4em 0; font-size: 9.5pt; }
.book-toc li a { display: flex; align-items: baseline; }
.book-toc .dots { flex: 1; border-bottom: 1pt dotted #999; margin: 0 0.35em; }

section.chapter { break-before: page; }
section.chapter .cols { column-count: 2; column-gap: 0.32in; column-fill: auto; }
section.chapter h1 {
  string-set: chapter content(text);
  font-size: 15pt;
  line-height: 1.25;
  margin: 0.1in 0 0.22in 0;
  padding-bottom: 0.09in;
  border-bottom: 0.5pt solid #999;
}
h2 { font-size: 10.5pt; margin: 0.9em 0 0.35em 0; }
h3 { font-size: 9pt; margin: 0.8em 0 0.25em 0; font-style: italic; font-weight: 600; }
h1, h2, h3 { break-after: avoid; text-align: left; hyphens: none; }

code { font-family: "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace; font-size: 0.82em; }
pre { font-size: 0.82em; background: #f4f4f2; padding: 0.5em 0.7em; overflow-x: hidden; white-space: pre-wrap; }
blockquote { margin: 0.55em 0; padding: 0.4em 0.6em; background: #f4f4f2; border-left: 2.5pt solid #888; font-size: 0.95em; break-inside: avoid; }
blockquote p { text-align: left; }
ul, ol { margin: 0.3em 0 0.6em 0; padding-left: 1.4em; }
li { margin: 0.18em 0; }
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

const workDir = mkdtempSync(join(tmpdir(), "solana-book-pdf-"));
const htmlPath = join(workDir, "book.html");
writeFileSync(htmlPath, html);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
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

const pageCount = await (async () => {
  const bytes = readFileSync(outputPath);
  const matches = bytes.toString("latin1").match(/\/Type[\s]*\/Page[^s]/g);
  return matches ? matches.length : "?";
})();
console.log(`Wrote ${outputPath} (${pageCount} pages)`);
