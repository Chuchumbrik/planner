import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type AiAssistantContextValue = {
  open: boolean
  openAssistant: () => void
  closeAssistant: () => void
  toggleAssistant: () => void
}

const AiAssistantContext = createContext<AiAssistantContextValue | null>(null)

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openAssistant = useCallback(() => setOpen(true), [])
  const closeAssistant = useCallback(() => setOpen(false), [])
  const toggleAssistant = useCallback(() => setOpen((v) => !v), [])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const value = useMemo(
    () => ({ open, openAssistant, closeAssistant, toggleAssistant }),
    [open, openAssistant, closeAssistant, toggleAssistant],
  )

  return <AiAssistantContext.Provider value={value}>{children}</AiAssistantContext.Provider>
}

export function useAiAssistant(): AiAssistantContextValue {
  const ctx = useContext(AiAssistantContext)
  if (!ctx) {
    throw new Error('useAiAssistant must be used within AiAssistantProvider')
  }
  return ctx
}
