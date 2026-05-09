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
import {
  applyAddChecklistItem,
  applyAddGroup,
  applyCreateTask,
  applyDeleteDraft,
  applyDeleteGroup,
  applyPatchTask,
  applyRemoveChecklistItem,
  applyRemoveTask,
  applyRenameGroup,
  applySetPriorityLabel,
  applySetTaskColor,
  applySetTaskEstimatedMinutes,
  applySetTaskGroup,
  applySetTaskPriorityRank,
  applySetTaskScheduledLocalDate,
  applySetTaskTimePlan,
  applyToggleChecklistItem,
  applyToggleTask,
  applyUpsertDraft,
  type VaultDeps,
  decryptUtf8,
  deriveAesKey,
  encryptUtf8,
  normalizeVault,
  DEFAULT_GROUP_ID,
  emptyVault,
  type CreateTaskInput,
  type PriorityRank,
  type Task,
  type TaskColorKey,
  type TaskDraft,
  type TaskTimeMode,
  type VaultPayload,
  VAULT_JSON_WARN_BYTES,
  VAULT_REMOTE_SAVE_DEBOUNCE_MS,
} from '@motivator/core'
import { createSupabaseVaultRemote } from '@/infrastructure/supabaseVaultRemote'
import i18n from '@/i18n'
import { supabase } from '@/lib/supabase'

const SEED_KEY = 'motivator_seed_b64'
const PASSWORD_KEY = 'motivator_kdf_password'

const vaultDepsDefault: VaultDeps = {
  newId: () => crypto.randomUUID(),
  nowIso: () => new Date().toISOString(),
}

