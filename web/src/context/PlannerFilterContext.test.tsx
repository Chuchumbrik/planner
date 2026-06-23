import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { PlannerFilterProvider, usePlannerFilter } from './PlannerFilterContext'

function wrapper({ children }: { children: ReactNode }) {
  return <PlannerFilterProvider>{children}</PlannerFilterProvider>
}

describe('PlannerFilterContext', () => {
  it('по умолчанию все фильтры выключены (filtersActive=false)', () => {
    const { result } = renderHook(() => usePlannerFilter(), { wrapper })
    expect(result.current.filterGroupId).toBe('all')
    expect(result.current.filterColor).toBe('all')
    expect(result.current.filterRepeats).toBe('all')
    expect(result.current.priorityEnabled.size).toBe(5)
    expect(result.current.filtersActive).toBe(false)
  })

  it('установка группы → filtersActive=true', () => {
    const { result } = renderHook(() => usePlannerFilter(), { wrapper })
    act(() => result.current.setFilterGroupId('g1'))
    expect(result.current.filterGroupId).toBe('g1')
    expect(result.current.filtersActive).toBe(true)
  })

  it('togglePriority снимает приоритет и активирует фильтр, resetAllFilters возвращает дефолт', () => {
    const { result } = renderHook(() => usePlannerFilter(), { wrapper })
    act(() => result.current.togglePriority(3))
    expect(result.current.priorityEnabled.has(3)).toBe(false)
    expect(result.current.filtersActive).toBe(true)
    act(() => result.current.resetAllFilters())
    expect(result.current.priorityEnabled.size).toBe(5)
    expect(result.current.filtersActive).toBe(false)
  })

  it('usePlannerFilter без провайдера бросает', () => {
    expect(() => renderHook(() => usePlannerFilter())).toThrow(/PlannerFilterProvider/)
  })
})
