// Report horizontal bands of dead space in the figures: a strip running the
// width of a figure with no account box, no dot and no label in it.
//
// These open up when annotation is deleted and the surrounding columns are
// left where they were. The band is easy to miss in review and obvious in
// print, so this looks for it directly.
//
// Why not scan the rendered pixels: an arrow crossing the band keeps every
// scanline inked, so a blank-row scan scores the worst case in the book as
// clean. What makes a band read as empty is the absence of *objects*, not of
// ink. So the y-extents here come from rects, text and dots only, and paths
// are measured separately — a band an arrow merely passes through is still a
// hole, while one a chart curve sweeps across is the figure's content.
//
// That distinction is a judgement, so this reports rather than gates. A gap
// is called DEAD when paths cover less than `minCoverage` of the width inside
// it, and CROSSED otherwise, with the coverage shown so the call can be
// checked.
//
// It over-reports on figures whose content is a curve rather than boxes: a
// steep chart line covers few columns and scores as DEAD. Six such bands are
// known and deliberate as of writing — amm-impermanent-loss (2),
// lending-rate-curve, fund-fee-dilution, rent-lifecycle, and the caption gap
// in escrow-swap-intent. So --strict is for checking a figure you just edited
// (`--strict path/to/one.svg`), not for gating the whole book.
//
// Usage: node scripts/check-figure-bands.mjs [--strict] [--gap 45] [file...]

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const figureDirs = [
  "solana-building-blocks/figures",
  "financial-programming-concepts-in-solana/figures",
  "building-financial-products-in-solana/figures",
];

const argv = process.argv.slice(2);
const strict = argv.includes("--strict");
const gapIndex = argv.indexOf("--gap");
const minGap = gapIndex >= 0 ? Number(argv[gapIndex + 1]) : 45;
const minCoverage = 0.12;
const explicit = argv.filter((a, i) =>
  !a.startsWith("--") && !(gapIndex >= 0 && i === gapIndex + 1));

const files = explicit.length
  ? explicit.map((f) => resolve(f))
  : figureDirs.flatMap((dir) =>
      readdirSync(join(repoRoot, dir))
        .filter((n) => n.endsWith(".svg"))
        .map((n) => join(repoRoot, dir, n)));
files.sort();

