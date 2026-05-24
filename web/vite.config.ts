import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)
const pkg = require('./package.json') as { version: string }

const rootDir = path.dirname(fileURLToPath(import.meta.url))

function gitShortSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      cwd: rootDir,
    }).trim()
  } catch {
    return 'nogit'
  }
}

const gitShort = gitShortSha()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_GIT_SHORT__: JSON.stringify(gitShort),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      /** Регистрация только из кода (`src/lib/pwaServiceWorker.ts`), см. `injectRegister`. */
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'Мотиватор',
        short_name: 'Мотиватор',
        description: 'Планировщик задач с клиентским шифрованием.',
        theme_color: '#131315',
        background_color: '#131315',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'ru',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@motivator/core': path.resolve(__dirname, '../packages/motivator-core/src/index.ts'),
    },
  },
  build: {
    /** Бандл с React/i18n/Supabase одним чанком ~520 KiB; порог выше дефолтных 500 KiB */
    chunkSizeWarningLimit: 600,
  },
})
