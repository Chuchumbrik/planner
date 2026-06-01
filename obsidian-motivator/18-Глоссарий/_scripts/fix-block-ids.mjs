import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const re = /^(> .+) \^((?:glossary-def)[\w-]*)\s*$/;

let n = 0;
for (const dir of ["переменные", "методы", "_шаблоны"]) {
  const base = path.join(root, dir);
  if (!fs.existsSync(base)) continue;
  for (const name of fs.readdirSync(base)) {
    if (!name.endsWith(".md")) continue;
    const file = path.join(base, name);
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    let changed = false;
    const out = [];
    for (const line of lines) {
      const m = line.match(re);
      if (m) {
        out.push(m[1], "", `^${m[2]}`);
        changed = true;
      } else {
        out.push(line);
      }
    }
    if (changed) {
      fs.writeFileSync(file, out.join("\n") + (out.at(-1) === "" ? "" : "\n"), "utf8");
      n++;
      console.log(file);
    }
  }
}
console.log(`Updated ${n} files`);