type VaultContextValue = {
  ready: boolean
  unlocked: boolean
  remoteHydrated: boolean
  decryptFailed: boolean
  savePending: boolean
  lastSyncedAt: number | null
  vault: VaultPayload
  remoteError: string | null
  saveSeed: (seedB64: string, password: string) => Promise<void>
  lock: () => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<void>
  /** @deprecated используйте createTask */
  addTask: (
    title: string,
    opts?: {
      groupId?: string
      colorKey?: TaskColorKey
      scheduledLocalDate?: string | null
    },
  ) => Promise<void>
  upsertDraft: (draft: TaskDraft) => Promise<void>
  deleteDraft: (draftId: string) => Promise<void>
  toggleTask: (id: string, occurrenceDayKey?: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
  setTaskColor: (taskId: string, colorKey: TaskColorKey) => Promise<void>
  setTaskGroup: (taskId: string, groupId: string) => Promise<void>
  addChecklistItem: (taskId: string, title: string) => Promise<void>
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>
  removeChecklistItem: (taskId: string, itemId: string) => Promise<void>
  addGroup: (name: string) => Promise<void>
  renameGroup: (groupId: string, name: string) => Promise<void>
  deleteGroup: (groupId: string) => Promise<void>
  setPriorityLabel: (rank: PriorityRank, label: string) => Promise<void>
  setTaskPriorityRank: (taskId: string, rank: PriorityRank) => Promise<void>
  setTaskScheduledLocalDate: (taskId: string, date: string | null) => Promise<void>
  setTaskEstimatedMinutes: (taskId: string, minutes: number | null) => Promise<void>
  setTaskTimePlan: (
    taskId: string,
    mode: TaskTimeMode,
    minutesFromMidnight: number | null,
  ) => Promise<void>
  patchTask: (taskId: string, patch: Partial<Task>) => Promise<void>
}

const VaultContext = createContext<VaultContextValue | null>(null)

export function VaultProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const vaultRemote = useMemo(
    () => (supabase ? createSupabaseVaultRemote(supabase) : null),
    [],
  )
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [vault, setVault] = useState<VaultPayload>(emptyVault())
  const [ready, setReady] = useState(false)
  const [remoteError, setRemoteError] = useState<string | null>(null)
  const [remoteHydrated, setRemoteHydrated] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [decryptFailed, setDecryptFailed] = useState(false)
  const versionRef = useRef(1)
  const revisionRef = useRef(0)
  const latestPayloadRef = useRef<VaultPayload | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistChainRef = useRef<Promise<void>>(Promise.resolve())

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

  const runPersistUntilCaughtUp = useCallback(async () => {
    const userId = session?.user?.id
    if (!cryptoKey || !userId || !vaultRemote) {
      setSavePending(false)
      return
    }

    let needsAnotherPass = true
    while (needsAnotherPass) {
      needsAnotherPass = false
      const revAtStart = revisionRef.current
      const normalized = latestPayloadRef.current
      if (!normalized) {
        setSavePending(false)
        return
      }

      try {
        const json = JSON.stringify(normalized)
        if (
          import.meta.env.DEV &&
          new TextEncoder().encode(json).length > VAULT_JSON_WARN_BYTES
        ) {
          console.warn('[motivator] vault JSON size exceeds VAULT_JSON_WARN_BYTES')
        }
        const ciphertext = await encryptUtf8(json, cryptoKey)
        const nextVersion = versionRef.current + 1
        await vaultRemote.upsertVault(userId, ciphertext, nextVersion)
        setRemoteError(null)
        versionRef.current = nextVersion
        setLastSyncedAt(Date.now())

        if (revisionRef.current !== revAtStart) {
          needsAnotherPass = true
          continue
        }
        setSavePending(false)
        return
      } catch (e) {
        setRemoteError(e instanceof Error ? e.message : String(e))
        setSavePending(false)
        return
      }
    }
  }, [cryptoKey, session, vaultRemote])

  const schedulePersist = useCallback(() => {
    if (!cryptoKey || !session?.user || !vaultRemote) return
    setSavePending(true)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      persistChainRef.current = persistChainRef.current.then(() => runPersistUntilCaughtUp())
    }, VAULT_REMOTE_SAVE_DEBOUNCE_MS)
  }, [cryptoKey, session, vaultRemote, runPersistUntilCaughtUp])

  const flushPendingUpload = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    persistChainRef.current = persistChainRef.current.then(() => runPersistUntilCaughtUp())
    await persistChainRef.current
  }, [runPersistUntilCaughtUp])

  const lock = useCallback(async () => {
    try {
      await flushPendingUpload()
    } catch {
      /* best-effort перед очисткой ключа */
    }
    setCryptoKey(null)
    localStorage.removeItem(SEED_KEY)
    localStorage.removeItem(PASSWORD_KEY)
    setVault(emptyVault())
    versionRef.current = 1
    revisionRef.current = 0
    latestPayloadRef.current = null
    setDecryptFailed(false)
    setRemoteHydrated(false)
    setLastSyncedAt(null)
    setRemoteError(null)
  }, [flushPendingUpload])

  const pushVault = useCallback(
    async (next: VaultPayload) => {
      const normalized = normalizeVault(next as unknown)
      setVault(normalized)
      latestPayloadRef.current = normalized
      revisionRef.current += 1

      if (!cryptoKey || !session?.user || !vaultRemote) return
      schedulePersist()
    },
    [cryptoKey, session, vaultRemote, schedulePersist],
  )

  useEffect(() => {
    if (!cryptoKey || !session?.user || !vaultRemote) {
      startTransition(() => setRemoteHydrated(false))
      return
    }

    let cancelled = false

    void (async () => {
      startTransition(() => setRemoteHydrated(false))
      setRemoteError(null)
      setDecryptFailed(false)

      try {
        const row = await vaultRemote.fetchVault(session.user.id)
        if (cancelled) return

        if (!row?.ciphertext) {
          const empty = emptyVault()
          try {
            const ciphertext = await encryptUtf8(JSON.stringify(empty), cryptoKey)
            await vaultRemote.upsertVault(session.user.id, ciphertext, 1)
            if (cancelled) return
            setVault(empty)
            latestPayloadRef.current = empty
            revisionRef.current = 0
            setDecryptFailed(false)
            versionRef.current = 1
            setLastSyncedAt(Date.now())
          } catch (e) {
            if (!cancelled) {
              setRemoteError(e instanceof Error ? e.message : String(e))
            }
          }
          if (!cancelled) setRemoteHydrated(true)
          return
        }

        try {
          const plain = await decryptUtf8(row.ciphertext, cryptoKey)
          const parsed = normalizeVault(JSON.parse(plain) as unknown)
          setVault(parsed)
          latestPayloadRef.current = parsed
          revisionRef.current = 0
          setDecryptFailed(false)
          versionRef.current = row.version
          setLastSyncedAt(Date.now())
        } catch {
          setDecryptFailed(true)
          setRemoteError(i18n.t('vault.decryptError'))
        }
        if (!cancelled) setRemoteHydrated(true)
      } catch (e) {
        if (!cancelled) {
          setRemoteError(e instanceof Error ? e.message : String(e))
          setRemoteHydrated(true)
        }
      }
    })()

    return () => {
      cancelled = true
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [cryptoKey, session, vaultRemote])

  const mutate = useCallback(
    async (fn: (v: VaultPayload) => VaultPayload) => {
      if (!remoteHydrated) return
      await pushVault(fn(vault))
    },
    [pushVault, remoteHydrated, vault],
  )

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      if (!remoteHydrated) return
      if (!input.title.trim()) return
      await pushVault(applyCreateTask(vault, input, vaultDepsDefault))
    },
    [pushVault, remoteHydrated, vault],
  )

  const addTask = useCallback(
    async (
      title: string,
      opts?: {
        groupId?: string
        colorKey?: TaskColorKey
        scheduledLocalDate?: string | null
      },
    ) => {
      await createTask({
        title,
        groupId:
          opts?.groupId && vault.groups.some((g) => g.id === opts.groupId)
            ? opts.groupId
            : DEFAULT_GROUP_ID,
        colorKey: opts?.colorKey ?? 'zinc',
        priorityRank: 3,
        scheduledLocalDate:
          opts?.scheduledLocalDate === undefined ? null : opts.scheduledLocalDate,
        estimatedMinutes: null,
        timeMode: 'none',
        timeMinutesFromMidnight: null,
        recurrence: null,
        recurrenceAnchorLocalDate: null,
      })
    },
    [createTask, vault.groups],
  )

  const upsertDraft = useCallback(
    async (draft: TaskDraft) => {
      await mutate((v) => applyUpsertDraft(v, draft))
    },
    [mutate],
  )

  const deleteDraft = useCallback(
    async (draftId: string) => {
      await mutate((v) => applyDeleteDraft(v, draftId))
    },
    [mutate],
  )

  const toggleTask = useCallback(
    async (id: string, occurrenceDayKey?: string) => {
      await mutate((v) => applyToggleTask(v, id, occurrenceDayKey, vaultDepsDefault))
    },
    [mutate],
  )

  const removeTask = useCallback(
    async (id: string) => {
      await mutate((v) => applyRemoveTask(v, id))
    },
    [mutate],
  )

  const setTaskColor = useCallback(
    async (taskId: string, colorKey: TaskColorKey) => {
      await mutate((v) => applySetTaskColor(v, taskId, colorKey, vaultDepsDefault))
    },
    [mutate],
  )

  const setTaskGroup = useCallback(
    async (taskId: string, groupId: string) => {
      await mutate((v) => applySetTaskGroup(v, taskId, groupId, vaultDepsDefault))
    },
    [mutate],
  )

  const addChecklistItem = useCallback(
    async (taskId: string, title: string) => {
      if (!title.trim()) return
      await mutate((v) => applyAddChecklistItem(v, taskId, title, vaultDepsDefault))
    },
    [mutate],
  )

  const toggleChecklistItem = useCallback(
    async (taskId: string, itemId: string) => {
      await mutate((v) => applyToggleChecklistItem(v, taskId, itemId, vaultDepsDefault))
    },
    [mutate],
  )

  const removeChecklistItem = useCallback(
    async (taskId: string, itemId: string) => {
      await mutate((v) => applyRemoveChecklistItem(v, taskId, itemId))
    },
    [mutate],
  )

  const addGroup = useCallback(
    async (name: string) => {
      if (!name.trim()) return
      await mutate((v) => applyAddGroup(v, name, vaultDepsDefault))
    },
    [mutate],
  )

  const renameGroup = useCallback(
    async (groupId: string, name: string) => {
      if (!name.trim()) return
      await mutate((v) => applyRenameGroup(v, groupId, name))
    },
    [mutate],
  )

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (groupId === DEFAULT_GROUP_ID) return
      await mutate((v) => applyDeleteGroup(v, groupId))
    },
    [mutate],
  )

  const setPriorityLabel = useCallback(
    async (rank: PriorityRank, label: string) => {
      if (!label.trim()) return
      await mutate((v) => applySetPriorityLabel(v, rank, label))
    },
    [mutate],
  )

  const setTaskPriorityRank = useCallback(
    async (taskId: string, rank: PriorityRank) => {
      await mutate((v) => applySetTaskPriorityRank(v, taskId, rank, vaultDepsDefault))
    },
    [mutate],
  )

  const setTaskScheduledLocalDate = useCallback(
    async (taskId: string, date: string | null) => {
      await mutate((v) => applySetTaskScheduledLocalDate(v, taskId, date, vaultDepsDefault))
    },
    [mutate],
  )

  const setTaskEstimatedMinutes = useCallback(
    async (taskId: string, minutes: number | null) => {
      await mutate((v) =>
        applySetTaskEstimatedMinutes(v, taskId, minutes, vaultDepsDefault),
      )
    },
    [mutate],
  )

  const setTaskTimePlan = useCallback(
    async (taskId: string, mode: TaskTimeMode, minutesFromMidnight: number | null) => {
      await mutate((v) =>
        applySetTaskTimePlan(v, taskId, mode, minutesFromMidnight, vaultDepsDefault),
      )
    },
    [mutate],
  )

  const patchTask = useCallback(
    async (taskId: string, patch: Partial<Task>) => {
      await mutate((v) => applyPatchTask(v, taskId, patch, vaultDepsDefault))
    },
    [mutate],
  )

  const value = useMemo(
    () => ({
      ready,
      unlocked,
      remoteHydrated,
      decryptFailed,
      savePending,
      lastSyncedAt,
      vault,
      remoteError,
      saveSeed,
      lock,
      createTask,
      addTask,
      upsertDraft,
      deleteDraft,
      toggleTask,
      removeTask,
      setTaskColor,
      setTaskGroup,
      addChecklistItem,
      toggleChecklistItem,
      removeChecklistItem,
      addGroup,
      renameGroup,
      deleteGroup,
      setPriorityLabel,
      setTaskPriorityRank,
      setTaskScheduledLocalDate,
      setTaskEstimatedMinutes,
      setTaskTimePlan,
      patchTask,
    }),
    [
      ready,
      unlocked,
      remoteHydrated,
      decryptFailed,
      savePending,
      lastSyncedAt,
      vault,
      remoteError,
      saveSeed,
      lock,
      createTask,
      addTask,
      upsertDraft,
      deleteDraft,
      toggleTask,
      removeTask,
      setTaskColor,
      setTaskGroup,
      addChecklistItem,
      toggleChecklistItem,
      removeChecklistItem,
      addGroup,
      renameGroup,
      deleteGroup,
      setPriorityLabel,
      setTaskPriorityRank,
      setTaskScheduledLocalDate,
      setTaskEstimatedMinutes,
      setTaskTimePlan,
      patchTask,
    ],
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault вне VaultProvider')
  return ctx
}
