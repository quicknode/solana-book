#!/usr/bin/env node
// Cut the free preview offered on the book's website from the digital edition:
// every page before the Part I title page (the cover, the front matter, the
// contents and the Introduction), followed by one closing page inviting the
// reader to ask for the whole book.
//
// The pages are the digital edition's own, copied rather than rebuilt, so the
// preview breaks exactly where the book does. The closing page is printed by
// Chromium in the book's faces at the book's trim and appended.
//
// Usage: npm run build-pdf-website-preview   (builds the digital edition first)
//        node scripts/build-website-preview.mjs [--pdf <digital edition>] [output.pdf]

import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef } from "pdf-lib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TITLE = "Building Financial Software on Solana";

const USAGE = `Usage: npm run build-pdf-website-preview
       node scripts/build-website-preview.mjs [--pdf <digital edition>] [output.pdf]

  Reads the digital edition (npm run build-pdf-digital), keeps every page
  before the Part I title page, and appends a closing page. Writes
  "build/${TITLE} (website preview).pdf" unless an output path is given.

  --pdf <file>   Cut the preview from this build instead of the digital edition.
  --help         Print this and exit.`;

const die = (message) => {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(1);
};

const argv = process.argv.slice(2).filter((arg) => arg !== "--");
let sourcePath = join(repoRoot, "build", `${TITLE}.pdf`);
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--help" || arg === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else if (arg === "--pdf") {
    if (i + 1 >= argv.length) die("--pdf needs a value.");
    sourcePath = resolve(argv[++i]);
  } else if (arg.startsWith("-")) {
    die(`Unknown option ${JSON.stringify(arg)}.`);
  } else {
    positional.push(arg);
  }
}
if (positional.length > 1) die(`Expected one output path, got ${positional.length}: ${positional.join(", ")}`);
if (!existsSync(sourcePath)) die(`No PDF at ${sourcePath}; run npm run build-pdf-digital first.`);
const outputPath = resolve(positional[0] ?? join(repoRoot, "build", `${TITLE} (website preview).pdf`));
mkdirSync(dirname(outputPath), { recursive: true });

// The cut falls at the Part I title page. Its page comes from the page map the
// build writes beside the PDF: the title page is the first page after the last
// chapter outside the parts, found by its text, so a page-count change in the
// front matter or the Introduction moves the cut with it. The search starts at
// the Introduction's last page because the contents also print the part's
// title. The label is matched with its spaces taken out: it is set in spaced
// capitals, which pdf.js reads back as "P A R T   I".
const sourceBytes = readFileSync(sourcePath);
const mapPath = sourcePath.replace(/\.pdf$/i, "") + ".pages.json";
if (!existsSync(mapPath)) die(`No page map at ${mapPath}; rebuild the PDF to write one.`);
const chapters = JSON.parse(readFileSync(mapPath, "utf8"));
const introduction = chapters.find(({ path }) => path === "prelude/introduction.md");
if (!introduction) die(`The page map has no prelude/introduction.md, so the end of the preview cannot be found.`);

