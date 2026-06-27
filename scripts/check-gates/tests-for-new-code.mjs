#!/usr/bin/env node
// Гейт `tests-for-new-code` — см. .cursor/skills/tests-for-new-code/SKILL.md

import { changedFiles, isBlock, uncoveredLogicSources } from './_lib.mjs';

function main() {
  const files = changedFiles();
  const uncovered = uncoveredLogicSources(files);

  const block = isBlock();
  if (uncovered.length === 0) {
    const n = files.filter((f) => f.match(/^(web\/src|packages\/[^/]+\/src|services\/[^/]+\/src)/)).length;
    if (n) console.log(`[tests-for-new-code] OK: логика с тестами (проверено ${files.length} файл(ов) в diff).`);
    return 0;
  }

  const tag = block ? 'BLOCK' : 'WARN';
  console.log(`[tests-for-new-code] ${tag}: исходники без изменения соответствующего теста:`);
  for (const f of uncovered) {
    const base = f.replace(/\.(ts|tsx)$/, '');
    console.log(
      `  - ${f}  (ожидался один из: ${base}.test.ts, ${base}.test.tsx, ${base}.spec.ts, ${base}.spec.tsx)`,
    );
  }
  console.log('[tests-for-new-code] как закрыть — .cursor/skills/tests-for-new-code/SKILL.md');
  return block ? 1 : 0;
}

process.exit(main());
