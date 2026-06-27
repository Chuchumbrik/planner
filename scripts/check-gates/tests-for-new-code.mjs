#!/usr/bin/env node
// Гейт `tests-for-new-code` (RULES.md §2, .cursor/skills/tests-for-new-code).
// Изменённый логический исходник под web/src или packages/*/src обязан нести изменение
// своего тест-файла в том же наборе изменений.
//
// Запуск:
//   node scripts/check-gates/tests-for-new-code.mjs            # pre-commit: staged-файлы
//   GATE_BASE=origin/main node .../tests-for-new-code.mjs      # CI: дифф против базы
//   GATE_BLOCK=1 node .../tests-for-new-code.mjs               # block-режим: exit 1 при пробелах
//
// Раскатка warn -> block: по умолчанию warn (логирует, exit 0). Поднять флагом GATE_BLOCK=1
// либо синхронизировать с enforcement-level в SKILL.md при промоушене.

import { changedFiles, isBlock } from './_lib.mjs';

const SRC_RE = /^(web\/src|packages\/[^/]+\/src)\/.*\.(ts|tsx)$/;
const TEST_RE = /\.(test|spec)\.(ts|tsx)$/;
const DECL_RE = /\.d\.ts$/;

function isLogicSource(f) {
  return SRC_RE.test(f) && !TEST_RE.test(f) && !DECL_RE.test(f);
}

// Кандидаты-тесты для исходника dir/Name.tsx → dir/Name.test.{ts,tsx}, dir/Name.spec.{ts,tsx}
function testCandidates(src) {
  const base = src.replace(/\.(ts|tsx)$/, '');
  return [`${base}.test.ts`, `${base}.test.tsx`, `${base}.spec.ts`, `${base}.spec.tsx`];
}

function main() {
  const files = changedFiles();
  const changedTests = new Set(files.filter((f) => TEST_RE.test(f)));
  const sources = files.filter(isLogicSource);

  const uncovered = sources.filter(
    (src) => !testCandidates(src).some((t) => changedTests.has(t))
  );

  const block = isBlock();
  if (uncovered.length === 0) {
    if (sources.length) console.log(`[tests-for-new-code] OK: ${sources.length} исходник(ов) с тестами.`);
    return 0;
  }

  const tag = block ? 'BLOCK' : 'WARN';
  console.log(`[tests-for-new-code] ${tag}: исходники без изменения соответствующего теста:`);
  for (const f of uncovered) console.log(`  - ${f}  (ожидался один из: ${testCandidates(f).join(', ')})`);
  console.log(`[tests-for-new-code] как закрыть — .cursor/skills/tests-for-new-code/SKILL.md`);
  return block ? 1 : 0;
}

process.exit(main());
