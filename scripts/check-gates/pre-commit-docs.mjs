#!/usr/bin/env node
// Гейт `pre-commit-docs-roadmap` (RULES.md §2, .cursor/skills/pre-commit-docs-roadmap).
// Если коммит меняет продуктовый код, но НЕ трогает README/productRoadmap.ts — предупредить
// о несинхронизированной документации. Деталь и краевые случаи — в скилле.
//
// warn по умолчанию (exit 0); GATE_BLOCK=1 → exit 1. Запуск как у tests-for-new-code (staged / GATE_BASE).

import { changedFiles, isBlock } from './_lib.mjs';

const PRODUCT_RE = /^(web\/src|packages\/[^/]+\/src)\/.*\.(ts|tsx)$/;
const TEST_RE = /\.(test|spec)\.(ts|tsx)$/;
const DECL_RE = /\.d\.ts$/;
const DOC_FILES = ['web/README.md', 'web/src/data/productRoadmap.ts'];

function isProductCode(f) {
  return PRODUCT_RE.test(f) && !TEST_RE.test(f) && !DECL_RE.test(f);
}

function main() {
  const files = changedFiles();
  const product = files.filter(isProductCode);
  if (product.length === 0) return 0; // нет продуктовых правок — синхронизировать нечего

  if (DOC_FILES.some((d) => files.includes(d))) {
    console.log('[pre-commit-docs] OK: продуктовые правки сопровождены документацией.');
    return 0;
  }

  const block = isBlock();
  console.log(`[pre-commit-docs] ${block ? 'BLOCK' : 'WARN'}: продуктовые правки без обновления документации:`);
  for (const f of product.slice(0, 10)) console.log(`  - ${f}`);
  if (product.length > 10) console.log(`  …и ещё ${product.length - 10}`);
  console.log(`  ожидалось изменение одного из: ${DOC_FILES.join(', ')}`);
  console.log('[pre-commit-docs] как закрыть — .cursor/skills/pre-commit-docs-roadmap/SKILL.md');
  return block ? 1 : 0;
}

process.exit(main());
