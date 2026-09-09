// Check the figure conventions that need real geometry rather than a regex:
// where marks actually land once transforms and text metrics are applied.
// Renders each SVG in Chromium and measures in root coordinates.
//
//   1. No text crosses an account box edge, and no two labels overlap.
//   2. Every coin mark sits inside the canvas, clear of text and boxes.
//   3. Every coin mark sits beside an amount label, one coin per amount.
//   4. Value arrows are smooth: no tangent break where two segments join.
//   5. Arrowheads point along the stroke they terminate.
//   6. A box collapsed to its heading centres that heading vertically.
//   7. A faded address dot still occludes the cluster curve.
//   8. Every label sits inside the canvas.
//
// Usage: node scripts/check-figure-geometry.mjs [name-fragment ...]
// With arguments, only figures whose path contains one of them are checked,
// which is the quick loop while fixing one family. Exits nonzero if any check
// fails.

import { chromium } from "playwright-core";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const figureDirs = [
  "solana-building-blocks/figures",
  "financial-programming-concepts-in-solana/figures",
  "building-financial-products-in-solana/figures",
];

const files = [];
for (const dir of figureDirs) {
  for (const name of readdirSync(join(repoRoot, dir))) {
    if (name.endsWith(".svg")) files.push(join(repoRoot, dir, name));
  }
}
files.sort();
const only = process.argv.slice(2);
const selected = only.length > 0 ? files.filter((f) => only.some((frag) => f.includes(frag))) : files;
if (selected.length === 0) {
  console.error(`No figure matches ${only.join(", ")}`);
  process.exit(1);
}