// Flatten a path's geometry to sample points. The figures use absolute
// M/L/C/Q/Z only; an unrecognised command ends the path rather than being
// guessed at, which costs a few samples and never invents any.
function samplePath(d) {
  const tokens = d.match(/[MLCQZ]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
  const points = [];
  let i = 0, cursor = null, command = null;
  const num = () => Number(tokens[i++]);
  const bez = (p, ctrl) => {
    for (let t = 1; t <= 12; t++) {
      const s = t / 12, u = 1 - s;
      if (ctrl.length === 3) {
        points.push([
          u * u * u * p[0] + 3 * u * u * s * ctrl[0][0] + 3 * u * s * s * ctrl[1][0] + s * s * s * ctrl[2][0],
          u * u * u * p[1] + 3 * u * u * s * ctrl[0][1] + 3 * u * s * s * ctrl[1][1] + s * s * s * ctrl[2][1],
        ]);
      } else {
        points.push([
          u * u * p[0] + 2 * u * s * ctrl[0][0] + s * s * ctrl[1][0],
          u * u * p[1] + 2 * u * s * ctrl[0][1] + s * s * ctrl[1][1],
        ]);
      }
    }
  };
  while (i < tokens.length) {
    if (/[MLCQZ]/.test(tokens[i])) command = tokens[i++];
    if (command === "Z") break;
    if (command === "M" || command === "L") {
      cursor = [num(), num()];
      points.push(cursor);
    } else if (command === "C") {
      const c1 = [num(), num()], c2 = [num(), num()], end = [num(), num()];
      bez(cursor, [c1, c2, end]);
      cursor = end;
    } else if (command === "Q") {
      const c1 = [num(), num()], end = [num(), num()];
      bez(cursor, [c1, end]);
      cursor = end;
    } else break;
  }
  return points;
}

function measure(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  const view = lines[0].match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!view) return null;
  const width = Number(view[1]), height = Number(view[2]);

  const objects = [];   // y-extents of boxes, labels and dots
  const points = [];    // sampled path geometry
  // A top-level group may carry a translate that moves everything under it.
  const topGroup = /^ {2}<g transform="translate\((-?[\d.]+),(-?[\d.]+)\)">$/;
  let dx = 0, dy = 0, depth = null;

  for (const line of lines) {
    const wrap = topGroup.exec(line);
    if (wrap) { dx = Number(wrap[1]); dy = Number(wrap[2]); depth = 0; continue; }
    if (depth !== null) {
      depth += (line.match(/<g[ >]/g) || []).length - (line.match(/<\/g>/g) || []).length;
      if (line.trim() === "</g>" && depth < 0) { dx = dy = 0; depth = null; continue; }
    }
    // Marker geometry is marker-local, not figure coordinates.
    if (line.includes("<defs>") || line.includes("<marker")) continue;

    for (const m of line.matchAll(/<rect[^>]*\by="(-?[\d.]+)"[^>]*\bheight="([\d.]+)"/g)) {
      const y = Number(m[1]) + dy;
      objects.push([y, y + Number(m[2])]);
    }
    for (const m of line.matchAll(/<text[^>]*\by="(-?[\d.]+)"/g)) {
      const size = Number((/font-size="([\d.]+)"/.exec(line) || [, 9])[1]);
      const y = Number(m[1]) + dy;
      objects.push([y - size, y + size * 0.3]);
    }
    // Address dots only. Coin rings and icon circles live inside an inline
    // translate, so their raw cy is a local offset near zero — counting them
    // would plant a phantom object at the top of every figure with coins.
    for (const m of line.matchAll(/<circle[^>]*\bcy="(-?[\d.]+)"[^>]*\br="(5\.5|6)"[^>]*stroke-width="2"/g)) {
      const y = Number(m[1]) + dy, r = Number(m[2]);
      objects.push([y - r, y + r]);
    }
    // Likewise, a path sharing a line with an inline translate is icon
    // interior drawn in local coordinates, not a figure-level arrow.
    if (!line.includes('<g transform="translate(')) {
      for (const m of line.matchAll(/<path d="([^"]+)"/g)) {
        for (const [px, py] of samplePath(m[1])) points.push([px + dx, py + dy]);
      }
    }
  }
  if (!objects.length) return null;

  objects.sort((a, b) => a[0] - b[0]);
  const spans = [objects[0].slice()];
  for (const [a, b] of objects.slice(1)) {
    if (a <= spans[spans.length - 1][1] + 1) {
      spans[spans.length - 1][1] = Math.max(spans[spans.length - 1][1], b);
    } else spans.push([a, b]);
  }

  const gaps = [];
  for (let i = 0; i < spans.length - 1; i++) {
    const top = spans[i][1], bottom = spans[i + 1][0];
    if (bottom - top < minGap) continue;
    // How much of the width do paths actually cover inside the band? Bucket
    // sample x's so two thin arrows read as narrow and a swept curve as wide.
    const bins = new Set();
    for (const [px, py] of points) {
      if (py > top && py < bottom) bins.add(Math.floor(px / 4));
    }
    gaps.push({ top, bottom, size: bottom - top, coverage: (bins.size * 4) / width });
  }
  return { width, height, gaps, tail: height - spans[spans.length - 1][1] };
}

let dead = 0, reported = 0;
for (const file of files) {
  const fig = measure(file);
  if (!fig) continue;
  const notable = fig.gaps.filter((g) => g.size >= minGap);
  if (!notable.length && fig.tail < minGap) continue;
  reported += 1;
  console.log(relative(repoRoot, file));
  for (const g of notable) {
    const verdict = g.coverage < minCoverage ? "DEAD   " : "crossed";
    if (g.coverage < minCoverage) dead += 1;
    console.log(`  ${verdict} y ${g.top.toFixed(0)}-${g.bottom.toFixed(0)}` +
                ` (${g.size.toFixed(0)}px), paths cover ${(g.coverage * 100).toFixed(0)}% of the width`);
  }
  if (fig.tail >= minGap) {
    console.log(`  tail    ${fig.tail.toFixed(0)}px below the last object; trim the viewBox`);
  }
}

if (!reported) {
  console.log(`No bands over ${minGap}px across ${files.length} figures.`);
} else {
  console.log(`\n${reported} figure(s) with a band over ${minGap}px; ${dead} look dead.`);
  console.log("A DEAD band is a hole to close: move the content below it up and trim the");
  console.log("viewBox. A crossed band is usually the figure's own curve or flow — look before");
  console.log("changing it.");
}
if (strict && dead > 0) process.exit(1);