const pdfjs = await import(pathToFileURL(join(repoRoot, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href);
const loading = pdfjs.getDocument({ data: new Uint8Array(sourceBytes) });
const reader = await loading.promise;
let partPage = null;
for (let number = introduction.last + 1; number <= reader.numPages && partPage === null; number++) {
  const text = (await (await reader.getPage(number)).getTextContent()).items.map((item) => item.str ?? "").join("");
  if (/PARTI(?!I)/i.test(text.replace(/\s+/g, "")) && /The\s*Fundamentals/.test(text)) partPage = number;
}
await loading.destroy();
if (partPage === null) die(`No page after the Introduction (page ${introduction.last}) carries the Part I title.`);
const keptPages = partPage - 1;

// The closing page, at the trim the digital edition was printed at, centered
// both ways in the space the body text occupies, in the book's own faces: the
// heading in Denim INK like every heading in the book, the text in Gelasio.
const source = await PDFDocument.load(sourceBytes);
const { width: trimWidth, height: trimHeight } = source.getPage(0).getSize();
const fontUrl = (file) => pathToFileURL(join(repoRoot, "assets", "fonts", file)).href;
const closingHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Want to keep reading?</title>
<style>
@font-face { font-family: "Denim INK"; src: url("${fontUrl("DenimINK-Regular.ttf")}"); }
@font-face { font-family: "Gelasio"; src: url("${fontUrl("Gelasio-Regular.ttf")}"); font-style: normal; }
@font-face { font-family: "Gelasio"; src: url("${fontUrl("Gelasio-Italic.ttf")}"); font-style: italic; }
@page { size: ${trimWidth}pt ${trimHeight}pt; margin: 0; }
html, body { margin: 0; padding: 0; }
body {
  width: ${trimWidth}pt;
  height: ${trimHeight}pt;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Gelasio, Georgia, serif;
  color: #111;
  text-align: center;
}
main { width: 4.6in; }
.label {
  margin: 0 0 0.3in 0;
  font-size: 10pt;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #555;
}
h1 {
  font-family: "Denim INK", Helvetica, Arial, sans-serif;
  font-weight: normal;
  font-size: 28pt;
  line-height: 1.25;
  margin: 0;
}
hr { width: 1.2in; margin: 0.32in auto; border: none; border-top: 0.5pt solid #999; }
p { margin: 0 0 0.7em 0; font-size: 11.5pt; line-height: 1.5; hyphens: none; text-wrap: pretty; }
</style>
</head>
<body>
<main>
  <p class="label">End of preview</p>
  <h1>Want to keep reading?</h1>
  <hr>
  <p>You’ve reached the end of the preview!</p>
  <p>For a full copy of <i>${TITLE}</i>, please provide your email address and we will email it to you.</p>
</main>
</body>
</html>`;

const workDir = mkdtempSync(join(tmpdir(), "solana-book-preview-"));
const closingPath = join(workDir, "closing.html");
writeFileSync(closingPath, closingHtml);
const chromiumPath =
  process.env.CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : "/opt/homebrew/bin/chromium");
const browser = await chromium.launch({ executablePath: chromiumPath, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.goto(pathToFileURL(closingPath).href);
await page.evaluate(() => document.fonts.ready);
const closingBytes = await page.pdf({ preferCSSPageSize: true });
await browser.close();
const closing = await PDFDocument.load(closingBytes);
if (closing.getPageCount() !== 1) die(`The closing page printed as ${closing.getPageCount()} pages.`);

// The kept pages are copied into a new document rather than the rest being
// removed from the edition: pdf-lib saves every object a document holds,
// referenced or not, so a cut edition still carried the whole book's pages and
// was as large as it. Copying leaves the catalog's named destinations behind,
// so those pointing at a kept page are carried over to its copy, and the
// contents' links into the Introduction still work. A link to a page the
// preview leaves out would go nowhere, so it is dropped.
const preview = await PDFDocument.create();
const keptIndices = Array.from({ length: keptPages }, (_, index) => index);
const copies = await preview.copyPages(source, keptIndices);
const copyOf = new Map(keptIndices.map((index) => [source.getPage(index).ref.toString(), copies[index].ref]));
for (const copy of copies) preview.addPage(copy);

const nameOf = (name) => name.decodeText?.() ?? name.toString();
const liveDests = new Map();
const sourceDests = source.catalog.lookupMaybe(PDFName.of("Dests"), PDFDict);
for (const [name, value] of sourceDests?.entries() ?? []) {
  let target = source.context.lookup(value);
  if (target instanceof PDFDict) target = source.context.lookup(target.get(PDFName.of("D")));
  if (!(target instanceof PDFArray)) continue;
  const pageRef = target.get(0);
  if (!(pageRef instanceof PDFRef) || !copyOf.has(pageRef.toString())) continue;
  // The rest of a destination is a fit type and coordinates: names and
  // numbers, which belong to no document and copy as they are.
  liveDests.set(nameOf(name), [copyOf.get(pageRef.toString()), ...target.asArray().slice(1)]);
}
preview.catalog.set(
  PDFName.of("Dests"),
  preview.context.obj(Object.fromEntries([...liveDests].map(([name, dest]) => [name, preview.context.obj(dest)]))),
);

let droppedLinks = 0;
for (const sheet of preview.getPages()) {
  const annotations = sheet.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
  if (!annotations) continue;
  const kept = annotations.asArray().filter((entry) => {
    const dest = preview.context.lookup(entry).get(PDFName.of("Dest"));
    if (dest === undefined) return true; // an address, which works anywhere
    if (liveDests.has(nameOf(preview.context.lookup(dest)))) return true;
    droppedLinks++;
    return false;
  });
  sheet.node.set(PDFName.of("Annots"), preview.context.obj(kept));
}

const [closingPage] = await preview.copyPages(closing, [0]);
closingPage.setMediaBox(0, 0, trimWidth, trimHeight);
closingPage.setCropBox(0, 0, trimWidth, trimHeight);
preview.addPage(closingPage);
// The title a reader's viewer shows: "website" says where the file is offered,
// which is ours to know rather than theirs.
preview.setTitle(`${TITLE} (preview)`);
preview.setAuthor("Mike MacCana");
// A viewer's title bar shows the document title rather than the file name, as
// the edition's does.
preview.catalog.set(
  PDFName.of("ViewerPreferences"),
  preview.context.obj({ Type: "ViewerPreferences", DisplayDocTitle: true }),
);

writeFileSync(outputPath, await preview.save());
console.log(`Wrote "${outputPath}"`);
console.log(`${keptPages} page(s) of the book, up to the Part I title page on page ${partPage}, then the closing page.`);
if (droppedLinks > 0) console.log(`Unlinked ${droppedLinks} contents or cross-reference link(s) to pages the preview leaves out.`);
