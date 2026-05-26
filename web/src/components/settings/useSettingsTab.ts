import { useCallback, useEffect, useState } from 'react'

export type SettingsTabId = 'general' | 'privacy' | 'planning' | 'notifications'

const TAB_IDS: SettingsTabId[] = ['general', 'privacy', 'planning', 'notifications']

const LEGACY_HASH: Record<string, SettingsTabId> = {
  'seed-backup': 'privacy',
  'security-log': 'privacy',
}

function tabFromHash(hash: string): SettingsTabId {
  const raw = hash.replace(/^#/, '').trim()
  if (raw === 'admin') return 'general'
  const id = (LEGACY_HASH[raw] ?? raw) as SettingsTabId
  return TAB_IDS.includes(id) ? id : 'general'
}

export function useSettingsTab(): [SettingsTabId, (tab: SettingsTabId) => void] {
  const [tab, setTabState] = useState<SettingsTabId>(() =>
    tabFromHash(typeof window !== 'undefined' ? window.location.hash : ''),
  )

  useEffect(() => {
    function onHashChange() {
      setTabState(tabFromHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const setTab = useCallback((next: SettingsTabId) => {
    setTabState(next)
    const nextHash = `#${next}`
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
    }
  }, [])

  return [tab, setTab]
}
