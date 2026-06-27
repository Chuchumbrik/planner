#!/usr/bin/env node
// Проекция правил проекта (.cursor/skills/*) под Claude: пересобирает управляемый блок в CLAUDE.md.
// Детерминированно и идемпотентно — без LLM. Берёт только правила со scope, включающим `claude`.
// Триггеры: .githooks/post-merge (на git pull/merge) и Claude SessionStart-хук (.claude/settings.json).
// Запуск вручную: node scripts/project-rules-to-claude.mjs

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(ROOT, '.cursor/skills');
const CLAUDE_MD = join(ROOT, 'CLAUDE.md');
const BEGIN = '<!-- RULES:BEGIN (авто-генерация scripts/project-rules-to-claude.mjs — не редактировать вручную) -->';
const END = '<!-- RULES:END -->';

// Мини-парсер YAML-frontmatter под наш контракт: key: value, массивы [a, b].
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const fm = {};
  for (const line of text.slice(3, end).split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    }
    fm[key] = val;
  }
  return fm;
}

function loadRules() {
  if (!existsSync(SKILLS_DIR)) return [];
  const rules = [];
  for (const name of readdirSync(SKILLS_DIR)) {
    const file = join(SKILLS_DIR, name, 'SKILL.md');
    if (!existsSync(file)) continue;
    const fm = parseFrontmatter(readFileSync(file, 'utf8'));
    if (!fm) continue;
    const scope = Array.isArray(fm.scope) ? fm.scope : fm.scope ? [fm.scope] : [];
    if (!scope.includes('claude')) continue;        // только объявленное для Claude
    if ((fm.status || 'active') !== 'active') continue;
    rules.push({ id: fm.id || name, file: `.cursor/skills/${name}/SKILL.md`, ...fm, scope });
  }
  return rules;
}

function render(rules) {
  const line = (r, extra = '') => `- \`${r.id}\` — ${r['applies-when'] || r.title || ''}.${extra} Канон: \`${r.file}\`.`;
  const sections = [];
  const gates = rules.filter((r) => r.class === 'gate');
  const inv = rules.filter((r) => r.class === 'process-invariant');
  const subs = rules.filter((r) => r.kind === 'subagent-spec');
  const guid = rules.filter((r) => r.class === 'guidance' && r.kind !== 'subagent-spec');

  if (gates.length) sections.push('**Гейты (обязательные проверки):**\n' +
    gates.map((r) => line(r, r['enforced-by'] ? ` Проверка: \`${r['enforced-by']}\` (${r['enforcement-level'] || ''}).` : '')).join('\n'));
  if (inv.length) sections.push('**Инварианты процесса (держатся воркфлоу, не диффом):**\n' +
    inv.map((r) => line(r, r['enforced-by'] ? ` Обеспечивает: ${r['enforced-by']}.` : '')).join('\n'));
  if (subs.length) sections.push('**Субагенты:**\n' + subs.map((r) => line(r)).join('\n'));
  if (guid.length) sections.push('**Подсказки:**\n' + guid.map((r) => line(r)).join('\n'));

  return [
    BEGIN,
    '## Правила проекта (проекция под Claude)',
    '',
    '_Сгенерировано из `.cursor/skills/*` (scope включает `claude`). Источник истины — там; блок переписывается автоматически, руками не править._',
    '',
    sections.join('\n\n') || '_(правил со scope `claude` пока нет)_',
    END,
  ].join('\n');
}

function main() {
  const rules = loadRules();
  const block = render(rules);
  let md = existsSync(CLAUDE_MD) ? readFileSync(CLAUDE_MD, 'utf8') : '# Инструкции для Claude — проект Planner\n';
  const b = md.indexOf(BEGIN);
  const e = md.indexOf(END);
  if (b !== -1 && e !== -1) {
    md = md.slice(0, b) + block + md.slice(e + END.length);
  } else {
    md = md.replace(/\s*$/, '') + '\n\n---\n\n' + block + '\n';
  }
  writeFileSync(CLAUDE_MD, md);
  console.log(`[project-rules] спроецировано под Claude: ${rules.length} правил(а)`);
}

main();
