#!/usr/bin/env node
/**
 * Version bump script for team plugins.
 *
 * Usage:
 *   pnpm run version:bump patch              # 모든 플러그인 1.0.1 → 1.0.2
 *   pnpm run version:bump minor
 *   pnpm run version:bump major
 *   pnpm run version:bump 1.2.3              # explicit version (모든 플러그인)
 *   pnpm run version:bump minipowers patch   # 플러그인 지정
 *   pnpm run version:bump minipowers 1.1.0
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── Plugin configs ──
const PLUGINS = {
  "minipowers": {
    plugin: "packages/minipowers/.claude-plugin/plugin.json",
    codexPlugin: "packages/minipowers/.codex-plugin/plugin.json",
  },
};

const marketplacePath = resolve(root, ".claude-plugin/marketplace.json");

// ── Helpers ──
function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

function isExplicitVersion(arg) {
  return /^\d+\.\d+\.\d+$/.test(arg);
}

// ── Update a single plugin's version files ──
function updatePlugin(pluginName, config, bumpArg) {
  // 1. Read current version from plugin.json (single source of truth)
  const pluginJsonPath = resolve(root, config.plugin);
  const pluginJson = readJson(pluginJsonPath);
  const currentVersion = pluginJson.version;
  const newVersion = isExplicitVersion(bumpArg)
    ? bumpArg
    : bumpVersion(currentVersion, bumpArg);

  if (newVersion === currentVersion) {
    console.log(`${pluginName}: version is already ${currentVersion}. Synchronizing and rebuilding.`);
  }

  console.log(`\n${pluginName} version bump: ${currentVersion} → ${newVersion}`);

  // 2. Update marketplace.json
  const marketplace = readJson(marketplacePath);
  const entry = marketplace.plugins.find((p) => p.name === pluginName);
  if (entry) {
    entry.version = newVersion;
    writeJson(marketplacePath, marketplace);
    console.log(`  ✔ .claude-plugin/marketplace.json`);
  }

  // 3. Update plugin.json
  pluginJson.version = newVersion;
  writeJson(pluginJsonPath, pluginJson);
  console.log(`  ✔ ${config.plugin}`);

  // 3-1. Update .codex-plugin/plugin.json (Codex 배포용 매니페스트 — 버전 동기화)
  if (config.codexPlugin) {
    const codexJsonPath = resolve(root, config.codexPlugin);
    const codexJson = readJson(codexJsonPath);
    codexJson.version = newVersion;
    writeJson(codexJsonPath, codexJson);
    console.log(`  ✔ ${config.codexPlugin}`);
  }
}

// ── Parse args: [plugin] <patch|minor|major|x.y.z> ──
const args = process.argv.slice(2);
let pluginName;
let bumpArg;

if (args.length === 2) {
  [pluginName, bumpArg] = args;
} else {
  bumpArg = args[0];
}

if (args.length < 1 || args.length > 2 || !bumpArg ||
    (!isExplicitVersion(bumpArg) && !["patch", "minor", "major"].includes(bumpArg))) {
  console.error("Usage: pnpm run version:bump [plugin] <patch|minor|major|x.y.z>");
  console.error(`Plugins: ${Object.keys(PLUGINS).join(", ")} (생략 시 전체 적용)`);
  process.exit(1);
}

// 플러그인 이름 생략 시 전체 대상
const targets = pluginName ? [pluginName] : Object.keys(PLUGINS);

for (const name of targets) {
  if (!PLUGINS[name]) {
    console.error(`Unknown plugin: ${name}`);
    console.error(`Plugins: ${Object.keys(PLUGINS).join(", ")}`);
    process.exit(1);
  }
}

for (const name of targets) {
  updatePlugin(name, PLUGINS[name], bumpArg);
}

// Build (모든 플러그인 갱신 후 한 번만)
console.log(`\nBuilding...`);
try {
  execSync("pnpm run dist", { cwd: root, stdio: "inherit" });
  console.log(`\n✔ Build complete.\n`);
} catch {
  console.error(`\n✘ Build failed. Version files were updated; dist was not published.\n` +
    `Fix the failure, then run pnpm run dist or retry the same explicit version.\n`);
  process.exit(1);
}
