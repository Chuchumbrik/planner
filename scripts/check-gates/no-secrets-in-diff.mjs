#!/usr/bin/env node
// Гейт `no-secrets-in-diff` — см. .cursor/skills/security-hygiene/SKILL.md
// По умолчанию warn; block — GATE_BLOCK=1

import { changedPatch, isBlockWhenPromoted } from './_lib.mjs';

const PATTERNS = [
  { name: 'postgresql-url', re: /postgresql:\/\/[^\s'"]+/i },
  { name: 'jwt-eyJ', re: /['"]eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./ },
  { name: 'private-key-block', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'vapid-private-inline', re: /VAPID_PRIVATE(?:_KEY)?\s*=\s*['"][^'"]+['"]/i },
  { name: 'github-token-gh', re: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { name: 'generic-api-key', re: /(?:api[_-]?key|secret|password)\s*[:=]\s*['"][^'"]{8,}['"]/i },
];

function main() {
  const patch = changedPatch();
  if (!patch.trim()) return 0;

  const hits = [];
  for (const { name, re } of PATTERNS) {
    if (re.test(patch)) hits.push(name);
  }

  if (hits.length === 0) return 0;

  const block = isBlockWhenPromoted();
  const tag = block ? 'BLOCK' : 'WARN';
  console.log(`[no-secrets-in-diff] ${tag}: возможные секреты в diff (${hits.join(', ')})`);
  console.log('[no-secrets-in-diff] секреты — только env / Amvera LK; см. docs/amvera-secrets.md');
  console.log('[no-secrets-in-diff] как закрыть — .cursor/skills/security-hygiene/SKILL.md');
  return block ? 1 : 0;
}

process.exit(main());
