/**
 * Универсальные wikilink для vault = planner (корень репо) или obsidian-motivator:
 * - короткое имя файла вместо 18-Глоссарий/переменные/…
 * - якорь #Определение (заголовок) вместо #^glossary-def для основных записей
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../../..");
const motivatorRoot = path.join(repoRoot, "obsidian-motivator");

const GLOSSARY_PREFIX_RE = /\[\[18-Глоссарий\/(?:переменные|методы|_шаблоны)\//g;
const MAIN_DEF_ANCHOR_RE = /#(\^glossary-def)(?!-)/g;
const HEADING_BEFORE_CALLOUT_RE =
  /(\n# [^\n]+\n\n)(> \[!abstract\] Определение)/;

function migrateContent(text) {
  let out = text.replace(GLOSSARY_PREFIX_RE, "[[");
  out = out.replace(MAIN_DEF_ANCHOR_RE, "#Определение");
  if (out.includes("> [!abstract] Определение") && !out.includes("## Определение")) {
    out = out.replace(HEADING_BEFORE_CALLOUT_RE, "$1## Определение\n\n$2");
  }
  return out;
}

function walkMd(dir, skipDirs = new Set(["node_modules", ".git", "web", "packages", ".tmp-gh"])) {
  const files = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) files.push(...walkMd(p, skipDirs));
    else if (ent.name.endsWith(".md")) files.push(p);
  }
  return files;
}

const targets = [
  ...walkMd(motivatorRoot),
  path.join(repoRoot, ".cursor/skills/russian-requirements-writing-skill/SKILL.md"),
  path.join(repoRoot, ".cursor/skills/russian-requirements-writing-skill/reference.md"),
];

let changed = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  if (file.includes(path.join("_scripts", path.sep))) continue;
  const before = fs.readFileSync(file, "utf8");
  const after = migrateContent(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed++;
    console.log(path.relative(repoRoot, file));
  }
}
console.log(`Updated ${changed} files`);
