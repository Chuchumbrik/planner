import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { FileDefectModal } from '@/components/FileDefectModal'
import { DefectReportContext } from '@/defect/defectReportContext'
import { motivatorAppRole } from '@/lib/motivatorRole'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

function defectFabEligiblePath(pathname: string): boolean {
  if (pathname.startsWith('/app')) return true
  if (pathname === '/settings') return true
  return false
}

export function DefectReportProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { session, isAdmin, isBetaTester } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const openDefectReport = useCallback(() => setOpen(true), [])
  const closeDefectReport = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ openDefectReport, closeDefectReport }),
    [openDefectReport, closeDefectReport],
  )

  const showFab =
    Boolean(session && (isAdmin || isBetaTester) && defectFabEligiblePath(location.pathname))

  const localeTag: 'ru' | 'en' =
    i18n.language === 'en' || i18n.language.startsWith('en-') ? 'en' : 'ru'

  return (
    <DefectReportContext.Provider value={value}>
      {children}
      {session && isSupabaseConfigured && supabase ? (
        <FileDefectModal
          open={open}
          onClose={closeDefectReport}
          supabase={supabase}
          localeTag={localeTag}
          pathname={location.pathname}
          userId={session.user.id}
          motivatorRole={motivatorAppRole(session)}
        />
      ) : null}
      {showFab ? (
        <button
          type="button"
          className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-800/80 bg-emerald-950/95 text-xl text-emerald-100 shadow-xl backdrop-blur-sm hover:bg-emerald-900/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80"
          style={{
            right: 'max(1rem, env(safe-area-inset-right, 0px))',
            bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
          }}
          aria-label={t('settings.fileDefectFabAria')}
          onClick={openDefectReport}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
            aria-hidden
          >
            <path d="m8 2 1.88 1.88" />
            <path d="M14.12 3.88 16 2" />
            <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
            <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
            <path d="M12 20v-9" />
            <path d="M6.53 9C4.6 8.6 3 7.1 3 5" />
            <path d="M6 13H2" />
            <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
            <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
            <path d="M22 13h-4" />
            <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
          </svg>
        </button>
      ) : null}
    </DefectReportContext.Provider>
  )
}
