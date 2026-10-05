// Rasterize a page of the digital edition (npm run build-pdf-digital) to PNG, for eyeballing typography and
// figure placement. Finds the page by a phrase on it, so page-number drift
// between builds never previews the wrong page.
// Usage: npm run preview -- <name> "<phrase on the page>"
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [outPrefix, phrase] = process.argv.slice(2);
const pdfPath = join(repoRoot, "build", "Building Financial Software on Solana.pdf");
const outDir = join(repoRoot, "build");

// Find the page carrying the phrase, so page-number drift between builds
// never silently previews the wrong page.
const pdfjsNode = await import("pdfjs-dist/legacy/build/pdf.mjs");
const doc = await pdfjsNode.getDocument({ data: new Uint8Array(readFileSync(pdfPath)), useSystemFonts: true }).promise;
let target = null;
for (let p = 1; p <= doc.numPages && !target; p++) {
  const text = (await (await doc.getPage(p)).getTextContent()).items.map((i) => i.str).join(" ");
  if (text.replace(/\s+/g, " ").includes(phrase)) target = p;
}
if (!target) throw new Error(`phrase not found: ${phrase}`);

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
  args: ["--allow-file-access-from-files"],
});
const workDir = mkdtempSync(join(tmpdir(), "preview-"));
const stage = join(workDir, "stage.html");
writeFileSync(stage, "<!doctype html><title>preview</title>");
const page = await browser.newPage();
await page.goto(pathToFileURL(stage).href);

const dataUrl = await page.evaluate(
  async ({ pdfjsUrl, workerUrl, pdfB64, pageNumber, targetWidth }) => {
    const pdfjs = await import(pdfjsUrl);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const bytes = Uint8Array.from(atob(pdfB64), (c) => c.charCodeAt(0));
    const d = await pdfjs.getDocument({ data: bytes }).promise;
    const pg = await d.getPage(pageNumber);
    const viewport = pg.getViewport({ scale: targetWidth / pg.getViewport({ scale: 1 }).width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await pg.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  },
  {
    pdfjsUrl: pathToFileURL(join(repoRoot, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.mjs")).href,
    workerUrl: pathToFileURL(join(repoRoot, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")).href,
    pdfB64: readFileSync(pdfPath).toString("base64"),
    pageNumber: target,
    targetWidth: 1700,
  },
);

const out = join(outDir, `${outPrefix}-p${target}.png`);
writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
console.log(out);
await browser.close();
