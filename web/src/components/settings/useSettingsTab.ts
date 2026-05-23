import { useCallback, useEffect, useState } from 'react'

export type SettingsTabId = 'general' | 'privacy' | 'planning' | 'notifications' | 'admin'

const TAB_IDS: SettingsTabId[] = ['general', 'privacy', 'planning', 'notifications', 'admin']

const LEGACY_HASH: Record<string, SettingsTabId> = {
  'seed-backup': 'privacy',
}

function tabFromHash(hash: string, allowAdmin: boolean): SettingsTabId {
  const raw = hash.replace(/^#/, '').trim()
  const id = (LEGACY_HASH[raw] ?? raw) as SettingsTabId
  if (id === 'admin' && !allowAdmin) return 'general'
  return TAB_IDS.includes(id) ? id : 'general'
}

export function useSettingsTab(allowAdmin: boolean): [SettingsTabId, (tab: SettingsTabId) => void] {
  const [tab, setTabState] = useState<SettingsTabId>(() =>
    tabFromHash(typeof window !== 'undefined' ? window.location.hash : '', allowAdmin),
  )

  useEffect(() => {
    function onHashChange() {
      setTabState(tabFromHash(window.location.hash, allowAdmin))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [allowAdmin])

  const setTab = useCallback(
    (next: SettingsTabId) => {
      if (next === 'admin' && !allowAdmin) return
      setTabState(next)
      const nextHash = `#${next}`
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
      }
    },
    [allowAdmin],
  )

  return [tab, setTab]
}
