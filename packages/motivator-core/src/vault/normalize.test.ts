import { describe, expect, it } from 'vitest'

import { normalizeVault } from './normalize'
import { emptyVault, type VaultPayload } from './types'

describe('normalizeVault', () => {
  it('идемпотентен для emptyVault()', () => {
    const v = emptyVault()
    const once = normalizeVault(v as unknown)
    const twice = normalizeVault(once as unknown)
    expect(twice).toEqual(once)
    expect(once.schemaVersion).toBe(9)
  })

  it('мигрирует V8→V9: проставляет цвет группам (backfill по sortOrder, сохраняет валидный)', () => {
    const v8 = {
      schemaVersion: 8,
      priorityLabels: { 1: 'У1', 2: 'У2', 3: 'У3', 4: 'У4', 5: 'У5' },
      groups: [
        { id: 'grp_default', name: 'Общее', sortOrder: 0 }, // без цвета → backfill
        { id: 'g2', name: 'Работа', sortOrder: 1, colorKey: 'sky' }, // валидный → сохранить
      ],
      tasks: [],
      drafts: [],
      eodCompletedLocalDates: [],
      eodPreferences: { enabled: true, autoCloseAtDayEnd: false },
      notificationPreferences: { deliveryMode: 'off' },
    }
    const out = normalizeVault(v8 as unknown)
    expect(out.schemaVersion).toBe(9)
    expect(out.groups[0]?.colorKey).toBe('zinc') // groupColorForSortOrder(0)
    expect(out.groups[1]?.colorKey).toBe('sky') // существующий валидный сохранён
  })

  it('принимает сериализованный JSON и возвращает тот же нормализованный снимок', () => {
    const v = emptyVault()
    const json = JSON.stringify(v)
    const parsed = JSON.parse(json) as unknown
    expect(normalizeVault(parsed)).toEqual(normalizeVault(v as unknown))
  })

  it('сохраняет задачи после round-trip через JSON', () => {
    const base = emptyVault()
    const withTask: VaultPayload = {
      ...base,
      tasks: [
        {
          id: 't1',
          title: 'A',
          done: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          groupId: base.groups[0]!.id,
          colorKey: 'zinc',
          checklist: [],
          priorityRank: 3,
          scheduledLocalDate: null,
          estimatedMinutes: null,
          timeMode: 'none',
          timeMinutesFromMidnight: null,
          recurrence: null,
          recurrenceAnchorLocalDate: null,
          completedOccurrenceLocalDates: [],
        },
      ],
    }
    const round = normalizeVault(JSON.parse(JSON.stringify(withTask)) as unknown)
    expect(round.tasks).toHaveLength(1)
    expect(round.tasks[0]?.title).toBe('A')
  })
})