// Tangent break at each interior join of a path, in degrees. The figures use
// absolute M/L/C/Q only; anything else is left alone rather than guessed at.
function joinAngles(d) {
  const tokens = d.match(/[MLCQZ]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
  const segments = [];
  let i = 0, cursor = null, command = null;
  const next = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLCQZ]/.test(tokens[i])) command = tokens[i++];
    if (command === "M") { cursor = [next(), next()]; command = "L"; }
    else if (command === "L") { const p = [next(), next()]; segments.push([cursor, p]); cursor = p; }
    else if (command === "C") {
      const a = [next(), next()], b = [next(), next()], p = [next(), next()];
      segments.push([cursor, a, b, p]); cursor = p;
    } else if (command === "Q") {
      const a = [next(), next()], p = [next(), next()];
      segments.push([cursor, a, p]); cursor = p;
    } else return [];
  }

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const size = (v) => Math.hypot(v[0], v[1]);
  const leaving = (s) => { for (let k = 1; k < s.length; k += 1) { const v = sub(s[k], s[0]); if (size(v) > 1e-6) return v; } return null; };
  const arriving = (s) => { const last = s[s.length - 1]; for (let k = s.length - 2; k >= 0; k -= 1) { const v = sub(last, s[k]); if (size(v) > 1e-6) return v; } return null; };

  const joins = [];
  for (let k = 1; k < segments.length; k += 1) {
    const a = arriving(segments[k - 1]);
    const b = leaving(segments[k]);
    if (!a || !b) continue;
    const cos = (a[0] * b[0] + a[1] * b[1]) / (size(a) * size(b));
    joins.push({
      at: segments[k][0],
      degrees: (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI,
    });
  }
  return joins;
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
let failures = 0;

// The figures name the same bundled faces the PDF embeds. Without these
// @font-face rules the page falls back to whatever generic serif the machine
// has, and every clearance below is measured against a face the book will
// never print in - which is how a coin sitting on a label passed this check.
//
// The faces are embedded as data URLs rather than named by file URL. The page
// is loaded with setContent, which leaves it at about:blank, and Chromium will
// not fetch a file: URL from there: every @font-face silently failed and the
// check went on measuring the fallback, which is how a label 9 units past its
// canvas edge passed. Reading the font here and inlining it has no origin to
// be refused from, and fontsLoaded below fails the run if any face still does.
const fontFace = (family, file, extra = "") =>
  `@font-face{font-family:"${family}";src:url("data:font/ttf;base64,${readFileSync(join(repoRoot, "assets", "fonts", file)).toString("base64")}");${extra}}`;
const FONTS = [
  fontFace("Gelasio", "Gelasio-Regular.ttf", "font-weight:normal;font-style:normal;"),
  fontFace("Gelasio", "Gelasio-Bold.ttf", "font-weight:bold;font-style:normal;"),
  fontFace("Gelasio", "Gelasio-Italic.ttf", "font-weight:normal;font-style:italic;"),
  fontFace("DejaVu Sans Mono", "DejaVuSansMono.ttf", "font-weight:normal;font-style:normal;"),
  fontFace("DejaVu Sans Mono", "DejaVuSansMono-Bold.ttf", "font-weight:bold;font-style:normal;"),
].join("");

for (const file of selected) {
  await page.setContent(
    `<!doctype html><style>body{margin:0}${FONTS}</style>${readFileSync(file, "utf8")}`,
  );
  // A face no label on this figure happens to use is never fetched on its own,
  // so each is loaded by hand; what is checked is that none of them failed.
  const unloaded = await page.evaluate(async () => {
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
    return [...document.fonts].filter((f) => f.status !== "loaded").map((f) => `${f.family} ${f.weight} ${f.style}`);
  });
  if (unloaded.length > 0) {
    console.error(`bundled font(s) failed to load, so nothing below is measured in the book's faces: ${unloaded.join(", ")}`);
    process.exit(1);
  }
  const fig = await page.evaluate(() => {
    const svg = document.querySelector("svg");
    const inv = svg.getScreenCTM().inverse();
    const box = (el) => {
      const b = el.getBBox();
      const m = inv.multiply(el.getScreenCTM());
      const p = (x, y) => {
        const q = svg.createSVGPoint();
        q.x = x;
        q.y = y;
        return q.matrixTransform(m);
      };
      const a = p(b.x, b.y);
      const c = p(b.x + b.width, b.y + b.height);
      return {
        x1: Math.min(a.x, c.x), y1: Math.min(a.y, c.y),
        x2: Math.max(a.x, c.x), y2: Math.max(a.y, c.y),
      };
    };

    // An amount label states a quantity of some asset. A step-numbered handler
    // name ("4. borrow_obligation_liquidity()") only looks like one, and a
    // label wrapped over two lines is still one amount.
    const UNITS = /(USDC|ACME|SOL|LP|NVDAx|TSLAx|SPCXx|shares|lamports|USD)\b/i;
    const hasAmount = (raw) => {
      const body = raw.trim().replace(/^\d+\.\s*/, "");
      return /\d/.test(body) && (UNITS.test(body) || /[+−-]?[\d,.]+\s+to\s+\w/.test(body));
    };

    const amounts = [];
    let run = null;
    for (const t of svg.querySelectorAll("text")) {
      const accent = (t.getAttribute("fill") || "").toLowerCase() === "#1e7a3c";
      const bold = (t.getAttribute("font-weight") || "") === "bold";
      const b = box(t);
      // A parenthetical set under an amount - "(all of it)", "(250,000,000
      // minor units)" - is part of that label and travels with it, so the
      // amount reaches to the bottom of the aside. Measuring the accent line
      // alone reads a coin tucked under the pair as 30 units from any amount.
      // The aside is usually centred on the label and wider than it, so its
      // centre landing within the line above is what marks it as a follower.
      if (!accent || !bold) {
        if (run) {
          const mid = (b.x1 + b.x2) / 2;
          if (mid > run.x1 - 4 && mid < run.x2 + 4 && b.y1 - run.y2 > -4 && b.y1 - run.y2 < 10)
            run.y2 = Math.max(run.y2, b.y2);
        }
        run = null;
        continue;
      }
      const anchor = t.getAttribute("text-anchor") || "start";
      const edge = (z) => (anchor === "end" ? z.x2 : z.x1);
      if (run && run.anchor === anchor && Math.abs(edge(run) - edge(b)) < 3 &&
          b.y1 - run.y2 > -4 && b.y1 - run.y2 < 10) {
        run.lines.push(t.textContent.trim());
        run.x1 = Math.min(run.x1, b.x1); run.x2 = Math.max(run.x2, b.x2);
        run.y2 = Math.max(run.y2, b.y2);
      } else {
        run = { ...b, anchor, lines: [t.textContent.trim()] };
        amounts.push(run);
      }
    }

    // A value arrow is one stroke: where two Bezier segments meet, the
    // incoming handle, the anchor and the outgoing handle have to be
    // collinear or the stroke shows a corner. And an arrowhead drawn with
    // orient="auto" points along the tangent at the very last point, which
    // a short terminal hook can swing away from the line the reader sees.
    const arrows = [];
    for (const p of svg.querySelectorAll("path")) {
      const stroke = (p.getAttribute("stroke") || "").toLowerCase();
      if (!stroke || stroke === "none" || !p.getTotalLength) continue;
      const accent = stroke === "#1e7a3c";
      const head = !!p.getAttribute("marker-end");
      if (!accent && !head) continue;
      const total = p.getTotalLength();
      if (total < 8) continue;
      const width = parseFloat(p.getAttribute("stroke-width") || "1");
      const end = p.getPointAtLength(total);
      const nib = p.getPointAtLength(total - 0.25);
      const behind = p.getPointAtLength(Math.max(0, total - Math.max(10, 9 * width)));
      arrows.push({
        accent, head,
        d: p.getAttribute("d") || "",
        end: [end.x, end.y],
        tangent: [end.x - nib.x, end.y - nib.y],
        approach: [end.x - behind.x, end.y - behind.y],
      });
    }

    // An account box, the icon glyph inside it, and whether a heading rule
    // separates a field list from the heading. A box with no rule is collapsed
    // to icon + title, and that pair centres on the box's middle.
    const accounts = [...svg.querySelectorAll('rect[rx="6"]')].map((r) => {
      const b = box(r);
      const holds = (el) => {
        const c = box(el);
        return c.x1 >= b.x1 && c.x2 <= b.x2 && c.y1 >= b.y1 && c.y2 <= b.y2;
      };
      const glyph = [...svg.querySelectorAll("g[transform^='translate']")]
        .filter((g) => g.firstElementChild?.tagName === "g" && holds(g))
        .map(box)[0];
      const ruled = [...svg.querySelectorAll('line[stroke="#888"]')].some(holds);
      // The heading only counts as one when it is the box's whole content: a
      // second label means the box is a list, and rule 6 leaves it alone.
      const labels = [...svg.querySelectorAll("text")].filter(holds);
      const heading = labels.length === 1 ? box(labels[0]) : undefined;
      return { ...b, glyph, heading, ruled };
    });

    // Faded address dots that the cluster curve reaches, and whether an opaque
    // white disc is drawn behind each one. Group opacity composites the whole
    // group, so a faded dot's white centre goes translucent with the rest of it
    // and the heaviest line in the figure shows straight through.
    const nodes = [...svg.querySelectorAll("*")];
    const isDot = (c) => {
      const r = parseFloat(c.getAttribute("r") || "0");
      return c.tagName === "circle" && (r === 6 || r === 5.5) &&
        c.getAttribute("stroke-width") === "2";
    };
    const curve = [...svg.querySelectorAll("path")].find(
      (p) => p.getAttribute("stroke") === "#111" && p.getAttribute("stroke-width") === "3.5");
    const fadedDots = [];
    if (curve) {
      const len = curve.getTotalLength();
      for (const c of nodes.filter(isDot)) {
        let faded = false;
        for (let n = c; n && n !== svg; n = n.parentElement)
          if (n.getAttribute && n.getAttribute("opacity") === "0.3") faded = true;
        if (!faded) continue;
        const cx = parseFloat(c.getAttribute("cx")), cy = parseFloat(c.getAttribute("cy"));
        const r = parseFloat(c.getAttribute("r"));
        let near = Infinity;
        for (let i = 0; i <= 400; i += 1) {
          const p = curve.getPointAtLength((len * i) / 400);
          near = Math.min(near, Math.hypot(p.x - cx, p.y - cy));
        }
        // The curve is 3.5 wide, so it reaches 1.75 either side of its centreline.
        if (near >= r + 1.75) continue;
        // The backing disc has to be unfaded, drawn before the dot, and wide
        // enough to cover the dot's 2-wide ring as well as its centre.
        const backed = nodes.some((el) => {
          if (el.tagName !== "circle" || el === c) return false;
          if ((el.getAttribute("fill") || "") !== "#fff" || el.getAttribute("stroke")) return false;
          if (parseFloat(el.getAttribute("cx")) !== cx || parseFloat(el.getAttribute("cy")) !== cy) return false;
          if (parseFloat(el.getAttribute("r") || "0") < r + 1) return false;
          for (let n = el; n && n !== svg; n = n.parentElement)
            if (n.getAttribute && n.getAttribute("opacity") === "0.3") return false;
          return c.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING;
        });
        if (!backed) fadedDots.push({ cx, cy });
      }
    }

    return {
      arrows,
      accounts,
      fadedDots,
      coins: [...svg.querySelectorAll("g.coin")].map(box),
      markers: [...svg.querySelectorAll(".marker")].map(box),
      texts: [...svg.querySelectorAll("text")].map((t) => ({ ...box(t), s: t.textContent.trim() })),
      // A key box is a legend, not an account: its whole job is to hold the
      // step labels and their coin marks, so the "no text inside a box it does
      // not belong to" and "no coin over a box" rules would fire on every row.
      rects: [...svg.querySelectorAll("rect:not(.key):not(.marker)")]
        .filter((r) => (r.getAttribute("fill") || "") !== "none")
        .map(box),
      amounts: amounts.filter((a) => hasAmount(a.lines.join(" "))),
      viewBox: svg.getAttribute("viewBox").split(/\s+/).map(Number),
    };
  });

  const name = file.slice(repoRoot.length + 1);
  const fail = (msg) => { failures += 1; console.error(`${name}: ${msg}`); };
  const overlaps = (a, b, pad = 1) =>
    a.x2 > b.x1 + pad && a.x1 < b.x2 - pad && a.y2 > b.y1 + pad && a.y1 < b.y2 - pad;
  const contains = (outer, inner, pad = 1) =>
    inner.x1 >= outer.x1 - pad && inner.x2 <= outer.x2 + pad &&
    inner.y1 >= outer.y1 - pad && inner.y2 <= outer.y2 + pad;
  const at = (b) => `${b.x1.toFixed(0)},${b.y1.toFixed(0)}`;

  // 1. Labels stay out of boxes they do not belong to, and off each other.
  const seen = new Set();
  for (const t of fig.texts) {
    for (const r of fig.rects) {
      if (overlaps(t, r) && !contains(r, t)) {
        const key = `edge:${t.s}`;
        if (!seen.has(key)) { seen.add(key); fail(`"${t.s.slice(0, 44)}" crosses a box edge`); }
      }
    }
  }
  // A label that reaches the border reads as running out of its box, even
  // though it is technically inside: the heading rule stops at the padding, so
  // a heading that outruns the rule is the thing the eye catches. Half the
  // 8-unit padding is the line - "Carol's user index" came within 2.3 of the
  // stroke and the column had to widen.
  for (const t of fig.texts) {
    const home = fig.rects.find((r) => contains(r, t));
    if (!home || t.x2 <= home.x2 - 4) continue;
    const key = `pad:${t.s}`;
    if (seen.has(key)) continue;
    seen.add(key);
    fail(`"${t.s.slice(0, 40)}" reaches within ${(home.x2 - t.x2).toFixed(1)} of its box edge; widen the column`);
  }

  for (let i = 0; i < fig.texts.length; i += 1) {
    for (let j = i + 1; j < fig.texts.length; j += 1) {
      if (overlaps(fig.texts[i], fig.texts[j], 1.5)) {
        const key = `pair:${fig.texts[i].s}:${fig.texts[j].s}`;
        if (!seen.has(key)) {
          seen.add(key);
          fail(`"${fig.texts[i].s.slice(0, 30)}" overlaps "${fig.texts[j].s.slice(0, 30)}"`);
        }
      }
    }
  }

  // 2 and 3. The coin marks the stated amount, so there is exactly one per
  // amount label and it sits beside the label it belongs to.
  if (fig.coins.length !== fig.amounts.length) {
    fail(`${fig.coins.length} coin mark(s) but ${fig.amounts.length} amount label(s); ` +
         `every amount takes one coin and every coin needs an amount`);
  }
  const [vx, vy, vw, vh] = fig.viewBox;
  for (const c of fig.coins) {
    if (c.x1 < vx || c.y1 < vy || c.x2 > vx + vw || c.y2 > vy + vh) {
      fail(`coin at ${at(c)} falls outside the canvas`);
    }
    for (const t of fig.texts) {
      if (overlaps(c, t, 0.5)) fail(`coin at ${at(c)} overlaps "${t.s.slice(0, 34)}"`);
    }
    for (const r of fig.rects) {
      if (overlaps(c, r, 0.5)) fail(`coin at ${at(c)} overlaps a box`);
    }
    // The coin belongs where the value moves. That is beside the amount when
    // the amount is written on the canvas, and beside the step marker when the
    // words have moved into a key box and only the number is left on the line.
    const near = (z) =>
      Math.hypot(Math.max(z.x1 - c.x2, 0, c.x1 - z.x2), Math.max(z.y1 - c.y2, 0, c.y1 - z.y2)) < 14;
    if (!fig.amounts.some(near) && !fig.markers.some(near)) {
      fail(`coin at ${at(c)} is beside neither an amount label nor a step marker`);
    }
  }

  // 4 and 5. Arrows read as one smooth stroke, ending in a head that points
  // where the stroke is going.
  const between = (u, v) => {
    const lu = Math.hypot(u[0], u[1]);
    const lv = Math.hypot(v[0], v[1]);
    if (lu < 1e-9 || lv < 1e-9) return 0;
    const cos = (u[0] * v[0] + u[1] * v[1]) / (lu * lv);
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  };
  for (const a of fig.arrows) {
    if (a.accent) {
      for (const join of joinAngles(a.d)) {
        if (join.degrees >= 3) {
          fail(`value arrow kinks ${join.degrees.toFixed(0)}deg at ` +
               `${join.at.map((v) => v.toFixed(0)).join(",")}; align the handles either side of the join`);
        }
      }
    }
    if (a.head) {
      const off = between(a.tangent, a.approach);
      if (off >= 12) {
        fail(`arrowhead at ${a.end.map((v) => v.toFixed(0)).join(",")} points ${off.toFixed(0)}deg ` +
             `off its stroke; the line should meet the middle of the head's base`);
      }
    }
  }

  // 6. A box faded down to its heading has nothing below the title, so the
  // icon and title sit in the middle of the box rather than hugging its top.
  // Both halves are measured. The icon and the title are placed by separate
  // numbers, so a figure copied from a neighbour can carry a centred icon over
  // a title that sits low, which is how 173 of these boxes came to be wrong.
  for (const a of fig.accounts) {
    if (a.ruled) continue;
    for (const [part, what] of [[a.glyph, "icon"], [a.heading, "title"]]) {
      if (!part) continue;
      const off = (part.y1 + part.y2) / 2 - (a.y1 + a.y2) / 2;
      if (Math.abs(off) > 0.75) {
        fail(`box collapsed to its heading at ${at(a)} sits its ${what} ${off.toFixed(1)} off centre; ` +
             `centre the icon and title on the box's middle`);
      }
    }
  }

  // 7. Fading a dot must not open a hole in the curve behind it.
  for (const d of fig.fadedDots) {
    fail(`faded address dot at ${d.cx.toFixed(0)},${d.cy.toFixed(0)} lets the curve through; ` +
         `draw an opaque white disc behind it, before its faded group`);
  }

  // 8. The PDF sets the figure at the text width and clips it to the viewBox,
  // so a label past the canvas edge is not a label that runs into the margin:
  // it is a label with its end cut off. Anything past the edge fails; a label
  // that stops within 2 units of it is printing against the trim of the figure.
  for (const t of fig.texts) {
    if (!t.s) continue; // an empty label has no box to be clipped
    const over = Math.max(vx - t.x1, vy - t.y1, t.x2 - (vx + vw), t.y2 - (vy + vh));
    if (over <= -2) continue;
    const key = `canvas:${t.s}`;
    if (seen.has(key)) continue;
    seen.add(key);
    fail(over > 0
      ? `"${t.s.slice(0, 40)}" runs ${over.toFixed(1)} past the canvas edge and is clipped`
      : `"${t.s.slice(0, 40)}" stops within ${(-over).toFixed(1)} of the canvas edge`);
  }
}

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} figure geometry failure(s).`);
  process.exit(1);
}
console.log(`Figure geometry clean across ${selected.length} figure(s).`);
