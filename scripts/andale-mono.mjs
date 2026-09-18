// Andale Mono is the face the figures set their seed lists
// and built-in addresses in. It is one of Microsoft's core fonts: free to
// use, but its licence allows redistribution only as the original installer,
// so unlike the OFL faces it is not checked in beside them. This finds a copy
// on the machine (macOS and Windows ship one, Debian's msttcorefonts package
// installs one) and otherwise fetches the installer and unpacks the TTF into
// assets/fonts/, which .gitignore keeps out of the repository. The CI runner
// takes that path, with cabextract installed for the unpacking.

import { copyFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const unpacked = join(repoRoot, "assets", "fonts", "AndaleMono.ttf");
const candidates = [
  unpacked,
  join(homedir(), "Library", "Fonts", "Andale Mono.ttf"),
  "/Library/Fonts/Andale Mono.ttf",
  "/System/Library/Fonts/Supplemental/Andale Mono.ttf",
  "/usr/share/fonts/truetype/msttcorefonts/Andale_Mono.ttf",
  "/usr/share/fonts/truetype/msttcorefonts/andalemo.ttf",
  "C:\\Windows\\Fonts\\ANDALEMO.TTF",
];
const installer = "https://downloads.sourceforge.net/corefonts/andale32.exe";

const has = (command, args) => {
  try { execFileSync(command, args, { stdio: "ignore" }); return true; } catch { return false; }
};

export function andaleMonoPath() {
  for (const path of candidates) if (existsSync(path)) return path;
  const missing = (what) => new Error(
    `Andale Mono was not found on this machine and could not be fetched: ${what}.\n` +
    `Install it, or put the TTF at ${unpacked} (from the andale32.exe core-fonts installer).`);
  if (!has("curl", ["--version"])) throw missing("curl is not installed");
  if (!has("cabextract", ["--version"])) throw missing("cabextract is not installed (apt-get install cabextract, brew install cabextract)");
  const dir = mkdtempSync(join(tmpdir(), "andale-mono-"));
  const exe = join(dir, "andale32.exe");
  execFileSync("curl", ["-sSL", "--fail", "-o", exe, installer], { stdio: "inherit" });
  execFileSync("cabextract", ["-q", "-d", dir, "-F", "AndaleMo.TTF", exe], { stdio: "inherit" });
  copyFileSync(join(dir, "AndaleMo.TTF"), unpacked);
  console.error(`Andale Mono unpacked to ${unpacked}`);
  return unpacked;
}
