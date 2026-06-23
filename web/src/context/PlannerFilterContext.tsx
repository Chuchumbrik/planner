import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { PRIORITY_RANKS, type PriorityRank, type TaskColorKey } from '@motivator/core'

/**
 * Состояние фильтров планировщика (Phase 13, BR-D-011).
 * Делает фильтры доступными и тулбару `/app`, и постоянной левой панели «Categories».
 * Форма 1:1 с прежним локальным состоянием AppPage, чтобы перенос был эквивалентным.
 */
export type RepeatFilterMode = 'all' | 'recurring' | 'nonRecurring'

export type PlannerFilterState = {
  filterGroupId: string | 'all'
  filterColor: TaskColorKey | 'all'
  filterRepeats: RepeatFilterMode
  priorityEnabled: Set<PriorityRank>
  /** true, если хоть один фильтр отличается от значения «по умолчанию». */
  filtersActive: boolean
}

export type PlannerFilterActions = {
  setFilterGroupId: (id: string | 'all') => void
  setFilterColor: (key: TaskColorKey | 'all') => void
  setFilterRepeats: (mode: RepeatFilterMode) => void
  togglePriority: (rank: PriorityRank) => void
  setPriorityEnabled: (next: Set<PriorityRank>) => void
  resetAllFilters: () => void
}

export type PlannerFilterContextValue = PlannerFilterState & PlannerFilterActions

const PlannerFilterContext = createContext<PlannerFilterContextValue | null>(null)

function allPriorities(): Set<PriorityRank> {
  return new Set<PriorityRank>(PRIORITY_RANKS)
}

export function PlannerFilterProvider({ children }: { children: ReactNode }) {
  const [filterGroupId, setFilterGroupId] = useState<string | 'all'>('all')
  const [filterColor, setFilterColor] = useState<TaskColorKey | 'all'>('all')
  const [filterRepeats, setFilterRepeats] = useState<RepeatFilterMode>('all')
  const [priorityEnabled, setPriorityEnabled] = useState<Set<PriorityRank>>(allPriorities)

  const togglePriority = useCallback((rank: PriorityRank) => {
    setPriorityEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(rank)) next.delete(rank)
      else next.add(rank)
      return next
    })
  }, [])

  const resetAllFilters = useCallback(() => {
    setFilterGroupId('all')
    setFilterColor('all')
    setFilterRepeats('all')
    setPriorityEnabled(allPriorities())
  }, [])

  const filtersActive =
    filterGroupId !== 'all' ||
    filterColor !== 'all' ||
    filterRepeats !== 'all' ||
    priorityEnabled.size !== PRIORITY_RANKS.length

  const value = useMemo<PlannerFilterContextValue>(
    () => ({
      filterGroupId,
      filterColor,
      filterRepeats,
      priorityEnabled,
      filtersActive,
      setFilterGroupId,
      setFilterColor,
      setFilterRepeats,
      togglePriority,
      setPriorityEnabled,
      resetAllFilters,
    }),
    [
      filterGroupId,
      filterColor,
      filterRepeats,
      priorityEnabled,
      filtersActive,
      togglePriority,
      resetAllFilters,
    ],
  )

  return <PlannerFilterContext.Provider value={value}>{children}</PlannerFilterContext.Provider>
}

export function usePlannerFilter(): PlannerFilterContextValue {
  const ctx = useContext(PlannerFilterContext)
  if (!ctx) throw new Error('usePlannerFilter must be used within <PlannerFilterProvider>')
  return ctx
}
