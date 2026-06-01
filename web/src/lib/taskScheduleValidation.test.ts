import { afterEach, describe, expect, it, vi } from 'vitest'

// Контролируем «сегодня» и «сейчас» через мок appNow.
const todayKey = '2026-06-01'
let appNow = new Date('2026-06-01T12:00:00')

vi.mock('@/lib/appNow', () => ({
  appLocalDateKey: () => todayKey,
  getAppNow: () => appNow,
}))

import {
  computeRecurrenceAnchorPastError,
  computeTaskScheduleValidationError,
  type TaskScheduleValidationFields,
} from './taskScheduleValidation'

const t = ((key: string) => key) as unknown as Parameters<typeof computeTaskScheduleValidationError>[1]

function fields(overrides: Partial<TaskScheduleValidationFields> = {}): TaskScheduleValidationFields {
  return {
    backlogOnly: false,
    scheduledLocalDate: '2026-06-02',
    timeMode: 'none',
    timeClock: '',
    estimatedHours: '',
    estimatedMinutesPart: '',
    plannedWithEstimateRequired: true,
    ...overrides,
  }
}

afterEach(() => {
  appNow = new Date('2026-06-01T12:00:00')
})

describe('computeTaskScheduleValidationError', () => {
  // TS-055
  it('прошлая дата → app.createTaskPastDate', () => {
    expect(computeTaskScheduleValidationError(fields({ scheduledLocalDate: '2026-05-31' }), t)).toBe(
      'app.createTaskPastDate',
    )
  })

  // TS-056
  it('backlogOnly=true → null', () => {
    expect(
      computeTaskScheduleValidationError(fields({ backlogOnly: true, scheduledLocalDate: '2026-05-31' }), t),
    ).toBeNull()
  })

  // TS-057
  it('start + оценка выходит за сутки → app.createTaskEstimateExceedsDay', () => {
    expect(
      computeTaskScheduleValidationError(
        fields({
          scheduledLocalDate: '2026-06-02',
          timeMode: 'start',
          timeClock: '23:00',
          estimatedHours: '1',
          estimatedMinutesPart: '30',
        }),
        t,
      ),
    ).toBe('app.createTaskEstimateExceedsDay')
  })

  // TS-058
  it('end-time < оценки → app.createTaskEstimateExceedsDayEnd', () => {
    expect(
      computeTaskScheduleValidationError(
        fields({
          scheduledLocalDate: '2026-06-02',
          timeMode: 'end',
          timeClock: '00:30',
          estimatedHours: '1',
          estimatedMinutesPart: '0',
        }),
        t,
      ),
    ).toBe('app.createTaskEstimateExceedsDayEnd')
  })

  // TS-059
  it('start сегодня в прошлом → app.createTaskPastClockToday', () => {
    // now = 12:00, clock = 08:00 < now
    expect(
      computeTaskScheduleValidationError(
        fields({ scheduledLocalDate: todayKey, timeMode: 'start', timeClock: '08:00' }),
        t,
      ),
    ).toBe('app.createTaskPastClockToday')
  })
})

describe('computeRecurrenceAnchorPastError', () => {
  // TS-060
  it('якорь в прошлом + hasRecurrence → app.recurrenceAnchorPast', () => {
    expect(computeRecurrenceAnchorPastError('2026-05-31', true, t)).toBe('app.recurrenceAnchorPast')
  })

  // TS-061
  it('hasRecurrence=false → null', () => {
    expect(computeRecurrenceAnchorPastError('2026-05-31', false, t)).toBeNull()
  })
})
