#!/usr/bin/env node
/**
 * Cursor hook (stop / subagentStop): если в рабочем дереве есть логические исходники
 * без колокированного теста — вернуть followup_message с просьбой запустить unit-test-writer.
 *
 * Критерии исходников совпадают с scripts/check-gates/tests-for-new-code.mjs.
 * stdin: JSON payload хука; stdout: {} или { "followup_message": "..." }.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SRC_RE = /^(web\/src|packages\/[^/]+\/src)\/.*\.(ts|tsx)$/;
const DATA_RE = /^web\/src\/data\//;
const TEST_RE = /\.(test|spec)\.(ts|tsx)$/;
const DECL_RE = /\.d\.ts$/;
const SKIP_SUBAGENT = /unit-test-writer|autotest-writer/i;

function isLogicSource(f) {
  return SRC_RE.test(f) && !DATA_RE.test(f) && !TEST_RE.test(f) && !DECL_RE.test(f);
}

function testCandidates(src) {
  const base = src.replace(/\.(ts|tsx)$/, '');
  return [`${base}.test.ts`, `${base}.test.tsx`, `${base}.spec.ts`, `${base}.spec.tsx`];
}

function normalizePath(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '');
}

function gitDiffHead() {
  try {
    return execFileSync('git', ['diff', 'HEAD', '--name-only', '--diff-filter=ACMR'], {
      encoding: 'utf8',
    })
      .split('\n')
      .map((s) => normalizePath(s.trim()))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function uncoveredSources(files) {
  const changedTests = new Set(files.filter((f) => TEST_RE.test(f)));
  const sources = files.filter(isLogicSource);
  return sources.filter((src) => !testCandidates(src).some((t) => changedTests.has(t)));
}

function shouldSkipSubagent(input) {
  const hay = [input.subagent_type, input.description, input.task].filter(Boolean).join(' ');
  return SKIP_SUBAGENT.test(hay);
}

function buildMessage(uncovered) {
  const shown = uncovered.slice(0, 20);
  const tail = uncovered.length > 20 ? `\n- … и ещё ${uncovered.length - 20}` : '';
  const list = shown.map((f) => `- ${f}`).join('\n');

  return [
    'После правки логики в этом чате нужно закрыть тест-контур (Cursor hook).',
    '',
    'Запусти **отдельно** субагента **unit-test-writer** (Task `subagent_type: unit-test-writer` или `/unit-test-writer`).',
    '',
    '**Исходники без колокированного теста в рабочем дереве:**',
    list + tail,
    '',
    'Канон: `.cursor/skills/unit-test-writer/SKILL.md`, оркестратор: `.cursor/skills/test-contour-orchestrator/SKILL.md`.',
    '',
    'После тестов: `cd web && npx vitest run`.',
  ].join('\n');
}

function main() {
  const raw = readFileSync(0, 'utf8').trim();
  if (!raw) {
    console.log('{}');
    return;
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    console.log('{}');
    return;
  }

  if (input.status !== 'completed') {
    console.log('{}');
    return;
  }

  if (input.hook_event_name === 'subagentStop' && shouldSkipSubagent(input)) {
    console.log('{}');
    return;
  }

  const fromHook = (input.modified_files || []).map(normalizePath).filter(Boolean);
  const files = [...new Set([...gitDiffHead(), ...fromHook])];
  const uncovered = uncoveredSources(files);

  if (uncovered.length === 0) {
    console.log('{}');
    return;
  }

  console.log(JSON.stringify({ followup_message: buildMessage(uncovered) }));
}

main();
