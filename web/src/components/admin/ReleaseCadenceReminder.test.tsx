import { render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReleaseCadenceReminder } from './ReleaseCadenceReminder'
import { decideReminder } from '@/lib/releaseCadence'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

vi.mock('@/lib/releaseCadence', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/releaseCadence')>()
  return { ...actual, decideReminder: vi.fn() }
})

const mockDecide = vi.mocked(decideReminder)

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('ReleaseCadenceReminder', () => {
  it('amber-просрочка: баннер + snooze пишет localStorage', () => {
    mockDecide.mockReturnValue({ severity: 'amber', daysSince: 2, reason: 'overdue' })
    render(<ReleaseCadenceReminder />)
    expect(screen.getByText('settings.roadmapReminderAmber')).toBeInTheDocument()
    fireEvent.click(screen.getByText('settings.roadmapReminderSnooze'))
    expect(localStorage.getItem('adminRoadmapReminderSnoozedUntil')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('red-просрочка: красное сообщение', () => {
    mockDecide.mockReturnValue({ severity: 'red', daysSince: 5, reason: 'overdue' })
    render(<ReleaseCadenceReminder />)
    expect(screen.getByText('settings.roadmapReminderRed')).toBeInTheDocument()
  })

  it('paused: показывает muted-заметку, не баннер', () => {
    mockDecide.mockReturnValue({ severity: 'none', daysSince: 9, reason: 'paused' })
    render(<ReleaseCadenceReminder />)
    expect(screen.getByText('settings.roadmapReminderPaused')).toBeInTheDocument()
    expect(screen.queryByText('settings.roadmapReminderSnooze')).not.toBeInTheDocument()
  })

  it('свежий/snoozed/weekend (none): ничего не рендерит', () => {
    mockDecide.mockReturnValue({ severity: 'none', daysSince: 0, reason: 'fresh' })
    const { container } = render(<ReleaseCadenceReminder />)
    expect(container).toBeEmptyDOMElement()
  })

  it('смена порога пишет localStorage', () => {
    mockDecide.mockReturnValue({ severity: 'amber', daysSince: 2, reason: 'overdue' })
    render(<ReleaseCadenceReminder />)
    fireEvent.change(screen.getByLabelText('settings.roadmapReminderThreshold'), { target: { value: '72' } })
    expect(localStorage.getItem('adminRoadmapReminderHours')).toBe('72')
  })
})
