// Общие помощники для гейтов и hooks (scripts/check-gates/*, .cursor/hooks/*). См. RULES.md §2.
import { execFileSync } from 'node:child_process';

// Изменённые файлы: staged (pre-commit) или дифф против GATE_BASE (CI).
export function changedFiles() {
  const base = process.env.GATE_BASE;
  const args = base
    ? ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]
    : ['diff', '--cached', '--name-only', '--diff-filter=ACMR'];
  return execFileSync('git', args, { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Staged patch (pre-commit) или diff против GATE_BASE — для content-scan гейтов.
export function changedPatch() {
  const base = process.env.GATE_BASE;
  const args = base
    ? ['diff', `${base}...HEAD`, '-U0']
    : ['diff', '--cached', '-U0'];
  return execFileSync('git', args, { encoding: 'utf8' });
}

export const isBlock = () => process.env.GATE_WARN !== '1';

/** Гейты, стартующие в warn: block только при GATE_BLOCK=1 */
export const isBlockWhenPromoted = () => process.env.GATE_BLOCK === '1';

// --- Логические исходники (tests-for-new-code, nudge-unit-test-writer) ---

export const LOGIC_SRC_RE =
  /^(web\/src|packages\/[^/]+\/src|services\/[^/]+\/src)\/.*\.(ts|tsx)$/;
export const DATA_PATH_RE = /^web\/src\/data\//;
export const TEST_PATH_RE = /\.(test|spec)\.(ts|tsx)$/;
export const DECL_PATH_RE = /\.d\.ts$/;

export function isLogicSource(f) {
  return (
    LOGIC_SRC_RE.test(f) &&
    !DATA_PATH_RE.test(f) &&
    !TEST_PATH_RE.test(f) &&
    !DECL_PATH_RE.test(f)
  );
}

export function testCandidates(src) {
  const base = src.replace(/\.(ts|tsx)$/, '');
  return [`${base}.test.ts`, `${base}.test.tsx`, `${base}.spec.ts`, `${base}.spec.tsx`];
}

export function uncoveredLogicSources(files) {
  const changedTests = new Set(files.filter((f) => TEST_PATH_RE.test(f)));
  const sources = files.filter(isLogicSource);
  return sources.filter((src) => !testCandidates(src).some((t) => changedTests.has(t)));
}
