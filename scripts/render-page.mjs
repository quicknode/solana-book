// Render one page of a PDF to PNG with pdf.js inside Chromium, to check how
// browser-family viewers display it (system rasterizers can hide viewer bugs).
// Usage: node scripts/render-page.mjs <pdf> <pageNum> <out.png>
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const [pdfPath, pageNum, outPath] = process.argv.slice(2);
const pdfB64 = readFileSync(resolve(pdfPath)).toString("base64");
const pdfjsUrl = pathToFileURL(resolve("node_modules/pdfjs-dist/legacy/build/pdf.mjs")).href;
const workerUrl = pathToFileURL(resolve("node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")).href;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
page.on("console", (m) => console.log("console:", m.text()));
page.on("pageerror", (e) => console.error("pageerror:", e.message));
writeFileSync(resolve("node_modules/.render-page.html"), "<!doctype html><title>render</title>");
await page.goto(pathToFileURL(resolve("node_modules/.render-page.html")).href);
const dataUrl = await page.evaluate(async ({ pdfjsUrl, workerUrl, pdfB64, pageNum }) => {
  const pdfjs = await import(pdfjsUrl);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const bytes = Uint8Array.from(atob(pdfB64), (c) => c.charCodeAt(0));
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const p = await doc.getPage(Number(pageNum));
  const viewport = p.getViewport({ scale: 612 / p.getViewport({ scale: 1 }).width });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await p.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return canvas.toDataURL("image/png");
}, { pdfjsUrl, workerUrl, pdfB64, pageNum });
await browser.close();
writeFileSync(resolve(outPath), Buffer.from(dataUrl.split(",")[1], "base64"));
console.log("wrote", outPath);
