// Rasterize pages of a built PDF to PNG, for eyeballing typography and figure
// placement: the page carrying a phrase, or every page of one chapter. Pages
// are found by content rather than number, so page-number drift between builds
// never previews the wrong page.
//
// Usage: npm run preview -- <name> "<phrase on the page>"
//        npm run preview -- <name> --chapter <chapter>
//        add --pdf <file> to read a build other than the digital edition
//
// <chapter> is part of a chapter's file name or title, e.g. "escrow". Its
// pages come from the page map the build writes beside each PDF, so they are
// the pages the chapter occupies in the book, broken exactly where the book
// breaks them. PNGs land in build/ as <name>-p<page>.png.
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { basename, join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(repoRoot, "build");

const USAGE = `Usage: npm run preview -- <name> "<phrase on the page>"
       npm run preview -- <name> --chapter <part of a chapter's file name or title>
  --pdf <file>   Read this build instead of the digital edition
                 (npm run build-pdf-digital).`;
const die = (message) => {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(1);
};

const argv = process.argv.slice(2).filter((arg) => arg !== "--");
let pdfPath = join(outDir, "Building Financial Software on Solana.pdf");
let chapterQuery = null;
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--help" || arg === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else if (arg === "--pdf" || arg === "--chapter") {
    if (i + 1 >= argv.length) die(`${arg} needs a value.`);
    if (arg === "--pdf") pdfPath = resolve(argv[++i]);
    else chapterQuery = argv[++i];
  } else if (arg.startsWith("-")) {
    die(`Unknown option ${JSON.stringify(arg)}.`);
  } else {
    positional.push(arg);
  }
}
const [outPrefix, phrase] = positional;
if (!outPrefix) die("Name the preview: it prefixes the PNG filenames.");
if (chapterQuery === null && !phrase) die("Give a phrase on the page, or --chapter.");
if (chapterQuery !== null && phrase) die("Give a phrase or --chapter, not both.");
if (positional.length > 2) die(`Unexpected argument ${JSON.stringify(positional[2])}.`);
if (!existsSync(pdfPath)) die(`No PDF at ${pdfPath}; build it first.`);

const pdfjsNode = await import("pdfjs-dist/legacy/build/pdf.mjs");
const pdfBytes = readFileSync(pdfPath);

let pageNumbers;
if (chapterQuery !== null) {
  const mapPath = pdfPath.replace(/\.pdf$/i, "") + ".pages.json";
  if (!existsSync(mapPath)) die(`No page map at ${mapPath}; rebuild the PDF to write one.`);
  const chapters = JSON.parse(readFileSync(mapPath, "utf8"));
  const query = chapterQuery.toLowerCase();
  // The file name rather than the whole path, since every chapter in a part
  // shares its folder: "amm" would otherwise match "programming".
  const fileName = (path) => basename(path, ".md").toLowerCase();
  const matches = chapters.filter(({ path, title }) => fileName(path).includes(query) || title.toLowerCase().includes(query));
  // A query that is one chapter's whole file name wins over others that merely
  // contain it, so "intro" picks intro.md beside introduction.md.
  const exact = matches.filter(({ path }) => fileName(path) === query);
  const list = (entries) => entries.map(({ path, title }) => `  ${path}  (${title})`).join("\n");
  const chosen = exact.length === 1 ? exact : matches;
  if (chosen.length === 0) die(`No chapter matches ${JSON.stringify(chapterQuery)}. Chapters:\n${list(chapters)}`);
  if (chosen.length > 1) die(`${JSON.stringify(chapterQuery)} matches ${chosen.length} chapters:\n${list(chosen)}`);
  const { first, last } = chosen[0];
  pageNumbers = Array.from({ length: last - first + 1 }, (_, index) => first + index);
} else {
  // Find the page carrying the phrase, so page-number drift between builds
  // never silently previews the wrong page.
  const doc = await pdfjsNode.getDocument({ data: new Uint8Array(pdfBytes), useSystemFonts: true }).promise;
  for (let p = 1; p <= doc.numPages && !pageNumbers; p++) {
    const text = (await (await doc.getPage(p)).getTextContent()).items.map((i) => i.str).join(" ");
    if (text.replace(/\s+/g, " ").includes(phrase)) pageNumbers = [p];
  }
  if (!pageNumbers) die(`Phrase not found in ${pdfPath}: ${phrase}`);
}

const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ??
    (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : "/opt/homebrew/bin/chromium"),
  args: ["--allow-file-access-from-files"],
});
const workDir = mkdtempSync(join(tmpdir(), "preview-"));
const stage = join(workDir, "stage.html");
writeFileSync(stage, "<!doctype html><title>preview</title>");
const page = await browser.newPage();
await page.goto(pathToFileURL(stage).href);

const dataUrls = await page.evaluate(
  async ({ pdfjsUrl, workerUrl, pdfB64, pageNumbers, targetWidth }) => {
    const pdfjs = await import(pdfjsUrl);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const bytes = Uint8Array.from(atob(pdfB64), (c) => c.charCodeAt(0));
    const d = await pdfjs.getDocument({ data: bytes }).promise;
    const urls = [];
    for (const pageNumber of pageNumbers) {
      const pg = await d.getPage(pageNumber);
      const viewport = pg.getViewport({ scale: targetWidth / pg.getViewport({ scale: 1 }).width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await pg.render({ canvasContext: ctx, viewport }).promise;
      urls.push(canvas.toDataURL("image/png"));
    }
    return urls;
  },
  {
    pdfjsUrl: pathToFileURL(join(repoRoot, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href,
    workerUrl: pathToFileURL(join(repoRoot, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")).href,
    pdfB64: pdfBytes.toString("base64"),
    pageNumbers,
    targetWidth: 1700,
  },
);

pageNumbers.forEach((pageNumber, index) => {
  const out = join(outDir, `${outPrefix}-p${pageNumber}.png`);
  writeFileSync(out, Buffer.from(dataUrls[index].split(",")[1], "base64"));
  console.log(out);
});
await browser.close();
