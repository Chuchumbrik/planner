import { describe, expect, it } from 'vitest'

import {
  applyAddChecklistItem,
  applyCreateTask,
  applyDeleteGroup,
  applyRemoveTask,
  applyRenameGroup,
  applyToggleChecklistItem,
} from './vaultOperations'
import { localDateKey } from '../lib/localDate'
import { DEFAULT_GROUP_ID, emptyVault } from '../vault/types'

const deps = {
  newId: () => 'fixed-id',
  nowIso: () => '2026-05-09T12:00:00.000Z',
}

describe('vaultOperations', () => {
  it('applyCreateTask добавляет задачу в начало списка', () => {
    const v = emptyVault()
    const next = applyCreateTask(
      v,
      {
        title: '  Hello  ',
        groupId: DEFAULT_GROUP_ID,
        colorKey: 'sky',
        priorityRank: 2,
        scheduledLocalDate: '2026-05-10',
        estimatedMinutes: 30,
        timeMode: 'none',
        timeMinutesFromMidnight: null,
        recurrence: null,
        recurrenceAnchorLocalDate: null,
      },
      deps,
    )
    expect(next.tasks).toHaveLength(1)
    expect(next.tasks[0]?.title).toBe('Hello')
    expect(next.tasks[0]?.id).toBe('fixed-id')
  })

  it('applyRemoveTask удаляет по id', () => {
    const v = applyCreateTask(
      emptyVault(),
      {
        title: 'X',
        groupId: DEFAULT_GROUP_ID,
        colorKey: 'zinc',
        priorityRank: 3,
        scheduledLocalDate: null,
        estimatedMinutes: null,
        timeMode: 'none',
        timeMinutesFromMidnight: null,
        recurrence: null,
        recurrenceAnchorLocalDate: null,
      },
      deps,
    )
    const id = v.tasks[0]!.id
    const cut = applyRemoveTask(v, id)
    expect(cut.tasks).toHaveLength(0)
  })

  it('applyRenameGroup не меняет vault при пустом имени (через домен)', () => {
    const v = emptyVault()
    expect(applyRenameGroup(v, DEFAULT_GROUP_ID, '   ')).toEqual(v)
  })

  it('applyDeleteGroup для grp_default не удаляет группу', () => {
    const v = emptyVault()
    expect(applyDeleteGroup(v, DEFAULT_GROUP_ID)).toEqual(v)
  })

  it('applyToggleChecklistItem не меняет vault, если контекстный день не локальное «сегодня»', () => {
    const v0 = applyCreateTask(
      emptyVault(),
      {
        title: 'C',
        groupId: DEFAULT_GROUP_ID,
        colorKey: 'zinc',
        priorityRank: 3,
        scheduledLocalDate: '2026-05-10',
        estimatedMinutes: 15,
        timeMode: 'none',
        timeMinutesFromMidnight: null,
        recurrence: null,
        recurrenceAnchorLocalDate: null,
      },
      deps,
    )
    const taskId = v0.tasks[0]!.id
    const v1 = applyAddChecklistItem(v0, taskId, 'Шаг', deps)
    const itemId = v1.tasks[0]!.checklist[0]!.id
    const past = '2020-01-01'
    expect(applyToggleChecklistItem(v1, taskId, itemId, deps, past)).toEqual(v1)
    expect(applyToggleChecklistItem(v1, taskId, itemId, deps, undefined)).toEqual(v1)
  })

  it('applyToggleChecklistItem переключает done при контексте равном локальному «сегодня»', () => {
    const v0 = applyCreateTask(
      emptyVault(),
      {
        title: 'D',
        groupId: DEFAULT_GROUP_ID,
        colorKey: 'zinc',
        priorityRank: 3,
        scheduledLocalDate: '2026-05-10',
        estimatedMinutes: 15,
        timeMode: 'none',
        timeMinutesFromMidnight: null,
        recurrence: null,
        recurrenceAnchorLocalDate: null,
      },
      deps,
    )
    const taskId = v0.tasks[0]!.id
    const v1 = applyAddChecklistItem(v0, taskId, 'Шаг', deps)
    const itemId = v1.tasks[0]!.checklist[0]!.id
    const todayKey = localDateKey(new Date(Date.parse(deps.nowIso())))
    const v2 = applyToggleChecklistItem(v1, taskId, itemId, deps, todayKey)
    expect(v2.tasks[0]!.checklist[0]!.done).toBe(true)
  })
})
