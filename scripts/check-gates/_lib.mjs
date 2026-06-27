// Общие помощники для гейтов проекта (scripts/check-gates/*). См. RULES.md §2.
import { execFileSync } from 'node:child_process';

// Изменённые файлы: staged (pre-commit) или дифф против GATE_BASE (CI).
// execFile с массивом аргументов — без шелла, GATE_BASE не интерпретируется как команда.
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

// Блокирующий режим (промоушен warn -> block).
export const isBlock = () => process.env.GATE_BLOCK === '1';
