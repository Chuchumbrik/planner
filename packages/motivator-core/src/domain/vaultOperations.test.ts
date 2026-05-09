import { describe, expect, it } from 'vitest'

import {
  applyCreateTask,
  applyDeleteGroup,
  applyRemoveTask,
  applyRenameGroup,
} from './vaultOperations'
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
})
