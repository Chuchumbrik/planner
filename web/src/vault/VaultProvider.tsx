import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { decryptUtf8, deriveAesKey, encryptUtf8 } from '@/lib/cryptoVault'
import { supabase } from '@/lib/supabase'
import { emptyVault, type Task, type VaultPayload } from '@/vault/types'

const SEED_KEY = 'motivator_seed_b64'
const PASSWORD_KEY = 'motivator_kdf_password'

type VaultContextValue = {
  ready: boolean
  unlocked: boolean
  vault: VaultPayload
  remoteError: string | null
  saveSeed: (seedB64: string, password: string) => Promise<void>
  lock: () => void
  addTask: (title: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
}

const VaultContext = createContext<VaultContextValue | null>(null)

function newId(): string {
  return crypto.randomUUID()
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [vault, setVault] = useState<VaultPayload>(emptyVault())
  const [ready, setReady] = useState(false)
  const [remoteError, setRemoteError] = useState<string | null>(null)
  const versionRef = useRef(1)

  const unlocked = Boolean(cryptoKey)

  useEffect(() => {
    const seed = localStorage.getItem(SEED_KEY)
    const password = localStorage.getItem(PASSWORD_KEY) ?? ''
    if (!seed) {
      startTransition(() => {
        setCryptoKey(null)
        setReady(true)
      })
      return
    }
    let cancelled = false
    void deriveAesKey(seed, password).then((k) => {
      if (cancelled) return
      startTransition(() => {
        setCryptoKey(k)
        setReady(true)
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const saveSeed = useCallback(async (seedB64: string, password: string) => {
    const key = await deriveAesKey(seedB64, password)
    localStorage.setItem(SEED_KEY, seedB64)
    localStorage.setItem(PASSWORD_KEY, password)
    setCryptoKey(key)
  }, [])

  const lock = useCallback(() => {
    setCryptoKey(null)
    localStorage.removeItem(SEED_KEY)
    localStorage.removeItem(PASSWORD_KEY)
    setVault(emptyVault())
    versionRef.current = 1
  }, [])

  const pushVault = useCallback(
    async (next: VaultPayload) => {
      setVault(next)
      if (!cryptoKey || !session?.user || !supabase) return
      const json = JSON.stringify(next)
      const ciphertext = await encryptUtf8(json, cryptoKey)
      const nextVersion = versionRef.current + 1
      const { error } = await supabase.from('user_vault').upsert(
        {
          user_id: session.user.id,
          ciphertext,
          version: nextVersion,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      if (error) setRemoteError(error.message)
      else {
        setRemoteError(null)
        versionRef.current = nextVersion
      }
    },
    [cryptoKey, session],
  )

  useEffect(() => {
    if (!cryptoKey || !session?.user || !supabase) return
    let cancelled = false

    void (async () => {
      setRemoteError(null)
      const { data, error } = await supabase
        .from('user_vault')
        .select('ciphertext, version')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (cancelled) return
      if (error) {
        setRemoteError(error.message)
        return
      }

      if (!data?.ciphertext) {
        const json = JSON.stringify(emptyVault())
        const ciphertext = await encryptUtf8(json, cryptoKey)
        const { error: upErr } = await supabase.from('user_vault').upsert(
          {
            user_id: session.user.id,
            ciphertext,
            version: 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        if (cancelled) return
        if (upErr) setRemoteError(upErr.message)
        else {
          setVault(emptyVault())
          versionRef.current = 1
        }
        return
      }

      try {
        const plain = await decryptUtf8(data.ciphertext as string, cryptoKey)
        const parsed = JSON.parse(plain) as VaultPayload
        setVault(parsed.schemaVersion === 1 ? parsed : emptyVault())
        versionRef.current =
          typeof data.version === 'number' && data.version > 0 ? data.version : 1
      } catch {
        setRemoteError('Не удалось расшифровать vault. Проверьте seed и пароль.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [cryptoKey, session])

  const addTask = useCallback(
    async (title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      const now = new Date().toISOString()
      const task: Task = {
        id: newId(),
        title: trimmed,
        done: false,
        createdAt: now,
        updatedAt: now,
      }
      const next: VaultPayload = {
        ...vault,
        tasks: [task, ...vault.tasks],
      }
      await pushVault(next)
    },
    [pushVault, vault],
  )

  const toggleTask = useCallback(
    async (id: string) => {
      const now = new Date().toISOString()
      const next: VaultPayload = {
        ...vault,
        tasks: vault.tasks.map((t) =>
          t.id === id ? { ...t, done: !t.done, updatedAt: now } : t,
        ),
      }
      await pushVault(next)
    },
    [pushVault, vault],
  )

  const removeTask = useCallback(
    async (id: string) => {
      const next: VaultPayload = {
        ...vault,
        tasks: vault.tasks.filter((t) => t.id !== id),
      }
      await pushVault(next)
    },
    [pushVault, vault],
  )

  const value = useMemo(
    () => ({
      ready,
      unlocked,
      vault,
      remoteError,
      saveSeed,
      lock,
      addTask,
      toggleTask,
      removeTask,
    }),
    [ready, unlocked, vault, remoteError, saveSeed, lock, addTask, toggleTask, removeTask],
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault вне VaultProvider')
  return ctx
}
