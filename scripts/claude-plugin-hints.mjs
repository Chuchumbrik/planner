#!/usr/bin/env node
// Claude-only: на UserPromptSubmit подсказывает, какой плагин уместен под запрос.
// Вход — JSON на stdin (поле prompt). Выход — строка в stdout, харнесс добавит её в контекст.
// Конфиг — .claude/plugin-hints.json (редактируемый список {match, hint}). Без совпадений — молчит.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = join(ROOT, '.claude/plugin-hints.json');

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

function getPrompt(raw) {
  try {
    const j = JSON.parse(raw);
    return String(j.prompt ?? j.user_prompt ?? j.message ?? '');
  } catch {
    return raw;
  }
}

function main() {
  if (!existsSync(CONFIG)) return;
  const prompt = getPrompt(readStdin()).toLowerCase();
  if (!prompt.trim()) return;
  let rules;
  try { rules = JSON.parse(readFileSync(CONFIG, 'utf8')); } catch { return; }
  const hits = [];
  for (const r of rules) {
    if ((r.match || []).some((m) => prompt.includes(String(m).toLowerCase()))) hits.push(r.hint);
  }
  if (hits.length) {
    console.log('Подсказка по плагинам (опционально): ' + [...new Set(hits)].join(' · '));
  }
}

main();
