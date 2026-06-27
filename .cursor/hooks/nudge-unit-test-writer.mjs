#!/usr/bin/env node
/**
 * Cursor hook (stop / subagentStop): nudge unit-test-writer when logic sources lack colocated tests.
 * Criteria shared with scripts/check-gates/_lib.mjs
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isLogicSource, uncoveredLogicSources } from '../../scripts/check-gates/_lib.mjs';

const SKIP_SUBAGENT = /unit-test-writer|autotest-writer/i;

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
    'После тестов: `cd web && npx vitest run` (и тесты workspace API при правках `services/planner-api`).',
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
  const uncovered = uncoveredLogicSources(files);

  if (uncovered.length === 0) {
    console.log('{}');
    return;
  }

  console.log(JSON.stringify({ followup_message: buildMessage(uncovered) }));
}

main();
