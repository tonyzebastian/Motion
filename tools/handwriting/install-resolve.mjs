#!/usr/bin/env node
// Adds Workspace → Scripts → Handwriting → Open Studio to DaVinci Resolve
// (works in the free version). Re-run it after moving this repo or changing
// Node versions, then restart Resolve.
//
//   npm run resolve:install
//
// See README.md next to this file.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const motionDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const nodeBin = dirname(process.execPath);
const menuDir = join(
  homedir(),
  "Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility/Handwriting",
);

const s = (v) => JSON.stringify(v);
const script = `-- Installed by npm run resolve:install in ${motionDir}. Re-run that to update.
local cfg = { motionDir = ${s(motionDir)}, nodeBin = ${s(nodeBin)} }
local handwriting = dofile(cfg.motionDir .. "/tools/handwriting/resolve/handwriting.lua")

-- Resolve hands menu scripts the app as \`resolve\` (or through Fusion);
-- find it here, where those exist, and pass it on.
local function app()
  if resolve then return resolve end
  local f = fu or fusion
  if f then
    local ok, r = pcall(function() return f:GetResolve() end)
    if ok and r then return r end
  end
  local ok, r = pcall(function() return Resolve() end)
  if ok and r then return r end
end
handwriting.openStudio(cfg, app())
`;

mkdirSync(menuDir, { recursive: true });
// Entries from earlier versions.
for (const old of ["Write Text….lua", "Add Latest Export.lua", "Place Latest Clip.lua", "Quick Text….lua"]) {
  rmSync(join(menuDir, old), { force: true });
}
writeFileSync(join(menuDir, "Open Studio.lua"), script);
console.log("Installed Workspace → Scripts → Handwriting → Open Studio in DaVinci Resolve.");
console.log("Restart Resolve if it's open.");
