import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export type AdminDashboardTabId = 'summary' | 'users'

const VALID: AdminDashboardTabId[] = ['summary', 'users']

function parseTab(raw: string | null): AdminDashboardTabId {
  if (raw === 'users') return 'users'
  return 'summary'
}

export function useAdminDashboardTab(): [AdminDashboardTabId, (tab: AdminDashboardTabId) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams])

  const setTab = useCallback(
    (next: AdminDashboardTabId) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (next === 'summary') p.delete('tab')
          else p.set('tab', next)
          return p
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const raw = searchParams.get('tab')
  useEffect(() => {
    if (raw != null && raw !== '' && !VALID.includes(raw as AdminDashboardTabId)) {
      setTab('summary')
    }
  }, [raw, setTab])

  return [tab, setTab]
}
