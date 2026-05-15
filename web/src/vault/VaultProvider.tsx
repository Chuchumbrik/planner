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
  applyAutoCompleteEodForElapsedPlannerDays,
  applyCompleteEodForLocalDate,
  applyCreateTask,
  applyDeleteDraft,
  applyDeleteGroup,
  applyExpireStaleDoubleConfirm,
  applyPatchTask,
  applyRemoveChecklistItem,
  applyRemoveTask,
  applySkipTaskOccurrenceForDay,
  applyRenameGroup,
  applySetPriorityLabel,
  applySetTaskColor,
  applySetTaskEstimatedMinutes,
  applySetTaskGroup,
  applySetTaskPriorityRank,
  applySetTaskScheduledLocalDate,
  applySetEodAutoCloseAtDayEnd,
  applySetEodEnabled,
  applySetEodPushReminderMinutes,
  applySetNotificationDeliveryMode,
  applySetTaskTimePlan,
  applyToggleChecklistItem,
  applyToggleTask,
  applyUpsertDraft,
  type VaultDeps,
  decryptUtf8,
  deriveAesKey,
  encryptUtf8,
  localDateKey,
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
  type NotificationDeliveryMode,
  VAULT_JSON_WARN_BYTES,
  VAULT_REMOTE_SAVE_DEBOUNCE_MS,
} from '@motivator/core'
import { createSupabaseVaultRemote } from '@/infrastructure/supabaseVaultRemote'
import i18n from '@/i18n'
import { formatSupabaseFunctionInvokeError } from '@/lib/supabaseFunctionError'
import { ensurePushSubscription, getVapidPublicKey } from '@/lib/notifications/pushSubscription'
import {
  syncNotificationScheduleFromVault,
  upsertPushSubscriptionRow,
} from '@/lib/notifications/syncNotificationSchedule'
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
  /** Повторная загрузка vault с сервера (например после сетевой ошибки). */
  retryRemoteHydrate: () => void
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
  skipTaskOccurrenceForDay: (taskId: string, dateKey: string) => Promise<void>
  setTaskColor: (taskId: string, colorKey: TaskColorKey) => Promise<void>
  setTaskGroup: (taskId: string, groupId: string) => Promise<void>
  addChecklistItem: (taskId: string, title: string) => Promise<void>
  toggleChecklistItem: (taskId: string, itemId: string, contextLocalDateKey: string) => Promise<void>
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
  completeEodForLocalDate: (dateKey: string) => Promise<void>
  setEodEnabled: (enabled: boolean) => Promise<void>
  setEodAutoCloseAtDayEnd: (value: boolean) => Promise<void>
  /** Локальное время напоминания EOD по push (минуты от полуночи) или `null` — выключено. */
  setEodPushReminderMinutes: (minutes: number | null) => Promise<void>
  setNotificationDeliveryMode: (mode: NotificationDeliveryMode) => Promise<void>
  /** Разрешение ОС + подписка Web Push и запись в Supabase; вернуть итог для UI. */
  subscribePushNotifications: () => Promise<'ok' | 'denied' | 'unconfigured' | 'no_sw'>
  /** Тестовый push через Edge Function `notifications-test` (должна быть задеплоена). */
  sendTestPushNotification: () => Promise<void>
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
  const [hydrateNonce, setHydrateNonce] = useState(0)
  const [remoteHydrated, setRemoteHydrated] = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [decryptFailed, setDecryptFailed] = useState(false)
  const versionRef = useRef(1)
  const revisionRef = useRef(0)
  const latestPayloadRef = useRef<VaultPayload | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistChainRef = useRef<Promise<void>>(Promise.resolve())
  const notifSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    while (true) {
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
          let remoteReady = false
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
            remoteReady = true
          } catch (e) {
            if (!cancelled) {
              setRemoteError(e instanceof Error ? e.message : String(e))
            }
          }
          if (!cancelled) setRemoteHydrated(remoteReady)
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
          // Не помечаем гидрацию завершённой: иначе можно редактировать локальный vault без успешной загрузки/создания строки на сервере (#46).
          setRemoteHydrated(false)
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
  }, [cryptoKey, session, vaultRemote, hydrateNonce])

  const retryRemoteHydrate = useCallback(() => {
    setHydrateNonce((n) => n + 1)
  }, [])

  const mutate = useCallback(
    async (fn: (v: VaultPayload) => VaultPayload) => {
      if (!remoteHydrated) return
      await pushVault(fn(vault))
    },
    [pushVault, remoteHydrated, vault],
  )

  /** DR-004: периодически снимать просроченное ожидание второго подтверждения. */
  useEffect(() => {
    if (!unlocked || !remoteHydrated) return

    const runExpire = () => {
      const base = latestPayloadRef.current
      if (!base) return
      const next = applyExpireStaleDoubleConfirm(base, vaultDepsDefault)
      if (next !== base) void pushVault(next)
    }

    const id = window.setInterval(runExpire, 50_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') runExpire()
    }
    document.addEventListener('visibilitychange', onVis)
    runExpire()

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [unlocked, remoteHydrated, pushVault])

  /** Синхронизация открытого расписания push в Supabase после изменений vault (debounce). */
  useEffect(() => {
    if (!remoteHydrated || decryptFailed || !session?.user?.id || !supabase) return

    if (notifSyncTimerRef.current) clearTimeout(notifSyncTimerRef.current)
    const uid = session.user.id
    const locale = i18n.language?.startsWith('en') ? 'en' : 'ru'

    notifSyncTimerRef.current = setTimeout(() => {
      notifSyncTimerRef.current = null
      const v = latestPayloadRef.current
      if (!v) return
      const mode = v.notificationPreferences?.deliveryMode ?? 'off'
      if (!supabase) return
      void syncNotificationScheduleFromVault(supabase, uid, v, mode, locale).catch((e) =>
        console.warn('[notification schedule sync]', e),
      )
    }, 1600)

    return () => {
      if (notifSyncTimerRef.current) clearTimeout(notifSyncTimerRef.current)
    }
  }, [remoteHydrated, decryptFailed, session, supabase, vault, i18n.language])

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

  const skipTaskOccurrenceForDay = useCallback(
    async (taskId: string, dateKey: string) => {
      await mutate((v) => applySkipTaskOccurrenceForDay(v, taskId, dateKey, vaultDepsDefault))
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
    async (taskId: string, itemId: string, contextLocalDateKey: string) => {
      await mutate((v) =>
        applyToggleChecklistItem(v, taskId, itemId, vaultDepsDefault, contextLocalDateKey),
      )
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

  const completeEodForLocalDate = useCallback(
    async (dateKey: string) => {
      await mutate((v) => applyCompleteEodForLocalDate(v, dateKey))
    },
    [mutate],
  )

  const setEodEnabled = useCallback(
    async (enabled: boolean) => {
      await mutate((v) => applySetEodEnabled(v, enabled))
    },
    [mutate],
  )

  const setEodAutoCloseAtDayEnd = useCallback(
    async (value: boolean) => {
      await mutate((v) => {
        let n = applySetEodAutoCloseAtDayEnd(v, value)
        if (value && n.eodPreferences?.enabled !== false) {
          n = applyAutoCompleteEodForElapsedPlannerDays(n, localDateKey())
        }
        return n
      })
    },
    [mutate],
  )

  const setEodPushReminderMinutes = useCallback(
    async (minutes: number | null) => {
      await mutate((v) => applySetEodPushReminderMinutes(v, minutes))
    },
    [mutate],
  )

  const setNotificationDeliveryMode = useCallback(
    async (mode: NotificationDeliveryMode) => {
      await mutate((v) => applySetNotificationDeliveryMode(v, mode))
    },
    [mutate],
  )

  const subscribePushNotifications = useCallback(async (): Promise<
    'ok' | 'denied' | 'unconfigured' | 'no_sw'
  > => {
    if (!supabase || !session?.user?.id) return 'unconfigured'
    if (!getVapidPublicKey()) return 'unconfigured'
    const reg = await navigator.serviceWorker?.getRegistration()
    if (!reg?.active) return 'no_sw'
    const sub = await ensurePushSubscription()
    if (!sub) return 'denied'
    await upsertPushSubscriptionRow(supabase, session.user.id, sub)
    return 'ok'
  }, [session, supabase])

  const sendTestPushNotification = useCallback(async () => {
    if (!supabase) throw new Error('Supabase is not configured')
    const { error } = await supabase.functions.invoke('notifications-test', {
      body: { locale: i18n.language?.startsWith('en') ? 'en' : 'ru' },
    })
    if (error) throw new Error(await formatSupabaseFunctionInvokeError(error))
  }, [supabase, i18n.language])

  /** EOD: автоматически добавить прошлые дни с планом в `eodCompletedLocalDates`, если включено в настройках. */
  useEffect(() => {
    if (!unlocked || !remoteHydrated) return

    const runAuto = () => {
      const base = latestPayloadRef.current
      if (!base) return
      const today = localDateKey()
      const next = applyAutoCompleteEodForElapsedPlannerDays(base, today)
      if (next !== base) void pushVault(next)
    }

    const id = window.setInterval(runAuto, 60_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') runAuto()
    }
    document.addEventListener('visibilitychange', onVis)
    runAuto()

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [unlocked, remoteHydrated, pushVault])

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
      retryRemoteHydrate,
      saveSeed,
      lock,
      createTask,
      addTask,
      upsertDraft,
      deleteDraft,
      toggleTask,
      removeTask,
      skipTaskOccurrenceForDay,
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
      completeEodForLocalDate,
      setEodEnabled,
      setEodAutoCloseAtDayEnd,
      setEodPushReminderMinutes,
      setNotificationDeliveryMode,
      subscribePushNotifications,
      sendTestPushNotification,
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
      retryRemoteHydrate,
      saveSeed,
      lock,
      createTask,
      addTask,
      upsertDraft,
      deleteDraft,
      toggleTask,
      removeTask,
      skipTaskOccurrenceForDay,
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
      completeEodForLocalDate,
      setEodEnabled,
      setEodAutoCloseAtDayEnd,
      setEodPushReminderMinutes,
      setNotificationDeliveryMode,
      subscribePushNotifications,
      sendTestPushNotification,
    ],
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault вне VaultProvider')
  return ctx
}
