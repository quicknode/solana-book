// KDP wants the wraparound cover at an exact size derived from the interior
// page count: bleed + back + spine + front + bleed wide, and trim + bleed
// tall. The cover is authored in Figma at whatever scale its frame happens
// to be, so this script rescales an export to fill that exact target,
// cropping any overflow into the bleed. It also reports how far the art's
// designed spine sits from the real one, because a cover drawn for an older
// page count carries a spine of the wrong width even after a perfect rescale.
//
// Usage:
//   npm run resize-cover -- path/to/wraparound-export.pdf [--pages 257] [--paper white|cream]
//
// The input is the full wraparound export (back cover, spine, front cover,
// with bleed), not assets/cover.pdf, which is the front cover at trim and
// is consumed by the book build instead (PRINT-SPECIFICATION.md, Cover).
//
// The rescaled file is print-ready for KDP's cover upload. Rasterization is
// not needed here: KDP flattens covers for print itself, and the Quartz
// rendering fragility that made the book's own embedded cover a raster
// (see build-pdf.mjs) is a screen-viewer problem, not a press problem.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const TRIM_WIDTH = 7.44;
const TRIM_HEIGHT = 9.69;
const BLEED = 0.125;
// KDP's published per-page thicknesses for black-ink paperbacks.
const PAGE_THICKNESS = { white: 0.002252, cream: 0.0025 };

const args = process.argv.slice(2);
let input;
let pages;
let paper = "white";
let out;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--pages") pages = Number(args[++i]);
  else if (args[i] === "--paper") paper = args[++i];
  else if (args[i] === "--out") out = args[++i];
  else input = args[i];
}
if (!PAGE_THICKNESS[paper]) {
  console.error(`--paper must be one of: ${Object.keys(PAGE_THICKNESS).join(", ")}`);
  process.exit(1);
}
if (!input) {
  console.error("Usage: npm run resize-cover -- <wraparound-export.pdf> [--pages N] [--paper white|cream]");
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`No cover PDF at ${input}`);
  process.exit(1);
}
if (!pages) {
  const bookPath = join(repoRoot, "build", "Building Financial Software on Solana.pdf");
  if (!existsSync(bookPath)) {
    console.error("Pass --pages N, or build the book first so the count can be read from it.");
    process.exit(1);
  }
  pages = (await PDFDocument.load(readFileSync(bookPath))).getPageCount();
  console.log(`Page count ${pages}, read from the built book. Pass --pages to override,`);
  console.log(`and count the file you will actually upload as the interior.`);
}

const spine = pages * PAGE_THICKNESS[paper];
const targetWidth = (BLEED * 2 + TRIM_WIDTH * 2 + spine) * 72;
const targetHeight = (TRIM_HEIGHT + BLEED * 2) * 72;

const source = await PDFDocument.load(readFileSync(input));
const output = await PDFDocument.create();
const [art] = await output.embedPdf(source, [0]);

// Fill the target completely: scale to the larger ratio and center, so any
// overflow is cropped symmetrically into the bleed rather than leaving a
// sliver of unprinted edge.
const scale = Math.max(targetWidth / art.width, targetHeight / art.height);
const drawnWidth = art.width * scale;
const drawnHeight = art.height * scale;
const page = output.addPage([targetWidth, targetHeight]);
page.drawPage(art, {
  x: (targetWidth - drawnWidth) / 2,
  y: (targetHeight - drawnHeight) / 2,
  xScale: scale,
  yScale: scale,
});

out ??= join(repoRoot, "build", `cover-kdp-${pages}pp-${paper}.pdf`);
writeFileSync(out, await output.save());

const inches = (pt) => (pt / 72).toFixed(3);
console.log(
  `Wrote ${out} (${inches(targetWidth)} x ${inches(targetHeight)}in; ` +
    `spine ${spine.toFixed(3)}in for ${pages} pages on ${paper} paper)`,
);

// If the art's proportions imply a different spine than the page count
// does, the covers bleed onto the spine (or the spine onto the covers) by
// half the difference per side, and spine text rides off-center by the
// same amount. Small on a dark cover, but the final export should come
// from a frame drawn for the real page count.
// Measured at the height-fit scale: with the trim heights aligned, the
// width the art has left over after two covers and two bleeds is the
// spine it was drawn for.
const heightFitWidth = (art.width * targetHeight) / art.height;
const designedSpine = heightFitWidth / 72 - (BLEED * 2 + TRIM_WIDTH * 2);
const delta = designedSpine - spine;
if (Math.abs(delta) > 0.01) {
  const designedPages = Math.round(designedSpine / PAGE_THICKNESS[paper]);
  console.warn(
    `Note: the art's proportions imply a ${designedSpine.toFixed(3)}in spine ` +
      `(about ${designedPages} pages), ${Math.abs(delta).toFixed(3)}in ` +
      `${delta > 0 ? "wider" : "narrower"} than this book's. Spine edges sit ` +
      `${Math.abs(delta / 2).toFixed(3)}in off; re-export the frame at the ` +
      `real page count for the production cover.`,
  );
}
