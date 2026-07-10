// Render every figure SVG to PNG at 1.6x, same Chromium as the book build.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2];
mkdirSync(outDir, { recursive: true });
const dirs = ["solana-building-blocks/figures", "building-financial-products-in-solana/figures"];
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
for (const dir of dirs) {
  for (const name of readdirSync(dir).filter(n => n.endsWith(".svg"))) {
    const svg = readFileSync(join(dir, name), "utf8");
    const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    const w = Math.round(parseFloat(m[1]) * 1.6), h = Math.round(parseFloat(m[2]) * 1.6);
    const html = `<!doctype html><style>body{margin:0;background:#fff}svg{width:${w}px;height:${h}px;display:block}</style>${svg}`;
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(html);
    await page.screenshot({ path: join(outDir, name.replace(".svg", ".png")) });
  }
}
await browser.close();
console.log("rendered");
