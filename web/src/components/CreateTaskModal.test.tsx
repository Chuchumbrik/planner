import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TaskGroup } from '@motivator/core'

// «Сейчас» сильно раньше слота и в прошлом дне, чтобы floor по текущему времени не перетёр префилл.
vi.mock('@/lib/appNow', () => ({
  getAppNow: () => new Date('2026-06-20T08:00:00'),
  appLocalDateKey: () => '2026-06-20',
}))

import { CreateTaskModal } from './CreateTaskModal'

const groups: TaskGroup[] = [{ id: 'grp_default', name: 'Общее', sortOrder: 0, colorKey: 'zinc' }]

function baseProps() {
  return {
    open: true,
    selectedDayKey: '2026-06-27', // будущее → дата не клампится, время не флорится
    resumeDraft: null,
    groups,
    priorityLabels: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' },
    defaultGroupId: 'grp_default',
    canEdit: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onPersistDraft: vi.fn(),
  }
}

describe('CreateTaskModal — префилл времени из «+Add» слота (Phase 13)', () => {
  it('initialStartMinutes подставляет время начала в форму', () => {
    const { container } = render(
      <CreateTaskModal {...baseProps()} initialStartMinutes={10 * 60} />,
    )
    expect(container.textContent).toContain('10:00')
  })

  it('без initialStartMinutes время не задано (нет 10:00 по умолчанию)', () => {
    const { container } = render(<CreateTaskModal {...baseProps()} />)
    expect(container.textContent).not.toContain('10:00')
  })
})
