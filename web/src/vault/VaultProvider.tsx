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
import i18n from '@/i18n'
import { normalizeVault } from '@/vault/normalize'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_GROUP_ID,
  emptyVault,
  type CreateTaskInput,
  type PriorityRank,
  type Task,
  type TaskColorKey,
  type TaskDraft,
  type TaskGroup,
  type TaskTimeMode,
  type VaultPayload,
} from '@/vault/types'

const SEED_KEY = 'motivator_seed_b64'
const PASSWORD_KEY = 'motivator_kdf_password'

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
  lock: () => void
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
  toggleTask: (id: string) => Promise<void>
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

function newId(): string {
  return crypto.randomUUID()
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [vault, setVault] = useState<VaultPayload>(emptyVault())
  const [ready, setReady] = useState(false)
  const [remoteError, setRemoteError] = useState<string | null>(null)
  const [remoteHydrated, setRemoteHydrated] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [decryptFailed, setDecryptFailed] = useState(false)
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
    setDecryptFailed(false)
    setRemoteHydrated(false)
    setLastSyncedAt(null)
    setRemoteError(null)
  }, [])

  const pushVault = useCallback(
    async (next: VaultPayload) => {
      const normalized = normalizeVault(next as unknown)
      setVault(normalized)
      if (!cryptoKey || !session?.user || !supabase) return
      setSavePending(true)
      try {
        const json = JSON.stringify(normalized)
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
          setLastSyncedAt(Date.now())
        }
      } finally {
        setSavePending(false)
      }
    },
    [cryptoKey, session],
  )

  useEffect(() => {
    if (!cryptoKey || !session?.user || !supabase) {
      startTransition(() => setRemoteHydrated(false))
      return
    }

    let cancelled = false

    void (async () => {
      startTransition(() => setRemoteHydrated(false))
      setRemoteError(null)
      setDecryptFailed(false)

      const { data, error } = await supabase
        .from('user_vault')
        .select('ciphertext, version')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setRemoteError(error.message)
        setRemoteHydrated(true)
        return
      }

      if (!data?.ciphertext) {
        const empty = emptyVault()
        const ciphertext = await encryptUtf8(JSON.stringify(empty), cryptoKey)
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
        if (upErr) {
          setRemoteError(upErr.message)
        } else {
          setVault(empty)
          setDecryptFailed(false)
          versionRef.current = 1
          setLastSyncedAt(Date.now())
        }
        setRemoteHydrated(true)
        return
      }

      try {
        const plain = await decryptUtf8(data.ciphertext as string, cryptoKey)
        const parsed = normalizeVault(JSON.parse(plain) as unknown)
        setVault(parsed)
        setDecryptFailed(false)
        versionRef.current =
          typeof data.version === 'number' && data.version > 0 ? data.version : 1
        setLastSyncedAt(Date.now())
      } catch {
        setDecryptFailed(true)
        setRemoteError(i18n.t('vault.decryptError'))
      }
      if (!cancelled) setRemoteHydrated(true)
    })()

    return () => {
      cancelled = true
    }
  }, [cryptoKey, session])

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
      const trimmed = input.title.trim()
      if (!trimmed) return
      const base = vault
      const gid =
        input.groupId && base.groups.some((g) => g.id === input.groupId)
          ? input.groupId
          : DEFAULT_GROUP_ID
      const now = new Date().toISOString()

      let recurrence = input.recurrence
      let anchor = input.recurrenceAnchorLocalDate
      if (recurrence && !anchor) anchor = input.scheduledLocalDate
      if (recurrence && !anchor) recurrence = null
      if (!recurrence) anchor = null

      let timeMode = input.timeMode
      let timeMinutes = input.timeMinutesFromMidnight
      if (timeMode === 'none') timeMinutes = null
      if (timeMode !== 'none' && (timeMinutes == null || timeMinutes < 0 || timeMinutes > 1439)) {
        timeMode = 'none'
        timeMinutes = null
      }

      let est: number | null = input.estimatedMinutes
      if (est != null && (Number.isNaN(est) || est <= 0 || est > 24 * 60)) est = null

      const task: Task = {
        id: newId(),
        title: trimmed,
        done: false,
        createdAt: now,
        updatedAt: now,
        groupId: gid,
        colorKey: input.colorKey ?? 'zinc',
        checklist: [],
        priorityRank: input.priorityRank,
        scheduledLocalDate: input.scheduledLocalDate,
        estimatedMinutes: est,
        timeMode,
        timeMinutesFromMidnight: timeMinutes,
        recurrence,
        recurrenceAnchorLocalDate: anchor,
      }
      await pushVault({
        ...base,
        tasks: [task, ...base.tasks],
      })
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
      await mutate((v) => {
        const rest = v.drafts.filter((d) => d.id !== draft.id)
        const nextDrafts = [draft, ...rest].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        return { ...v, drafts: nextDrafts }
      })
    },
    [mutate],
  )

  const deleteDraft = useCallback(
    async (draftId: string) => {
      await mutate((v) => ({
        ...v,
        drafts: v.drafts.filter((d) => d.id !== draftId),
      }))
    },
    [mutate],
  )

  const toggleTask = useCallback(
    async (id: string) => {
      await mutate((v) => {
        const t = v.tasks.find((x) => x.id === id)
        if (!t) return v
        const nextDone = !t.done
        if (nextDone && t.checklist.length > 0 && t.checklist.some((s) => !s.done)) {
          return v
        }
        if (nextDone && t.recurrence) {
          if (!window.confirm(i18n.t('app.completeClearsRecurrence'))) return v
        }
        const now = new Date().toISOString()
        const clearsRec = Boolean(nextDone && t.recurrence)
        return {
          ...v,
          tasks: v.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  done: nextDone,
                  recurrence: clearsRec ? null : task.recurrence,
                  recurrenceAnchorLocalDate: clearsRec ? null : task.recurrenceAnchorLocalDate,
                  updatedAt: now,
                }
              : task,
          ),
        }
      })
    },
    [mutate],
  )

  const removeTask = useCallback(
    async (id: string) => {
      await mutate((v) => ({
        ...v,
        tasks: v.tasks.filter((t) => t.id !== id),
      }))
    },
    [mutate],
  )

  const setTaskColor = useCallback(
    async (taskId: string, colorKey: TaskColorKey) => {
      await mutate((v) => ({
        ...v,
        tasks: v.tasks.map((t) =>
          t.id === taskId ? { ...t, colorKey, updatedAt: new Date().toISOString() } : t,
        ),
      }))
    },
    [mutate],
  )

  const setTaskGroup = useCallback(
    async (taskId: string, groupId: string) => {
      await mutate((v) => {
        if (!v.groups.some((g) => g.id === groupId)) return v
        return {
          ...v,
          tasks: v.tasks.map((t) =>
            t.id === taskId ? { ...t, groupId, updatedAt: new Date().toISOString() } : t,
          ),
        }
      })
    },
    [mutate],
  )

  const addChecklistItem = useCallback(
    async (taskId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      await mutate((v) => {
        const now = new Date().toISOString()
        const sub = {
          id: newId(),
          title: trimmed,
          done: false,
          createdAt: now,
          updatedAt: now,
        }
        return {
          ...v,
          tasks: v.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  updatedAt: now,
                  checklist: [sub, ...t.checklist],
                }
              : t,
          ),
        }
      })
    },
    [mutate],
  )

  const toggleChecklistItem = useCallback(
    async (taskId: string, itemId: string) => {
      await mutate((v) => {
        const now = new Date().toISOString()
        return {
          ...v,
          tasks: v.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  updatedAt: now,
                  checklist: t.checklist.map((s) =>
                    s.id === itemId ? { ...s, done: !s.done, updatedAt: now } : s,
                  ),
                }
              : t,
          ),
        }
      })
    },
    [mutate],
  )

  const removeChecklistItem = useCallback(
    async (taskId: string, itemId: string) => {
      await mutate((v) => ({
        ...v,
        tasks: v.tasks.map((t) =>
          t.id === taskId
            ? { ...t, checklist: t.checklist.filter((s) => s.id !== itemId) }
            : t,
        ),
      }))
    },
    [mutate],
  )

  const addGroup = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      await mutate((v) => {
        const maxOrder = v.groups.reduce((m, g) => Math.max(m, g.sortOrder), 0)
        const g: TaskGroup = {
          id: newId(),
          name: trimmed,
          sortOrder: maxOrder + 1,
        }
        return { ...v, groups: [...v.groups, g] }
      })
    },
    [mutate],
  )

  const renameGroup = useCallback(
    async (groupId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      await mutate((v) => ({
        ...v,
        groups: v.groups.map((g) => (g.id === groupId ? { ...g, name: trimmed } : g)),
      }))
    },
    [mutate],
  )

  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (groupId === DEFAULT_GROUP_ID) return
      await mutate((v) => ({
        ...v,
        groups: v.groups.filter((g) => g.id !== groupId),
        tasks: v.tasks.map((t) =>
          t.groupId === groupId ? { ...t, groupId: DEFAULT_GROUP_ID } : t,
        ),
      }))
    },
    [mutate],
  )

  const setPriorityLabel = useCallback(
    async (rank: PriorityRank, label: string) => {
      const trimmed = label.trim()
      if (!trimmed) return
      await mutate((v) => ({
        ...v,
        priorityLabels: { ...v.priorityLabels, [rank]: trimmed },
      }))
    },
    [mutate],
  )

  const setTaskPriorityRank = useCallback(
    async (taskId: string, rank: PriorityRank) => {
      await mutate((v) => ({
        ...v,
        tasks: v.tasks.map((t) =>
          t.id === taskId
            ? { ...t, priorityRank: rank, updatedAt: new Date().toISOString() }
            : t,
        ),
      }))
    },
    [mutate],
  )

  const setTaskScheduledLocalDate = useCallback(
    async (taskId: string, date: string | null) => {
      await mutate((v) => ({
        ...v,
        tasks: v.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                scheduledLocalDate: date,
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      }))
    },
    [mutate],
  )

  const setTaskEstimatedMinutes = useCallback(
    async (taskId: string, minutes: number | null) => {
      await mutate((v) => ({
        ...v,
        tasks: v.tasks.map((t) => {
          if (t.id !== taskId) return t
          let est: number | null = null
          if (minutes != null && !Number.isNaN(minutes)) {
            const e = Math.floor(minutes)
            if (e > 0 && e <= 24 * 60) est = e
          }
          return { ...t, estimatedMinutes: est, updatedAt: new Date().toISOString() }
        }),
      }))
    },
    [mutate],
  )

  const setTaskTimePlan = useCallback(
    async (taskId: string, mode: TaskTimeMode, minutesFromMidnight: number | null) => {
      await mutate((v) => ({
        ...v,
        tasks: v.tasks.map((t) => {
          if (t.id !== taskId) return t
          const now = new Date().toISOString()
          if (mode === 'none') {
            return {
              ...t,
              timeMode: 'none' as const,
              timeMinutesFromMidnight: null,
              updatedAt: now,
            }
          }
          const m =
            minutesFromMidnight != null &&
            !Number.isNaN(minutesFromMidnight) &&
            minutesFromMidnight >= 0 &&
            minutesFromMidnight <= 1439
              ? Math.floor(minutesFromMidnight)
              : null
          return {
            ...t,
            timeMode: mode,
            timeMinutesFromMidnight: m,
            updatedAt: now,
          }
        }),
      }))
    },
    [mutate],
  )

  const patchTask = useCallback(
    async (taskId: string, patch: Partial<Task>) => {
      await mutate((v) => ({
        ...v,
        tasks: v.tasks.map((t) =>
          t.id === taskId
            ? { ...t, ...patch, updatedAt: new Date().toISOString() }
            : t,
        ),
      }))
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
