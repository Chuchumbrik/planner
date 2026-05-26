import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { appLocalDateKey, getAppNow, getQaClockConfig, subscribeAppNow } from '@/lib/appNow'

type QaClockContextValue = {
  now: Date
  todayKey: string
  enabled: boolean
  tick: number
}

const QaClockContext = createContext<QaClockContextValue | null>(null)

export function QaClockProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0)

  useEffect(() => subscribeAppNow(() => setTick((n) => n + 1)), [])

  const value = useMemo((): QaClockContextValue => {
    void tick
    const config = getQaClockConfig()
    const now = getAppNow()
    return {
      now,
      todayKey: appLocalDateKey(now),
      enabled: Boolean(config?.enabled),
      tick,
    }
  }, [tick])

  return <QaClockContext.Provider value={value}>{children}</QaClockContext.Provider>
}

export function useAppNow(): QaClockContextValue {
  const ctx = useContext(QaClockContext)
  if (!ctx) {
    const now = getAppNow()
    return {
      now,
      todayKey: appLocalDateKey(now),
      enabled: false,
      tick: 0,
    }
  }
  return ctx
}
