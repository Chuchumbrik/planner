import { describe, expect, it } from 'vitest'
import { decideReminder, isWeekend, type ReminderConfig } from './releaseCadence'

const THU = new Date('2026-06-04T12:00:00Z') // будний
const SAT = new Date('2026-06-06T12:00:00Z') // выходной

const base: ReminderConfig = { thresholdHours: 24, respectWeekends: true, snoozedUntil: null, paused: false }

describe('isWeekend', () => {
  it('сб/вс по UTC', () => {
    expect(isWeekend(SAT)).toBe(true)
    expect(isWeekend(THU)).toBe(false)
  })
})

describe('decideReminder', () => {
  it('свежий релиз в пределах порога — нет баннера', () => {
    expect(decideReminder('2026-06-03', THU, base)).toMatchObject({ severity: 'none', reason: 'fresh' })
  })

  it('просрочка 2 дня (порог 24ч) — янтарный', () => {
    expect(decideReminder('2026-06-02', THU, base)).toMatchObject({ severity: 'amber', reason: 'overdue', daysSince: 2 })
  })

  it('просрочка ≥3 дней — красный', () => {
    expect(decideReminder('2026-05-31', THU, base)).toMatchObject({ severity: 'red', reason: 'overdue', daysSince: 4 })
  })

  it('порог 48ч смещает границу', () => {
    expect(decideReminder('2026-06-02', THU, { ...base, thresholdHours: 48 })).toMatchObject({ reason: 'fresh' })
    expect(decideReminder('2026-06-01', THU, { ...base, thresholdHours: 48 })).toMatchObject({ severity: 'red', reason: 'overdue' })
  })

  it('snooze на сегодня гасит баннер, на вчера — нет', () => {
    expect(decideReminder('2026-05-31', THU, { ...base, snoozedUntil: '2026-06-04' })).toMatchObject({ reason: 'snoozed' })
    expect(decideReminder('2026-05-31', THU, { ...base, snoozedUntil: '2026-06-03' })).toMatchObject({ reason: 'overdue' })
  })

  it('weekend-skip: в выходной гасит, при respectWeekends=false — нет', () => {
    expect(decideReminder('2026-05-31', SAT, base)).toMatchObject({ reason: 'weekend', severity: 'none' })
    expect(decideReminder('2026-05-31', SAT, { ...base, respectWeekends: false })).toMatchObject({ reason: 'overdue' })
  })

  it('paused гасит баннер раньше всего', () => {
    expect(decideReminder('2026-05-31', THU, { ...base, paused: true })).toMatchObject({ severity: 'none', reason: 'paused' })
  })
})
