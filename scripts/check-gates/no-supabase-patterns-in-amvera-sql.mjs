#!/usr/bin/env node
// Гейт `no-supabase-patterns-in-amvera-sql` — см. .cursor/skills/sql-amvera-migration-adaptation/SKILL.md
// Только SQL под services/**/migrations. По умолчанию warn; block — GATE_BLOCK=1

import { changedFiles, changedPatch, isBlockWhenPromoted } from './_lib.mjs';

const MIGRATION_RE = /^services\/[^/]+\/migrations\/.*\.sql$/;

const FORBIDDEN = [
  { name: 'auth.uid()', re: /\bauth\.uid\s*\(\s*\)/i },
  { name: 'enable row level security', re: /\benable\s+row\s+level\s+security\b/i },
  { name: 'pg_net', re: /\bpg_net\b/i },
  { name: 'supabase auth.users fk', re: /references\s+auth\.users/i },
];

function main() {
  const files = changedFiles().filter((f) => MIGRATION_RE.test(f));
  if (files.length === 0) return 0;

  const patch = changedPatch();
  const hits = [];
  for (const { name, re } of FORBIDDEN) {
    if (re.test(patch)) hits.push(name);
  }

  if (hits.length === 0) {
    console.log(`[no-supabase-patterns-in-amvera-sql] OK: ${files.length} migration file(s).`);
    return 0;
  }

  const block = isBlockWhenPromoted();
  const tag = block ? 'BLOCK' : 'WARN';
  console.log(`[no-supabase-patterns-in-amvera-sql] ${tag}: Supabase-паттерны в Amvera SQL: ${hits.join(', ')}`);
  for (const f of files) console.log(`  - ${f}`);
  console.log('[no-supabase-patterns-in-amvera-sql] см. .cursor/skills/sql-amvera-migration-adaptation/SKILL.md');
  return block ? 1 : 0;
}

process.exit(main());
