// Render an animated scene's steps to PNG, so each step's end state can be
// looked at without pressing through the animation, and optionally record the
// whole animation as a video.
//
//   node scripts/animation-frames.mjs <scene> [--video]
//
// <scene> is a directory under animations/ (e.g. options). Frames land in
// build/animation-<scene>-<step>.png and the end-state SVG beside each one;
// --video plays every step in order and saves build/animation-<scene>.webm.
// Exits nonzero if the page throws. A missing Denim INK font is not an error:
// the face is not in the repository, and the page falls back to Helvetica.

import { chromium } from "playwright-core";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const video = args.includes("--video");
if (!name) {
  console.error("Usage: node scripts/animation-frames.mjs <scene> [--video]");
  process.exit(1);
}
const page_ = join(repoRoot, "animations", name, "index.html");
if (!existsSync(page_)) {
  console.error(`No scene at ${page_}`);
  process.exit(1);
}
const outDir = join(repoRoot, "build");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
// 16:9, the frame the scene is drawn for.
const viewport = { width: 1280, height: 720 };
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 2,
  ...(video ? { recordVideo: { dir: outDir, size: viewport } } : {}),
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(pathToFileURL(page_).href);
await page.waitForFunction(() => window.player);
const count = await page.evaluate(() => window.player.count);
// The key hint is for a person at the keyboard, not for a frame or a recording.
await page.addStyleTag({ content: "#hint { display: none; }" });

if (video) {
  // next() resolves when its step's animation ends; then hold the finished
  // step as autoplay does.
  const hold = await page.evaluate(() => window.player.scene.hold ?? 3000);
  await page.waitForTimeout(hold);
  for (let i = 1; i < count; i++) {
    await page.evaluate(() => window.player.next());
    await page.waitForTimeout(hold);
  }
  const path = await page.video().path();
  await context.close();
  renameSync(path, join(outDir, `animation-${name}.webm`));
  console.log(join(outDir, `animation-${name}.webm`));
} else {
  const stage = page.locator("#stage");
  for (let i = 0; i < count; i++) {
    await page.evaluate((n) => window.player.goto(n), i);
    // Let a cross-fade between a slide and a diagram, or a card's build, finish.
    await page.waitForTimeout(500);
    const step = String(i + 1).padStart(2, "0");
    await stage.screenshot({ path: join(outDir, `animation-${name}-${step}.png`) });
    const svg = await page.evaluate(() => new XMLSerializer().serializeToString(document.querySelector("#stage svg")));
    writeFileSync(join(outDir, `animation-${name}-${step}.svg`), svg);
  }
  console.log(`${count} frames in ${outDir}/animation-${name}-*.png`);
}
await browser.close();
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
