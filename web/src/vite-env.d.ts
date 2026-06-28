/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string
declare const __APP_GIT_SHORT__: string

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_VAPID_PUBLIC_KEY?: string
  readonly VITE_LEGAL_PRIVACY_URL?: string
  readonly VITE_LEGAL_TERMS_URL?: string
  readonly VITE_LEGAL_PERSONAL_DATA_URL?: string
  readonly VITE_FEEDBACK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
