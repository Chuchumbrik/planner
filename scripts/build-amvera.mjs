#!/usr/bin/env node
/**
 * Amvera Node.js Browser: VITE_* must be present in the build shell (not Amvera runtime env).
 * Set them in Amvera → amvera.yaml override → build.additionalCommands, e.g.:
 *   VITE_SUPABASE_URL=https://<ref>.supabase.co VITE_SUPABASE_ANON_KEY=eyJ… VITE_VAPID_PUBLIC_KEY=… npm run build:amvera
 */
import { spawnSync } from 'node:child_process';

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missing = required.filter((key) => !String(process.env[key] ?? '').trim());

if (missing.length > 0) {
  console.error('[build:amvera] Missing required environment variables:', missing.join(', '));
  console.error('[build:amvera] Amvera does not inject runtime env into the build phase.');
  console.error('[build:amvera] In Amvera panel, override build.additionalCommands (see web/README.md → Amvera):');
  console.error(
    '  VITE_SUPABASE_URL=https://<ref>.supabase.co VITE_SUPABASE_ANON_KEY=<anon> VITE_VAPID_PUBLIC_KEY=<vapid> npm run build:amvera',
  );
  process.exit(1);
}

if (!String(process.env.VITE_VAPID_PUBLIC_KEY ?? '').trim()) {
  console.warn('[build:amvera] VITE_VAPID_PUBLIC_KEY is empty — Web Push subscribe may fail in the stage build.');
}

const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
