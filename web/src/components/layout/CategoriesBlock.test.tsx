import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { TaskGroup } from '@motivator/core'

import { CategoriesBlock } from './CategoriesBlock'
import { PlannerFilterProvider } from '@/context/PlannerFilterContext'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ru' } }),
}))

const groups: TaskGroup[] = [
  { id: 'grp_default', name: 'Общее', sortOrder: 0, colorKey: 'zinc' },
  { id: 'g2', name: 'Работа', sortOrder: 1, colorKey: 'sky' },
]

function renderBlock(node: ReactNode) {
  return render(<PlannerFilterProvider>{node}</PlannerFilterProvider>)
}

describe('CategoriesBlock', () => {
  it('рендерит «все группы» + каждую группу, по умолчанию активны «все»', () => {
    renderBlock(<CategoriesBlock groups={groups} />)
    expect(screen.getByRole('button', { name: 'app.filterAllGroups' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Работа' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('клик по группе делает её активной, повторный клик сбрасывает в «все»', () => {
    renderBlock(<CategoriesBlock groups={groups} />)
    const work = screen.getByRole('button', { name: 'Работа' })
    fireEvent.click(work)
    expect(work).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'app.filterAllGroups' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    fireEvent.click(work)
    expect(work).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'app.filterAllGroups' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('группы упорядочены по sortOrder', () => {
    renderBlock(
      <CategoriesBlock
        groups={[
          { id: 'b', name: 'Б', sortOrder: 2, colorKey: 'red' },
          { id: 'a', name: 'А', sortOrder: 1, colorKey: 'sky' },
        ]}
      />,
    )
    const labels = screen.getAllByRole('button').map((b) => b.textContent)
    // первый — «все группы», затем А (sortOrder 1), затем Б (sortOrder 2)
    expect(labels.indexOf('А')).toBeLessThan(labels.indexOf('Б'))
  })
})
