import { chromium } from "playwright-core";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dirs = ["solana-building-blocks/figures", "building-financial-products-in-solana/figures"];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
for (const dir of dirs) {
  for (const name of readdirSync(dir).filter(n => n.endsWith(".svg"))) {
    const svg = readFileSync(join(dir, name), "utf8");
    await page.setContent(`<!doctype html><body style="margin:0"><div style="width:1000px">${svg}</div></body>`);
    const issues = await page.evaluate(() => {
      const svg = document.querySelector("svg");
      const svgBox = svg.getBoundingClientRect();
      const out = [];
      const rectOf = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
      const texts = [...svg.querySelectorAll("text")].map(t => ({ el: t, ...rectOf(t), s: t.textContent.trim().slice(0, 45) }));
      const inter = (a, b, pad) => a.x + pad < b.x + b.w && b.x + pad < a.x + a.w && a.y + pad < b.y + b.h && b.y + pad < a.y + a.h;
      for (const b of texts) {
        if (b.x < svgBox.x - 1 || b.y < svgBox.y - 1 || b.x + b.w > svgBox.x + svgBox.width + 1 || b.y + b.h > svgBox.y + svgBox.height + 1)
          out.push(`CLIPPED: "${b.s}"`);
      }
      for (let i = 0; i < texts.length; i++)
        for (let j = i + 1; j < texts.length; j++)
          if (inter(texts[i], texts[j], 2)) out.push(`TEXT/TEXT: "${texts[i].s}" <> "${texts[j].s}"`);
      const all = [...svg.querySelectorAll("text, rect, circle, path")];
      for (const b of texts) {
        const ti = all.indexOf(b.el);
        for (let k = ti + 1; k < all.length; k++) {
          const el = all[k];
          if (el.tagName === "text") continue;
          const fill = el.getAttribute("fill");
          if (!fill || fill === "none") continue;
          let op = 1;
          for (let a = el; a && a !== svg; a = a.parentElement) {
            if (a.getAttribute && a.getAttribute("opacity")) op *= parseFloat(a.getAttribute("opacity"));
            if (a.getAttribute && a.getAttribute("fill-opacity")) op *= parseFloat(a.getAttribute("fill-opacity"));
          }
          if (op < 0.5) continue;
          const eb = rectOf(el);
          if (eb.w * eb.h > 0 && inter(b, eb, 3)) out.push(`COVERED: "${b.s}" under later ${el.tagName} fill=${fill}`);
        }
      }
      return out;
    });
    if (issues.length) console.log(`\n${dir}/${name}:\n  ` + [...new Set(issues)].join("\n  "));
  }
}
await browser.close();
console.log("\ndone");
