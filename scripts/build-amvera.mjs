#!/usr/bin/env node
/**
 * Amvera Node.js Browser: VITE_* must be present in the build shell (not Amvera runtime env).
 * Stage/prod on Amvera — API-only (no Supabase): set VITE_API_URL to planner-api HTTPS origin.
 * Legacy Vercel / hybrid: VITE_SUPABASE_* (optional here if VITE_API_URL is set).
 */
import { spawnSync } from 'node:child_process';

const apiUrl = String(process.env.VITE_API_URL ?? '').trim();
const supabaseUrl = String(process.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnon = String(process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!apiUrl) {
  console.error('[build:amvera] Missing required environment variable: VITE_API_URL');
  console.error('[build:amvera] Amvera stage uses planner-api only (no Supabase in the browser build).');
  console.error('[build:amvera] In Amvera → planner-web → override build.additionalCommands, e.g.:');
  console.error(
    '  VITE_API_URL=https://planner-api-chuchumbrik.amvera.io VITE_VAPID_PUBLIC_KEY=<vapid> npm run build:amvera',
  );
  process.exit(1);
}

if (supabaseUrl || supabaseAnon) {
  console.warn(
    '[build:amvera] VITE_SUPABASE_* is set but ignored when VITE_API_URL is present (Amvera API-only build).',
  );
}

if (!String(process.env.VITE_VAPID_PUBLIC_KEY ?? '').trim()) {
  console.warn('[build:amvera] VITE_VAPID_PUBLIC_KEY is empty — Web Push subscribe may fail until notify module ships.');
}

const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
